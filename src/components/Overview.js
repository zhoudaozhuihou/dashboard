import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
} from '@material-ui/core';
import {
  Timeline,
  People,
  Storage,
  TrendingUp,
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  cardContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 500,
    marginBottom: theme.spacing(2),
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  icon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  value: {
    fontSize: '2rem',
    fontWeight: 500,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  progress: {
    height: 8,
    borderRadius: 4,
    marginTop: theme.spacing(2),
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
}));

const StatCard = ({ title, value, icon: Icon, progress, total }) => {
  const classes = useStyles();
  
  return (
    <Card className={classes.card}>
      <CardContent className={classes.cardContent}>
        <div className={classes.iconWrapper}>
          <Icon className={classes.icon} />
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
        </div>
        <Typography className={classes.value} component="h2">
          {value}
        </Typography>
        {progress !== undefined && (
          <>
            <LinearProgress
              className={classes.progress}
              variant="determinate"
              value={(progress / total) * 100}
            />
            <div className={classes.progressLabel}>
              <span>{progress.toLocaleString()}</span>
              <span>{total.toLocaleString()}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

function Overview() {
  const classes = useStyles();

  const stats = [
    {
      title: 'Active Users',
      value: '45,021',
      icon: People,
      progress: 45021,
      total: 50000,
    },
    {
      title: 'Data Sources',
      value: '8',
      icon: Storage,
    },
    {
      title: 'Events Today',
      value: '2.1M',
      icon: Timeline,
      progress: 2100000,
      total: 3000000,
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      icon: TrendingUp,
      progress: 32,
      total: 100,
    },
  ];

  return (
    <div className={classes.root}>
      <Box mb={3}>
        <Typography variant="h5" component="h1">
          Dashboard Overview
        </Typography>
      </Box>
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
