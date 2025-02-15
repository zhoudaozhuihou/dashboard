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

const transformMainGraph = (dataFlowData) => {
  console.log('Raw DataFlow data:', dataFlowData);
  
  // 创建唯一的系统节点集合
  const sourceSystemSet = new Set();
  const downstreamSystemSet = new Set();
  
  dataFlowData.forEach(row => {
    console.log('Processing row:', row);
    if (row['Source system'] && row['Source system'].trim()) {
      sourceSystemSet.add(row['Source system'].trim());
    }
    if (row['Downstream Application Name'] && row['Downstream Application Name'].trim()) {
      downstreamSystemSet.add(row['Downstream Application Name'].trim());
    }
  });

  console.log('Source systems:', Array.from(sourceSystemSet));
  console.log('Downstream systems:', Array.from(downstreamSystemSet));
  
  // 创建节点数据
  const nodes = [];
  const links = [];
  
  // CDP 节点（中心节点）
  const totalCDPValue = dataFlowData.reduce((sum, row) => 
    sum + (Number(row['Total CDP Table Count(Include Daliy/Monthly Table)']) || 0), 0);

  nodes.push({
    name: 'CDP',
    type: 'cdp',
    value: totalCDPValue,
    category: 1
  });

  // 源系统节点
  Array.from(sourceSystemSet).forEach(systemName => {
    const systemRows = dataFlowData.filter(row => row['Source system'] === systemName);
    if (systemRows.length > 0) {
      const systemData = systemRows[0];
      const sourceValue = Number(systemData['Source File/Table Count']) || 0;
      
      console.log('Creating source node:', {
        name: systemName,
        value: sourceValue,
        applicationName: systemData['Source Application Name'],
        eimId: systemData['Source EIM ID']
      });

      nodes.push({
        name: systemName,
        type: 'source',
        value: sourceValue,
        category: 0,
        applicationName: systemData['Source Application Name'],
        eimId: systemData['Source EIM ID'],
        sysCode: systemData['SYS_CODE'],
        subSysCode: systemData['SUB_SYS_CODE']
      });
    }
  });

  // 下游系统节点
  Array.from(downstreamSystemSet).forEach(systemName => {
    const systemRows = dataFlowData.filter(row => row['Downstream Application Name'] === systemName);
    if (systemRows.length > 0) {
      const systemData = systemRows[0];
      const totalShareCount = systemRows
        .reduce((sum, row) => sum + (Number(row['Share to Downstream Table Count']) || 0), 0);

      nodes.push({
        name: systemName,
        type: 'downstream',
        value: totalShareCount,
        category: 2,
        eimId: systemData['Downstream EIM ID'],
        gbgf: systemData['GB/GF']
      });
    }
  });

  // 创建连接
  dataFlowData.forEach(row => {
    const sourceValue = Number(row['Total CDP Table Count(Include Daliy/Monthly Table)']) || 0;
    const targetValue = Number(row['Share to Downstream Table Count']) || 0;

    // 源系统到 CDP 的连接
    if (row['Source system'] && row['Source system'].trim()) {
      console.log('Creating source link:', {
        source: row['Source system'].trim(),
        target: 'CDP',
        value: sourceValue
      });

      links.push({
        source: row['Source system'].trim(),
        target: 'CDP',
        value: sourceValue
      });
    }

    // CDP 到下游系统的连接
    if (row['Downstream Application Name'] && row['Downstream Application Name'].trim()) {
      links.push({
        source: 'CDP',
        target: row['Downstream Application Name'].trim(),
        value: targetValue
      });
    }
  });

  // 调整节点大小计算
  const maxSourceCount = Math.max(...nodes.filter(n => n.type === 'source').map(n => n.value), 1);
  const maxDownstreamCount = Math.max(...nodes.filter(n => n.type === 'downstream').map(n => n.value), 1);
  const maxCount = Math.max(maxSourceCount, maxDownstreamCount);
  const minSize = 40;
  const maxSize = 100;

  nodes.forEach(node => {
    if (node.type === 'source' || node.type === 'downstream') {
      // 使用平方根比例来计算节点大小，确保面积与数值成正比
      const ratio = Math.sqrt(node.value / maxCount);
      node.symbolSize = minSize + (maxSize - minSize) * ratio;
    } else {
      // CDP 节点大小基于其总值
      const ratio = Math.sqrt(node.value / maxCount);
      node.symbolSize = minSize + (maxSize - minSize) * ratio * 1.2; // CDP 节点稍大一些
    }
  });

  console.log('Final nodes:', nodes);
  console.log('Final links:', links);
  
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

export const loadDashboardData = async () => {
  try {
    console.log('Loading dashboard data...');
    
    // 读取 CSV 文件
    const response = await fetch('/data/CDP-Dashboard-Data.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const dataFlowData = parseCSV(csvText);
    
    console.log('Parsed CSV data:', dataFlowData);

    if (dataFlowData.length === 0) {
      console.error('No data found in CSV file!');
      throw new Error('No data found in CSV file');
    }

    // 转换数据
    const mainGraph = transformMainGraph(dataFlowData);
    const detailData = transformDetailData(dataFlowData);

    return {
      dataFlowData: {
        mainGraph,
        detailData
      }
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw error;
  }
};
