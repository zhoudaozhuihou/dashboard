# Excel 文件结构说明

## Sheet: KPIs
| metric | value | trend | changePercentage |
|--------|--------|--------|-----------------|
| Total Users | 150000 | up | 15 |
| Active Users | 89000 | up | 12 |
| Response Time | 250 | down | -8 |
| Error Rate | 0.5 | down | -20 |

## Sheet: Organization
| department | subDepartment | teamName | teamType | apps |
|------------|---------------|----------|-----------|------|
| Group Platforms | Security | Security as a Platform | platformTeam | Risk Assessment System, Security Gateway |
| Group Platforms | Infrastructure | Cloud Platform | platformTeam | Cloud Manager, Resource Optimizer |
| Business Systems | Sales | Sales Analytics | streamTeam | Sales Dashboard, Lead Tracker |
| Business Systems | Marketing | Campaign Management | streamTeam | Campaign Tool, Email System |

## Sheet: DataFlow
| type | name | nodeType | value | category | subLabel | source | target |
|------|------|----------|--------|-----------|-----------|---------|---------|
| node | CRM System | source | 100 | Customer Data | Customer Data | | |
| node | Customer Data Platform | cdp | 150 | | | | |
| node | Marketing Automation | downstream | 60 | | downstream | | |
| link | | | 80 | | | CRM System | Customer Data Platform |
| link | | | 40 | | | Customer Data Platform | Marketing Automation |

## Sheet: Details
| system | nodeType | nodeName | value | source | target | linkValue |
|--------|----------|----------|--------|---------|---------|-----------|
| Customer Data Platform | input | Customer Data | 2000 | | | |
| Customer Data Platform | process | Data Integration | 2500 | | | |
| Customer Data Platform | output | Customer Profiles | 2000 | | | |
| Customer Data Platform | | | | Customer Data | Data Integration | 2000 |
| Customer Data Platform | | | | Data Integration | Customer Profiles | 2000 |
