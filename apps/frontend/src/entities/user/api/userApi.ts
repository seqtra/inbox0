import { api } from '../../../shared/api/api';
import type {
  UserWithPreferences,
  UserPreferences,
  ApiResponse,
} from '@email-whatsapp-bridge/shared';

const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get current user information
     */
    getCurrentUser: builder.query<ApiResponse<UserWithPreferences>, void>({
      query: () => '/user/me',
      providesTags: ['User'],
    }),

    /**
     * Update user schedule (Cron & Timezone)
     */
    updateUserSchedule: builder.mutation<
      ApiResponse<any>, 
      { cronExpression: string; timezone: string }
    >({
      query: (body) => ({
        url: '/user/me/schedule',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    /**
     * Update user preferences
     */
    updateUserPreferences: builder.mutation<
      ApiResponse<UserPreferences>,
      Partial<UserPreferences>
    >({
      query: (preferences) => ({
        url: '/user/preferences',
        method: 'PATCH',
        body: preferences,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useUpdateUserScheduleMutation,
  useUpdateUserPreferencesMutation,
} = userApi;