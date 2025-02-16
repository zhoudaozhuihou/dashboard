import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Paper, IconButton, Fade, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { loadDashboardData } from '../services/dataService';
import { dashboardSlice } from '../app/store';

const { setDataFlowData, setError } = dashboardSlice.actions;

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
    backgroundColor: '#1e1e1e',
    minHeight: 'calc(100vh - 64px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  titleSection: {
    flex: 1,
  },
  title: {
    color: '#fff',
    marginBottom: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.875rem',
  },
  filterSection: {
    marginLeft: theme.spacing(2),
  },
  formControl: {
    minWidth: 120,
    marginLeft: theme.spacing(2),
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiInput-root': {
      color: '#fff',
    },
    '& .MuiInput-underline:before': {
      borderBottomColor: 'rgba(255, 255, 255, 0.42)',
    },
    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
      borderBottomColor: 'rgba(255, 255, 255, 0.87)',
    },
  },
  flowContainer: {
    backgroundColor: '#fff',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    height: 'calc(100vh - 200px)',
    minHeight: 600,
    minWidth: '1600px',  
    overflow: 'auto',     
    boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      boxShadow: '0 6px 30px 0 rgba(0, 0, 0, 0.15)',
    },
  },
  backButton: {
    marginRight: theme.spacing(2),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: theme.spacing(1),
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  fullscreenButton: {
    marginLeft: theme.spacing(2),
  },
}));

const DataFlow = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedGbGf, setSelectedGbGf] = useState('all');
  const [viewType, setViewType] = useState('main');
  const [selectedNode, setSelectedNode] = useState(null);
  const [subGraphData, setSubGraphData] = useState(null);
  const chartRef = useRef(null);

  const dataFlowData = useSelector((state) => state.dashboard.dataFlowData);
  
  const processedData = useMemo(() => {
    if (!dataFlowData?.rawData) {
      console.log('No raw data available');
      return null;
    }

    console.log('Processing data:', dataFlowData.rawData);
    const nodes = [];
    const links = [];
    const sourceSystemMap = new Map(); // 按Source system聚合
    const downstreamAppMap = new Map(); // 按Downstream Application Name聚合

    // 设置布局参数
    const containerWidth = 1600;
    const containerHeight = 900;
    const margin = 50;
    const cdpWidth = 200;
    const leftWidth = (containerWidth - cdpWidth - margin * 4) / 2;
    const rightWidth = leftWidth;
    const height = containerHeight - margin * 2;
    const leftX = margin;
    const rightX = containerWidth - rightWidth - margin;
    const centerY = containerHeight / 2;

    // 计算节点的交错布局位置
    const getStaggeredPosition = (index, total, baseX, width, margin, height, padding = 30) => {
      const rows = Math.ceil(Math.sqrt(total * 1.5));
      const cols = Math.ceil(total / rows);
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const cellWidth = (width - padding * 2) / cols;
      const cellHeight = (height - padding * 2) / rows;
      
      const isEvenRow = row % 2 === 0;
      const colOffset = isEvenRow ? 0 : cellWidth / 2;
      
      return {
        x: baseX + padding + col * cellWidth + colOffset,
        y: margin + padding + row * cellHeight + cellHeight / 2
      };
    };

    // 添加数值转换函数
    const safeParseInt = (value) => {
      if (value === null || value === undefined || value === '') {
        return 0;
      }
      const parsed = parseInt(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // 首先计算每个系统的总表数
    dataFlowData.rawData.forEach(row => {
      // 安全地获取字段值，提供默认值
      const sourceSystem = row['Source system'] || 'Unknown';
      const sourceId = row['Source EIM ID'] || 'Unknown';
      const sourceAppName = row['Source Application Name'] || 'Unknown';
      const sysCode = row['SYS_CODE'] || 'N/A';
      const subSysCode = row['SUB_SYS_CODE'] || 'N/A';
      
      // 使用正确的列名'c'来获取Source File/Table Count
      const sourceTableCount = safeParseInt(row['c']);
      const cdpTableCount = safeParseInt(row['Total CDP Table Count']);
      const sharedTableCount = safeParseInt(row['Share to Downstream Table Count']);
      
      const downstreamName = row['Downstream Application Name'] || 'Unknown';
      const downstreamId = row['Downstream EIM ID'] || 'Unknown';
      const gbgf = row['GB/GF'] || '';

      // 处理 GB/GF 字段，移除双引号并正确分割多个值
      if (selectedGbGf !== 'all' && gbgf) {
        const gbgfValues = gbgf.replace(/"/g, '').split(',').map(g => g.trim());
        if (!gbgfValues.includes(selectedGbGf)) {
          return;
        }
      }

      // 更新或创建源系统记录（按Source system聚合）
      let sourceSystemNode = sourceSystemMap.get(sourceSystem);
      if (!sourceSystemNode) {
        sourceSystemNode = {
          id: sourceSystem,
          name: sourceSystem,
          system: sourceSystem,
          tables: 0,
          cdpTables: 0,
          type: 'source',
          details: new Map()
        };
        sourceSystemMap.set(sourceSystem, sourceSystemNode);
      }
      
      // 直接使用sourceTableCount更新tables字段
      sourceSystemNode.tables += sourceTableCount;
      sourceSystemNode.cdpTables += cdpTableCount;

      // 存储源系统详细信息
      if (!sourceSystemNode.details.has(sourceId)) {
        sourceSystemNode.details.set(sourceId, {
          id: sourceId,
          name: sourceAppName,
          system: sourceSystem,
          sysCode: sysCode,
          subSysCode: subSysCode,
          tables: sourceTableCount,
          cdpTables: cdpTableCount,
          gbgf: gbgf
        });
      } else {
        const detail = sourceSystemNode.details.get(sourceId);
        detail.tables += sourceTableCount;
        detail.cdpTables += cdpTableCount;
      }

      // 更新或创建下游系统记录（按Downstream Application Name聚合）
      let downstreamApp = downstreamAppMap.get(downstreamName);
      if (!downstreamApp) {
        downstreamApp = {
          id: downstreamName,  // 使用application name作为ID
          name: downstreamName,
          tables: 0,
          type: 'downstream',
          details: new Map(),
          eimIds: new Set()  // 用于存储关联的EIM IDs
        };
        downstreamAppMap.set(downstreamName, downstreamApp);
      }
      
      // 累加表数量并记录EIM ID
      downstreamApp.tables += sharedTableCount;
      downstreamApp.eimIds.add(downstreamId);

      // 存储下游系统详细信息
      const detailKey = `${sourceId}_${downstreamId}`;  // 使用复合键确保唯一性
      if (!downstreamApp.details.has(detailKey)) {
        downstreamApp.details.set(detailKey, {
          sourceId: sourceId,
          sourceName: sourceAppName,
          sourceSystem: sourceSystem,
          sysCode: sysCode,
          subSysCode: subSysCode,
          sharedTables: sharedTableCount,
          downstreamId: downstreamId
        });
      } else {
        const detail = downstreamApp.details.get(detailKey);
        detail.sharedTables += sharedTableCount;
      }
    });

    console.log('Source Systems:', Array.from(sourceSystemMap.values()));  

    // 对源系统和下游系统按表数量排序
    const sortedSourceSystems = Array.from(sourceSystemMap.values())
      .sort((a, b) => b.tables - a.tables);  
    
    const sortedDownstreamApps = Array.from(downstreamAppMap.values())
      .filter(app => app.tables > 0)  
      .sort((a, b) => b.tables - a.tables);

    // 取前30个源系统，其余合并为"Other Sources"
    const topSourceSystems = sortedSourceSystems.slice(0, 30);
    const otherSourceSystems = sortedSourceSystems.slice(30);
    
    if (otherSourceSystems.length > 0) {
      const otherSourceTables = otherSourceSystems.reduce((sum, sys) => sum + (sys.tables || 0), 0);
      topSourceSystems.push({
        id: 'other_sources',
        name: 'Other Sources',
        system: 'Other Sources',
        tables: otherSourceTables,
        type: 'source',
        otherSystems: otherSourceSystems  
      });
    }

    // 计算最大值用于节点大小和连线宽度的缩放（确保不会出现0）
    const maxSourceTables = Math.max(1, ...topSourceSystems.map(sys => sys.tables || 0));
    const maxDownstreamTables = Math.max(1, ...sortedDownstreamApps.map(sys => sys.tables || 0));

    // 添加源系统节点
    topSourceSystems.forEach((node, index) => {
      const pos = getStaggeredPosition(index, topSourceSystems.length, leftX, leftWidth, margin, height);
      const nodeData = {
        ...node,
        x: pos.x,
        y: pos.y,
        symbol: 'circle',
        symbolSize: Math.max(15, Math.sqrt((node.tables || 0) / maxSourceTables) * 35),
        category: 'source',
        itemStyle: { color: '#67C23A' },
        label: {
          show: true,
          position: 'right',
          formatter: function(params) {
            const data = params.data || {};
            if (data.id === 'other_sources') {
              return [
                '{bold|Other Sources}',
                `Tables: ${(data.tables || 0).toLocaleString()}`
              ].join('\n');
            }
            return [
              `{bold|${data.system || 'Unknown'}}`,
              `Tables: ${(data.tables || 0).toLocaleString()}`
            ].join('\n');
          },
          rich: {
            bold: {
              fontWeight: 'bold',
              fontSize: 12
            }
          }
        },
        tooltip: {
          formatter: function(params) {
            const data = params.data || {};
            if (data.id === 'other_sources') {
              const otherSystems = data.otherSystems || [];
              let tooltip = [
                '<div style="font-weight: bold; margin-bottom: 10px;">Other Source Systems</div>',
                '<table style="width:100%; border-collapse: collapse;">',
                '<tr>',
                '<td style="padding: 4px 8px;">Total Systems:</td>',
                `<td style="padding: 4px 8px;">${otherSystems.length}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">Total Tables:</td>',
                `<td style="padding: 4px 8px;">${(data.tables || 0).toLocaleString()}</td>`,
                '</tr>',
                '</table>',
                '<div style="margin-top: 10px; font-weight: bold;">Included Systems:</div>'
              ];
              
              otherSystems.forEach(sys => {
                tooltip.push(
                  '<table style="width:100%; border-collapse: collapse; margin-top: 5px;">',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Application Name:</td>',
                  `<td style="padding: 4px 8px;">${sys.name || 'Unknown'}</td>`,
                  '</tr>',
                  '<tr>',
                  '<td style="padding: 4px 8px;">EIM ID:</td>',
                  `<td style="padding: 4px 8px;">${sys.id || 'Unknown'}</td>`,
                  '</tr>',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Tables:</td>',
                  `<td style="padding: 4px 8px;">${(sys.tables || 0).toLocaleString()}</td>`,
                  '</tr>',
                  '</table>'
                );
              });
              
              return tooltip.join('');
            }

            const details = data.details ? Object.values(data.details) : [];
            let tooltip = [
              '<div style="font-weight: bold; margin-bottom: 10px;">Source System Details</div>',
              '<table style="width:100%; border-collapse: collapse;">'
            ];

            details.forEach(detail => {
              tooltip.push(
                '<tr>',
                '<td style="padding: 4px 8px;">Application Name:</td>',
                `<td style="padding: 4px 8px;">${detail.name || 'Unknown'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">EIM ID:</td>',
                `<td style="padding: 4px 8px;">${detail.id || 'Unknown'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">System:</td>',
                `<td style="padding: 4px 8px;">${detail.system || 'Unknown'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">SYS Code:</td>',
                `<td style="padding: 4px 8px;">${detail.sysCode || 'N/A'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">SUB SYS Code:</td>',
                `<td style="padding: 4px 8px;">${detail.subSysCode || 'N/A'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">Tables:</td>',
                `<td style="padding: 4px 8px;">${(detail.tables || 0).toLocaleString()}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">CDP Tables:</td>',
                `<td style="padding: 4px 8px;">${(detail.cdpTables || 0).toLocaleString()}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">GB/GF:</td>',
                `<td style="padding: 4px 8px;">${detail.gbgf || 'N/A'}</td>`,
                '</tr>',
                '<tr><td colspan="2" style="border-bottom: 1px solid #eee;"></td></tr>'
              );
            });

            tooltip.push('</table>');
            return tooltip.join('');
          }
        }
      };

      // 将Map对象转换为普通对象
      if (nodeData.details instanceof Map) {
        const detailsObj = {};
        nodeData.details.forEach((value, key) => {
          detailsObj[key] = value;
        });
        nodeData.details = detailsObj;
      }

      nodes.push(nodeData);

      // 只为有表的节点添加连线
      if (node.tables > 0) {
        links.push({
          source: node.id,
          target: 'CDP',
          value: node.tables,
          symbolSize: [4, 8],
          lineStyle: {
            color: '#67C23A',
            opacity: 0.6,
            width: Math.max(1, Math.sqrt(node.tables / maxSourceTables) * 3),
            curveness: 0.3
          }
        });
      }
    });

    // 添加 CDP 节点
    nodes.push({
      id: 'CDP',
      name: 'CDP',
      itemStyle: { color: '#1890ff' },
      x: containerWidth / 2,
      y: centerY,
      symbol: 'circle',
      symbolSize: 60,
      category: 'cdp',
      label: {
        show: true,
        position: 'inside',
        formatter: 'CDP',
        fontSize: 14,
        color: '#fff'
      }
    });

    // 添加下游系统节点（不包含Other节点）
    sortedDownstreamApps.forEach((node, index) => {
      // 只处理有表的节点
      if (!node.tables || node.tables <= 0) {
        return;
      }

      const pos = getStaggeredPosition(index, sortedDownstreamApps.length, rightX, rightWidth, margin, height);
      const nodeData = {
        ...node,
        x: pos.x,
        y: pos.y,
        symbol: 'circle',
        symbolSize: Math.max(15, Math.sqrt(node.tables / maxDownstreamTables) * 35),
        category: 'downstream',
        itemStyle: { color: '#E6A23C' },
        label: {
          show: true,
          position: 'right',
          formatter: function(params) {
            const data = params.data || {};
            if (data.id === 'other_downstream') {
              return [
                '{bold|Other Downstream Systems}',
                `Tables: ${(data.tables || 0).toLocaleString()}`
              ].join('\n');
            }
            return [
              `{bold|${data.name || 'Unknown'}}`,
              `Tables: ${(data.tables || 0).toLocaleString()}`
            ].join('\n');
          },
          rich: {
            bold: {
              fontWeight: 'bold',
              fontSize: 12
            }
          }
        },
        tooltip: {
          formatter: function(params) {
            const data = params.data || {};
            if (data.id === 'other_downstream') {
              const otherSystems = data.otherSystems || [];
              let tooltip = [
                '<div style="font-weight: bold; margin-bottom: 10px;">Other Downstream Systems</div>',
                '<table style="width:100%; border-collapse: collapse;">',
                '<tr>',
                '<td style="padding: 4px 8px;">Total Systems:</td>',
                `<td style="padding: 4px 8px;">${otherSystems.length}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">Total Tables:</td>',
                `<td style="padding: 4px 8px;">${(data.tables || 0).toLocaleString()}</td>`,
                '</tr>',
                '</table>',
                '<div style="margin-top: 10px; font-weight: bold;">Included Systems:</div>'
              ];
              
              otherSystems.forEach(sys => {
                tooltip.push(
                  '<table style="width:100%; border-collapse: collapse; margin-top: 5px;">',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Application:</td>',
                  `<td style="padding: 4px 8px;">${sys.name || 'Unknown'}</td>`,
                  '</tr>',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Total Tables:</td>',
                  `<td style="padding: 4px 8px;">${(sys.tables || 0).toLocaleString()}</td>`,
                  '</tr>',
                  '<tr>',
                  '<td style="padding: 4px 8px;">EIM IDs:</td>',
                  `<td style="padding: 4px 8px;">${Array.from(sys.eimIds || []).join(', ')}</td>`,
                  '</tr>',
                  '</table>'
                );
              });
              
              return tooltip.join('');
            }

            // 获取详细信息
            const details = data.details ? Object.values(data.details) : [];
            const eimIds = Array.from(data.eimIds || []);
            
            let tooltip = [
              '<div style="font-weight: bold; margin-bottom: 10px;">Downstream System Details</div>',
              '<table style="width:100%; border-collapse: collapse;">',
              '<tr>',
              '<td style="padding: 4px 8px;">Application:</td>',
              `<td style="padding: 4px 8px;">${data.name || 'Unknown'}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">Total Tables:</td>',
              `<td style="padding: 4px 8px;">${(data.tables || 0).toLocaleString()}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">EIM IDs:</td>',
              `<td style="padding: 4px 8px;">${eimIds.join(', ')}</td>`,
              '</tr>',
              '</table>'
            ];

            if (details.length > 0) {
              tooltip.push(
                '<div style="margin-top: 10px; font-weight: bold;">Source Systems:</div>'
              );
              
              details.forEach(detail => {
                tooltip.push(
                  '<table style="width:100%; border-collapse: collapse; margin-top: 5px;">',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Source System:</td>',
                  `<td style="padding: 4px 8px;">${detail.sourceSystem || 'Unknown'}</td>`,
                  '</tr>',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Source Application:</td>',
                  `<td style="padding: 4px 8px;">${detail.sourceName || 'Unknown'}</td>`,
                  '</tr>',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Shared Tables:</td>',
                  `<td style="padding: 4px 8px;">${(detail.sharedTables || 0).toLocaleString()}</td>`,
                  '</tr>',
                  '</table>'
                );
              });
            }

            return tooltip.join('');
          }
        }
      };

      // 将Map对象转换为普通对象
      if (nodeData.details instanceof Map) {
        const detailsObj = {};
        nodeData.details.forEach((value, key) => {
          detailsObj[key] = value;
        });
        nodeData.details = detailsObj;
      }

      nodes.push(nodeData);

      // 只为有表的节点添加连线
      if (node.tables > 0) {
        links.push({
          source: 'CDP',
          target: node.id,
          value: node.tables,
          symbolSize: [4, 8],
          lineStyle: {
            color: '#E6A23C',
            opacity: 0.6,
            width: Math.max(1, Math.sqrt(node.tables / maxDownstreamTables) * 3),
            curveness: 0.3
          }
        });
      }
    });

    return {
      nodes,
      links,
      categories: [
        { name: 'source' },
        { name: 'cdp' },
        { name: 'downstream' }
      ],
      sourceSystemMap,
      downstreamAppMap
    };
  }, [dataFlowData, selectedGbGf]);

  const handleNodeClick = useCallback((params) => {
    if (params.data.category === 'downstream') {
      const downstreamName = params.data.name;
      if (downstreamName === 'Other Downstream Systems') {
        return; // 不处理其他下游系统的点击
      }

      const downstreamApp = processedData.downstreamAppMap.get(downstreamName);
      if (!downstreamApp) {
        console.error('Downstream system not found:', downstreamName);
        return;
      }

      const nodes = [];
      const links = [];
      
      // 获取与该下游系统相关的所有源系统详细信息
      const sourceDetails = Array.from(downstreamApp.details.values())
        .sort((a, b) => b.sharedTables - a.sharedTables);

      // 取前30个源系统，其余合并为"Other Sources"
      const topSources = sourceDetails.slice(0, 30);
      const otherSources = sourceDetails.slice(30);

      // 添加源系统节点
      topSources.forEach(source => {
        nodes.push({
          name: source.sourceSystem,
          itemStyle: { color: '#67C23A' },
          tooltip: {
            formatter: () => {
              return [
                '<div style="font-weight: bold; margin-bottom: 10px;">Source System Details</div>',
                '<table style="width:100%; border-collapse: collapse;">',
                '<tr>',
                '<td style="padding: 4px 8px;">System:</td>',
                `<td style="padding: 4px 8px;">${source.sourceSystem || 'Unknown'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">Application:</td>',
                `<td style="padding: 4px 8px;">${source.sourceName || 'Unknown'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">EIM ID:</td>',
                `<td style="padding: 4px 8px;">${source.sourceId || 'Unknown'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">System Code:</td>',
                `<td style="padding: 4px 8px;">${source.sysCode || 'N/A'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">Sub System Code:</td>',
                `<td style="padding: 4px 8px;">${source.subSysCode || 'N/A'}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">Shared Tables:</td>',
                `<td style="padding: 4px 8px;">${source.sharedTables.toLocaleString()}</td>`,
                '</tr>',
                '</table>'
              ].join('');
            }
          }
        });

        // 源系统到 CDP 的链接
        links.push({
          source: source.sourceSystem,
          target: 'CDP',
          value: source.sharedTables
        });
      });

      // 如果有其他源系统，添加 Other Sources 节点
      if (otherSources.length > 0) {
        const otherSourceTables = otherSources.reduce((sum, sys) => sum + sys.sharedTables, 0);

        nodes.push({
          name: 'Other Sources',
          itemStyle: { color: '#67C23A' },
          tooltip: {
            formatter: () => {
              let tooltip = [
                '<div style="font-weight: bold; margin-bottom: 10px;">Other Source Systems</div>',
                '<table style="width:100%; border-collapse: collapse;">',
                '<tr>',
                '<td style="padding: 4px 8px;">Total Systems:</td>',
                `<td style="padding: 4px 8px;">${otherSources.length}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">Total Shared Tables:</td>',
                `<td style="padding: 4px 8px;">${otherSourceTables.toLocaleString()}</td>`,
                '</tr>',
                '</table>',
                '<div style="margin-top: 10px; font-weight: bold;">Included Systems:</div>'
              ];
              
              otherSources.forEach(sys => {
                tooltip.push(
                  '<table style="width:100%; border-collapse: collapse; margin-top: 5px;">',
                  '<tr>',
                  '<td style="padding: 4px 8px;">System:</td>',
                  `<td style="padding: 4px 8px;">${sys.sourceSystem || 'Unknown'}</td>`,
                  '</tr>',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Application:</td>',
                  `<td style="padding: 4px 8px;">${sys.sourceName || 'Unknown'}</td>`,
                  '</tr>',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Shared Tables:</td>',
                  `<td style="padding: 4px 8px;">${sys.sharedTables.toLocaleString()}</td>`,
                  '</tr>',
                  '</table>'
                );
              });

              return tooltip.join('');
            }
          }
        });

        // Other Sources 的链接
        links.push({
          source: 'Other Sources',
          target: 'CDP',
          value: otherSourceTables
        });
      }

      // 添加 CDP 节点
      nodes.push({
        name: 'CDP',
        itemStyle: { color: '#1890ff' }
      });

      // 添加下游系统节点
      nodes.push({
        name: params.data.name,
        itemStyle: { color: '#E6A23C' },
        tooltip: {
          formatter: () => {
            return [
              '<div style="font-weight: bold; margin-bottom: 10px;">Downstream System Details</div>',
              '<table style="width:100%; border-collapse: collapse;">',
              '<tr>',
              '<td style="padding: 4px 8px;">Application:</td>',
              `<td style="padding: 4px 8px;">${downstreamApp.name || 'Unknown'}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">Total Tables:</td>',
              `<td style="padding: 4px 8px;">${downstreamApp.tables.toLocaleString()}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">EIM IDs:</td>',
              `<td style="padding: 4px 8px;">${Array.from(downstreamApp.eimIds).join(', ')}</td>`,
              '</tr>',
              '</table>'
            ].join('');
          }
        }
      });

      // 添加从 CDP 到下游系统的链接
      links.push({
        source: 'CDP',
        target: params.data.name,
        value: downstreamApp.tables
      });

      // 创建子图数据
      const subGraphData = {
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove'
        },
        series: [{
          type: 'sankey',
          emphasis: {
            focus: 'adjacency'
          },
          nodeWidth: 20,
          nodeGap: 12,
          layoutIterations: 32,
          data: nodes,
          links: links,
          lineStyle: {
            color: 'source',
            opacity: 0.6,
            curveness: 0.5
          }
        }]
      };

      setSubGraphData(subGraphData);
      setViewType('detail');
    }
  }, [processedData]);

  const handleBack = useCallback(() => {
    setSelectedNode(null);
    setSubGraphData(null);
  }, []);

  const getOption = useCallback(() => {
    if (!processedData) {
      console.log('No processed data available');
      return {};
    }

    if (viewType === 'detail' && subGraphData) {
      return subGraphData;
    }

    console.log('Generating chart option with data:', processedData);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.dataType === 'node') {
            if (params.data.category === 'background') {
              return '';
            }
            return params.data.tooltip?.formatter?.(params) || 
                   `${params.name}<br/>Tables: ${params.value}`;
          }
          if (params.dataType === 'edge') {
            return `Tables: ${params.data.value}`;
          }
          return '';
        }
      },
      series: [{
        type: 'graph',
        layout: 'none',
        data: processedData.nodes,
        links: processedData.links,
        categories: processedData.categories,
        roam: true,
        draggable: true,
        label: {
          show: true
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4 }
        },
        lineStyle: {
          opacity: 0.6,
          width: 1,
          curveness: 0.3
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: '#fff'
        }
      }]
    };
  }, [processedData, viewType, subGraphData]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading dashboard data...');
        const data = await loadDashboardData();
        console.log('Loaded data:', data);
        dispatch(setDataFlowData(data));
      } catch (error) {
        console.error('Error loading data:', error);
        dispatch(setError(error.message));
      }
    };

    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (chartRef.current && processedData) {
      const chartInstance = chartRef.current.getEchartsInstance();
      const option = getOption();
      console.log('Setting chart option:', option);
      try {
        chartInstance.setOption(option, true);
      } catch (error) {
        console.error('Error setting chart option:', error);
      }
    }
  }, [processedData, getOption]);

  const handleGbGfChange = (event) => {
    setSelectedGbGf(event.target.value);
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.titleSection}>
          {viewType === 'detail' && (
            <IconButton className={classes.backButton} onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" className={classes.title}>
            {viewType === 'detail' ? `${selectedNode?.name} Data Flow` : 'Data Flow'}
          </Typography>
        </div>
        <div className={classes.controls}>
          <FormControl className={classes.formControl}>
            <InputLabel>GB/GF</InputLabel>
            <Select
              value={selectedGbGf}
              onChange={handleGbGfChange}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="WPB">WPB</MenuItem>
              <MenuItem value="WSB">WSB</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>
      <Fade in={true} timeout={500}>
        <Paper className={classes.flowContainer}>
          <ReactECharts
            ref={chartRef}
            option={getOption()}
            style={{ height: '100%', width: '100%' }}
            onEvents={{
              click: handleNodeClick
            }}
          />
        </Paper>
      </Fade>
    </div>
  );
};

export default DataFlow;
