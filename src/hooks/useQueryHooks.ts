/**
 * Centralized React Query hooks for efficient data fetching
 * Pattern inspired by web version with mobile optimizations
 */

import { ClubService } from '@services/club.service';
import { getClubApplications } from '@services/clubApplication.service';
import { fetchEvent } from '@services/event.service';
import { MajorService } from '@services/major.service';
import { PolicyService } from '@services/policy.service';
import { UserService } from '@services/user.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================
// QUERY KEYS - Centralized for consistency
// ============================================
export const queryKeys = {
  // Users
  users: ['users'] as const,
  usersList: () => [...queryKeys.users, 'list'] as const,
  userDetail: (id: number | string) => [...queryKeys.users, 'detail', id] as const,
  userProfile: () => [...queryKeys.users, 'profile'] as const,

  // Clubs
  clubs: ['clubs'] as const,
  clubsList: (params?: any) => [...queryKeys.clubs, 'list', params] as const,
  clubDetail: (id: number) => [...queryKeys.clubs, 'detail', id] as const,

  // Events
  events: ['events'] as const,
  eventsList: () => [...queryKeys.events, 'list'] as const,
  eventDetail: (id: number) => [...queryKeys.events, 'detail', id] as const,
  eventsByClub: (clubId: number) => [...queryKeys.events, 'club', clubId] as const,

  // Locations
  locations: ['locations'] as const,
  locationsList: () => [...queryKeys.locations, 'list'] as const,
  locationDetail: (id: number) => [...queryKeys.locations, 'detail', id] as const,

  // Majors
  majors: ['majors'] as const,
  majorsList: () => [...queryKeys.majors, 'list'] as const,

  // Policies
  policies: ['policies'] as const,
  policiesList: () => [...queryKeys.policies, 'list'] as const,
  policyDetail: (id: number) => [...queryKeys.policies, 'detail', id] as const,

  // Club Applications
  clubApplications: ['clubApplications'] as const,
  clubApplicationsList: () => [...queryKeys.clubApplications, 'list'] as const,
  clubApplicationDetail: (id: number) => [...queryKeys.clubApplications, 'detail', id] as const,
};

// ============================================
// USERS QUERIES
// ============================================

/**
 * Hook to fetch all users with React Query caching
 */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.usersList(),
    queryFn: async () => {
      const response = await UserService.fetchUsers();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - users data doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
  });
}

/**
 * Hook to fetch single user by ID
 */
export function useUser(userId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userDetail(userId),
    queryFn: async () => {
      const user = await UserService.fetchUserById(userId);
      return user;
    },
    enabled: !!userId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch current user profile
 */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: async () => {
      const profile = await UserService.fetchProfile();
      return profile;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hook to update user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: number | string; data: any }) => {
      return await UserService.updateUserById(userId, data);
    },
    onSuccess: (_data: any, variables: any) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.usersList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(variables.userId) });
    },
  });
}

/**
 * Mutation hook to delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number | string) => {
      return await UserService.deleteUserById(userId);
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.usersList() });
    },
  });
}

// ============================================
// CLUBS QUERIES
// ============================================

/**
 * Hook to fetch all clubs
 */
export function useClubs(params = { page: 0, size: 1000, sort: 'name' }) {
  return useQuery({
    queryKey: queryKeys.clubsList(params),
    queryFn: async () => {
      const clubs = await ClubService.getAllClubs();
      return clubs;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch single club by ID
 */
export function useClub(clubId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.clubDetail(clubId),
    queryFn: async () => {
      const club = await ClubService.getClubById(clubId);
      return club;
    },
    enabled: !!clubId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// EVENTS QUERIES
// ============================================

/**
 * Hook to fetch all events
 */
export function useEvents() {
  return useQuery({
    queryKey: queryKeys.eventsList(),
    queryFn: async () => {
      const events = await fetchEvent();
      return events;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - events change more frequently
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch single event by ID
 */
export function useEvent(eventId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventDetail(eventId),
    queryFn: async () => {
      // Import dynamically to avoid circular dependency
      const { getEventById } = await import('@services/event.service');
      const event = await getEventById(eventId);
      return event;
    },
    enabled: !!eventId && enabled,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// MAJORS QUERIES
// ============================================

/**
 * Hook to fetch all majors
 */
export function useMajors() {
  return useQuery({
    queryKey: queryKeys.majorsList(),
    queryFn: async () => {
      const majors = await MajorService.fetchMajors();
      return majors;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - majors rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// ============================================
// POLICIES QUERIES
// ============================================

/**
 * Hook to fetch all policies
 */
export function usePolicies() {
  return useQuery({
    queryKey: queryKeys.policiesList(),
    queryFn: async () => {
      const policies = await PolicyService.fetchPolicies();
      return policies;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000,
  });
}

/**
 * Hook to fetch single policy by ID
 */
export function usePolicy(policyId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.policyDetail(policyId),
    queryFn: async () => {
      const policy = await PolicyService.fetchPolicyById(policyId);
      return policy;
    },
    enabled: !!policyId && enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

// ============================================
// PREFETCH UTILITIES
// ============================================

/**
 * Hook to prefetch users (useful for navigation pre-loading)
 */
export function usePrefetchUsers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.usersList(),
      queryFn: async () => {
        const response = await UserService.fetchUsers();
        return response;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook to prefetch clubs
 */
export function usePrefetchClubs() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.clubsList({ page: 0, size: 1000, sort: 'name' }),
      queryFn: async () => {
        const clubs = await ClubService.getAllClubs();
        return clubs;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

// ============================================
// EVENTS BY CLUB QUERY
// ============================================

/**
 * Hook to fetch events by club ID
 */
export function useEventsByClub(clubId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventsByClub(clubId),
    queryFn: async () => {
      const { getEventByClubId } = await import('@services/event.service');
      const events = await getEventByClubId(clubId);
      // Normalize events - ensure backward compatibility
      return events.map((e: any) => ({
        ...e,
        title: e.name || e.title,
        time: e.startTime || e.time,
        clubId: e.hostClub?.id || e.clubId,
        clubName: e.hostClub?.name || e.clubName,
      }));
    },
    enabled: !!clubId && enabled,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// LOCATIONS QUERIES
// ============================================

/**
 * Hook to fetch all locations
 */
export function useLocations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.locationsList(),
    queryFn: async () => {
      const { fetchLocation } = await import('@services/event.service');
      const locations = await fetchLocation();
      return locations;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - locations rarely change
    gcTime: 20 * 60 * 1000,
  });
}

// ============================================
// EVENT MUTATIONS
// ============================================

/**
 * Mutation hook to create event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { createEvent } = await import('@services/event.service');
      return await createEvent(payload);
    },
    onSuccess: () => {
      // Invalidate events list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
    },
  });
}

/**
 * Mutation hook to update event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, data }: { eventId: number | string; data: any }) => {
      const { updateEvent } = await import('@services/event.service');
      return await updateEvent(eventId, data);
    },
    onSuccess: (_data: any, variables: any) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(Number(variables.eventId)) });
    },
  });
}

/**
 * Mutation hook to delete event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: number | string) => {
      const { deleteEvent } = await import('@services/event.service');
      return await deleteEvent(eventId);
    },
    onSuccess: () => {
      // Invalidate and refetch events list
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
    },
  });
}

// ============================================
// CLUB APPLICATIONS QUERIES
// ============================================

/**
 * Hook to fetch all club applications
 */
export function useClubApplications() {
  return useQuery({
    queryKey: queryKeys.clubApplicationsList(),
    queryFn: async () => {
      const applications = await getClubApplications();
      return applications;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - applications may change frequently
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hook to create club application
 */
export function useCreateClubApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      clubName: string;
      description: string;
      majorId?: number | null;
      vision?: string;
      proposerReason?: string;
    }) => {
      const { postClubApplication } = await import('@services/clubApplication.service');
      return await postClubApplication(payload);
    },
    onSuccess: () => {
      // Invalidate club applications list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.clubApplicationsList() });
    },
  });
}

/**
 * Mutation hook to update club application status
 */
export function useUpdateClubApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      approve,
      rejectReason,
    }: {
      applicationId: number;
      approve: boolean;
      rejectReason: string;
    }) => {
      const { putClubApplicationStatus } = await import('@services/clubApplication.service');
      return await putClubApplicationStatus(applicationId, approve, rejectReason);
    },
    onSuccess: () => {
      // Invalidate club applications list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.clubApplicationsList() });
    },
  });
}

// ============================================
// STATISTICS QUERIES
// ============================================

/**
 * Hook to fetch user statistics (Admin only)
 */
export function useUserStats(enabled = true) {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: async () => {
      const stats = await UserService.getUserStats();
      return stats;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch club statistics (Admin only)
 */
export function useClubStats(enabled = true) {
  return useQuery({
    queryKey: ['clubs', 'stats'],
    queryFn: async () => {
      const stats = await ClubService.getClubStats();
      return stats;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch club member count
 * @param clubId - Club ID
 */
export function useClubMemberCount(clubId: number, enabled = true) {
  return useQuery({
    queryKey: ['clubs', clubId, 'member-count'],
    queryFn: async () => {
      const count = await ClubService.getClubMemberCount(clubId);
      return count;
    },
    enabled: !!clubId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to prefetch multiple club member counts
 * Useful for lists where we need counts for many clubs
 * ✅ OPTIMIZED: Returns both activeMemberCount and approvedEvents
 */
export function useClubMemberCounts(clubIds: number[]) {
  return useQuery({
    queryKey: ['clubs', 'member-counts', clubIds],
    queryFn: async () => {
      // Fetch all counts in parallel for better performance
      const counts = await Promise.all(
        clubIds.map(async (id) => {
          try {
            const countData = await ClubService.getClubMemberCount(id);
            return {
              clubId: id,
              activeMemberCount: countData.activeMemberCount ?? 0,
              approvedEvents: countData.approvedEvents ?? 0,
            };
          } catch (error) {
            console.error(`Failed to fetch member count for club ${id}:`, error);
            return {
              clubId: id,
              activeMemberCount: 0,
              approvedEvents: 0,
            };
          }
        })
      );
      // Convert array to object for easy lookup
      return counts.reduce((acc, data) => {
        acc[data.clubId] = {
          activeMemberCount: data.activeMemberCount,
          approvedEvents: data.approvedEvents,
        };
        return acc;
      }, {} as Record<number, { activeMemberCount: number; approvedEvents: number }>);
    },
    enabled: clubIds.length > 0,
    staleTime: 5 * 60 * 1000,
    // Don't show errors for member counts - just use 0 as fallback
    retry: 1,
  });
}