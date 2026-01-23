import { configureStore } from '@reduxjs/toolkit';

// Create a minimal reducer to avoid the warning
// Using combineReducers pattern that Redux Toolkit expects
const rootReducer = (state: Record<string, never> = {}, _action: any) => state;

export const store = configureStore({
  reducer: {
    app: rootReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
