import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, InputBase, IconButton } from '@material-ui/core';
import { Search as SearchIcon } from '@material-ui/icons';
import ReactECharts from 'echarts-for-react';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  searchBar: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    width: 400,
    marginBottom: theme.spacing(3),
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1,
  },
  iconButton: {
    padding: 10,
  },
  chart: {
    height: 'calc(100vh - 250px)',
    minHeight: '500px',
  },
}));

function Organization() {
  const classes = useStyles();
  const [searchTerm, setSearchTerm] = useState('');

  const departmentData = {
    name: 'Departments',
    children: [
      {
        name: 'Backend',
        value: 300,
        itemStyle: { color: '#26C6DA' },
        children: [
          { name: 'API Team', value: 150 },
          { name: 'Database Team', value: 150 },
        ],
      },
      {
        name: 'Frontend',
        value: 250,
        itemStyle: { color: '#26C6DA' },
        children: [
          { name: 'UI Team', value: 125 },
          { name: 'UX Team', value: 125 },
        ],
      },
      {
        name: 'DevOps',
        value: 200,
        itemStyle: { color: '#78909C' },
        children: [
          { name: 'Infrastructure', value: 100 },
          { name: 'CI/CD', value: 100 },
        ],
      },
      {
        name: 'Training',
        value: 150,
        itemStyle: { color: '#66BB6A' },
        children: [
          { name: 'Technical Training', value: 75 },
          { name: 'Soft Skills', value: 75 },
        ],
      },
      {
        name: 'Recruitment',
        value: 100,
        itemStyle: { color: '#66BB6A' },
        children: [
          { name: 'Technical Hiring', value: 50 },
          { name: 'HR', value: 50 },
        ],
      },
      {
        name: 'Growth',
        value: 180,
        itemStyle: { color: '#FFA726' },
        children: [
          { name: 'Marketing', value: 90 },
          { name: 'Sales', value: 90 },
        ],
      },
    ],
  };

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}',
    },
    series: [
      {
        type: 'treemap',
        data: [departmentData],
        leafDepth: 1,
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
        ],
        label: {
          show: true,
          formatter: '{b}',
          fontSize: 14,
        },
        upperLabel: {
          show: true,
          height: 30,
        },
      },
    ],
  };

  const handleSearch = (event) => {
    event.preventDefault();
    // 实现搜索功能
    console.log('Searching for:', searchTerm);
  };

  return (
    <div className={classes.root}>
      <Paper component="form" className={classes.searchBar} onSubmit={handleSearch}>
        <InputBase
          className={classes.input}
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <IconButton type="submit" className={classes.iconButton} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
      <ReactECharts 
        option={option} 
        className={classes.chart}
        style={{ height: '100%' }}
      />
    </div>
  );
}

export default Organization;
