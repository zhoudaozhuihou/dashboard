import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Typography, Box } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { selectKpiData } from '../features/dashboard/dashboardSlice';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.default,
    minHeight: 'calc(100vh - 128px)',
  },
  paper: {
    padding: theme.spacing(3),
    height: '100%',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  title: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.primary,
  },
  kpiValue: {
    fontSize: '2rem',
    fontWeight: 500,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
  kpiLabel: {
    color: theme.palette.text.secondary,
  },
  kpiChange: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    color: theme.palette.success.main,
  },
  negative: {
    color: theme.palette.error.main,
  },
}));

function Overview() {
  const classes = useStyles();
  const kpiData = useSelector(selectKpiData);

  return (
    <div className={classes.root}>
      <Typography variant="h5" component="h1" className={classes.title}>
        Performance Overview
      </Typography>
      <Grid container spacing={3}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper className={classes.paper} elevation={0}>
              <Box>
                <Typography variant="h4" className={classes.kpiValue}>
                  {typeof kpi.value === 'number' 
                    ? kpi.value.toLocaleString()
                    : kpi.value}
                </Typography>
                <Typography variant="body2" className={classes.kpiLabel}>
                  {kpi.label}
                </Typography>
                <Typography 
                  variant="body2" 
                  className={`${classes.kpiChange} ${kpi.change < 0 ? classes.negative : ''}`}
                >
                  {kpi.change > 0 ? '+' : ''}{kpi.change}% vs last month
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default Overview;
