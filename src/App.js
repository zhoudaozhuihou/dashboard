import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Switch, Route, Link, useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Toolbar, Typography, Container, Button, CssBaseline, Grid } from '@material-ui/core';
import Overview from './components/Overview';
import DataFlow from './components/DataFlow';
import { loadDashboardDataAsync } from './features/dashboard/dashboardSlice';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    backgroundColor: '#ffffff',
    minHeight: '100vh'
  },
  appBar: {
    backgroundColor: '#ffffff',
    color: '#333333',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1
  },
  title: {
    marginRight: theme.spacing(4),
    fontWeight: 500
  },
  navButtons: {
    display: 'flex',
    alignItems: 'center'
  },
  navButton: {
    marginRight: theme.spacing(2),
    color: '#666666',
    textTransform: 'none',
    fontSize: '1rem',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)'
    }
  },
  activeNavButton: {
    color: '#1976d2',
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.12)'
    }
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    backgroundColor: '#ffffff'
  }
}));

function App() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(loadDashboardDataAsync());
  }, [dispatch]);

  return (
    <Router>
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <div className={classes.titleSection}>
              <Typography variant="h6" className={classes.title}>
                CDP Dashboard
              </Typography>
              <div className={classes.navButtons}>
                <Button
                  component={Link}
                  to="/"
                  className={`${classes.navButton} ${location.pathname === '/' ? classes.activeNavButton : ''}`}
                >
                  Overview
                </Button>
                <Button
                  component={Link}
                  to="/dataflow"
                  className={`${classes.navButton} ${location.pathname === '/dataflow' ? classes.activeNavButton : ''}`}
                >
                  Data Flow
                </Button>
              </div>
            </div>
          </Toolbar>
        </AppBar>
        <Container maxWidth={false} className={classes.content}>
          <Toolbar />
          <Switch>
            <Route exact path="/" component={Overview} />
            <Route path="/dataflow" component={DataFlow} />
          </Switch>
        </Container>
      </div>
    </Router>
  );
}

export default App;
