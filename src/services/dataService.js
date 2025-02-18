import * as XLSX from 'xlsx';

/**
 * CSV 文件处理注意事项：
 * 1. 文件编码：确保 CSV 文件使用 UTF-8 编码，避免中文乱码
 * 2. 分隔符：默认使用逗号分隔，如果数据中包含逗号，需要用引号包裹
 * 3. 列名要求：
 *    - 必须包含以下列：
 *      * Source GB/GF：源系统的 GB/GF，多个值用逗号分隔
 *      * Downstream GB/GF：下游系统的 GB/GF，多个值用逗号分隔
 *      * Total CDP Table Count：用于计算流量权重
 *    - 列名大小写敏感，必须完全匹配
 * 4. 数据格式：
 *    - GB/GF 值中不能包含逗号，如有多个值应该用引号包裹
 *    - 数字列（如 Table Count）必须是有效的数字
 */

/**
 * 解析 CSV 文本内容
 * @param {string} csvText - CSV 文件的文本内容
 * @returns {Array<Object>} 解析后的数据数组
 */
const parseCSV = (csvText) => {
  // 按行分割，处理不同操作系统的换行符
  const lines = csvText.split(/\r\n|\n|\r/);
  // 获取并处理表头，移除空格
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    // 处理可能包含逗号的字段（在引号内的逗号不应该分割）
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    // 字符级别的解析，确保正确处理引号内的逗号
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
    
    // 将值与表头对应，创建对象
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
        eimId: row['Source EIM ID'] || 'None',  
        applicationName: row['Source Application Name'] || 'Unknown',  
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
    sourceNodes.set(key, {
      id: `source_${index}`,
      name: group.applicationName,
      type: 'source',
      value: group.sourceFileTables,  
      symbolSize: Math.max(30, Math.min(70, Math.sqrt(group.sourceFileTables) * 2)),
      eimId: group.eimId,
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

/**
 * 加载仪表板数据
 * 注意事项：
 * 1. 文件路径：确保 CSV 文件位于正确的目录（public/data/）
 * 2. 错误处理：
 *    - 文件不存在
 *    - 解析错误
 *    - 数据格式错误
 * 3. 数据验证：
 *    - 检查必需的列是否存在
 *    - 验证数据格式是否正确
 */
export const loadDashboardData = async () => {
  try {
    console.log('Loading dashboard data...');
    
    // 读取 CSV 文件
    const response = await fetch('./data/CDP-Dashboard-Data.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV file: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('CSV text loaded:', csvText.substring(0, 200) + '...');
    
    // 解析 CSV 数据
    const dataFlowData = parseCSV(csvText);
    console.log('Parsed CSV data:', dataFlowData);

    // 数据验证
    if (dataFlowData.length === 0) {
      throw new Error('No data found in CSV file');
    }

    // 验证必需的列
    const requiredColumns = ['Source GB/GF', 'Downstream GB/GF', 'Total CDP Table Count'];
    const firstRow = dataFlowData[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // 验证数据格式
    const invalidRows = dataFlowData.filter(row => {
      const tableCount = parseInt(row['Total CDP Table Count']);
      return isNaN(tableCount) || !row['Source GB/GF'] || !row['Downstream GB/GF'];
    });
    if (invalidRows.length > 0) {
      console.warn(`Found ${invalidRows.length} rows with invalid data format`);
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
