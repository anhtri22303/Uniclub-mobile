import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAllEventOrdersByClub, RedeemOrder } from '@services/redeem.service';
import { useAuthStore } from '@stores/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Query key
export const queryKeys = {
  eventOrders: (clubId: number) => ['eventOrders', clubId] as const,
};

export default function EventOrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const clubId = user?.clubIds?.[0];

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  // Fetch orders
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery<RedeemOrder[], Error>({
    queryKey: queryKeys.eventOrders(clubId!),
    queryFn: () => getAllEventOrdersByClub(clubId!),
    enabled: !!clubId,
    staleTime: 3 * 60 * 1000,
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      const matchSearch =
        searchTerm === '' ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderCode.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;

      // Date range filter
      let matchDateRange = true;
      if (dateFrom || dateTo) {
        const orderDate = new Date(order.createdAt);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          matchDateRange = matchDateRange && orderDate >= fromDate;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchDateRange = matchDateRange && orderDate <= toDate;
        }
      }

      return matchSearch && matchStatus && matchDateRange;
    });
  }, [orders, searchTerm, statusFilter, dateFrom, dateTo]);

  // Statistics
  const totalOrders = filteredOrders.length;
  const totalPointsUsed = filteredOrders.reduce((sum, order) => sum + order.totalPoints, 0);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-yellow-500', icon: 'time-outline' as const, label: 'Pending' };
      case 'COMPLETED':
        return { bg: 'bg-green-500', icon: 'checkmark-circle' as const, label: 'Delivered' };
      case 'REFUNDED':
        return { bg: 'bg-blue-500', icon: 'return-up-back' as const, label: 'Refunded' };
      case 'PARTIALLY_REFUNDED':
        return { bg: 'bg-orange-500', icon: 'return-up-back' as const, label: 'Partially Refunded' };
      default:
        return { bg: 'bg-gray-500', icon: 'close-circle' as const, label: status };
    }
  };

  // Handle scanner
  const handleOpenScanner = () => {
    router.push('/club-leader/event-order-scanner' as any);
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (!clubId) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
          No Club Found
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          You need to be a club leader to access this page.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-teal-600 pt-12 pb-6 px-6 shadow-lg">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Event Orders</Text>
            <Text className="text-teal-100 text-sm mt-1">
              Manage event product redemptions
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenScanner}
            className="bg-white rounded-full p-3 shadow-lg"
            disabled={!clubId}
          >
            <Ionicons name="scan" size={24} color="#0D9488" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View className="px-4 -mt-4 mb-4">
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-xl p-4 shadow-md">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs font-medium text-purple-700 mb-1">
                  Total Orders
                </Text>
                <Text className="text-2xl font-bold text-purple-900">
                  {isLoading ? '-' : totalOrders}
                </Text>
              </View>
              <View className="bg-purple-500 p-2 rounded-lg">
                <Ionicons name="cart" size={20} color="white" />
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-xl p-4 shadow-md">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs font-medium text-blue-700 mb-1">
                  Points Used
                </Text>
                <Text className="text-2xl font-bold text-blue-900">
                  {isLoading ? '-' : totalPointsUsed.toLocaleString()}
                </Text>
              </View>
              <View className="bg-blue-500 p-2 rounded-lg">
                <Ionicons name="wallet" size={20} color="white" />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View className="px-4 mb-4">
        <View className="bg-white rounded-xl p-4 shadow-md">
          <TouchableOpacity
            onPress={() => setIsFilterOpen(!isFilterOpen)}
            className="flex-row items-center justify-between mb-3"
          >
            <Text className="text-base font-semibold text-gray-800">
              Filters & Search
            </Text>
            <Ionicons
              name={isFilterOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>

          {isFilterOpen && (
            <View className="space-y-3">
              {/* Search */}
              <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                  placeholder="Search by product, member, or code..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  className="flex-1 ml-2 text-gray-800"
                />
              </View>

              {/* Status Filter */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Status:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {['ALL', 'PENDING', 'COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED'].map(
                      (status) => (
                        <TouchableOpacity
                          key={status}
                          onPress={() => setStatusFilter(status)}
                          className={`px-4 py-2 rounded-lg ${
                            statusFilter === status
                              ? 'bg-teal-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              statusFilter === status
                                ? 'text-white'
                                : 'text-gray-700'
                            }`}
                          >
                            {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </ScrollView>
              </View>

              {/* Date Filters */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">From:</Text>
                  <TouchableOpacity
                    onPress={() => setShowDateFromPicker(true)}
                    className="bg-gray-50 rounded-lg px-3 py-3 flex-row items-center justify-between"
                  >
                    <Text className="text-gray-700">
                      {dateFrom ? dateFrom.toLocaleDateString() : 'Select date'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">To:</Text>
                  <TouchableOpacity
                    onPress={() => setShowDateToPicker(true)}
                    className="bg-gray-50 rounded-lg px-3 py-3 flex-row items-center justify-between"
                  >
                    <Text className="text-gray-700">
                      {dateTo ? dateTo.toLocaleDateString() : 'Select date'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {(dateFrom || dateTo) && (
                <TouchableOpacity
                  onPress={() => {
                    setDateFrom(null);
                    setDateTo(null);
                  }}
                  className="bg-gray-200 rounded-lg py-2 items-center"
                >
                  <Text className="text-gray-700 font-medium">Clear Dates</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Date Pickers */}
      {showDateFromPicker && (
        <DateTimePicker
          value={dateFrom || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDateFromPicker(false);
            if (selectedDate) setDateFrom(selectedDate);
          }}
        />
      )}
      {showDateToPicker && (
        <DateTimePicker
          value={dateTo || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDateToPicker(false);
            if (selectedDate) setDateTo(selectedDate);
          }}
        />
      )}

      {/* Orders List */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#0D9488" />
            <Text className="text-gray-600 mt-2">Loading orders...</Text>
          </View>
        ) : error ? (
          <View className="bg-red-50 rounded-xl p-4 items-center">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text className="text-red-600 font-semibold mt-2">Error loading orders</Text>
            <Text className="text-red-500 text-sm mt-1">{error.message}</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View className="bg-gray-100 rounded-xl p-8 items-center">
            <Ionicons name="file-tray-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 font-medium mt-2">No orders found</Text>
          </View>
        ) : (
          <View className="space-y-3 pb-6">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              return (
                <TouchableOpacity
                  key={order.orderId}
                  onPress={() =>
                    router.push(`/club-leader/event-orders/${order.orderId}` as any)
                  }
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <View className={`h-1 ${statusInfo.bg}`} />
                  <View className="p-4">
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                          {order.productName}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          #{order.orderCode}
                        </Text>
                      </View>
                      <View className={`${statusInfo.bg} px-3 py-1 rounded-full flex-row items-center ml-2`}>
                        <Ionicons name={statusInfo.icon} size={12} color="white" />
                        <Text className="text-white text-xs font-medium ml-1">
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    {/* Member */}
                    <View className="flex-row items-center bg-gray-50 rounded-lg p-2 mb-3">
                      <Ionicons name="person" size={16} color="#6B7280" />
                      <Text className="text-sm font-medium text-gray-800 ml-2">
                        {order.memberName}
                      </Text>
                    </View>

                    {/* Stats */}
                    <View className="flex-row gap-2 mb-3">
                      <View className="flex-1 bg-purple-50 rounded-lg p-2">
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="cart" size={14} color="#9333EA" />
                          <Text className="text-xs text-purple-700 ml-1">Quantity</Text>
                        </View>
                        <Text className="text-lg font-bold text-purple-900">
                          {order.quantity}
                        </Text>
                      </View>

                      <View className="flex-1 bg-blue-50 rounded-lg p-2">
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="wallet" size={14} color="#3B82F6" />
                          <Text className="text-xs text-blue-700 ml-1">Points</Text>
                        </View>
                        <Text className="text-lg font-bold text-blue-900">
                          {order.totalPoints.toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
                      <View className="flex-row items-center">
                        <Ionicons name="calendar" size={12} color="#9CA3AF" />
                        <Text className="text-xs text-gray-500 ml-1">
                          {new Date(order.createdAt).toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-xs font-medium text-teal-600 mr-1">
                          View Details
                        </Text>
                        <Ionicons name="chevron-forward" size={12} color="#0D9488" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      </View>
    </>
  );
}
