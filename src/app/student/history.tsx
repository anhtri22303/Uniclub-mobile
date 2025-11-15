import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { useMyClubApplications, useMyMemberApplications, useMyRedeemOrders } from '@hooks/useQueryHooks';
import { Picker } from '@react-native-picker/picker';
import type { ClubApplication } from '@services/clubApplication.service';
import EventService, { type Event, type EventFeedback, timeObjectToString } from '@services/event.service';
import type { MemberApplication } from '@services/memberApplication.service';
import type { RedeemOrder } from '@services/redeem.service';
import UserService, { type ApiMembershipWallet } from '@services/user.service';
import WalletService, { type ClubToMemberTransaction } from '@services/wallet.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
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
  const [activeTab, setActiveTab] = useState<TabType>('member');
  const [filter, setFilter] = useState<string>('all');

  // Wallet state
  const [myWallet, setMyWallet] = useState<any>(null);
  const [walletTransactions, setWalletTransactions] = useState<ClubToMemberTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Event state
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Feedback state
  const [showMyFeedback, setShowMyFeedback] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | number | null>(null);
  const [myFeedbackLoading, setMyFeedbackLoading] = useState(false);
  const [myFeedbackError, setMyFeedbackError] = useState<string | null>(null);
  const [myFeedbacks, setMyFeedbacks] = useState<EventFeedback[]>([]);
  const [expandedEventKey, setExpandedEventKey] = useState<string | null>(null);
  const [myMemberships, setMyMemberships] = useState<ApiMembershipWallet[]>([]);

  // ✅ USE REACT QUERY for applications
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
      setWalletError(err?.response?.data?.message || err?.message || 'Failed to load wallet');
    } finally {
      setWalletLoading(false);
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

  // Initialize default membership when available
  useEffect(() => {
    if (!showMyFeedback) return;
    if (selectedMembershipId) return;
    if (myMemberships.length > 0) {
      setSelectedMembershipId(myMemberships[0].walletId);
    }
  }, [showMyFeedback, myMemberships, selectedMembershipId]);

  // Fetch feedbacks when toggled on and membership chosen
  useEffect(() => {
    const loadFeedbacks = async () => {
      if (!showMyFeedback || !selectedMembershipId) return;
      try {
        setMyFeedbackLoading(true);
        setMyFeedbackError(null);
        const data = await EventService.getFeedbacksByMembership(selectedMembershipId);
        setMyFeedbacks(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setMyFeedbackError(err?.response?.data?.message || err?.message || 'Failed to load feedbacks');
      } finally {
        setMyFeedbackLoading(false);
      }
    };
    loadFeedbacks();
  }, [showMyFeedback, selectedMembershipId]);

  // Group feedbacks by eventId
  const feedbackGroups = useMemo(() => {
    const groups: Record<number, { eventId: number; eventName: string; clubName: string; items: EventFeedback[] }> = {};
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

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setFilter('all');
    setShowMyFeedback(false); // Reset feedback view when changing tabs

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

    // Apply filter
    if (filter !== 'all') {
      activities = activities.filter((activity) => {
        const data = activity.data as any;
        return data.status === filter;
      });
    }

    // Sort by date descending
    return activities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [activeTab, memberApplications, clubApplications, redeemOrders, myEvents, filter]);

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
    <SafeAreaView className="flex-1 bg-gray-50">
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
                  <Text className="text-lg mr-1">📦</Text>
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

        {/* Filter and Feedback Toggle */}
        {activeTab === 'event' && (
          <View className="mb-4 flex-row items-center gap-2">
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
              <View className="flex-1">
                <View className="bg-white rounded-lg border border-gray-200">
                  <Picker
                    selectedValue={selectedMembershipId ? String(selectedMembershipId) : ''}
                    onValueChange={(val) => setSelectedMembershipId(Number(val))}
                    style={{ height: 40 }}
                  >
                    {myMemberships.map((m) => (
                      <Picker.Item
                        key={m.walletId}
                        label={`${m.clubName} (#${m.walletId})`}
                        value={String(m.walletId)}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Filter Dropdown (hidden for wallet tab and when showing feedback) */}
        {activeTab !== 'wallet' && !(activeTab === 'event' && showMyFeedback) && (
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
                <Text className="text-6xl mb-4">⚠️</Text>
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
                  <View className="flex-row items-start gap-3">
                    <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
                      <Text className="text-2xl">💰</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900 mb-1">
                        My Wallet
                      </Text>
                      <Text className="text-sm text-gray-600 mb-3">
                        {myWallet.clubName || 'Personal Wallet'}
                      </Text>
                      <View className="bg-green-50 p-3 rounded-lg mb-2">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-sm text-gray-600">Balance:</Text>
                          <Text className="text-2xl font-bold text-green-600">
                            {myWallet.points || myWallet.balancePoints || 0} pts
                          </Text>
                        </View>
                      </View>
                      <View className="bg-gray-50 p-2 rounded-lg">
                        <Text className="text-xs text-gray-600">
                          Owner Type: <Text className="font-semibold">{myWallet.ownerType}</Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Transaction History */}
                <Text className="text-lg font-bold text-gray-900 mb-3 px-1">
                  Transaction History
                </Text>
                {walletTransactions.length === 0 ? (
                  <View className="bg-white rounded-xl shadow-sm p-6 items-center">
                    <Text className="text-4xl mb-2">📋</Text>
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      No Transactions Yet
                    </Text>
                    <Text className="text-sm text-gray-500 text-center">
                      Your transaction history will appear here
                    </Text>
                  </View>
                ) : (
                  walletTransactions.map((transaction) => {
                    const isIncoming = transaction.signedAmount?.startsWith('+');
                    return (
                      <View
                        key={transaction.id}
                        className={`bg-white rounded-xl shadow-sm mb-3 border-l-4 ${
                          isIncoming ? 'border-l-green-500' : 'border-l-red-500'
                        } p-4`}
                      >
                        <View className="flex-row items-start gap-3">
                          <View
                            className={`w-10 h-10 rounded-full items-center justify-center ${
                              isIncoming ? 'bg-green-100' : 'bg-red-100'
                            }`}
                          >
                            <Text className="text-xl">
                              {isIncoming ? '⬇️' : '⬆️'}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                              <View className="bg-gray-100 px-2 py-0.5 rounded">
                                <Text className="text-xs text-gray-700">
                                  {transaction.type.replace(/_/g, ' ')}
                                </Text>
                              </View>
                              <Text
                                className={`text-lg font-bold ${
                                  isIncoming ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {transaction.signedAmount} pts
                              </Text>
                            </View>
                            <Text className="text-sm text-gray-600 mb-2">
                              {transaction.description}
                            </Text>
                            {(transaction.senderName || transaction.receiverName) && (
                              <View className="flex-row gap-3 mb-1">
                                {transaction.senderName && (
                                  <Text className="text-xs text-gray-500">
                                    From: <Text className="font-semibold">{transaction.senderName}</Text>
                                  </Text>
                                )}
                                {transaction.receiverName && (
                                  <Text className="text-xs text-gray-500">
                                    To: <Text className="font-semibold">{transaction.receiverName}</Text>
                                  </Text>
                                )}
                              </View>
                            )}
                            <Text className="text-xs text-gray-400 mt-1">
                              {formatDate(transaction.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )
          ) : activeTab === 'event' && showMyFeedback ? (
            /* Feedback View */
            myFeedbackLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-500 mt-4">Loading feedbacks...</Text>
              </View>
            ) : myFeedbackError ? (
              <View className="items-center py-20">
                <Text className="text-6xl mb-4">⚠️</Text>
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
                  You have not submitted any feedback for your events.
                </Text>
              </View>
            ) : (
              <View className="pb-4">
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
          ) : loading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 mt-4">Loading activities...</Text>
            </View>
          ) : error ? (
            <View className="items-center py-20">
              <Text className="text-6xl mb-4">⚠️</Text>
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
                  <View
                    key={index}
                    className={`bg-white rounded-xl shadow-sm mb-3 overflow-hidden border-l-4 ${getStatusColor(
                      data.status
                    )}`}
                  >
                    <View className="p-4">
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
                            {isMemberApp ? '👥' : isClubApp ? '🏢' : isEvent ? '📅' : '📦'}
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
                                📍 {data.locationName} | 🕒{' '}
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
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
