import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Paper, IconButton } from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import ReactECharts from 'echarts-for-react';
import { selectDataFlowData, selectStatus } from '../features/dashboard/dashboardSlice';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
    backgroundColor: '#1e1e1e',
    minHeight: 'calc(100vh - 64px)',
  },
  title: {
    color: '#fff',
    marginBottom: theme.spacing(1),
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.875rem',
  },
  flowContainer: {
    backgroundColor: '#fff',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    height: 600,
  },
  backButton: {
    marginBottom: theme.spacing(2),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
}));

function DataFlow() {
  const classes = useStyles();
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewType, setViewType] = useState('main');
  const dataFlowData = useSelector(selectDataFlowData);
  const status = useSelector(selectStatus);

  // Debug logging
  useEffect(() => {
    console.log('DataFlow component data:', {
      dataFlowData,
      selectedNode,
      viewType,
      status,
      detailData: dataFlowData?.detailData,
    });
  }, [dataFlowData, selectedNode, viewType, status]);

  const mainGraph = useMemo(() => {
    return dataFlowData?.mainGraph || { nodes: [], links: [] };
  }, [dataFlowData]);

  const detailData = useMemo(() => {
    return dataFlowData?.detailData || {};
  }, [dataFlowData]);

  const getMainChartOption = () => ({
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      padding: [10, 15],
      textStyle: {
        color: '#333',
      },
      formatter: function (params) {
        const value = params.value || 0;
        return [
          params.name,
          'Flow: ' + value.toLocaleString() + ' records/hour',
        ].join('<br/>');
      },
    },
    grid: {
      left: '5%',
      right: '5%',
      top: '5%',
      bottom: '5%',
      containLabel: true,
    },
    series: [
      {
        type: 'graph',
        layout: 'none',
        data: mainGraph.nodes.map((node) => {
          let x, category;
          if (node.type === 'cdp') {
            x = 0.5;
            category = 1;
          } else if (node.type === 'downstream') {
            x = 0.8;
            category = 2;
          } else {
            x = 0.2;
            category = 0;
          }

          let y;
          if (category === 1) {
            y = 0.5;
          } else if (category === 0) {
            const sourceNodes = mainGraph.nodes.filter((n) => n.type === 'source');
            const index = sourceNodes.findIndex((n) => n.name === node.name);
            y = (index + 1) / (sourceNodes.length + 1);
          } else {
            const targetNodes = mainGraph.nodes.filter((n) => n.type === 'downstream');
            const index = targetNodes.findIndex((n) => n.name === node.name);
            y = (index + 1) / (targetNodes.length + 1);
          }

          // 计算节点大小
          let baseSize;
          if (category === 1) {
            baseSize = 80; // CDP 节点最大
          } else if (category === 2) {
            baseSize = 60; // 下游节点次之
          } else {
            baseSize = 50; // 源系统节点最小
          }

          // 根据数值调整大小
          const sizeScale = Math.sqrt(node.value) * 0.05;
          const finalSize = Math.max(baseSize, baseSize * sizeScale);

          return {
            ...node,
            x: x * 100,
            y: y * 100,
            symbolSize: finalSize,
            symbol: 'circle',
            category: category,
            itemStyle: {
              color:
                category === 1
                  ? '#06b6d4'
                  : category === 2
                  ? '#10b981'
                  : '#8B5CF6',
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
              shadowBlur: 10,
            },
            label: {
              show: true,
              position: 'inside',
              formatter: function (params) {
                let result = '{title|' + params.data.name + '}';
                if (params.data.subLabel) {
                  result += '\n{subtitle|' + params.data.subLabel + '}';
                }
                return result;
              },
              rich: {
                title: {
                  fontSize: 14,
                  fontWeight: 'normal',
                  color: '#fff',
                  padding: [0, 0, 2, 0],
                },
                subtitle: {
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.8)',
                  padding: [2, 0, 0, 0],
                },
              },
            },
          };
        }),
        links: mainGraph.links.map((link) => ({
          ...link,
          lineStyle: {
            width: Math.sqrt(link.value) * 0.5, // 增加线条粗细
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(139, 92, 246, 0.5)',
                },
                {
                  offset: 0.5,
                  color: 'rgba(6, 182, 212, 0.5)',
                },
                {
                  offset: 1,
                  color: 'rgba(16, 185, 129, 0.5)',
                },
              ],
            },
            opacity: 0.8,
            curveness: 0.2,
            type: 'solid',
          },
        })),
        categories: [
          { name: 'Source Systems' },
          { name: 'CDP' },
          { name: 'Downstream' },
        ],
        roam: false, // 禁用缩放和平移
        focusNodeAdjacency: true,
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 'inherit',
            opacity: 1,
          },
        },
      },
    ],
  });

  const getDetailChartOption = (nodeName) => {
    console.log('Generating detail chart option for node:', nodeName);
    console.log('Available detail data:', detailData);

    if (!nodeName) {
      console.log('No node name provided');
      return null;
    }

    if (!detailData[nodeName]) {
      console.log('No detail data found for node:', nodeName);
      return null;
    }

    const nodeData = detailData[nodeName];
    console.log('Node data:', nodeData);

    if (!nodeData?.nodes?.length) {
      console.log('No nodes in detail data');
      return null;
    }

    if (!nodeData?.links?.length) {
      console.log('No links in detail data');
      return null;
    }

    const option = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: function (params) {
          if (params.dataType === 'node') {
            return params.data.name + ': ' + params.data.value.toLocaleString();
          } else {
            return (
              params.data.source +
              ' → ' +
              params.data.target +
              ': ' +
              params.data.value.toLocaleString()
            );
          }
        },
      },
      series: [
        {
          type: 'sankey',
          left: 50,
          right: 150,
          top: 20,
          bottom: 20,
          emphasis: {
            focus: 'adjacency',
          },
          nodeAlign: 'justify',
          layoutIterations: 32,
          nodeWidth: 20,
          nodeGap: 8,
          data: nodeData.nodes.map((node) => ({
            ...node,
            itemStyle: {
              color: '#06b6d4',
              borderColor: '#fff',
              borderWidth: 1,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
              shadowBlur: 5,
            },
          })),
          links: nodeData.links.map((link) => ({
            ...link,
            lineStyle: {
              color: 'gradient',
              opacity: 0.6,
              curveness: 0.5,
            },
          })),
          label: {
            position: 'right',
            show: true,
            color: '#333',
            fontSize: 12,
            formatter: '{b}',
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6,
            curveness: 0.5,
          },
        },
      ],
    };

    console.log('Generated detail chart option:', option);
    return option;
  };

  const handleChartClick = (params) => {
    console.log('Chart click event:', params);
    if (params.data && params.data.type === 'downstream') {
      const nodeName = params.data.name;
      console.log('Clicked downstream node:', nodeName);
      console.log('Available detail data for node:', detailData[nodeName]);
      setSelectedNode(nodeName);
      setViewType('detail');
    }
  };

  const handleBack = () => {
    console.log('Switching back to main view');
    setSelectedNode(null);
    setViewType('main');
  };

  const currentOption = useMemo(() => {
    console.log('Calculating current option:', {
      viewType,
      selectedNode,
      hasDetailData: selectedNode ? !!detailData[selectedNode] : false,
    });

    if (viewType === 'main') {
      return getMainChartOption();
    }

    return getDetailChartOption(selectedNode);
  }, [viewType, mainGraph, selectedNode, detailData]);

  return (
    <div className={classes.root}>
      {viewType === 'detail' && (
        <IconButton className={classes.backButton} onClick={handleBack}>
          <ArrowBack />
        </IconButton>
      )}
      <Typography variant="h5" className={classes.title}>
        {viewType === 'main' ? 'Data Flow Overview' : selectedNode}
      </Typography>
      <Typography className={classes.subtitle}>
        {viewType === 'main'
          ? 'Data flow between systems'
          : 'Detailed data flow within system'}
      </Typography>
      <Paper className={classes.flowContainer}>
        {!currentOption ? (
          <Typography color="textSecondary">
            {status === 'loading' ? 'Loading...' : 'No data available'}
          </Typography>
        ) : (
          <ReactECharts
            option={currentOption}
            style={{ height: '100%', width: '100%' }}
            onEvents={{
              click: handleChartClick,
            }}
            notMerge={true}
            lazyUpdate={true}
          />
        )}
      </Paper>
    </div>
  );
}

export default DataFlow;
