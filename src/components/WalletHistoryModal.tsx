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
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    if (visible) {
      loadWalletHistory();
      // Reset filters when modal opens
      setTypeFilter('all');
      setDateFilter('all');
      setCurrentPage(1);
    }
  }, [visible, eventId]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, dateFilter]);

  const loadWalletHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEventWallet(eventId);
      console.log('📊 Wallet Data Response:', JSON.stringify(data, null, 2));
      console.log('📊 Transactions count:', data?.transactions?.length || 0);
      console.log('📊 First transaction:', data?.transactions?.[0]);
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

  const getTransactionIcon = (amount: number, type: string) => {
    const normalizedType = type.toUpperCase().replace(/_/g, ' ');
    
    // BONUS REWARD: red down arrow
    if (normalizedType === 'BONUS REWARD') {
      return 'arrow-down-circle';
    }
    
    // COMMIT LOCK: green up arrow
    if (normalizedType === 'COMMIT LOCK') {
      return 'arrow-up-circle';
    }
    
    // Other transactions: green for positive, red for negative
    return amount > 0 ? 'arrow-down-circle' : 'arrow-up-circle';
  };
  
  const getTransactionIconColor = (amount: number, type: string) => {
    const normalizedType = type.toUpperCase().replace(/_/g, ' ');
    
    if (normalizedType === 'BONUS REWARD') return '#DC2626';
    if (normalizedType === 'COMMIT LOCK') return '#059669';
    
    return amount > 0 ? '#059669' : '#DC2626';
  };

  const getTransactionBadge = (type: string) => {
    const typeUpper = type.toUpperCase().replace(/_/g, ' ');
    
    const badgeConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
      'BONUS REWARD': {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-300',
        label: 'BONUS REWARD'
      },
      'COMMIT LOCK': {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-300',
        label: 'COMMIT LOCK'
      },
      'CLUB TO MEMBER': {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-300',
        label: 'CLUB TO MEMBER'
      },
      'REFUND PRODUCT': {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-300',
        label: 'REFUND PRODUCT'
      },
      'TRANSFER': {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-300',
        label: 'TRANSFER'
      },
      'DEPOSIT': {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-300',
        label: 'DEPOSIT'
      },
      'WITHDRAWAL': {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-300',
        label: 'WITHDRAWAL'
      }
    };

    return badgeConfig[typeUpper] || {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-300',
      label: typeUpper
    };
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionBg = (amount: number) => {
    return amount >= 0 ? 'bg-green-50' : 'bg-red-50';
  };
  
  // Filter and pagination logic
  const sortedTransactions = walletData?.transactions
    ? [...walletData.transactions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];
  
  // Filter transactions by type
  const filteredByType = typeFilter === 'all'
    ? sortedTransactions
    : sortedTransactions.filter((t) => {
        const normalizedType = t.type.toUpperCase().replace(/_/g, ' ');
        return normalizedType === typeFilter;
      });
  
  // Filter by date range
  const filteredTransactions = dateFilter === 'all'
    ? filteredByType
    : filteredByType.filter((t) => {
        const transactionDate = new Date(t.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateFilter) {
          case 'today':
            return transactionDate >= today;
          case 'week': {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactionDate >= weekAgo;
          }
          case 'month': {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return transactionDate >= monthAgo;
          }
          case 'lastMonth': {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            return transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd;
          }
          default:
            return true;
        }
      });
  
  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  
  // Calculate statistics for BONUS REWARD and COMMIT LOCK
  const bonusRewardStats = filteredTransactions
    .filter((t) => t.type.toUpperCase().replace(/_/g, ' ') === 'BONUS REWARD')
    .reduce(
      (acc, t) => ({
        count: acc.count + 1,
        total: acc.total + t.amount,
      }),
      { count: 0, total: 0 }
    );
  
  const commitLockStats = filteredTransactions
    .filter((t) => t.type.toUpperCase().replace(/_/g, ' ') === 'COMMIT LOCK')
    .reduce(
      (acc, t) => ({
        count: acc.count + 1,
        total: acc.total + Math.abs(t.amount),
      }),
      { count: 0, total: 0 }
    );

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
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Wallet Summary - Compact */}
              <View className="px-6 pt-4 pb-3">
                <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-medium text-gray-600 mb-1">Event Name</Text>
                      <Text className="text-base font-bold text-blue-900" numberOfLines={1}>
                        {walletData.eventName}
                      </Text>
                    </View>
                    <View className="flex-1 ml-2">
                      <Text className="text-xs font-medium text-gray-600 mb-1">Host Club</Text>
                      <Text className="text-base font-bold text-blue-900" numberOfLines={1}>
                        {walletData.hostClubName}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row gap-2">
                    <View className="flex-1 bg-white p-3 rounded-lg border border-blue-200">
                      <Text className="text-xs font-medium text-gray-600 mb-1">
                        Budget Points
                      </Text>
                      <Text className="text-xl font-bold text-blue-900">
                        {walletData.budgetPoints}
                      </Text>
                    </View>
                    <View className="flex-1 bg-white p-3 rounded-lg border border-blue-200">
                      <Text className="text-xs font-medium text-gray-600 mb-1">
                        Balance Points
                      </Text>
                      <Text className="text-xl font-bold text-green-700">
                        {walletData.balancePoints}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Filters and Statistics */}
              <View className="px-6 py-3">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-bold text-gray-900">
                    Transaction History
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {totalTransactions} {totalTransactions === 1 ? 'transaction' : 'transactions'}
                  </Text>
                </View>

                {/* Statistics Cards */}
                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1 p-3 bg-red-50 rounded-lg border border-red-200">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="arrow-down-circle" size={16} color="#DC2626" />
                      <Text className="text-xs font-medium text-red-600 ml-1">Bonus Reward</Text>
                    </View>
                    <Text className="text-lg font-bold text-red-700">
                      {bonusRewardStats.total} pts
                    </Text>
                    <Text className="text-xs text-red-600">
                      {bonusRewardStats.count} {bonusRewardStats.count === 1 ? 'transaction' : 'transactions'}
                    </Text>
                  </View>

                  <View className="flex-1 p-3 bg-green-50 rounded-lg border border-green-200">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="arrow-up-circle" size={16} color="#059669" />
                      <Text className="text-xs font-medium text-green-600 ml-1">Commit Lock</Text>
                    </View>
                    <Text className="text-lg font-bold text-green-700">
                      +{commitLockStats.total} pts
                    </Text>
                    <Text className="text-xs text-green-600">
                      {commitLockStats.count} {commitLockStats.count === 1 ? 'transaction' : 'transactions'}
                    </Text>
                  </View>
                </View>

                {/* Filters */}
                <View className="space-y-2 mb-3">
                  <View className="flex-row gap-2">
                    {/* Type Filter */}
                    <TouchableOpacity
                      onPress={() => {
                        const options = ['all', 'COMMIT LOCK', 'BONUS REWARD'];
                        const currentIndex = options.indexOf(typeFilter);
                        const nextIndex = (currentIndex + 1) % options.length;
                        setTypeFilter(options[nextIndex]);
                      }}
                      className="flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                    >
                      <Text className="text-xs text-gray-600 mb-1">Type</Text>
                      <Text className="text-sm font-medium text-gray-800">
                        {typeFilter === 'all' ? 'All Types' : typeFilter}
                      </Text>
                    </TouchableOpacity>

                    {/* Date Filter */}
                    <TouchableOpacity
                      onPress={() => {
                        const options = ['all', 'today', 'week', 'month', 'lastMonth'];
                        const currentIndex = options.indexOf(dateFilter);
                        const nextIndex = (currentIndex + 1) % options.length;
                        setDateFilter(options[nextIndex]);
                      }}
                      className="flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                    >
                      <Text className="text-xs text-gray-600 mb-1">Period</Text>
                      <Text className="text-sm font-medium text-gray-800">
                        {dateFilter === 'all' ? 'All Time' : 
                         dateFilter === 'today' ? 'Today' :
                         dateFilter === 'week' ? 'This Week' :
                         dateFilter === 'month' ? 'This Month' : 'Last Month'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Clear Filters */}
                  {(typeFilter !== 'all' || dateFilter !== 'all') && (
                    <TouchableOpacity
                      onPress={() => {
                        setTypeFilter('all');
                        setDateFilter('all');
                      }}
                      className="flex-row items-center justify-center py-2"
                    >
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text className="text-red-600 text-sm font-medium ml-1">Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Transactions List */}
              <View className="px-6 pb-4">
                {totalTransactions === 0 ? (
                  <View className="py-12 items-center">
                    <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-4">
                      {walletData.transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
                    </Text>
                    {walletData.transactions.length > 0 && (
                      <Text className="text-gray-400 text-sm mt-1">Try adjusting your filters</Text>
                    )}
                  </View>
                ) : (
                  <>
                    <View className="space-y-3 mb-4">
                      {paginatedTransactions.map((transaction) => {
                        const badgeConfig = getTransactionBadge(transaction.type);
                        const isIncoming = transaction.amount > 0;
                        
                        return (
                          <View
                            key={transaction.id}
                            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
                          >
                            <View className="flex-row items-start justify-between mb-3">
                              <View className="flex-row items-center flex-1">
                                <View className={`p-2 rounded-lg mr-3 ${isIncoming ? 'bg-green-100' : 'bg-red-100'}`}>
                                  <Ionicons
                                    name={getTransactionIcon(transaction.amount, transaction.type) as any}
                                    size={20}
                                    color={getTransactionIconColor(transaction.amount, transaction.type)}
                                  />
                                </View>
                                <View className="flex-1">
                                  <View className={`px-2 py-1 rounded ${badgeConfig.bg} self-start border ${badgeConfig.border}`}>
                                    <Text className={`text-xs font-medium ${badgeConfig.text}`}>
                                      {badgeConfig.label}
                                    </Text>
                                  </View>
                                  <Text className="text-xs text-gray-600 mt-1">
                                    {formatDate(transaction.createdAt)}
                                  </Text>
                                </View>
                              </View>
                              <Text className={`text-lg font-bold ${getTransactionColor(transaction.amount)}`}>
                                {isIncoming ? '+' : ''}
                                {transaction.amount} pts
                              </Text>
                            </View>

                            {/* Description */}
                            <View className="bg-gray-50 rounded-lg p-3">
                              <Text className="text-gray-700 text-sm">
                                {transaction.description}
                              </Text>
                            </View>

                            {/* Transaction ID */}
                            <Text className="text-gray-400 text-xs mt-2">
                              ID: #{transaction.id}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <View className="space-y-3">
                        <Text className="text-center text-sm text-gray-600">
                          Showing {startIndex + 1}-{Math.min(endIndex, totalTransactions)} of {totalTransactions}
                        </Text>
                        
                        <View className="flex-row items-center justify-center gap-2">
                          <TouchableOpacity
                            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg ${
                              currentPage === 1 ? 'bg-gray-200' : 'bg-blue-600'
                            }`}
                          >
                            <Text className={`font-semibold ${
                              currentPage === 1 ? 'text-gray-400' : 'text-white'
                            }`}>
                              Previous
                            </Text>
                          </TouchableOpacity>

                          <View className="flex-row items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <TouchableOpacity
                                  key={pageNum}
                                  onPress={() => setCurrentPage(pageNum)}
                                  className={`w-10 h-10 rounded-lg items-center justify-center ${
                                    currentPage === pageNum ? 'bg-blue-600' : 'bg-gray-100'
                                  }`}
                                >
                                  <Text className={`font-semibold ${
                                    currentPage === pageNum ? 'text-white' : 'text-gray-700'
                                  }`}>
                                    {pageNum}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          <TouchableOpacity
                            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg ${
                              currentPage === totalPages ? 'bg-gray-200' : 'bg-blue-600'
                            }`}
                          >
                            <Text className={`font-semibold ${
                              currentPage === totalPages ? 'text-gray-400' : 'text-white'
                            }`}>
                              Next
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <Text className="text-center text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </Text>
                      </View>
                    )}
                  </>
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

