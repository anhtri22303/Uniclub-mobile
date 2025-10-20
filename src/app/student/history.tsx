import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { ClubApplication, getMyClubApplications } from '@services/clubApplication.service';
import { MemberApplication, MemberApplicationService } from '@services/memberApplication.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ActivityType = 'memberApplication' | 'clubApplication';

interface Activity {
  type: ActivityType;
  date: string;
  data: MemberApplication | ClubApplication;
}

type TabType = 'member' | 'club';

export default function StudentHistoryPage() {
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('member');
  const [memberApplications, setMemberApplications] = useState<MemberApplication[]>([]);
  const [clubApplications, setClubApplications] = useState<ClubApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load member applications
  const loadMemberApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MemberApplicationService.getMyMemberApplications();
      setMemberApplications(data);
    } catch (err: any) {
      console.error('Failed to load member applications:', err);
      setError(err?.message || 'Failed to load member applications');
    } finally {
      setLoading(false);
    }
  };

  // Load club applications
  const loadClubApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyClubApplications();
      setClubApplications(data);
    } catch (err: any) {
      console.error('Failed to load club applications:', err);
      setError(err?.message || 'Failed to load club applications');
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'member') {
      await loadMemberApplications();
    } else {
      await loadClubApplications();
    }
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadMemberApplications();
      loadClubApplications();
    }
  }, [user]);

  // Prepare activities based on active tab
  const activities: Activity[] =
    activeTab === 'member'
      ? memberApplications.map((app) => ({
          type: 'memberApplication' as const,
          date: app.createdAt || new Date().toISOString(),
          data: app,
        }))
      : clubApplications.map((app) => ({
          type: 'clubApplication' as const,
          date: app.submittedAt || new Date().toISOString(),
          data: app,
        }));

  // Sort by date descending
  const sortedActivities = activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'REJECTED':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 border-yellow-300';
      case 'REJECTED':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  // Get status text color
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-800';
      case 'PENDING':
        return 'text-yellow-800';
      case 'REJECTED':
        return 'text-red-800';
      default:
        return 'text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-gray-900">Activity History</Text>
          <Text className="text-sm text-gray-600 mt-1">
            Track your club applications and activities
          </Text>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row mb-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setActiveTab('member')}
            className={`flex-1 pb-3 ${
              activeTab === 'member' ? 'border-b-2 border-blue-600' : ''
            }`}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-lg mr-1">👥</Text>
              <Text
                className={`font-semibold ${
                  activeTab === 'member' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                Member
              </Text>
              {memberApplications.length > 0 && (
                <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-bold text-blue-600">
                    {memberApplications.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('club')}
            className={`flex-1 pb-3 ${
              activeTab === 'club' ? 'border-b-2 border-blue-600' : ''
            }`}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-lg mr-1">🏢</Text>
              <Text
                className={`font-semibold ${
                  activeTab === 'club' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                Club
              </Text>
              {clubApplications.length > 0 && (
                <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-bold text-blue-600">
                    {clubApplications.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading && sortedActivities.length === 0 ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 mt-4">Loading activities...</Text>
            </View>
          ) : error ? (
            <View className="items-center py-20">
              <Text className="text-6xl mb-4">⚠️</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Error Loading Data
              </Text>
              <Text className="text-gray-500 text-center px-8">{error}</Text>
            </View>
          ) : sortedActivities.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-6xl mb-4">📜</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No Activity Yet
              </Text>
              <Text className="text-gray-500 text-center px-8">
                {activeTab === 'member'
                  ? 'Your club membership applications will appear here'
                  : 'Your club creation applications will appear here'}
              </Text>
            </View>
          ) : (
            <View className="pb-4">
              {sortedActivities.map((activity, index) => {
                const isMemberApp = activity.type === 'memberApplication';
                const data = activity.data as any;

                return (
                  <View
                    key={index}
                    className={`bg-white rounded-xl shadow-sm mb-3 overflow-hidden border-l-4 ${getStatusColor(
                      data.status
                    )}`}
                  >
                    <View className="p-4">
                      {/* Header */}
                      <View className="flex-row items-start mb-3">
                        {/* Icon */}
                        <View
                          className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                            isMemberApp ? 'bg-blue-100' : 'bg-indigo-100'
                          }`}
                        >
                          <Text className="text-2xl">
                            {isMemberApp ? '👥' : '🏢'}
                          </Text>
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-900 mb-1">
                            {isMemberApp
                              ? 'Member Application'
                              : 'Club Creation Application'}
                          </Text>

                          {isMemberApp ? (
                            <Text className="text-sm text-gray-600">
                              Applied to: {data.clubName || `Club ${data.clubId}`}
                            </Text>
                          ) : (
                            <>
                              <Text className="text-sm text-gray-600 mb-1">
                                Club: {data.clubName}
                              </Text>
                              <Text className="text-xs text-gray-500">
                                Category: {data.category || 'N/A'}
                              </Text>
                            </>
                          )}
                        </View>

                        {/* Status Badge */}
                        <View
                          className={`px-3 py-1 rounded-full border ${getStatusBadgeColor(
                            data.status
                          )}`}
                        >
                          <Text
                            className={`text-xs font-semibold ${getStatusTextColor(
                              data.status
                            )}`}
                          >
                            {data.status}
                          </Text>
                        </View>
                      </View>

                      {/* Description/Reason */}
                      {(data.message || data.reason || data.description) && (
                        <View className="bg-gray-50 p-3 rounded-lg mb-3">
                          <Text className="text-sm text-gray-700">
                            {data.message || data.reason || data.description}
                          </Text>
                        </View>
                      )}

                      {/* Reject Reason */}
                      {data.status === 'REJECTED' && data.rejectReason && (
                        <View className="bg-red-50 p-3 rounded-lg mb-3">
                          <Text className="text-xs font-semibold text-red-800 mb-1">
                            Reject Reason:
                          </Text>
                          <Text className="text-sm text-red-700">
                            {data.rejectReason}
                          </Text>
                        </View>
                      )}

                      {/* Reviewed By */}
                      {data.handledByName && (
                        <Text className="text-xs text-gray-500 mb-2">
                          Reviewed by: {data.handledByName}
                        </Text>
                      )}

                      {/* Date */}
                      <View className="flex-row items-center">
                        <Text className="text-gray-400 mr-1">📅</Text>
                        <Text className="text-xs text-gray-500">
                          {formatDate(activity.date)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
