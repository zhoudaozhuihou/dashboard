import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  kpiData: [
    {
      label: 'Active Users',
      value: 45021,
      change: 12.5
    },
    {
      label: 'Data Sources',
      value: 8,
      change: 0
    },
    {
      label: 'Events Today',
      value: '2.1M',
      change: 8.3
    },
    {
      label: 'Conversion Rate',
      value: '3.2%',
      change: -2.1
    }
  ],
  dataFlowData: {
    mainGraph: {
      nodes: [
        // Source Systems (左侧紫色节点)
        { name: 'CRM System', type: 'source', value: 100, category: 'Customer Data', subLabel: 'Customer Data' },
        { name: 'Website Analytics', type: 'source', value: 90, category: 'Behavioral Data', subLabel: 'Behavioral Data' },
        { name: 'Mobile App', type: 'source', value: 85, category: 'Behavioral Data', subLabel: 'Behavioral Data' },
        { name: 'Email Platform', type: 'source', value: 70, category: 'Marketing Data', subLabel: 'Marketing Data' },
        { name: 'POS System', type: 'source', value: 80, category: 'Transaction Data', subLabel: 'Transaction Data' },

        // CDP Platform (中间蓝色节点)
        { name: 'Customer Data Platform', type: 'cdp', value: 150 },

        // Downstream Systems (右侧绿色节点)
        { name: 'Marketing Automation', type: 'downstream', value: 60, subLabel: 'downstream' },
        { name: 'Analytics Platform', type: 'downstream', value: 70, subLabel: 'downstream' },
        { name: 'Personalization Engine', type: 'downstream', value: 55, subLabel: 'downstream' },
        { name: 'Campaign Management', type: 'downstream', value: 50, subLabel: 'downstream' }
      ],
      links: [
        // Source to CDP
        { source: 'CRM System', target: 'Customer Data Platform', value: 80 },
        { source: 'Website Analytics', target: 'Customer Data Platform', value: 70 },
        { source: 'Mobile App', target: 'Customer Data Platform', value: 65 },
        { source: 'Email Platform', target: 'Customer Data Platform', value: 50 },
        { source: 'POS System', target: 'Customer Data Platform', value: 60 },

        // CDP to Downstream
        { source: 'Customer Data Platform', target: 'Marketing Automation', value: 40 },
        { source: 'Customer Data Platform', target: 'Analytics Platform', value: 45 },
        { source: 'Customer Data Platform', target: 'Personalization Engine', value: 35 },
        { source: 'Customer Data Platform', target: 'Campaign Management', value: 30 }
      ]
    },
    detailData: {
      'Customer Data Platform': {
        nodes: [
          // 输入层
          { name: 'Customer Data', value: 2000 },
          { name: 'Behavioral Data', value: 1500 },
          { name: 'Marketing Data', value: 1200 },
          { name: 'Transaction Data', value: 1000 },
          
          // 处理层
          { name: 'Data Integration', value: 2500 },
          { name: 'Data Processing', value: 2000 },
          { name: 'Data Analytics', value: 1800 },
          
          // 输出层
          { name: 'Customer Profiles', value: 2000 },
          { name: 'Segmentation', value: 1500 },
          { name: 'Campaign Analysis', value: 1300 }
        ],
        links: [
          // 输入到处理层
          { source: 'Customer Data', target: 'Data Integration', value: 2000 },
          { source: 'Behavioral Data', target: 'Data Integration', value: 1500 },
          { source: 'Marketing Data', target: 'Data Processing', value: 1200 },
          { source: 'Transaction Data', target: 'Data Processing', value: 1000 },
          
          // 处理层内部
          { source: 'Data Integration', target: 'Data Processing', value: 2200 },
          { source: 'Data Processing', target: 'Data Analytics', value: 1800 },
          
          // 处理层到输出层
          { source: 'Data Analytics', target: 'Customer Profiles', value: 2000 },
          { source: 'Data Analytics', target: 'Segmentation', value: 1500 },
          { source: 'Data Analytics', target: 'Campaign Analysis', value: 1300 }
        ]
      }
    }
  },
  detailData: {
    'Customer Data Platform': {
      nodes: [
        // 输入层
        { name: 'Customer Data', value: 2000 },
        { name: 'Behavioral Data', value: 1500 },
        { name: 'Marketing Data', value: 1200 },
        { name: 'Transaction Data', value: 1000 },
        
        // 处理层
        { name: 'Data Integration', value: 2500 },
        { name: 'Data Processing', value: 2000 },
        { name: 'Data Analytics', value: 1800 },
        
        // 输出层
        { name: 'Customer Profiles', value: 2000 },
        { name: 'Segmentation', value: 1500 },
        { name: 'Campaign Analysis', value: 1300 }
      ],
      links: [
        // 输入到处理层
        { source: 'Customer Data', target: 'Data Integration', value: 2000 },
        { source: 'Behavioral Data', target: 'Data Integration', value: 1500 },
        { source: 'Marketing Data', target: 'Data Processing', value: 1200 },
        { source: 'Transaction Data', target: 'Data Processing', value: 1000 },
        
        // 处理层内部
        { source: 'Data Integration', target: 'Data Processing', value: 2200 },
        { source: 'Data Processing', target: 'Data Analytics', value: 1800 },
        
        // 处理层到输出层
        { source: 'Data Analytics', target: 'Customer Profiles', value: 2000 },
        { source: 'Data Analytics', target: 'Segmentation', value: 1500 },
        { source: 'Data Analytics', target: 'Campaign Analysis', value: 1300 }
      ]
    }
  },
  organizationData: {
    departments: [
      {
        department: 'WFG Analytics',
        subDepartments: [
          {
            name: 'Risk Management',
            teams: [
              { 
                name: 'Security as a Platform', 
                type: 'platformTeam',
                apps: ['Risk Assessment System', 'Security Gateway', 'Auth Service']
              },
              { 
                name: 'Risk & WFG', 
                type: 'platformTeam',
                apps: ['Risk Scoring Engine', 'Fraud Detection System']
              }
            ]
          }
        ]
      },
      {
        department: 'Wholesale Analytics',
        subDepartments: [
          {
            name: 'Customer Analytics',
            teams: [
              { 
                name: 'KYC Operations Utility', 
                type: 'analyticsTeam',
                apps: ['KYC Workflow', 'Document Verification System']
              },
              { 
                name: 'KYC Analytics', 
                type: 'analyticsTeam',
                apps: ['Customer Risk Assessment', 'AML Screening']
              }
            ]
          }
        ]
      },
      {
        department: 'Control and Analytics',
        subDepartments: [
          {
            name: 'Financial Control',
            teams: [
              { 
                name: 'Financial Resource Management', 
                type: 'analyticsTeam',
                apps: ['Resource Planning System', 'Budget Management']
              },
              { 
                name: 'MRA Operations Utility', 
                type: 'analyticsTeam',
                apps: ['Risk Analytics Dashboard', 'Compliance Monitoring']
              }
            ]
          },
          {
            name: 'Risk Analytics',
            teams: [
              { 
                name: 'Test & Scenario Hub', 
                type: 'analyticsTeam',
                apps: ['Scenario Generator', 'Test Automation Platform']
              },
              { 
                name: 'MRA Analytics', 
                type: 'analyticsTeam',
                apps: ['Risk Modeling System', 'Analytics Dashboard']
              }
            ]
          }
        ]
      },
      {
        department: 'Functions',
        subDepartments: [
          {
            name: 'Communication',
            teams: [
              { 
                name: 'Messaging', 
                type: 'monitoringTeam',
                apps: ['Message Queue System', 'Communication Platform']
              },
              { 
                name: 'Front Controls', 
                type: 'monitoringTeam',
                apps: ['Access Control System', 'Authentication Service']
              }
            ]
          },
          {
            name: 'Integration',
            teams: [
              { 
                name: 'Channels - Digital Platforms and APIs', 
                type: 'monitoringTeam',
                apps: ['API Gateway', 'Integration Hub', 'Service Mesh']
              },
              { 
                name: 'Business Process and Functions', 
                type: 'monitoringTeam',
                apps: ['Workflow Engine', 'Process Automation']
              }
            ]
          }
        ]
      },
      {
        department: 'Group Platforms',
        subDepartments: [
          {
            name: 'Test',
            teams: [
              { 
                name: 'Security as a Platform', 
                type: 'platformTeam',
                apps: ['Identity Management', 'Access Control']
              },
              { 
                name: 'Risk & WFG', 
                type: 'platformTeam',
                apps: ['Risk Assessment', 'Fraud Detection']
              },
              { 
                name: 'Credit Decisioning Systems', 
                type: 'platformTeam',
                apps: ['Credit Scoring', 'Decision Engine']
              },
              { 
                name: 'KYC Operations Utility', 
                type: 'analyticsTeam',
                apps: ['KYC Portal', 'Document Management']
              },
              { 
                name: 'KYC Analytics', 
                type: 'analyticsTeam',
                apps: ['Analytics Dashboard', 'Reporting System']
              },
              { 
                name: 'Financial Resource Management', 
                type: 'analyticsTeam',
                apps: ['Resource Planning', 'Financial Analytics']
              },
              { 
                name: 'MRA Operations Utility', 
                type: 'analyticsTeam',
                apps: ['Operations Dashboard', 'Monitoring System']
              },
              { 
                name: 'Test & Scenario Hub', 
                type: 'analyticsTeam',
                apps: ['Test Management', 'Scenario Builder']
              },
              { 
                name: 'MRA Analytics', 
                type: 'analyticsTeam',
                apps: ['Risk Analytics', 'Reporting Platform']
              },
              { 
                name: 'MRA Supervision & NFR', 
                type: 'analyticsTeam',
                apps: ['Supervision Portal', 'NFR Dashboard']
              },
              { 
                name: 'Messaging', 
                type: 'monitoringTeam',
                apps: ['Message Bus', 'Event Processing']
              },
              { 
                name: 'Front Controls', 
                type: 'monitoringTeam',
                apps: ['Control Panel', 'Monitoring Dashboard']
              },
              { 
                name: 'Channels - Digital Platforms and APIs', 
                type: 'monitoringTeam',
                apps: ['API Management', 'Digital Services']
              },
              { 
                name: 'Onboarding, KYC & CDD', 
                type: 'monitoringTeam',
                apps: ['Onboarding Portal', 'CDD System']
              },
              { 
                name: 'Required Forms', 
                type: 'monitoringTeam',
                apps: ['Forms Management', 'Document Processing']
              },
              { 
                name: 'Regulatory Compliance', 
                type: 'monitoringTeam',
                apps: ['Compliance System', 'Audit Trail']
              },
              { 
                name: 'Business Process and Functions', 
                type: 'monitoringTeam',
                apps: ['BPM System', 'Function Registry']
              },
              { 
                name: 'Data', 
                type: 'monitoringTeam',
                apps: ['Data Lake', 'Analytics Platform']
              },
              { 
                name: 'Local Banking', 
                type: 'platformTeam',
                apps: ['Banking Core', 'Transaction System']
              }
            ]
          }
        ]
      }
    ]
  }
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // 如果需要添加 reducers，可以在这里添加
  }
});

// Selectors
export const selectKpiData = (state) => state.dashboard.kpiData;
export const selectDataFlowData = (state) => state.dashboard.dataFlowData;
export const selectDetailData = (state) => state.dashboard.detailData;
export const selectOrganizationData = (state) => state.dashboard.organizationData;

export default dashboardSlice.reducer;
