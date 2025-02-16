import { configureStore, createSlice } from '@reduxjs/toolkit';

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    dataFlowData: null,
    loading: false,
    error: null
  },
  reducers: {
    setDataFlowData: (state, action) => {
      state.dataFlowData = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const dashboardReducer = dashboardSlice.reducer;

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
  },
});

export default store;
