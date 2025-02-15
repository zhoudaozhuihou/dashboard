const XLSX = require('xlsx');
const path = require('path');

// 创建模拟数据
const mockData = {
  // KPI 数据
  KPIs: [
    { metric: 'Total Users', value: 150000, trend: 'up', changePercentage: 15 },
    { metric: 'Active Users', value: 89000, trend: 'up', changePercentage: 12 },
    { metric: 'Response Time', value: 250, trend: 'down', changePercentage: -8 },
    { metric: 'Error Rate', value: 0.5, trend: 'down', changePercentage: -20 },
    { metric: 'System Uptime', value: 99.9, trend: 'up', changePercentage: 0.1 },
    { metric: 'Data Processing', value: 45000, trend: 'up', changePercentage: 25 }
  ],

  // 组织结构数据
  Organization: [
    { 
      department: 'Group Platforms',
      subDepartment: 'Security',
      teamName: 'Security as a Platform',
      teamType: 'platformTeam',
      apps: 'Risk Assessment System, Security Gateway, Identity Manager'
    },
    {
      department: 'Group Platforms',
      subDepartment: 'Infrastructure',
      teamName: 'Cloud Platform',
      teamType: 'platformTeam',
      apps: 'Cloud Manager, Resource Optimizer, Container Service'
    },
    {
      department: 'Group Platforms',
      subDepartment: 'Infrastructure',
      teamName: 'Network Team',
      teamType: 'platformTeam',
      apps: 'Network Monitor, Traffic Analyzer'
    },
    {
      department: 'Business Systems',
      subDepartment: 'Sales',
      teamName: 'Sales Analytics',
      teamType: 'streamTeam',
      apps: 'Sales Dashboard, Lead Tracker, Pipeline Manager'
    },
    {
      department: 'Business Systems',
      subDepartment: 'Marketing',
      teamName: 'Campaign Management',
      teamType: 'streamTeam',
      apps: 'Campaign Tool, Email System, Social Media Manager'
    },
    {
      department: 'Business Systems',
      subDepartment: 'Marketing',
      teamName: 'Digital Marketing',
      teamType: 'streamTeam',
      apps: 'SEO Tool, Content Manager, Analytics Dashboard'
    },
    {
      department: 'Data & Analytics',
      subDepartment: 'Core Platform',
      teamName: 'Data Platform',
      teamType: 'platformTeam',
      apps: 'Data Lake, ETL Service, Data Catalog'
    },
    {
      department: 'Data & Analytics',
      subDepartment: 'Analytics',
      teamName: 'Business Intelligence',
      teamType: 'streamTeam',
      apps: 'BI Dashboard, Report Generator, Data Visualizer'
    }
  ],

  // 数据流图数据
  DataFlow: [
    // Source Systems
    { type: 'node', name: 'CRM System', nodeType: 'source', value: 100, category: 'Customer Data', subLabel: 'Customer Data' },
    { type: 'node', name: 'Website Analytics', nodeType: 'source', value: 90, category: 'Behavioral Data', subLabel: 'Behavioral Data' },
    { type: 'node', name: 'Mobile App', nodeType: 'source', value: 85, category: 'Behavioral Data', subLabel: 'Behavioral Data' },
    { type: 'node', name: 'Email Platform', nodeType: 'source', value: 70, category: 'Marketing Data', subLabel: 'Marketing Data' },
    { type: 'node', name: 'POS System', nodeType: 'source', value: 80, category: 'Transaction Data', subLabel: 'Transaction Data' },
    
    // CDP Platform
    { type: 'node', name: 'Customer Data Platform', nodeType: 'cdp', value: 150 },
    
    // Downstream Systems
    { type: 'node', name: 'Marketing Automation', nodeType: 'downstream', value: 60, subLabel: 'downstream' },
    { type: 'node', name: 'Analytics Platform', nodeType: 'downstream', value: 70, subLabel: 'downstream' },
    { type: 'node', name: 'Personalization Engine', nodeType: 'downstream', value: 55, subLabel: 'downstream' },
    { type: 'node', name: 'Campaign Management', nodeType: 'downstream', value: 50, subLabel: 'downstream' },
    
    // Links: Source to CDP
    { type: 'link', source: 'CRM System', target: 'Customer Data Platform', value: 80 },
    { type: 'link', source: 'Website Analytics', target: 'Customer Data Platform', value: 70 },
    { type: 'link', source: 'Mobile App', target: 'Customer Data Platform', value: 65 },
    { type: 'link', source: 'Email Platform', target: 'Customer Data Platform', value: 50 },
    { type: 'link', source: 'POS System', target: 'Customer Data Platform', value: 60 },
    
    // Links: CDP to Downstream
    { type: 'link', source: 'Customer Data Platform', target: 'Marketing Automation', value: 40 },
    { type: 'link', source: 'Customer Data Platform', target: 'Analytics Platform', value: 45 },
    { type: 'link', source: 'Customer Data Platform', target: 'Personalization Engine', value: 35 },
    { type: 'link', source: 'Customer Data Platform', target: 'Campaign Management', value: 30 }
  ],

  // 详细数据
  Details: [
    // Customer Data Platform Nodes
    { system: 'Customer Data Platform', nodeType: 'input', nodeName: 'Customer Data', value: 2000 },
    { system: 'Customer Data Platform', nodeType: 'input', nodeName: 'Behavioral Data', value: 1500 },
    { system: 'Customer Data Platform', nodeType: 'input', nodeName: 'Marketing Data', value: 1200 },
    { system: 'Customer Data Platform', nodeType: 'input', nodeName: 'Transaction Data', value: 1000 },
    
    { system: 'Customer Data Platform', nodeType: 'process', nodeName: 'Data Integration', value: 2500 },
    { system: 'Customer Data Platform', nodeType: 'process', nodeName: 'Data Processing', value: 2000 },
    { system: 'Customer Data Platform', nodeType: 'process', nodeName: 'Data Analytics', value: 1800 },
    
    { system: 'Customer Data Platform', nodeType: 'output', nodeName: 'Customer Profiles', value: 2000 },
    { system: 'Customer Data Platform', nodeType: 'output', nodeName: 'Segmentation', value: 1500 },
    { system: 'Customer Data Platform', nodeType: 'output', nodeName: 'Campaign Analysis', value: 1300 },
    
    // Customer Data Platform Links
    { system: 'Customer Data Platform', source: 'Customer Data', target: 'Data Integration', linkValue: 2000 },
    { system: 'Customer Data Platform', source: 'Behavioral Data', target: 'Data Integration', linkValue: 1500 },
    { system: 'Customer Data Platform', source: 'Marketing Data', target: 'Data Processing', linkValue: 1200 },
    { system: 'Customer Data Platform', source: 'Transaction Data', target: 'Data Processing', linkValue: 1000 },
    
    { system: 'Customer Data Platform', source: 'Data Integration', target: 'Data Processing', linkValue: 2200 },
    { system: 'Customer Data Platform', source: 'Data Processing', target: 'Data Analytics', linkValue: 1800 },
    
    { system: 'Customer Data Platform', source: 'Data Analytics', target: 'Customer Profiles', linkValue: 2000 },
    { system: 'Customer Data Platform', source: 'Data Analytics', target: 'Segmentation', linkValue: 1500 },
    { system: 'Customer Data Platform', source: 'Data Analytics', target: 'Campaign Analysis', linkValue: 1300 }
  ]
};

// 创建工作簿
const workbook = XLSX.utils.book_new();

// 为每个数据集创建工作表
Object.entries(mockData).forEach(([sheetName, data]) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
});

// 保存 Excel 文件
const filePath = path.join(__dirname, '..', 'public', 'data', 'dashboard-data.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`Mock Excel file has been generated at: ${filePath}`);
