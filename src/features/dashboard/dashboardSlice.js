import { createSlice } from '@reduxjs/toolkit';
import { loadDashboardData } from '../../services/dataService';

const initialState = {
  dataFlowData: {
    mainGraph: { nodes: [], links: [] },
    detailData: {}
  },
  status: 'idle',
  error: null
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardData: (state, action) => {
      state.dataFlowData = action.payload.dataFlowData;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setDashboardData, setStatus, setError } = dashboardSlice.actions;

// Thunk action creator
export const loadDashboardDataAsync = () => async (dispatch) => {
  try {
    dispatch(setStatus('loading'));
    const data = await loadDashboardData();
    console.log('Loaded dashboard data:', data);
    dispatch(setDashboardData(data));
    dispatch(setStatus('succeeded'));
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    dispatch(setStatus('failed'));
    dispatch(setError(error.toString()));
  }
};

// Selectors
export const selectDataFlowData = (state) => state.dashboard.dataFlowData;
export const selectStatus = (state) => state.dashboard.status;
export const selectError = (state) => state.dashboard.error;

export default dashboardSlice.reducer;
