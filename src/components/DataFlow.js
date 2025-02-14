import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, IconButton, Paper, Fade } from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import ReactECharts from 'echarts-for-react';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  header: {
    marginBottom: theme.spacing(3),
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 500,
    color: theme.palette.primary.main,
  },
  subtitle: {
    color: theme.palette.text.secondary,
    fontSize: '0.9rem',
    marginTop: theme.spacing(0.5),
  },
  backButton: {
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    boxShadow: theme.shadows[1],
  },
  chartContainer: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    boxShadow: theme.shadows[1],
    height: 'calc(100vh - 300px)',
    minHeight: '500px',
  },
  chart: {
    height: '100%',
  },
}));

function DataFlow() {
  const classes = useStyles();
  const [selectedNode, setSelectedNode] = useState(null);

  const mainGraphData = {
    nodes: [
      { 
        id: 'cdp', 
        name: 'Customer Data Platform',
        symbolSize: 80,
        symbol: 'circle',
        itemStyle: { 
          color: '#26C6DA',
          borderColor: '#fff',
          borderWidth: 2,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowBlur: 10,
        }
      },
      // Input nodes (blue)
      { 
        id: 'crm', 
        name: 'CRM System',
        symbolSize: 50,
        symbol: 'circle',
        itemStyle: { 
          color: '#5C6BC0',
          borderColor: '#fff',
          borderWidth: 2,
        }
      },
      { 
        id: 'web', 
        name: 'Website Analytics',
        symbolSize: 50,
        symbol: 'circle',
        itemStyle: { 
          color: '#5C6BC0',
          borderColor: '#fff',
          borderWidth: 2,
        }
      },
      { 
        id: 'mobile', 
        name: 'Mobile App',
        symbolSize: 50,
        symbol: 'circle',
        itemStyle: { 
          color: '#5C6BC0',
          borderColor: '#fff',
          borderWidth: 2,
        }
      },
      { 
        id: 'email', 
        name: 'Email Platform',
        symbolSize: 50,
        symbol: 'circle',
        itemStyle: { 
          color: '#5C6BC0',
          borderColor: '#fff',
          borderWidth: 2,
        }
      },
      // Output nodes (green)
      { 
        id: 'marketing', 
        name: 'Marketing Automation',
        symbolSize: 50,
        symbol: 'circle',
        itemStyle: { 
          color: '#66BB6A',
          borderColor: '#fff',
          borderWidth: 2,
        }
      },
      { 
        id: 'analytics', 
        name: 'Analytics Platform',
        symbolSize: 50,
        symbol: 'circle',
        itemStyle: { 
          color: '#66BB6A',
          borderColor: '#fff',
          borderWidth: 2,
        }
      },
      { 
        id: 'personalization', 
        name: 'Personalization Engine',
        symbolSize: 50,
        symbol: 'circle',
        itemStyle: { 
          color: '#66BB6A',
          borderColor: '#fff',
          borderWidth: 2,
        }
      }
    ],
    links: [
      { 
        source: 'crm', 
        target: 'cdp',
        lineStyle: {
          width: 2,
          curveness: 0.2,
          color: '#999',
        }
      },
      { 
        source: 'web', 
        target: 'cdp',
        lineStyle: {
          width: 2,
          curveness: 0.2,
          color: '#999',
        }
      },
      { 
        source: 'mobile', 
        target: 'cdp',
        lineStyle: {
          width: 2,
          curveness: 0.2,
          color: '#999',
        }
      },
      { 
        source: 'email', 
        target: 'cdp',
        lineStyle: {
          width: 2,
          curveness: 0.2,
          color: '#999',
        }
      },
      { 
        source: 'cdp', 
        target: 'marketing',
        lineStyle: {
          width: 2,
          curveness: 0.2,
          color: '#999',
        }
      },
      { 
        source: 'cdp', 
        target: 'analytics',
        lineStyle: {
          width: 2,
          curveness: 0.2,
          color: '#999',
        }
      },
      { 
        source: 'cdp', 
        target: 'personalization',
        lineStyle: {
          width: 2,
          curveness: 0.2,
          color: '#999',
        }
      }
    ]
  };

  const detailGraphData = {
    nodes: [
      { 
        id: 'source1', 
        name: 'Source 1',
        symbolSize: 30,
        itemStyle: { color: '#5C6BC0' }
      },
      { 
        id: 'source2', 
        name: 'Source 2',
        symbolSize: 30,
        itemStyle: { color: '#5C6BC0' }
      },
      { 
        id: 'processing', 
        name: 'Data Processing',
        symbolSize: 40,
        itemStyle: { color: '#26C6DA' }
      },
      { 
        id: 'output', 
        name: 'Marketing Output',
        symbolSize: 30,
        itemStyle: { color: '#66BB6A' }
      }
    ],
    links: [
      { source: 'source1', target: 'processing' },
      { source: 'source2', target: 'processing' },
      { source: 'processing', target: 'output' }
    ]
  };

  const getChartOption = (data) => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      padding: [10, 15],
      textStyle: {
        color: '#333',
      },
      extraCssText: 'box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);',
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [{
      type: 'graph',
      layout: 'force',
      data: data.nodes,
      links: data.links,
      roam: true,
      draggable: true,
      label: {
        show: true,
        position: 'right',
        formatter: '{b}',
        fontSize: 12,
        fontWeight: 500,
        color: '#666',
      },
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: [4, 8],
      lineStyle: {
        color: '#ccc',
        curveness: 0.3,
        width: 2,
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 4,
          color: '#1976d2',
        },
        label: {
          color: '#1976d2',
        },
      },
      force: {
        repulsion: 350,
        edgeLength: 200,
        gravity: 0.1,
      },
      animation: true,
      animationDuration: 1500,
      animationEasing: 'cubicInOut',
    }]
  });

  const handleChartClick = (params) => {
    if (params.dataType === 'node' && params.data.itemStyle.color === '#66BB6A') {
      setSelectedNode(params.data);
    }
  };

  const handleBack = () => {
    setSelectedNode(null);
  };

  return (
    <div className={classes.root}>
      <Fade in={true} timeout={500}>
        <div>
          {selectedNode ? (
            <>
              <IconButton 
                className={classes.backButton}
                onClick={handleBack}
                size="small"
              >
                <ArrowBack /> Back to Overview
              </IconButton>
              <div className={classes.header}>
                <Typography className={classes.title}>
                  Data Flow Analysis: {selectedNode.name}
                </Typography>
                <Typography className={classes.subtitle}>
                  Showing detailed data flow from source systems through CDP
                </Typography>
              </div>
              <Paper className={classes.chartContainer}>
                <ReactECharts
                  option={getChartOption(detailGraphData)}
                  className={classes.chart}
                  onEvents={{
                    click: handleChartClick
                  }}
                  opts={{ renderer: 'canvas' }}
                />
              </Paper>
            </>
          ) : (
            <>
              <div className={classes.header}>
                <Typography className={classes.title}>
                  CDP Data Flow Overview
                </Typography>
                <Typography className={classes.subtitle}>
                  Click on any downstream system to view detailed data flow
                </Typography>
              </div>
              <Paper className={classes.chartContainer}>
                <ReactECharts
                  option={getChartOption(mainGraphData)}
                  className={classes.chart}
                  onEvents={{
                    click: handleChartClick
                  }}
                  opts={{ renderer: 'canvas' }}
                />
              </Paper>
            </>
          )}
        </div>
      </Fade>
    </div>
  );
}

export default DataFlow;
