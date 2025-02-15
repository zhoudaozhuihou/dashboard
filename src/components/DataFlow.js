import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Paper, IconButton, Fade } from '@material-ui/core';
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
    display: 'flex',
    alignItems: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.875rem',
    marginBottom: theme.spacing(3),
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
}));

function DataFlow() {
  const classes = useStyles();
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewType, setViewType] = useState('main');
  const dataFlowData = useSelector(selectDataFlowData);

  const mainGraph = useMemo(() => {
    return dataFlowData?.mainGraph || { nodes: [], links: [] };
  }, [dataFlowData]);

  const detailData = useMemo(() => {
    return dataFlowData?.detailData || {};
  }, [dataFlowData]);

  const getMainChartOption = useCallback(() => {
    return {
      backgroundColor: '#ffffff',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#eee',
        borderWidth: 1,
        padding: [10, 15],
        textStyle: {
          color: '#333',
          fontSize: 13,
        },
        formatter: function (params) {
          if (params.dataType === 'edge') {
            return `<div style="font-weight: bold; margin-bottom: 4px;">Data Flow</div>
                    Tables: ${params.value.toLocaleString()}`;
          }
          const node = params.data;
          return `<div style="font-weight: bold; margin-bottom: 4px;">${node.name}</div>
                  ${node.subLabel ? `EIM ID: ${node.subLabel}<br/>` : ''}
                  Tables: ${node.value.toLocaleString()}`;
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
          symbolSize: 50,
          roam: true,
          animation: true,
          data: mainGraph.nodes.map((node) => {
            let x, y;
            
            if (node.type === 'source') {
              x = 100;
              const sourceNodes = mainGraph.nodes.filter(n => n.type === 'source');
              const index = sourceNodes.findIndex(n => n.name === node.name);
              y = (index + 1) * (600 / (sourceNodes.length + 1));
            } else if (node.type === 'cdp') {
              x = 400;
              y = 300;
            } else {
              x = 700;
              const targetNodes = mainGraph.nodes.filter(n => n.type === 'downstream');
              const index = targetNodes.findIndex(n => n.name === node.name);
              y = (index + 1) * (600 / (targetNodes.length + 1));
            }

            const minSize = 40;
            const maxSize = 90;
            const size = node.type === 'cdp' ? maxSize : 
              Math.min(maxSize, minSize + Math.sqrt(node.value) * 0.5);

            return {
              ...node,
              x,
              y,
              symbolSize: size,
              symbol: 'circle',
              label: {
                show: true,
                position: node.type === 'source' ? 'left' : node.type === 'downstream' ? 'right' : 'inside',
                color: node.type === 'cdp' ? '#fff' : '#333',
                fontSize: node.type === 'cdp' ? 14 : 12,
                fontWeight: 'bold',
                formatter: [
                  '{name|{b}}',
                  '{value|{c} tables}'
                ].join('\n'),
                rich: {
                  name: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    padding: [0, 0, 4, 0],
                    color: node.type === 'cdp' ? '#fff' : '#333'
                  },
                  value: {
                    fontSize: 12,
                    color: node.type === 'cdp' ? '#fff' : '#666',
                    fontWeight: 'normal'
                  }
                }
              },
              itemStyle: {
                color: node.type === 'cdp' ? '#1890ff' : 
                       node.type === 'source' ? '#722ed1' : '#13c2c2',
                borderColor: '#fff',
                borderWidth: 2,
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                opacity: 0.9
              },
              emphasis: {
                scale: true,
                itemStyle: {
                  opacity: 1,
                  shadowBlur: 30
                }
              }
            };
          }),
          links: mainGraph.links.map(link => ({
            ...link,
            lineStyle: {
              color: 'rgba(0, 0, 0, 0.2)',  
              width: Math.max(2, Math.log(link.value) * 2),
              curveness: 0.2,
              opacity: 0.6,
              type: 'solid',
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            },
            emphasis: {
              lineStyle: {
                opacity: 0.8,
                shadowBlur: 20,
                width: 'bolder'
              }
            }
          })),
          emphasis: {
            focus: 'adjacency',
            scale: true
          }
        }
      ]
    };
  }, [mainGraph]);

  const getDetailChartOption = useCallback((nodeName) => {
    if (!nodeName || !detailData[nodeName]) return null;

    const { nodes, links } = detailData[nodeName];
    
    return {
      backgroundColor: '#ffffff',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#eee',
        borderWidth: 1,
        padding: [10, 15],
        textStyle: {
          color: '#333',
          fontSize: 13
        },
        formatter: function(params) {
          return `<div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
                  Tables: ${params.value.toLocaleString()}`;
        }
      },
      series: [
        {
          type: 'sankey',
          emphasis: {
            focus: 'adjacency'
          },
          nodeAlign: 'left',
          layoutIterations: 32,
          nodeGap: 30,
          data: nodes.map(node => ({
            name: node.name,
            value: node.value,
            itemStyle: {
              color: node.name === 'CDP' ? '#1890ff' : 
                     links.some(link => link.target === node.name) ? '#13c2c2' : '#722ed1',
              borderColor: '#fff',
              borderWidth: 1,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
              opacity: 0.9
            },
            emphasis: {
              itemStyle: {
                opacity: 1,
                shadowBlur: 20
              }
            }
          })),
          links: links.map(link => ({
            ...link,
            lineStyle: {
              color: 'source',
              opacity: 0.5
            },
            emphasis: {
              lineStyle: {
                opacity: 0.8
              }
            }
          })),
          label: {
            position: 'inside',
            formatter: '{b}\n{c} tables',
            fontSize: 12,
            fontWeight: 'bold',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: [4, 8],
            borderRadius: 4
          }
        }
      ]
    };
  }, [detailData]);

  const handleChartClick = useCallback((params) => {
    if (params.dataType === 'node' && params.data.type === 'downstream') {
      setSelectedNode(params.data.name);
      setViewType('detail');
    }
  }, []);

  const handleBackClick = useCallback(() => {
    setSelectedNode(null);
    setViewType('main');
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.title}>
        {viewType === 'detail' && (
          <IconButton className={classes.backButton} onClick={handleBackClick} size="small">
            <ArrowBack />
          </IconButton>
        )}
        <Typography variant="h5" component="span">
          {viewType === 'main' ? 'System Data Flow' : `${selectedNode} Detail View`}
        </Typography>
      </div>
      <Typography className={classes.subtitle}>
        {viewType === 'main' 
          ? 'Click on a downstream system to view detailed data flow'
          : 'Showing detailed data flow for the selected system'
        }
      </Typography>
      <Fade in={true} timeout={500}>
        <Paper className={classes.flowContainer}>
          <ReactECharts
            option={viewType === 'main' ? getMainChartOption() : getDetailChartOption(selectedNode)}
            style={{ height: '100%' }}
            onEvents={{
              click: viewType === 'main' ? handleChartClick : undefined
            }}
            notMerge={true}
            lazyUpdate={false}
          />
        </Paper>
      </Fade>
    </div>
  );
}

export default DataFlow;
