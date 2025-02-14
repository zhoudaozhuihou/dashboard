import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Paper, IconButton, Fade } from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import ReactECharts from 'echarts-for-react';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
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
      // Source Systems (Level 1)
      { name: 'CRM System', value: 5000 },
      { name: 'Website Analytics', value: 3000 },
      { name: 'Mobile App', value: 4000 },
      { name: 'Email Platform', value: 2000 },
      { name: 'Social Media', value: 1500 },
      
      // CDP (Level 2)
      { name: 'Customer Data Platform', value: 15500 },
      
      // Downstream Systems (Level 3)
      { name: 'Marketing Automation', value: 6000 },
      { name: 'Analytics Platform', value: 5000 },
      { name: 'Personalization Engine', value: 4500 }
    ],
    links: [
      // Source Systems to CDP
      { source: 'CRM System', target: 'Customer Data Platform', value: 5000 },
      { source: 'Website Analytics', target: 'Customer Data Platform', value: 3000 },
      { source: 'Mobile App', target: 'Customer Data Platform', value: 4000 },
      { source: 'Email Platform', target: 'Customer Data Platform', value: 2000 },
      { source: 'Social Media', target: 'Customer Data Platform', value: 1500 },
      
      // CDP to Downstream Systems
      { source: 'Customer Data Platform', target: 'Marketing Automation', value: 6000 },
      { source: 'Customer Data Platform', target: 'Analytics Platform', value: 5000 },
      { source: 'Customer Data Platform', target: 'Personalization Engine', value: 4500 }
    ]
  };

  const detailGraphData = {
    nodes: [
      // Input Layer
      { name: 'User Profiles', value: 2000 },
      { name: 'Behavioral Data', value: 1500 },
      { name: 'Transaction History', value: 1000 },
      
      // CDP Layer
      { name: 'Customer Data Platform', value: 4500 },
      
      // Output Layer
      { name: 'Campaign Targeting', value: 1800 },
      { name: 'Journey Orchestration', value: 1400 },
      { name: 'Performance Analytics', value: 1300 }
    ],
    links: [
      // Input to CDP
      { source: 'User Profiles', target: 'Customer Data Platform', value: 2000 },
      { source: 'Behavioral Data', target: 'Customer Data Platform', value: 1500 },
      { source: 'Transaction History', target: 'Customer Data Platform', value: 1000 },
      
      // CDP to Output
      { source: 'Customer Data Platform', target: 'Campaign Targeting', value: 1800 },
      { source: 'Customer Data Platform', target: 'Journey Orchestration', value: 1400 },
      { source: 'Customer Data Platform', target: 'Performance Analytics', value: 1300 }
    ]
  };

  const getMainChartOption = (data) => ({
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
      data: data.nodes.map(node => {
        let x, category;
        if (node.name === 'Customer Data Platform') {
          x = 0.5;
          category = 1;
        } else if (['Marketing Automation', 'Analytics Platform', 'Personalization Engine'].includes(node.name)) {
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
          const sourceNodes = data.nodes.filter(n => !['Customer Data Platform', 'Marketing Automation', 'Analytics Platform', 'Personalization Engine'].includes(n.name));
          const index = sourceNodes.findIndex(n => n.name === node.name);
          y = (index + 1) / (sourceNodes.length + 1);
        } else {
          const targetNodes = data.nodes.filter(n => ['Marketing Automation', 'Analytics Platform', 'Personalization Engine'].includes(n.name));
          const index = targetNodes.findIndex(n => n.name === node.name);
          y = (index + 1) / (targetNodes.length + 1);
        }

        return {
          ...node,
          x: x * 100,
          y: y * 100,
          // 修改节点大小计算方式，使面积与数据大小成正比
          symbolSize: Math.sqrt(node.value) * 0.3,
          symbol: 'circle',
          category: category,
          itemStyle: {
            color: category === 1 ? '#2980b9' : 
                   category === 2 ? '#e056fd' : '#58B19F',
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            shadowBlur: 10
          },
          label: {
            show: true,
            position: category === 0 ? 'left' : category === 2 ? 'right' : 'bottom',
            distance: category === 1 ? 5 : 0,
            formatter: '{b}',
            fontSize: 12,
            color: '#555'
          }
        };
      }),
      links: data.links.map(link => ({
        ...link,
        lineStyle: {
          width: Math.sqrt(link.value) * 0.15,  // 增强连线粗细
          color: 'source',
          opacity: 0.6,
          curveness: 0.2
        }
      })),
      categories: [
        { name: 'Source Systems' },
        { name: 'CDP' },
        { name: 'Downstream' }
      ],
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 10
        }
      },
      roam: true,
      draggable: false,
      animation: true,
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut'
    }]
  });

  const getDetailChartOption = (data) => ({
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
    series: [{
      type: 'sankey',
      data: data.nodes,
      links: data.links,
      emphasis: {
        focus: 'adjacency'
      },
      levels: [
        {
          depth: 0,
          itemStyle: {
            color: '#58B19F'
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        },
        {
          depth: 1,
          itemStyle: {
            color: '#2980b9'
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        },
        {
          depth: 2,
          itemStyle: {
            color: '#e056fd'
          }
        }
      ],
      lineStyle: {
        curveness: 0.5,
        opacity: 0.6
      },
      itemStyle: {
        borderWidth: 1,
        borderColor: '#fff'
      },
      label: {
        position: 'right',
        fontSize: 12,
        color: '#555'
      }
    }]
  });

  const handleChartClick = (params) => {
    if (params.dataType === 'node' && !selectedNode) {
      const outputNodes = ['Marketing Automation', 'Analytics Platform', 'Personalization Engine'];
      if (outputNodes.includes(params.name)) {
        setSelectedNode(params.name);
      }
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
                  Detailed Flow Analysis: {selectedNode}
                </Typography>
                <Typography className={classes.subtitle}>
                  Showing detailed data processing flow
                </Typography>
              </div>
              <Paper className={classes.chartContainer}>
                <ReactECharts
                  option={getDetailChartOption(detailGraphData)}
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
                  Click on any downstream system to view detailed flow
                </Typography>
              </div>
              <Paper className={classes.chartContainer}>
                <ReactECharts
                  option={getMainChartOption(mainGraphData)}
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
