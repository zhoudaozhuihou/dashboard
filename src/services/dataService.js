import * as XLSX from 'xlsx';

// 模拟数据，用于开发测试
const mockDataFlowData = [
  {
    'source_system': 'System A',
    'source EIM ID': 'EIM001',
    'source file/total table count[daily/monthly table]': '1500',
    'downstream': 'System X',
    'downstream EIM ID': 'EIM101',
    'downstream share to GB/GF': '800'
  },
  {
    'source_system': 'System B',
    'source EIM ID': 'EIM002',
    'source file/total table count[daily/monthly table]': '2000',
    'downstream': 'System Y',
    'downstream EIM ID': 'EIM102',
    'downstream share to GB/GF': '1200'
  },
  {
    'source_system': 'System C',
    'source EIM ID': 'EIM003',
    'source file/total table count[daily/monthly table]': '1800',
    'downstream': 'System Z',
    'downstream EIM ID': 'EIM103',
    'downstream share to GB/GF': '900'
  }
];

// 用于解析 CSV 数据
const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
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
    if (row['source_system']) {
      sourceSystemSet.add(row['source_system']);
    }
    if (row['downstream']) {
      downstreamSystemSet.add(row['downstream']);
    }
  });

  // 创建节点数据
  const nodes = [];
  const links = [];
  
  // CDP 节点（中心节点）
  nodes.push({
    name: 'CDP',
    type: 'cdp',
    value: 2000,
    category: 1
  });

  // 源系统节点
  Array.from(sourceSystemSet).forEach(systemName => {
    const systemData = dataFlowData.find(row => row['source_system'] === systemName);
    if (systemData) {
      nodes.push({
        name: systemName,
        type: 'source',
        value: Number(systemData['source file/total table count[daily/monthly table]']) || 1000,
        category: 0,
        subLabel: systemData['source EIM ID']
      });
    }
  });

  // 下游系统节点
  Array.from(downstreamSystemSet).forEach(systemName => {
    const systemData = dataFlowData.find(row => row['downstream'] === systemName);
    if (systemData) {
      nodes.push({
        name: systemName,
        type: 'downstream',
        value: Number(systemData['downstream share to GB/GF']) || 1000,
        category: 2,
        subLabel: systemData['downstream EIM ID']
      });
    }
  });

  // 创建连接
  dataFlowData.forEach(row => {
    // 源系统到 CDP 的连接
    if (row['source_system']) {
      links.push({
        source: row['source_system'],
        target: 'CDP',
        value: Number(row['source file/total table count[daily/monthly table]']) || 100
      });
    }

    // CDP 到下游系统的连接
    if (row['downstream']) {
      links.push({
        source: 'CDP',
        target: row['downstream'],
        value: Number(row['downstream share to GB/GF']) || 100
      });
    }
  });

  console.log('Transformed main graph:', { nodes, links });
  return { nodes, links };
};

const transformDetailData = (dataFlowData) => {
  // 按下游系统名称分组
  const detailData = {};
  
  // 为每个下游系统创建桑基图数据
  const downstreamSystems = new Set(dataFlowData.map(row => row['downstream']));
  
  downstreamSystems.forEach(downstreamSystem => {
    if (!downstreamSystem) return;
    
    // 获取与此下游系统相关的所有行
    const relatedRows = dataFlowData.filter(row => 
      row['downstream'] === downstreamSystem
    );
    
    if (relatedRows.length === 0) return;

    const nodes = [];
    const links = [];
    
    // 获取下游系统的值
    const downstreamValue = Number(relatedRows[0]['downstream share to GB/GF']) || 1000;
    
    // 添加源系统节点和连接
    const sourceNodes = new Set(relatedRows.map(row => row['source_system']));
    sourceNodes.forEach(sourceName => {
      if (sourceName) {
        const sourceData = relatedRows.find(row => row['source_system'] === sourceName);
        const sourceValue = Number(sourceData['source file/total table count[daily/monthly table]']) || 1000;
        
        // 添加源系统节点
        nodes.push({
          name: sourceName,
          value: sourceValue
        });
        
        // 添加源系统到 CDP 的连接
        links.push({
          source: sourceName,
          target: 'CDP',
          value: downstreamValue // 使用下游系统的值
        });
      }
    });
    
    // 添加 CDP 节点
    nodes.push({
      name: 'CDP',
      value: downstreamValue // 使用下游系统的值
    });
    
    // 添加下游系统节点
    nodes.push({
      name: downstreamSystem,
      value: downstreamValue
    });
    
    // 添加 CDP 到下游系统的连接
    links.push({
      source: 'CDP',
      target: downstreamSystem,
      value: downstreamValue
    });
    
    detailData[downstreamSystem] = { nodes, links };
  });

  console.log('Transformed detail data:', detailData);
  return detailData;
};

export const loadDashboardData = async () => {
  try {
    console.log('Loading dashboard data...');
    
    // 在开发环境中使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock data in development mode');
      const mainGraph = transformMainGraph(mockDataFlowData);
      const detailData = transformDetailData(mockDataFlowData);
      
      return {
        dataFlowData: {
          mainGraph,
          detailData
        }
      };
    }
    
    // 读取 CSV 文件
    const response = await fetch('/data/dashboard-data.csv');
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
    // 使用模拟数据
    console.log('Using mock data due to error:', error.message);
    
    // 使用 CSV 文本作为模拟数据
    const mockCSV = `source_system,source EIM ID,source file/total table count[daily/monthly table],downstream,downstream EIM ID,downstream share to GB/GF
System A,EIM001,1500,System X,EIM101,800
System B,EIM002,2000,System Y,EIM102,1200
System C,EIM003,1800,System Z,EIM103,900`;
    
    const mockData = parseCSV(mockCSV);
    const mainGraph = transformMainGraph(mockData);
    const detailData = transformDetailData(mockData);
    
    return {
      dataFlowData: {
        mainGraph,
        detailData
      }
    };
  }
};
