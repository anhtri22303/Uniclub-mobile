import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import {
    completeRedeemOrder,
    getClubRedeemOrders,
    RedeemOrder,
    refundPartialRedeemOrder,
    RefundPayload,
    refundRedeemOrder,
} from '@services/redeem.service';
import { useAuthStore } from '@stores/auth.store';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id ? parseInt(id, 10) : null;

  // Get user from auth store
  const { user } = useAuthStore();

  // States
  const [clubId, setClubId] = useState<number | null>(null);
  const [order, setOrder] = useState<RedeemOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Refund modal states
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [quantityToRefund, setQuantityToRefund] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Get clubId from user or token
  useEffect(() => {
    const getClubId = () => {
      // Try to get clubId from user
      if (user?.clubIds && user.clubIds.length > 0) {
        return user.clubIds[0];
      }

      // Try to get from token
      const id = ClubService.getClubIdFromToken();
      return id || null;
    };

    const id = getClubId();
    if (id) {
      setClubId(id);
    } else {
      Alert.alert('Error', 'Club ID not found');
      router.back();
    }
  }, [user]);

  // Load order data
  useEffect(() => {
    if (clubId && orderId) {
      loadData();
    }
  }, [clubId, orderId]);

  const loadData = async () => {
    if (!clubId || !orderId) return;

    try {
      setLoading(true);
      // Get all orders and find the specific one
      const orders = await getClubRedeemOrders(clubId);
      const foundOrder = orders.find((o) => o.orderId === orderId);

      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        Alert.alert('Error', 'Order not found');
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load order');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Complete order (Mark as Delivered)
  const handleComplete = () => {
    Alert.alert(
      'Mark as Delivered',
      'Confirm that the member has received their product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            if (!orderId) return;
            try {
              setProcessing(true);
              const updatedOrder = await completeRedeemOrder(orderId);
              setOrder(updatedOrder);
              Alert.alert('Success', 'Order marked as delivered successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete order');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Handle refund
  const handleRefund = async () => {
    if (!orderId || !order) return;

    // Validate input
    if (!refundReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for the refund');
      return;
    }

    if (refundType === 'partial') {
      const qty = parseInt(quantityToRefund, 10);
      
      // Validate quantity
      if (isNaN(qty) || qty <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity greater than 0');
        return;
      }
      
      if (qty >= order.quantity) {
        Alert.alert('Error', `Quantity must be less than ${order.quantity}. Use Full Refund instead.`);
        return;
      }

      // Check if order only has 1 item
      if (order.quantity === 1) {
        Alert.alert('Error', 'Cannot do partial refund for order with only 1 item. Use Full Refund instead.');
        return;
      }
    }

    try {
      setProcessing(true);

      const payload: RefundPayload = {
        orderId,
        quantityToRefund:
          refundType === 'full' ? order.quantity : parseInt(quantityToRefund, 10),
        reason: refundReason.trim(),
      };

      let updatedOrder: RedeemOrder;
      if (refundType === 'full') {
        updatedOrder = await refundRedeemOrder(payload);
      } else {
        updatedOrder = await refundPartialRedeemOrder(payload);
      }

      setOrder(updatedOrder);
      setShowRefundModal(false);
      setRefundReason('');
      setQuantityToRefund('');
      Alert.alert('Success', 'Refund processed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <View className="bg-yellow-100 px-3 py-1.5 rounded-lg flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#B45309" />
            <Text className="text-yellow-700 text-sm font-semibold ml-1">Pending</Text>
          </View>
        );
      case 'COMPLETED':
        return (
          <View className="bg-green-100 px-3 py-1.5 rounded-lg flex-row items-center">
            <Ionicons name="checkmark-circle-outline" size={16} color="#15803D" />
            <Text className="text-green-700 text-sm font-semibold ml-1">Completed</Text>
          </View>
        );
      case 'CANCELLED':
        return (
          <View className="bg-red-100 px-3 py-1.5 rounded-lg flex-row items-center">
            <Ionicons name="close-circle-outline" size={16} color="#B91C1C" />
            <Text className="text-red-700 text-sm font-semibold ml-1">Cancelled</Text>
          </View>
        );
      case 'REFUNDED':
        return (
          <View className="bg-blue-100 px-3 py-1.5 rounded-lg flex-row items-center">
            <Ionicons name="arrow-undo-outline" size={16} color="#1E40AF" />
            <Text className="text-blue-700 text-sm font-semibold ml-1">Refunded</Text>
          </View>
        );
      case 'PARTIALLY_REFUNDED':
        return (
          <View className="bg-blue-100 px-3 py-1.5 rounded-lg flex-row items-center">
            <Ionicons name="arrow-undo-outline" size={16} color="#1E40AF" />
            <Text className="text-blue-700 text-sm font-semibold ml-1">Partial Refund</Text>
          </View>
        );
      default:
        return (
          <View className="bg-gray-100 px-3 py-1.5 rounded-lg">
            <Text className="text-gray-700 text-sm font-semibold">{status}</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <Sidebar role={user?.role} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-600 mt-4">Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <Sidebar role={user?.role} />
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-600 text-lg font-semibold mt-4">Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Sidebar role={user?.role} />
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-xl font-bold text-white" numberOfLines={1}>
                  Order Details
                </Text>
                <Text className="text-sm text-white opacity-90">
                  #{order.orderCode}
                </Text>
              </View>
            </View>
            {getStatusBadge(order.status)}
          </View>
        </LinearGradient>

        <View className="px-4 py-4">
          {/* Product Info Card */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center mb-3">
              <View className="bg-purple-100 p-3 rounded-lg">
                <Ionicons name="cube-outline" size={24} color="#8B5CF6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-500 mb-1">Product</Text>
                <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
                  {order.productName}
                </Text>
              </View>
            </View>

            {order.productType && (
              <View className="bg-gray-50 px-3 py-2 rounded-lg">
                <Text className="text-sm text-gray-600">
                  Type: <Text className="font-semibold">{order.productType}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Member Info Card */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center mb-2">
              <View className="bg-blue-100 p-3 rounded-lg">
                <Ionicons name="person-outline" size={24} color="#3B82F6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-500 mb-1">Member</Text>
                <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                  {order.memberName}
                </Text>
              </View>
            </View>
            <View className="bg-gray-50 px-3 py-2 rounded-lg">
              <Text className="text-sm text-gray-600">
                Club: <Text className="font-semibold">{order.clubName}</Text>
              </Text>
            </View>
          </View>

          {/* Order Details Grid */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-bold text-gray-900 mb-3">Order Information</Text>

            <View className="space-y-3">
              {/* Quantity */}
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="layers-outline" size={20} color="#8B5CF6" />
                  <Text className="text-sm text-gray-600 ml-2">Quantity</Text>
                </View>
                <Text className="text-lg font-bold text-purple-900">
                  {order.quantity.toLocaleString()}
                </Text>
              </View>

              {/* Total Points */}
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="wallet-outline" size={20} color="#3B82F6" />
                  <Text className="text-sm text-gray-600 ml-2">Total Points</Text>
                </View>
                <Text className="text-lg font-bold text-blue-900">
                  {order.totalPoints.toLocaleString()}
                </Text>
              </View>

              {/* Created At */}
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-2">Created At</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900">
                  {new Date(order.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Completed At (if completed) */}
              {order.completedAt && (
                <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                    <Text className="text-sm text-gray-600 ml-2">Completed At</Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-900">
                    {new Date(order.completedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}

              {/* Refund Reason (if refunded) */}
              {order.reasonRefund && (
                <View className="py-3">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="information-circle-outline" size={20} color="#EF4444" />
                    <Text className="text-sm font-semibold text-gray-700 ml-2">
                      Refund Reason
                    </Text>
                  </View>
                  <View className="bg-red-50 p-3 rounded-lg">
                    <Text className="text-sm text-red-800">{order.reasonRefund}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          {/* 1️⃣ PENDING: Show "Mark as Delivered" button */}
          {order.status === 'PENDING' && (
            <TouchableOpacity
              onPress={handleComplete}
              disabled={processing}
              className="bg-green-500 rounded-xl py-4 flex-row items-center justify-center mb-4"
              style={{
                elevation: 2,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              {processing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text className="text-white font-bold text-base ml-2">Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* 2️⃣ COMPLETED: Show "Process Refund" button */}
          {order.status === 'COMPLETED' && (
            <TouchableOpacity
              onPress={() => {
                setRefundType('full');
                setQuantityToRefund(order.quantity.toString());
                setRefundReason('');
                setShowRefundModal(true);
              }}
              disabled={processing}
              className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center mb-4"
              style={{
                elevation: 2,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <Ionicons name="arrow-undo" size={24} color="white" />
              <Text className="text-white font-bold text-base ml-2">Process Refund</Text>
            </TouchableOpacity>
          )}

          {/* 3️⃣ PARTIALLY_REFUNDED: Show "Process Refund" button (can continue refunding) */}
          {order.status === 'PARTIALLY_REFUNDED' && (
            <TouchableOpacity
              onPress={() => {
                setRefundType('full');
                setQuantityToRefund(order.quantity.toString());
                setRefundReason('');
                setShowRefundModal(true);
              }}
              disabled={processing}
              className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center mb-4"
              style={{
                elevation: 2,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <Ionicons name="arrow-undo" size={24} color="white" />
              <Text className="text-white font-bold text-base ml-2">Process Refund</Text>
            </TouchableOpacity>
          )}

          {/* 4️⃣ REFUNDED: No action buttons, show completion message */}
          {order.status === 'REFUNDED' && (
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 items-center">
              <Ionicons name="checkmark-circle" size={48} color="#3B82F6" />
              <Text className="text-blue-900 font-bold text-lg text-center mt-3">
                Order Fully Refunded
              </Text>
              <Text className="text-blue-700 text-sm text-center mt-2">
                This order has been completely refunded. No further actions are available.
              </Text>
              {order.reasonRefund && (
                <View className="bg-white rounded-lg p-3 mt-3 w-full">
                  <Text className="text-xs text-gray-500 mb-1">Refund Reason:</Text>
                  <Text className="text-sm text-gray-800">{order.reasonRefund}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Refund Modal */}
      <Modal
        visible={showRefundModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRefundModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                {refundType === 'full' ? 'Full Refund' : 'Partial Refund'}
              </Text>
              <TouchableOpacity onPress={() => setShowRefundModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Refund Type Selection */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Refund Type</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      setRefundType('full');
                      setQuantityToRefund(order?.quantity.toString() || '');
                    }}
                    className={`flex-1 py-3 rounded-lg border-2 ${
                      refundType === 'full'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        refundType === 'full' ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      Full Refund
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setRefundType('partial');
                      setQuantityToRefund('');
                    }}
                    disabled={order?.quantity === 1}
                    className={`flex-1 py-3 rounded-lg border-2 ${
                      refundType === 'partial'
                        ? 'border-blue-600 bg-blue-50'
                        : order?.quantity === 1
                        ? 'border-gray-200 bg-gray-100'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        refundType === 'partial' 
                          ? 'text-blue-600' 
                          : order?.quantity === 1
                          ? 'text-gray-400'
                          : 'text-gray-600'
                      }`}
                    >
                      Partial Refund
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quantity Input (for partial refund) */}
              {refundType === 'partial' && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Quantity to Refund (Max: {order ? order.quantity - 1 : 0})
                  </Text>
                  <TextInput
                    placeholder={`Enter quantity (1-${order ? order.quantity - 1 : 0})`}
                    value={quantityToRefund}
                    onChangeText={setQuantityToRefund}
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  />
                  {order && order.quantity === 1 && (
                    <View className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                      <Text className="text-xs text-red-700">
                        ⚠️ Cannot do partial refund for orders with only 1 item
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Reason Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Refund Reason <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  placeholder="Enter reason for refund..."
                  value={refundReason}
                  onChangeText={setRefundReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                />
              </View>

              {/* Info Box */}
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <View className="flex-row items-start">
                  <Ionicons name="warning-outline" size={20} color="#D97706" />
                  <View className="ml-2 flex-1">
                    <Text className="text-xs font-semibold text-yellow-900 mb-1">
                      {refundType === 'full' ? 'Full Refund' : 'Partial Refund'}
                    </Text>
                    <Text className="text-xs text-yellow-800">
                      {refundType === 'full'
                        ? `This will refund all ${order?.quantity} items and return ${order?.totalPoints} points to the member. Status will change to REFUNDED.`
                        : `This will refund the specified quantity and return corresponding points to the member. Status will change to PARTIALLY_REFUNDED.`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleRefund}
                disabled={processing}
                className="bg-blue-500 rounded-lg py-4 items-center"
              >
                {processing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    {refundType === 'full' ? 'Process Full Refund' : 'Process Partial Refund'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

