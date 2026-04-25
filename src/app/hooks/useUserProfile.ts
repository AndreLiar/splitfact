'use client';

import { useCurrentUser } from './useApi';

export function useUserProfile() {
  const { userProfile, isLoading: loading, mutate } = useCurrentUser();
  return { userProfile, loading, fetchUserProfile: mutate };
}
