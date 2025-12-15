import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useMyClubApplications, useMyMemberApplications, useMyRedeemOrders } from '@hooks/useQueryHooks';
import { Picker } from '@react-native-picker/picker';
import type { ClubApplication } from '@services/clubApplication.service';
import EventService, { type Event, timeObjectToString } from '@services/event.service';
import EventStaffService, { type StaffHistoryOrder } from '@services/eventStaff.service';
import FeedbackService, { type Feedback } from '@services/feedback.service';
import type { MemberApplication } from '@services/memberApplication.service';
import type { OrderLog, RedeemOrder } from '@services/redeem.service';
import * as RedeemService from '@services/redeem.service';
import UserService, { type ApiMembershipWallet } from '@services/user.service';
import WalletService, { type ClubToMemberTransaction } from '@services/wallet.service';
import { useAuthStore } from '@stores/auth.store';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ActivityType = 'memberApplication' | 'clubApplication' | 'redeemOrder' | 'event';

interface Activity {
  type: ActivityType;
  date: string;
  data: MemberApplication | ClubApplication | RedeemOrder | Event;
}

type TabType = 'member' | 'club' | 'order' | 'event' | 'wallet';

export default function StudentHistoryPage() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams();
  const initialTab = (params.tab as TabType) || 'member';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [filter, setFilter] = useState<string>('all');

  // Wallet state
  const [myWallet, setMyWallet] = useState<any>(null);
  const [walletTransactions, setWalletTransactions] = useState<ClubToMemberTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletTypeFilter, setWalletTypeFilter] = useState<string>('all');
  const [walletDateFilter, setWalletDateFilter] = useState<string>('all');
  const [walletCurrentPage, setWalletCurrentPage] = useState(1);
  const [walletItemsPerPage] = useState(10);

  // Event state
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Feedback state
  const [showMyFeedback, setShowMyFeedback] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | number | null>(null);
  const [myFeedbackLoading, setMyFeedbackLoading] = useState(false);
  const [myFeedbackError, setMyFeedbackError] = useState<string | null>(null);
  const [myFeedbacks, setMyFeedbacks] = useState<Feedback[]>([]);
  const [expandedEventKey, setExpandedEventKey] = useState<string | null>(null);
  const [myMemberships, setMyMemberships] = useState<ApiMembershipWallet[]>([]);

  // Staff History state
  const [showStaffHistory, setShowStaffHistory] = useState(false);
  const [staffHistoryOrders, setStaffHistoryOrders] = useState<StaffHistoryOrder[]>([]);
  const [staffHistoryLoading, setStaffHistoryLoading] = useState(false);
  const [staffHistoryError, setStaffHistoryError] = useState<string | null>(null);

  // Order Logs Modal state
  const [selectedOrderForLogs, setSelectedOrderForLogs] = useState<RedeemOrder | null>(null);
  const [isOrderLogsModalOpen, setIsOrderLogsModalOpen] = useState(false);
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
  const [orderLogsLoading, setOrderLogsLoading] = useState(false);
  const [orderLogsError, setOrderLogsError] = useState<string | null>(null);

  // Order Product Type Filter
  const [orderProductTypeFilter, setOrderProductTypeFilter] = useState<string>('all');

  //   USE REACT QUERY for applications
  const {
    data: memberApplications = [],
    isLoading: memberLoading,
    error: memberError,
    refetch: refetchMemberApps,
  } = useMyMemberApplications();

  const {
    data: clubApplications = [],
    isLoading: clubLoading,
    error: clubError,
    refetch: refetchClubApps,
  } = useMyClubApplications();

  const {
    data: redeemOrders = [],
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchRedeemOrders,
  } = useMyRedeemOrders();

  const loading = activeTab === 'member' ? memberLoading : activeTab === 'club' ? clubLoading : activeTab === 'order' ? orderLoading : activeTab === 'event' ? eventLoading : walletLoading;
  const error = activeTab === 'member' ? memberError : activeTab === 'club' ? clubError : activeTab === 'order' ? orderError : activeTab === 'event' ? eventError : walletError;

  // Load wallet data
  const loadWalletData = async () => {
    try {
      setWalletLoading(true);
      setWalletError(null);
      
      const [walletResponse, transactionsResponse] = await Promise.all([
        WalletService.getWallet(),
        WalletService.getWalletTransactions()
      ]);
      

      
      setMyWallet(walletResponse);
      setWalletTransactions(transactionsResponse);
    } catch (err: any) {
      console.error('  Wallet loading error:', err);
      setWalletError(err?.response?.data?.message || err?.message || 'Failed to load wallet');
    } finally {
      setWalletLoading(false);
    }
  };

  // Load staff history data
  const loadStaffHistory = async () => {
    try {
      setStaffHistoryLoading(true);
      setStaffHistoryError(null);
      const data = await EventStaffService.getStaffHistory();
      setStaffHistoryOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setStaffHistoryError(err?.response?.data?.message || err?.message || 'Failed to load staff history');
    } finally {
      setStaffHistoryLoading(false);
    }
  };

  // Load events data
  const loadEventsData = async () => {
    try {
      setEventLoading(true);
      setEventError(null);
      const events = await EventService.getMyEvents();
      setMyEvents(events);
    } catch (err: any) {
      setEventError(err?.response?.data?.message || err?.message || 'Failed to load events');
    } finally {
      setEventLoading(false);
    }
  };

  // Load user profile to get memberships
  const loadMemberships = async () => {
    try {
      const profile = await UserService.fetchProfile();
      if (profile?.wallets) {
        setMyMemberships(profile.wallets);
      }
    } catch (err: any) {
      console.error('Failed to load memberships:', err);
    }
  };

  // Initialize memberships on mount
  useEffect(() => {
    loadMemberships();
  }, []);

  // Reset membership selection when toggling feedback off
  useEffect(() => {
    if (!showMyFeedback) {
      setSelectedMembershipId(null);
      setMyFeedbacks([]);
    }
  }, [showMyFeedback]);

  // Fetch feedbacks when toggled on and membership chosen
  useEffect(() => {
    const loadFeedbacks = async () => {
      if (!showMyFeedback || !selectedMembershipId) return;
      try {
        setMyFeedbackLoading(true);
        setMyFeedbackError(null);
        const data = await FeedbackService.getMyFeedbackByMembershipId(selectedMembershipId);
        setMyFeedbacks(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setMyFeedbackError(err?.response?.data?.message || err?.message || 'Failed to load feedbacks');
      } finally {
        setMyFeedbackLoading(false);
      }
    };
    loadFeedbacks();
  }, [showMyFeedback, selectedMembershipId]);

  // Fetch staff history when toggled on
  useEffect(() => {
    if (showStaffHistory) {
      loadStaffHistory();
    }
  }, [showStaffHistory]);

  // Load order logs when modal opens
  const loadOrderLogs = async (order: RedeemOrder) => {
    if (!order.membershipId) return;
    
    try {
      setOrderLogsLoading(true);
      setOrderLogsError(null);
      const logs = await RedeemService.getOrderLogsByMembershipAndOrder(
        order.membershipId,
        order.orderId
      );
      setOrderLogs(logs || []);
    } catch (err: any) {
      console.error('Failed to fetch order logs:', err);
      setOrderLogsError(err?.response?.data?.message || err?.message || 'Failed to load order logs');
      setOrderLogs([]);
    } finally {
      setOrderLogsLoading(false);
    }
  };

  // Handle order card click
  const handleOrderClick = (order: RedeemOrder) => {
    setSelectedOrderForLogs(order);
    setIsOrderLogsModalOpen(true);
    loadOrderLogs(order);
  };

  // Group feedbacks by eventId
  const feedbackGroups = useMemo(() => {
    const groups: Record<number, { eventId: number; eventName: string; clubName: string; items: Feedback[] }> = {};
    for (const fb of myFeedbacks) {
      const key = fb.eventId;
      if (!groups[key]) {
        groups[key] = { eventId: fb.eventId, eventName: fb.eventName, clubName: fb.clubName, items: [] };
      }
      groups[key].items.push(fb);
    }
    return Object.values(groups).sort((a, b) => b.eventId - a.eventId);
  }, [myFeedbacks]);

  // Pull to refresh
  const onRefresh = async () => {
    if (activeTab === 'member') {
      await refetchMemberApps();
    } else if (activeTab === 'club') {
      await refetchClubApps();
    } else if (activeTab === 'order') {
      await refetchRedeemOrders();
    } else if (activeTab === 'event') {
      await loadEventsData();
    } else if (activeTab === 'wallet') {
      await loadWalletData();
    }
  };

  // Load initial data based on query param
  useEffect(() => {
    if (initialTab === 'wallet' && !myWallet) {
      loadWalletData();
    } else if (initialTab === 'event' && myEvents.length === 0) {
      loadEventsData();
    }
  }, []);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setFilter('all');
    setOrderProductTypeFilter('all'); // Reset order product type filter
    setShowMyFeedback(false); // Reset feedback view when changing tabs
    setShowStaffHistory(false); // Reset staff history view when changing tabs

    if (tab === 'wallet' && !myWallet) {
      loadWalletData();
    } else if (tab === 'event' && myEvents.length === 0) {
      loadEventsData();
    }
  };

  // Get filter options based on active tab
  const filterOptions = useMemo(() => {
    switch (activeTab) {
      case 'member':
        return [
          { value: 'all', label: 'All Statuses' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
        ];
      case 'club':
        return [
          { value: 'all', label: 'All Statuses' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'COMPLETE', label: 'Complete' },
        ];
      case 'order':
        return [
          { value: 'all', label: 'All Statuses' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'REFUNDED', label: 'Refunded' },
          { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ];
      case 'event':
        return [
          { value: 'all', label: 'All Statuses' },
          { value: 'PENDING_UNISTAFF', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'ONGOING', label: 'Ongoing' },
          { value: 'COMPLETED', label: 'Completed' },
        ];
      default:
        return [{ value: 'all', label: 'All Statuses' }];
    }
  }, [activeTab]);

  // Prepare activities based on active tab
  const sortedActivities = useMemo(() => {
    let activities: Activity[] = [];

    if (activeTab === 'member') {
      activities = memberApplications.map((app) => ({
        type: 'memberApplication' as const,
        date: app.createdAt || new Date().toISOString(),
        data: app,
      }));
    } else if (activeTab === 'club') {
      activities = clubApplications.map((app) => ({
        type: 'clubApplication' as const,
        date: app.submittedAt || new Date().toISOString(),
        data: app,
      }));
    } else if (activeTab === 'order') {
      activities = redeemOrders.map((order) => ({
        type: 'redeemOrder' as const,
        date: order.createdAt || new Date().toISOString(),
        data: order,
      }));
    } else if (activeTab === 'event') {
      activities = myEvents.map((event) => ({
        type: 'event' as const,
        date: event.date || new Date().toISOString(),
        data: event,
      }));
    }

    // Apply status filter
    if (filter !== 'all') {
      activities = activities.filter((activity) => {
        const data = activity.data as any;
        return data.status === filter;
      });
    }

    // Apply product type filter for orders
    if (activeTab === 'order' && orderProductTypeFilter !== 'all') {
      activities = activities.filter((activity) => {
        if (activity.type === 'redeemOrder') {
          return (activity.data as RedeemOrder).productType === orderProductTypeFilter;
        }
        return true;
      });
    }

    // Sort with priority: PENDING first, then by date (newest first), then by status priority
    return activities.sort((a, b) => {
      const statusA = (a.data as any).status || 'UNKNOWN';
      const statusB = (b.data as any).status || 'UNKNOWN';
      
      // PENDING (or PENDING_UNISTAFF for events) always comes first
      const isPendingA = statusA === 'PENDING' || statusA === 'PENDING_UNISTAFF';
      const isPendingB = statusB === 'PENDING' || statusB === 'PENDING_UNISTAFF';
      
      if (isPendingA && !isPendingB) return -1;
      if (isPendingB && !isPendingA) return 1;
      
      // Both are PENDING - sort by date (newest first)
      if (isPendingA && isPendingB) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      
      // Neither is PENDING - sort by date first
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (dateA !== dateB) {
        return dateB - dateA; // Newest first
      }
      
      // Same date - prioritize APPROVED/COMPLETED over REJECTED/CANCELLED
      const isApprovedA = statusA === 'APPROVED' || statusA === 'COMPLETED';
      const isApprovedB = statusB === 'APPROVED' || statusB === 'COMPLETED';
      
      if (isApprovedA && !isApprovedB) return -1;
      if (isApprovedB && !isApprovedA) return 1;
      if (statusA === 'REJECTED' && statusB !== 'REJECTED') return 1;
      if (statusB === 'REJECTED' && statusA !== 'REJECTED') return -1;
      
      return 0;
    });
  }, [activeTab, memberApplications, clubApplications, redeemOrders, myEvents, filter, orderProductTypeFilter]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-green-500';
      case 'ONGOING':
        return 'bg-blue-500';
      case 'PENDING':
      case 'PENDING_UNISTAFF':
        return 'bg-yellow-500';
      case 'REJECTED':
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
      case 'CANCELLED':
        return 'bg-red-500';
      case 'COMPLETE':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-green-100 border-green-300';
      case 'ONGOING':
        return 'bg-blue-100 border-blue-300';
      case 'PENDING':
      case 'PENDING_UNISTAFF':
        return 'bg-yellow-100 border-yellow-300';
      case 'REJECTED':
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
      case 'CANCELLED':
        return 'bg-red-100 border-red-300';
      case 'COMPLETE':
        return 'bg-blue-100 border-blue-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  // Get status text color
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'text-green-800';
      case 'ONGOING':
        return 'text-blue-800';
      case 'PENDING':
      case 'PENDING_UNISTAFF':
        return 'text-yellow-800';
      case 'REJECTED':
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
      case 'CANCELLED':
        return 'text-red-800';
      case 'COMPLETE':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  // Filter wallet transactions
  const filteredWalletTransactions = useMemo(() => {
    let filtered = [...walletTransactions];
    
    // Filter by type
    if (walletTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === walletTypeFilter);
    }
    
    // Filter by date
    if (walletDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt);
        
        switch (walletDateFilter) {
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
  }, [walletTransactions, walletTypeFilter, walletDateFilter]);

  // Calculate wallet statistics from filtered transactions
  const walletStats = useMemo(() => {
    let totalIncoming = 0;
    let totalOutgoing = 0;
    
    filteredWalletTransactions.forEach(t => {
      const amount = parseInt(t.signedAmount?.replace(/[^0-9-]/g, '') || '0');
      if (amount > 0) {
        totalIncoming += amount;
      } else {
        totalOutgoing += Math.abs(amount);
      }
    });
    
    return {
      totalIncoming,
      totalOutgoing,
      transactionCount: filteredWalletTransactions.length
    };
  }, [filteredWalletTransactions]);

  // Paginated wallet transactions
  const paginatedWalletTransactions = useMemo(() => {
    const startIndex = (walletCurrentPage - 1) * walletItemsPerPage;
    const endIndex = startIndex + walletItemsPerPage;
    return filteredWalletTransactions.slice(startIndex, endIndex);
  }, [filteredWalletTransactions, walletCurrentPage, walletItemsPerPage]);

  const walletTotalPages = Math.ceil(filteredWalletTransactions.length / walletItemsPerPage);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-gray-900">        Activity History</Text>
          <Text className="text-sm text-gray-600 mt-1">
            Track your club applications and activities
          </Text>
        </View>

        {/* Tab Navigation */}
        <View className="mb-4 border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => handleTabChange('member')}
                className={`pb-3 px-4 ${
                  activeTab === 'member' ? 'border-b-2 border-blue-600' : ''
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-lg mr-1">👥</Text>
                  <Text
                    className={`font-semibold ${
                      activeTab === 'member' ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    Member
                  </Text>
                  {memberApplications.length > 0 && (
                    <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-bold text-blue-600">
                        {memberApplications.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleTabChange('club')}
                className={`pb-3 px-4 ${
                  activeTab === 'club' ? 'border-b-2 border-blue-600' : ''
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-lg mr-1">🏢</Text>
                  <Text
                    className={`font-semibold ${
                      activeTab === 'club' ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    Club
                  </Text>
                  {clubApplications.length > 0 && (
                    <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-bold text-blue-600">
                        {clubApplications.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleTabChange('order')}
                className={`pb-3 px-4 ${
                  activeTab === 'order' ? 'border-b-2 border-blue-600' : ''
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-lg mr-1"></Text>
                  <Text
                    className={`font-semibold ${
                      activeTab === 'order' ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    Orders
                  </Text>
                  {redeemOrders.length > 0 && (
                    <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-bold text-blue-600">
                        {redeemOrders.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleTabChange('event')}
                className={`pb-3 px-4 ${
                  activeTab === 'event' ? 'border-b-2 border-blue-600' : ''
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-lg mr-1">📅</Text>
                  <Text
                    className={`font-semibold ${
                      activeTab === 'event' ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    My Events
                  </Text>
                  {myEvents.length > 0 && (
                    <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-bold text-blue-600">
                        {myEvents.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleTabChange('wallet')}
                className={`pb-3 px-4 ${
                  activeTab === 'wallet' ? 'border-b-2 border-blue-600' : ''
                }`}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-lg mr-1">💰</Text>
                  <Text
                    className={`font-semibold ${
                      activeTab === 'wallet' ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    My Wallet
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Filter and Feedback Toggle for Events */}
        {activeTab === 'event' && (
          <View className="mb-4 gap-2">
            <TouchableOpacity
              className={`px-3 py-2 rounded-md border ${
                showMyFeedback
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200'
              }`}
              onPress={() => setShowMyFeedback(!showMyFeedback)}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">💬</Text>
                <Text
                  className={`font-semibold ${
                    showMyFeedback ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  My Feedback
                </Text>
              </View>
            </TouchableOpacity>

            {showMyFeedback && myMemberships.length > 0 && (
              <View className="bg-white rounded-lg border border-gray-200 p-2">
                <Text className="text-xs text-gray-600 mb-1 px-2">Select Club/Membership:</Text>
                <Picker
                  selectedValue={selectedMembershipId ? String(selectedMembershipId) : ''}
                  onValueChange={(val) => setSelectedMembershipId(Number(val))}
                  style={{ height: 45 }}
                >
                  <Picker.Item 
                    label="-- Select a club --" 
                    value="" 
                    enabled={false}
                  />
                  {myMemberships.map((m) => (
                    <Picker.Item
                      key={m.walletId}
                      label={`${m.clubName} (ID: ${m.walletId})`}
                      value={String(m.walletId)}
                    />
                  ))}
                </Picker>
              </View>
            )}

            {showMyFeedback && myMemberships.length === 0 && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <Text className="text-sm text-yellow-800">
                  You need to be a member of at least one club to view feedback.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Staff History Toggle for Order tab */}
        {activeTab === 'order' && (
          <View className="mb-4 gap-2">
            <TouchableOpacity
              className={`px-3 py-2 rounded-md border ${
                showStaffHistory
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200'
              }`}
              onPress={() => setShowStaffHistory(!showStaffHistory)}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">📋</Text>
                <Text
                  className={`font-semibold ${
                    showStaffHistory ? 'text-green-600' : 'text-gray-700'
                  }`}
                >
                  Staff Approval History
                </Text>
              </View>
            </TouchableOpacity>

            {/* Product Type Filter - only show when staff history is OFF */}
            {!showStaffHistory && (
              <View className="bg-white rounded-lg border border-gray-200 p-2">
                <Text className="text-xs text-gray-600 mb-1 px-2">Product Type:</Text>
                <Picker
                  selectedValue={orderProductTypeFilter}
                  onValueChange={setOrderProductTypeFilter}
                  style={{ height: 45 }}
                >
                  <Picker.Item label="All Types" value="all" />
                  <Picker.Item label="Club Item" value="CLUB_ITEM" />
                  <Picker.Item label="Event Item" value="EVENT_ITEM" />
                </Picker>
              </View>
            )}
          </View>
        )}

        {/* Filter Dropdown (hidden for wallet tab, feedback view, and staff history) */}
        {activeTab !== 'wallet' && 
         !(activeTab === 'event' && showMyFeedback) && 
         !(activeTab === 'order' && showStaffHistory) && (
          <View className="mb-4">
            <View className="bg-white rounded-lg border border-gray-200">
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-3"
                onPress={() => {
                  // Cycle through filter options
                  const currentIndex = filterOptions.findIndex(opt => opt.value === filter);
                  const nextIndex = (currentIndex + 1) % filterOptions.length;
                  setFilter(filterOptions[nextIndex].value);
                }}
              >
                <Text className="text-gray-700">
                  Filter: {filterOptions.find(opt => opt.value === filter)?.label}
                </Text>
                <Text className="text-gray-400">▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        >
          {/* Wallet Tab Content */}
          {activeTab === 'wallet' ? (
            walletLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-500 mt-4">Loading wallet...</Text>
              </View>
            ) : walletError ? (
              <View className="items-center py-20">
                <Text className="text-6xl mb-4"></Text>
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Error Loading Wallet
                </Text>
                <Text className="text-gray-500 text-center px-8">{walletError}</Text>
                <TouchableOpacity
                  onPress={onRefresh}
                  className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
                >
                  <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : !myWallet ? (
              <View className="items-center py-20">
                <Text className="text-6xl mb-4">💰</Text>
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  No Wallet Found
                </Text>
                <Text className="text-gray-500 text-center px-8">
                  Unable to load your wallet information.
                </Text>
              </View>
            ) : (
              <View className="pb-4">
                {/* Wallet Summary Card */}
                <View className="bg-white rounded-xl shadow-sm mb-4 border-l-4 border-l-green-500 p-4">
                  <View className="flex-row items-start gap-3 mb-4">
                    <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
                      <Text className="text-2xl">💰</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900 mb-1">
                        My Wallet
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {myWallet.clubName || myWallet.userFullName || 'Personal Wallet'}
                      </Text>
                    </View>
                  </View>

                  {/* Balance - Prominent Display */}
                  <View className="bg-green-50 border border-green-200 p-4 rounded-lg mb-3">
                    <Text className="text-xs text-green-600 font-semibold mb-1">Balance:</Text>
                    <Text className="text-3xl font-bold text-green-600">
                      {myWallet.points ?? myWallet.balancePoints ?? myWallet.balance ?? 0} pts
                    </Text>
                  </View>

                  {/* Additional Info Grid */}
                  <View className="gap-2">
                    <View className="bg-gray-50 p-3 rounded-lg flex-row justify-between items-center">
                      <Text className="text-xs text-gray-600">Owner Type:</Text>
                      <View className={`px-2 py-1 rounded ${
                        (myWallet.ownerType || 'USER') === 'USER' 
                          ? 'bg-blue-100 border border-blue-300' 
                          : 'bg-purple-100 border border-purple-300'
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          (myWallet.ownerType || 'USER') === 'USER' 
                            ? 'text-blue-800' 
                            : 'text-purple-800'
                        }`}>
                          {myWallet.ownerType || 'USER'}
                        </Text>
                      </View>
                    </View>

                    {myWallet.clubId && (
                      <View className="bg-gray-50 p-3 rounded-lg flex-row justify-between items-center">
                        <Text className="text-xs text-gray-600">Club ID:</Text>
                        <Text className="text-xs font-semibold text-gray-900">#{myWallet.clubId}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Transaction Overview Statistics */}
                <Text className="text-lg font-bold text-gray-900 mb-3 px-1">
                  Transaction Overview
                </Text>
                <View className="flex-row gap-2 mb-4">
                  {/* Total Incoming */}
                  <View className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-2">
                        <Text className="text-lg">⬆</Text>
                      </View>
                      <Text className="text-xs text-green-700 font-semibold">Incoming</Text>
                    </View>
                    <Text className="text-2xl font-bold text-green-600 mb-1">
                      +{walletStats.totalIncoming}
                    </Text>
                    <Text className="text-xs text-green-600">points received</Text>
                  </View>

                  {/* Total Outgoing */}
                  <View className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center mr-2">
                        <Text className="text-lg">⬇</Text>
                      </View>
                      <Text className="text-xs text-red-700 font-semibold">Outgoing</Text>
                    </View>
                    <Text className="text-2xl font-bold text-red-600 mb-1">
                      -{walletStats.totalOutgoing}
                    </Text>
                    <Text className="text-xs text-red-600">points spent</Text>
                  </View>
                </View>

                {/* Total Transactions Card */}
                <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-2">
                        <Text className="text-lg">📊</Text>
                      </View>
                      <Text className="text-sm text-blue-700 font-semibold">Total Transactions</Text>
                    </View>
                    <Text className="text-2xl font-bold text-blue-600">
                      {walletStats.transactionCount}
                    </Text>
                  </View>
                </View>

                {/* Transaction Filters */}
                <View className="mb-3">
                  <View className="flex-row gap-2 mb-2">
                    {/* Type Filter */}
                    <View className="flex-1 bg-white rounded-lg border border-gray-200">
                      <Text className="text-xs text-gray-600 px-2 pt-1">Filter by Type:</Text>
                      <Picker
                        selectedValue={walletTypeFilter}
                        onValueChange={(value) => {
                          setWalletTypeFilter(value);
                          setWalletCurrentPage(1);
                        }}
                        style={{ height: 45 }}
                      >
                        <Picker.Item label="All Types" value="all" />
                        {Array.from(new Set(walletTransactions.map(t => t.type))).sort().map((type) => (
                          <Picker.Item 
                            key={type} 
                            label={type.replace(/_/g, ' ')} 
                            value={type} 
                          />
                        ))}
                      </Picker>
                    </View>

                    {/* Date Filter */}
                    <View className="flex-1 bg-white rounded-lg border border-gray-200">
                      <Text className="text-xs text-gray-600 px-2 pt-1">Filter by Date:</Text>
                      <Picker
                        selectedValue={walletDateFilter}
                        onValueChange={(value) => {
                          setWalletDateFilter(value);
                          setWalletCurrentPage(1);
                        }}
                        style={{ height: 45 }}
                      >
                        <Picker.Item label="All Time" value="all" />
                        <Picker.Item label="Today" value="today" />
                        <Picker.Item label="This Week" value="week" />
                        <Picker.Item label="This Month" value="month" />
                        <Picker.Item label="This Year" value="year" />
                      </Picker>
                    </View>
                  </View>

                  {/* Clear Filters Button */}
                  {(walletTypeFilter !== 'all' || walletDateFilter !== 'all') && (
                    <TouchableOpacity
                      onPress={() => {
                        setWalletTypeFilter('all');
                        setWalletDateFilter('all');
                        setWalletCurrentPage(1);
                      }}
                      className="bg-gray-100 px-3 py-2 rounded-lg"
                    >
                      <Text className="text-sm text-gray-700 text-center">Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Transaction History */}
                <Text className="text-lg font-bold text-gray-900 mb-3 px-1">
                  Transaction History
                </Text>
                {filteredWalletTransactions.length === 0 ? (
                  <View className="bg-white rounded-xl shadow-sm p-6 items-center">
                    <Text className="text-4xl mb-2">📜</Text>
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      {walletTransactions.length === 0 ? 'No Transactions Yet' : 'No Matching Transactions'}
                    </Text>
                    <Text className="text-sm text-gray-500 text-center">
                      {walletTransactions.length === 0 
                        ? 'Your transaction history will appear here'
                        : 'Try adjusting your filters to see more transactions'
                      }
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Table Header */}
                    <View className="bg-gray-50 border border-gray-200 rounded-t-xl">
                      <View className="flex-row items-center p-3 border-b border-gray-200">
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-gray-700">Type</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-gray-700">Description</Text>
                        </View>
                        <View className="w-20">
                          <Text className="text-xs font-bold text-gray-700 text-right">Amount</Text>
                        </View>
                      </View>
                    </View>

                    {/* Table Body */}
                    <View className="border-l border-r border-gray-200">
                      {paginatedWalletTransactions.map((transaction, index) => {
                        const isIncoming = transaction.signedAmount?.startsWith('+');
                        const isEven = index % 2 === 0;
                        
                        return (
                          <View
                            key={transaction.id}
                            className={`border-b border-gray-200 ${isEven ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <View className="flex-row items-start p-3">
                              {/* Type Column */}
                              <View className="flex-1">
                                <View className="flex-row items-center gap-2 mb-1">
                                  <View className={`w-8 h-8 rounded-full items-center justify-center ${
                                    isIncoming ? 'bg-green-100' : 'bg-red-100'
                                  }`}>
                                    <Text className="text-base">
                                      {isIncoming ? '⬇️' : '⬆️'}
                                    </Text>
                                  </View>
                                </View>
                                <View className="bg-gray-100 px-2 py-1 rounded self-start">
                                  <Text className="text-xs text-gray-700 font-medium">
                                    {transaction.type.replace(/_/g, ' ')}
                                  </Text>
                                </View>
                              </View>

                              {/* Description Column */}
                              <View className="flex-1 px-2">
                                <Text className="text-sm text-gray-900 mb-1" numberOfLines={2}>
                                  {transaction.description}
                                </Text>
                                {/* From/To Info */}
                                {(transaction.senderName || transaction.receiverName) && (
                                  <View className="mb-1">
                                    {transaction.senderName && (
                                      <Text className="text-xs text-gray-500" numberOfLines={1}>
                                        From: <Text className="font-semibold">{transaction.senderName}</Text>
                                      </Text>
                                    )}
                                    {transaction.receiverName && (
                                      <Text className="text-xs text-gray-500" numberOfLines={1}>
                                        To: <Text className="font-semibold">{transaction.receiverName}</Text>
                                      </Text>
                                    )}
                                  </View>
                                )}
                                {/* Date */}
                                <Text className="text-xs text-gray-400">
                                  {new Date(transaction.createdAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              </View>

                              {/* Amount Column */}
                              <View className="w-20">
                                <Text className={`text-base font-bold text-right ${
                                  isIncoming ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.signedAmount}
                                </Text>
                                <Text className="text-xs text-gray-500 text-right">pts</Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Table Footer */}
                    <View className="bg-gray-50 border border-gray-200 border-t-0 rounded-b-xl p-2" />

                    {/* Wallet Pagination */}
                    {walletTotalPages > 1 && (
                      <View className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                        <View className="flex-row items-center justify-between mb-3">
                          <Text className="text-sm text-gray-600">
                            Page {walletCurrentPage} of {walletTotalPages}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            {filteredWalletTransactions.length} transaction{filteredWalletTransactions.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-center gap-2">
                          <TouchableOpacity
                            onPress={() => setWalletCurrentPage(1)}
                            disabled={walletCurrentPage === 1}
                            className={`px-3 py-2 rounded-lg ${
                              walletCurrentPage === 1 
                                ? 'bg-gray-100' 
                                : 'bg-blue-600'
                            }`}
                          >
                            <Text className={`text-sm font-semibold ${
                              walletCurrentPage === 1 
                                ? 'text-gray-400' 
                                : 'text-white'
                            }`}>
                              First
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => setWalletCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={walletCurrentPage === 1}
                            className={`px-3 py-2 rounded-lg ${
                              walletCurrentPage === 1 
                                ? 'bg-gray-100' 
                                : 'bg-blue-600'
                            }`}
                          >
                            <Text className={`text-sm font-semibold ${
                              walletCurrentPage === 1 
                                ? 'text-gray-400' 
                                : 'text-white'
                            }`}>
                              Prev
                            </Text>
                          </TouchableOpacity>
                          
                          <View className="bg-blue-100 px-4 py-2 rounded-lg">
                            <Text className="text-sm font-bold text-blue-600">
                              {walletCurrentPage}
                            </Text>
                          </View>
                          
                          <TouchableOpacity
                            onPress={() => setWalletCurrentPage(prev => Math.min(walletTotalPages, prev + 1))}
                            disabled={walletCurrentPage === walletTotalPages}
                            className={`px-3 py-2 rounded-lg ${
                              walletCurrentPage === walletTotalPages 
                                ? 'bg-gray-100' 
                                : 'bg-blue-600'
                            }`}
                          >
                            <Text className={`text-sm font-semibold ${
                              walletCurrentPage === walletTotalPages 
                                ? 'text-gray-400' 
                                : 'text-white'
                            }`}>
                              Next
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => setWalletCurrentPage(walletTotalPages)}
                            disabled={walletCurrentPage === walletTotalPages}
                            className={`px-3 py-2 rounded-lg ${
                              walletCurrentPage === walletTotalPages 
                                ? 'bg-gray-100' 
                                : 'bg-blue-600'
                            }`}
                          >
                            <Text className={`text-sm font-semibold ${
                              walletCurrentPage === walletTotalPages 
                                ? 'text-gray-400' 
                                : 'text-white'
                            }`}>
                              Last
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            )
          ) : activeTab === 'event' && showMyFeedback ? (
            /* Feedback View */
            !selectedMembershipId ? (
              <View className="items-center py-20">
                <Text className="text-6xl mb-4">👆</Text>
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Club
                </Text>
                <Text className="text-gray-500 text-center px-8">
                  Please select a club from the dropdown above to view your feedback for that club's events.
                </Text>
              </View>
            ) : myFeedbackLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-500 mt-4">Loading feedbacks...</Text>
              </View>
            ) : myFeedbackError ? (
              <View className="items-center py-20">
                <Text className="text-6xl mb-4"></Text>
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Error Loading Feedbacks
                </Text>
                <Text className="text-gray-500 text-center px-8">{myFeedbackError}</Text>
              </View>
            ) : feedbackGroups.length === 0 ? (
              <View className="items-center py-20">
                <Text className="text-6xl mb-4">💬</Text>
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  No Feedback Yet
                </Text>
                <Text className="text-gray-500 text-center px-8">
                  You have not submitted any feedback for events in this club.
                </Text>
              </View>
            ) : (
              <View className="pb-4">
                {/* Selected Club Info */}
                <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <Text className="text-xs text-blue-600 font-semibold mb-1">
                    Viewing Feedback For:
                  </Text>
                  <Text className="text-sm font-bold text-blue-900">
                    {myMemberships.find((m) => m.walletId === selectedMembershipId)?.clubName || 'Selected Club'}
                  </Text>
                  <Text className="text-xs text-blue-700 mt-1">
                    {feedbackGroups.length} event(s) with feedback
                  </Text>
                </View>

                {feedbackGroups.map((group, idx) => {
                  const cardKey = `${group.eventId}-${idx}`;
                  const expanded = expandedEventKey === cardKey;
                  return (
                    <View
                      key={cardKey}
                      className="bg-white rounded-xl shadow-sm mb-3 border-l-4 border-l-blue-500 p-4"
                    >
                      <TouchableOpacity
                        onPress={() =>
                          setExpandedEventKey((prev) => (prev === cardKey ? null : cardKey))
                        }
                        className="flex-row items-start justify-between gap-3 mb-2"
                      >
                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-900 mb-1">
                            {group.eventName}
                          </Text>
                          <Text className="text-sm text-gray-600">{group.clubName}</Text>
                          <Text className="text-xs text-gray-500 mt-1">
                            {group.items.length} feedback{group.items.length > 1 ? 's' : ''}
                          </Text>
                        </View>
                        <View className="px-2 py-1 rounded-md border border-gray-200">
                          <Text className="text-base">{expanded ? '▲' : '▼'}</Text>
                        </View>
                      </TouchableOpacity>

                      {expanded && (
                        <View className="mt-3 gap-3">
                          {group.items.map((fb) => (
                            <View key={fb.feedbackId} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                              <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-sm font-semibold text-gray-900">
                                  {fb.memberName || 'You'}
                                </Text>
                                <View className="flex-row gap-0.5">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <Text
                                      key={i}
                                      className={`text-sm ${
                                        i <= fb.rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      ⭐
                                    </Text>
                                  ))}
                                </View>
                              </View>
                              <Text className="text-sm text-gray-700 mb-2">{fb.comment}</Text>
                              <Text className="text-xs text-gray-400">
                                {formatDate(fb.createdAt)}
                                {fb.updatedAt && ` • Updated: ${new Date(fb.updatedAt).toLocaleDateString()}`}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )
          ) : activeTab === 'order' && showStaffHistory ? (
            /* Staff History View */
            staffHistoryLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="text-gray-500 mt-4">Loading staff history...</Text>
              </View>
            ) : staffHistoryError ? (
              <View className="items-center py-20">
                <Text className="text-6xl mb-4"></Text>
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Error Loading Staff History
                </Text>
                <Text className="text-gray-500 text-center px-8">{staffHistoryError}</Text>
              </View>
            ) : staffHistoryOrders.length === 0 ? (
              <View className="items-center py-20">
                <Text className="text-6xl mb-4"></Text>
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  No Staff Approval History
                </Text>
                <Text className="text-gray-500 text-center px-8">
                  You have not approved any orders as staff.
                </Text>
              </View>
            ) : (
              <View className="pb-4">
                {staffHistoryOrders.map((order) => {
                  const statusColors: Record<string, string> = {
                    PENDING: 'border-l-yellow-500',
                    COMPLETED: 'border-l-green-500',
                    REFUNDED: 'border-l-red-500',
                    PARTIALLY_REFUNDED: 'border-l-orange-500',
                    CANCELLED: 'border-l-gray-500',
                  };
                  const statusColor = statusColors[order.status] || 'border-l-gray-300';

                  return (
                    <View
                      key={order.orderId}
                      className={`bg-white rounded-xl shadow-sm mb-3 border-l-4 ${statusColor} p-4`}
                    >
                      <View className="flex-row items-start justify-between gap-3 mb-3">
                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-900 mb-1">
                            {order.productName}
                          </Text>
                          <Text className="text-sm text-gray-600">Order: {order.orderCode}</Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${getStatusBadgeColor(order.status)}`}>
                          <Text className={`text-xs font-semibold ${getStatusTextColor(order.status)}`}>
                            {order.status}
                          </Text>
                        </View>
                      </View>

                      <View className="gap-2">
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-gray-600">Member:</Text>
                          <Text className="text-sm font-semibold text-gray-900">{order.memberName}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-gray-600">Club:</Text>
                          <Text className="text-sm font-semibold text-gray-900">{order.clubName}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-gray-600">Type:</Text>
                          <Text className="text-sm font-semibold text-gray-900">{order.productType}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-gray-600">Quantity:</Text>
                          <Text className="text-sm font-semibold text-gray-900">{order.quantity}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-gray-600">Total Points:</Text>
                          <Text className="text-sm font-bold text-blue-600">{order.totalPoints} pts</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-sm text-gray-600">Created:</Text>
                          <Text className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</Text>
                        </View>
                        {order.completedAt && (
                          <View className="flex-row justify-between">
                            <Text className="text-sm text-gray-600">Completed:</Text>
                            <Text className="text-sm text-gray-900">{new Date(order.completedAt).toLocaleDateString()}</Text>
                          </View>
                        )}
                        {order.reasonRefund && (
                          <View className="pt-2 border-t border-gray-200 mt-2">
                            <Text className="text-sm text-gray-600 mb-1">Refund Reason:</Text>
                            <Text className="text-sm text-red-600">{order.reasonRefund}</Text>
                          </View>
                        )}
                        {order.errorImages && order.errorImages.length > 0 && (
                          <View className="pt-2 border-t border-gray-200 mt-2">
                            <Text className="text-sm text-gray-600 mb-1">Error Images:</Text>
                            <Text className="text-xs text-blue-600">{order.errorImages.length} image(s) attached</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )
          ) : loading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 mt-4">Loading activities...</Text>
            </View>
          ) : error ? (
            <View className="items-center py-20">
              <Text className="text-6xl mb-4"></Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Error Loading Data
              </Text>
              <Text className="text-gray-500 text-center px-8">
                {error instanceof Error ? error.message : String(error)}
              </Text>
              <TouchableOpacity
                onPress={onRefresh}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : sortedActivities.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-6xl mb-4">📜</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No Activity Yet
              </Text>
              <Text className="text-gray-500 text-center px-8">
                {activeTab === 'member'
                  ? 'Your club membership applications will appear here'
                  : activeTab === 'club'
                  ? 'Your club creation applications will appear here'
                  : activeTab === 'event'
                  ? 'Your registered events will appear here'
                  : 'Your product order history will appear here'}
              </Text>
            </View>
          ) : (
            <View className="pb-4">
              {sortedActivities.map((activity, index) => {
                const isMemberApp = activity.type === 'memberApplication';
                const isClubApp = activity.type === 'clubApplication';
                const isOrder = activity.type === 'redeemOrder';
                const isEvent = activity.type === 'event';
                const data = activity.data as any;

                return (
                  <TouchableOpacity
                    key={index}
                    className={`bg-white rounded-xl shadow-sm mb-3 overflow-hidden border-l-4 ${getStatusColor(
                      data.status
                    )}`}
                    onPress={() => {
                      if (isOrder) {
                        handleOrderClick(data as RedeemOrder);
                      }
                    }}
                    disabled={!isOrder}
                    activeOpacity={isOrder ? 0.7 : 1}
                  >
                    <View className="p-4">
                      {/* Click hint for orders */}
                      {isOrder && (
                        <View className="absolute top-2 right-2 bg-blue-100 px-2 py-1 rounded-full">
                          <Text className="text-xs text-blue-600 font-medium">Tap for details</Text>
                        </View>
                      )}
                      {/* Header */}
                      <View className="flex-row items-start mb-3">
                        {/* Icon */}
                        <View
                          className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                            isMemberApp
                              ? 'bg-blue-100'
                              : isClubApp
                              ? 'bg-indigo-100'
                              : isEvent
                              ? 'bg-emerald-100'
                              : 'bg-purple-100'
                          }`}
                        >
                          <Text className="text-2xl">
                            {isMemberApp ? '👥' : isClubApp ? '🏢' : isEvent ? '📅' : ''}
                          </Text>
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-900 mb-1">
                            {isMemberApp
                              ? 'Member Application'
                              : isClubApp
                              ? 'Club Creation Application'
                              : isEvent
                              ? data.name
                              : 'Product Order'}
                          </Text>

                          {isMemberApp ? (
                            <Text className="text-sm text-gray-600">
                              Applied to: {data.clubName || `Club ${data.clubId}`}
                            </Text>
                          ) : isClubApp ? (
                            <>
                              <Text className="text-sm text-gray-600 mb-1">
                                Club: {data.clubName}
                              </Text>
                              {data.majorName && (
                                <Text className="text-xs text-gray-500">
                                  Major: {data.majorName}
                                </Text>
                              )}
                            </>
                          ) : isEvent ? (
                            <>
                              <Text className="text-sm text-gray-600">
                                Host: {data.hostClub?.name || 'Unknown Club'}
                              </Text>
                              <Text className="text-xs text-gray-500 mt-1">
                                 {data.locationName} | 🕒{' '}
                                {timeObjectToString(data.startTime)} -{' '}
                                {timeObjectToString(data.endTime)}
                              </Text>
                              <Text className="text-sm font-semibold text-emerald-600 mt-1">
                                Commit points: {data.commitPointCost} points
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text className="text-sm text-gray-600 mb-1">
                                Product: {data.productName}
                              </Text>
                              <Text className="text-sm text-gray-600">
                                Quantity: {data.quantity}
                              </Text>
                              <Text className="text-sm font-medium text-blue-600 mt-1">
                                Total Points: {data.totalPoints}
                              </Text>
                            </>
                          )}
                        </View>

                        {/* Status Badge */}
                        <View
                          className={`px-3 py-1 rounded-full border ${getStatusBadgeColor(
                            data.status
                          )}`}
                        >
                          <Text
                            className={`text-xs font-semibold ${getStatusTextColor(
                              data.status
                            )}`}
                          >
                            {data.status}
                          </Text>
                        </View>
                      </View>

                      {/* Description/Reason/Message */}
                      {(data.message || data.reason || data.description || data.vision || data.orderCode || data.clubName) && !isOrder && !isEvent && (
                        <View className="bg-gray-50 p-3 rounded-lg mb-3">
                          {data.description && (
                            <Text className="text-sm text-gray-700 mb-2">
                              {data.description}
                            </Text>
                          )}
                          {data.vision && (
                            <Text className="text-sm text-gray-700 mb-2">
                              Vision: {data.vision}
                            </Text>
                          )}
                          {(data.message || data.reason) && (
                            <Text className="text-sm text-gray-700">
                              {data.message || data.reason}
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Event Details */}
                      {isEvent && data.description && (
                        <View className="bg-gray-50 p-3 rounded-lg mb-3">
                          <Text className="text-sm text-gray-700 mb-2">
                            {data.description}
                          </Text>
                          {data.coHostedClubs && data.coHostedClubs.length > 0 && (
                            <Text className="text-xs text-gray-600 mt-1">
                              Co-hosts: {data.coHostedClubs.map((c: any) => c.name).join(', ')}
                            </Text>
                          )}
                          <Text className="text-xs text-gray-600 mt-1">
                            Event Type: {data.type}
                          </Text>
                        </View>
                      )}

                      {/* Order Details */}
                      {isOrder && (
                        <View className="bg-gray-50 p-3 rounded-lg mb-3">
                          <Text className="text-sm text-gray-700 mb-1">
                            Order Code: <Text className="font-medium">{data.orderCode}</Text>
                          </Text>
                          <Text className="text-xs text-gray-600 mb-1">
                            From: {data.clubName}
                          </Text>
                          {data.productType && (
                            <Text className="text-xs text-gray-600">
                              Type: {data.productType}
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Reject Reason */}
                      {data.status === 'REJECTED' && data.rejectReason && (
                        <View className="bg-red-50 p-3 rounded-lg mb-3">
                          <Text className="text-xs font-semibold text-red-800 mb-1">
                            Reject Reason:
                          </Text>
                          <Text className="text-sm text-red-700">
                            {data.rejectReason}
                          </Text>
                        </View>
                      )}

                      {/* Refund Reason */}
                      {(data.status === 'REFUNDED' || data.status === 'PARTIALLY_REFUNDED') && data.reasonRefund && (
                        <View className="bg-red-50 p-3 rounded-lg mb-3">
                          <Text className="text-xs font-semibold text-red-800 mb-1">
                            Refund Reason:
                          </Text>
                          <Text className="text-sm text-red-700">
                            {data.reasonRefund}
                          </Text>
                        </View>
                      )}

                      {/* Refund Images */}
                      {isOrder && data.refundImages && data.refundImages.length > 0 && (
                        <View className="bg-gray-50 p-3 rounded-lg mb-3">
                          <Text className="text-xs font-semibold text-gray-700 mb-2">
                            Error Images:
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2">
                              {data.refundImages.map((img: string, idx: number) => (
                                <Image
                                  key={idx}
                                  source={{ uri: img }}
                                  className="w-20 h-20 rounded-lg"
                                  resizeMode="cover"
                                />
                              ))}
                            </View>
                          </ScrollView>
                        </View>
                      )}

                      {/* Reviewed By */}
                      {(data.handledByName || (data.reviewedBy && typeof data.reviewedBy === 'object' && data.reviewedBy.fullName)) && (
                        <Text className="text-xs text-gray-500 mb-2">
                          Reviewed by: {data.handledByName || (typeof data.reviewedBy === 'object' ? data.reviewedBy.fullName : '')}
                        </Text>
                      )}

                      {/* Date */}
                      <View className="flex-row items-center">
                        <Text className="text-gray-400 mr-1">📅</Text>
                        <Text className="text-xs text-gray-500">
                          {formatDate(activity.date)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <NavigationBar role={user?.role} user={user || undefined} />

      {/* Order Logs Modal */}
      <Modal
        visible={isOrderLogsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOrderLogsModalOpen(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20">
            <View className="flex-1 bg-white rounded-t-3xl">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-900">Order Logs</Text>
                <TouchableOpacity
                  onPress={() => setIsOrderLogsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView className="flex-1 p-4" nestedScrollEnabled>
                {selectedOrderForLogs && (
                  <View className="bg-blue-50 p-4 rounded-xl mb-4">
                    <Text className="text-sm font-semibold text-blue-900 mb-1">
                      {selectedOrderForLogs.productName}
                    </Text>
                    <Text className="text-xs text-blue-700">
                      Order Code: {selectedOrderForLogs.orderCode}
                    </Text>
                    <Text className="text-xs text-blue-700">
                      Quantity: {selectedOrderForLogs.quantity} | Points: {selectedOrderForLogs.totalPoints}
                    </Text>
                  </View>
                )}

                {orderLogsLoading ? (
                  <View className="items-center py-8">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="text-sm text-gray-500 mt-2">Loading logs...</Text>
                  </View>
                ) : orderLogsError ? (
                  <View className="items-center py-8">
                    <Text className="text-red-600 text-sm">{orderLogsError}</Text>
                  </View>
                ) : orderLogs.length === 0 ? (
                  <View className="items-center py-8">
                    <Text className="text-gray-500 text-sm">No logs found for this order</Text>
                  </View>
                ) : (
                  <View className="gap-3">
                    {orderLogs.map((log) => {
                      const isPositive = log.pointsChange > 0;
                      const actionColors = {
                        CREATE: 'bg-blue-100 text-blue-800',
                        COMPLETED: 'bg-green-100 text-green-800',
                        REFUND: 'bg-red-100 text-red-800',
                        PARTIAL_REFUND: 'bg-orange-100 text-orange-800',
                      };
                      const actionColor = actionColors[log.action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800';

                      return (
                        <View key={log.id} className="bg-white border border-gray-200 rounded-xl p-4">
                          {/* Action Badge and Date */}
                          <View className="flex-row items-center justify-between mb-3">
                            <View className={`px-3 py-1 rounded-full ${actionColor.split(' ')[0]}`}>
                              <Text className={`text-xs font-bold ${actionColor.split(' ')[1]}`}>
                                {log.action}
                              </Text>
                            </View>
                            <Text className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </Text>
                          </View>

                          {/* Actor and Target Info */}
                          <View className="gap-2 mb-2">
                            <View className="flex-row">
                              <Text className="text-xs text-gray-500 w-24">Actor:</Text>
                              <Text className="text-xs text-gray-900 font-medium flex-1">
                                {log.actorName}
                              </Text>
                            </View>
                            <View className="flex-row">
                              <Text className="text-xs text-gray-500 w-24">Target:</Text>
                              <Text className="text-xs text-gray-900 font-medium flex-1">
                                {log.targetUserName}
                              </Text>
                            </View>
                          </View>

                          {/* Order Details */}
                          <View className="flex-row border-t border-gray-100 pt-2 mt-2">
                            <View className="flex-1">
                              <Text className="text-xs text-gray-500">Quantity</Text>
                              <Text className="text-sm font-semibold text-gray-900">
                                {log.quantity}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs text-gray-500">Points Change</Text>
                              <Text className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : ''}{log.pointsChange}
                              </Text>
                            </View>
                          </View>

                          {/* Reason */}
                          {log.reason && (
                            <View className="border-t border-gray-100 pt-2 mt-2">
                              <Text className="text-xs text-gray-500 mb-1">Reason:</Text>
                              <Text className="text-sm text-gray-700">{log.reason}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
