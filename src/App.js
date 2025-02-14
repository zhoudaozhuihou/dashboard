import React from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Toolbar, Typography, IconButton, Tabs, Tab } from '@material-ui/core';
import { Menu as MenuIcon } from '@material-ui/icons';
import Overview from './components/Overview';
import DataFlow from './components/DataFlow';
import Organization from './components/Organization';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  appBar: {
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  toolbar: {
    justifyContent: 'space-between',
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
  },
  tabs: {
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const routes = [
  { path: '/', label: 'Overview', component: Overview },
  { path: '/data-flow', label: 'Data Flow', component: DataFlow },
  { path: '/organization', label: 'Organization', component: Organization },
];

function App() {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();

  const handleTabChange = (_, newPath) => {
    history.push(newPath);
  };

  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.appBar} elevation={0}>
        <Toolbar className={classes.toolbar}>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Analytics Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Tabs
        value={location.pathname}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        className={classes.tabs}
      >
        {routes.map((route) => (
          <Tab key={route.path} label={route.label} value={route.path} />
        ))}
      </Tabs>
      <main className={classes.content}>
        <Switch>
          {routes.map(({ path, component: Component }) => (
            <Route 
              key={path} 
              exact={path === '/'} 
              path={path} 
              component={Component} 
            />
          ))}
        </Switch>
      </main>
    </div>
  );
}

export default App;
