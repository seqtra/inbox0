/**
 * Redux Provider Component
 *
 * This component wraps the application and provides the Redux store
 * to all child components via React context.
 *
 * In Next.js App Router, providers must be client components (use client directive).
 */

'use client';

import { Provider } from 'react-redux';
import { store } from '../../store';

interface ReduxProviderProps {
  children: React.ReactNode;
}

/**
 * Redux Provider wrapper
 *
 * Wrap your application with this component to enable Redux state management
 * and RTK Query data fetching throughout the app.
 *
 * @example
 * <ReduxProvider>
 *   <YourApp />
 * </ReduxProvider>
 */
export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
