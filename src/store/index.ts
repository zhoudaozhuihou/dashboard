import { createStore } from 'redux';

interface AppState {
  loading: boolean;
  error: string | null;
}

const initialState: AppState = {
  loading: false,
  error: null,
};

function rootReducer(state = initialState, action: any): AppState {
  switch (action.type) {
    default:
      return state;
  }
}

const store = createStore(rootReducer);

export default store;
