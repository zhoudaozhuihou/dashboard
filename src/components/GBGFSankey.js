import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSelector } from 'react-redux';
import { selectDataFlowData } from '../features/dashboard/dashboardSlice';

/**
 * GB/GF 桑基图组件
 * 数据处理注意事项：
 * 1. 数据格式要求：
 *    - Source GB/GF：必须是逗号分隔的字符串
 *    - Downstream GB/GF：必须是逗号分隔的字符串
 *    - Total CDP Table Count：必须是有效的数字
 * 
 * 2. 数据处理流程：
 *    a. 收集所有唯一的 GB/GF 值
 *    b. 创建三类节点：源系统、CDP、下游系统
 *    c. 计算连接权重：使用表数量作为权重
 * 
 * 3. 图表配置：
 *    - 节点颜色：源系统(绿)、CDP(橙)、下游系统(蓝)
 *    - 布局：justify 模式使节点均匀分布
 *    - 连线：使用渐变色和半透明效果
 */
const GBGFSankey = () => {
  const dataFlowData = useSelector(selectDataFlowData);

  const getOption = useMemo(() => {
    if (!dataFlowData.rawData) return {};

    const nodes = [];
    const links = [];
    const sourceGBGFSet = new Set();
    const downstreamGBGFSet = new Set();

    // 第一步：收集所有唯一的 GB/GF 值
    dataFlowData.rawData.forEach(row => {
      // 注意：split 前先检查是否存在值，避免空值导致错误
      const sourceGBGFs = (row['Source GB/GF'] || '').split(',').map(v => v.trim()).filter(Boolean);
      const downstreamGBGFs = (row['Downstream GB/GF'] || '').split(',').map(v => v.trim()).filter(Boolean);
      
      sourceGBGFs.forEach(gbgf => sourceGBGFSet.add(gbgf));
      downstreamGBGFs.forEach(gbgf => downstreamGBGFSet.add(gbgf));
    });

    // 第二步：创建节点
    // 2.1 源系统节点（绿色）
    const sourceNodes = Array.from(sourceGBGFSet).map(name => ({
      name: `Source ${name}`,
      itemStyle: { color: '#67C23A' }
    }));

    // 2.2 CDP 节点（橙色）
    const cdpNode = {
      name: 'CDP',
      itemStyle: { color: '#E6A23C' }
    };

    // 2.3 下游系统节点（蓝色）
    const downstreamNodes = Array.from(downstreamGBGFSet).map(name => ({
      name: `Downstream ${name}`,
      itemStyle: { color: '#409EFF' }
    }));

    // 2.4 合并所有节点
    nodes.push(...sourceNodes, cdpNode, ...downstreamNodes);

    // 第三步：创建连接
    const sourceLinkMap = new Map();
    const downstreamLinkMap = new Map();

    // 3.1 计算连接权重
    dataFlowData.rawData.forEach(row => {
      const sourceGBGFs = (row['Source GB/GF'] || '').split(',').map(v => v.trim()).filter(Boolean);
      const downstreamGBGFs = (row['Downstream GB/GF'] || '').split(',').map(v => v.trim()).filter(Boolean);
      // 使用表数量作为权重，如果无效则默认为 1
      const tableCount = parseInt(row['Total CDP Table Count']) || 1;
      
      // 3.2 源系统到 CDP 的连接
      sourceGBGFs.forEach(source => {
        const key = `Source ${source}`;
        const value = sourceLinkMap.get(key) || 0;
        sourceLinkMap.set(key, value + tableCount);
      });

      // 3.3 CDP 到下游系统的连接
      downstreamGBGFs.forEach(target => {
        const key = `Downstream ${target}`;
        const value = downstreamLinkMap.get(key) || 0;
        downstreamLinkMap.set(key, value + tableCount);
      });
    });

    // 第四步：创建连接对象
    // 4.1 源系统到 CDP 的连接
    sourceLinkMap.forEach((value, source) => {
      links.push({
        source: source,
        target: 'CDP',
        value: value
      });
    });

    // 4.2 CDP 到下游系统的连接
    downstreamLinkMap.forEach((value, target) => {
      links.push({
        source: 'CDP',
        target: target,
        value: value
      });
    });

    // 第五步：返回图表配置
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
