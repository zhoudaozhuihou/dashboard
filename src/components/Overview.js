import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Paper, Grid } from '@material-ui/core';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
    backgroundColor: '#ffffff',
    minHeight: 'calc(100vh - 64px)',
  },
  title: {
    color: '#333333',
    marginBottom: theme.spacing(3),
    fontWeight: 500
  },
  paper: {
    padding: theme.spacing(3),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderRadius: theme.spacing(1)
  },
  kpiValue: {
    fontSize: '2rem',
    fontWeight: 500,
    color: '#2563eb',
    marginBottom: theme.spacing(1),
  },
  kpiLabel: {
    color: '#4b5563',
    fontSize: '0.875rem',
  },
  kpiChange: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 'auto',
    gap: theme.spacing(0.5),
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#dc2626',
  }
}));

const kpiData = [
  {
    label: 'Total Source Systems',
    value: '15',
    change: 12.5,
  },
  {
    label: 'Active Connections',
    value: '2,847',
    change: -3.2,
  },
  {
    label: 'Data Transfer Rate',
    value: '1.2 TB/h',
    change: 8.7,
  },
  {
    label: 'System Uptime',
    value: '99.9%',
    change: 0.2,
  }
];

function Overview() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography variant="h5" className={classes.title}>
        CDP Overview
      </Typography>
      <Grid container spacing={3}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper className={classes.paper}>
              <Typography variant="h4" className={classes.kpiValue}>
                {kpi.value}
              </Typography>
              <Typography className={classes.kpiLabel}>
                {kpi.label}
              </Typography>
              <div className={`${classes.kpiChange} ${kpi.change >= 0 ? classes.positive : classes.negative}`}>
                {kpi.change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                <Typography variant="body2">
                  {Math.abs(kpi.change)}% vs last month
                </Typography>
              </div>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default Overview;
