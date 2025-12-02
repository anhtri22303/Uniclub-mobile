import { Ionicons } from '@expo/vector-icons';
import {
  completeRedeemOrder,
  getAllEventOrdersByClub,
  RedeemOrder,
  refundPartialRedeemOrder,
  RefundPayload,
  refundRedeemOrder,
} from '@services/redeem.service';
import { useAuthStore } from '@stores/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

// Query key
export const queryKeys = {
  eventOrders: (clubId: number) => ['eventOrders', clubId] as const,
};

export default function EventOrderDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const clubId = user?.clubIds?.[0];

  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundReason, setRefundReason] = useState('');
  const [partialQuantity, setPartialQuantity] = useState('1');

  // Fetch all orders
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery<RedeemOrder[], Error>({
    queryKey: queryKeys.eventOrders(clubId!),
    queryFn: () => getAllEventOrdersByClub(clubId!),
    enabled: !!clubId,
  });

  // Find specific order
  const order = orders.find((o) => String(o.orderId) === id);

  // Handle deliver
  const handleDeliver = async () => {
    if (!order || !clubId) return;

    Alert.alert(
      'Confirm Delivery',
      'Mark this order as delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await completeRedeemOrder(order.orderId);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Order marked as delivered!',
              });
              await queryClient.invalidateQueries({
                queryKey: queryKeys.eventOrders(clubId),
              });
              router.back();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to mark as delivered',
              });
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Handle refund
  const handleRefund = async () => {
    if (!order || !clubId) return;

    if (!refundReason.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Required',
        text2: 'Please provide a reason for the refund',
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (refundType === 'full') {
        const payload: RefundPayload = {
          orderId: order.orderId,
          quantityToRefund: order.quantity,
          reason: refundReason,
        };
        await refundRedeemOrder(payload);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Order fully refunded!',
        });
      } else {
        const qty = parseInt(partialQuantity);
        if (!qty || qty <= 0) {
          throw new Error('Quantity must be greater than 0');
        }
        if (qty >= order.quantity) {
          throw new Error('Quantity is too high. Use full refund instead.');
        }

        const payload: RefundPayload = {
          orderId: order.orderId,
          quantityToRefund: qty,
          reason: refundReason,
        };
        await refundPartialRedeemOrder(payload);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Successfully refunded ${qty} item(s)!`,
        });
      }

      setIsRefundModalOpen(false);
      setRefundType('full');
      setPartialQuantity('1');
      setRefundReason('');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.eventOrders(clubId),
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to refund order',
      });
    } finally {
      setIsProcessing(false);
    }
  };

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

  if (!clubId) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
          No Club Found
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0D9488" />
        <Text className="text-gray-600 mt-2">Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <View className="bg-white rounded-2xl p-8 items-center shadow-lg">
          <View className="bg-red-100 rounded-full p-4 mb-4">
            <Ionicons name="close-circle" size={48} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</Text>
          <Text className="text-gray-600 text-center mb-6">
            {error ? error.message : 'The requested order could not be found.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-teal-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusBadge(order.status);

  return (
    <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className={`${statusInfo.bg} pt-12 pb-6 px-6`}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text className="text-white font-semibold ml-2">Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Order Details</Text>
            <Text className="text-white/90 text-sm mt-1">#{order.orderCode}</Text>
          </View>
          <View className={`${statusInfo.bg} bg-white/20 px-4 py-2 rounded-full flex-row items-center`}>
            <Ionicons name={statusInfo.icon} size={16} color="white" />
            <Text className="text-white font-semibold ml-2">{statusInfo.label}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 -mt-4">
        {/* Product Card */}
        <View className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
          <View className="h-1 bg-gradient-to-r from-purple-400 to-pink-400" />
          <View className="p-4">
            <View className="flex-row items-center mb-4">
              <View className="bg-purple-100 p-3 rounded-lg">
                <Ionicons name="cube" size={24} color="#9333EA" />
              </View>
              <Text className="text-lg font-bold text-gray-900 ml-3">
                Product Information
              </Text>
            </View>

            <View className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
              <Text className="text-xs font-semibold text-purple-700 uppercase mb-2">
                Event Product Name
              </Text>
              <Text className="text-xl font-bold text-gray-900">
                {order.productName}
              </Text>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 bg-indigo-50 rounded-xl p-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="cart" size={16} color="#6366F1" />
                  <Text className="text-xs text-indigo-700 font-semibold ml-2">
                    Quantity
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-indigo-900">
                  {order.quantity}
                </Text>
              </View>

              <View className="flex-1 bg-cyan-50 rounded-xl p-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="wallet" size={16} color="#06B6D4" />
                  <Text className="text-xs text-cyan-700 font-semibold ml-2">
                    Total Points
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-cyan-900">
                  {order.totalPoints.toLocaleString()}
                </Text>
              </View>
            </View>

            <View className="mt-3 pt-3 border-t border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={16} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  Price per item:{' '}
                  <Text className="font-semibold text-gray-900">
                    {(order.totalPoints / order.quantity).toLocaleString()} points
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Member & Order Details Card */}
        <View className="bg-white rounded-xl shadow-lg mb-4 p-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="person" size={20} color="#6B7280" />
            <Text className="text-lg font-bold text-gray-900 ml-2">Order Details</Text>
          </View>

          <View className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="person" size={14} color="#3B82F6" />
              <Text className="text-xs font-semibold text-blue-700 uppercase ml-1">
                Member Name
              </Text>
            </View>
            <Text className="text-lg font-bold text-gray-900">{order.memberName}</Text>
          </View>

          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="key" size={14} color="#6B7280" />
              <Text className="text-xs font-semibold text-gray-600 uppercase ml-1">
                Order Code
              </Text>
            </View>
            <View className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <Text className="font-mono text-sm text-gray-900">{order.orderCode}</Text>
            </View>
          </View>

          <View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar" size={14} color="#6B7280" />
              <Text className="text-xs font-semibold text-gray-600 uppercase ml-1">
                Order Date
              </Text>
            </View>
            <Text className="text-sm font-semibold text-gray-900">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleTimeString()}
            </Text>
          </View>

          {(order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED') &&
            order.reasonRefund && (
              <View className="mt-4 pt-4 border-t border-gray-200">
                <View className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="information-circle" size={14} color="#F59E0B" />
                    <Text className="text-xs font-semibold text-amber-700 uppercase ml-1">
                      Refund Reason
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-700 italic">
                    &quot;{order.reasonRefund}&quot;
                  </Text>
                </View>
              </View>
            )}
        </View>

        {/* Action Buttons */}
        {order.status === 'PENDING' && (
          <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-4 shadow-lg">
            <View className="items-center mb-4">
              <View className="bg-green-500 rounded-full p-3 mb-2">
                <Ionicons name="checkmark-circle" size={32} color="white" />
              </View>
              <Text className="text-lg font-bold text-gray-900">Ready to Deliver?</Text>
              <Text className="text-sm text-gray-600 text-center mt-1">
                Mark this order as delivered when the product has been given to the member
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDeliver}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg py-4 items-center shadow-md"
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    Mark as Delivered
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {(order.status === 'COMPLETED' || order.status === 'PARTIALLY_REFUNDED') && (
          <View className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 mb-6 shadow-lg">
            <View className="items-center mb-4">
              <View className="bg-red-500 rounded-full p-3 mb-2">
                <Ionicons name="return-up-back" size={32} color="white" />
              </View>
              <Text className="text-lg font-bold text-gray-900">Need to Refund?</Text>
              <Text className="text-sm text-gray-600 text-center mt-1">
                Process a full or partial refund if there's an issue
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsRefundModalOpen(true)}
              disabled={isProcessing}
              className="bg-gradient-to-r from-red-500 to-rose-600 rounded-lg py-4 items-center shadow-md"
            >
              <View className="flex-row items-center">
                <Ionicons name="return-up-back" size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Process Refund
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Refund Modal */}
      <Modal
        visible={isRefundModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRefundModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="items-center mb-6">
              <View className="bg-red-100 rounded-full p-3 mb-3">
                <Ionicons name="return-up-back" size={32} color="#EF4444" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">Process Refund</Text>
              <Text className="text-gray-600 text-center mt-2">
                Select refund type and provide a reason
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Order Summary */}
              <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                <Text className="text-sm font-semibold text-blue-900 mb-2">
                  Order Summary
                </Text>
                <Text className="text-sm text-blue-800">
                  <Text className="font-medium">Product:</Text> {order.productName}
                </Text>
                <Text className="text-sm text-blue-800">
                  <Text className="font-medium">Quantity:</Text> {order.quantity} items
                </Text>
                <Text className="text-sm text-blue-800">
                  <Text className="font-medium">Total Points:</Text>{' '}
                  {order.totalPoints.toLocaleString()} points
                </Text>
              </View>

              {/* Refund Type */}
              <View className="mb-4">
                <TouchableOpacity
                  onPress={() => setRefundType('full')}
                  className={`rounded-xl p-4 mb-3 border-2 ${
                    refundType === 'full'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="bg-blue-100 p-2 rounded-lg">
                      <Ionicons name="return-up-back" size={20} color="#3B82F6" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="font-bold text-base text-gray-900">Full Refund</Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        Cancel entire order and refund all {order.totalPoints.toLocaleString()}{' '}
                        points
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRefundType('partial')}
                  disabled={order.quantity <= 1}
                  className={`rounded-xl p-4 border-2 ${
                    order.quantity <= 1
                      ? 'opacity-50 bg-gray-100 border-gray-200'
                      : refundType === 'partial'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="bg-orange-100 p-2 rounded-lg">
                      <Ionicons name="return-up-back" size={20} color="#F97316" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="font-bold text-base text-gray-900">
                        Partial Refund
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {order.quantity > 1
                          ? 'Refund specific quantity while keeping order active'
                          : 'Only available for orders with more than 1 item'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Partial Quantity */}
              {refundType === 'partial' && (
                <View className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
                  <Text className="text-sm font-semibold text-orange-900 mb-2">
                    Quantity to Refund
                  </Text>
                  <TextInput
                    value={partialQuantity}
                    onChangeText={setPartialQuantity}
                    keyboardType="number-pad"
                    className="bg-white rounded-lg p-3 border border-orange-300 text-base mb-2"
                  />
                  <View className="flex-row items-center">
                    <Ionicons name="information-circle" size={16} color="#F97316" />
                    <Text className="text-sm text-orange-700 ml-2">
                      This will refund{' '}
                      <Text className="font-bold">
                        {(
                          (order.totalPoints / order.quantity) *
                          (parseInt(partialQuantity) || 0)
                        ).toFixed(0)}{' '}
                        points
                      </Text>
                    </Text>
                  </View>
                </View>
              )}

              {/* Refund Reason */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Reason for Refund <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={refundReason}
                  onChangeText={setRefundReason}
                  placeholder="e.g., Product unavailable, member request..."
                  multiline
                  numberOfLines={4}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-300 text-base"
                  textAlignVertical="top"
                />
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setIsRefundModalOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
                >
                  <Text className="font-semibold text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRefund}
                  disabled={isProcessing || !refundReason.trim()}
                  className={`flex-1 rounded-lg py-3 items-center ${
                    isProcessing || !refundReason.trim()
                      ? 'bg-gray-300'
                      : 'bg-gradient-to-r from-red-500 to-rose-600'
                  }`}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="font-semibold text-white">Confirm Refund</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
