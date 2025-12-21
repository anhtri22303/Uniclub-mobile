import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { ClubApiResponse, ClubService } from '@services/club.service';
import DisciplineService, { PenaltyRule } from '@services/discipline.service';
import MemberActivityReportService from '@services/memberActivityReport.service';
import { ApiMembership, MembershipsService } from '@services/memberships.service';
import PointRequestService from '@services/point-request.service';
import WalletService, { ClubToMemberTransaction } from '@services/wallet.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
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
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('all');
  const [historyTransactionTypeFilter, setHistoryTransactionTypeFilter] = useState<string>('all');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyPageSize] = useState(8);

  // Point request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestPoints, setRequestPoints] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Penalty modal
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyRules, setPenaltyRules] = useState<PenaltyRule[]>([]);
  const [penaltyRulesLoading, setPenaltyRulesLoading] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [isSubmittingPenalty, setIsSubmittingPenalty] = useState(false);
  const [memberToPenalize, setMemberToPenalize] = useState<ClubMember | null>(null);

  // Sync modal for activity scores
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncYear, setSyncYear] = useState(new Date().getFullYear());
  const [syncMonth, setSyncMonth] = useState(new Date().getMonth() + 1);
  const [isSyncing, setIsSyncing] = useState(false);

  // Individual scores (null = manual mode, object = sync mode)
  const [individualScores, setIndividualScores] = useState<Record<number, number> | null>(null);

  // Distribution progress
  const [distributionProgress, setDistributionProgress] = useState<{ current: number; total: number } | null>(null);

  // Get screen dimensions for responsive design
  const screenWidth = Dimensions.get('window').width;

  // Load members and wallet on mount
  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      // Only load if user exists and component is mounted
      if (isMounted && user) {
        await loadData();
      } else {
        setLoading(false);
      }
    };
    
    load();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  const loadData = async () => {
    // Don't load if no user
    if (!user) {
      setLoading(false);
      return;
    }

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

      // Load club details
      const clubResponse = await ClubService.getClubByIdFull(clubId);
      if (clubResponse.success && clubResponse.data) {
        setManagedClub(clubResponse.data);
      }

      // Load club wallet
      setWalletLoading(true);
      try {
        const walletData = await WalletService.getClubWallet(clubId);
        setClubWallet(walletData);
      } catch (walletErr) {
        console.error('Failed to load club wallet:', walletErr);
      } finally {
        setWalletLoading(false);
      }

      // Load penalty rules
      setPenaltyRulesLoading(true);
      try {
        const rules = await DisciplineService.getClubPenaltyRules(clubId);
        setPenaltyRules(rules);
      } catch (ruleErr) {
        console.error('Failed to load penalty rules:', ruleErr);
      } finally {
        setPenaltyRulesLoading(false);
      }

      // Load members using getMembersByClubId
      const members = await MembershipsService.getMembersByClubId(clubId);
      
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

  // Budget checking logic
  const currentBalance = clubWallet?.balancePoints || 0;
  const recipientCount = selectedMembersList.length;
  const currentRewardAmount = rewardAmount ? parseInt(rewardAmount) : 0;
  const totalRequired = currentRewardAmount * recipientCount;
  const isOverBudget = totalRequired > currentBalance;
  const maxPerMember = recipientCount > 0 ? Math.floor(currentBalance / recipientCount) : 0;

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

  // Get badge color for transaction type
  const getTransactionTypeBadgeColor = (type: string): { bg: string; text: string } => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      ADD: { bg: 'bg-green-100', text: 'text-green-700' },
      REDUCE: { bg: 'bg-red-100', text: 'text-red-700' },
      TRANSFER: { bg: 'bg-blue-100', text: 'text-blue-700' },
      UNI_TO_CLUB: { bg: 'bg-purple-100', text: 'text-purple-700' },
      CLUB_TO_MEMBER: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      EVENT_BUDGET_GRANT: { bg: 'bg-teal-100', text: 'text-teal-700' },
      EVENT_REFUND_REMAINING: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
      COMMIT_LOCK: { bg: 'bg-amber-100', text: 'text-amber-700' },
      REFUND_COMMIT: { bg: 'bg-lime-100', text: 'text-lime-700' },
      BONUS_REWARD: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      MEMBER_PENALTY: { bg: 'bg-red-200', text: 'text-red-800' },
      CLUB_FROM_PENALTY: { bg: 'bg-green-200', text: 'text-green-800' },
      MEMBER_REWARD: { bg: 'bg-emerald-200', text: 'text-emerald-800' },
      CLUB_REWARD_DISTRIBUTE: { bg: 'bg-teal-200', text: 'text-teal-800' },
    };
    return colorMap[type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  // Get unique transaction types
  const uniqueTransactionTypes = useMemo(() => {
    const types = new Set(transactions.map(t => t.type));
    return Array.from(types).sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by incoming/outgoing
    if (historyTypeFilter !== 'all') {
      if (historyTypeFilter === 'incoming') {
        filtered = filtered.filter(t => t.amount > 0);
      } else if (historyTypeFilter === 'outgoing') {
        filtered = filtered.filter(t => t.amount < 0);
      }
    }

    // Filter by transaction type
    if (historyTransactionTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === historyTransactionTypeFilter);
    }

    // Filter by date
    if (historyDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt);

        switch (historyDateFilter) {
          case 'today':
            return transactionDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return transactionDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return transactionDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [transactions, historyTypeFilter, historyDateFilter, historyTransactionTypeFilter]);

  // Paginate filtered transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (historyCurrentPage - 1) * historyPageSize;
    const endIndex = startIndex + historyPageSize;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, historyCurrentPage, historyPageSize]);

  const historyTotalPages = Math.ceil(filteredTransactions.length / historyPageSize);

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
    setHistoryTypeFilter('all');
    setHistoryDateFilter('all');
    setHistoryTransactionTypeFilter('all');
    setHistoryCurrentPage(1);
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

  // Sync activity scores handler
  const handleSyncActivityScores = async () => {
    if (!managedClub?.id) return;

    setIsSyncing(true);
    try {
      const activities = await MemberActivityReportService.getClubMemberActivity({
        clubId: managedClub.id,
        year: syncYear,
        month: syncMonth,
      });

      const scoreMap: Record<number, number> = {};
      const userIdsToSelect: number[] = [];
      let countZero = 0;

      activities.forEach((act) => {
        if (act.finalScore && act.finalScore > 0) {
          scoreMap[act.userId] = Math.round(act.finalScore);
          userIdsToSelect.push(act.userId);
        } else {
          countZero++;
        }
      });

      if (Object.keys(scoreMap).length === 0) {
        Toast.show({
          type: 'error',
          text1: 'No Scores Found',
          text2: countZero > 0
            ? "Members found but all have 0 points. Please 'Save' the report in the Activity page first."
            : 'No activity data found for this period.',
          visibilityTime: 4000,
          autoHide: true,
        });
        setIsSyncing(false);
        return;
      }

      setIndividualScores(scoreMap);

      // Auto-select members with scores
      setSelectedMembers((prev) => {
        const newSelected = { ...prev };
        filteredMembers.forEach((m) => {
          const uId = Number(m.userId);
          if (scoreMap[uId] !== undefined) {
            newSelected[m.id] = true;
          }
        });
        return newSelected;
      });

      Toast.show({
        type: 'success',
        text1: 'Scores Imported',
        text2: `Loaded final scores for ${Object.keys(scoreMap).length} members.`,
        visibilityTime: 3000,
        autoHide: true,
      });

      setShowSyncModal(false);
      setRewardReason(`Activity Bonus ${syncMonth}/${syncYear}`);
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Could not fetch activity history.',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear sync mode
  const handleClearSync = () => {
    setIndividualScores(null);
    setRewardAmount('');
    Toast.show({
      type: 'success',
      text1: 'Reset',
      text2: 'Switched back to manual input mode.',
      visibilityTime: 2000,
      autoHide: true,
    });
  };

  // Open penalty modal
  const handleOpenPenaltyModal = (member: ClubMember) => {
    setMemberToPenalize(member);
    setSelectedRuleId(null);
    setPenaltyReason('');
    setShowPenaltyModal(true);
  };

  // Create penalty
  const handleCreatePenalty = async () => {
    if (!selectedRuleId || !penaltyReason.trim() || !memberToPenalize || !managedClub) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please select a rule and provide a reason.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    const rule = penaltyRules.find((r) => r.id === selectedRuleId);
    if (!rule) return;

    setIsSubmittingPenalty(true);
    try {
      await DisciplineService.createClubPenalty(managedClub.id, {
        membershipId: Number(memberToPenalize.id),
        ruleId: selectedRuleId,
        reason: penaltyReason.trim(),
      });

      Toast.show({
        type: 'success',
        text1: 'Penalty Issued',
        text2: `Issued -${rule.penaltyPoints} pts to ${memberToPenalize.fullName}.`,
        visibilityTime: 3000,
        autoHide: true,
      });

      setShowPenaltyModal(false);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to issue penalty.',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setIsSubmittingPenalty(false);
    }
  };

  // Distribute rewards using batch API
  const handleDistributeRewards = async () => {
    // Validation
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

    if (clubMembers.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Notification',
        text2: 'There are no members.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    const targetUserIds = selectedMembersList.map((m) => Number(m.userId));

    if (targetUserIds.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Selection',
        text2: 'Please select at least one member.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    // CASE 1: MANUAL MODE (same points for all)
    if (!individualScores) {
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

      // Confirmation alert
      Alert.alert(
        'Confirm Distribution',
        `Distribute ${formatNumber(amount)} points to ${targetUserIds.length} selected member(s)?\n\nReason: ${rewardReason}`,
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
                const response = await WalletService.rewardPointsToMembers(
                  targetUserIds,
                  amount,
                  rewardReason.trim()
                );

                if (response.success) {
                  Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: response.message || `Distributed ${formatNumber(amount)} points to ${targetUserIds.length} member(s).`,
                    visibilityTime: 4000,
                    autoHide: true,
                  });

                  // Reset form
                  setRewardAmount('');
                  setRewardReason('');
                  setSelectedMembers({});

                  // Reload wallet balance
                  const clubId = user?.clubIds?.[0];
                  if (clubId) {
                    try {
                      const updatedWallet = await WalletService.getClubWallet(clubId);
                      setClubWallet(updatedWallet);
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
                
                Toast.show({
                  type: 'error',
                  text1: 'Distribution Failed',
                  text2: errorMessage,
                  visibilityTime: 3000,
                  autoHide: true,
                });
              } finally {
                setIsDistributing(false);
              }
            },
          },
        ]
      );
    }
    // CASE 2: SYNC MODE (individual scores for each member - batching)
    else {
      Alert.alert(
        'Confirm Distribution',
        `Distribute activity points to ${targetUserIds.length} selected member(s)?\n\nReason: ${rewardReason}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: async () => {
              setIsDistributing(true);
              setDistributionProgress({ current: 0, total: targetUserIds.length });

              let successCount = 0;
              let failCount = 0;

              for (let i = 0; i < targetUserIds.length; i++) {
                const userId = targetUserIds[i];
                const score = individualScores[userId];

                if (score && score > 0) {
                  try {
                    await WalletService.rewardPointsToMembers(
                      [userId],
                      score,
                      rewardReason.trim()
                    );
                    successCount++;
                  } catch (error) {
                    console.error(`Failed to send to user ${userId}`, error);
                    failCount++;
                  }
                }

                setDistributionProgress({ current: i + 1, total: targetUserIds.length });
              }

              setIsDistributing(false);
              setDistributionProgress(null);

              Toast.show({
                type: failCount > 0 ? 'error' : 'success',
                text1: 'Distribution Complete',
                text2: `Sent points to ${successCount} members. Failed: ${failCount}.`,
                visibilityTime: 4000,
                autoHide: true,
              });

              // Reload wallet
              const clubId = user?.clubIds?.[0];
              if (clubId) {
                try {
                  const updatedWallet = await WalletService.getClubWallet(clubId);
                  setClubWallet(updatedWallet);
                } catch (e) {
                  console.error('Failed to reload wallet:', e);
                }
              }

              // Reset if all successful
              if (failCount === 0) {
                handleClearSync();
                setSelectedMembers({});
                setRewardReason('');
              }
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
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
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      
      {/* Sidebar */}
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-white rounded-3xl p-6" style={{
          shadowColor: '#14B8A6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8
        }}>
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: '#14B8A6' }}>
              <Ionicons name="gift-outline" size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Reward Distribution</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Distribute points to {managedClub ? <Text className="font-semibold" style={{ color: '#14B8A6' }}>"{managedClub.name}"</Text> : 'your club'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Club Wallet Balance Card */}
        <View className="rounded-3xl p-6 shadow-xl mt-6 mb-4" style={{ backgroundColor: '#14B8A6' }}>
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
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
              className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Ionicons name="refresh" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Action Buttons Row */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleOpenHistoryModal}
              className="flex-1 rounded-2xl py-3 px-4 flex-row items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Ionicons name="time-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2 text-sm">History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowRequestModal(true)}
              className="flex-1 rounded-2xl py-3 px-4 flex-row items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Ionicons name="add-circle-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2 text-sm">Request</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reward Settings Card */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-4" style={{
          shadowColor: '#14B8A6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">Distribution Settings</Text>
            {/* Sync Mode Toggle Buttons */}
            {!individualScores ? (
              <TouchableOpacity
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Information',
                    text2: 'Please visit the web to view details in Member Activities Reports',
                    visibilityTime: 4000,
                    autoHide: true,
                  });
                }}
                disabled={isDistributing}
                className="rounded-xl px-3 py-2 flex-row items-center" style={{ backgroundColor: '#D1FAE5' }}
              >
                <Ionicons name="download-outline" size={16} color="#14B8A6" />
                <Text className="font-bold text-xs ml-1" style={{ color: '#14B8A6' }}>Sync</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleClearSync}
                disabled={isDistributing}
                className="bg-red-50 rounded-xl px-3 py-2 flex-row items-center"
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text className="text-red-600 font-bold text-xs ml-1">Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sync Mode Indicator */}
          {individualScores && (
            <View className="rounded-xl p-3 mb-4 border-2" style={{ backgroundColor: '#D1FAE5', borderColor: '#14B8A6' }}>
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#14B8A6' }}>
                  <Ionicons name="sync" size={20} color="white" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-bold" style={{ color: '#14B8A6' }}>
                    Activity Scores Mode
                  </Text>
                  <Text className="text-xs" style={{ color: '#059669' }}>
                    Individual points based on activity report
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Amount Input - Only show in manual mode */}
          {!individualScores && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Points per Member
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <Ionicons name="gift-outline" size={20} color="#6B7280" />
                <AppTextInput
                  className="flex-1 ml-3 text-base text-gray-800"
                  placeholder="e.g., 1,000"
                  keyboardType="numeric"
                  value={rewardAmount ? formatNumber(rewardAmount) : ''}
                  onChangeText={(text) => {
                    const unformatted = text.replace(/[^0-9]/g, '');
                    setRewardAmount(unformatted);
                  }}
                  editable={!isDistributing}
                />
              </View>
              
              {/* Budget Warning */}
              {isOverBudget && recipientCount > 0 && (
                <View className="mt-2 bg-red-50 rounded-lg p-3 border border-red-200">
                  <View className="flex-row items-start">
                    <Ionicons name="warning" size={16} color="#EF4444" />
                    <View className="flex-1 ml-2">
                      <Text className="text-xs font-bold text-red-600 mb-1">
                        Exceeds wallet balance!
                      </Text>
                      <Text className="text-xs text-red-600">
                        Max possible:{' '}
                        <Text
                          className="font-bold underline"
                          onPress={() => setRewardAmount(String(maxPerMember))}
                        >
                          {formatNumber(maxPerMember)}
                        </Text>
                        {' '}pts/member
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Budget Info */}
              {!isOverBudget && currentRewardAmount > 0 && recipientCount > 0 && (
                <View className="mt-2">
                  <Text className="text-xs text-gray-600">
                    Total: <Text className="font-bold text-gray-800">{formatNumber(totalRequired)}</Text> / {formatNumber(currentBalance)} pts
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Reason Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Reason for Distribution
            </Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <AppTextInput
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

          {/* Distribution Progress Bar */}
          {distributionProgress && (
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-gray-600">Processing transactions...</Text>
                <Text className="text-xs font-bold text-blue-600">
                  {distributionProgress.current} / {distributionProgress.total}
                </Text>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-600"
                  style={{
                    width: `${(distributionProgress.current / distributionProgress.total) * 100}%`,
                  }}
                />
              </View>
            </View>
          )}

          {/* Selected Members Info */}
          <View className="bg-blue-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700 font-medium">Selected Members:</Text>
              <Text className="text-blue-600 font-bold text-lg">
                {selectedMembersList.length}
              </Text>
            </View>
            {individualScores && (
              <Text className="text-xs text-blue-600 mt-1">
                {Object.keys(individualScores).length} members have activity scores
              </Text>
            )}
          </View>

          {/* Distribute Button */}
          <TouchableOpacity
            onPress={handleDistributeRewards}
            disabled={
              isDistributing ||
              (!individualScores && (!rewardAmount || parseInt(rewardAmount) <= 0)) ||
              !rewardReason.trim() ||
              selectedMembersList.length === 0
            }
            className="rounded-xl py-4 items-center"
            style={{
              backgroundColor: (isDistributing ||
              (!individualScores && (!rewardAmount || parseInt(rewardAmount) <= 0)) ||
              !rewardReason.trim() ||
              selectedMembersList.length === 0) ? '#D1D5DB' : '#14B8A6',
              shadowColor: '#14B8A6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4
            }}
          >
            {isDistributing ? (
              <View className="items-center">
                <ActivityIndicator color="white" />
                <Text className="text-white text-xs mt-1">
                  {individualScores ? 'Distributing batch...' : 'Processing...'}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="send" size={20} color="white" />
                <Text className="text-white font-bold ml-2">
                  {individualScores
                    ? `Distribute Activity Points to ${selectedMembersList.length} member(s)`
                    : `Distribute ${formatNumber(rewardAmount || '0')} pts to ${selectedMembersList.length} member(s)`}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-4" style={{
          shadowColor: '#14B8A6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <View className="flex-row items-center gap-2 mb-3">
            <View className="flex-1">
              <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border-2 border-gray-100" style={{
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
              className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: '#14B8A6', shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
            >
              <Ionicons name="options" size={24} color="white" />
              {hasActiveFilters && (
                <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
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
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6" style={{
          shadowColor: '#14B8A6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Members List ({filteredMembers.length})
            </Text>
            {filteredMembers.length > 0 && (
              <TouchableOpacity
                onPress={handleToggleSelectAll}
                className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}
              >
                <Text className="font-bold text-sm" style={{ color: '#14B8A6' }}>
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
                    className="mb-3 p-4 rounded-2xl border-2"
                    style={{
                      backgroundColor: isSelected ? '#D1FAE5' : '#F9FAFB',
                      borderColor: isSelected ? '#14B8A6' : 'transparent'
                    }}
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
                        {/* Penalty Button */}
                        <TouchableOpacity
                          onPress={() => handleOpenPenaltyModal(member)}
                          className="mb-2 w-8 h-8 bg-red-100 rounded-full items-center justify-center"
                        >
                          <Ionicons name="warning" size={16} color="#EF4444" />
                        </TouchableOpacity>

                        {/* Checkbox */}
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

                        {/* Points Display - Support both manual and sync modes */}
                        {isSelected && (
                          <View className="mt-2 bg-green-100 px-2 py-1 rounded-lg">
                            <Text className="text-sm text-green-700 font-bold">
                              +{formatNumber(
                                individualScores
                                  ? individualScores[Number(member.userId)] || 0
                                  : rewardAmount ? parseInt(rewardAmount) : 0
                              )} pts
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
            {/* Header */}
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
              <Text className="text-gray-600 text-sm">All wallet transactions</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="px-6 py-4">
                {/* Filters */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Filters</Text>
                  <View className="flex-row gap-2 flex-wrap">
                    {/* Type Filter */}
                    <View className="flex-1 min-w-[45%]">
                      <TouchableOpacity
                        onPress={() => {
                          const options = ['all', 'incoming', 'outgoing'];
                          const currentIndex = options.indexOf(historyTypeFilter);
                          const nextIndex = (currentIndex + 1) % options.length;
                          setHistoryTypeFilter(options[nextIndex]);
                          setHistoryCurrentPage(1);
                        }}
                        className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                      >
                        <Text className="text-xs text-gray-600 mb-1">Direction</Text>
                        <Text className="text-sm font-medium text-gray-800 capitalize">
                          {historyTypeFilter === 'all' ? 'All Types' : historyTypeFilter}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Date Filter */}
                    <View className="flex-1 min-w-[45%]">
                      <TouchableOpacity
                        onPress={() => {
                          const options = ['all', 'today', 'week', 'month', 'year'];
                          const currentIndex = options.indexOf(historyDateFilter);
                          const nextIndex = (currentIndex + 1) % options.length;
                          setHistoryDateFilter(options[nextIndex]);
                          setHistoryCurrentPage(1);
                        }}
                        className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                      >
                        <Text className="text-xs text-gray-600 mb-1">Period</Text>
                        <Text className="text-sm font-medium text-gray-800 capitalize">
                          {historyDateFilter === 'all' ? 'All Time' : 
                           historyDateFilter === 'today' ? 'Today' :
                           historyDateFilter === 'week' ? 'This Week' :
                           historyDateFilter === 'month' ? 'This Month' : 'This Year'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Transaction Type Filter - Scrollable horizontal list */}
                  {uniqueTransactionTypes.length > 0 && (
                    <View className="mt-2">
                      <Text className="text-xs text-gray-600 mb-2">Transaction Type</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => {
                            setHistoryTransactionTypeFilter('all');
                            setHistoryCurrentPage(1);
                          }}
                          className={`px-3 py-2 rounded-lg ${
                            historyTransactionTypeFilter === 'all'
                              ? 'bg-blue-600'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text className={`text-xs font-medium ${
                            historyTransactionTypeFilter === 'all' ? 'text-white' : 'text-gray-700'
                          }`}>
                            All
                          </Text>
                        </TouchableOpacity>
                        {uniqueTransactionTypes.map((type) => (
                          <TouchableOpacity
                            key={type}
                            onPress={() => {
                              setHistoryTransactionTypeFilter(type);
                              setHistoryCurrentPage(1);
                            }}
                            className={`px-3 py-2 rounded-lg ${
                              historyTransactionTypeFilter === type
                                ? 'bg-blue-600'
                                : 'bg-gray-100'
                            }`}
                          >
                            <Text className={`text-xs font-medium ${
                              historyTransactionTypeFilter === type ? 'text-white' : 'text-gray-700'
                            }`}>
                              {type.replace(/_/g, ' ')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Clear Filters */}
                  {(historyTypeFilter !== 'all' || historyDateFilter !== 'all' || historyTransactionTypeFilter !== 'all') && (
                    <TouchableOpacity
                      onPress={() => {
                        setHistoryTypeFilter('all');
                        setHistoryDateFilter('all');
                        setHistoryTransactionTypeFilter('all');
                        setHistoryCurrentPage(1);
                      }}
                      className="mt-2 flex-row items-center justify-center py-2"
                    >
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text className="text-red-600 text-sm font-medium ml-1">Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Statistics */}
                {!transactionsLoading && filteredTransactions.length > 0 && (
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Text className="text-xs text-green-600 font-medium mb-1">Total Incoming</Text>
                      <Text className="text-xl font-bold text-green-700">
                        +{formatNumber(filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0))} pts
                      </Text>
                      <Text className="text-xs text-green-600/70 mt-0.5">
                        {filteredTransactions.filter(t => t.amount > 0).length} transactions
                      </Text>
                    </View>
                    <View className="flex-1 p-3 bg-red-50 rounded-lg border border-red-200">
                      <Text className="text-xs text-red-600 font-medium mb-1">Total Outgoing</Text>
                      <Text className="text-xl font-bold text-red-700">
                        {formatNumber(filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))} pts
                      </Text>
                      <Text className="text-xs text-red-600/70 mt-0.5">
                        {filteredTransactions.filter(t => t.amount < 0).length} transactions
                      </Text>
                    </View>
                  </View>
                )}

                {/* Transaction List */}
                {transactionsLoading ? (
                  <View className="items-center py-12">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="text-gray-600 mt-4">Loading transactions...</Text>
                  </View>
                ) : filteredTransactions.length === 0 ? (
                  <View className="items-center py-12">
                    <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                    <Text className="text-xl font-semibold text-gray-800 mt-4">
                      {transactions.length === 0 ? 'No Transactions Yet' : 'No Matching Transactions'}
                    </Text>
                    <Text className="text-gray-600 mt-2 text-center">
                      {transactions.length === 0 
                        ? 'No transactions found.' 
                        : 'Try adjusting your filters'}
                    </Text>
                  </View>
                ) : (
                  <>
                    {paginatedTransactions.map((transaction) => {
                      const colorStyle = getTransactionTypeBadgeColor(transaction.type);
                      const isIncoming = transaction.amount > 0;
                      
                      return (
                        <View
                          key={transaction.id}
                          className="bg-white rounded-2xl p-4 mb-3 border border-gray-200 shadow-sm"
                        >
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center flex-1">
                              <View className={`w-10 h-10 ${isIncoming ? 'bg-green-100' : 'bg-red-100'} rounded-full items-center justify-center mr-3`}>
                                <Ionicons 
                                  name={isIncoming ? 'arrow-down' : 'arrow-up'} 
                                  size={20} 
                                  color={isIncoming ? '#10B981' : '#EF4444'} 
                                />
                              </View>
                              <View className="flex-1">
                                <View className={`px-2 py-1 rounded ${colorStyle.bg} self-start mb-1`}>
                                  <Text className={`text-xs font-medium ${colorStyle.text}`}>
                                    {transaction.type.replace(/_/g, ' ')}
                                  </Text>
                                </View>
                                <Text className="text-xs text-gray-600">
                                  ID: #{transaction.id}
                                </Text>
                              </View>
                            </View>
                            <Text className={`text-lg font-bold ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                              {isIncoming ? '+' : ''}{formatNumber(transaction.amount)} pts
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
                      );
                    })}

                    {/* Pagination */}
                    {historyTotalPages > 1 && (
                      <View className="mt-4 mb-6">
                        <Text className="text-center text-sm text-gray-600 mb-3">
                          Showing {((historyCurrentPage - 1) * historyPageSize) + 1} to {Math.min(historyCurrentPage * historyPageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
                        </Text>
                        <View className="flex-row items-center justify-center gap-2">
                          <TouchableOpacity
                            onPress={() => setHistoryCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={historyCurrentPage === 1}
                            className={`px-4 py-2 rounded-lg ${
                              historyCurrentPage === 1 ? 'bg-gray-200' : 'bg-blue-600'
                            }`}
                          >
                            <Text className={`font-semibold ${
                              historyCurrentPage === 1 ? 'text-gray-400' : 'text-white'
                            }`}>
                              Previous
                            </Text>
                          </TouchableOpacity>

                          <View className="flex-row items-center gap-2">
                            {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => {
                              let pageNum;
                              if (historyTotalPages <= 5) {
                                pageNum = i + 1;
                              } else if (historyCurrentPage <= 3) {
                                pageNum = i + 1;
                              } else if (historyCurrentPage >= historyTotalPages - 2) {
                                pageNum = historyTotalPages - 4 + i;
                              } else {
                                pageNum = historyCurrentPage - 2 + i;
                              }
                              
                              return (
                                <TouchableOpacity
                                  key={pageNum}
                                  onPress={() => setHistoryCurrentPage(pageNum)}
                                  className={`w-10 h-10 rounded-lg items-center justify-center ${
                                    historyCurrentPage === pageNum ? 'bg-blue-600' : 'bg-gray-100'
                                  }`}
                                >
                                  <Text className={`font-semibold ${
                                    historyCurrentPage === pageNum ? 'text-white' : 'text-gray-700'
                                  }`}>
                                    {pageNum}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          <TouchableOpacity
                            onPress={() => setHistoryCurrentPage(prev => Math.min(historyTotalPages, prev + 1))}
                            disabled={historyCurrentPage === historyTotalPages}
                            className={`px-4 py-2 rounded-lg ${
                              historyCurrentPage === historyTotalPages ? 'bg-gray-200' : 'bg-blue-600'
                            }`}
                          >
                            <Text className={`font-semibold ${
                              historyCurrentPage === historyTotalPages ? 'text-gray-400' : 'text-white'
                            }`}>
                              Next
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
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
                  <AppTextInput
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
                  <AppTextInput
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

      {/* Sync Activity Scores Modal */}
      <Modal
        visible={showSyncModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSyncModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-3xl w-11/12 max-w-md p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="download-outline" size={28} color="#3B82F6" />
                <Text className="text-2xl font-bold text-gray-800 ml-2">
                  Import Activity Scores
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSyncModal(false)}
                disabled={isSyncing}
              >
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#F59E0B" />
                <Text className="text-xs text-yellow-800 ml-2 flex-1">
                  Use <Text className="font-bold">Final Scores</Text> currently saved in the Activity Report.{' '}
                  If scores are 0, please go to Activity Report and click "Save".
                </Text>
              </View>
            </View>

            <View className="space-y-4">
              {/* Year Selector */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Year</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <TouchableOpacity
                        key={year}
                        onPress={() => setSyncYear(year)}
                        className={`px-4 py-2 rounded-lg ${
                          syncYear === year
                            ? 'bg-blue-600'
                            : 'bg-gray-100 border border-gray-300'
                        }`}
                      >
                        <Text
                          className={syncYear === year ? 'text-white font-bold' : 'text-gray-700'}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Month Selector */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Month</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 flex-wrap">
                    {[...Array(12)].map((_, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setSyncMonth(i + 1)}
                        className={`px-3 py-2 rounded-lg mb-2 ${
                          syncMonth === i + 1
                            ? 'bg-blue-600'
                            : 'bg-gray-100 border border-gray-300'
                        }`}
                      >
                        <Text
                          className={syncMonth === i + 1 ? 'text-white font-bold' : 'text-gray-700'}
                        >
                          {i + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setShowSyncModal(false)}
                disabled={isSyncing}
                className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSyncActivityScores}
                disabled={isSyncing}
                className={`flex-1 rounded-xl py-3 items-center ${
                  isSyncing ? 'bg-gray-300' : 'bg-blue-600'
                }`}
              >
                {isSyncing ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-bold ml-2">Loading...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="download" size={18} color="white" />
                    <Text className="text-white font-bold ml-2">Import Scores</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Penalty Modal */}
      <Modal
        visible={showPenaltyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPenaltyModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-3xl w-11/12 max-w-md p-6 shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={28} color="#EF4444" />
                <Text className="text-2xl font-bold text-gray-800 ml-2">
                  Issue Penalty
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPenaltyModal(false)}
                disabled={isSubmittingPenalty}
              >
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {memberToPenalize && (
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center mr-3 overflow-hidden">
                    {memberToPenalize.avatarUrl ? (
                      <Image
                        source={{ uri: memberToPenalize.avatarUrl }}
                        className="w-full h-full"
                      />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        {memberToPenalize.fullName.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text className="text-base font-bold text-gray-800">
                      {memberToPenalize.fullName}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {memberToPenalize.studentCode}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View className="space-y-4">
              {/* Penalty Rule Selector */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Violation Rule
                </Text>
                {penaltyRulesLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : penaltyRules.length === 0 ? (
                  <View className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                    <Text className="text-sm text-yellow-800">
                      No penalty rules available. Please contact university staff.
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 200 }} className="border border-gray-200 rounded-xl">
                    {penaltyRules.map((rule) => (
                      <TouchableOpacity
                        key={rule.id}
                        onPress={() => setSelectedRuleId(rule.id)}
                        className={`p-4 border-b border-gray-100 ${
                          selectedRuleId === rule.id ? 'bg-blue-50' : 'bg-white'
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 mr-3">
                            <Text className="text-base font-bold text-gray-800">
                              {rule.name}
                            </Text>
                            <Text className="text-sm text-gray-600 mt-1">
                              {rule.description}
                            </Text>
                            <View className="flex-row items-center mt-2">
                              <View className="px-2 py-1 bg-gray-200 rounded">
                                <Text className="text-xs font-medium text-gray-700">
                                  {rule.level}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View className="items-center">
                            <Text className="text-lg font-bold text-red-600">
                              -{rule.penaltyPoints}
                            </Text>
                            <Text className="text-xs text-gray-600">pts</Text>
                          </View>
                        </View>
                        {selectedRuleId === rule.id && (
                          <View className="absolute right-4 top-4">
                            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Reason Input */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Reason</Text>
                <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <AppTextInput
                    className="text-base text-gray-800 min-h-[80px]"
                    placeholder="Provide details about the violation..."
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={penaltyReason}
                    onChangeText={setPenaltyReason}
                    editable={!isSubmittingPenalty}
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setShowPenaltyModal(false)}
                disabled={isSubmittingPenalty}
                className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreatePenalty}
                disabled={
                  isSubmittingPenalty ||
                  !selectedRuleId ||
                  !penaltyReason.trim() ||
                  penaltyRules.length === 0
                }
                className={`flex-1 rounded-xl py-3 items-center ${
                  isSubmittingPenalty ||
                  !selectedRuleId ||
                  !penaltyReason.trim() ||
                  penaltyRules.length === 0
                    ? 'bg-gray-300'
                    : 'bg-red-600'
                }`}
              >
                {isSubmittingPenalty ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Issue Penalty</Text>
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
