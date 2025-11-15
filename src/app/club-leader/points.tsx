import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { ClubApiResponse, ClubService } from '@services/club.service';
import { ApiMembership, MembershipsService } from '@services/memberships.service';
import PointRequestService from '@services/point-request.service';
import WalletService, { ClubToMemberTransaction } from '@services/wallet.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

interface ClubMember {
  id: string;
  userId: number;
  fullName: string;
  studentCode: string;
  avatarUrl: string | null;
  role: string;
  isStaff: boolean;
}

interface ClubWallet {
  walletId: number;
  balancePoints: number;
  clubId: number;
  clubName: string;
}

export default function ClubLeaderPointsPage() {
  const { user } = useAuthStore();
  
  // State management
  const [managedClub, setManagedClub] = useState<ClubApiResponse | null>(null);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [clubWallet, setClubWallet] = useState<ClubWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardReason, setRewardReason] = useState('');
  const [isDistributing, setIsDistributing] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Transaction history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactions, setTransactions] = useState<ClubToMemberTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Point request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestPoints, setRequestPoints] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Load members and wallet on mount
  useEffect(() => {
    console.log('=== POINTS PAGE MOUNTED ===');
    console.log('User data:', JSON.stringify(user, null, 2));
    console.log('User clubIds:', user?.clubIds);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get clubId from user's clubIds array (first club)
      const clubId = user?.clubIds?.[0];
      if (!clubId) {
        const errorMsg = 'No club information found. Please ensure you are assigned to a club.';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      console.log('=== POINTS PAGE: Loading data for clubId:', clubId, '===');

      // Load club details
      const clubResponse = await ClubService.getClubByIdFull(clubId);
      if (clubResponse.success && clubResponse.data) {
        setManagedClub(clubResponse.data);
        console.log('Loaded club:', clubResponse.data.name);
      } else {
        console.warn('Failed to load club details');
      }

      // Load club wallet
      setWalletLoading(true);
      try {
        const walletData = await WalletService.getClubWallet(clubId);
        setClubWallet(walletData);
        console.log('Loaded club wallet:', walletData);
      } catch (walletErr) {
        console.error('Failed to load club wallet:', walletErr);
      } finally {
        setWalletLoading(false);
      }

      // Load members using getMembersByClubId
      const members = await MembershipsService.getMembersByClubId(clubId);
      console.log('=== POINTS PAGE: Loaded members ===');
      console.log('Total members:', members.length);
      
      // Transform to ClubMember format and filter active members only
      const transformedMembers: ClubMember[] = members
        .filter((m: ApiMembership) => m.state === 'ACTIVE')
        .map((m: ApiMembership) => ({
          id: String(m.membershipId),
          userId: m.userId,
          fullName: m.fullName ?? `User ${m.userId}`,
          studentCode: m.studentCode ?? '—',
          avatarUrl: m.avatarUrl || null,
          role: m.clubRole ?? 'MEMBER',
          isStaff: m.staff ?? false,
        }));
      
      setClubMembers(transformedMembers);
      
      // Initialize selection state
      const initialSelected: Record<string, boolean> = {};
      transformedMembers.forEach((m) => {
        initialSelected[m.id] = false;
      });
      setSelectedMembers(initialSelected);
    } catch (error: any) {
      console.error('Error loading data:', error);
      const errorMessage = error.message || 'Failed to load data';
      setError(errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        visibilityTime: 4000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };


  // Toggle member selection
  const handleToggleSelect = (memberId: string) => {
    setSelectedMembers((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  // Toggle select all filtered members
  const handleToggleSelectAll = () => {
    const newSelectionState = !allFilteredSelected;
    setSelectedMembers((prevSelected) => {
      const newSelected = { ...prevSelected };
      filteredMembers.forEach((member) => {
        newSelected[member.id] = newSelectionState;
      });
      return newSelected;
    });
  };

  // Filter members
  const filteredMembers = useMemo(() => {
    return clubMembers.filter((member) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchName = member.fullName.toLowerCase().includes(searchLower);
        const matchStudentCode = member.studentCode.toLowerCase().includes(searchLower);
        if (!matchName && !matchStudentCode) return false;
      }

      // Role filter
      if (roleFilter && roleFilter !== 'all') {
        if (member.role !== roleFilter) return false;
      }

      // Staff filter
      if (staffFilter && staffFilter !== 'all') {
        const isStaff = staffFilter === 'true';
        if (member.isStaff !== isStaff) return false;
      }

      return true;
    });
  }, [clubMembers, searchTerm, roleFilter, staffFilter]);

  // Check if all filtered members are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredMembers.length === 0) return false;
    return filteredMembers.every((member) => selectedMembers[member.id] === true);
  }, [filteredMembers, selectedMembers]);

  // Get selected members
  const selectedMembersList = useMemo(() => {
    return clubMembers.filter((m) => selectedMembers[m.id]);
  }, [clubMembers, selectedMembers]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Get unique roles for filter
  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(clubMembers.map((m) => m.role)));
  }, [clubMembers]);

  // Check if filters are active
  const hasActiveFilters = searchTerm || (roleFilter !== 'all') || (staffFilter !== 'all');

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStaffFilter('all');
    setCurrentPage(1);
  };

  // Format date for transaction history
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

  // Format number with commas
  const formatNumber = (num: number | string): string => {
    const value = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(value)) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Load transaction history
  const loadTransactionHistory = async () => {
    setTransactionsLoading(true);
    try {
      const data = await WalletService.getClubToMemberTransactions();
      setTransactions(data);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load transaction history',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Handle opening history modal
  const handleOpenHistoryModal = () => {
    setShowHistoryModal(true);
    loadTransactionHistory();
  };

  // Handle point request submission
  const handleCreatePointRequest = async () => {
    const clubId = managedClub?.id;
    if (!clubId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Club information is not loaded.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    const points = parseInt(requestPoints);
    if (!requestPoints || points <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Points',
        text2: 'Please enter a positive number of points.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    if (!requestReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Reason Required',
        text2: 'Please provide a reason for the request.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const response = await PointRequestService.createPointRequest({
        clubId,
        requestedPoints: points,
        reason: requestReason,
      });

      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: response.message || 'Your request for points has been sent to the university staff for review.',
        visibilityTime: 4000,
        autoHide: true,
      });

      // Reset form and close modal
      setShowRequestModal(false);
      setRequestPoints('');
      setRequestReason('');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to submit point request.';
      Toast.show({
        type: 'error',
        text1: 'Submission Error',
        text2: errorMessage,
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Distribute rewards using batch API
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

    if (!rewardReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Reason Required',
        text2: 'Please provide a reason for distributing points.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    if (selectedMembersList.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Members Selected',
        text2: 'Please select at least one member.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    // Confirmation alert
    Alert.alert(
      'Confirm Distribution',
      `Distribute ${formatNumber(amount)} points to ${selectedMembersList.length} selected member(s)?\n\nReason: ${rewardReason}`,
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
              // Collect all membershipIds as numbers
              const targetIds = selectedMembersList.map((member) => Number(member.id));

              // Call the batch reward API with reason
              const response = await WalletService.rewardPointsToMembers(
                targetIds,
                amount,
                rewardReason.trim()
              );

              if (response.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2:
                    response.message ||
                    `Distributed ${formatNumber(amount)} points to ${selectedMembersList.length} member(s).`,
                  visibilityTime: 4000,
                  autoHide: true,
                });

                // Reset form
                setRewardAmount('');
                setRewardReason('');
                setSelectedMembers((prev) => {
                  const newSelected = { ...prev };
                  Object.keys(newSelected).forEach((key) => {
                    newSelected[key] = false;
                  });
                  return newSelected;
                });

                // Reload wallet balance using clubId from user
                const clubId = user?.clubIds?.[0];
                if (clubId) {
                  try {
                    const updatedWallet = await WalletService.getClubWallet(clubId);
                    setClubWallet(updatedWallet);
                    console.log('Reloaded club wallet:', updatedWallet);
                  } catch (walletErr) {
                    console.error('Failed to reload club wallet:', walletErr);
                  }
                }
              } else {
                throw new Error(response.message || 'Failed to distribute points');
              }
            } catch (error: any) {
              console.error('Distribution error:', error);
              const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred while distributing points.';
              const isTimeout = error?.code === 'ECONNABORTED' || errorMessage.toLowerCase().includes('timeout');
              
              Toast.show({
                type: 'error',
                text1: isTimeout ? 'Request Timeout' : 'Distribution Failed',
                text2: isTimeout 
                  ? `The request took too long (processing ${selectedMembersList.length} members). The points may still be distributed successfully. Please check the transaction history.`
                  : errorMessage,
                visibilityTime: isTimeout ? 5000 : 3000,
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-lg font-medium mt-4 text-gray-700">Loading members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <Sidebar role={user?.role} />
        
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Failed to Load Data
          </Text>
          <Text className="text-base text-gray-600 mb-6 text-center">
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadData}
            className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center"
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Retry</Text>
          </TouchableOpacity>
        </View>
        
        <NavigationBar role={user?.role} user={user || undefined} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Sidebar */}
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center mb-2">
          <Ionicons name="trophy" size={28} color="#EAB308" />
          <Text className="text-2xl font-bold text-gray-800 ml-2">Reward Distribution</Text>
        </View>
        <Text className="text-gray-600">
          Distribute bonus points from club funds to members of{' '}
          {managedClub ? (
            <Text className="font-semibold text-blue-600">"{managedClub.name}"</Text>
          ) : (
            'your club'
          )}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Club Wallet Balance Card */}
        <View className="bg-blue-600 rounded-3xl p-6 shadow-xl mt-6 mb-4 border-2 border-blue-700">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center mr-4 border-2 border-white/30">
                <Ionicons name="wallet" size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white/90 mb-1">Club Balance</Text>
                {walletLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : clubWallet ? (
                  <Text className="text-3xl font-bold text-white">
                    {formatNumber(clubWallet.balancePoints || 0)} pts
                  </Text>
                ) : (
                  <Text className="text-3xl font-bold text-white/70">0 pts</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={async () => {
                const clubId = user?.clubIds?.[0];
                if (clubId) {
                  setWalletLoading(true);
                  try {
                    const updatedWallet = await WalletService.getClubWallet(clubId);
                    setClubWallet(updatedWallet);
                    Toast.show({
                      type: 'success',
                      text1: 'Refreshed',
                      text2: 'Wallet balance updated',
                      visibilityTime: 2000,
                      autoHide: true,
                    });
                  } catch (err) {
                    console.error('Failed to refresh wallet:', err);
                  } finally {
                    setWalletLoading(false);
                  }
                }
              }}
              disabled={walletLoading}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Ionicons name="refresh" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Action Buttons Row */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleOpenHistoryModal}
              className="flex-1 bg-white/20 rounded-xl py-3 px-4 flex-row items-center justify-center"
            >
              <Ionicons name="time-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2 text-sm">History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowRequestModal(true)}
              className="flex-1 bg-white/20 rounded-xl py-3 px-4 flex-row items-center justify-center"
            >
              <Ionicons name="add-circle-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2 text-sm">Request</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reward Settings Card */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">Distribution Settings</Text>
          
          {/* Amount Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Points per Member
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Ionicons name="gift-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="e.g., 1,000"
                keyboardType="numeric"
                value={rewardAmount ? formatNumber(rewardAmount) : ''}
                onChangeText={(text) => {
                  // Remove all non-numeric characters
                  const unformatted = text.replace(/[^0-9]/g, '');
                  setRewardAmount(unformatted);
                }}
                editable={!isDistributing}
              />
            </View>
          </View>

          {/* Reason Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Reason for Distribution
            </Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <TextInput
                className="text-base text-gray-800 min-h-[100px]"
                placeholder="e.g., Event giving, Monthly bonus, Achievement reward..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={rewardReason}
                onChangeText={setRewardReason}
                editable={!isDistributing}
              />
            </View>
          </View>

          {/* Selected Members Info */}
          <View className="bg-blue-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700 font-medium">Selected Members:</Text>
              <Text className="text-blue-600 font-bold text-lg">
                {selectedMembersList.length}
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
              !rewardReason.trim() ||
              selectedMembersList.length === 0
            }
            className={`rounded-xl py-4 items-center ${
              isDistributing ||
              !rewardAmount ||
              parseInt(rewardAmount) <= 0 ||
              !rewardReason.trim() ||
              selectedMembersList.length === 0
                ? 'bg-gray-300'
                : 'bg-blue-600'
            }`}
          >
            {isDistributing ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="send" size={20} color="white" />
                <Text className="text-white font-bold ml-2">
                  Distribute {formatNumber(rewardAmount || '0')} pts to {selectedMembersList.length} member(s)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="flex-1">
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="Search by name or student code..."
                  value={searchTerm}
                  onChangeText={(text) => {
                    setSearchTerm(text);
                    setCurrentPage(1);
                  }}
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center"
            >
              <Ionicons name="options" size={24} color="#4B5563" />
              {hasActiveFilters && (
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {(searchTerm ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0) + (staffFilter !== 'all' ? 1 : 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Filter Panel */}
          {showFilters && (
            <View className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-sm font-bold text-gray-800">Advanced Filters</Text>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearFilters}>
                    <Text className="text-xs text-blue-600 font-medium">Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Role Filter */}
              <View className="mb-3">
                <Text className="text-xs font-semibold text-gray-700 uppercase mb-2">Role</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        setRoleFilter('all');
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg ${
                        roleFilter === 'all' ? 'bg-blue-600' : 'bg-white border border-gray-300'
                      }`}
                    >
                      <Text className={roleFilter === 'all' ? 'text-white font-medium' : 'text-gray-700'}>
                        All Roles
                      </Text>
                    </TouchableOpacity>
                    {uniqueRoles.map((role) => (
                      <TouchableOpacity
                        key={role}
                        onPress={() => {
                          setRoleFilter(role);
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg ${
                          roleFilter === role ? 'bg-blue-600' : 'bg-white border border-gray-300'
                        }`}
                      >
                        <Text className={roleFilter === role ? 'text-white font-medium' : 'text-gray-700'}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Staff Filter */}
              <View>
                <Text className="text-xs font-semibold text-gray-700 uppercase mb-2">Staff Status</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      setStaffFilter('all');
                      setCurrentPage(1);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      staffFilter === 'all' ? 'bg-blue-600' : 'bg-white border border-gray-300'
                    }`}
                  >
                    <Text className={`text-center ${staffFilter === 'all' ? 'text-white font-medium' : 'text-gray-700'}`}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setStaffFilter('true');
                      setCurrentPage(1);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      staffFilter === 'true' ? 'bg-blue-600' : 'bg-white border border-gray-300'
                    }`}
                  >
                    <Text className={`text-center ${staffFilter === 'true' ? 'text-white font-medium' : 'text-gray-700'}`}>
                      Staff Only
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setStaffFilter('false');
                      setCurrentPage(1);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      staffFilter === 'false' ? 'bg-blue-600' : 'bg-white border border-gray-300'
                    }`}
                  >
                    <Text className={`text-center ${staffFilter === 'false' ? 'text-white font-medium' : 'text-gray-700'}`}>
                      Non-Staff
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Members List */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Members List ({filteredMembers.length})
            </Text>
            {filteredMembers.length > 0 && (
              <TouchableOpacity
                onPress={handleToggleSelectAll}
                className="px-4 py-2 bg-blue-50 rounded-lg"
              >
                <Text className="text-blue-600 font-medium text-sm">
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {clubMembers.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No members yet</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No members found</Text>
              <TouchableOpacity onPress={clearFilters} className="mt-3">
                <Text className="text-blue-600 font-medium">Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {paginatedMembers.map((member) => {
                const isSelected = selectedMembers[member.id] || false;
                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => handleToggleSelect(member.id)}
                    className={`mb-3 p-4 rounded-2xl border-2 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-transparent'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-3">
                        {/* Avatar */}
                        <View className="w-10 h-10 rounded-full bg-gray-300 items-center justify-center mr-3 overflow-hidden">
                          {member.avatarUrl ? (
                            <Image
                              source={{ uri: member.avatarUrl }}
                              className="w-full h-full"
                            />
                          ) : (
                            <Text className="text-white font-bold text-lg">
                              {member.fullName.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>

                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-800">
                            {member.fullName}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            {member.studentCode}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <View className="px-2 py-1 bg-gray-200 rounded">
                              <Text className="text-xs font-medium text-gray-700">
                                {member.role}
                              </Text>
                            </View>
                            {member.isStaff && (
                              <View className="px-2 py-1 bg-purple-100 rounded">
                                <Text className="text-xs font-medium text-purple-700">
                                  Staff
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      <View className="items-center">
                        <View
                          className={`w-7 h-7 rounded-full border-2 items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={18} color="white" />
                          )}
                        </View>
                        {isSelected && rewardAmount && parseInt(rewardAmount) > 0 && (
                          <View className="mt-2 bg-green-100 px-2 py-1 rounded-lg">
                            <Text className="text-sm text-green-700 font-bold">
                              +{formatNumber(rewardAmount)} pts
                            </Text>
                          </View>
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

      {/* Transaction History Modal */}
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
              <Text className="text-gray-600">Club to member transactions</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              {transactionsLoading ? (
                <View className="items-center py-12">
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="text-gray-600 mt-4">Loading transactions...</Text>
                </View>
              ) : transactions.length === 0 ? (
                <View className="items-center py-12">
                  <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                  <Text className="text-xl font-semibold text-gray-800 mt-4">
                    No Transactions Yet
                  </Text>
                  <Text className="text-gray-600 mt-2">
                    No club-to-member transactions found.
                  </Text>
                </View>
              ) : (
                transactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    className="bg-white rounded-2xl p-4 mb-3 border border-gray-200 shadow-sm"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                          <Ionicons name="arrow-up" size={20} color="#10B981" />
                        </View>
                        <View>
                          <Text className="text-base font-bold text-gray-800">
                            {transaction.type}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            ID: #{transaction.id}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-lg font-bold text-green-600">
                        +{formatNumber(transaction.amount)} pts
                      </Text>
                    </View>

                    <View className="mt-2 space-y-1">
                      {transaction.senderName && (
                        <View className="flex-row items-center">
                          <Text className="text-sm text-gray-600 w-20">From:</Text>
                          <Text className="text-sm font-medium text-purple-600">
                            {transaction.senderName}
                          </Text>
                        </View>
                      )}
                      {transaction.receiverName && (
                        <View className="flex-row items-center">
                          <Text className="text-sm text-gray-600 w-20">To:</Text>
                          <Text className="text-sm font-medium text-blue-600">
                            {transaction.receiverName}
                          </Text>
                        </View>
                      )}
                      {transaction.description && (
                        <View className="flex-row items-start">
                          <Text className="text-sm text-gray-600 w-20">Note:</Text>
                          <Text className="text-sm text-gray-700 flex-1">
                            {transaction.description}
                          </Text>
                        </View>
                      )}
                      <View className="flex-row items-center">
                        <Text className="text-sm text-gray-600 w-20">Date:</Text>
                        <Text className="text-sm text-gray-700">
                          {formatDate(transaction.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Point Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-3xl w-11/12 max-w-md p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="add-circle" size={28} color="#10B981" />
                <Text className="text-2xl font-bold text-gray-800 ml-2">
                  Request Points
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRequestModal(false)}
                disabled={isSubmittingRequest}
              >
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 mb-6">
              Submit a request to the university staff to add more points to your club's wallet.
            </Text>

            <View className="space-y-4">
              {/* Points Input */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Points Requested
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <Ionicons name="diamond-outline" size={20} color="#6B7280" />
                  <TextInput
                    className="flex-1 ml-3 text-base text-gray-800"
                    placeholder="e.g., 1,000,000"
                    keyboardType="numeric"
                    value={requestPoints ? formatNumber(requestPoints) : ''}
                    onChangeText={(text) => {
                      const unformatted = text.replace(/[^0-9]/g, '');
                      setRequestPoints(unformatted);
                    }}
                    editable={!isSubmittingRequest}
                  />
                </View>
              </View>

              {/* Reason Input */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Reason</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <TextInput
                    className="text-base text-gray-800 min-h-[100px]"
                    placeholder="e.g., Funding for 'TechSpark 2025' event prizes..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={requestReason}
                    onChangeText={setRequestReason}
                    editable={!isSubmittingRequest}
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setShowRequestModal(false)}
                disabled={isSubmittingRequest}
                className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreatePointRequest}
                disabled={
                  isSubmittingRequest ||
                  !requestPoints ||
                  parseInt(requestPoints) <= 0 ||
                  !requestReason.trim()
                }
                className={`flex-1 rounded-xl py-3 items-center ${
                  isSubmittingRequest ||
                  !requestPoints ||
                  parseInt(requestPoints) <= 0 ||
                  !requestReason.trim()
                    ? 'bg-gray-300'
                    : 'bg-green-600'
                }`}
              >
                {isSubmittingRequest ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
