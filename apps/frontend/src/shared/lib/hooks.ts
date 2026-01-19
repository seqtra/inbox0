/**
 * Typed Redux Hooks
 *
 * These are pre-typed versions of the useDispatch and useSelector hooks
 * that provide full TypeScript support throughout the application.
 *
 * Always use these hooks instead of the plain react-redux hooks
 * to get proper type checking and autocomplete.
 */

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed version of useDispatch hook
 *
 * Use this instead of plain useDispatch to get proper typing
 * for dispatch actions.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * Typed version of useSelector hook
 *
 * Use this instead of plain useSelector to get proper typing
 * when selecting state from the store.
 *
 * @example
 * const user = useAppSelector((state) => state.user);
 */
export const useAppSelector = useSelector.withTypes<RootState>();
