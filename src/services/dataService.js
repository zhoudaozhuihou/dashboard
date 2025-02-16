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

  // 处理源系统
  const sourceNodes = new Map();
  
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
        eimIds: new Set(),
        applicationNames: new Set(),
        totalTables: 0
      });
    }
    
    const group = sourceGroups.get(key);
    if (row['Source EIM ID']) {
      group.eimIds.add(row['Source EIM ID']);
    }
    if (row['Source Application Name']) {
      group.applicationNames.add(row['Source Application Name']);
    }
    group.totalTables += Number(row['Share to Downstream Table Count']) || 0;
  });

  // 创建源系统节点
  Array.from(sourceGroups.entries()).forEach(([key, group], index) => {
    // 获取去重后的EIM IDs数组，如果为空则使用['None']
    const eimIdsArray = Array.from(group.eimIds);
    const eimId = eimIdsArray.length > 0 ? eimIdsArray[0] : 'None';
    
    // 获取应用名称数组的第一个值
    const applicationNames = Array.from(group.applicationNames);
    const applicationName = applicationNames.length > 0 ? applicationNames[0] : 'Unknown';

    sourceNodes.set(key, {
      id: `source_${index}`,
      name: applicationName,
      type: 'source',
      value: group.totalTables,
      symbolSize: Math.max(30, Math.min(70, Math.sqrt(group.totalTables) * 2)),
      eimId: eimId,
      sysCode: group.sysCode,
      subSysCode: group.subSysCode,
      x: 300,
      y: (index + 1) * 100
    });
  });

  // 将 GB/GF 信息添加到源系统节点
  sourceNodes.forEach((node, sourceName) => {
    const gbgfSet = new Set(data.filter(row => row['SYS_CODE'] === node.sysCode && row['SUB_SYS_CODE'] === node.subSysCode).map(row => row['GB/GF']));
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

  // 创建连接关系
  data.forEach((row) => {
    const sysCode = row['SYS_CODE'] || '';
    const subSysCode = row['SUB_SYS_CODE'] || '';
    const sourceKey = `${sysCode}:${subSysCode}`;
    const sourceNode = sourceNodes.get(sourceKey);
    const targetNode = targetNodes.get(row['Downstream Application Name']);
    
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
          eimIds: new Set(),
          applicationNames: new Set(),
          totalTables: 0,
          sourceFileTables: 0
        });
      }
      
      const group = sourceGroups.get(key);
      if (row['Source EIM ID']) {
        group.eimIds.add(row['Source EIM ID']);
      }
      if (row['Source Application Name']) {
        group.applicationNames.add(row['Source Application Name']);
      }
      group.totalTables += Number(row['Share to Downstream Table Count']) || 0;
      group.sourceFileTables += Number(row['Source File/Table Count']) || 0;
    });

    // 计算此下游系统的总 Share to Downstream Table Count
    const totalShareCount = relatedRows.reduce((sum, row) => 
      sum + (Number(row['Share to Downstream Table Count']) || 0), 0);

    // 创建源系统节点
    Array.from(sourceGroups.entries()).forEach(([key, group], index) => {
      // 获取去重后的EIM IDs数组，如果为空则使用['None']
      const eimIdsArray = Array.from(group.eimIds);
      const eimId = eimIdsArray.length > 0 ? eimIdsArray[0] : 'None';
      
      // 获取应用名称数组的第一个值
      const applicationNames = Array.from(group.applicationNames);
      const applicationName = applicationNames.length > 0 ? applicationNames[0] : 'Unknown';

      nodes.push({
        name: applicationName,
        value: group.sourceFileTables,
        type: 'source',
        eimId: eimId,
        sysCode: group.sysCode,
        subSysCode: group.subSysCode,
        x: 300,
        y: index * 100 + 100
      });

      // 创建到CDP的连接
      links.push({
        source: applicationName,
        target: 'CDP',
        value: group.totalTables
      });
    });

    // 添加CDP中间节点
    nodes.push({
      name: 'CDP',
      value: totalShareCount,
      type: 'cdp',
      x: 600,
      y: 300
    });

    // 添加下游系统节点
    const targetNodes = new Set(relatedRows.map(row => row['Downstream Application Name']));
    targetNodes.forEach(targetName => {
      if (targetName) {
        const targetData = relatedRows.find(row => row['Downstream Application Name'] === targetName);
        const targetValue = Number(targetData['Share to Downstream Table Count']) || 0;
        nodes.push({
          name: targetName,
          value: targetValue,
          type: 'downstream',
          eimId: targetData['Downstream EIM ID'] || '',
          x: 900,
          y: nodes.length * 100
        });

        // 创建CDP到下游系统的连接
        links.push({
          source: 'CDP',
          target: targetName,
          value: targetValue
        });
      }
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
