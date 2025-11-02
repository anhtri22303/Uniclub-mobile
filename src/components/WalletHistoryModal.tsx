import { Ionicons } from '@expo/vector-icons';
import type { EventWallet } from '@services/event.service';
import { getEventWallet } from '@services/event.service';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface WalletHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: number;
  budgetPoints: number;
}

export default function WalletHistoryModal({
  visible,
  onClose,
  eventId,
  budgetPoints,
}: WalletHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<EventWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadWalletHistory();
    }
  }, [visible, eventId]);

  const loadWalletHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEventWallet(eventId);
      setWalletData(data);
    } catch (err: any) {
      console.error('Failed to load wallet history:', err);
      setError(err?.response?.data?.message || 'Failed to load wallet history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'TRANSFER':
        return 'swap-horizontal';
      case 'DEPOSIT':
        return 'arrow-down-circle';
      case 'WITHDRAW':
        return 'arrow-up-circle';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionBg = (amount: number) => {
    return amount >= 0 ? 'bg-green-50' : 'bg-red-50';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 bg-white rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">
              Transaction History
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 -mr-2"
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#0D9488" />
              <Text className="text-gray-500 mt-4">Loading history...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center px-6">
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text className="text-red-600 font-semibold mt-4 text-center">
                {error}
              </Text>
              <TouchableOpacity
                onPress={loadWalletHistory}
                className="mt-4 bg-teal-600 px-6 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : walletData ? (
            <ScrollView className="flex-1">
              {/* Wallet Summary */}
              <View className="p-6 bg-gradient-to-br from-teal-50 to-blue-50">
                <View className="bg-white rounded-xl shadow-sm p-4">
                  <Text className="text-gray-600 text-sm mb-1">Event Name</Text>
                  <Text className="text-gray-900 font-bold text-lg mb-3">
                    {walletData.eventName}
                  </Text>
                  
                  <View className="flex-row gap-2 mb-3">
                    <View className="flex-1 bg-blue-50 p-3 rounded-lg">
                      <Text className="text-blue-600 text-xs font-medium mb-1">
                        Budget Points
                      </Text>
                      <Text className="text-blue-900 text-xl font-bold">
                        {walletData.budgetPoints}
                      </Text>
                    </View>
                    <View className="flex-1 bg-green-50 p-3 rounded-lg">
                      <Text className="text-green-600 text-xs font-medium mb-1">
                        Balance Points
                      </Text>
                      <Text className="text-green-900 text-xl font-bold">
                        {walletData.balancePoints}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons name="business" size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-1">
                      {walletData.hostClubName}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Transactions List */}
              <View className="px-6 py-4">
                <Text className="text-lg font-bold text-gray-900 mb-4">
                  Transactions ({walletData.transactions.length})
                </Text>

                {walletData.transactions.length === 0 ? (
                  <View className="py-12 items-center">
                    <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-4">No transactions yet</Text>
                  </View>
                ) : (
                  <View className="space-y-3">
                    {walletData.transactions.map((transaction, index) => (
                      <View
                        key={transaction.id}
                        className={`p-4 rounded-xl border ${
                          transaction.amount >= 0
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-row items-center flex-1">
                            <View
                              className={`p-2 rounded-lg mr-3 ${
                                transaction.amount >= 0 ? 'bg-green-100' : 'bg-red-100'
                              }`}
                            >
                              <Ionicons
                                name={getTransactionIcon(transaction.type) as any}
                                size={20}
                                color={transaction.amount >= 0 ? '#059669' : '#DC2626'}
                              />
                            </View>
                            <View className="flex-1">
                              <Text className="text-gray-900 font-semibold text-sm">
                                {transaction.type}
                              </Text>
                              <Text className="text-gray-600 text-xs mt-0.5">
                                {formatDate(transaction.createdAt)}
                              </Text>
                            </View>
                          </View>
                          <Text
                            className={`text-lg font-bold ${getTransactionColor(
                              transaction.amount
                            )}`}
                          >
                            {transaction.amount >= 0 ? '+' : ''}
                            {transaction.amount}
                          </Text>
                        </View>

                        {/* Description */}
                        <View className="bg-white/60 rounded-lg p-2 mt-2">
                          <Text className="text-gray-700 text-xs">
                            {transaction.description}
                          </Text>
                        </View>

                        {/* Transaction ID */}
                        <Text className="text-gray-400 text-xs mt-2">
                          ID: #{transaction.id}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Bottom Spacing */}
              <View className="h-8" />
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

