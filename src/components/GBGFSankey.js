import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSelector } from 'react-redux';
import { selectDataFlowData } from '../features/dashboard/dashboardSlice';

const GBGFSankey = () => {
  const dataFlowData = useSelector(selectDataFlowData);

  const getOption = useMemo(() => {
    if (!dataFlowData.rawData) return {};

    const nodes = [];
    const links = [];
    const sourceGBGFSet = new Set();
    const downstreamGBGFSet = new Set();

    // 收集所有唯一的 GB/GF 值
    dataFlowData.rawData.forEach(row => {
      const sourceGBGFs = row['Source GB/GF'].split(',').map(v => v.trim());
      const downstreamGBGFs = row['Downstream GB/GF'].split(',').map(v => v.trim());
      
      sourceGBGFs.forEach(gbgf => sourceGBGFSet.add(gbgf));
      downstreamGBGFs.forEach(gbgf => downstreamGBGFSet.add(gbgf));
    });

    // 创建节点
    const sourceNodes = Array.from(sourceGBGFSet).map(name => ({
      name: `Source ${name}`,
      itemStyle: { color: '#67C23A' }
    }));

    // 添加 CDP 节点
    const cdpNode = {
      name: 'CDP',
      itemStyle: { color: '#E6A23C' }
    };

    const downstreamNodes = Array.from(downstreamGBGFSet).map(name => ({
      name: `Downstream ${name}`,
      itemStyle: { color: '#409EFF' }
    }));

    nodes.push(...sourceNodes, cdpNode, ...downstreamNodes);

    // 创建连接
    const sourceLinkMap = new Map();
    const downstreamLinkMap = new Map();

    dataFlowData.rawData.forEach(row => {
      const sourceGBGFs = row['Source GB/GF'].split(',').map(v => v.trim());
      const downstreamGBGFs = row['Downstream GB/GF'].split(',').map(v => v.trim());
      const tableCount = parseInt(row['Total CDP Table Count']) || 1;
      
      // Source to CDP links
      sourceGBGFs.forEach(source => {
        const key = `Source ${source}`;
        const value = sourceLinkMap.get(key) || 0;
        sourceLinkMap.set(key, value + tableCount);
      });

      // CDP to Downstream links
      downstreamGBGFs.forEach(target => {
        const key = `Downstream ${target}`;
        const value = downstreamLinkMap.get(key) || 0;
        downstreamLinkMap.set(key, value + tableCount);
      });
    });

    // Add Source to CDP links
    sourceLinkMap.forEach((value, source) => {
      links.push({
        source: source,
        target: 'CDP',
        value: value
      });
    });

    // Add CDP to Downstream links
    downstreamLinkMap.forEach((value, target) => {
      links.push({
        source: 'CDP',
        target: target,
        value: value
      });
    });

    return {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params) => {
          if (params.dataType === 'edge') {
            return `${params.data.source} → ${params.data.target}<br/>Tables: ${params.data.value}`;
          }
          return params.name.replace('Source ', '').replace('Downstream ', '');
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
        nodeAlign: 'justify',
        data: nodes,
        links: links,
        lineStyle: {
          color: 'gradient',
          opacity: 0.6,
          curveness: 0.5
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params) => params.name.replace('Source ', '').replace('Downstream ', ''),
          fontSize: 12,
          color: '#333'
        }
      }]
    };
  }, [dataFlowData]);

  return (
    <ReactECharts
      option={getOption}
      style={{ height: '800px' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default GBGFSankey;
