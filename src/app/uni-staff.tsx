/**
 * University Staff Dashboard (Mobile)
 * 
 * ✅ Refactored with modular components:
 * - StatisticsCards: Overview statistics display
 * - ClubApplicationsList: Club application management
 * - EventRequestsList: Event request management
 * - TopClubsRanking: Top clubs by ranking with university points
 * - DataSummaryTables: Locations, tags, majors, policies
 * - AttendanceSummaryCard: Monthly attendance analytics
 * - Uses React Query hooks for data fetching
 * - Full mobile-responsive design matching web version
 */

import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import {
    AttendanceSummaryCard,
    ClubApplicationsList,
    DataSummaryTables,
    EventRequestsList,
    StatisticsCards,
    TopClubsRanking
} from '@components/uni-staff';
import { Ionicons } from '@expo/vector-icons';
import { useClubApplications, useClubs, useEvents, usePolicies } from '@hooks/useQueryHooks';
import { ClubService } from '@services/club.service';
import { LocationService } from '@services/location.service';
import { MajorService } from '@services/major.service';
import { MultiplierPolicyService } from '@services/multiplierPolicy.service';
import { TagService } from '@services/tag.service';
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
  const [locations, setLocations] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [multiplierPolicies, setMultiplierPolicies] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendanceYear, setAttendanceYear] = useState<number>(new Date().getFullYear());

  // Statistics
  const totalClubs = clubs.length;
  const totalPolicies = policies.length;
  const totalClubApplications = clubApplications.length;
  const totalEventRequests = events.length;

  // Count approved/pending club applications
  const approvedClubApplications = clubApplications.filter((app: any) => app.status === 'COMPLETED').length;
  const pendingClubApplications = clubApplications.filter((app: any) => app.status === 'PENDING').length;
  const rejectedClubApplications = clubApplications.filter((app: any) => app.status === 'REJECTED').length;

  // Debug: Log club applications data
  useEffect(() => {
    if (clubApplications.length > 0) {
      console.log('📊 Club Applications Data:', {
        total: clubApplications.length,
        approved: approvedClubApplications,
        pending: pendingClubApplications,
        rejected: rejectedClubApplications,
        statuses: clubApplications.map((app: any) => app.status)
      });
    }
  }, [clubApplications]);

  // Count events by status
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

  // Fetch all data
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

      // Fetch system data (locations, tags, majors, multiplier policies)
      const [locationsResponse, tagsData, majorsData, policiesData] = await Promise.all([
        LocationService.fetchLocations({ page: 0, size: 100 }), // Increase size to get more items
        TagService.fetchTags(),
        MajorService.fetchMajors(),
        MultiplierPolicyService.getMultiplierPolicies(),
      ]);

      setLocations(locationsResponse.content || []);
      setTags(tagsData);
      setMajors(majorsData);
      setMultiplierPolicies(policiesData);

      // Debug: Log System Data
      console.log('🔍 System Data Loaded:', {
        locations: locationsResponse.content?.length || 0,
        tags: tagsData?.length || 0,
        majors: majorsData?.length || 0,
        policies: policiesData?.length || 0
      });
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
    loadData(); // Always load data on mount
  }, []);

  // Reload data when attendance year changes
  useEffect(() => {
    if (attendanceYear) {
      loadData();
    }
  }, [attendanceYear]);

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

  // Top 3 recent club applications (all statuses)
  const top3RecentApplications = useMemo(() => {
    return clubApplications
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">          University Staff Dashboard</Text>
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
        <View className="p-4">
          <StatisticsCards
            totalClubs={totalClubs}
            totalPolicies={totalPolicies}
            totalClubApplications={totalClubApplications}
            pendingClubApplications={pendingClubApplications}
            completedClubApplications={approvedClubApplications}
            rejectedClubApplications={rejectedClubApplications}
            totalEventRequests={totalEventRequests}
            pendingEvents={totalPendingEvents}
            approvedEvents={approvedEvents}
            completedEvents={completedEvents}
            rejectedEvents={rejectedEvents}
            totalLocations={locations.length}
            totalTags={tags.length}
            coreTags={tags.filter((t: any) => t.core).length}
            totalMajors={majors.length}
            totalFeedbacks={0}
            avgRating={0}
            totalMultiplierPolicies={multiplierPolicies.length}
            totalPointRequests={0}
            pendingPointRequests={0}
            onClubsPress={() => router.push('/uni-staff/clubs' as any)}
            onApplicationsPress={() => router.push('/uni-staff/clubs-req' as any)}
            onEventsPress={() => router.push('/uni-staff/events-req' as any)}
          />
        </View>

        {/* Overview Content */}
        <View className="p-4 space-y-4">
            {/* Recent Club Applications Section */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-gray-800">Recent Club Applications</Text>
                <TouchableOpacity onPress={() => router.push('/uni-staff/clubs-req' as any)}>
                  <Text className="text-teal-500 text-sm font-medium">View All →</Text>
                </TouchableOpacity>
              </View>
              <ClubApplicationsList
                applications={top3RecentApplications}
                maxItems={3}
                showAll={false}
                onItemPress={(applicationId) => 
                  router.push(`/uni-staff/clubs-req/${applicationId}` as any)
                }
              />
            </View>

            {/* Pending Club Applications Section - Only show if there are pending ones */}
            {top3ClubApplications.length > 0 && (
              <View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-bold text-gray-800">⏳ Pending Applications</Text>
                  <TouchableOpacity onPress={() => router.push('/uni-staff/clubs-req' as any)}>
                    <Text className="text-amber-500 text-sm font-medium">View All →</Text>
                  </TouchableOpacity>
                </View>
                <ClubApplicationsList
                  applications={top3ClubApplications}
                  maxItems={3}
                  showAll={false}
                  onItemPress={(applicationId) => 
                    router.push(`/uni-staff/clubs-req/${applicationId}` as any)
                  }
                />
              </View>
            )}

            {/* Event Requests Section */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-gray-800">Awaiting Your Approval</Text>
                <TouchableOpacity onPress={() => router.push('/uni-staff/event-requests' as any)}>
                  <Text className="text-teal-500 text-sm font-medium">View All →</Text>
                </TouchableOpacity>
              </View>
              {eventsLoading ? (
                <ActivityIndicator size="small" color="#14B8A6" />
              ) : (
                <EventRequestsList
                  eventRequests={top3PendingEvents}
                  maxItems={3}
                  showAll={false}
                  onItemPress={(eventId) => 
                    router.push(`/uni-staff/event-requests/${eventId}` as any)
                  }
                />
              )}
            </View>

            {/* Top Clubs by Ranking */}
            <View>
              <TopClubsRanking
                rankings={universityPointsData?.clubRankings.map((ranking: any, index: number) => {
                  const club = clubsWithMemberCount.find((c: any) => c.id === ranking.clubId);
                  return {
                    ...ranking,
                    leaderName: club?.leader?.fullName || 'Unknown',
                    majorName: club?.major?.name || 'N/A',
                    memberCount: club?.memberCount || 0,
                  };
                }) || []}
                totalUniversityPoints={universityPointsData?.totalUniversityPoints || 0}
                isLoading={clubsLoading || !universityPointsData}
                onClubPress={(clubId: number) => router.push(`/uni-staff/clubs/${clubId}` as any)}
              />
            </View>

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

        {/* Analytics Section */}
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

            {/* Monthly Attendance Summary */}
            {attendanceSummary && (
              <AttendanceSummaryCard
                monthlyData={attendanceSummary.monthlySummary.map((item: any) => ({
                  month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
                  totalAttendances: item.participantCount,
                  uniqueUsers: item.uniqueParticipants || 0,
                  averagePerEvent: item.averagePerEvent || 0,
                }))}
                availableYears={[2023, 2024, 2025, 2026]}
                selectedYear={attendanceYear}
                onYearChange={(year: number) => {
                  setAttendanceYear(year);
                  // Reload data with new year
                  UniversityService.fetchAttendanceSummary(year)
                    .then(setAttendanceSummary)
                    .catch(console.error);
                }}
              />
            )}
          </View>

        {/* System Data Section */}
        <View className="p-4">
          <DataSummaryTables
            locations={locations}
            tags={tags}
            majors={majors}
            multiplierPolicies={multiplierPolicies}
          />
        </View>

        {/* Bottom spacing for navigation bar */}
        <View className="h-20" />
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
