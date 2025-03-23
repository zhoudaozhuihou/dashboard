# CDP Analytics Dashboard

A modern React-based dashboard for Customer Data Platform (CDP) analytics visualization.

## Features

- Overview of key CDP metrics and KPIs
- Interactive organization structure visualization
- Real-time data flow monitoring
- Responsive and modern Material-UI design
- Interactive charts using ECharts

## Prerequisites

- Node.js (version 16.x or higher recommended)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd react-analytics-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will start on http://localhost:3001

## Project Structure

```
src/
  ├── components/         # React components
  │   ├── Overview.js    # Dashboard overview component
  │   ├── Organization.js # Organization structure visualization
  │   └── DataFlow.js    # Data flow visualization
  ├── styles/            # Global styles
  │   └── global.css     # Global CSS styles
  ├── theme.js           # Material-UI theme configuration
  ├── App.js             # Main application component
  └── index.js           # Application entry point
```

## Technologies Used

- React 17.0.1
- Material-UI 4.12.4
- ECharts 5.0.0
- React Router 5.2.0
- Redux 4.0.5

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details


项目的整体架构（React + Material UI + ECharts），数据结构设计（节点类型、连接关系、布局规则），以及交互功能（节点分层、大小区分、悬停效果）。这些内容将被整理成清晰的提示词格式，便于后续开发和维护。

本项目是一个基于React的数据关系可视化应用，以下是项目的主要设计要点：

数据结构设计：

- 节点类型：DataPlatform（数据平台）、Source（数据源）、Downstream（下游应用），部分Source节点可同时作为Downstream
- 节点属性：包含id、type、label等基本信息
- 连接关系：通过links数组定义节点间的有向连接
布局设计：

- 三列布局：左侧Source节点、中间DataPlatform节点、右侧Downstream节点
- 分层显示：Source节点4层、DataPlatform节点1层、Downstream节点6层
- 自适应：支持窗口大小变化自动调整
视觉设计：

- 节点大小：基于连接数动态计算，DataPlatform固定40px，其他节点根据连接数增加
- 节点颜色：DataPlatform蓝色、Source绿色、Downstream粉色、混合类型紫色
- 连接线：灰色半透明曲线，支持悬停高亮相关节点
交互功能：

- 节点提示：显示节点标签、类型和连接数
- 关联高亮：悬停时突出显示相关节点和连接
- 自适应布局：响应式设计，支持全屏显示
技术栈：

- React 17
- Material-UI v4：页面样式和布局
- ECharts 5：图表渲染和交互
- 响应式设计：支持各种屏幕尺寸
