import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { useMyClubApplications, useMyMemberApplications, useMyRedeemOrders } from '@hooks/useQueryHooks';
import type { ClubApplication } from '@services/clubApplication.service';
import type { MemberApplication } from '@services/memberApplication.service';
import type { RedeemOrder } from '@services/redeem.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ActivityType = 'memberApplication' | 'clubApplication' | 'redeemOrder';

interface Activity {
  type: ActivityType;
  date: string;
  data: MemberApplication | ClubApplication | RedeemOrder;
}

type TabType = 'member' | 'club' | 'order';

export default function StudentHistoryPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('member');
  const [filter, setFilter] = useState<string>('all');

  // ✅ USE REACT QUERY for applications
  const {
    data: memberApplications = [],
    isLoading: memberLoading,
    error: memberError,
    refetch: refetchMemberApps,
  } = useMyMemberApplications();

  const {
    data: clubApplications = [],
    isLoading: clubLoading,
    error: clubError,
    refetch: refetchClubApps,
  } = useMyClubApplications();

  const {
    data: redeemOrders = [],
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchRedeemOrders,
  } = useMyRedeemOrders();

  const loading = activeTab === 'member' ? memberLoading : activeTab === 'club' ? clubLoading : orderLoading;
  const error = activeTab === 'member' ? memberError : activeTab === 'club' ? clubError : orderError;

  // Pull to refresh
  const onRefresh = async () => {
    if (activeTab === 'member') {
      await refetchMemberApps();
    } else if (activeTab === 'club') {
      await refetchClubApps();
    } else {
      await refetchRedeemOrders();
    }
  };

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setFilter('all'); // Reset filter when changing tabs
  };

  // Get filter options based on active tab
  const filterOptions = useMemo(() => {
    switch (activeTab) {
      case 'member':
        return [
          { value: 'all', label: 'All Statuses' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
        ];
      case 'club':
        return [
          { value: 'all', label: 'All Statuses' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'COMPLETE', label: 'Complete' },
        ];
      case 'order':
        return [
          { value: 'all', label: 'All Statuses' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'REFUNDED', label: 'Refunded' },
          { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ];
      default:
        return [{ value: 'all', label: 'All Statuses' }];
    }
  }, [activeTab]);

  // Prepare activities based on active tab
  const sortedActivities = useMemo(() => {
    let activities: Activity[] = [];

    if (activeTab === 'member') {
      activities = memberApplications.map((app) => ({
        type: 'memberApplication' as const,
        date: app.createdAt || new Date().toISOString(),
        data: app,
      }));
    } else if (activeTab === 'club') {
      activities = clubApplications.map((app) => ({
        type: 'clubApplication' as const,
        date: app.submittedAt || new Date().toISOString(),
        data: app,
      }));
    } else {
      activities = redeemOrders.map((order) => ({
        type: 'redeemOrder' as const,
        date: order.createdAt || new Date().toISOString(),
        data: order,
      }));
    }

    // Apply filter
    if (filter !== 'all') {
      activities = activities.filter((activity) => {
        const data = activity.data as any;
        return data.status === filter;
      });
    }

    // Sort by date descending
    return activities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [activeTab, memberApplications, clubApplications, redeemOrders, filter]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'REJECTED':
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
      case 'CANCELLED':
        return 'bg-red-500';
      case 'COMPLETE':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-green-100 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 border-yellow-300';
      case 'REJECTED':
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
      case 'CANCELLED':
        return 'bg-red-100 border-red-300';
      case 'COMPLETE':
        return 'bg-blue-100 border-blue-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  // Get status text color
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'text-green-800';
      case 'PENDING':
        return 'text-yellow-800';
      case 'REJECTED':
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
      case 'CANCELLED':
        return 'text-red-800';
      case 'COMPLETE':
        return 'text-blue-800';
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
        <View className="mb-4 border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => handleTabChange('member')}
                className={`pb-3 px-4 ${
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
                onPress={() => handleTabChange('club')}
                className={`pb-3 px-4 ${
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

              <TouchableOpacity
                onPress={() => handleTabChange('order')}
                className={`pb-3 px-4 ${
                  activeTab === 'order' ? 'border-b-2 border-blue-600' : ''
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-lg mr-1">📦</Text>
                  <Text
                    className={`font-semibold ${
                      activeTab === 'order' ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    Orders
                  </Text>
                  {redeemOrders.length > 0 && (
                    <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-bold text-blue-600">
                        {redeemOrders.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Filter Dropdown */}
        <View className="mb-4">
          <View className="bg-white rounded-lg border border-gray-200">
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-3"
              onPress={() => {
                // In a real app, you'd show a modal or dropdown here
                // For now, we'll cycle through options
                const currentIndex = filterOptions.findIndex(opt => opt.value === filter);
                const nextIndex = (currentIndex + 1) % filterOptions.length;
                setFilter(filterOptions[nextIndex].value);
              }}
            >
              <Text className="text-gray-700">
                Filter: {filterOptions.find(opt => opt.value === filter)?.label}
              </Text>
              <Text className="text-gray-400">▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        >
          {loading ? (
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
              <Text className="text-gray-500 text-center px-8">
                {error instanceof Error ? error.message : String(error)}
              </Text>
              <TouchableOpacity
                onPress={onRefresh}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Try Again</Text>
              </TouchableOpacity>
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
                  : activeTab === 'club'
                  ? 'Your club creation applications will appear here'
                  : 'Your product order history will appear here'}
              </Text>
            </View>
          ) : (
            <View className="pb-4">
              {sortedActivities.map((activity, index) => {
                const isMemberApp = activity.type === 'memberApplication';
                const isClubApp = activity.type === 'clubApplication';
                const isOrder = activity.type === 'redeemOrder';
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
                            isMemberApp ? 'bg-blue-100' : isClubApp ? 'bg-indigo-100' : 'bg-purple-100'
                          }`}
                        >
                          <Text className="text-2xl">
                            {isMemberApp ? '👥' : isClubApp ? '🏢' : '📦'}
                          </Text>
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-900 mb-1">
                            {isMemberApp
                              ? 'Member Application'
                              : isClubApp
                              ? 'Club Creation Application'
                              : 'Product Order'}
                          </Text>

                          {isMemberApp ? (
                            <Text className="text-sm text-gray-600">
                              Applied to: {data.clubName || `Club ${data.clubId}`}
                            </Text>
                          ) : isClubApp ? (
                            <>
                              <Text className="text-sm text-gray-600 mb-1">
                                Club: {data.clubName}
                              </Text>
                              {data.majorName && (
                                <Text className="text-xs text-gray-500">
                                  Major: {data.majorName}
                                </Text>
                              )}
                            </>
                          ) : (
                            <>
                              <Text className="text-sm text-gray-600 mb-1">
                                Product: {data.productName}
                              </Text>
                              <Text className="text-sm text-gray-600">
                                Quantity: {data.quantity}
                              </Text>
                              <Text className="text-sm font-medium text-blue-600 mt-1">
                                Total Points: {data.totalPoints}
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

                      {/* Description/Reason/Message */}
                      {(data.message || data.reason || data.description || data.vision || data.orderCode || data.clubName) && !isOrder && (
                        <View className="bg-gray-50 p-3 rounded-lg mb-3">
                          {data.description && (
                            <Text className="text-sm text-gray-700 mb-2">
                              {data.description}
                            </Text>
                          )}
                          {data.vision && (
                            <Text className="text-sm text-gray-700 mb-2">
                              Vision: {data.vision}
                            </Text>
                          )}
                          {(data.message || data.reason) && (
                            <Text className="text-sm text-gray-700">
                              {data.message || data.reason}
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Order Details */}
                      {isOrder && (
                        <View className="bg-gray-50 p-3 rounded-lg mb-3">
                          <Text className="text-sm text-gray-700 mb-1">
                            Order Code: <Text className="font-medium">{data.orderCode}</Text>
                          </Text>
                          <Text className="text-xs text-gray-600 mb-1">
                            From: {data.clubName}
                          </Text>
                          {data.productType && (
                            <Text className="text-xs text-gray-600">
                              Type: {data.productType}
                            </Text>
                          )}
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

                      {/* Refund Reason */}
                      {(data.status === 'REFUNDED' || data.status === 'PARTIALLY_REFUNDED') && data.reasonRefund && (
                        <View className="bg-red-50 p-3 rounded-lg mb-3">
                          <Text className="text-xs font-semibold text-red-800 mb-1">
                            Refund Reason:
                          </Text>
                          <Text className="text-sm text-red-700">
                            {data.reasonRefund}
                          </Text>
                        </View>
                      )}

                      {/* Reviewed By */}
                      {(data.handledByName || (data.reviewedBy && typeof data.reviewedBy === 'object' && data.reviewedBy.fullName)) && (
                        <Text className="text-xs text-gray-500 mb-2">
                          Reviewed by: {data.handledByName || (typeof data.reviewedBy === 'object' ? data.reviewedBy.fullName : '')}
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
