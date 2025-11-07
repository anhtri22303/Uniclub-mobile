/**
 * University Staff Dashboard (Mobile)
 * 
 * ✅ Matches web version functionality:
 * - Uses React Query hooks for data fetching (useEvents, useClubs, usePolicies)
 * - Displays real-time statistics (clubs, policies, applications, events)
 * - Shows club applications with filters and pagination
 * - Shows event requests with filters and pagination
 * - University points and club rankings
 * - Attendance summary by month
 * - Attendance ranking by club
 * - Top clubs by member count
 * - Full mobile-responsive design
 */

import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useClubApplications, useClubs, useEvents, usePolicies } from '@hooks/useQueryHooks';
import { ClubService } from '@services/club.service';
import { UniversityService } from '@services/university.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Status colors
const STATUS_COLORS: Record<string, string> = {
  APPROVED: '#22c55e',
  PENDING: '#eab308',
  REJECTED: '#ef4444',
};

export default function UniStaffPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // ✅ USE REACT QUERY for events, clubs, policies, and club applications
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useEvents();
  const { data: clubs = [], isLoading: clubsLoading, refetch: refetchClubs } = useClubs();
  const { data: policies = [] } = usePolicies();
  const { data: clubApplications = [], refetch: refetchClubApplications } = useClubApplications();

  // State management
  const [clubsWithMemberCount, setClubsWithMemberCount] = useState<any[]>([]);
  const [universityPointsData, setUniversityPointsData] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [attendanceRanking, setAttendanceRanking] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [attendanceYear, setAttendanceYear] = useState<number>(new Date().getFullYear());

  // Statistics
  const totalClubs = clubs.length;
  const totalPolicies = policies.length;
  const totalClubApplications = clubApplications.length;
  const totalEventRequests = events.length;

  // Count approved/pending club applications
  const approvedClubApplications = clubApplications.filter((app: any) => app.status === 'APPROVED').length;
  const pendingClubApplications = clubApplications.filter((app: any) => app.status === 'PENDING').length;
  const rejectedClubApplications = clubApplications.filter((app: any) => app.status === 'REJECTED').length;

  // Count events by status (updated for new event statuses)
  const approvedEvents = useMemo(() => {
    return events.filter((event: any) => event.status === 'APPROVED').length;
  }, [events]);

  const ongoingEvents = useMemo(() => {
    return events.filter((event: any) => event.status === 'ONGOING').length;
  }, [events]);

  const completedEvents = useMemo(() => {
    return events.filter((event: any) => event.status === 'COMPLETED').length;
  }, [events]);

  const pendingUnistaffEvents = useMemo(() => {
    return events.filter((event: any) => event.status === 'PENDING_UNISTAFF').length;
  }, [events]);

  const pendingCoclubEvents = useMemo(() => {
    return events.filter((event: any) => event.status === 'PENDING_COCLUB').length;
  }, [events]);

  const rejectedEvents = useMemo(() => {
    return events.filter((event: any) => event.status === 'REJECTED').length;
  }, [events]);

  const cancelledEvents = useMemo(() => {
    return events.filter((event: any) => event.status === 'CANCELLED').length;
  }, [events]);

  const totalPendingEvents = pendingUnistaffEvents + pendingCoclubEvents;

  // Fetch all data (excluding club applications which is now handled by React Query)
  const loadData = async () => {
    try {
      // Fetch university points
      const pointsData = await UniversityService.fetchUniversityPoints();
      setUniversityPointsData(pointsData);

      // Fetch attendance summary
      const attendanceData = await UniversityService.fetchAttendanceSummary(attendanceYear);
      setAttendanceSummary(attendanceData);

      // Fetch attendance ranking
      const rankingData = await UniversityService.fetchAttendanceRanking();
      setAttendanceRanking(rankingData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  // Fetch member count for each club
  const fetchMemberCounts = async () => {
    if (clubs.length === 0) return;

    const clubsWithCounts = await Promise.all(
      clubs.map(async (club: any) => {
        try {
          const { activeMemberCount } = await ClubService.getClubMemberCount(club.id);

          // Find matching ranking data
          const rankingData = universityPointsData?.clubRankings.find(
            (ranking: any) => ranking.clubId === club.id
          );

          return {
            ...club,
            memberCount: activeMemberCount,
            rank: rankingData?.rank,
            totalPoints: rankingData?.totalPoints || 0,
          };
        } catch (error) {
          console.error(`Error fetching member count for club ${club.id}:`, error);
          return { ...club, memberCount: 0, rank: undefined, totalPoints: 0 };
        }
      })
    );

    // Sort by rank
    const sortedClubs = clubsWithCounts.sort((a, b) => {
      const rankA = a.rank !== undefined ? a.rank : Infinity;
      const rankB = b.rank !== undefined ? b.rank : Infinity;
      return rankA - rankB;
    });

    setClubsWithMemberCount(sortedClubs);
  };

  // Initial load
  useEffect(() => {
    if (events.length > 0) {
      loadData();
    }
  }, [events]);

  // Fetch member counts when clubs or points data changes
  useEffect(() => {
    fetchMemberCounts();
  }, [clubs, universityPointsData]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchEvents(), 
      refetchClubs(), 
      refetchClubApplications(), 
      loadData()
    ]);
    setIsRefreshing(false);
  };

  // Top 3 pending club applications
  const top3ClubApplications = useMemo(() => {
    return clubApplications
      .filter((app: any) => app.status === 'PENDING')
      .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3);
  }, [clubApplications]);

  // Top 3 pending events (awaiting UniStaff approval)
  const top3PendingEvents = useMemo(() => {
    return events
      .filter((event: any) => event.status === 'PENDING_UNISTAFF')
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [events]);

  // Top 5 clubs by member count
  const top5Clubs = useMemo(() => {
    return clubsWithMemberCount.slice(0, 5);
  }, [clubsWithMemberCount]);

  // Total participants from attendance summary
  const totalParticipants = useMemo(() => {
    if (!attendanceSummary) return 0;
    return attendanceSummary.monthlySummary.reduce(
      (sum: number, item: any) => sum + item.participantCount,
      0
    );
  }, [attendanceSummary]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">University Staff Dashboard</Text>
        <Text className="text-sm text-gray-600 mt-1">
          Welcome, {user?.fullName || 'University Staff'}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Statistics Cards */}
        <View className="p-4 space-y-3">
          <View className="flex-row space-x-3">
            {/* Total Clubs */}
            <TouchableOpacity
              className="flex-1 rounded-2xl p-4 shadow-md"
              style={{ backgroundColor: '#3B82F6' }}
              onPress={() => router.push('/uni-staff/clubs' as any)}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="business" size={24} color="white" />
                <Text className="text-white text-xs opacity-80">Total</Text>
              </View>
              <Text className="text-white text-3xl font-bold">{totalClubs}</Text>
              <Text className="text-white text-xs mt-1 opacity-90">Clubs</Text>
            </TouchableOpacity>

            {/* Club Requests */}
            <TouchableOpacity
              className="flex-1 rounded-2xl p-4 shadow-md"
              style={{ backgroundColor: '#10B981' }}
              onPress={() => router.push('/uni-staff/clubs-req' as any)}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="document-text" size={24} color="white" />
                <Text className="text-white text-xs opacity-80">Pending</Text>
              </View>
              <Text className="text-white text-3xl font-bold">{totalClubApplications}</Text>
              <Text className="text-white text-xs mt-1 opacity-90">Applications</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="checkmark-circle" size={12} color="white" />
                <Text className="text-white text-[10px] ml-1">{approvedClubApplications} approved</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="flex-row space-x-3">
            {/* Event Requests */}
            <TouchableOpacity
              className="flex-1 rounded-2xl p-4 shadow-md"
              style={{ backgroundColor: '#A855F7' }}
              onPress={() => router.push('/uni-staff/events-req' as any)}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="calendar" size={24} color="white" />
                <Text className="text-white text-xs opacity-80">Total</Text>
              </View>
              <Text className="text-white text-3xl font-bold">{totalEventRequests}</Text>
              <Text className="text-white text-xs mt-1 opacity-90">Events</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="hourglass" size={12} color="white" />
                <Text className="text-white text-[10px] ml-1">{pendingUnistaffEvents} awaiting approval</Text>
              </View>
            </TouchableOpacity>

            {/* Total Policies */}
            <TouchableOpacity
              className="flex-1 rounded-2xl p-4 shadow-md"
              style={{ backgroundColor: '#F97316' }}
              onPress={() => router.push('/uni-staff/policies' as any)}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="shield-checkmark" size={24} color="white" />
                <Text className="text-white text-xs opacity-80">Active</Text>
              </View>
              <Text className="text-white text-3xl font-bold">{totalPolicies}</Text>
              <Text className="text-white text-xs mt-1 opacity-90">Policies</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="px-4 mt-2">
          <View className="flex-row bg-white rounded-xl p-1 shadow-sm">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${activeTab === 'overview' ? 'bg-teal-500' : ''}`}
              onPress={() => setActiveTab('overview')}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  activeTab === 'overview' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${activeTab === 'analytics' ? 'bg-teal-500' : ''}`}
              onPress={() => setActiveTab('analytics')}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  activeTab === 'analytics' ? 'text-white' : 'text-gray-600'
                }`}
              >
                Analytics
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View className="p-4 space-y-4">
            {/* Pending Club Applications */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-lg mr-2">
                    <Ionicons name="document-text" size={20} color="#22c55e" />
                  </View>
                  <Text className="text-lg font-bold text-gray-800">Club Applications</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/uni-staff/clubs-req' as any)}>
                  <Text className="text-teal-500 text-sm font-medium">View All →</Text>
                </TouchableOpacity>
              </View>

              {top3ClubApplications.length === 0 ? (
                <Text className="text-center text-gray-500 py-4 text-sm">
                  No pending applications
                </Text>
              ) : (
                top3ClubApplications.map((app: any) => (
                  <View key={app.applicationId} className="border-t border-gray-100 pt-3 mt-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">{app.clubName}</Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          By: {app.submittedBy?.fullName || app.proposer?.fullName || 'Unknown'}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-0.5">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[app.status] + '20' }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: STATUS_COLORS[app.status] }}
                        >
                          {app.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Pending Events - Awaiting UniStaff Approval */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="bg-purple-100 p-2 rounded-lg mr-2">
                    <Ionicons name="calendar" size={20} color="#a855f7" />
                  </View>
                  <Text className="text-lg font-bold text-gray-800">Awaiting Your Approval</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/uni-staff/event-requests' as any)}>
                  <Text className="text-teal-500 text-sm font-medium">View All →</Text>
                </TouchableOpacity>
              </View>

              {eventsLoading ? (
                <ActivityIndicator size="small" color="#14B8A6" />
              ) : top3PendingEvents.length === 0 ? (
                <Text className="text-center text-gray-500 py-4 text-sm">No events awaiting approval</Text>
              ) : (
                top3PendingEvents.map((event: any) => (
                  <View key={event.id} className="border-t border-gray-100 pt-3 mt-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">{event.name}</Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {new Date(event.date).toLocaleDateString()} • {event.locationName}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-0.5">
                          Host: {event.hostClub?.name || 'N/A'}
                        </Text>
                      </View>
                      <View
                        className="px-2 py-1 rounded-full bg-yellow-100"
                      >
                        <Text className="text-xs font-medium text-yellow-700">
                          ⏳ PENDING
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Top Clubs by Ranking */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <View className="bg-yellow-100 p-2 rounded-lg mr-2">
                  <Ionicons name="trophy" size={20} color="#eab308" />
                </View>
                <Text className="text-lg font-bold text-gray-800">Top Clubs</Text>
              </View>

              {clubsLoading ? (
                <ActivityIndicator size="small" color="#14B8A6" />
              ) : top5Clubs.length === 0 ? (
                <Text className="text-center text-gray-500 py-4 text-sm">No clubs available</Text>
              ) : (
                top5Clubs.map((club: any, index: number) => (
                  <View key={club.id} className="border-t border-gray-100 pt-3 mt-3">
                    <View className="flex-row items-center">
                      {/* Rank Badge */}
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                          club.rank === 1
                            ? 'bg-yellow-400'
                            : club.rank === 2
                            ? 'bg-gray-300'
                            : club.rank === 3
                            ? 'bg-orange-400'
                            : 'bg-blue-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            club.rank <= 3 ? 'text-white' : 'text-blue-800'
                          }`}
                        >
                          #{club.rank}
                        </Text>
                      </View>

                      {/* Club Info */}
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">{club.name}</Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          Leader: {club.leaderName || 'Not assigned'}
                        </Text>
                      </View>

                      {/* Stats */}
                      <View className="items-end">
                        <View className="flex-row items-center">
                          <Ionicons name="trophy" size={12} color="#a855f7" />
                          <Text className="text-sm font-bold text-purple-600 ml-1">
                            {club.totalPoints}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          {club.memberCount} members
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* University Points Summary */}
            {universityPointsData && (
              <View className="rounded-2xl p-4 shadow-md" style={{ backgroundColor: '#8B5CF6' }}>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white text-lg font-bold">University Points</Text>
                  <Ionicons name="trophy" size={24} color="white" />
                </View>
                <Text className="text-white text-4xl font-bold">
                  {universityPointsData.totalUniversityPoints.toLocaleString()}
                </Text>
                <Text className="text-white text-xs opacity-80 mt-1">
                  Total points across all clubs
                </Text>
              </View>
            )}

            {/* Attendance Summary */}
            {attendanceSummary && (
              <View className="rounded-2xl p-4 shadow-md" style={{ backgroundColor: '#14B8A6' }}>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white text-lg font-bold">Total Participants</Text>
                  <Ionicons name="people" size={24} color="white" />
                </View>
                <Text className="text-white text-4xl font-bold">
                  {totalParticipants.toLocaleString()}
                </Text>
                <Text className="text-white text-xs opacity-80 mt-1">
                  Year {attendanceYear} • All events
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <View className="p-4 space-y-4">
            {/* Club Applications Analytics */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-lg font-bold text-gray-800 mb-4">
                Club Applications Status
              </Text>

              {/* Stats Bars */}
              <View className="space-y-3">
                {/* Pending */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">Pending</Text>
                    <Text className="text-sm font-bold text-yellow-600">
                      {pendingClubApplications}
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-yellow-500 rounded-full"
                      style={{
                        width: `${
                          totalClubApplications > 0
                            ? (pendingClubApplications / totalClubApplications) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Approved */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">Approved</Text>
                    <Text className="text-sm font-bold text-green-600">
                      {approvedClubApplications}
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${
                          totalClubApplications > 0
                            ? (approvedClubApplications / totalClubApplications) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Rejected */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">Rejected</Text>
                    <Text className="text-sm font-bold text-red-600">
                      {rejectedClubApplications}
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${
                          totalClubApplications > 0
                            ? (rejectedClubApplications / totalClubApplications) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Event Status Analytics */}
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-lg font-bold text-gray-800 mb-4">Event Status Overview</Text>

              {/* Stats Bars */}
              <View className="space-y-3">
                {/* Approved */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">✅ Approved</Text>
                    <Text className="text-sm font-bold text-green-600">{approvedEvents}</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${
                          totalEventRequests > 0 ? (approvedEvents / totalEventRequests) * 100 : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Ongoing */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">🟢 Ongoing</Text>
                    <Text className="text-sm font-bold text-blue-600">{ongoingEvents}</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${
                          totalEventRequests > 0 ? (ongoingEvents / totalEventRequests) * 100 : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Completed */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">🏁 Completed</Text>
                    <Text className="text-sm font-bold text-teal-600">{completedEvents}</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-teal-500 rounded-full"
                      style={{
                        width: `${
                          totalEventRequests > 0 ? (completedEvents / totalEventRequests) * 100 : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Pending UniStaff */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">🕓 Pending (UniStaff)</Text>
                    <Text className="text-sm font-bold text-yellow-600">{pendingUnistaffEvents}</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-yellow-500 rounded-full"
                      style={{
                        width: `${
                          totalEventRequests > 0 ? (pendingUnistaffEvents / totalEventRequests) * 100 : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Pending CoClub */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">⏳ Pending (CoClub)</Text>
                    <Text className="text-sm font-bold text-orange-600">{pendingCoclubEvents}</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-orange-500 rounded-full"
                      style={{
                        width: `${
                          totalEventRequests > 0 ? (pendingCoclubEvents / totalEventRequests) * 100 : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Rejected */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">❌ Rejected</Text>
                    <Text className="text-sm font-bold text-red-600">{rejectedEvents}</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${
                          totalEventRequests > 0 ? (rejectedEvents / totalEventRequests) * 100 : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Cancelled */}
                <View>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-medium text-gray-700">🚫 Cancelled</Text>
                    <Text className="text-sm font-bold text-gray-600">{cancelledEvents}</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gray-500 rounded-full"
                      style={{
                        width: `${
                          totalEventRequests > 0 ? (cancelledEvents / totalEventRequests) * 100 : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Attendance Ranking */}
            {attendanceRanking && (
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-lg font-bold text-gray-800 mb-4">
                  Club Attendance Ranking
                </Text>

                <View className="bg-purple-50 rounded-xl p-3 mb-4">
                  <Text className="text-sm text-gray-600">Total Attendances</Text>
                  <Text className="text-2xl font-bold text-purple-600">
                    {attendanceRanking.totalAttendances.toLocaleString()}
                  </Text>
                </View>

                <View className="space-y-2">
                  {attendanceRanking.clubRankings.slice(0, 5).map((club: any) => (
                    <View key={club.clubId} className="flex-row items-center py-2 border-b border-gray-100">
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                          club.rank === 1
                            ? 'bg-yellow-400'
                            : club.rank === 2
                            ? 'bg-gray-300'
                            : club.rank === 3
                            ? 'bg-orange-400'
                            : 'bg-purple-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            club.rank <= 3 ? 'text-white' : 'text-purple-600'
                          }`}
                        >
                          {club.rank}
                        </Text>
                      </View>
                      <Text className="flex-1 text-sm font-medium text-gray-800">
                        {club.clubName}
                      </Text>
                      <Text className="text-sm font-bold text-purple-600">
                        {club.attendanceCount}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Monthly Attendance */}
            {attendanceSummary && (
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-lg font-bold text-gray-800 mb-4">
                  Monthly Attendance ({attendanceYear})
                </Text>

                <View className="space-y-2">
                  {attendanceSummary.monthlySummary.map((item: any) => {
                    const monthDate = new Date(item.month + '-01');
                    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });

                    return (
                      <View key={item.month} className="flex-row items-center py-2 border-b border-gray-100">
                        <Text className="w-12 text-sm font-medium text-gray-700">{monthName}</Text>
                        <View className="flex-1 mx-2">
                          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <View
                              className="h-full bg-teal-500 rounded-full"
                              style={{
                                width: `${
                                  totalParticipants > 0
                                    ? (item.participantCount / totalParticipants) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </View>
                        </View>
                        <Text className="text-sm font-bold text-teal-600">
                          {item.participantCount}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Bottom spacing for navigation bar */}
        <View className="h-20" />
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
