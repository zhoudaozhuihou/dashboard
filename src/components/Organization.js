import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Paper } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
    backgroundColor: '#1e1e1e',
    minHeight: 'calc(100vh - 64px)',
    color: '#fff',
  },
  title: {
    marginBottom: theme.spacing(4),
    fontWeight: 500,
  },
  mainContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    display: 'flex',
    gap: theme.spacing(2),
    overflowX: 'auto',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: '120px',
  },
  department: {
    padding: theme.spacing(1.5),
    backgroundColor: '#404040',
    borderRadius: theme.shape.borderRadius,
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#fff',
    fontWeight: 500,
    marginBottom: theme.spacing(1),
  },
  teamsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  team: {
    padding: theme.spacing(1),
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 500,
    minHeight: '120px',
    width: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    transform: 'rotate(180deg)',
    whiteSpace: 'nowrap',
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'rotate(180deg) translateY(-4px)',
    },
  },
  // 平台服务层样式
  platformTeam: {
    backgroundColor: '#009688',
    '&:hover': {
      backgroundColor: '#00897b',
    },
  },
  // 数据分析层样式
  analyticsTeam: {
    backgroundColor: '#4caf50',
    '&:hover': {
      backgroundColor: '#43a047',
    },
  },
  // 监控层样式
  monitoringTeam: {
    backgroundColor: '#2196f3',
    '&:hover': {
      backgroundColor: '#1e88e5',
    },
  },
}));

function Organization() {
  const classes = useStyles();

  const departmentTeams = [
    {
      department: 'Process Banking',
      teams: [
        { name: 'Security as a Platform', type: 'platformTeam' }
      ]
    },
    {
      department: 'Transfer',
      teams: [
        { name: 'Risk & KYC', type: 'platformTeam' }
      ]
    },
    {
      department: 'Payment',
      teams: [
        { name: 'Credit Decisioning Systems', type: 'platformTeam' }
      ]
    },
    {
      department: 'KYC',
      teams: [
        { name: 'KYC Operations Utility', type: 'analyticsTeam' },
        { name: 'KYC Analytics', type: 'analyticsTeam' }
      ]
    },
    {
      department: 'Monitoring',
      teams: [
        { name: 'Monitoring', type: 'monitoringTeam' },
        { name: 'Fraud Detection', type: 'monitoringTeam' }
      ]
    },
    {
      department: 'Finance',
      teams: [
        { name: 'Financial Resource Management', type: 'analyticsTeam' }
      ]
    },
    {
      department: 'Analytics',
      teams: [
        { name: 'Process Analytics', type: 'analyticsTeam' },
        { name: 'Analytics Foundation Enabler', type: 'analyticsTeam' },
        { name: 'MRA Supervision & NFR', type: 'analyticsTeam' }
      ]
    },
    {
      department: 'Security',
      teams: [
        { name: 'Test & Scenario Hub', type: 'analyticsTeam' }
      ]
    }
  ];

  return (
    <div className={classes.root}>
      <Typography variant="h5" component="h1" className={classes.title}>
        FSA Values Streams
      </Typography>
      <Paper className={classes.mainContainer}>
        {departmentTeams.map((item, index) => (
          <Box key={index} className={classes.column}>
            <Paper className={classes.department}>
              {item.department}
            </Paper>
            <Box className={classes.teamsContainer}>
              {item.teams.map((team, teamIndex) => (
                <Paper
                  key={teamIndex}
                  className={`${classes.team} ${classes[team.type]}`}
                >
                  {team.name}
                </Paper>
              ))}
            </Box>
          </Box>
        ))}
      </Paper>
    </div>
  );
}

export default Organization;
