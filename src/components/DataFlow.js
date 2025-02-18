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

// 列名映射常量
const COLUMN_MAPPING = {
  SOURCE_SYSTEM: 'Source system',
  SOURCE_EIM_ID: 'Source EIM ID',
  SOURCE_APP_NAME: 'Source Application Name',
  SYS_CODE: 'SYS_CODE',
  SUB_SYS_CODE: 'SUB_SYS_CODE',
  DOWNSTREAM_NAME: 'Downstream Application Name',
  DOWNSTREAM_EIM_ID: 'Downstream EIM ID',
  DOWNSTREAM_INFO: 'Down stream info',
  GBGF: 'GB/GF',
  SOURCE_TABLE_COUNT: 'Source File/Table Count',
  CDP_TABLE_COUNT: 'Total CDP Table Count',
  SHARED_TABLE_COUNT: 'Share to Downstream Table Count'
};

// 安全的数据获取函数
const safeGetValue = (row, columnName, defaultValue = '') => {
  if (!COLUMN_MAPPING[columnName]) {
    console.warn(`Column ${columnName} not found in mapping`);
    return defaultValue;
  }
  
  const value = row[COLUMN_MAPPING[columnName]];
  return value !== undefined && value !== null ? value : defaultValue;
};

// 添加数值转换函数
const safeParseInt = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
};

const DataFlow = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedGbGf, setSelectedGbGf] = useState('ALL');
  const [selectedEimId, setSelectedEimId] = useState('ALL');  
  const [selectedAppName, setSelectedAppName] = useState('ALL');  
  const [viewType, setViewType] = useState('main');
  const [selectedNode, setSelectedNode] = useState(null);
  const [subGraphData, setSubGraphData] = useState(null);
  const chartRef = useRef(null);

  const dataFlowData = useSelector((state) => state.dashboard.dataFlowData);

  // 获取筛选后的选项
  const getFilteredOptions = useMemo(() => {
    if (!dataFlowData?.rawData) {
      return {
        gbgfOptions: ['ALL'],
        eimIdOptions: ['ALL'],
        appNameOptions: ['ALL']
      };
    }

    const gbgfSet = new Set(['ALL']);
    const eimIdSet = new Set(['ALL']);
    const appNameSet = new Set(['ALL']);

    dataFlowData.rawData.forEach(row => {
      const gbgf = safeGetValue(row, 'GBGF');
      const sourceEimId = safeGetValue(row, 'SOURCE_EIM_ID');
      const downstreamEimId = safeGetValue(row, 'DOWNSTREAM_EIM_ID');
      const sourceAppName = safeGetValue(row, 'SOURCE_APP_NAME');
      const downstreamAppName = safeGetValue(row, 'DOWNSTREAM_NAME');

      // 应用GB/GF筛选
      if (selectedGbGf === 'ALL' || (gbgf && gbgf.split(',').map(g => g.trim()).includes(selectedGbGf))) {
        // 应用EIM ID筛选
        if (selectedEimId === 'ALL' || sourceEimId === selectedEimId || downstreamEimId === selectedEimId) {
          // 应用Application Name筛选
          if (selectedAppName === 'ALL' || sourceAppName === selectedAppName || downstreamAppName === selectedAppName) {
            // 添加GB/GF选项
            if (gbgf) {
              gbgf.split(',').forEach(value => {
                const trimmed = value.trim();
                if (trimmed) {
                  gbgfSet.add(trimmed);
                }
              });
            }

            // 添加EIM ID选项
            if (sourceEimId) {
              eimIdSet.add(sourceEimId.trim());
            }
            if (downstreamEimId) {
              eimIdSet.add(downstreamEimId.trim());
            }

            // 添加Application Name选项
            if (sourceAppName) {
              appNameSet.add(sourceAppName.trim());
            }
            if (downstreamAppName) {
              appNameSet.add(downstreamAppName.trim());
            }
          }
        }
      }
    });

    return {
      gbgfOptions: Array.from(gbgfSet).sort(),
      eimIdOptions: Array.from(eimIdSet).sort(),
      appNameOptions: Array.from(appNameSet).sort()
    };
  }, [dataFlowData, selectedGbGf, selectedEimId, selectedAppName]);

  // 更新筛选框的选项
  const { gbgfOptions, eimIdOptions, appNameOptions } = getFilteredOptions;

  const handleGbGfChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedGbGf(newValue);
    // 如果当前选中的EIM ID或Application Name不在筛选后的选项中，重置为ALL
    if (newValue !== 'ALL') {
      if (!eimIdOptions.includes(selectedEimId)) {
        setSelectedEimId('ALL');
      }
      if (!appNameOptions.includes(selectedAppName)) {
        setSelectedAppName('ALL');
      }
    }
    if (viewType === 'detail') {
      setViewType('main');
      setSelectedNode(null);
      setSubGraphData(null);
    }
  }, [eimIdOptions, appNameOptions, selectedEimId, selectedAppName, viewType]);

  const handleEimIdChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedEimId(newValue);
    // 如果当前选中的GB/GF或Application Name不在筛选后的选项中，重置为ALL
    if (newValue !== 'ALL') {
      if (!gbgfOptions.includes(selectedGbGf)) {
        setSelectedGbGf('ALL');
      }
      if (!appNameOptions.includes(selectedAppName)) {
        setSelectedAppName('ALL');
      }
    }
    if (viewType === 'detail') {
      setViewType('main');
      setSelectedNode(null);
      setSubGraphData(null);
    }
  }, [gbgfOptions, appNameOptions, selectedGbGf, selectedAppName, viewType]);

  const handleAppNameChange = useCallback((event) => {
    const newValue = event.target.value;
    setSelectedAppName(newValue);
    // 如果当前选中的GB/GF或EIM ID不在筛选后的选项中，重置为ALL
    if (newValue !== 'ALL') {
      if (!gbgfOptions.includes(selectedGbGf)) {
        setSelectedGbGf('ALL');
      }
      if (!eimIdOptions.includes(selectedEimId)) {
        setSelectedEimId('ALL');
      }
    }
    if (viewType === 'detail') {
      setViewType('main');
      setSelectedNode(null);
      setSubGraphData(null);
    }
  }, [gbgfOptions, eimIdOptions, selectedGbGf, selectedEimId, viewType]);

  const processedData = useMemo(() => {
    if (!dataFlowData?.rawData) {
      console.log('No raw data available');
      return null;
    }

    // 验证数据结构
    if (!Array.isArray(dataFlowData.rawData) || dataFlowData.rawData.length === 0) {
      console.error('Invalid data structure');
      return null;
    }

    // 验证必要的列是否存在
    const firstRow = dataFlowData.rawData[0];
    const requiredColumns = [
      COLUMN_MAPPING.SOURCE_SYSTEM,
      COLUMN_MAPPING.DOWNSTREAM_NAME,
      COLUMN_MAPPING.SOURCE_TABLE_COUNT,
      COLUMN_MAPPING.SHARED_TABLE_COUNT
    ];

    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    if (missingColumns.length > 0) {
      console.error('Missing required columns:', missingColumns);
      return null;
    }

    console.log('Processing data:', dataFlowData.rawData);
    const nodes = [];
    const links = [];
    const sourceSystemMap = new Map();
    const downstreamAppMap = new Map();

    // 设置布局参数
    const containerWidth = 1600;
    const containerHeight = 900;
    const margin = 40;
    const leftX = margin;
    const rightX = containerWidth - margin;
    const centerX = containerWidth / 2;
    const height = containerHeight - 2 * margin;
    const leftWidth = centerX - leftX - 50;  
    const rightWidth = rightX - centerX - 150;  
    const cdpX = centerX + 200;  

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

    // 处理数据
    dataFlowData.rawData.forEach(row => {
      const sourceSystem = safeGetValue(row, 'SOURCE_SYSTEM', 'Unknown');
      const sourceId = safeGetValue(row, 'SOURCE_EIM_ID', 'Unknown');
      const sourceAppName = safeGetValue(row, 'SOURCE_APP_NAME', 'Unknown');
      const sysCode = safeGetValue(row, 'SYS_CODE', 'N/A');
      const subSysCode = safeGetValue(row, 'SUB_SYS_CODE', 'N/A');
      const downstreamName = safeGetValue(row, 'DOWNSTREAM_NAME', 'Unknown');
      const downstreamId = safeGetValue(row, 'DOWNSTREAM_EIM_ID', 'Unknown');
      const downstreamInfo = safeGetValue(row, 'DOWNSTREAM_INFO', 'N/A');  
      const gbgf = safeGetValue(row, 'GBGF', '');

      // 应用筛选条件
      if (selectedGbGf !== 'ALL' && gbgf) {
        const gbgfValues = gbgf.replace(/"/g, '').split(',').map(g => g.trim());
        if (!gbgfValues.includes(selectedGbGf)) {
          return;
        }
      }

      if (selectedEimId !== 'ALL') {
        if (sourceId !== selectedEimId && downstreamId !== selectedEimId) {
          return;
        }
      }

      if (selectedAppName !== 'ALL') {
        if (sourceAppName !== selectedAppName && downstreamName !== selectedAppName) {
          return;
        }
      }

      const sourceTableCount = safeParseInt(safeGetValue(row, 'SOURCE_TABLE_COUNT'));
      const cdpTableCount = safeParseInt(safeGetValue(row, 'CDP_TABLE_COUNT'));
      const sharedTableCount = safeParseInt(safeGetValue(row, 'SHARED_TABLE_COUNT'));

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
      
      sourceSystemNode.tables += sourceTableCount;
      sourceSystemNode.cdpTables += cdpTableCount;

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

      let downstreamApp = downstreamAppMap.get(downstreamName);
      if (!downstreamApp) {
        downstreamApp = {
          id: downstreamName,  
          name: downstreamName,
          tables: 0,
          type: 'downstream',
          details: new Map(),
          eimId: downstreamId,  
          info: downstreamInfo  
        };
        downstreamAppMap.set(downstreamName, downstreamApp);
      } else if (downstreamId !== downstreamApp.eimId) {
        // 如果发现同一个Application Name有不同的EIM ID，使用警告提示
        console.warn(`Multiple EIM IDs found for ${downstreamName}: ${downstreamApp.eimId}, ${downstreamId}`);
      }
      
      downstreamApp.tables += sharedTableCount;

      const detailKey = `${sourceId}_${downstreamId}`;  
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

    const sortedSourceSystems = Array.from(sourceSystemMap.values())
      .sort((a, b) => b.tables - a.tables);  
    
    const sortedDownstreamApps = Array.from(downstreamAppMap.values())
      .filter(app => app.tables > 0)  
      .sort((a, b) => b.tables - a.tables);

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

    const maxSourceTables = Math.max(1, ...topSourceSystems.map(sys => sys.tables || 0));
    const maxDownstreamTables = Math.max(1, ...sortedDownstreamApps.map(sys => sys.tables || 0));

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

      if (nodeData.details instanceof Map) {
        const detailsObj = {};
        nodeData.details.forEach((value, key) => {
          detailsObj[key] = value;
        });
        nodeData.details = detailsObj;
      }

      nodes.push(nodeData);

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

    const cdpNode = {
      id: 'CDP',
      name: 'CDP',
      type: 'cdp',
      value: 0,
      symbolSize: 120,
      x: cdpX,  
      y: containerHeight / 2,
      fixed: true,
      symbol: 'circle',
      itemStyle: {
        color: '#1890ff'
      },
      label: {
        show: true,
        position: 'inside',
        formatter: 'CDP',
        fontSize: 16,
        color: '#fff'
      }
    };
    nodes.push(cdpNode);

    sortedDownstreamApps.forEach((node, index) => {
      if (!node.tables || node.tables <= 0) {
        return;
      }

      const pos = getStaggeredPosition(index, sortedDownstreamApps.length, cdpX + 150, rightWidth, margin, height);
      const nodeData = {
        id: node.id,
        name: node.name,
        value: node.tables,
        x: pos.x,
        y: pos.y,
        symbolSize: Math.max(15, Math.sqrt(node.tables / maxDownstreamTables) * 35),
        symbol: 'circle',
        category: 'downstream',
        itemStyle: { color: '#E6A23C' },
        details: node.details,
        eimId: node.eimId,  
        info: node.info,  
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

            const details = data.details ? Object.values(data.details) : [];
            const eimIds = Array.from(data.eimIds || []);
            
            let tooltip = [
              '<div style="font-weight: bold; margin-bottom: 10px;">',
              data.name,
              '</div>',
              '<table style="width:100%; border-collapse: collapse;">',
              '<tr>',
              '<td style="padding: 4px 8px;">Total Tables:</td>',
              `<td style="padding: 4px 8px;">${(data.value || 0).toLocaleString()}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">EIM ID:</td>',
              `<td style="padding: 4px 8px;">${data.eimId || 'N/A'}</td>`,
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

      if (nodeData.details instanceof Map) {
        const detailsObj = {};
        nodeData.details.forEach((value, key) => {
          detailsObj[key] = value;
        });
        nodeData.details = detailsObj;
      }

      nodes.push(nodeData);

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
        { name: 'downstream' },
        { name: 'info' }  
      ],
      sourceSystemMap,
      downstreamAppMap
    };
  }, [dataFlowData, selectedGbGf, selectedEimId, selectedAppName]);

  const handleNodeClick = useCallback((params) => {
    if (params.data.category === 'downstream') {
      const downstreamName = params.data.name;
      if (downstreamName === 'Other Downstream Systems') {
        return; 
      }

      const downstreamApp = processedData.downstreamAppMap.get(downstreamName);
      if (!downstreamApp) {
        console.error('Downstream system not found:', downstreamName);
        return;
      }

      const nodes = [];
      const links = [];
      
      const sourceDetails = Array.from(downstreamApp.details.values())
        .sort((a, b) => (b.tables || 0) - (a.tables || 0));  

      const topSources = sourceDetails.slice(0, 30);
      const otherSources = sourceDetails.slice(30);

      // 添加源系统节点
      topSources.forEach(source => {
        const sourceId = source.sourceSystem || `source_${source.sourceId}`;
        nodes.push({
          id: sourceId,
          name: source.sourceSystem || 'Unknown',
          category: 'source',
          depth: 0,  // 第一列
          value: source.tables || 0,
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
                '<td style="padding: 4px 8px;">Total Tables:</td>',
                `<td style="padding: 4px 8px;">${(source.tables || 0).toLocaleString()}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">Shared Tables:</td>',
                `<td style="padding: 4px 8px;">${(source.sharedTables || 0).toLocaleString()}</td>`,
                '</tr>',
                '</table>'
              ].join('');
            }
          }
        });

        links.push({
          source: sourceId,
          target: 'CDP',
          value: source.sharedTables || 0,
          lineStyle: {
            color: '#67C23A',
            opacity: 0.6,
            curveness: 0.3
          }
        });
      });

      // 添加其他源系统节点
      if (otherSources.length > 0) {
        const otherSourceTotalTables = otherSources.reduce((sum, sys) => sum + (sys.tables || 0), 0);
        const otherSourceSharedTables = otherSources.reduce((sum, sys) => sum + (sys.sharedTables || 0), 0);
        const otherId = 'Other Sources';

        nodes.push({
          id: otherId,
          name: 'Other Sources',
          category: 'source',
          depth: 0,  // 第一列
          value: otherSourceTotalTables,
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
                '<td style="padding: 4px 8px;">Total Tables:</td>',
                `<td style="padding: 4px 8px;">${otherSourceTotalTables.toLocaleString()}</td>`,
                '</tr>',
                '<tr>',
                '<td style="padding: 4px 8px;">Shared Tables:</td>',
                `<td style="padding: 4px 8px;">${otherSourceSharedTables.toLocaleString()}</td>`,
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
                  '<td style="padding: 4px 8px;">Total Tables:</td>',
                  `<td style="padding: 4px 8px;">${(sys.tables || 0).toLocaleString()}</td>`,
                  '</tr>',
                  '<tr>',
                  '<td style="padding: 4px 8px;">Shared Tables:</td>',
                  `<td style="padding: 4px 8px;">${(sys.sharedTables || 0).toLocaleString()}</td>`,
                  '</tr>',
                  '</table>'
                );
              });

              return tooltip.join('');
            }
          }
        });

        links.push({
          source: otherId,
          target: 'CDP',
          value: otherSourceSharedTables,
          lineStyle: {
            color: '#67C23A',
            opacity: 0.6,
            curveness: 0.3
          }
        });
      }

      // 添加CDP节点
      nodes.push({
        id: 'CDP',
        name: 'CDP',
        category: 'cdp',
        depth: 1,  // 第二列
        value: downstreamApp.tables * 2 || 0,
        itemStyle: { color: '#1890ff' },
        label: {
          show: true,
          position: 'inside',
          formatter: 'CDP',
          fontSize: 16,
          color: '#fff'
        }
      });

      // 添加下游节点
      const downstreamId = params.data.name || 'downstream';
      nodes.push({
        id: downstreamId,
        name: params.data.name,
        category: 'downstream',
        depth: 2,  // 第三列
        value: downstreamApp.tables || 0,
        itemStyle: { color: '#E6A23C' },
        tooltip: {
          formatter: () => {
            return [
              '<div style="font-weight: bold; margin-bottom: 10px;">Downstream Application Details</div>',
              '<table style="width:100%; border-collapse: collapse;">',
              '<tr>',
              '<td style="padding: 4px 8px;">Application:</td>',
              `<td style="padding: 4px 8px;">${downstreamApp.name || 'Unknown'}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">EIM ID:</td>',
              `<td style="padding: 4px 8px;">${downstreamApp.eimId || 'Unknown'}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">Total Tables:</td>',
              `<td style="padding: 4px 8px;">${(downstreamApp.tables || 0).toLocaleString()}</td>`,
              '</tr>',
              '</table>'
            ].join('');
          }
        },
        label: {
          show: true,
          position: 'right',
          formatter: params.data.name
        }
      });

      // 添加下游信息节点
      const infoId = `${downstreamId}_info`;
      nodes.push({
        id: infoId,
        name: downstreamApp.info || 'N/A',
        category: 'info',
        depth: 3,  // 第四列
        value: downstreamApp.tables || 0,
        itemStyle: { color: '#909399' },
        tooltip: {
          formatter: () => {
            return [
              '<div style="font-weight: bold; margin-bottom: 10px;">Downstream Info Details</div>',
              '<table style="width:100%; border-collapse: collapse;">',
              '<tr>',
              '<td style="padding: 4px 8px;">Info:</td>',
              `<td style="padding: 4px 8px;">${downstreamApp.info || 'N/A'}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">Associated Application:</td>',
              `<td style="padding: 4px 8px;">${downstreamApp.name || 'Unknown'}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">EIM ID:</td>',
              `<td style="padding: 4px 8px;">${downstreamApp.eimId || 'Unknown'}</td>`,
              '</tr>',
              '</table>'
            ].join('');
          }
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{b}'
        }
      });

      // CDP到下游节点的连接
      links.push({
        source: 'CDP',
        target: downstreamId,
        value: downstreamApp.tables || 0,
        lineStyle: {
          color: '#E6A23C',
          opacity: 0.6,
          curveness: 0.3
        }
      });

      // 下游节点到信息节点的连接
      links.push({
        source: downstreamId,
        target: infoId,
        value: downstreamApp.tables || 0,
        lineStyle: {
          color: '#909399',
          opacity: 0.6,
          curveness: 0.3
        }
      });

      // 设置子图配置
      const subGraphData = {
        title: {
          text: viewType === 'main' ? 'Data Flow Overview' : 'Detailed Data Flow',
          left: 'center',
          textStyle: {
            color: '#333'
          }
        },
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          formatter: (params) => {
            if (params.dataType === 'node') {
              return params.data.tooltip?.formatter?.(params) || 
                     `${params.name}<br/>Tables: ${params.value}`;
            }
            return `Tables: ${params.data.value}`;
          },
          textStyle: {
            color: '#333'
          }
        },
        series: [{
          type: 'sankey',
          emphasis: {
            focus: 'adjacency'
          },
          nodeWidth: 20,
          nodeGap: 12,
          layoutIterations: 32,
          nodeAlign: 'left',
          data: nodes,
          links: links,
          lineStyle: {
            color: 'source',
            opacity: 0.6,
            curveness: 0.5
          },
          levels: [
            {
              depth: 0,
              itemStyle: {
                color: '#67C23A'
              },
              lineStyle: {
                color: 'source',
                opacity: 0.6
              }
            },
            {
              depth: 1,
              itemStyle: {
                color: '#409EFF'
              },
              lineStyle: {
                color: 'source',
                opacity: 0.6
              }
            },
            {
              depth: 2,
              itemStyle: {
                color: '#E6A23C'
              },
              lineStyle: {
                color: 'source',
                opacity: 0.6
              }
            },
            {
              depth: 3,
              itemStyle: {
                color: '#909399'
              },
              lineStyle: {
                color: 'source',
                opacity: 0.6
              }
            }
          ],
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
            fontSize: 12,
            color: '#333'
          }
        }]
      };

      setViewType('detail');
      setSelectedNode(params.data);
      setSubGraphData(subGraphData);
    }
  }, [processedData]);

  const handleBack = useCallback(() => {
    setSelectedNode(null);
    setSubGraphData(null);
  }, []);

  const getOption = useCallback(() => {
    console.log('Generating chart option with data:', processedData);

    if (!processedData) {
      console.log('No processed data available');
      return {};
    }

    if (viewType === 'detail' && subGraphData) {
      return subGraphData;
    }

    // 主图配置（graph类型）
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
        },
        textStyle: {
          color: '#333'
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
          show: true,
          position: 'right',
          color: '#333'
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

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.titleSection}>
          {viewType === 'detail' && (
            <IconButton
              className={classes.backButton}
              onClick={handleBack}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h5" className={classes.title}>
            Data Flow Dashboard
          </Typography>
          <Typography className={classes.subtitle}>
            Visualizing data flow between systems
          </Typography>
        </div>
        <div className={classes.filterSection}>
          <FormControl className={classes.formControl}>
            <InputLabel>GB/GF</InputLabel>
            <Select
              value={selectedGbGf}
              onChange={handleGbGfChange}
            >
              {gbgfOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel>EIM ID</InputLabel>
            <Select
              value={selectedEimId}
              onChange={handleEimIdChange}
            >
              {eimIdOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel>Application Name</InputLabel>
            <Select
              value={selectedAppName}
              onChange={handleAppNameChange}
            >
              {appNameOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
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
