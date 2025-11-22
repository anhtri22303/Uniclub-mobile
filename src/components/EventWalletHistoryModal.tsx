import { Ionicons } from '@expo/vector-icons';
import { EventWallet, getEventWallet } from '@services/event.service';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface EventWalletHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string | number;
}

export default function EventWalletHistoryModal({
  visible,
  onClose,
  eventId
}: EventWalletHistoryModalProps) {
  const [wallet, setWallet] = useState<EventWallet | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const fetchWalletData = async () => {
      setLoading(true);
      try {
        const data = await getEventWallet(eventId);
        setWallet(data);
      } catch (error: any) {
        console.error('Failed to fetch wallet history:', error);
        Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to load wallet history');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [visible, eventId]);

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

  const getTransactionIcon = (amount: number) => {
    if (amount > 0) {
      return <Ionicons name="arrow-down-circle" size={20} color="#10B981" />;
    }
    return <Ionicons name="arrow-up-circle" size={20} color="#EF4444" />;
  };

  const getTransactionBadge = (type: string) => {
    const upperType = type.toUpperCase();
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-700';

    switch (upperType) {
      case 'TRANSFER':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-700';
        break;
      case 'DEPOSIT':
        bgColor = 'bg-green-100';
        textColor = 'text-green-700';
        break;
      case 'WITHDRAWAL':
        bgColor = 'bg-red-100';
        textColor = 'text-red-700';
        break;
    }

    return (
      <View className={`${bgColor} px-2 py-1 rounded-full`}>
        <Text className={`${textColor} text-xs font-medium`}>{type}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-2xl max-h-[90%] overflow-hidden">
          {/* Header */}
          <View className="bg-emerald-600 p-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Ionicons name="wallet" size={24} color="white" />
              <Text className="text-white text-xl font-bold ml-2">
                Wallet History
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#10B981" />
              <Text className="text-gray-500 mt-4">Loading wallet history...</Text>
            </View>
          ) : wallet ? (
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              {/* Wallet Summary */}
              <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border-2 border-blue-200">
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-600 mb-1">Event Name</Text>
                  <Text className="text-lg font-semibold text-blue-900">{wallet.eventName}</Text>
                </View>
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-600 mb-1">Host Club</Text>
                  <Text className="text-lg font-semibold text-blue-900">{wallet.hostClubName}</Text>
                </View>

                <View className="h-px bg-blue-200 my-4" />

                <View className="flex-row gap-3">
                  <View className="flex-1 bg-white rounded-xl p-3 border border-blue-200">
                    <Text className="text-sm font-medium text-gray-600 mb-1">Budget Points</Text>
                    <Text className="text-2xl font-bold text-blue-900">{wallet.budgetPoints}</Text>
                  </View>
                  <View className="flex-1 bg-white rounded-xl p-3 border border-blue-200">
                    <Text className="text-sm font-medium text-gray-600 mb-1">Balance</Text>
                    <Text className="text-2xl font-bold text-green-700">{wallet.balancePoints}</Text>
                  </View>
                </View>

                <View className="flex-row items-center mt-3">
                  <Ionicons name="calendar" size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1">
                    Created: {formatDate(wallet.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Transactions List */}
              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="document-text" size={18} color="#374151" />
                    <Text className="text-lg font-semibold text-gray-800 ml-2">
                      Transaction History
                    </Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-1 rounded-full">
                    <Text className="text-xs font-medium text-gray-700">
                      {wallet.transactions.length} {wallet.transactions.length === 1 ? 'transaction' : 'transactions'}
                    </Text>
                  </View>
                </View>

                {wallet.transactions.length === 0 ? (
                  <View className="bg-gray-50 rounded-xl p-8 items-center">
                    <Ionicons name="file-tray-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-2">No transactions found</Text>
                  </View>
                ) : (
                  <View className="gap-3">
                    {wallet.transactions
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((transaction) => (
                        <View
                          key={transaction.id}
                          className={`rounded-xl p-4 border-l-4 ${
                            transaction.amount > 0
                              ? 'border-l-green-500 bg-green-50/30'
                              : 'border-l-red-500 bg-red-50/30'
                          }`}
                        >
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-row items-start flex-1 gap-3">
                              <View className="mt-0.5">
                                {getTransactionIcon(transaction.amount)}
                              </View>
                              <View className="flex-1">
                                <View className="flex-row items-center gap-2 mb-1">
                                  {getTransactionBadge(transaction.type)}
                                  <Text className="text-xs text-gray-500">
                                    #{transaction.id}
                                  </Text>
                                </View>
                                <Text className="text-sm font-medium text-gray-900 mb-1">
                                  {transaction.description}
                                </Text>
                                <View className="flex-row items-center">
                                  <Ionicons name="calendar" size={12} color="#6B7280" />
                                  <Text className="text-xs text-gray-600 ml-1">
                                    {formatDate(transaction.createdAt)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <View className="items-end ml-3">
                              <Text
                                className={`text-xl font-bold ${
                                  transaction.amount > 0 ? 'text-green-700' : 'text-red-700'
                                }`}
                              >
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                              </Text>
                              <Text className="text-xs text-gray-600">points</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <View className="py-12 items-center">
              <Text className="text-gray-500">No wallet data available</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
