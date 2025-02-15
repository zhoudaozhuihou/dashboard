import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Toolbar, Typography, Container, Button } from '@material-ui/core';
import Overview from './components/Overview';
import DataFlow from './components/DataFlow';
import { loadDashboardDataAsync } from './features/dashboard/dashboardSlice';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#1e1e1e',
  },
  appBar: {
    backgroundColor: '#111827',
  },
  toolbar: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  title: {
    marginRight: theme.spacing(4),
    color: '#fff',
  },
  navButton: {
    marginRight: theme.spacing(2),
    color: '#9ca3af',
    '&:hover': {
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
  activeNavButton: {
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    flexGrow: 1,
    paddingTop: theme.spacing(8),
  },
}));

const navItems = [
  { path: '/', label: 'Overview' },
  { path: '/dataflow', label: 'Data Flow' },
];

function App() {
  const classes = useStyles();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadDashboardDataAsync());
  }, [dispatch]);

  return (
    <Router>
      <div className={classes.root}>
        <AppBar position="fixed" className={classes.appBar} elevation={0}>
          <Toolbar className={classes.toolbar}>
            <Typography variant="h6" className={classes.title}>
              Data Analytics Dashboard
            </Typography>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                className={classes.navButton}
              >
                {item.label}
              </Button>
            ))}
          </Toolbar>
        </AppBar>
        <Container maxWidth={false} className={classes.content}>
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
