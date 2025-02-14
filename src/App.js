import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Tabs, Tab, Box, Typography } from '@material-ui/core';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import Overview from './components/Overview';
import Organization from './components/Organization';
import DataFlow from './components/DataFlow';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
  header: {
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    flexGrow: 1,
    fontWeight: 500,
  },
  content: {
    padding: theme.spacing(3),
    height: 'calc(100vh - 128px)',
    overflow: 'auto',
  },
}));

function App() {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  
  const handleTabChange = (_, newValue) => {
    history.push(newValue);
  };

  return (
    <div className={classes.root}>
      <Box className={classes.header}>
        <Typography variant="h6" className={classes.title}>
          CDP Dashboard
        </Typography>
      </Box>
      <AppBar position="static" color="default">
        <Tabs
          value={location.pathname}
          onChange={handleTabChange}
          aria-label="dashboard navigation"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Overview" value="/" />
          <Tab label="Organization" value="/organization" />
          <Tab label="Data Flow" value="/data-flow" />
        </Tabs>
      </AppBar>
      
      <Box className={classes.content}>
        <Switch>
          <Route exact path="/" component={Overview} />
          <Route path="/organization" component={Organization} />
          <Route path="/data-flow" component={DataFlow} />
        </Switch>
      </Box>
    </div>
  );
}

export default App;
