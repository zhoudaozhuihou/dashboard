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
  const chartRef = useRef(null);

  const dataFlowData = useSelector((state) => state.dashboard.dataFlowData);
  
  const mainGraph = useMemo(() => {
    console.log('DataFlow data:', dataFlowData);
    if (!dataFlowData?.mainGraph) {
      console.log('No mainGraph data available');
      return null;
    }

    const { nodes, links } = dataFlowData.mainGraph;
    console.log('Original nodes and links:', { nodes, links });

    // 根据选中的 GB/GF 值筛选节点和连接
    if (selectedGbGf && selectedGbGf !== 'all') {
      console.log('Filtering by GB/GF:', selectedGbGf);
      // 筛选下游系统和源系统节点
      const filteredNodes = nodes.filter(node => {
        if (node.type === 'cdp') return true;
        return node.gbgf && node.gbgf.split(',').map(g => g.trim()).includes(selectedGbGf);
      });

      // 获取筛选后的节点 ID
      const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

      // 筛选连接
      const filteredLinks = links.filter(link => {
        return filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target);
      });

      console.log('Filtered data:', { 
        nodes: filteredNodes, 
        links: filteredLinks,
        selectedGbGf
      });

      return {
        nodes: filteredNodes,
        links: filteredLinks
      };
    }

    return { nodes, links };
  }, [dataFlowData, selectedGbGf]);

  const getMainChartOption = useCallback(() => {
    if (!mainGraph?.nodes?.length) {
      console.log('No graph data available');
      return {};
    }

    // 定义配色方案
    const colors = {
      source: {
        node: '#67c23a',
        border: '#95d475',
        shadow: 'rgba(103, 194, 58, 0.3)'
      },
      cdp: {
        node: '#409eff',
        border: '#79bbff',
        shadow: 'rgba(64, 158, 255, 0.3)'
      },
      downstream: {
        node: '#e6a23c',
        border: '#eebe77',
        shadow: 'rgba(230, 162, 60, 0.3)'
      },
      link: {
        color: '#909399',
        shadowColor: 'rgba(144, 147, 153, 0.3)',
        highlightColor: '#409eff'
      }
    };

    return {
      backgroundColor: '#ffffff',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#eee',
        borderWidth: 1,
        padding: [10, 15],
        textStyle: {
          color: '#606266'
        },
        formatter: (params) => {
          if (params.dataType === 'node') {
            const data = params.data;
            if (data.type === 'source') {
              return `<div style="font-weight: bold; color: ${colors.source.node}; margin-bottom: 8px;">${data.name}</div>
                     <div style="color: #606266; line-height: 1.5;">
                     Application: ${data.applicationName}<br/>
                     EIM ID: ${data.eimId}<br/>
                     Tables: ${data.value.toLocaleString()}</div>`;
            } else if (data.type === 'downstream') {
              return `<div style="font-weight: bold; color: ${colors.downstream.node}; margin-bottom: 8px;">${data.name}</div>
                     <div style="color: #606266; line-height: 1.5;">
                     EIM ID: ${data.eimId}<br/>
                     Tables: ${data.value.toLocaleString()}<br/>
                     GB/GF: ${data.gbgf}</div>`;
            }
            return `<div style="font-weight: bold; color: ${colors.cdp.node}; margin-bottom: 8px;">CDP</div>
                    <div style="color: #606266; line-height: 1.5;">
                    Total Tables: ${data.value.toLocaleString()}</div>`;
          }
          if (params.dataType === 'edge') {
            return `<div style="font-weight: bold; color: ${colors.link.color}; margin-bottom: 8px;">Data Flow</div>
                    <div style="color: #606266; line-height: 1.5;">
                    Tables: ${params.value.toLocaleString()}</div>`;
          }
          return '';
        }
      },
      legend: {
        data: ['Source Systems', 'CDP', 'Downstream Systems'],
        orient: 'horizontal',
        bottom: 10,
        textStyle: {
          color: '#606266',
          fontSize: 12
        },
        itemWidth: 15,
        itemHeight: 15,
        itemGap: 25,
        icon: 'circle'
      },
      series: [{
        type: 'graph',
        layout: 'none',
        symbolSize: (value, params) => {
          const baseSize = params.data.symbolSize || 50;
          return params.data.type === 'cdp' ? baseSize * 1.2 : baseSize;
        },
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: (params) => {
            return params.data.type === 'cdp' ? 'CDP' : params.data.name;
          },
          fontSize: 12,
          color: '#606266',
          backgroundColor: '#fff',
          padding: [4, 8],
          borderRadius: 3,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 3
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        data: mainGraph.nodes.map(node => ({
          ...node,
          itemStyle: {
            color: node.type === 'source' ? colors.source.node : 
                   node.type === 'cdp' ? colors.cdp.node : 
                   colors.downstream.node,
            borderColor: node.type === 'source' ? colors.source.border :
                        node.type === 'cdp' ? colors.cdp.border :
                        colors.downstream.border,
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: node.type === 'source' ? colors.source.shadow :
                        node.type === 'cdp' ? colors.cdp.shadow :
                        colors.downstream.shadow
          }
        })),
        links: mainGraph.links.map(link => ({
          ...link,
          lineStyle: {
            color: colors.link.color,
            width: Math.max(1, Math.log2(link.value) * 0.5),
            curveness: 0.2,
            opacity: 0.6,
            shadowBlur: 5,
            shadowColor: colors.link.shadowColor,
            type: [8, 8]
          }
        })),
        categories: [
          { name: 'Source Systems', itemStyle: { color: colors.source.node } },
          { name: 'CDP', itemStyle: { color: colors.cdp.node } },
          { name: 'Downstream Systems', itemStyle: { color: colors.downstream.node } }
        ],
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            color: colors.link.highlightColor,
            width: 'bolder',
            opacity: 0.8,
            shadowBlur: 10,
            shadowColor: colors.link.shadowColor
          },
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 'bold',
            backgroundColor: '#fff',
            padding: [6, 10],
            borderRadius: 4,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 5
          },
          itemStyle: {
            shadowBlur: 15,
            borderWidth: 3
          }
        }
      }]
    };
  }, [mainGraph]);

  const getDetailChartOption = useCallback((node) => {
    if (!node || !dataFlowData?.rawData) return {};

    // 找出与选中的下游系统相关的所有数据
    const relevantData = dataFlowData.rawData.filter(row => 
      row['Downstream Application Name'] === node.name
    );

    // 准备桑基图数据
    const nodes = [];
    const links = [];
    const sourceSet = new Set();

    // 添加源系统节点
    relevantData.forEach(row => {
      if (row['Source system']) {
        sourceSet.add(row['Source system']);
      }
    });

    // 添加源系统节点
    Array.from(sourceSet).forEach((sourceName, index) => {
      nodes.push({
        name: sourceName,
        value: relevantData
          .filter(row => row['Source system'] === sourceName)
          .reduce((sum, row) => sum + (Number(row['Source File/Table Count']) || 0), 0)
      });
    });

    // 添加 CDP 节点
    nodes.push({
      name: 'CDP',
      value: relevantData.reduce((sum, row) => 
        sum + (Number(row['Total CDP Table Count(Include Daliy/Monthly Table)']) || 0), 0)
    });

    // 添加下游系统节点
    nodes.push({
      name: node.name,
      value: relevantData.reduce((sum, row) => 
        sum + (Number(row['Share to Downstream Table Count']) || 0), 0)
    });

    // 创建连接
    relevantData.forEach(row => {
      if (row['Source system']) {
        // 源系统到 CDP 的连接
        links.push({
          source: row['Source system'],
          target: 'CDP',
          value: Number(row['Total CDP Table Count(Include Daliy/Monthly Table)']) || 0
        });

        // CDP 到下游系统的连接
        links.push({
          source: 'CDP',
          target: node.name,
          value: Number(row['Share to Downstream Table Count']) || 0
        });
      }
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.dataType === 'node') {
            return `<div style="font-weight: bold; margin-bottom: 5px;">${params.name}</div>
                    Tables: ${params.value.toLocaleString()}`;
          }
          return `<div style="font-weight: bold; margin-bottom: 5px;">Data Flow</div>
                  Tables: ${params.value.toLocaleString()}`;
        }
      },
      series: [{
        type: 'sankey',
        emphasis: {
          focus: 'adjacency'
        },
        nodeAlign: 'left',
        data: nodes,
        links: links,
        label: {
          formatter: '{b}: {c} tables',
          fontSize: 12
        },
        lineStyle: {
          color: 'gradient',
          curveness: 0.5,
          opacity: 0.5
        },
        itemStyle: {
          color: '#1890ff',
          borderColor: '#fff',
          borderWidth: 1,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        }
      }]
    };
  }, [dataFlowData]);

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

  // 监听图表实例和数据变化
  useEffect(() => {
    if (chartRef.current && mainGraph) {
      const chartInstance = chartRef.current.getEchartsInstance();
      const option = viewType === 'main' ? getMainChartOption() : getDetailChartOption(selectedNode);
      console.log('Setting chart option:', option);
      try {
        chartInstance.setOption(option, true);
      } catch (error) {
        console.error('Error setting chart option:', error);
      }
    }
  }, [mainGraph, viewType, selectedNode, getMainChartOption, getDetailChartOption]);

  const handleGbGfChange = (event) => {
    setSelectedGbGf(event.target.value);
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleChartClick = useCallback((params) => {
    if (params.dataType === 'node' && params.data.type === 'downstream') {
      setSelectedNode(params.data);
      setViewType('detail');
    }
  }, []);

  const handleBackClick = useCallback(() => {
    setSelectedNode(null);
    setViewType('main');
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.titleSection}>
          {viewType === 'detail' && (
            <IconButton className={classes.backButton} onClick={handleBackClick}>
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
          <IconButton onClick={handleFullscreenToggle} className={classes.fullscreenButton}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </div>
      </div>
      <Fade in={true} timeout={500}>
        <Paper className={classes.flowContainer}>
          <ReactECharts
            ref={chartRef}
            option={viewType === 'main' ? getMainChartOption() : getDetailChartOption(selectedNode)}
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
