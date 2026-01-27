import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Base API URL - will be different in production
 * In development, this points to the local Fastify server
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Base API configuration using RTK Query
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      // Add authentication token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  // Define tag types centrally so they can be provided/invalidated by split endpoints
  tagTypes: ['Email', 'WhatsAppMessage', 'User', 'TrelloCard'],
  endpoints: () => ({}), // Empty endpoints here; injected in other files
});