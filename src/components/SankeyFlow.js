import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Paper } from '@material-ui/core';
import ReactECharts from 'echarts-for-react';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
    backgroundColor: '#1e1e1e',
    minHeight: 'calc(100vh - 64px)',
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
}));

const SankeyFlow = () => {
  const classes = useStyles();
  const dataFlowData = useSelector((state) => state.dashboard.dataFlowData);

  const processedData = useMemo(() => {
    if (!dataFlowData?.rawData) {
      return null;
    }

    const nodes = [];
    const links = [];
    const sourceSystemMap = new Map();
    const downstreamAppMap = new Map();

    // 处理数据，按Source system和Downstream Application Name聚合
    dataFlowData.rawData.forEach(row => {
      const sourceSystem = row['Source system'] || 'Unknown';
      const sourceTableCount = parseInt(row['c']) || 0;
      const sharedTableCount = parseInt(row['Share to Downstream Table Count']) || 0;
      const downstreamName = row['Downstream Application Name'] || 'Unknown';

      // 更新源系统数据
      let sourceNode = sourceSystemMap.get(sourceSystem);
      if (!sourceNode) {
        sourceNode = {
          name: sourceSystem,
          value: 0
        };
        sourceSystemMap.set(sourceSystem, sourceNode);
      }
      sourceNode.value += sourceTableCount;

      // 更新下游系统数据
      let downstreamNode = downstreamAppMap.get(downstreamName);
      if (!downstreamNode) {
        downstreamNode = {
          name: downstreamName,
          value: 0
        };
        downstreamAppMap.set(downstreamName, downstreamNode);
      }
      downstreamNode.value += sharedTableCount;
    });

    // 添加节点
    const sourceNodes = Array.from(sourceSystemMap.values())
      .filter(node => node.value > 0)
      .sort((a, b) => b.value - a.value);

    const downstreamNodes = Array.from(downstreamAppMap.values())
      .filter(node => node.value > 0)
      .sort((a, b) => b.value - a.value);

    // 添加所有源系统节点
    sourceNodes.forEach(node => {
      nodes.push({
        name: node.name,
        itemStyle: { color: '#67C23A' }
      });
    });

    // 添加CDP节点
    nodes.push({
      name: 'CDP',
      itemStyle: { color: '#1890ff' }
    });

    // 添加所有下游系统节点
    downstreamNodes.forEach(node => {
      nodes.push({
        name: node.name,
        itemStyle: { color: '#E6A23C' }
      });
    });

    // 添加源系统到CDP的链接
    sourceNodes.forEach(node => {
      links.push({
        source: node.name,
        target: 'CDP',
        value: node.value
      });
    });

    // 添加CDP到下游系统的链接
    downstreamNodes.forEach(node => {
      links.push({
        source: 'CDP',
        target: node.name,
        value: node.value
      });
    });

    return { nodes, links };
  }, [dataFlowData]);

  const option = useMemo(() => {
    if (!processedData) {
      return {};
    }

    return {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: function(params) {
          const data = params.data;
          if (params.dataType === 'node') {
            return [
              '<div style="font-weight: bold; margin-bottom: 10px;">System Details</div>',
              '<table style="width:100%; border-collapse: collapse;">',
              '<tr>',
              '<td style="padding: 4px 8px;">Name:</td>',
              `<td style="padding: 4px 8px;">${params.name}</td>`,
              '</tr>',
              '</table>'
            ].join('');
          } else if (params.dataType === 'edge') {
            return [
              '<div style="font-weight: bold; margin-bottom: 10px;">Flow Details</div>',
              '<table style="width:100%; border-collapse: collapse;">',
              '<tr>',
              '<td style="padding: 4px 8px;">From:</td>',
              `<td style="padding: 4px 8px;">${data.source}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">To:</td>',
              `<td style="padding: 4px 8px;">${data.target}</td>`,
              '</tr>',
              '<tr>',
              '<td style="padding: 4px 8px;">Tables:</td>',
              `<td style="padding: 4px 8px;">${data.value.toLocaleString()}</td>`,
              '</tr>',
              '</table>'
            ].join('');
          }
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
        data: processedData.nodes,
        links: processedData.links,
        lineStyle: {
          color: 'source',
          opacity: 0.6,
          curveness: 0.5
        }
      }]
    };
  }, [processedData]);

  return (
    <div className={classes.root}>
      <Paper className={classes.flowContainer}>
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </Paper>
    </div>
  );
};

export default SankeyFlow;
