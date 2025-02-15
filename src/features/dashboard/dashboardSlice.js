import { createSlice } from '@reduxjs/toolkit';
import { loadDashboardData } from '../../services/dataService';

const initialState = {
  kpiData: [],
  organizationData: { departments: [] },
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
      const { kpiData, organizationData, dataFlowData } = action.payload;
      state.kpiData = kpiData;
      state.organizationData = organizationData;
      state.dataFlowData = dataFlowData;
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
    dispatch(setDashboardData(data));
    dispatch(setStatus('succeeded'));
  } catch (error) {
    dispatch(setStatus('failed'));
    dispatch(setError(error.toString()));
  }
};

// Selectors
export const selectKpiData = (state) => state.dashboard.kpiData;
export const selectOrganizationData = (state) => state.dashboard.organizationData;
export const selectDataFlowData = (state) => state.dashboard.dataFlowData;
export const selectStatus = (state) => state.dashboard.status;
export const selectError = (state) => state.dashboard.error;

export default dashboardSlice.reducer;
