import useSWR from 'swr';
import { UserWithPreferences, ApiResponse } from '@email-whatsapp-bridge/shared';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Domain: User
export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<UserWithPreferences>>(
    '/api/proxy/users/me', // Proxies to Fastify Backend
    fetcher
  );

  return {
    user: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Domain: Preferences
export function useUserPreferences() {
  const { user, mutate } = useCurrentUser();

  const updatePreferences = async (newPrefs: Partial<UserWithPreferences['preferences']>) => {
    // Optimistic Update logic could go here
    const response = await fetch('/api/proxy/users/me/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrefs),
    });
    
    if (response.ok) {
        mutate(); // Revalidate
    }
    return response.json();
  };

  return {
    preferences: user?.preferences,
    updatePreferences,
  };
}

// Domain: Cron/Scheduling
export function useUserSchedule() {
  const { user, mutate } = useCurrentUser();
  
  const updateSchedule = async (cronExpression: string, timezone: string) => {
      await fetch('/api/proxy/users/me/schedule', {
          method: 'POST',
          body: JSON.stringify({ cronExpression, timezone })
      });
      mutate();
  }

  return {
      cronJob: user?.cronJob,
      updateSchedule
  }
}