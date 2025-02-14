import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Paper, IconButton } from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import ReactECharts from 'echarts-for-react';
import { selectDataFlowData } from '../features/dashboard/dashboardSlice';

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
  const mainGraph = dataFlowData?.mainGraph || { nodes: [], links: [] };
  const detailData = dataFlowData?.detailData || {};

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
      formatter: function(params) {
        const value = params.value || 0;
        return [
          params.name,
          'Flow: ' + value.toLocaleString() + ' records/hour'
        ].join('<br/>');
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      top: '5%',
      bottom: '5%',
      containLabel: true
    },
    series: [{
      type: 'graph',
      layout: 'none',
      data: mainGraph.nodes.map(node => {
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
          const sourceNodes = mainGraph.nodes.filter(n => n.type === 'source');
          const index = sourceNodes.findIndex(n => n.name === node.name);
          y = (index + 1) / (sourceNodes.length + 1);
        } else {
          const targetNodes = mainGraph.nodes.filter(n => n.type === 'downstream');
          const index = targetNodes.findIndex(n => n.name === node.name);
          y = (index + 1) / (targetNodes.length + 1);
        }

        return {
          ...node,
          x: x * 100,
          y: y * 100,
          symbolSize: Math.sqrt(node.value / Math.PI) * 8,
          symbol: 'circle',
          category: category,
          itemStyle: {
            color: category === 1 ? '#06b6d4' : 
                   category === 2 ? '#10b981' : '#8B5CF6',
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            shadowBlur: 10
          },
          label: {
            show: true,
            position: 'inside',
            formatter: function(params) {
              let result = '{title|' + params.data.name + '}';
              if (params.data.subLabel) {
                result += '\n{subtitle|' + params.data.subLabel + '}';
              }
              return result;
            },
            rich: {
              title: {
                fontSize: 12,
                fontWeight: 'bold',
                color: '#fff',
                padding: [0, 0, 2, 0]
              },
              subtitle: {
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.7)',
                padding: [2, 0, 0, 0]
              }
            }
          }
        };
      }),
      links: mainGraph.links.map(link => ({
        ...link,
        lineStyle: {
          width: Math.sqrt(link.value) * 0.5,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [{
              offset: 0,
              color: '#8B5CF6'
            }, {
              offset: 0.5,
              color: '#06b6d4'
            }, {
              offset: 1,
              color: '#10b981'
            }]
          },
          opacity: 0.6,
          curveness: 0.2,
          type: 'solid'
        },
        label: {
          show: true,
          formatter: '{c} records/hour',
          fontSize: 10,
          color: '#666',
          position: 'middle'
        }
      })),
      categories: [
        { name: 'Source Systems' },
        { name: 'CDP' },
        { name: 'Downstream' }
      ],
      roam: true,
      focusNodeAdjacency: true,
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 10
        }
      }
    }]
  });

  const getDetailChartOption = (nodeName) => {
    const nodeData = detailData[nodeName];
    if (!nodeData) return null;

    return {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: function(params) {
          if (params.dataType === 'node') {
            return `${params.name}: ${params.value.toLocaleString()} records/hour`;
          }
          return `${params.data.source} → ${params.data.target}: ${params.value.toLocaleString()} records/hour`;
        }
      },
      series: [{
        type: 'sankey',
        data: nodeData.nodes,
        links: nodeData.links,
        emphasis: {
          focus: 'adjacency'
        },
        levels: [{
          depth: 0,
          itemStyle: {
            color: '#8B5CF6'
          }
        }, {
          depth: 1,
          itemStyle: {
            color: '#06b6d4'
          }
        }, {
          depth: 2,
          itemStyle: {
            color: '#10b981'
          }
        }],
        lineStyle: {
          color: 'gradient',
          curveness: 0.5
        }
      }]
    };
  };

  const handleNodeClick = (params) => {
    if (params.data && detailData[params.data.name]) {
      setSelectedNode(params.data.name);
      setViewType('detail');
    }
  };

  const handleBack = () => {
    setSelectedNode(null);
    setViewType('main');
  };

  return (
    <div className={classes.root}>
      <Typography variant="h5" component="h1" className={classes.title}>
        Data Flow
      </Typography>
      <Typography className={classes.subtitle}>
        {viewType === 'main' 
          ? 'Overview of data flow between systems' 
          : `Detailed view of ${selectedNode}`}
      </Typography>
      {viewType === 'detail' && (
        <IconButton className={classes.backButton} onClick={handleBack}>
          <ArrowBack />
        </IconButton>
      )}
      <Paper className={classes.flowContainer}>
        <ReactECharts
          option={viewType === 'main' ? getMainChartOption() : getDetailChartOption(selectedNode)}
          style={{ height: '100%' }}
          onEvents={{
            click: viewType === 'main' ? handleNodeClick : undefined
          }}
        />
      </Paper>
    </div>
  );
}

export default DataFlow;
