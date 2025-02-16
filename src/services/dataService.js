import * as XLSX from 'xlsx';

// 用于解析 CSV 数据
const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    // 处理可能包含逗号的字段（在引号内的逗号不应该分割）
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    // 移除值中的引号
    const cleanValues = values.map(value => value.replace(/^"(.*)"$/, '$1').trim());
    
    return headers.reduce((obj, header, index) => {
      obj[header] = cleanValues[index];
      return obj;
    }, {});
  }).filter(row => Object.values(row).some(value => value)); // 过滤掉空行
};

const transformMainGraph = (data) => {
  const nodes = [];
  const links = [];

  // 添加 CDP 节点
  const cdpNode = {
    id: 'CDP',
    name: 'CDP',
    type: 'cdp',
    value: 0,
    symbolSize: 80,
    x: 500,
    y: 300,
    fixed: true
  };
  nodes.push(cdpNode);

  // 处理源系统，并记录它们的 GB/GF 关系
  const sourceNodes = new Map();
  const sourceGbGf = new Map(); // 用于存储源系统的 GB/GF 关系

  data.forEach((row, index) => {
    if (row['Source system'] && !sourceNodes.has(row['Source system'])) {
      const sourceId = `source_${index}`;
      const sourceValue = Number(row['Source File/Table Count']) || 0;
      sourceNodes.set(row['Source system'], {
        id: sourceId,
        name: row['Source system'],
        type: 'source',
        value: sourceValue,
        symbolSize: Math.max(30, Math.min(70, Math.sqrt(sourceValue) * 2)),
        applicationName: row['Source Application Name'],
        eimId: row['Source EIM ID'],
        x: 100,
        y: (index + 1) * 100
      });

      // 记录源系统的 GB/GF
      if (!sourceGbGf.has(row['Source system'])) {
        sourceGbGf.set(row['Source system'], new Set());
      }
      if (row['GB/GF']) {
        row['GB/GF'].split(',').forEach(gbgf => 
          sourceGbGf.get(row['Source system']).add(gbgf.trim())
        );
      }
    } else if (row['Source system'] && row['GB/GF']) {
      // 为已存在的源系统添加新的 GB/GF
      row['GB/GF'].split(',').forEach(gbgf => 
        sourceGbGf.get(row['Source system']).add(gbgf.trim())
      );
    }
  });

  // 将 GB/GF 信息添加到源系统节点
  sourceNodes.forEach((node, sourceName) => {
    const gbgfSet = sourceGbGf.get(sourceName);
    node.gbgf = gbgfSet ? Array.from(gbgfSet).join(',') : '';
    nodes.push(node);
  });

  // 处理下游系统
  const targetNodes = new Map();
  data.forEach((row, index) => {
    if (row['Downstream Application Name'] && !targetNodes.has(row['Downstream Application Name'])) {
      const targetId = `target_${index}`;
      const targetValue = Number(row['Share to Downstream Table Count']) || 0;
      targetNodes.set(row['Downstream Application Name'], {
        id: targetId,
        name: row['Downstream Application Name'],
        type: 'downstream',
        value: targetValue,
        symbolSize: Math.max(30, Math.min(70, Math.sqrt(targetValue) * 2)),
        eimId: row['Downstream EIM ID'],
        gbgf: row['GB/GF'],
        x: 900,
        y: (index + 1) * 100
      });
    }
  });
  nodes.push(...targetNodes.values());

  // 创建连接
  data.forEach((row, index) => {
    const sourceNode = Array.from(sourceNodes.values()).find(node => node.name === row['Source system']);
    const targetNode = Array.from(targetNodes.values()).find(node => node.name === row['Downstream Application Name']);
    
    if (sourceNode && targetNode) {
      // 只在源系统和目标系统都存在时创建连接
      links.push({
        id: `link_source_${index}`,
        source: sourceNode.id,
        target: 'CDP',
        value: Number(row['Total CDP Table Count(Include Daliy/Monthly Table)']) || 0,
        gbgf: row['GB/GF'], // 添加 GB/GF 信息到连接
        lineStyle: {
          width: 2,
          curveness: 0.2
        }
      });

      links.push({
        id: `link_target_${index}`,
        source: 'CDP',
        target: targetNode.id,
        value: Number(row['Share to Downstream Table Count']) || 0,
        gbgf: row['GB/GF'], // 添加 GB/GF 信息到连接
        lineStyle: {
          width: 2,
          curveness: 0.2
        }
      });
    }
  });

  // 更新 CDP 节点的总值
  cdpNode.value = data.reduce((sum, row) => 
    sum + (Number(row['Total CDP Table Count(Include Daliy/Monthly Table)']) || 0), 0);

  return { nodes, links };
};

const transformDetailData = (dataFlowData) => {
  const detailData = {};
  
  const downstreamSystems = new Set(dataFlowData.map(row => row['Downstream Application Name']));
  
  downstreamSystems.forEach(downstreamSystem => {
    if (!downstreamSystem) return;
    
    const relatedRows = dataFlowData.filter(row => 
      row['Downstream Application Name'] === downstreamSystem
    );
    
    if (relatedRows.length === 0) return;

    const nodes = [];
    const links = [];
    
    // 计算此下游系统的总 Share to Downstream Table Count
    const totalShareCount = relatedRows.reduce((sum, row) => 
      sum + (Number(row['Share to Downstream Table Count']) || 0), 0);

    // 添加源系统节点
    const sourceNodes = new Set(relatedRows.map(row => row['Source system']));
    sourceNodes.forEach(sourceName => {
      if (sourceName) {
        const sourceData = relatedRows.find(row => row['Source system'] === sourceName);
        const sourceValue = Number(sourceData['Source File/Table Count']) || 1000;
        nodes.push({
          name: sourceName,  // 显示 Source system
          value: sourceValue,
          sourceSystem: true,  // 标记为源系统节点
          applicationName: sourceData['Source Application Name'],  // 用于悬停显示
          eimId: sourceData['Source EIM ID'],  // 用于悬停显示
          itemStyle: {
            color: '#722ed1'
          }
        });

        // 添加源系统到 CDP 的连接
        links.push({
          source: sourceName,
          target: 'CDP',
          value: Number(sourceData['Total CDP Table Count(Include Daliy/Monthly Table)']) || 100
        });
      }
    });
    
    // 添加 CDP 节点
    nodes.push({
      name: 'CDP',
      value: totalShareCount,
      itemStyle: {
        color: '#1890ff'
      }
    });
    
    // 添加下游系统节点
    nodes.push({
      name: downstreamSystem,  // Downstream Application Name
      value: totalShareCount,
      eimId: relatedRows[0]['Downstream EIM ID'],  // 直接显示
      itemStyle: {
        color: '#13c2c2'
      }
    });
    
    // 添加 CDP 到下游系统的连接
    links.push({
      source: 'CDP',
      target: downstreamSystem,
      value: totalShareCount
    });
    
    detailData[downstreamSystem] = { nodes, links };
  });

  console.log('Transformed detail data:', detailData);
  return detailData;
};

export const transformData = (data) => {
  if (!data || !Array.isArray(data)) {
    console.error('Invalid data format');
    return null;
  }

  console.log('Starting data transformation...');
  const mainGraph = transformMainGraph(data);
  console.log('Main graph transformed:', mainGraph);
  
  const detailData = transformDetailData(data);
  console.log('Detail data transformed:', detailData);

  const transformedData = {
    mainGraph,
    detailData,
    rawData: data
  };

  console.log('Final transformed data:', transformedData);
  return transformedData;
};

export const loadDashboardData = async () => {
  try {
    console.log('Loading dashboard data...');
    
    // 读取 CSV 文件
    const response = await fetch('/data/CDP-Dashboard-Data.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('CSV text loaded:', csvText.substring(0, 200) + '...');
    
    const dataFlowData = parseCSV(csvText);
    console.log('Parsed CSV data:', dataFlowData);

    if (dataFlowData.length === 0) {
      console.error('No data found in CSV file!');
      throw new Error('No data found in CSV file');
    }

    // 转换数据
    const transformedData = transformData(dataFlowData);
    console.log('Final transformed data:', transformedData);

    return transformedData;
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw error;
  }
};
