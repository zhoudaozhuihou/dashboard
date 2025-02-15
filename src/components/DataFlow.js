import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Paper, IconButton, Fade, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
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
  selectEmpty: {
    marginTop: theme.spacing(2),
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
  const [selectedGBGF, setSelectedGBGF] = useState('all');
  const dataFlowData = useSelector(selectDataFlowData);

  // 获取所有唯一的 GB/GF 值
  const gbgfOptions = useMemo(() => {
    if (!dataFlowData?.mainGraph) return ['all'];
    
    const gbgfSet = new Set();
    dataFlowData.mainGraph.nodes
      .filter(node => node.type === 'downstream' && node.gbgf)
      .forEach(node => {
        const values = node.gbgf.split(',').map(v => v.trim());
        values.forEach(v => gbgfSet.add(v));
      });
    
    return ['all', ...Array.from(gbgfSet)].sort();
  }, [dataFlowData]);

  // 根据选择的 GB/GF 筛选数据
  const filteredMainGraph = useMemo(() => {
    if (!dataFlowData?.mainGraph || selectedGBGF === 'all') {
      return dataFlowData?.mainGraph;
    }

    const { nodes: originalNodes, links: originalLinks } = dataFlowData.mainGraph;
    
    // 筛选下游节点
    const filteredDownstreamNodes = originalNodes.filter(node => 
      node.type === 'downstream' && 
      node.gbgf && 
      node.gbgf.split(',').map(v => v.trim()).includes(selectedGBGF)
    );

    // 获取下游节点的名称集合
    const downstreamNames = new Set(filteredDownstreamNodes.map(node => node.name));

    // 筛选相关的 CDP 到下游系统的连接
    const filteredCdpLinks = originalLinks.filter(link =>
      link.source === 'CDP' && downstreamNames.has(link.target)
    );

    // 找出与选定 GB/GF 相关的源系统
    const sourceSystemsForGBGF = new Set();
    originalLinks.forEach(link => {
      // 如果这个连接指向了筛选后的下游系统
      if (link.source === 'CDP' && downstreamNames.has(link.target)) {
        // 找出连接到这个下游系统的所有源系统
        originalLinks.forEach(sourceLink => {
          if (sourceLink.target === 'CDP') {
            // 检查这个源系统是否确实通过 CDP 连接到了筛选后的下游系统
            const hasPathToDownstream = originalLinks.some(l => 
              l.source === 'CDP' && 
              downstreamNames.has(l.target) && 
              l.target !== link.target
            );
            if (hasPathToDownstream) {
              sourceSystemsForGBGF.add(sourceLink.source);
            }
          }
        });
      }
    });

    // 筛选相关的源系统节点
    const filteredSourceNodes = originalNodes.filter(node =>
      node.type === 'source' && sourceSystemsForGBGF.has(node.name)
    );

    // 获取源系统到 CDP 的连接
    const filteredSourceLinks = originalLinks.filter(link =>
      link.target === 'CDP' && sourceSystemsForGBGF.has(link.source)
    );

    // 组合所有节点和连接
    const nodes = [
      ...filteredSourceNodes,
      originalNodes.find(node => node.type === 'cdp'),
      ...filteredDownstreamNodes
    ].filter(Boolean);

    const links = [
      ...filteredSourceLinks,
      ...filteredCdpLinks
    ];

    return { nodes, links };
  }, [dataFlowData, selectedGBGF]);

  const handleGBGFChange = (event) => {
    setSelectedGBGF(event.target.value);
  };

  const mainGraph = useMemo(() => {
    return filteredMainGraph || { nodes: [], links: [] };
  }, [filteredMainGraph]);

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
          if (node.type === 'source') {
            return `<div style="font-weight: bold; margin-bottom: 4px;">${node.applicationName}</div>
                    EIM ID: ${node.eimId}<br/>
                    Tables: ${node.value.toLocaleString()}`;
          } else if (node.type === 'downstream') {
            return `<div style="font-weight: bold; margin-bottom: 4px;">${node.name}</div>
                    EIM ID: ${node.eimId}<br/>
                    Tables: ${node.value.toLocaleString()}`;
          }
          return `<div style="font-weight: bold; margin-bottom: 4px;">${node.name}</div>
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
              symbol: 'circle',
              label: {
                show: true,
                position: node.type === 'source' ? 'left' : node.type === 'downstream' ? 'right' : 'inside',
                color: node.type === 'cdp' ? '#fff' : '#333',
                fontSize: node.type === 'cdp' ? 14 : 12,
                fontWeight: 'bold',
                formatter: function(params) {
                  if (params.data.type === 'source') {
                    return [
                      '{name|' + params.data.name + '}',
                      '{value|' + params.data.value.toLocaleString() + ' tables}'
                    ].join('\n');
                  } else if (params.data.type === 'downstream') {
                    return [
                      '{name|' + params.data.name + '}',
                      '{eimId|' + params.data.eimId + '}',
                      '{value|' + params.data.value.toLocaleString() + ' tables}'
                    ].join('\n');
                  } else {
                    return [
                      '{name|China Data Platform}',
                      '{value|CDP}'
                    ].join('\n');
                  }
                },
                rich: {
                  name: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    padding: [0, 0, 4, 0],
                    color: node.type === 'cdp' ? '#fff' : '#333'
                  },
                  eimId: {
                    fontSize: 12,
                    color: node.type === 'cdp' ? '#fff' : '#666',
                    padding: [0, 0, 4, 0]
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
              width: Math.max(1, Math.log(link.value) * 2),
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
          if (params.dataType === 'node') {
            if (params.name === 'CDP') {
              return `<div style="font-weight: bold; margin-bottom: 4px;">China Data Platform (CDP)</div>
                      Tables: ${params.value.toLocaleString()}`;
            } else if (params.data.sourceSystem) {
              return `<div style="font-weight: bold; margin-bottom: 4px;">${params.data.applicationName}</div>
                      EIM ID: ${params.data.eimId}<br/>
                      Tables: ${params.value.toLocaleString()}`;
            } else {
              return `<div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
                      EIM ID: ${params.data.eimId}<br/>
                      Tables: ${params.value.toLocaleString()}`;
            }
          }
          return `<div style="font-weight: bold; margin-bottom: 4px;">Data Flow</div>
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
      <div className={classes.header}>
        <div className={classes.titleSection}>
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
        </div>
        {viewType === 'main' && (
          <div className={classes.filterSection}>
            <FormControl className={classes.formControl}>
              <InputLabel id="gbgf-filter-label">GB/GF Filter</InputLabel>
              <Select
                labelId="gbgf-filter-label"
                id="gbgf-filter"
                value={selectedGBGF}
                onChange={handleGBGFChange}
              >
                {gbgfOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option === 'all' ? 'All GB/GF' : option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        )}
      </div>
      <Fade in={true} timeout={500}>
        <Paper className={classes.flowContainer}>
          <ReactECharts
            option={viewType === 'main' 
              ? getMainChartOption() 
              : getDetailChartOption(selectedNode)}
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
