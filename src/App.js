import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Switch, Route, Link, useLocation, Redirect } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Toolbar, Typography, Container, Button, CssBaseline, Grid, Tabs, Tab } from '@material-ui/core';
import Overview from './components/Overview';
import DataFlow from './components/DataFlow';
import SankeyFlow from './components/SankeyFlow';
import GBGFSankey from './components/GBGFSankey';
import Usage from './components/Usage';
import { loadDashboardDataAsync } from './features/dashboard/dashboardSlice';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f0f2f5'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 32
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    marginRight: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1890ff',
    marginRight: 48
  },
  tabButton: {
    marginRight: 16,
    padding: '8px 16px',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    backgroundColor: 'transparent',
    color: '#666',
    transition: 'all 0.3s',
    '&:hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  activeTab: {
    backgroundColor: '#1890ff',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#40a9ff'
    }
  },
  content: {
    flex: 1,
    padding: 24,
    overflow: 'auto'
  },
  tabs: {
    marginLeft: 32
  }
}));

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const classes = useStyles();
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(loadDashboardDataAsync());
  }, [dispatch]);

  const handleTabChange = (event, tab) => {
    setActiveTab(tab);
  };

  return (
    <Router>
      <div className={classes.root}>
        <CssBaseline />
        <div className={classes.header}>
          <div className={classes.logoSection}>
            <div className={classes.logo} />
            <div className={classes.title}>CDP Dashboard</div>
          </div>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            className={classes.tabs}
          >
            <Tab label="Overview" value="overview" component={Link} to="/usage" />
            <Tab label="Data Flow" value="dataflow" component={Link} to="/dataflow" />
            <Tab label="Sankey Flow" value="sankeyflow" component={Link} to="/sankeyflow" />
            <Tab label="GB/GF Flow" value="gbgfflow" component={Link} to="/gbgfflow" />
          </Tabs>
        </div>
        <Container maxWidth={false} className={classes.content}>
          <Switch>
            <Route exact path="/usage" component={Overview} />
            <Route path="/dataflow" component={DataFlow} />
            <Route path="/sankeyflow" component={SankeyFlow} />
            <Route path="/gbgfflow" component={GBGFSankey} />
            <Route path="/" render={() => <Redirect to="/usage" />} />
          </Switch>
        </Container>
      </div>
    </Router>
  );
}

export default App;
