/**
 * Centralized React Query hooks for efficient data fetching
 * Pattern inspired by web version with mobile optimizations
 */

import { ClubService } from '@services/club.service';
import { getClubApplications } from '@services/clubApplication.service';
import { fetchEvent } from '@services/event.service';
import { MajorService } from '@services/major.service';
import { ApiMembership, MembershipsService } from '@services/memberships.service';
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
  eventsCoHostByClub: (clubId: number) => [...queryKeys.events, 'cohost', clubId] as const,
  myRegistrations: () => [...queryKeys.events, 'my-registrations'] as const,
  eventStats: (eventId: number) => [...queryKeys.events, 'stats', eventId] as const,
  eventFraud: (eventId: number) => [...queryKeys.events, 'fraud', eventId] as const,
  eventStaff: (eventId: number) => [...queryKeys.events, 'staff', eventId] as const,
  staffEvaluations: (eventId: number) => [...queryKeys.events, 'evaluations', eventId] as const,
  topStaff: (eventId: number) => [...queryKeys.events, 'top-staff', eventId] as const,

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

  // Products
  products: ['products'] as const,
  productsByClubId: (clubId: number) => [...queryKeys.products, 'club', clubId] as const,
  productDetail: (clubId: number, productId: number | string) =>
    [...queryKeys.products, 'detail', clubId, productId] as const,
  productTags: () => [...queryKeys.products, 'tags'] as const,
  eventProductsOnTime: (clubId: number) => [...queryKeys.products, 'event-ontime', clubId] as const,
  eventProductsCompleted: (clubId: number) => [...queryKeys.products, 'event-completed', clubId] as const,

  // Attendances
  attendances: ['attendances'] as const,
  memberAttendanceHistory: (clubId: number | null) => [...queryKeys.attendances, 'club', clubId, 'member-history'] as const,
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
 * Hook to fetch current user's clubs (all clubs the user is a member of)
 * Returns all clubs the user is a member of with membership details
 */
export function useProfile(enabled = true) {
  return useQuery<ApiMembership[], Error>({
    queryKey: queryKeys.userProfile(),
    queryFn: async () => {
      const myClubs = await MembershipsService.getMyClubs();
      return myClubs;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
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

/**
 * Mutation hook to extend event time
 */
export function useExtendEventTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      payload,
    }: {
      eventId: number | string;
      payload: { newDate: string; newStartTime: string; newEndTime: string; reason: string };
    }) => {
      const { eventTimeExtend } = await import('@services/event.service');
      return await eventTimeExtend(eventId, payload);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(Number(variables.eventId)) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
    },
  });
}

/**
 * Mutation hook to reject event (university staff)
 */
export function useRejectEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, reason }: { eventId: number | string; reason: string }) => {
      const { rejectEvent } = await import('@services/event.service');
      return await rejectEvent(eventId, reason);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(Number(variables.eventId)) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
    },
  });
}

/**
 * Mutation hook to settle event
 */
export function useSettleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: number | string) => {
      const { eventSettle } = await import('@services/event.service');
      return await eventSettle(eventId);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(Number(variables.eventId)) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
    },
  });
}

// ============================================
// EVENT STATS & FRAUD QUERIES
// ============================================

/**
 * Hook to fetch event attendance statistics
 * GET /api/attendance/stats/{eventId}
 */
export function useEventStats(eventId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventStats(eventId),
    queryFn: async () => {
      const { getEventAttendStats } = await import('@services/eventAttend.service');
      const response = await getEventAttendStats(eventId);
      return response.data; // Extract data from wrapper
    },
    enabled: !!eventId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - stats may update frequently during events
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch event fraud records
 * GET /api/attendance/fraud/{eventId}
 */
export function useEventFraud(eventId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventFraud(eventId),
    queryFn: async () => {
      const { getEventAttendFraud } = await import('@services/eventAttend.service');
      const response = await getEventAttendFraud(eventId);
      return response.data; // Extract data array from wrapper
    },
    enabled: !!eventId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// EVENT STAFF QUERIES & MUTATIONS
// ============================================

/**
 * Hook to fetch event staff list
 * GET /api/events/{eventId}/staffs
 */
export function useEventStaff(eventId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventStaff(eventId),
    queryFn: async () => {
      const { getEventStaff } = await import('@services/eventStaff.service');
      const staff = await getEventStaff(eventId);
      return staff;
    },
    enabled: !!eventId && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hook to assign staff to event
 * POST /api/events/{eventId}/staffs
 */
export function useAssignEventStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      membershipId,
      duty,
    }: {
      eventId: number;
      membershipId: number;
      duty: string;
    }) => {
      const { postEventStaff } = await import('@services/eventStaff.service');
      return await postEventStaff(eventId, membershipId, duty);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventStaff(variables.eventId) });
    },
  });
}

/**
 * Hook to fetch staff evaluations for an event
 * GET /api/events/{eventId}/staff/evaluates
 */
export function useStaffEvaluations(eventId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.staffEvaluations(eventId),
    queryFn: async () => {
      const { getEvaluateEventStaff } = await import('@services/eventStaff.service');
      const evaluations = await getEvaluateEventStaff(eventId);
      return evaluations;
    },
    enabled: !!eventId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - evaluations don't change often
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook to fetch top evaluated staff for an event
 * GET /api/events/{eventId}/staff/evaluations/top
 */
export function useTopEvaluatedStaff(eventId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.topStaff(eventId),
    queryFn: async () => {
      const { getTopEvaluatedStaff } = await import('@services/eventStaff.service');
      const topStaff = await getTopEvaluatedStaff(eventId);
      return topStaff;
    },
    enabled: !!eventId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Mutation hook to evaluate event staff
 * POST /api/events/{eventId}/staff/evaluate
 */
export function useEvaluateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      payload,
    }: {
      eventId: number;
      payload: {
        membershipId: number;
        eventId: number;
        performance: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
        note: string;
      };
    }) => {
      const { evaluateEventStaff } = await import('@services/eventStaff.service');
      return await evaluateEventStaff(eventId, payload);
    },
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffEvaluations(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.topStaff(variables.eventId) });
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
 * Hook to fetch current user's club applications
 * GET /api/club-applications/my
 */
export function useMyClubApplications() {
  return useQuery({
    queryKey: ['clubApplications', 'my'],
    queryFn: async () => {
      const { getMyClubApplications } = await import('@services/clubApplication.service');
      const applications = await getMyClubApplications();
      return applications;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - user's applications may change
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
      otp: string;
    }) => {
      const { postClubApplication } = await import('@services/clubApplication.service');
      const { otp, ...body } = payload;
      return await postClubApplication(body, otp);
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
// MEMBER APPLICATIONS QUERIES
// ============================================

/**
 * Hook to fetch current user's member applications
 * GET /api/member-applications/my
 */
export function useMyMemberApplications() {
  return useQuery({
    queryKey: ['memberApplications', 'my'],
    queryFn: async () => {
      const { MemberApplicationService } = await import('@services/memberApplication.service');
      const applications = await MemberApplicationService.getMyMemberApplications();
      return applications;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - user's applications may change
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch member applications by club ID
 * GET /api/member-applications/club/{clubId}
 */
export function useMemberApplicationsByClub(clubId: number | string, enabled = true) {
  return useQuery({
    queryKey: ['memberApplications', 'club', clubId],
    queryFn: async () => {
      const { MemberApplicationService } = await import('@services/memberApplication.service');
      const applications = await MemberApplicationService.getMemberApplicationsByClubId(clubId);
      return applications;
    },
    enabled: !!clubId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hook to create member application
 */
export function useCreateMemberApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { clubId: number | string; message: string }) => {
      const { MemberApplicationService } = await import('@services/memberApplication.service');
      return await MemberApplicationService.createMemberApplication(payload);
    },
    onSuccess: () => {
      // Invalidate member applications to refetch
      queryClient.invalidateQueries({ queryKey: ['memberApplications', 'my'] });
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
 * Hook to fetch club members
 * @param clubId - Club ID
 */
export function useClubMembers(clubId: number, enabled = true) {
  return useQuery({
    queryKey: ['clubs', clubId, 'members'],
    queryFn: async () => {
      const { MembershipsService } = await import('@services/memberships.service');
      const members = await MembershipsService.getMembersByClubId(clubId);
      return members;
    },
    enabled: !!clubId && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes (more dynamic data)
  });
}

/**
 * Hook to fetch current user's memberships (alias for useProfile)
 * Returns all clubs the user is a member of
 */
export function useMyMemberships(enabled = true) {
  return useProfile(enabled);
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

// ============================================
// CO-HOST EVENTS QUERY
// ============================================

/**
 * Hook to fetch co-host events by club ID
 */
export function useEventCoHostByClub(clubId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventsCoHostByClub(clubId),
    queryFn: async () => {
      const { getEventCoHostByClubId } = await import('@services/event.service');
      const events = await getEventCoHostByClubId(clubId);
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
// EVENT REGISTRATIONS
// ============================================

/**
 * Hook to fetch my event registrations
 */
export function useMyEventRegistrations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myRegistrations(),
    queryFn: async () => {
      const { getMyEventRegistrations } = await import('@services/event.service');
      const registrations = await getMyEventRegistrations();
      return registrations;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - registrations change frequently
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hook to register for event
 */
export function useRegisterForEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: number) => {
      const { registerForEvent } = await import('@services/event.service');
      return await registerForEvent(eventId);
    },
    onSuccess: () => {
      // Invalidate registrations and events to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.myRegistrations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsList() });
    },
  });
}

// ============================================
// ATTENDANCES QUERIES
// ============================================

/**
 * Interface for attendance record
 */
export interface AttendanceRecord {
  date: string;
  note: string | null;
  clubName: string;
  status: string;
}

/**
 * Interface for member attendance history response
 */
export interface MemberHistoryResponse {
  success: boolean;
  message: string;
  data: {
    clubName: string;
    membershipId: number;
    attendanceHistory: AttendanceRecord[];
  };
}

/**
 * Hook to fetch attendance history for current user in a specific club
 * @param clubId - The club ID to fetch attendance history for
 */
export function useMemberAttendanceHistory(clubId: number | null, enabled = true) {
  return useQuery<MemberHistoryResponse | null, Error>({
    queryKey: queryKeys.memberAttendanceHistory(clubId),
    queryFn: async () => {
      if (!clubId) return null;
      
      const { fetchMemberAttendanceHistory } = await import('@services/attendance.service');
      const responseBody = await fetchMemberAttendanceHistory(clubId);
      
      return responseBody as MemberHistoryResponse;
    },
    enabled: !!clubId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================
// REDEEM ORDERS QUERIES
// ============================================

/**
 * Hook to fetch current user's redeem orders
 * GET /api/redeem/orders/member
 */
export function useMyRedeemOrders(enabled = true) {
  return useQuery({
    queryKey: ['redeemOrders', 'my'],
    queryFn: async () => {
      const { getMemberRedeemOrders } = await import('@services/redeem.service');
      const orders = await getMemberRedeemOrders();
      return orders;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - orders may change
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch redeem orders by club ID
 * GET /api/redeem/orders/club/{clubId}
 */
export function useClubRedeemOrders(clubId: number | string, enabled = true) {
  return useQuery({
    queryKey: ['redeemOrders', 'club', clubId],
    queryFn: async () => {
      const { getClubRedeemOrders } = await import('@services/redeem.service');
      const orders = await getClubRedeemOrders(clubId);
      return orders;
    },
    enabled: !!clubId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch redeem orders by event ID
 * GET /api/redeem/orders/event/{eventId}
 */
export function useEventRedeemOrders(eventId: number | string, enabled = true) {
  return useQuery({
    queryKey: ['redeemOrders', 'event', eventId],
    queryFn: async () => {
      const { getEventRedeemOrders } = await import('@services/redeem.service');
      const orders = await getEventRedeemOrders(eventId);
      return orders;
    },
    enabled: !!eventId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hook to redeem club product
 */
export function useRedeemClubProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clubId,
      payload,
    }: {
      clubId: number | string;
      payload: { productId: number; quantity: number; membershipId: number };
    }) => {
      const { redeemClubProduct } = await import('@services/redeem.service');
      return await redeemClubProduct(clubId, payload);
    },
    onSuccess: () => {
      // Invalidate redeem orders to refetch
      queryClient.invalidateQueries({ queryKey: ['redeemOrders', 'my'] });
    },
  });
}

/**
 * Mutation hook to redeem event product
 */
export function useRedeemEventProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      payload,
    }: {
      eventId: number | string;
      payload: { productId: number; quantity: number; membershipId: number };
    }) => {
      const { redeemEventProduct } = await import('@services/redeem.service');
      return await redeemEventProduct(eventId, payload);
    },
    onSuccess: () => {
      // Invalidate redeem orders to refetch
      queryClient.invalidateQueries({ queryKey: ['redeemOrders', 'my'] });
    },
  });
}

/**
 * Mutation hook to complete redeem order
 */
export function useCompleteRedeemOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: number | string) => {
      const { completeRedeemOrder } = await import('@services/redeem.service');
      return await completeRedeemOrder(orderId);
    },
    onSuccess: () => {
      // Invalidate redeem orders to refetch
      queryClient.invalidateQueries({ queryKey: ['redeemOrders'] });
    },
  });
}

/**
 * Mutation hook to refund redeem order
 */
export function useRefundRedeemOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { orderId: number | string; quantityToRefund: number; reason: string }) => {
      const { refundRedeemOrder } = await import('@services/redeem.service');
      return await refundRedeemOrder(payload);
    },
    onSuccess: () => {
      // Invalidate redeem orders to refetch
      queryClient.invalidateQueries({ queryKey: ['redeemOrders'] });
    },
  });
}

/**
 * Mutation hook to partial refund redeem order
 */
export function useRefundPartialRedeemOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { orderId: number | string; quantityToRefund: number; reason: string }) => {
      const { refundPartialRedeemOrder } = await import('@services/redeem.service');
      return await refundPartialRedeemOrder(payload);
    },
    onSuccess: () => {
      // Invalidate redeem orders to refetch
      queryClient.invalidateQueries({ queryKey: ['redeemOrders'] });
    },
  });
}

// ============================================
// PRODUCTS QUERIES
// ============================================

/**
 * Hook to fetch products by club ID
 * GET /api/clubs/{clubId}/products
 */
export function useProductsByClubId(clubId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.productsByClubId(clubId),
    queryFn: async () => {
      const { ProductService } = await import('@services/product.service');
      const products = await ProductService.getProducts(clubId, {
        includeInactive: true,
        includeArchived: true,
      });
      return products;
    },
    enabled: !!clubId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch product by ID
 * GET /api/clubs/{clubId}/products/{productId}
 */
export function useProduct(clubId: number, productId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.productDetail(clubId, productId),
    queryFn: async () => {
      const { ProductService } = await import('@services/product.service');
      const product = await ProductService.getProductById(clubId, productId);
      return product;
    },
    enabled: !!clubId && !!productId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch all product tags
 * GET /api/tags
 */
export function useProductTags(enabled = true) {
  return useQuery({
    queryKey: queryKeys.productTags(),
    queryFn: async () => {
      const { TagService } = await import('@services/tag.service');
      const tags = await TagService.getTags();
      return tags;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - tags rarely change
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to fetch EVENT_ITEM products that are currently active (ONGOING events)
 * Auto-refreshes every 10 seconds
 * GET /api/events/clubs/{clubId}/event-items/active
 */
export function useEventProductsOnTime(clubId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventProductsOnTime(clubId),
    queryFn: async () => {
      const { ProductService } = await import('@services/product.service');
      const products = await ProductService.getEventProductsOnTime(clubId);
      return products;
    },
    enabled: !!clubId && enabled,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000, // Auto refresh every 10 seconds
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch EVENT_ITEM products from completed events
 * Fetches once and caches forever (completed events don't change)
 * GET /api/events/clubs/{clubId}/event-items/completed
 */
export function useEventProductsCompleted(clubId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventProductsCompleted(clubId),
    queryFn: async () => {
      const { ProductService } = await import('@services/product.service');
      const products = await ProductService.getEventProductsCompleted(clubId);
      return products;
    },
    enabled: !!clubId && enabled,
    staleTime: Infinity, // Cache forever
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window focuses
    gcTime: Infinity,
  });
}

/**
 * Mutation hook to create product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, payload }: { clubId: number; payload: any }) => {
      const { ProductService } = await import('@services/product.service');
      return await ProductService.addProduct(clubId, payload);
    },
    onSuccess: (_data, variables) => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.productsByClubId(variables.clubId) });
    },
  });
}

/**
 * Mutation hook to update product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clubId,
      productId,
      payload,
    }: {
      clubId: number;
      productId: number | string;
      payload: any;
    }) => {
      const { ProductService } = await import('@services/product.service');
      return await ProductService.updateProduct(clubId, productId, payload);
    },
    onSuccess: (_data, variables) => {
      // Invalidate product detail and list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.productDetail(variables.clubId, variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.productsByClubId(variables.clubId) });
    },
  });
}

/**
 * Mutation hook to update stock
 */
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clubId,
      productId,
      delta,
      note,
    }: {
      clubId: number;
      productId: number | string;
      delta: number;
      note: string;
    }) => {
      const { ProductService } = await import('@services/product.service');
      return await ProductService.updateStock(clubId, productId, delta, note);
    },
    onSuccess: (_data, variables) => {
      // Invalidate product to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.productDetail(variables.clubId, variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.productsByClubId(variables.clubId) });
    },
  });
}

// ============================================
// FEEDBACKS QUERIES
// ============================================

/**
 * Hook to fetch feedbacks by club ID
 * GET /api/events/clubs/{clubId}/feedbacks
 */
export function useFeedbacksByClubId(clubId: number, enabled = true) {
  return useQuery({
    queryKey: ['feedbacks', 'club', clubId],
    queryFn: async () => {
      const { FeedbackService } = await import('@services/feedback.service');
      const feedbacks = await FeedbackService.getFeedbackByClubId(clubId);
      return feedbacks;
    },
    enabled: !!clubId && enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Hook to fetch feedbacks by event ID
 * GET /api/events/{eventId}/feedback
 */
export function useFeedbacksByEventId(eventId: number, enabled = true) {
  return useQuery({
    queryKey: ['feedbacks', 'event', eventId],
    queryFn: async () => {
      const { FeedbackService } = await import('@services/feedback.service');
      const feedbacks = await FeedbackService.getFeedbackByEventId(eventId);
      return feedbacks;
    },
    enabled: !!eventId && enabled,
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Hook to fetch current user's feedbacks
 * GET /api/events/my-feedbacks
 */
export function useMyFeedbacks(enabled = true) {
  return useQuery({
    queryKey: ['feedbacks', 'my'],
    queryFn: async () => {
      const { FeedbackService } = await import('@services/feedback.service');
      const feedbacks = await FeedbackService.getMyFeedbacks();
      return feedbacks;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch feedback summary for an event
 * GET /api/events/{eventId}/feedback/summary
 */
export function useFeedbackSummary(eventId: number, enabled = true) {
  return useQuery({
    queryKey: ['feedbacks', 'event', eventId, 'summary'],
    queryFn: async () => {
      const { FeedbackService } = await import('@services/feedback.service');
      const summary = await FeedbackService.getFeedbackSummary(eventId);
      return summary;
    },
    enabled: !!eventId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutation hook to post feedback for an event
 * POST /api/events/{eventId}/feedback
 */
export function usePostFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, rating, comment }: { eventId: number; rating: number; comment: string }) => {
      const { FeedbackService } = await import('@services/feedback.service');
      return await FeedbackService.postFeedback(eventId, { rating, comment });
    },
    onSuccess: (_data, variables) => {
      // Invalidate feedback queries
      queryClient.invalidateQueries({ queryKey: ['feedbacks', 'event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['feedbacks', 'my'] });
    },
  });
}

/**
 * Mutation hook to update feedback
 * PUT /api/events/feedback/{feedbackId}
 */
export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedbackId, rating, comment }: { feedbackId: number; rating: number; comment: string }) => {
      const { FeedbackService } = await import('@services/feedback.service');
      return await FeedbackService.updateFeedback(feedbackId, { rating, comment });
    },
    onSuccess: () => {
      // Invalidate all feedback queries
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
  });
}