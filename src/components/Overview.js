import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(3),
    height: '100%',
  },
  title: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.5),
  },
  subtitle: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  unit: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(0.5),
  },
}));

const StatCard = ({ title, value, subtitle, unit }) => {
  const classes = useStyles();
  return (
    <Paper className={classes.paper}>
      <Typography className={classes.title}>{title}</Typography>
      <Typography className={classes.value} component="div">
        {value}
        {unit && <span className={classes.unit}>{unit}</span>}
      </Typography>
      <Typography className={classes.subtitle}>{subtitle}</Typography>
    </Paper>
  );
};

function Overview() {
  const classes = useStyles();

  const stats = [
    {
      title: 'Total Profiles',
      value: '2,543,789',
      unit: 'Profiles',
      subtitle: 'Unique customer profiles in CDP'
    },
    {
      title: 'Active Segments',
      value: '156',
      unit: 'Segments',
      subtitle: 'Currently active audience segments'
    },
    {
      title: 'Connected Sources',
      value: '24',
      unit: 'Integration',
      subtitle: 'Active data source connections'
    },
    {
      title: 'Events Processed',
      value: '15,789,432',
      unit: 'Processing',
      subtitle: 'Events processed today'
    },
    {
      title: 'Profile Attributes',
      value: '847',
      unit: 'Profiles',
      subtitle: 'Unique profile attributes'
    },
    {
      title: 'Audience Reach',
      value: '1,234,567',
      unit: 'Segments',
      subtitle: 'Reachable audience members'
    },
    {
      title: 'Data Freshness',
      value: '98.5',
      unit: 'Processing',
      subtitle: 'Data freshness score (%)'
    },
    {
      title: 'Active Destinations',
      value: '18',
      unit: 'Integration',
      subtitle: 'Connected downstream systems'
    }
  ];

  return (
    <div className={classes.root}>
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default Overview;
