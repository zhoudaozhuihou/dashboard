import * as XLSX from 'xlsx';

const transformMainGraph = (dataFlowData) => {
  console.log('Transforming main graph data:', dataFlowData);
  
  const nodes = dataFlowData
    .filter(row => row.type === 'node')
    .map(node => ({
      name: node.name,
      type: node.nodeType,
      value: Number(node.value) || 1000,
      category: node.category,
      subLabel: node.subLabel
    }));

  const links = dataFlowData
    .filter(row => row.type === 'link')
    .map(link => ({
      source: link.source,
      target: link.target,
      value: Number(link.value) || 100
    }));

  console.log('Transformed nodes:', nodes);
  console.log('Transformed links:', links);

  return { nodes, links };
};

const transformDetailData = (detailData) => {
  console.log('Raw detail data:', detailData);
  
  // 按系统名称分组
  const systemGroups = {};
  detailData.forEach(row => {
    if (!row.system) return;
    
    if (!systemGroups[row.system]) {
      systemGroups[row.system] = [];
    }
    systemGroups[row.system].push(row);
  });

  console.log('System groups:', systemGroups);

  // 转换每个系统的数据
  const transformedData = {};
  Object.entries(systemGroups).forEach(([system, rows]) => {
    console.log(`Processing system ${system}:`, rows);

    // 收集所有节点和值
    const nodeMap = new Map();
    rows.forEach(row => {
      if (row.source) {
        if (!nodeMap.has(row.source)) {
          nodeMap.set(row.source, 0);
        }
        nodeMap.set(row.source, nodeMap.get(row.source) + Number(row.value || 0));
      }
      if (row.target) {
        if (!nodeMap.has(row.target)) {
          nodeMap.set(row.target, 0);
        }
        nodeMap.set(row.target, nodeMap.get(row.target) + Number(row.value || 0));
      }
    });

    // 创建节点数组
    const nodes = Array.from(nodeMap.entries()).map(([name, value]) => ({
      name,
      value: value || 1000
    }));

    // 创建链接数组
    const links = rows
      .filter(row => row.source && row.target)
      .map(row => ({
        source: row.source,
        target: row.target,
        value: Number(row.value) || 100
      }));

    if (nodes.length > 0 && links.length > 0) {
      transformedData[system] = { nodes, links };
      console.log(`Transformed data for system ${system}:`, transformedData[system]);
    }
  });

  return transformedData;
};

export const loadDashboardData = async () => {
  try {
    console.log('Loading dashboard data...');
    const response = await fetch('/data/dashboard-data.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);

    // 读取各个sheet的数据
    const kpiData = XLSX.utils.sheet_to_json(workbook.Sheets['KPIs']) || [];
    const organizationData = XLSX.utils.sheet_to_json(workbook.Sheets['Organization']) || [];
    const dataFlowData = XLSX.utils.sheet_to_json(workbook.Sheets['DataFlow']) || [];
    const detailData = XLSX.utils.sheet_to_json(workbook.Sheets['Details']) || [];

    console.log('Raw data loaded:', {
      kpiData: kpiData.length,
      organizationData: organizationData.length,
      dataFlowData: dataFlowData.length,
      detailData: detailData.length
    });

    // 转换数据流图数据
    const mainGraph = transformMainGraph(dataFlowData);
    
    // 转换详细数据
    const transformedDetailData = transformDetailData(detailData);

    // 转换组织数据结构
    const departments = organizationData.reduce((acc, row) => {
      const { department, subDepartment, teamName, teamType, apps } = row;
      
      let dept = acc.find(d => d.department === department);
      if (!dept) {
        dept = { department, subDepartments: [] };
        acc.push(dept);
      }

      let subDept = dept.subDepartments.find(sd => sd.name === subDepartment);
      if (!subDept) {
        subDept = { name: subDepartment, teams: [] };
        dept.subDepartments.push(subDept);
      }

      const appList = apps ? apps.split(',').map(app => app.trim()) : [];
      subDept.teams.push({
        name: teamName,
        type: teamType,
        apps: appList
      });

      return acc;
    }, []);

    const result = {
      kpiData,
      organizationData: { departments },
      dataFlowData: {
        mainGraph,
        detailData: transformedDetailData
      }
    };

    console.log('Final transformed data:', {
      kpiDataCount: result.kpiData.length,
      departmentsCount: result.organizationData.departments.length,
      mainGraphNodes: result.dataFlowData.mainGraph.nodes.length,
      mainGraphLinks: result.dataFlowData.mainGraph.links.length,
      detailDataSystems: Object.keys(result.dataFlowData.detailData)
    });

    return result;
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw error;
  }
};
