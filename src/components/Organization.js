import React from 'react';
import { useSelector } from 'react-redux';
import { selectOrganizationData } from '../features/dashboard/dashboardSlice';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Paper, Typography, Tooltip } from '@material-ui/core';
import AppsIcon from '@material-ui/icons/Apps';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.primary,
  },
  mainContainer: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(3),
    display: 'flex',
    gap: theme.spacing(3),
    overflowX: 'auto',
    minHeight: '600px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minWidth: '280px',
  },
  department: {
    padding: theme.spacing(2),
    backgroundColor: '#2D3748',
    borderRadius: theme.shape.borderRadius,
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#fff',
    fontWeight: 500,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  subDepartmentsContainer: {
    display: 'flex',
    gap: theme.spacing(2),
    width: '100%',
    alignItems: 'flex-start',
    overflowX: 'auto',
    '&::-webkit-scrollbar': {
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.3)',
      },
    },
  },
  subDepartmentColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    flex: '0 0 auto',
    minWidth: '300px',
  },
  teamsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    backgroundColor: '#1A202C',
    borderRadius: theme.shape.borderRadius,
    width: '100%',
    overflowX: 'auto',
    flexWrap: 'nowrap',
    '&::-webkit-scrollbar': {
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.3)',
      },
    },
  },
  team: {
    padding: theme.spacing(1.5),
    backgroundColor: '#2D3748',
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
    fontWeight: 500,
    height: '200px',
    width: '48px',
    flex: '0 0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#fff',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
    },
  },
  teamName: {
    writingMode: 'vertical-rl',
    transform: 'rotate(180deg)',
    marginBottom: theme.spacing(1),
    fontSize: '0.75rem',
    fontWeight: 600,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    maxHeight: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    lineHeight: 1.2,
  },
  teamType: {
    writingMode: 'vertical-rl',
    transform: 'rotate(180deg)',
    fontSize: '0.65rem',
    padding: theme.spacing(0.5),
    borderRadius: '12px',
    marginBottom: theme.spacing(1),
    whiteSpace: 'nowrap',
    maxHeight: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
  },
  teamContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  appCount: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: '#CBD5E0',
    fontSize: '0.7rem',
    padding: theme.spacing(0.5),
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    width: '100%',
    minHeight: '40px',
  },
  appIcon: {
    fontSize: '1.1rem',
  },
  platformTeam: {
    backgroundColor: '#4299E1',
  },
  analyticsTeam: {
    backgroundColor: '#48BB78',
  },
  monitoringTeam: {
    backgroundColor: '#ED8936',
  },
  tooltipContent: {
    padding: theme.spacing(1),
  },
  tooltipTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  tooltipSubtitle: {
    fontWeight: 600,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    color: '#CBD5E0',
  },
  tooltipList: {
    marginLeft: theme.spacing(1),
  },
  tooltipListItem: {
    marginBottom: theme.spacing(0.5),
    display: 'flex',
    alignItems: 'center',
    '&:before': {
      content: '"•"',
      marginRight: theme.spacing(1),
    },
  },
}));

function Organization() {
  const classes = useStyles();
  const { departments } = useSelector(selectOrganizationData);

  const getTeamTypeLabel = (type) => {
    switch (type) {
      case 'platformTeam':
        return 'Platform';
      case 'analyticsTeam':
        return 'Analytics';
      case 'monitoringTeam':
        return 'Monitoring';
      default:
        return type;
    }
  };

  const TeamCard = ({ team }) => {
    const shortName = team.name.length > 20 ? `${team.name.substring(0, 18)}...` : team.name;
    
    return (
      <Tooltip
        title={
          <Box className={classes.tooltipContent}>
            <Typography variant="subtitle2" className={classes.tooltipTitle}>
              {team.name}
            </Typography>
            <Typography variant="caption" className={classes.tooltipSubtitle}>
              Managed Applications:
            </Typography>
            <Box className={classes.tooltipList}>
              {team.apps.map((app, index) => (
                <Typography key={index} variant="caption" className={classes.tooltipListItem}>
                  {app}
                </Typography>
              ))}
            </Box>
          </Box>
        }
        arrow
        placement="right"
      >
        <Paper className={`${classes.team} ${classes[team.type]}`}>
          <Typography className={classes.teamName}>{shortName}</Typography>
          <Typography className={classes.teamType}>
            {getTeamTypeLabel(team.type)}
          </Typography>
          <Box className={classes.appCount}>
            <AppsIcon className={classes.appIcon} />
            <span>{team.apps.length}</span>
          </Box>
        </Paper>
      </Tooltip>
    );
  };

  return (
    <div className={classes.root}>
      <Typography variant="h5" component="h1" className={classes.title}>
        Organization Structure
      </Typography>
      <div className={classes.subDepartmentsContainer}>
        {departments.map((dept, index) => (
          <div key={index} className={classes.subDepartmentColumn}>
            <Paper className={classes.department}>
              {dept.department}
            </Paper>
            {dept.subDepartments.map((subDept, subIndex) => (
              <div key={subIndex}>
                <Paper className={classes.subDepartment}>
                  {subDept.name}
                </Paper>
                <div className={classes.teamsContainer}>
                  {subDept.teams.map((team, teamIndex) => (
                    <TeamCard key={teamIndex} team={team} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Organization;
