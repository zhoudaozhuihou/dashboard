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
    const sourceMap = new Map();
    const downstreamMap = new Map();
    let maxTableCount = 0;
    let maxCdpTableCount = 0;
    let maxDownstreamTableCount = 0;

    // 首先计算每个下游系统的总表数
    const downstreamTotalTables = new Map();
    dataFlowData.rawData.forEach(row => {
      const downstreamId = row['Downstream EIM ID'];
      const downstreamTables = Number(row['Share to Downstream Table Count']) || 0;
      downstreamTotalTables.set(
        downstreamId,
        (downstreamTotalTables.get(downstreamId) || 0) + downstreamTables
      );
    });

    // 处理所有数据行
    dataFlowData.rawData.forEach(row => {
      const sourceId = row['Source EIM ID'];
      const sourceName = row['Source Application Name'];
      const sourceSystem = row['Source system'];
      const sysCode = row['SYS_CODE'];
      const subSysCode = row['SUB_SYS_CODE'];
      const sourceTableCount = Number(row['Source File/Table Count']) || 0;
      const cdpTableCount = Number(row['Total CDP Table Count']) || 0;
      const downstreamId = row['Downstream EIM ID'];
      const downstreamName = row['Downstream Application Name'];
      const downstreamTableCount = Number(row['Share to Downstream Table Count']) || 0;
      const gbgf = row['GB/GF'];

      // 处理 GB/GF 字段，移除双引号并正确分割多个值
      if (selectedGbGf !== 'all' && gbgf) {
        const gbgfValues = gbgf.replace(/"/g, '').split(',').map(g => g.trim());
        if (!gbgfValues.includes(selectedGbGf)) {
          return;
        }
      }

      // 更新最大值
      maxTableCount = Math.max(maxTableCount, sourceTableCount);
      maxCdpTableCount = Math.max(maxCdpTableCount, cdpTableCount);
      maxDownstreamTableCount = Math.max(maxDownstreamTableCount, downstreamTotalTables.get(downstreamId) || 0);

      // 添加或更新源系统信息
      if (!sourceMap.has(sourceId)) {
        sourceMap.set(sourceId, {
          id: sourceId,
          name: sourceName,
          system: sourceSystem,
          sysCode: sysCode,
          subSysCode: subSysCode,
          tables: sourceTableCount,
          cdpTables: cdpTableCount,
          type: 'source',
          gbgf: gbgf
        });
      }

      // 添加或更新下游系统信息
      if (!downstreamMap.has(downstreamId)) {
        downstreamMap.set(downstreamId, {
          id: downstreamId,
          name: downstreamName,
          tables: downstreamTotalTables.get(downstreamId) || 0,
          type: 'downstream'
        });
      }
    });

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

    // 添加源系统节点
    Array.from(sourceMap.values()).forEach((node, index) => {
      const pos = getStaggeredPosition(index, sourceMap.size, leftX, leftWidth, margin, height);
      nodes.push({
        id: node.id,
        name: node.system,
        value: node.tables,
        itemStyle: {
          color: '#67C23A'
        },
        x: pos.x,
        y: pos.y,
        symbol: 'circle',
        symbolSize: Math.max(15, Math.sqrt(node.tables / maxTableCount) * 35),
        category: 'source',
        label: {
          show: true,
          position: 'right',
          distance: 5,
          fontSize: 10,
          formatter: function(params) {
            return [
              '{bold|' + node.system + '}',
              node.sysCode,
              'Tables: ' + node.tables.toLocaleString()
            ].join('\n');
          },
          rich: {
            bold: {
              fontWeight: 'bold',
              fontSize: 10
            }
          }
        },
        tooltip: {
          formatter: function(params) {
            const gbgfStr = node.gbgf ? node.gbgf.replace(/"/g, '') : '';
            return [
              '<div style="font-weight: bold; margin-bottom: 5px;">Source System Details</div>',
              'System: ' + node.system,
              'Application: ' + node.name,
              'EIM ID: ' + node.id,
              'System Code: ' + node.sysCode,
              'Sub System Code: ' + node.subSysCode,
              'Source Tables: ' + node.tables.toLocaleString(),
              'CDP Tables: ' + node.cdpTables.toLocaleString(),
              'GB/GF: ' + gbgfStr
            ].join('<br/>');
          }
        }
      });

      // 添加到 CDP 的连接
      links.push({
        source: node.id,
        target: 'CDP',
        value: node.cdpTables,
        symbolSize: [4, 8],
        lineStyle: {
          color: '#67C23A',
          opacity: 0.6,
          width: Math.max(1, Math.sqrt(node.cdpTables / maxCdpTableCount) * 3),
          curveness: 0.3
        }
      });
    });

    // 添加 CDP 节点
    nodes.push({
      id: 'CDP',
      name: 'CDP',
      itemStyle: {
        color: '#1890ff'
      },
      x: containerWidth / 2,
      y: centerY,
      symbol: 'circle',
      symbolSize: 60,
      category: 'cdp',
      label: {
        show: true,
        position: 'inside',
        fontSize: 14,
        color: '#fff',
        formatter: 'CDP'
      }
    });

    // 添加下游系统节点
    Array.from(downstreamMap.values()).forEach((node, index) => {
      const pos = getStaggeredPosition(index, downstreamMap.size, rightX, rightWidth, margin, height);
      nodes.push({
        id: node.id,
        name: node.name,
        value: node.tables,
        itemStyle: {
          color: '#E6A23C',
          cursor: 'pointer'
        },
        x: pos.x,
        y: pos.y,
        symbol: 'circle',
        symbolSize: Math.max(15, Math.sqrt(node.tables / maxDownstreamTableCount) * 35),
        category: 'downstream',
        label: {
          show: true,
          position: 'right',
          distance: 5,
          fontSize: 10,
          formatter: function(params) {
            return [
              '{bold|' + node.name + '}',
              'Tables: ' + node.tables.toLocaleString()
            ].join('\n');
          },
          rich: {
            bold: {
              fontWeight: 'bold',
              fontSize: 10
            }
          }
        },
        tooltip: {
          formatter: function(params) {
            return [
              '<div style="font-weight: bold; margin-bottom: 5px;">Downstream System Details</div>',
              'Application: ' + node.name,
              'EIM ID: ' + node.id,
              'Total Tables: ' + node.tables.toLocaleString(),
              '<div style="color: #E6A23C; margin-top: 5px;">Click to view details</div>'
            ].join('<br/>');
          }
        }
      });

      // 添加从 CDP 到下游系统的连接
      links.push({
        source: 'CDP',
        target: node.id,
        value: node.tables,
        symbolSize: [4, 8],
        lineStyle: {
          color: '#E6A23C',
          opacity: 0.6,
          width: Math.max(1, Math.sqrt(node.tables / maxDownstreamTableCount) * 3),
          curveness: 0.3
        }
      });
    });

    return {
      nodes,
      links,
      categories: [
        { name: 'source' },
        { name: 'cdp' },
        { name: 'downstream' }
      ]
    };
  }, [dataFlowData, selectedGbGf]);

  const getSubGraphData = useCallback((selectedDownstreamId) => {
    if (!dataFlowData?.rawData) return null;

    // 找到与下游系统相关的所有数据
    const relatedData = dataFlowData.rawData.filter(row => 
      row['Downstream EIM ID'] === selectedDownstreamId
    );

    if (relatedData.length === 0) return null;

    const downstream = relatedData[0];
    const downstreamName = downstream['Downstream Application Name'];
    const downstreamId = downstream['Downstream EIM ID'];

    // 准备桑基图数据
    const nodes = [];
    const links = [];
    const sourceNodes = new Map();

    // 处理源系统节点
    relatedData.forEach(row => {
      const sourceId = row['Source EIM ID'];
      const sourceName = row['Source Application Name'];
      const sourceSystem = row['Source system'];
      const sysCode = row['SYS_CODE'];
      const subSysCode = row['SUB_SYS_CODE'];
      const sourceTableCount = Number(row['Source File/Table Count']) || 0;
      const cdpTableCount = Number(row['Total CDP Table Count']) || 0;
      const sharedTableCount = Number(row['Share to Downstream Table Count']) || 0;

      if (!sourceNodes.has(sourceId)) {
        sourceNodes.set(sourceId, {
          id: sourceId,
          name: sourceName,
          system: sourceSystem,
          sysCode: sysCode,
          subSysCode: subSysCode,
          sourceTables: sourceTableCount,
          cdpTables: cdpTableCount,
          sharedTables: sharedTableCount
        });
      }
    });

    // 添加源系统节点
    sourceNodes.forEach((node) => {
      nodes.push({
        name: `${node.system}\n${node.id}\n${node.sourceTables}`
      });

      // 源系统到 CDP 的链接
      links.push({
        source: `${node.system}\n${node.id}\n${node.sourceTables}`,
        target: 'CDP',
        value: node.cdpTables
      });

      // CDP 到下游系统的链接
      links.push({
        source: 'CDP',
        target: `${downstreamName}\n${downstreamId}\n${node.sharedTables}`,
        value: node.sharedTables
      });
    });

    // 添加 CDP 节点
    nodes.push({
      name: 'CDP'
    });

    // 添加下游系统节点
    nodes.push({
      name: `${downstreamName}\n${downstreamId}\n${relatedData[0]['Share to Downstream Table Count']}`
    });

    return {
      series: [{
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency'
        },
        data: nodes,
        links: links,
        label: {
          formatter: function(params) {
            const parts = params.name.split('\n');
            if (parts.length === 1) return params.name; // CDP节点
            const [system, id, tables] = parts;
            return [
              system,
              id,
              `Tables: ${tables}`
            ].join('\n');
          }
        }
      }]
    };
  }, [dataFlowData]);

  const handleChartClick = useCallback((params) => {
    if (params.dataType === 'node' && params.data.category === 'downstream') {
      setSelectedNode(params.data);
      const subGraphData = getSubGraphData(params.data.id);
      setSubGraphData(subGraphData);
      setViewType('detail');
    }
  }, [getSubGraphData]);

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
              click: handleChartClick
            }}
          />
        </Paper>
      </Fade>
    </div>
  );
};

export default DataFlow;
