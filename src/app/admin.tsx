import NavigationBar from '@components/navigation/NavigationBar';
import { Ionicons } from '@expo/vector-icons';
import { useClubStats, useEvents, useUserStats } from '@hooks/useQueryHooks';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper to get event status based on date and time
const getEventStatus = (eventDate: string, eventTime: string) => {
  if (!eventDate) return 'Finished';
  const now = new Date();
  const [hour = '00', minute = '00'] = (eventTime || '00:00').split(':');
  const event = new Date(eventDate);
  event.setHours(Number(hour), Number(minute), 0, 0);

  const EVENT_DURATION_MS = 2 * 60 * 60 * 1000;
  const start = event.getTime();
  const end = start + EVENT_DURATION_MS;

  if (now.getTime() < start) {
    if (start - now.getTime() < 7 * 24 * 60 * 60 * 1000) return 'Soon';
    return 'Future';
  }
  if (now.getTime() >= start && now.getTime() <= end) return 'Now';
  return 'Finished';
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 min-w-[160px] bg-white rounded-2xl p-4 shadow-md"
    style={{ borderLeftWidth: 4, borderLeftColor: color }}
  >
    <View className="flex-row items-center justify-between mb-2">
      <Ionicons name={icon} size={32} color={color} />
      <Text className="text-3xl font-bold" style={{ color }}>
        {value}
      </Text>
    </View>
    <Text className="text-sm text-gray-600 font-medium">{title}</Text>
  </TouchableOpacity>
);

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onPress, icon, label }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center justify-center px-4 py-2 rounded-xl ${
      active ? 'bg-blue-500' : 'bg-gray-200'
    }`}
  >
    <Ionicons name={icon} size={18} color={active ? 'white' : '#666'} />
    <Text className={`ml-2 font-semibold text-sm ${active ? 'text-white' : 'text-gray-600'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function AdminPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  // State for tabs
  const [userStatsTab, setUserStatsTab] = useState<'table' | 'chart'>('table');
  const [clubStatsTab, setClubStatsTab] = useState<'table' | 'chart'>('table');
  const [eventStatsTab, setEventStatsTab] = useState<'table' | 'chart'>('table');
  
  // Fetch data using React Query hooks
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: userStats, isLoading: userStatsLoading } = useUserStats();
  const { data: clubStats, isLoading: clubStatsLoading } = useClubStats();

  const handleLogout = async () => {
    await logout();
    router.replace('/login' as any);
  };

  // Calculate statistics
  const totalClubs = clubStats?.totalClubs || 0;
  const totalMembers = clubStats?.totalMembers || 0;
  const activeMembers = clubStats?.activeMembers || 0;
  const totalEvents = events.length;
  const totalUsers = userStats?.total || 0;
  const activeUsers = userStats?.active || 0;
  const inactiveUsers = userStats?.inactive || 0;

  // Event statistics
  const eventStats = useMemo(() => {
    const approved = events.filter((e: any) => e.status === 'APPROVED').length;
    const pending = events.filter((e: any) => e.status === 'PENDING').length;
    const rejected = events.filter((e: any) => e.status === 'REJECTED').length;
    const now = events.filter((e: any) => getEventStatus(e.date, e.startTime || e.time) === 'Now').length;
    const soon = events.filter((e: any) => getEventStatus(e.date, e.startTime || e.time) === 'Soon').length;
    const finished = events.filter((e: any) => getEventStatus(e.date, e.startTime || e.time) === 'Finished').length;
    
    return { approved, pending, rejected, now, soon, finished };
  }, [events]);

  const isLoading = eventsLoading || userStatsLoading || clubStatsLoading;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
        <Text className="text-2xl font-bold text-gray-800">Admin Dashboard</Text>
            <Text className="text-sm text-gray-500 mt-1">Welcome back, {user?.fullName}</Text>
          </View>
        <TouchableOpacity
          onPress={handleLogout}
            className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center"
        >
            <Ionicons name="log-out" size={18} color="white" />
          <Text className="text-white font-medium ml-2">Logout</Text>
        </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-4">Loading dashboard...</Text>
          </View>
        ) : (
          <View className="px-4 py-6">
            {/* Overview Stats */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-3">Overview</Text>
              <View className="flex-row flex-wrap gap-3">
                <StatsCard
                  title="Total Users"
                  value={totalUsers}
                  icon="people"
                  color="#3B82F6"
                  onPress={() => router.push('/admin/users' as any)}
                />
                <StatsCard
                  title="Total Clubs"
                  value={totalClubs}
                  icon="business"
                  color="#8B5CF6"
                  onPress={() => router.push('/admin/clubs' as any)}
                />
                <StatsCard
                  title="Total Events"
                  value={totalEvents}
                  icon="calendar"
                  color="#10B981"
                  onPress={() => router.push('/admin/events' as any)}
                />
                <StatsCard
                  title="Total Members"
                  value={totalMembers}
                  icon="people-circle"
                  color="#F59E0B"
                />
              </View>
            </View>

            {/* User Statistics Section */}
            <View className="bg-white rounded-3xl p-5 shadow-md mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-800">User Statistics</Text>
                <View className="flex-row gap-2">
                  <TabButton
                    active={userStatsTab === 'table'}
                    onPress={() => setUserStatsTab('table')}
                    icon="list"
                    label="Table"
                  />
                  <TabButton
                    active={userStatsTab === 'chart'}
                    onPress={() => setUserStatsTab('chart')}
                    icon="pie-chart"
                    label="Chart"
                  />
                </View>
              </View>

              {userStatsTab === 'table' ? (
                <View>
                  {/* Stats Grid */}
                  <View className="flex-row flex-wrap gap-3 mb-4">
                    <View className="flex-1 min-w-[140px] bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                      <Ionicons name="people" size={32} color="#3B82F6" />
                      <Text className="text-3xl font-bold text-blue-700 mt-2">{totalUsers}</Text>
                      <Text className="text-sm text-blue-600 font-medium mt-1">Total Users</Text>
                    </View>
                    <View className="flex-1 min-w-[140px] bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
                      <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                      <Text className="text-3xl font-bold text-green-700 mt-2">{activeUsers}</Text>
                      <Text className="text-sm text-green-600 font-medium mt-1">Active</Text>
                    </View>
                    <View className="flex-1 min-w-[140px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                      <Ionicons name="close-circle" size={32} color="#6B7280" />
                      <Text className="text-3xl font-bold text-gray-700 mt-2">{inactiveUsers}</Text>
                      <Text className="text-sm text-gray-600 font-medium mt-1">Inactive</Text>
                    </View>
                  </View>

                  {/* Breakdown Table */}
                  <View className="border border-gray-200 rounded-2xl overflow-hidden">
                    <View className="bg-gray-100 px-4 py-3 flex-row">
                      <Text className="flex-1 font-semibold text-gray-700">Metric</Text>
                      <Text className="w-20 font-semibold text-gray-700 text-right">Value</Text>
                      <Text className="w-20 font-semibold text-gray-700 text-right">%</Text>
                    </View>
                    <View className="bg-white">
                      <View className="px-4 py-3 flex-row border-b border-gray-100">
                        <Text className="flex-1 text-gray-900 font-medium">Total Users</Text>
                        <Text className="w-20 text-gray-900 font-bold text-right">{totalUsers}</Text>
                        <Text className="w-20 text-gray-500 text-right">100%</Text>
                      </View>
                      <View className="px-4 py-3 flex-row border-b border-gray-100">
                        <Text className="flex-1 text-gray-700">Active Users</Text>
                        <Text className="w-20 text-green-600 font-semibold text-right">{activeUsers}</Text>
                        <Text className="w-20 text-green-600 text-right">
                          {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}%
                        </Text>
                      </View>
                      <View className="px-4 py-3 flex-row">
                        <Text className="flex-1 text-gray-700">Inactive Users</Text>
                        <Text className="w-20 text-gray-600 font-semibold text-right">{inactiveUsers}</Text>
                        <Text className="w-20 text-gray-600 text-right">
                          {totalUsers > 0 ? ((inactiveUsers / totalUsers) * 100).toFixed(1) : 0}%
                        </Text>
                      </View>
                      {userStats?.byRole && Object.entries(userStats.byRole).map(([role, count]: [string, any]) => (
                        <View key={role} className="px-4 py-3 flex-row border-t border-gray-100">
                          <Text className="flex-1 text-gray-700 pl-4">↳ {role}</Text>
                          <Text className="w-20 text-purple-600 font-semibold text-right">{count}</Text>
                          <Text className="w-20 text-purple-600 text-right">
                            {totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : 0}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ) : (
                /* Chart View */
                <View className="items-center py-6">
                  {/* Donut Chart */}
                  <View className="mb-6">
                    <Text className="text-center font-semibold text-gray-700 mb-4">Active vs Inactive</Text>
                    <View className="relative w-48 h-48 items-center justify-center">
                      {/* Simple visualization - you can replace with actual chart library */}
                      <View className="absolute w-48 h-48 rounded-full bg-green-500" 
                        style={{ 
                          opacity: totalUsers > 0 ? activeUsers / totalUsers : 0 
                        }} 
                      />
                      <View className="absolute w-32 h-32 rounded-full bg-white items-center justify-center">
                        <Text className="text-3xl font-bold text-gray-800">{totalUsers}</Text>
                        <Text className="text-xs text-gray-500">Total</Text>
                      </View>
                    </View>
                  </View>

                  {/* Legend */}
                  <View className="w-full gap-3">
                    <View className="bg-green-50 border border-green-200 rounded-xl p-4 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="w-4 h-4 rounded-full bg-green-500 mr-3" />
                        <Text className="font-medium text-gray-700">Active</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-2xl font-bold text-green-600 mr-2">{activeUsers}</Text>
                        <Text className="text-sm text-green-600">
                          ({totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%)
            </Text>
                      </View>
                    </View>
                    <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="w-4 h-4 rounded-full bg-gray-400 mr-3" />
                        <Text className="font-medium text-gray-700">Inactive</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-2xl font-bold text-gray-600 mr-2">{inactiveUsers}</Text>
                        <Text className="text-sm text-gray-600">
                          ({totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0}%)
            </Text>
          </View>
                    </View>
                  </View>
                </View>
              )}
        </View>

            {/* Club Statistics Section */}
            <View className="bg-white rounded-3xl p-5 shadow-md mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-800">Club Statistics</Text>
                <View className="flex-row gap-2">
                  <TabButton
                    active={clubStatsTab === 'table'}
                    onPress={() => setClubStatsTab('table')}
                    icon="list"
                    label="Table"
                  />
                  <TabButton
                    active={clubStatsTab === 'chart'}
                    onPress={() => setClubStatsTab('chart')}
                    icon="bar-chart"
                    label="Chart"
                  />
                </View>
              </View>

              {clubStatsTab === 'table' ? (
                <View>
                  {/* Stats Grid */}
                  <View className="flex-row flex-wrap gap-3 mb-4">
                    <View className="flex-1 min-w-[140px] bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 border border-indigo-200">
                      <Ionicons name="business" size={32} color="#6366F1" />
                      <Text className="text-3xl font-bold text-indigo-700 mt-2">{totalClubs}</Text>
                      <Text className="text-sm text-indigo-600 font-medium mt-1">Total Clubs</Text>
                    </View>
                    <View className="flex-1 min-w-[140px] bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-4 border border-cyan-200">
                      <Ionicons name="people-circle" size={32} color="#06B6D4" />
                      <Text className="text-3xl font-bold text-cyan-700 mt-2">{totalMembers}</Text>
                      <Text className="text-sm text-cyan-600 font-medium mt-1">Total Members</Text>
                    </View>
                    <View className="flex-1 min-w-[140px] bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-200">
                      <Ionicons name="person-add" size={32} color="#10B981" />
                      <Text className="text-3xl font-bold text-emerald-700 mt-2">{activeMembers}</Text>
                      <Text className="text-sm text-emerald-600 font-medium mt-1">Active Members</Text>
                    </View>
                  </View>

                  {/* Breakdown Table */}
                  <View className="border border-gray-200 rounded-2xl overflow-hidden">
                    <View className="bg-gray-100 px-4 py-3 flex-row">
                      <Text className="flex-1 font-semibold text-gray-700">Metric</Text>
                      <Text className="w-24 font-semibold text-gray-700 text-right">Value</Text>
                      <Text className="w-24 font-semibold text-gray-700 text-right">Details</Text>
                    </View>
                    <View className="bg-white">
                      <View className="px-4 py-3 flex-row border-b border-gray-100">
                        <Text className="flex-1 text-gray-900 font-medium">Total Clubs</Text>
                        <Text className="w-24 text-indigo-600 font-bold text-right">{totalClubs}</Text>
                        <Text className="w-24 text-gray-500 text-xs text-right">All registered</Text>
                      </View>
                      <View className="px-4 py-3 flex-row border-b border-gray-100">
                        <Text className="flex-1 text-gray-900 font-medium">Total Members</Text>
                        <Text className="w-24 text-cyan-600 font-bold text-right">{totalMembers}</Text>
                        <Text className="w-24 text-gray-500 text-xs text-right">
                          {totalClubs > 0 ? (totalMembers / totalClubs).toFixed(1) : 0} avg
                        </Text>
                      </View>
                      <View className="px-4 py-3 flex-row border-b border-gray-100">
                        <Text className="flex-1 text-gray-900 font-medium">Active Members</Text>
                        <Text className="w-24 text-emerald-600 font-bold text-right">{activeMembers}</Text>
                        <Text className="w-24 text-emerald-600 text-xs text-right">
                          {totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(1) : 0}%
                        </Text>
                      </View>
                      <View className="px-4 py-3 flex-row">
                        <Text className="flex-1 text-gray-900 font-medium">Inactive Members</Text>
                        <Text className="w-24 text-gray-600 font-bold text-right">{totalMembers - activeMembers}</Text>
                        <Text className="w-24 text-gray-600 text-xs text-right">
                          {totalMembers > 0 ? (((totalMembers - activeMembers) / totalMembers) * 100).toFixed(1) : 0}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                /* Chart View */
                <View className="py-4">
                  <Text className="text-center font-semibold text-gray-700 mb-6">Club & Membership Metrics</Text>
                  <View className="gap-4">
                    {/* Total Clubs Bar */}
                    <View>
                      <View className="flex-row justify-between mb-2">
                        <Text className="font-medium text-gray-700">Total Clubs</Text>
                        <Text className="font-bold text-indigo-600">{totalClubs}</Text>
                      </View>
                      <View className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                        <View 
                          className="h-full bg-indigo-500 items-center justify-center"
                          style={{ 
                            width: `${Math.max(totalClubs, totalMembers, activeMembers) > 0 ? (totalClubs / Math.max(totalClubs, totalMembers, activeMembers)) * 100 : 0}%` 
                          }}
                        >
                          {totalClubs > 0 && (
                            <Text className="text-xs font-bold text-white">{totalClubs}</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Total Members Bar */}
                    <View>
                      <View className="flex-row justify-between mb-2">
                        <Text className="font-medium text-gray-700">Total Members</Text>
                        <Text className="font-bold text-cyan-600">{totalMembers}</Text>
                      </View>
                      <View className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                        <View 
                          className="h-full bg-cyan-500 items-center justify-center"
                          style={{ 
                            width: `${Math.max(totalClubs, totalMembers, activeMembers) > 0 ? (totalMembers / Math.max(totalClubs, totalMembers, activeMembers)) * 100 : 0}%` 
                          }}
                        >
                          {totalMembers > 0 && (
                            <Text className="text-xs font-bold text-white">{totalMembers}</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Active Members Bar */}
                    <View>
                      <View className="flex-row justify-between mb-2">
                        <Text className="font-medium text-gray-700">Active Members</Text>
                        <Text className="font-bold text-emerald-600">{activeMembers}</Text>
                      </View>
                      <View className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                        <View 
                          className="h-full bg-emerald-500 items-center justify-center"
                          style={{ 
                            width: `${Math.max(totalClubs, totalMembers, activeMembers) > 0 ? (activeMembers / Math.max(totalClubs, totalMembers, activeMembers)) * 100 : 0}%` 
                          }}
                        >
                          {activeMembers > 0 && (
                            <Text className="text-xs font-bold text-white">{activeMembers}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Event Statistics Section */}
            <View className="bg-white rounded-3xl p-5 shadow-md mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-800">Event Statistics</Text>
                <TouchableOpacity
                  onPress={() => router.push('/admin/events' as any)}
                  className="bg-blue-100 px-3 py-2 rounded-lg"
                >
                  <Text className="text-blue-600 font-medium text-xs">View All</Text>
            </TouchableOpacity>
          </View>

              {/* Stats Grid */}
              <View className="flex-row flex-wrap gap-2 mb-4">
                <View className="flex-1 min-w-[100px] bg-purple-50 border border-purple-200 rounded-xl p-3 items-center">
                  <Ionicons name="calendar" size={24} color="#8B5CF6" />
                  <Text className="text-2xl font-bold text-purple-700 mt-1">{totalEvents}</Text>
                  <Text className="text-xs text-purple-600 font-medium">Total</Text>
                </View>
                <View className="flex-1 min-w-[100px] bg-green-50 border border-green-200 rounded-xl p-3 items-center">
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text className="text-2xl font-bold text-green-700 mt-1">{eventStats.approved}</Text>
                  <Text className="text-xs text-green-600 font-medium">Approved</Text>
                </View>
                <View className="flex-1 min-w-[100px] bg-yellow-50 border border-yellow-200 rounded-xl p-3 items-center">
                  <Ionicons name="time" size={24} color="#F59E0B" />
                  <Text className="text-2xl font-bold text-yellow-700 mt-1">{eventStats.pending}</Text>
                  <Text className="text-xs text-yellow-600 font-medium">Pending</Text>
                </View>
                <View className="flex-1 min-w-[100px] bg-red-50 border border-red-200 rounded-xl p-3 items-center">
                  <Ionicons name="trending-up" size={24} color="#EF4444" />
                  <Text className="text-2xl font-bold text-red-700 mt-1">{eventStats.now}</Text>
                  <Text className="text-xs text-red-600 font-medium">Now</Text>
                </View>
                <View className="flex-1 min-w-[100px] bg-blue-50 border border-blue-200 rounded-xl p-3 items-center">
                  <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
                  <Text className="text-2xl font-bold text-blue-700 mt-1">{eventStats.soon}</Text>
                  <Text className="text-xs text-blue-600 font-medium">Soon</Text>
                </View>
                <View className="flex-1 min-w-[100px] bg-gray-50 border border-gray-200 rounded-xl p-3 items-center">
                  <Ionicons name="checkmark-done" size={24} color="#6B7280" />
                  <Text className="text-2xl font-bold text-gray-700 mt-1">{eventStats.finished}</Text>
                  <Text className="text-xs text-gray-600 font-medium">Finished</Text>
                </View>
              </View>

              {/* Event Breakdown */}
              <View className="border border-gray-200 rounded-2xl overflow-hidden">
                <View className="bg-gray-100 px-4 py-3">
                  <Text className="font-semibold text-gray-700">Event Status Breakdown</Text>
                </View>
                <View className="bg-white">
                  <View className="px-4 py-3 flex-row justify-between border-b border-gray-100">
                    <Text className="text-gray-700">Approval Rate</Text>
                    <Text className="font-bold text-green-600">
                      {totalEvents > 0 ? ((eventStats.approved / totalEvents) * 100).toFixed(1) : 0}%
                    </Text>
                  </View>
                  <View className="px-4 py-3 flex-row justify-between border-b border-gray-100">
                    <Text className="text-gray-700">Pending Rate</Text>
                    <Text className="font-bold text-yellow-600">
                      {totalEvents > 0 ? ((eventStats.pending / totalEvents) * 100).toFixed(1) : 0}%
                    </Text>
                  </View>
                  <View className="px-4 py-3 flex-row justify-between">
                    <Text className="text-gray-700">Completion Rate</Text>
                    <Text className="font-bold text-gray-600">
                      {totalEvents > 0 ? ((eventStats.finished / totalEvents) * 100).toFixed(1) : 0}%
                    </Text>
                  </View>
                </View>
              </View>
        </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
