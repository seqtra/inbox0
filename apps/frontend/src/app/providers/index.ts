/**
 * Redux Store Configuration
 *
 * This file configures the Redux store with Redux Toolkit.
 * Redux is a state management library that helps manage application state in a predictable way.
 *
 * The store includes:
 * - RTK Query API slice for data fetching
 * - Middleware for API caching and automatic refetching
 */

import { configureStore } from '@reduxjs/toolkit';
import { api } from '../../shared/api/api';
import { setupListeners } from '@reduxjs/toolkit/query';
/**
 * Configure and create the Redux store
 *
 * configureStore automatically sets up:
 * - Redux DevTools integration for debugging
 * - Thunk middleware for async actions
 * - Development checks for common mistakes
 */
export const store = configureStore({
  reducer: {
    // Add the RTK Query API reducer
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    // Add RTK Query middleware for caching, invalidation, polling, etc.
    getDefaultMiddleware().concat(api.middleware),
});
setupListeners(store.dispatch);
/**
 * Type definitions for TypeScript
 * These allow proper typing throughout the application
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
