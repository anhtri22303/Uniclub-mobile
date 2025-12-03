import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Services
import { ClubService } from '@services/club.service';
import { getClubRedeemOrders, RedeemOrder } from '@services/redeem.service';

// Components
import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { useAuthStore } from '@stores/auth.store';

// Types
type TabType = 'pending' | 'completed' | 'cancelled';

// Query keys
export const queryKeys = {
  clubOrders: (clubId: number) => ['clubOrders', clubId] as const,
};

export default function ClubLeaderOrdersPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  // State
  const [clubId, setClubId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get clubId from user
  useEffect(() => {
    const getClubId = () => {
      // Don't load if no user
      if (!user) return null;
      
      // Try to get clubId from user
      if (user?.clubIds && user.clubIds.length > 0) {
        return user.clubIds[0];
      }
      
      // Try to get from token
      const id = ClubService.getClubIdFromToken();
      return id || null;
    };

    const id = getClubId();
    setClubId(id);
  }, [user]);

  // Fetch orders
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery<RedeemOrder[], Error>({
    queryKey: queryKeys.clubOrders(clubId!),
    queryFn: () => getClubRedeemOrders(clubId!),
    enabled: !!clubId && !!user, // Only enable when both user and clubId exist
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  // Filter and sort function
  const getFilteredOrders = (tabType: TabType) => {
    const filtered = orders.filter((order) => {
      // Search filter
      const matchSearch =
        searchTerm === '' ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderCode.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchStatus = false;
      if (tabType === 'pending') {
        matchStatus = order.status === 'PENDING';
      } else if (tabType === 'completed') {
        matchStatus = order.status === 'COMPLETED';
      } else {
        matchStatus = order.status === 'CANCELLED' || order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED';
      }

      // Date range filter
      let matchDateRange = true;
      if (dateFromFilter || dateToFilter) {
        const orderDate = new Date(order.createdAt);
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          fromDate.setHours(0, 0, 0, 0);
          matchDateRange = matchDateRange && orderDate >= fromDate;
        }
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999);
          matchDateRange = matchDateRange && orderDate <= toDate;
        }
      }

      return matchSearch && matchStatus && matchDateRange;
    });

    // Sort by date (latest first)
    return filtered.sort((a, b) => {
      if (tabType === 'completed') {
        // For completed orders, sort by completedAt if available, otherwise by createdAt
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA; // Latest first
      } else {
        // For pending and cancelled orders, sort by createdAt
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Latest first
      }
    });
  };

  // Categorize orders
  const pendingOrders = useMemo(
    () => getFilteredOrders('pending'),
    [orders, searchTerm, dateFromFilter, dateToFilter]
  );
  const completedOrders = useMemo(
    () => getFilteredOrders('completed'),
    [orders, searchTerm, dateFromFilter, dateToFilter]
  );
  const cancelledOrders = useMemo(
    () => getFilteredOrders('cancelled'),
    [orders, searchTerm, dateFromFilter, dateToFilter]
  );

  // Stats
  const totalPointsCompleted = completedOrders.reduce(
    (sum, order) => sum + order.totalPoints,
    0
  );

  // Get current orders based on active tab
  const currentOrders = 
    activeTab === 'pending' ? pendingOrders :
    activeTab === 'completed' ? completedOrders :
    cancelledOrders;

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <View className="bg-yellow-100 px-2 py-1 rounded-md flex-row items-center">
            <Ionicons name="time-outline" size={12} color="#B45309" />
            <Text className="text-yellow-700 text-xs font-semibold ml-1">Pending</Text>
          </View>
        );
      case 'COMPLETED':
        return (
          <View className="bg-green-100 px-2 py-1 rounded-md flex-row items-center">
            <Ionicons name="checkmark-circle-outline" size={12} color="#15803D" />
            <Text className="text-green-700 text-xs font-semibold ml-1">Completed</Text>
          </View>
        );
      case 'CANCELLED':
        return (
          <View className="bg-red-100 px-2 py-1 rounded-md flex-row items-center">
            <Ionicons name="close-circle-outline" size={12} color="#B91C1C" />
            <Text className="text-red-700 text-xs font-semibold ml-1">Cancelled</Text>
          </View>
        );
      case 'REFUNDED':
        return (
          <View className="bg-blue-100 px-2 py-1 rounded-md flex-row items-center">
            <Ionicons name="arrow-undo-outline" size={12} color="#1E40AF" />
            <Text className="text-blue-700 text-xs font-semibold ml-1">Refunded</Text>
          </View>
        );
      case 'PARTIALLY_REFUNDED':
        return (
          <View className="bg-blue-100 px-2 py-1 rounded-md flex-row items-center">
            <Ionicons name="arrow-undo-outline" size={12} color="#1E40AF" />
            <Text className="text-blue-700 text-xs font-semibold ml-1">Partial Refund</Text>
          </View>
        );
      default:
        return (
          <View className="bg-gray-100 px-2 py-1 rounded-md">
            <Text className="text-gray-700 text-xs font-semibold">{status}</Text>
          </View>
        );
    }
  };

  // Show loading while auth or data is loading
  if ((isLoading && !refreshing) || authLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-600 mt-4">Loading orders...</Text>
        </View>
      </View>
    );
  }

  // Show error if clubId is not found AFTER auth is loaded
  if (!clubId && !authLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-lg font-bold text-gray-800 mt-4">Club ID Not Found</Text>
          <Text className="text-sm text-gray-600 mt-2 text-center">
            Unable to find your club information. Please make sure you are logged in as a club leader.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-purple-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
        <NavigationBar role={user?.role} user={user || undefined} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Sidebar role={user?.role} />
      <View className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="light" />

        {/* Header */}
        <View className="px-4 pt-12 pb-4">
          <View className="bg-white rounded-3xl p-6" style={{
            shadowColor: '#14B8A6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8
          }}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: '#14B8A6' }}>
                  <Ionicons name="receipt-outline" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900">Redeem Orders</Text>
                  <Text className="text-sm text-gray-600 mt-1">Manage product redemptions</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/club-leader/orders/scan-qr')}
                className="rounded-2xl p-3" style={{ backgroundColor: '#14B8A6', shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
              >
                <Ionicons name="qr-code-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View className="flex-row gap-2 mt-4">
              <View className="flex-1 bg-amber-50 rounded-2xl p-3 border-2 border-amber-100">
                <View className="w-8 h-8 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: '#F59E0B' }}>
                  <Ionicons name="time-outline" size={16} color="white" />
                </View>
                <Text className="text-xs text-amber-700 font-medium mb-1">Pending</Text>
                <Text className="text-2xl font-bold text-amber-900">
                  {isLoading ? '-' : pendingOrders.length}
                </Text>
              </View>

              <View className="flex-1 bg-green-50 rounded-2xl p-3 border-2 border-green-100">
                <View className="w-8 h-8 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: '#10B981' }}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                </View>
                <Text className="text-xs text-green-700 font-medium mb-1">Completed</Text>
                <Text className="text-2xl font-bold text-green-900">
                  {isLoading ? '-' : completedOrders.length}
                </Text>
              </View>

              <View className="flex-1 bg-teal-50 rounded-2xl p-3 border-2 border-teal-100">
                <View className="w-8 h-8 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: '#14B8A6' }}>
                  <Ionicons name="wallet-outline" size={16} color="white" />
                </View>
                <Text className="text-xs text-teal-700 font-medium mb-1">Points</Text>
                <Text className="text-xl font-bold text-teal-900">
                  {isLoading ? '-' : totalPointsCompleted.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-4 py-3 bg-white">
          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center bg-white rounded-2xl px-3 py-3 border-2 border-gray-100" style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2
            }}>
              <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: '#14B8A6' }}>
                <Ionicons name="search" size={18} color="white" />
              </View>
              <AppTextInput
                placeholder="Search orders..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="flex-1 ml-2 text-base"
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowDateFilter(!showDateFilter)}
              className="rounded-2xl p-3" style={{ backgroundColor: '#14B8A6', shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
            >
              <Ionicons name="calendar-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Date Filter (Collapsible) */}
          {showDateFilter && (
            <View className="mt-3 space-y-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-medium text-gray-700 w-16">From:</Text>
                <AppTextInput
                  className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm"
                  placeholder="YYYY-MM-DD"
                  value={dateFromFilter}
                  onChangeText={setDateFromFilter}
                />
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-medium text-gray-700 w-16">To:</Text>
                <AppTextInput
                  className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm"
                  placeholder="YYYY-MM-DD"
                  value={dateToFilter}
                  onChangeText={setDateToFilter}
                />
              </View>
              {(dateFromFilter || dateToFilter) && (
                <TouchableOpacity
                  onPress={() => {
                    setDateFromFilter('');
                    setDateToFilter('');
                  }}
                  className="bg-red-100 px-3 py-2 rounded-lg"
                >
                  <Text className="text-red-700 text-sm font-medium text-center">
                    Clear Dates
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Status Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
          >
            <TouchableOpacity
              onPress={() => setActiveTab('pending')}
              className="mr-2 px-5 py-3 rounded-2xl"
              style={activeTab === 'pending' ? {
                backgroundColor: '#F59E0B',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4
              } : { backgroundColor: '#F3F4F6' }}
            >
              <Text className={`font-bold ${
                activeTab === 'pending' ? 'text-white' : 'text-gray-700'
              }`}>
                Pending ({pendingOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('completed')}
              className="mr-2 px-5 py-3 rounded-2xl"
              style={activeTab === 'completed' ? {
                backgroundColor: '#10B981',
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4
              } : { backgroundColor: '#F3F4F6' }}
            >
              <Text className={`font-bold ${
                activeTab === 'completed' ? 'text-white' : 'text-gray-700'
              }`}>
                Completed ({completedOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('cancelled')}
              className="px-5 py-3 rounded-2xl"
              style={activeTab === 'cancelled' ? {
                backgroundColor: '#EF4444',
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4
              } : { backgroundColor: '#F3F4F6' }}
            >
              <Text className={`font-bold ${
                activeTab === 'cancelled' ? 'text-white' : 'text-gray-700'
              }`}>
                Cancelled ({cancelledOrders.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Orders List */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
          }
        >
          <View className="px-4 py-4">
            {currentOrders.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                <Text className="text-lg font-semibold text-gray-700 mt-4">
                  No {activeTab} orders found
                </Text>
                <Text className="text-sm text-gray-500 mt-2 text-center px-8">
                  {searchTerm
                    ? 'Try adjusting your search or filters'
                    : `No ${activeTab} orders at the moment`}
                </Text>
              </View>
            ) : (
              <View>
                {currentOrders.map((order) => {
                  const gradientColor =
                    order.status === 'PENDING'
                      ? '#FEF3C7'
                      : order.status === 'COMPLETED'
                      ? '#D1FAE5'
                      : order.status === 'CANCELLED'
                      ? '#FEE2E2'
                      : '#DBEAFE';

                  return (
                    <TouchableOpacity
                      key={order.orderId}
                      onPress={() => router.push(`/club-leader/orders/${order.orderId}` as any)}
                      className="mb-4 bg-white rounded-3xl overflow-hidden"
                      style={{
                        shadowColor: '#14B8A6',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      {/* Top colored bar */}
                      <View className="h-2" style={{ backgroundColor: gradientColor }} />

                      <View className="p-4">
                        {/* Header */}
                        <View className="flex-row justify-between items-start mb-3">
                          <View className="flex-1">
                            <View className="flex-row items-center mb-2">
                              <View className="w-6 h-6 rounded-lg items-center justify-center" style={{ backgroundColor: '#14B8A6' }}>
                                <Ionicons name="cube-outline" size={14} color="white" />
                              </View>
                              <Text className="text-xs text-gray-600 ml-2 font-medium">
                                #{order.orderCode}
                              </Text>
                            </View>
                            <Text className="font-bold text-base text-gray-900" numberOfLines={2}>
                              {order.productName}
                            </Text>
                          </View>
                          <View className="ml-2">{getStatusBadge(order.status)}</View>
                        </View>

                        {/* Member Info */}
                        <View className="bg-gray-50 rounded-lg p-3 mb-3">
                          <View className="flex-row items-center">
                            <Ionicons name="person-outline" size={16} color="#6B7280" />
                            <View className="ml-2 flex-1">
                              <Text className="text-xs text-gray-500">Ordered by</Text>
                              <Text className="font-semibold text-sm text-gray-900" numberOfLines={1}>
                                {order.memberName}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Details Grid */}
                        <View className="flex-row justify-between mb-3">
                          <View className="flex-1 mr-2">
                            <View className="flex-row items-center mb-1">
                              <Ionicons name="layers-outline" size={14} color="#8B5CF6" />
                              <Text className="text-xs text-gray-500 ml-1">Quantity</Text>
                            </View>
                            <Text className="text-lg font-bold text-purple-900">
                              {order.quantity.toLocaleString()}
                            </Text>
                          </View>

                          <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                              <Ionicons name="wallet-outline" size={14} color="#3B82F6" />
                              <Text className="text-xs text-gray-500 ml-1">Points</Text>
                            </View>
                            <Text className="text-lg font-bold text-blue-900">
                              {order.totalPoints.toLocaleString()}
                            </Text>
                          </View>
                        </View>

                        {/* Footer */}
                        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                          <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View className="h-24" />
        </ScrollView>

        <NavigationBar role={user?.role} user={user || undefined} />
      </View>
    </>
  );
}

