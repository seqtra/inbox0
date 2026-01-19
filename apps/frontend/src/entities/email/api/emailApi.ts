import { api } from '../../../shared/api/api';
import type {
  Email,
  EmailFilters,
  ApiResponse,
} from '@email-whatsapp-bridge/shared';

const emailApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get list of emails with optional filters
     */
    getEmails: builder.query<ApiResponse<Email[]>, EmailFilters | void>({
      query: (filters) => ({
        url: '/emails',
        params: filters || undefined,
      }),
      providesTags: ['Email'],
    }),

    /**
     * Get a single email by ID
     */
    getEmailById: builder.query<ApiResponse<Email>, string>({
      query: (id) => `/emails/${id}`,
      providesTags: ['Email'],
    }),

    /**
     * Sync emails from Gmail
     */
    syncEmails: builder.mutation<ApiResponse<{ count: number }>, void>({
      query: () => ({
        url: '/emails/sync',
        method: 'POST',
      }),
      invalidatesTags: ['Email'],
    }),
  }),
});

export const {
  useGetEmailsQuery,
  useGetEmailByIdQuery,
  useSyncEmailsMutation,
} = emailApi;