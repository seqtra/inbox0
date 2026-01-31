import { api } from '../../../shared/api/api';
import type {
  Email,
  EmailFilters,
  EmailSummary,
  InboxSummary,
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

    /**
     * Analyze an email (AI summary, priority, category)
     */
    analyzeEmail: builder.mutation<ApiResponse<EmailSummary>, Email>({
      query: (email) => ({
        url: '/emails/analyze',
        method: 'POST',
        body: email,
      }),
    }),

    /**
     * Summarize inbox (last 20 emails) with AI
     */
    summarizeInbox: builder.mutation<ApiResponse<InboxSummary>, void>({
      query: () => ({
        url: '/emails/summarize',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useGetEmailsQuery,
  useGetEmailByIdQuery,
  useSyncEmailsMutation,
  useAnalyzeEmailMutation,
  useSummarizeInboxMutation,
} = emailApi;