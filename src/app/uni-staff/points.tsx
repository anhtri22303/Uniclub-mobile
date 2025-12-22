import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import PointRequestService, { PointRequest } from '@services/point-request.service';
import WalletService, { UniToClubTransaction, UniToEventTransaction } from '@services/wallet.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

interface Club {
  id: number;
  name: string;
  category: string;
  leaderName: string;
  members: number;
  policy: string;
  events: number;
  description: string | null;
  status?: string;
}

type ReasonType = 'monthly' | 'other' | 'fromRequest';

export default function UniStaffPointsPage() {
  const { user } = useAuthStore();
  
  // State management
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClubIds, setSelectedClubIds] = useState<number[]>([]); // Changed to array
  const [rewardAmount, setRewardAmount] = useState('');
  const [isDistributing, setIsDistributing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); // Added search
  
  // Reason type state
  const [reasonType, setReasonType] = useState<ReasonType>('monthly');
  const [customReason, setCustomReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  
  // Point requests
  const [pointRequests, setPointRequests] = useState<PointRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Transaction history modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEventPointsModal, setShowEventPointsModal] = useState(false);
  const [transactions, setTransactions] = useState<UniToClubTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [eventTransactions, setEventTransactions] = useState<UniToEventTransaction[]>([]);
  const [eventTransactionsLoading, setEventTransactionsLoading] = useState(false);
  
  // History filters and pagination
  const [historyTransactionTypeFilter, setHistoryTransactionTypeFilter] = useState<string>("all");
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("all");
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyPageSize] = useState(5);
  
  // Event Points filters and pagination
  const [eventTransactionTypeFilter, setEventTransactionTypeFilter] = useState<string>("all");
  const [eventDateFilter, setEventDateFilter] = useState<string>("all");
  const [eventCurrentPage, setEventCurrentPage] = useState(1);
  const [eventPageSize] = useState(5);
  
  const itemsPerPage = 10;

  // Load all clubs and point requests
  useEffect(() => {
    loadClubs();
    loadPointRequests();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const clubs = await ClubService.getAllClubs();

      setAllClubs(clubs);
    } catch (error: any) {
      console.error('Error loading clubs:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load clubs',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPointRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await PointRequestService.fetchAllPointRequests();
      setPointRequests(response.data || []);
    } catch (error: any) {
      console.error('Error loading point requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Filter approved requests
  const approvedRequests = useMemo(() => {
    return pointRequests.filter((req) => req.status === 'APPROVED');
  }, [pointRequests]);

  // Toggle club selection (multi-select)
  const handleSelectClub = (clubId: number) => {
    setSelectedClubIds((prev) => {
      if (prev.includes(clubId)) {
        return prev.filter((id) => id !== clubId);
      } else {
        return [...prev, clubId];
      }
    });
  };

  // Filter clubs by search query
  const filteredClubs = useMemo(() => {
    if (!searchQuery.trim()) {
      return allClubs;
    }
    return allClubs.filter((club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allClubs, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredClubs.length / itemsPerPage);
  const paginatedClubs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredClubs.slice(startIndex, endIndex);
  }, [filteredClubs, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Select/Deselect all filtered clubs
  const handleToggleSelectAll = () => {
    const filteredIds = filteredClubs.map((club) => club.id);
    const allFilteredSelected = filteredIds.every((id) =>
      selectedClubIds.includes(id)
    );

    if (allFilteredSelected) {
      // Deselect all filtered
      setSelectedClubIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all filtered
      setSelectedClubIds((prev) => {
        const merged = [...prev];
        filteredIds.forEach((id) => {
          if (!merged.includes(id)) {
            merged.push(id);
          }
        });
        return merged;
      });
    }
  };

  const allSelected = useMemo(() => {
    if (filteredClubs.length === 0) {
      return false;
    }
    return filteredClubs.every((club) => selectedClubIds.includes(club.id));
  }, [filteredClubs, selectedClubIds]);

  // Validate reason based on type
  const isReasonInvalid = useMemo(() => {
    if (reasonType === 'other') {
      return !customReason.trim();
    }
    if (reasonType === 'fromRequest') {
      return !selectedRequestId;
    }
    return false;
  }, [reasonType, customReason, selectedRequestId]);

  // Get final reason
  const getFinalReason = (): string | null => {
    if (reasonType === 'monthly') {
      return 'Monthly club points';
    } else if (reasonType === 'fromRequest') {
      if (!selectedRequestId) return null;
      const selectedRequest = approvedRequests.find(
        (req) => req.id === selectedRequestId
      );
      return selectedRequest?.reason || null;
    } else {
      return customReason.trim() || null;
    }
  };

  // Distribute rewards
  const handleDistributeRewards = async () => {
    const amount = parseInt(rewardAmount);
    
    if (!rewardAmount || amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid reward amount.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    if (selectedClubIds.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Clubs Selected',
        text2: 'Please select at least one club.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    const finalReason = getFinalReason();
    if (!finalReason) {
      Toast.show({
        type: 'error',
        text1: 'Reason Required',
        text2: 'Please select a reason or enter a custom reason.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    // Confirmation alert
    Alert.alert(
      'Confirm Distribution',
      `Distribute ${amount} points to ${selectedClubIds.length} club(s)?\n\nReason: ${finalReason}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsDistributing(true);
            try {
              const result = await WalletService.pointsToClubs(
                selectedClubIds,
                amount,
                finalReason
              );

              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: result.message || `Successfully distributed ${amount} points to ${selectedClubIds.length} club(s).`,
                  visibilityTime: 3000,
                  autoHide: true,
                });
                
                // Reset form
                setRewardAmount('');
                setCustomReason('');
                setSelectedRequestId(null);
                setReasonType('monthly');
                setSelectedClubIds([]);
              } else {
                throw new Error(result.message || 'Failed to distribute points');
              }
            } catch (error: any) {
              console.error('Distribution error:', error);
              const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'An error occurred';
              const isTimeout =
                error?.code === 'ECONNABORTED' ||
                errorMessage.toLowerCase().includes('timeout');

              Toast.show({
                type: 'error',
                text1: isTimeout ? 'Request Timeout' : 'Distribution Failed',
                text2: isTimeout
                  ? `The request took too long (processing ${selectedClubIds.length} clubs). The points may still be distributed successfully. Please check the transaction history.`
                  : errorMessage,
                visibilityTime: 4000,
                autoHide: true,
              });
            } finally {
              setIsDistributing(false);
            }
          },
        },
      ]
    );
  };

  // Load uni-to-club transaction history
  const loadTransactionHistory = async () => {
    setTransactionsLoading(true);
    try {
      const data = await WalletService.getUniToClubTransactions();
      setTransactions(data);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || 'Failed to load transaction history',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleOpenHistoryModal = () => {
    setShowHistoryModal(true);
    setHistoryTransactionTypeFilter("all");
    setHistoryDateFilter("all");
    setHistoryCurrentPage(1);
    loadTransactionHistory();
  };

  // Get unique transaction types from Club transactions
  const uniqueHistoryTransactionTypes = useMemo(() => {
    const types = new Set(transactions.map(t => t.type));
    return Array.from(types).sort();
  }, [transactions]);

  // Filter Club transactions
  const filteredHistoryTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (historyTransactionTypeFilter !== "all") {
      filtered = filtered.filter(t => t.type === historyTransactionTypeFilter);
    }

    if (historyDateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt);
        const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());

        switch (historyDateFilter) {
          case "today":
            return transactionDay.getTime() === today.getTime();
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactionDay >= weekAgo;
          case "month":
            return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
          case "year":
            return transactionDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [transactions, historyDateFilter, historyTransactionTypeFilter]);

  // Paginate filtered Club transactions
  const paginatedHistoryTransactions = useMemo(() => {
    const startIndex = (historyCurrentPage - 1) * historyPageSize;
    const endIndex = startIndex + historyPageSize;
    return filteredHistoryTransactions.slice(startIndex, endIndex);
  }, [filteredHistoryTransactions, historyCurrentPage, historyPageSize]);

  const historyTotalPages = Math.ceil(filteredHistoryTransactions.length / historyPageSize);

  // Load uni-to-event transaction history
  const loadEventTransactionHistory = async () => {
    setEventTransactionsLoading(true);
    try {
      const data = await WalletService.getUniToEventTransactions();
      setEventTransactions(data);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || 'Failed to load event transaction history',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setEventTransactionsLoading(false);
    }
  };

  const handleOpenEventPointsModal = () => {
    setShowEventPointsModal(true);
    setEventTransactionTypeFilter("all");
    setEventDateFilter("all");
    setEventCurrentPage(1);
    loadEventTransactionHistory();
  };

  // Get unique transaction types from Event transactions
  const uniqueEventTransactionTypes = useMemo(() => {
    const types = new Set(eventTransactions.map(t => t.type));
    return Array.from(types).sort();
  }, [eventTransactions]);

  // Filter Event transactions
  const filteredEventTransactions = useMemo(() => {
    let filtered = [...eventTransactions];

    if (eventTransactionTypeFilter !== "all") {
      filtered = filtered.filter(t => t.type === eventTransactionTypeFilter);
    }

    if (eventDateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt);
        const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());

        switch (eventDateFilter) {
          case "today":
            return transactionDay.getTime() === today.getTime();
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactionDay >= weekAgo;
          case "month":
            return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
          case "year":
            return transactionDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [eventTransactions, eventDateFilter, eventTransactionTypeFilter]);

  // Paginate filtered Event transactions
  const paginatedEventTransactions = useMemo(() => {
    const startIndex = (eventCurrentPage - 1) * eventPageSize;
    const endIndex = startIndex + eventPageSize;
    return filteredEventTransactions.slice(startIndex, endIndex);
  }, [filteredEventTransactions, eventCurrentPage, eventPageSize]);

  const eventTotalPages = Math.ceil(filteredEventTransactions.length / eventPageSize);

  // Format date helper
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-lg font-medium mt-4 text-gray-700">Loading clubs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      
      {/* Sidebar */}
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <Ionicons name="wallet" size={28} color="#3B82F6" />
            <Text className="text-2xl font-bold text-gray-800 ml-2">Club Rewards</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleOpenEventPointsModal}
              className="bg-gray-100 rounded-xl px-3 py-2 flex-row items-center"
            >
              <Ionicons name="calendar-outline" size={18} color="#4B5563" />
              <Text className="text-gray-700 font-medium ml-1.5 text-xs">Events</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenHistoryModal}
              className="bg-gray-100 rounded-xl px-3 py-2 flex-row items-center"
            >
              <Ionicons name="time-outline" size={18} color="#4B5563" />
              <Text className="text-gray-700 font-medium ml-1.5 text-xs">History</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-gray-600">Distribute points to university clubs</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Reward Settings Card */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mt-6 mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">Reward Settings</Text>
          
          {/* Amount Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Points per Club
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Ionicons name="wallet-outline" size={20} color="#6B7280" />
              <AppTextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="Enter reward points..."
                keyboardType="numeric"
                value={rewardAmount}
                onChangeText={setRewardAmount}
                editable={!isDistributing}
              />
            </View>
          </View>

          {/* Reason Type Selection */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Reason for Distribution (Required)
            </Text>

            {/* Monthly */}
            <TouchableOpacity
              onPress={() => {
                setReasonType('monthly');
                setSelectedRequestId(null);
              }}
              disabled={isDistributing}
              className="flex-row items-center mb-2 p-3 bg-gray-50 rounded-xl"
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  reasonType === 'monthly'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {reasonType === 'monthly' && (
                  <View className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </View>
              <Text className="text-gray-700">Monthly club points</Text>
            </TouchableOpacity>

            {/* From Request */}
            <TouchableOpacity
              onPress={() => {
                setReasonType('fromRequest');
              }}
              disabled={isDistributing}
              className="flex-row items-center mb-2 p-3 bg-gray-50 rounded-xl"
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  reasonType === 'fromRequest'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {reasonType === 'fromRequest' && (
                  <View className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </View>
              <Text className="text-gray-700">From approved point request</Text>
            </TouchableOpacity>

            {/* Show request selector if fromRequest */}
            {reasonType === 'fromRequest' && (
              <View className="ml-8 mt-2">
                {loadingRequests ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : approvedRequests.length === 0 ? (
                  <Text className="text-sm text-gray-500 italic">
                    No approved point requests available.
                  </Text>
                ) : (
                  <ScrollView
                    className="max-h-40"
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled
                  >
                    {approvedRequests.map((req) => (
                      <TouchableOpacity
                        key={req.id}
                        onPress={() => setSelectedRequestId(req.id)}
                        className={`p-3 mb-2 rounded-lg border ${
                          selectedRequestId === req.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Text className="text-sm font-semibold text-gray-800">
                          {req.clubName} - {req.requestedPoints.toLocaleString()} pts
                        </Text>
                        <Text
                          className="text-xs text-gray-600 mt-1"
                          numberOfLines={2}
                        >
                          {req.reason}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Other */}
            <TouchableOpacity
              onPress={() => {
                setReasonType('other');
                setSelectedRequestId(null);
              }}
              disabled={isDistributing}
              className="flex-row items-center mb-2 p-3 bg-gray-50 rounded-xl"
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  reasonType === 'other'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {reasonType === 'other' && (
                  <View className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </View>
              <Text className="text-gray-700">Other</Text>
            </TouchableOpacity>

            {/* Show custom reason input if other */}
            {reasonType === 'other' && (
              <View className="ml-8 mt-2">
                <AppTextInput
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="Enter specific reason..."
                  value={customReason}
                  onChangeText={setCustomReason}
                  editable={!isDistributing}
                  multiline
                />
              </View>
            )}
          </View>

          {/* Selected Club Info */}
          <View className="bg-blue-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700 font-medium">Selected Clubs:</Text>
              <Text className="text-blue-600 font-bold text-base">
                {selectedClubIds.length} club(s)
              </Text>
            </View>
          </View>

          {/* Distribute Button */}
          <TouchableOpacity
            onPress={handleDistributeRewards}
            disabled={
              isDistributing ||
              !rewardAmount ||
              parseInt(rewardAmount) <= 0 ||
              selectedClubIds.length === 0 ||
              isReasonInvalid
            }
            className={`rounded-xl py-4 items-center ${
              isDistributing ||
              !rewardAmount ||
              parseInt(rewardAmount) <= 0 ||
              selectedClubIds.length === 0 ||
              isReasonInvalid
                ? 'bg-gray-300'
                : 'bg-blue-600'
            }`}
          >
            {isDistributing ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-bold ml-2">
                  Distributing to {selectedClubIds.length} club(s)...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="send" size={20} color="white" />
                <Text className="text-white font-bold ml-2">
                  Distribute {rewardAmount || 0} pts to {selectedClubIds.length} club(s)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Clubs List */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Club List ({allClubs.length})
            </Text>
            {filteredClubs.length > 0 && (
              <TouchableOpacity
                onPress={handleToggleSelectAll}
                className="px-4 py-2 bg-gray-100 rounded-lg"
              >
                <Text className="text-sm font-medium text-gray-700">
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Bar */}
          {allClubs.length > 0 && (
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 mb-4">
              <Ionicons name="search" size={20} color="#6B7280" />
              <AppTextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="Search by club name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}

          {allClubs.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="albums-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No clubs found</Text>
            </View>
          ) : filteredClubs.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No clubs match your search</Text>
            </View>
          ) : (
            <>
              {paginatedClubs.map((club) => {
                const isSelected = selectedClubIds.includes(club.id);
                return (
                  <TouchableOpacity
                    key={club.id}
                    onPress={() => handleSelectClub(club.id)}
                    className={`mb-3 p-4 rounded-2xl border-2 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-transparent'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-lg font-bold text-gray-800 mb-1">
                          {club.name}
                        </Text>
                        
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="person" size={14} color="#6B7280" />
                          <Text className="text-sm text-gray-600 ml-1">
                            {club.leaderName || 'No Leader'}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-3">
                          <View className="flex-row items-center">
                            <Ionicons name="people" size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                              {club.members > 0 ? `${club.members} members` : 'No members'}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="calendar" size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                              {club.events > 0 ? `${club.events} events` : 'No events'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="items-center">
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="white" />
                          )}
                        </View>
                        {isSelected && rewardAmount && parseInt(rewardAmount) > 0 && (
                          <Text className="text-xs text-blue-600 font-bold mt-1">
                            +{rewardAmount} pts
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <View className="flex-row items-center justify-center gap-3 mt-4">
                  <TouchableOpacity
                    onPress={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${
                      currentPage === 1 ? 'bg-gray-200' : 'bg-blue-600'
                    }`}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={currentPage === 1 ? '#9CA3AF' : 'white'}
                    />
                  </TouchableOpacity>

                  <Text className="text-sm font-medium text-gray-700">
                    Page {currentPage} / {totalPages}
                  </Text>

                  <TouchableOpacity
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${
                      currentPage === totalPages ? 'bg-gray-200' : 'bg-blue-600'
                    }`}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={currentPage === totalPages ? '#9CA3AF' : 'white'}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* University to Club Transaction History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="time" size={28} color="#3B82F6" />
                  <Text className="text-2xl font-bold text-gray-800 ml-2">
                    Transaction History
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                  <Ionicons name="close-circle" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600">University to club transactions</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-4" nestedScrollEnabled>
              {/* Filters */}
              <View className="mb-4 gap-3">
                {/* Transaction Type Filter */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Transaction Type</Text>
                  <View className="border border-gray-200 rounded-xl bg-gray-50">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-2">
                      <TouchableOpacity
                        onPress={() => {
                          setHistoryTransactionTypeFilter("all");
                          setHistoryCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg mr-2 ${
                          historyTransactionTypeFilter === "all"
                            ? "bg-blue-600"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            historyTransactionTypeFilter === "all"
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          All Types
                        </Text>
                      </TouchableOpacity>
                      {uniqueHistoryTransactionTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => {
                            setHistoryTransactionTypeFilter(type);
                            setHistoryCurrentPage(1);
                          }}
                          className={`px-4 py-2 rounded-lg mr-2 ${
                            historyTransactionTypeFilter === type
                              ? "bg-blue-600"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              historyTransactionTypeFilter === type
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {type.replace(/_/g, " ")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Date Filter */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Time Period</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {["all", "today", "week", "month", "year"].map((period) => (
                      <TouchableOpacity
                        key={period}
                        onPress={() => {
                          setHistoryDateFilter(period);
                          setHistoryCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg mr-2 ${
                          historyDateFilter === period
                            ? "bg-blue-600"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            historyDateFilter === period ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {period === "all" ? "All Time" : period === "today" ? "Today" : period === "week" ? "This Week" : period === "month" ? "This Month" : "This Year"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Clear Filters Button */}
                {(historyDateFilter !== "all" || historyTransactionTypeFilter !== "all") && (
                  <TouchableOpacity
                    onPress={() => {
                      setHistoryDateFilter("all");
                      setHistoryTransactionTypeFilter("all");
                      setHistoryCurrentPage(1);
                    }}
                    className="bg-gray-100 rounded-lg px-4 py-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="close-circle" size={16} color="#6B7280" />
                    <Text className="text-gray-700 font-medium ml-2">Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Statistics */}
              {!transactionsLoading && filteredHistoryTransactions.length > 0 && (
                <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
                  <Text className="text-xs text-green-600 font-medium mb-1">Total Distributed</Text>
                  <Text className="text-2xl font-bold text-green-700">
                    +{filteredHistoryTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} pts
                  </Text>
                  <Text className="text-xs text-green-600 mt-1">
                    {filteredHistoryTransactions.length} transaction{filteredHistoryTransactions.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {/* Transactions List */}
              {transactionsLoading ? (
                <View className="items-center py-12">
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="text-gray-600 mt-4">Loading transactions...</Text>
                </View>
              ) : filteredHistoryTransactions.length === 0 ? (
                <View className="items-center py-12">
                  <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                  <Text className="text-xl font-semibold text-gray-800 mt-4">
                    {transactions.length === 0 ? "No Transactions Yet" : "No Matching Transactions"}
                  </Text>
                  <Text className="text-gray-600 mt-2 text-center">
                    {transactions.length === 0
                      ? "No university-to-club transactions found."
                      : "No transactions match the selected filters."}
                  </Text>
                </View>
              ) : (
                <>
                  {paginatedHistoryTransactions.map((transaction, idx) => {
                    const displayIndex = ((historyCurrentPage - 1) * historyPageSize) + idx + 1;
                    return (
                      <View
                        key={transaction.id}
                        className="bg-white rounded-2xl p-4 mb-3 border border-gray-200 shadow-sm"
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center flex-1">
                            <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-2">
                              <Text className="text-xs font-bold text-gray-600">#{displayIndex}</Text>
                            </View>
                            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                              <Ionicons name="arrow-up" size={20} color="#10B981" />
                            </View>
                            <View className="flex-1">
                              <View className="bg-blue-100 px-2 py-1 rounded-md mb-1 self-start">
                                <Text className="text-xs font-medium text-blue-700">
                                  {transaction.type.replace(/_/g, " ")}
                                </Text>
                              </View>
                              <Text className="text-xs text-gray-500">
                                ID: #{transaction.id}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-lg font-bold text-green-600">
                            +{transaction.amount.toLocaleString()} pts
                          </Text>
                        </View>

                        <View className="mt-2 space-y-1">
                          {transaction.senderName && (
                            <View className="flex-row items-center mb-1">
                              <Text className="text-xs text-gray-600 w-16">From:</Text>
                              <Text className="text-sm font-medium text-purple-600">
                                {transaction.senderName}
                              </Text>
                            </View>
                          )}
                          {transaction.receiverName && (
                            <View className="flex-row items-center mb-1">
                              <Text className="text-xs text-gray-600 w-16">To:</Text>
                              <Text className="text-sm font-medium text-blue-600">
                                {transaction.receiverName}
                              </Text>
                            </View>
                          )}
                          {transaction.description && (
                            <View className="flex-row items-start mb-1">
                              <Text className="text-xs text-gray-600 w-16">Note:</Text>
                              <Text className="text-xs text-gray-700 flex-1">
                                {transaction.description}
                              </Text>
                            </View>
                          )}
                          <View className="flex-row items-center">
                            <Text className="text-xs text-gray-600 w-16">Date:</Text>
                            <Text className="text-xs text-gray-700">
                              {formatDate(transaction.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Pagination */}
                  {historyTotalPages > 1 && (
                    <View className="mt-4 mb-2">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs text-gray-600">
                          Showing {((historyCurrentPage - 1) * historyPageSize) + 1} to{" "}
                          {Math.min(historyCurrentPage * historyPageSize, filteredHistoryTransactions.length)} of{" "}
                          {filteredHistoryTransactions.length}
                        </Text>
                        <Text className="text-xs font-medium text-gray-700">
                          Page {historyCurrentPage} / {historyTotalPages}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-center gap-3">
                        <TouchableOpacity
                          onPress={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={historyCurrentPage === 1}
                          className={`p-2 rounded-lg ${
                            historyCurrentPage === 1 ? "bg-gray-200" : "bg-blue-600"
                          }`}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={20}
                            color={historyCurrentPage === 1 ? "#9CA3AF" : "white"}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setHistoryCurrentPage(prev => Math.min(historyTotalPages, prev + 1))}
                          disabled={historyCurrentPage === historyTotalPages}
                          className={`p-2 rounded-lg ${
                            historyCurrentPage === historyTotalPages ? "bg-gray-200" : "bg-blue-600"
                          }`}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={historyCurrentPage === historyTotalPages ? "#9CA3AF" : "white"}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* University to Event Transaction History Modal */}
      <Modal
        visible={showEventPointsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventPointsModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="calendar" size={28} color="#10B981" />
                  <Text className="text-2xl font-bold text-gray-800 ml-2">
                    Event Points
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowEventPointsModal(false)}>
                  <Ionicons name="close-circle" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600">University to event transactions</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-4" nestedScrollEnabled>
              {/* Filters */}
              <View className="mb-4 gap-3">
                {/* Transaction Type Filter */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Transaction Type</Text>
                  <View className="border border-gray-200 rounded-xl bg-gray-50">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="p-2">
                      <TouchableOpacity
                        onPress={() => {
                          setEventTransactionTypeFilter("all");
                          setEventCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg mr-2 ${
                          eventTransactionTypeFilter === "all"
                            ? "bg-green-600"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            eventTransactionTypeFilter === "all"
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          All Types
                        </Text>
                      </TouchableOpacity>
                      {uniqueEventTransactionTypes.map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => {
                            setEventTransactionTypeFilter(type);
                            setEventCurrentPage(1);
                          }}
                          className={`px-4 py-2 rounded-lg mr-2 ${
                            eventTransactionTypeFilter === type
                              ? "bg-green-600"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              eventTransactionTypeFilter === type
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {type.replace(/_/g, " ")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Date Filter */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Time Period</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {["all", "today", "week", "month", "year"].map((period) => (
                      <TouchableOpacity
                        key={period}
                        onPress={() => {
                          setEventDateFilter(period);
                          setEventCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg mr-2 ${
                          eventDateFilter === period
                            ? "bg-green-600"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            eventDateFilter === period ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {period === "all" ? "All Time" : period === "today" ? "Today" : period === "week" ? "This Week" : period === "month" ? "This Month" : "This Year"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Clear Filters Button */}
                {(eventDateFilter !== "all" || eventTransactionTypeFilter !== "all") && (
                  <TouchableOpacity
                    onPress={() => {
                      setEventDateFilter("all");
                      setEventTransactionTypeFilter("all");
                      setEventCurrentPage(1);
                    }}
                    className="bg-gray-100 rounded-lg px-4 py-2 flex-row items-center justify-center"
                  >
                    <Ionicons name="close-circle" size={16} color="#6B7280" />
                    <Text className="text-gray-700 font-medium ml-2">Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Statistics */}
              {!eventTransactionsLoading && filteredEventTransactions.length > 0 && (
                <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-200">
                  <Text className="text-xs text-green-600 font-medium mb-1">Total Distributed to Events</Text>
                  <Text className="text-2xl font-bold text-green-700">
                    +{filteredEventTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()} pts
                  </Text>
                  <Text className="text-xs text-green-600 mt-1">
                    {filteredEventTransactions.length} transaction{filteredEventTransactions.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {/* Transactions List */}
              {eventTransactionsLoading ? (
                <View className="items-center py-12">
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text className="text-gray-600 mt-4">Loading event transactions...</Text>
                </View>
              ) : filteredEventTransactions.length === 0 ? (
                <View className="items-center py-12">
                  <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                  <Text className="text-xl font-semibold text-gray-800 mt-4">
                    {eventTransactions.length === 0 ? "No Event Transactions Yet" : "No Matching Transactions"}
                  </Text>
                  <Text className="text-gray-600 mt-2 text-center">
                    {eventTransactions.length === 0
                      ? "No university-to-event transactions found."
                      : "No transactions match the selected filters."}
                  </Text>
                </View>
              ) : (
                <>
                  {paginatedEventTransactions.map((transaction, idx) => {
                    const displayIndex = ((eventCurrentPage - 1) * eventPageSize) + idx + 1;
                    return (
                      <View
                        key={transaction.id}
                        className="bg-white rounded-2xl p-4 mb-3 border border-gray-200 shadow-sm"
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center flex-1">
                            <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-2">
                              <Text className="text-xs font-bold text-gray-600">#{displayIndex}</Text>
                            </View>
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                              <Ionicons name="calendar" size={20} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                              <View className="bg-green-100 px-2 py-1 rounded-md mb-1 self-start">
                                <Text className="text-xs font-medium text-green-700">
                                  {transaction.type.replace(/_/g, " ")}
                                </Text>
                              </View>
                              <Text className="text-xs text-gray-500">
                                ID: #{transaction.id}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-lg font-bold text-green-600">
                            +{transaction.amount.toLocaleString()} pts
                          </Text>
                        </View>

                        <View className="mt-2 space-y-1">
                          {transaction.senderName && (
                            <View className="flex-row items-center mb-1">
                              <Text className="text-xs text-gray-600 w-16">From:</Text>
                              <Text className="text-sm font-medium text-purple-600">
                                {transaction.senderName}
                              </Text>
                            </View>
                          )}
                          {transaction.receiverName && (
                            <View className="flex-row items-center mb-1">
                              <Text className="text-xs text-gray-600 w-16">To:</Text>
                              <Text className="text-sm font-medium text-blue-600">
                                {transaction.receiverName}
                              </Text>
                            </View>
                          )}
                          {transaction.description && (
                            <View className="flex-row items-start mb-1">
                              <Text className="text-xs text-gray-600 w-16">Note:</Text>
                              <Text className="text-xs text-gray-700 flex-1">
                                {transaction.description}
                              </Text>
                            </View>
                          )}
                          <View className="flex-row items-center">
                            <Text className="text-xs text-gray-600 w-16">Date:</Text>
                            <Text className="text-xs text-gray-700">
                              {formatDate(transaction.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Pagination */}
                  {eventTotalPages > 1 && (
                    <View className="mt-4 mb-2">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs text-gray-600">
                          Showing {((eventCurrentPage - 1) * eventPageSize) + 1} to{" "}
                          {Math.min(eventCurrentPage * eventPageSize, filteredEventTransactions.length)} of{" "}
                          {filteredEventTransactions.length}
                        </Text>
                        <Text className="text-xs font-medium text-gray-700">
                          Page {eventCurrentPage} / {eventTotalPages}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-center gap-3">
                        <TouchableOpacity
                          onPress={() => setEventCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={eventCurrentPage === 1}
                          className={`p-2 rounded-lg ${
                            eventCurrentPage === 1 ? "bg-gray-200" : "bg-green-600"
                          }`}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={20}
                            color={eventCurrentPage === 1 ? "#9CA3AF" : "white"}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setEventCurrentPage(prev => Math.min(eventTotalPages, prev + 1))}
                          disabled={eventCurrentPage === eventTotalPages}
                          className={`p-2 rounded-lg ${
                            eventCurrentPage === eventTotalPages ? "bg-gray-200" : "bg-green-600"
                          }`}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={eventCurrentPage === eventTotalPages ? "#9CA3AF" : "white"}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
