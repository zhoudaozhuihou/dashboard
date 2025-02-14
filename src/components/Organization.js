import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Paper } from '@material-ui/core';
import ReactECharts from 'echarts-for-react';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  chartContainer: {
    padding: theme.spacing(3),
    height: 'calc(100vh - 250px)',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  },
  chart: {
    height: '100%',
  },
}));

function Organization() {
  const classes = useStyles();

  const data = {
    name: 'CDP Organization',
    children: [
      {
        name: 'Engineering',
        value: 40,
        children: [
          {
            name: 'Backend',
            value: 15,
            children: [
              { name: 'API Team', value: 8 },
              { name: 'Database Team', value: 7 },
            ],
          },
          {
            name: 'Frontend',
            value: 12,
            children: [
              { name: 'UI Team', value: 6 },
              { name: 'UX Team', value: 6 },
            ],
          },
          {
            name: 'DevOps',
            value: 13,
            children: [
              { name: 'Infrastructure', value: 7 },
              { name: 'CI/CD', value: 6 },
            ],
          },
        ],
      },
      {
        name: 'Product',
        value: 25,
        children: [
          {
            name: 'Product Management',
            value: 15,
            children: [
              { name: 'Strategy', value: 8 },
              { name: 'Analytics', value: 7 },
            ],
          },
          {
            name: 'Design',
            value: 10,
            children: [
              { name: 'Product Design', value: 5 },
              { name: 'Research', value: 5 },
            ],
          },
        ],
      },
      {
        name: 'Data Science',
        value: 20,
        children: [
          {
            name: 'Machine Learning',
            value: 12,
            children: [
              { name: 'ML Engineers', value: 7 },
              { name: 'Research Scientists', value: 5 },
            ],
          },
          {
            name: 'Analytics',
            value: 8,
            children: [
              { name: 'Data Analysts', value: 4 },
              { name: 'BI Engineers', value: 4 },
            ],
          },
        ],
      },
    ],
  };

  const option = {
    tooltip: {
      formatter: function (info) {
        const value = info.value;
        const treePathInfo = info.treePathInfo;
        const treePath = [];
        
        for (let i = 1; i < treePathInfo.length; i++) {
          treePath.push(treePathInfo[i].name);
        }
        
        return [
          '<div style="font-size:16px; padding:4px">',
          treePath.join(' > '),
          '</div>',
          '<div style="padding:4px">',
          'Team Size: ' + value,
          '</div>'
        ].join('');
      },
    },
    series: [
      {
        type: 'treemap',
        data: [data],
        leafDepth: 2,
        levels: [
          {
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 2,
              gapWidth: 2,
            },
          },
          {
            colorSaturation: [0.3, 0.6],
            itemStyle: {
              borderColorSaturation: 0.7,
              gapWidth: 2,
              borderWidth: 2,
            },
          },
          {
            colorSaturation: [0.3, 0.6],
            itemStyle: {
              borderColorSaturation: 0.7,
              gapWidth: 1,
              borderWidth: 1,
            },
          },
        ],
        label: {
          show: true,
          formatter: '{b}',
          fontSize: 14,
        },
        upperLabel: {
          show: true,
          height: 30,
          fontSize: 14,
        },
        breadcrumb: {
          show: true,
          height: 30,
          bottom: 'bottom',
          itemStyle: {
            textStyle: {
              fontSize: 14,
            },
          },
        },
      },
    ],
  };

  return (
    <div className={classes.root}>
      <Typography variant="h5" component="h1" className={classes.title}>
        Organization Structure
      </Typography>
      <Paper className={classes.chartContainer}>
        <ReactECharts
          option={option}
          className={classes.chart}
          opts={{ renderer: 'canvas' }}
        />
      </Paper>
    </div>
  );
}

export default Organization;
