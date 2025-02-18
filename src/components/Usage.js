import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
    height: '100%'
  },
  paper: {
    padding: theme.spacing(3),
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    marginBottom: theme.spacing(3),
    color: '#333',
    fontWeight: 500
  }
}));

const Usage = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <Typography variant="h5" className={classes.title}>
          Usage Analytics
        </Typography>
        {/* Add your usage analytics content here */}
      </Paper>
    </div>
  );
};

export default Usage;
