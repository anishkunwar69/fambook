import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export interface DbUser {
  id: string;
  externalId: string;
  email: string;
  fullName: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseCurrentUserReturn {
  user: DbUser | null;
  clerkUser: ReturnType<typeof useUser>["user"];
  isLoading: boolean;
  isSignedIn: boolean;
  error: Error | null;
}

const createBasicUser = (clerkUser: NonNullable<ReturnType<typeof useUser>["user"]>): DbUser => ({
  id: "", // We'll get this from DB
  externalId: clerkUser.id,
  email: clerkUser.primaryEmailAddress?.emailAddress || "",
  fullName: clerkUser.fullName || "",
  imageUrl: clerkUser.imageUrl || null,
  createdAt: (clerkUser.createdAt || new Date()).toISOString(),
  updatedAt: (clerkUser.updatedAt || new Date()).toISOString(),
});

/**
 * Hook to get the current user's data, combining Clerk and database information.
 * Minimizes API calls by using Clerk's data when possible and caching database queries.
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();

  // Only fetch from database if we need additional data not provided by Clerk
  const { data: dbUser, isLoading, error } = useQuery<DbUser | null>({
    queryKey: ["currentUser", clerkUser?.id],
    queryFn: async () => {
      if (!isSignedIn || !clerkUser) return null;

      // Try to construct user data from Clerk first
      const basicUser = createBasicUser(clerkUser);

      try {
        // Only fetch from DB if we need to sync or get the internal ID
        const response = await fetch('/api/users/me');
        if (!response.ok) {
          console.warn('Failed to fetch user from database, using Clerk data');
          return basicUser;
        }
        const data = await response.json();
        return data as DbUser;
      } catch (err) {
        console.warn('Error fetching from database, using Clerk data:', err);
        return basicUser;
      }
    },
    enabled: isLoaded && !!isSignedIn && !!clerkUser,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    retry: 1, // Only retry once since we have fallback data
    placeholderData: clerkUser ? createBasicUser(clerkUser) : null,
  });

  return {
    user: dbUser ?? null, // Convert undefined to null
    clerkUser,
    isLoading: !isLoaded || isLoading,
    isSignedIn: !!isSignedIn,
    error: error as Error | null,
  };
} 