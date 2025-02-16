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
<<<<<<< HEAD
  
  // 首先按SYS_CODE和SUB_SYS_CODE组合分组收集所有数据
  const sourceGroups = new Map();
  data.forEach(row => {
    const sysCode = row['SYS_CODE'] || '';
    const subSysCode = row['SUB_SYS_CODE'] || '';
    const key = `${sysCode}:${subSysCode}`;
    
    if (!sourceGroups.has(key)) {
      sourceGroups.set(key, {
        sysCode,
        subSysCode,
        eimId: row['Source EIM ID'] || 'None',  // 只取第一次遇到的 EIM ID
        applicationName: row['Source Application Name'] || 'Unknown',  // 只取第一次遇到的应用名称
        totalTables: 0
      });
    }
    
    const group = sourceGroups.get(key);
    group.totalTables += Number(row['Share to Downstream Table Count']) || 0;
  });

  // 创建源系统节点
  Array.from(sourceGroups.entries()).forEach(([key, group], index) => {
    sourceNodes.set(key, {
      id: `source_${index}`,
      name: group.applicationName,
      type: 'source',
      value: group.totalTables,
      symbolSize: Math.max(30, Math.min(70, Math.sqrt(group.totalTables) * 2)),
      eimId: group.eimId,
      sysCode: group.sysCode,
      subSysCode: group.subSysCode,
      x: 300,
      y: (index + 1) * 100
    });
=======
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
>>>>>>> parent of 081e439 (update)
  });

  // 将 GB/GF 信息添加到源系统节点
  sourceNodes.forEach((node, sourceName) => {
    const gbgfSet = sourceGbGf.get(sourceName);
    node.gbgf = gbgfSet ? Array.from(gbgfSet).join(',') : '';
    nodes.push(node);
  });

  // 处理下游系统
  const downstreamNodes = new Map();
  data.forEach(row => {
    const downstreamName = row['Downstream Application Name'];
    if (downstreamName && !downstreamNodes.has(downstreamName)) {
      downstreamNodes.set(downstreamName, {
        id: `target_${downstreamNodes.size}`,
        name: downstreamName,
        type: 'downstream',
        value: 0,
        eimId: row['Downstream EIM ID'] || '',  // 只取第一次遇到的 EIM ID
        x: 900,
        y: downstreamNodes.size * 100 + 100
      });
    }
    
    // 只更新值的累计
    if (downstreamName) {
      const node = downstreamNodes.get(downstreamName);
      node.value += Number(row['Share to Downstream Table Count']) || 0;
      node.symbolSize = Math.max(30, Math.min(70, Math.sqrt(node.value) * 2));
    }
  });
  nodes.push(...downstreamNodes.values());

<<<<<<< HEAD
  // 创建连接关系
  data.forEach((row) => {
    const sysCode = row['SYS_CODE'] || '';
    const subSysCode = row['SUB_SYS_CODE'] || '';
    const sourceKey = `${sysCode}:${subSysCode}`;
    const sourceNode = sourceNodes.get(sourceKey);
    const targetNode = downstreamNodes.get(row['Downstream Application Name']);
    
    if (sourceNode && targetNode) {
      const value = Number(row['Share to Downstream Table Count']) || 0;
      if (value > 0) {
        links.push({
          source: sourceNode.id,
          target: targetNode.id,
          value: value
        });
      }
    }
  });

  // 创建连接
  data.forEach((row, index) => {
    const sourceNode = Array.from(sourceNodes.values()).find(node => node.sysCode === row['SYS_CODE'] && node.subSysCode === row['SUB_SYS_CODE']);
    const targetNode = Array.from(downstreamNodes.values()).find(node => node.name === row['Downstream Application Name']);
=======
  // 创建连接
  data.forEach((row, index) => {
    const sourceNode = Array.from(sourceNodes.values()).find(node => node.name === row['Source system']);
    const targetNode = Array.from(targetNodes.values()).find(node => node.name === row['Downstream Application Name']);
>>>>>>> parent of 081e439 (update)
    
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
  
  const groupedData = {};
  dataFlowData.forEach(row => {
    if (!row['Downstream Application Name']) return;
    
    if (!groupedData[row['Downstream Application Name']]) {
      groupedData[row['Downstream Application Name']] = [];
    }
    
    groupedData[row['Downstream Application Name']].push(row);
  });

  // 处理每个下游系统的详细数据
  Object.keys(groupedData).forEach(downstreamSystem => {
    const relatedRows = groupedData[downstreamSystem];

    // 为子图创建节点和连接
    const nodes = [];
    const links = [];
<<<<<<< HEAD

    // 首先按SYS_CODE和SUB_SYS_CODE组合分组收集源系统数据
    const sourceGroups = new Map();
    relatedRows.forEach(row => {
      const sysCode = row['SYS_CODE'] || '';
      const subSysCode = row['SUB_SYS_CODE'] || '';
      const key = `${sysCode}:${subSysCode}`;
      
      if (!sourceGroups.has(key)) {
        sourceGroups.set(key, {
          sysCode,
          subSysCode,
          eimId: row['Source EIM ID'] || 'None',  // 只取第一次遇到的 EIM ID
          applicationName: row['Source Application Name'] || 'Unknown',  // 只取第一次遇到的应用名称
          sourceFileTables: 0,
          shareTables: 0
        });
      }
      
      const group = sourceGroups.get(key);
      group.sourceFileTables += Number(row['Source File/Table Count']) || 0;
      group.shareTables += Number(row['Share to Downstream Table Count']) || 0;
    });

    // 创建源系统节点
    Array.from(sourceGroups.entries()).forEach(([key, group], index) => {
      nodes.push({
        name: group.applicationName,
        value: group.sourceFileTables,
        type: 'source',
        eimId: group.eimId,
        sysCode: group.sysCode,
        subSysCode: group.subSysCode,
        x: 300,
        y: index * 100 + 100
      });

      // 创建到CDP的连接
      links.push({
        source: group.applicationName,
        target: 'CDP',
        value: group.shareTables
      });
    });

    // 添加CDP中间节点
    const totalValue = relatedRows.reduce((sum, row) =>
      sum + (Number(row['Share to Downstream Table Count']) || 0), 0);

    nodes.push({
      name: 'CDP',
      value: totalValue,
      type: 'cdp',
      x: 600,
      y: 300
    });

    // 添加下游系统节点
    const downstreamNodes = new Map();
    relatedRows.forEach(row => {
      const downstreamName = row['Downstream Application Name'];
      if (downstreamName && !downstreamNodes.has(downstreamName)) {
        downstreamNodes.set(downstreamName, {
          name: downstreamName,
          value: Number(row['Share to Downstream Table Count']) || 0,
          type: 'downstream',
          eimId: row['Downstream EIM ID'] || '',  // 只取第一次遇到的 EIM ID
          x: 900,
          y: downstreamNodes.size * 100 + 100
=======
    
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
>>>>>>> parent of 081e439 (update)
        });
      } else if (downstreamName) {
        const node = downstreamNodes.get(downstreamName);
        node.value += Number(row['Share to Downstream Table Count']) || 0;
      }
    });
<<<<<<< HEAD
    nodes.push(...downstreamNodes.values());

    // 创建CDP到下游系统的连接
    links.push({
      source: 'CDP',
      target: downstreamNodes.values().next().value.name,
      value: totalValue
    });

=======
    
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
    
>>>>>>> parent of 081e439 (update)
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
