import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { fetchClubAttendanceHistory } from '@services/attendance.service';
import { ClubService } from '@services/club.service';
import { getEventByClubId, getEventCoHostByClubId } from '@services/event.service';
import { Major, MajorService } from '@services/major.service';
import { MemberApplicationService } from '@services/memberApplication.service';
import { MembershipsService } from '@services/memberships.service';
import { ProductService } from '@services/product.service';
import { getClubRedeemOrders } from '@services/redeem.service';
import { WalletService } from '@services/wallet.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ClubInfoCard,
    CoHostEventsList,
    MembersByMajorChart,
    RecentApplicationsList,
    StatsCard,
} from './club-leader/_components';

// Helper function to check if event has expired
const isEventExpired = (event: any): boolean => {
  if (!event.date || !event.endTime) return false;

  try {
    const now = new Date();
    const [year, month, day] = event.date.split('-').map(Number);
    
    // Convert endTime to string if it's an object
    const endTimeStr = typeof event.endTime === 'string' 
      ? event.endTime 
      : `${String(event.endTime.hour).padStart(2, '0')}:${String(event.endTime.minute).padStart(2, '0')}:${String(event.endTime.second).padStart(2, '0')}`;
    
    const [hours, minutes] = endTimeStr.split(':').map(Number);
    const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    return now > eventEndDateTime;
  } catch (error) {
    console.error('Error checking event expiration:', error);
    return false;
  }
};

export default function ClubLeaderPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // State
  const [clubId, setClubId] = useState<number | null>(null);
  const [managedClub, setManagedClub] = useState<any>(null);
  const [majorInfo, setMajorInfo] = useState<Major | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [coHostEvents, setCoHostEvents] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get clubId from user
  useEffect(() => {
    if (user?.clubIds && user.clubIds.length > 0) {
      setClubId(user.clubIds[0]);
    } else {
      setClubId(null);
    }
  }, [user]);

  // Load all data
  const loadData = async () => {
    // Don't load if no user or no clubId
    if (!user || !clubId) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      const [
        clubResponse,
        membersData,
        applicationsData,
        eventsData,
        coHostEventsData,
        productsData,
        ordersData,
        walletResponse,
        transactionsData,
        attendanceData,
      ] = await Promise.all([
        ClubService.getClubByIdFull(clubId).catch(() => null),
        MembershipsService.getMembersByClubId(clubId).catch(() => []),
        MemberApplicationService.getMemberApplicationsByClubId(clubId).catch(() => []),
        getEventByClubId(clubId).catch(() => []),
        getEventCoHostByClubId(clubId).catch(() => []),
        ProductService.getProducts(clubId, { includeInactive: true, includeArchived: true }).catch(() => []),
        getClubRedeemOrders(clubId).catch(() => []),
        WalletService.getClubWallet(clubId).catch(() => null),
        WalletService.getClubToMemberTransactions().catch(() => []),
        fetchClubAttendanceHistory({ clubId, date: today }).catch(() => []),
      ]);

      if (clubResponse?.success && clubResponse.data) {
        setManagedClub(clubResponse.data);
        
        // Fetch major info if majorId exists
        if (clubResponse.data.majorId) {
          try {
            const majorData = await MajorService.fetchMajorById(clubResponse.data.majorId);
            setMajorInfo(majorData);
          } catch (error) {
            console.error('Error fetching major info:', error);
            setMajorInfo(null);
          }
        }
      }
      
      setMembers(membersData.filter((m: any) => m.state === 'ACTIVE'));
      setApplications(applicationsData);
      setEvents(eventsData);
      setCoHostEvents(coHostEventsData);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setWalletData(walletResponse);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      
      const attendance = (attendanceData as any)?.data || attendanceData || [];
      setAttendanceHistory(Array.isArray(attendance) ? attendance : []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && clubId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [clubId, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Calculate statistics
  const stats = useMemo(() => {
    // Member stats
    const totalMembers = members.length;
    const leaderCount = members.filter((m) => m.clubRole === 'LEADER' || m.clubRole === 'VICE_LEADER').length;
    const regularMembers = members.filter((m) => m.clubRole === 'MEMBER').length;
    const staffMembers = members.filter((m) => m.staff).length;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyJoined = members.filter(
      (m) => m.joinedDate && new Date(m.joinedDate) >= thirtyDaysAgo
    ).length;

    // Members by major
    const membersByMajor = members.reduce((acc: Record<string, number>, member) => {
      const major = member.major || 'Unknown';
      acc[major] = (acc[major] || 0) + 1;
      return acc;
    }, {});

    // Application stats
    const totalApplications = applications.length;
    const pendingApplications = applications.filter((a) => a.status === 'PENDING').length;
    const approvedApplications = applications.filter((a) => a.status === 'APPROVED').length;
    const rejectedApplications = applications.filter((a) => a.status === 'REJECTED').length;

    // Event stats - Updated for new statuses
    const totalApprovedEvents = events.filter((e) => e.status === 'APPROVED').length;
    const activeApprovedEvents = events.filter((e) => 
      (e.status === 'APPROVED' || e.status === 'ONGOING') && !isEventExpired(e)
    ).length;
    const ongoingEvents = events.filter((e) => e.status === 'ONGOING').length;
    const completedEvents = events.filter((e) => e.status === 'COMPLETED').length;
    const pendingEvents = events.filter((e) => 
      e.status === 'PENDING_UNISTAFF' || e.status === 'PENDING_COCLUB'
    ).length;
    const rejectedEvents = events.filter((e) => e.status === 'REJECTED').length;
    const cancelledEvents = events.filter((e) => e.status === 'CANCELLED').length;

    // Product stats
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === 'ACTIVE').length;
    const inactiveProducts = products.filter((p) => p.status === 'INACTIVE').length;
    const totalStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const totalProductValue = products.reduce((sum, p) => sum + ((p.pointCost || 0) * (p.stockQuantity || 0)), 0);

    // Order stats
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    const totalPointsRedeemed = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + (o.totalPoints || 0), 0);

    // Wallet stats
    const walletBalance = walletData?.balancePoints || 0;
    const totalTransactions = transactions.length;
    const totalPointsGiven = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgTransaction = totalTransactions > 0 ? Math.round(totalPointsGiven / totalTransactions) : 0;

    // Attendance stats
    const totalAttendanceRecords = attendanceHistory.length;

    // Co-host events filtering
    const activeCoHostEvents = coHostEvents.filter((event) => {
      if (isEventExpired(event)) return false;
      const myCoHostStatus = event.coHostedClubs?.find((club: any) => club.id === clubId)?.coHostStatus;
      return myCoHostStatus === 'PENDING' || myCoHostStatus === 'APPROVED';
    });

    // Recent applications
    const recentApplications = [...applications]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);

    return {
      totalMembers,
      leaderCount,
      regularMembers,
      staffMembers,
      recentlyJoined,
      membersByMajor,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalEvents: events.length,
      totalApprovedEvents,
      activeApprovedEvents,
      ongoingEvents,
      completedEvents,
      pendingEvents,
      rejectedEvents,
      cancelledEvents,
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalStock,
      totalProductValue,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalPointsRedeemed,
      walletBalance,
      totalTransactions,
      totalPointsGiven,
      avgTransaction,
      totalAttendanceRecords,
      activeCoHostEvents,
      recentApplications,
    };
  }, [members, applications, events, coHostEvents, products, orders, walletData, transactions, attendanceHistory, clubId]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-600 mt-4">Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />
      
      {/* Header */}
      <View className="mx-4 mt-4 mb-3 bg-white rounded-3xl p-6 shadow-lg" style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }}>
        <View className="flex-row items-center">
          <View className="bg-teal-100 p-4 rounded-2xl mr-4">
            <Text className="text-3xl">👨‍💼</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">Club Leader</Text>
            <Text className="text-sm text-gray-600 mt-1">Dashboard Overview</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
      >
        {/* Club Information */}
        <ClubInfoCard club={managedClub} majorInfo={majorInfo} isLoading={loading} />

        {/* Stats Cards Row 1 */}
        <View className="mb-4">
          <StatsCard
            title="Total Members"
            mainValue={stats.totalMembers}
            description="Total Members"
            icon="people"
            iconColor="#8B5CF6"
            borderColor="border-purple-300"
            bgColor="bg-purple-50"
            isLoading={loading}
            stats={[
              { label: 'Leaders', value: stats.leaderCount, color: '#8B5CF6' },
              { label: 'Regular Members', value: stats.regularMembers, color: '#22c55e' },
              { label: 'Staff Members', value: stats.staffMembers, color: '#3b82f6' },
              { label: 'Recently Joined (30d)', value: `+${stats.recentlyJoined}`, color: '#10b981' },
            ]}
          />
        </View>

        <View className="mb-4">
          <StatsCard
            title="Applications"
            mainValue={stats.totalApplications}
            description="Applications"
            icon="person-add"
            iconColor="#22c55e"
            borderColor="border-green-300"
            bgColor="bg-green-50"
            isLoading={loading}
            stats={[
              { label: 'Approved', value: stats.approvedApplications, color: '#22c55e' },
              { label: 'Pending Review', value: stats.pendingApplications, color: '#eab308' },
              { label: 'Rejected', value: stats.rejectedApplications, color: '#ef4444' },
              {
                label: 'Approval Rate',
                value: stats.totalApplications > 0 ? `${Math.round((stats.approvedApplications / stats.totalApplications) * 100)}%` : '0%',
                color: '#3b82f6',
              },
            ]}
          />
        </View>

        <View className="mb-4">
          <StatsCard
            title="Events Management"
            mainValue={stats.totalEvents}
            description="Total Events Created"
            icon="calendar"
            iconColor="#3b82f6"
            borderColor="border-blue-300"
            bgColor="bg-blue-50"
            isLoading={loading}
            stats={[
              { label: 'Approved', value: stats.totalApprovedEvents, color: '#22c55e' },
              { label: 'Active/Ongoing', value: stats.activeApprovedEvents, color: '#3b82f6' },
              { label: 'Completed', value: stats.completedEvents, color: '#10b981' },
              { label: 'Pending Approval', value: stats.pendingEvents, color: '#eab308' },
            ]}
          />
        </View>

        <View className="mb-4">
          <StatsCard
            title="Event Status Breakdown"
            mainValue={stats.totalApprovedEvents + stats.ongoingEvents + stats.completedEvents}
            description="Successful Events"
            icon="checkmark-circle"
            iconColor="#22c55e"
            borderColor="border-green-300"
            bgColor="bg-green-50"
            isLoading={loading}
            stats={[
              { label: '🟢 Ongoing Now', value: stats.ongoingEvents, color: '#22c55e' },
              { label: '🏁 Completed', value: stats.completedEvents, color: '#10b981' },
              { label: '  Rejected', value: stats.rejectedEvents, color: '#ef4444' },
              { label: '🚫 Cancelled', value: stats.cancelledEvents, color: '#6b7280' },
            ]}
          />
        </View>

        {/* Stats Cards Row 2 */}
        <View className="mb-4">
          <StatsCard
            title="Products/Gifts"
            mainValue={stats.totalProducts}
            description="Products/Gifts"
            icon="gift"
            iconColor="#8B5CF6"
            borderColor="border-purple-300"
            bgColor="bg-purple-50"
            isLoading={loading}
            stats={[
              { label: 'Active Products', value: stats.activeProducts, color: '#22c55e' },
              { label: 'Inactive Products', value: stats.inactiveProducts, color: '#6b7280' },
              { label: 'Total Stock', value: stats.totalStock.toLocaleString(), color: '#3b82f6' },
              { label: 'Total Value', value: `${stats.totalProductValue.toLocaleString()} pts`, color: '#8B5CF6' },
            ]}
          />
        </View>

        <View className="mb-4">
          <StatsCard
            title="Redeem Orders"
            mainValue={stats.totalOrders}
            description="Redeem Orders"
            icon="cart"
            iconColor="#f97316"
            borderColor="border-orange-300"
            bgColor="bg-orange-50"
            isLoading={loading}
            stats={[
              { label: 'Completed', value: stats.completedOrders, color: '#22c55e' },
              { label: 'Pending', value: stats.pendingOrders, color: '#eab308' },
              { label: 'Cancelled', value: stats.cancelledOrders, color: '#ef4444' },
              { label: 'Points Redeemed', value: `${stats.totalPointsRedeemed.toLocaleString()} pts`, color: '#f97316' },
            ]}
          />
        </View>

        <View className="mb-4">
          <StatsCard
            title="Wallet Balance"
            mainValue={stats.walletBalance.toLocaleString()}
            description="Wallet Balance (pts)"
            icon="wallet"
            iconColor="#06b6d4"
            borderColor="border-cyan-300"
            bgColor="bg-cyan-50"
            isLoading={loading}
            stats={[
              { label: 'Total Transactions', value: stats.totalTransactions, color: '#3b82f6' },
              { label: 'Points Given', value: stats.totalPointsGiven.toLocaleString(), color: '#22c55e' },
              { label: 'Avg Transaction', value: `${stats.avgTransaction.toLocaleString()} pts`, color: '#8B5CF6' },
              { label: 'Attendance Records', value: stats.totalAttendanceRecords, color: '#06b6d4' },
            ]}
          />
        </View>

        {/* Recent Applications and Members by Major */}
        <View className="mb-4">
          <RecentApplicationsList
            applications={stats.recentApplications}
            isLoading={loading}
          />
        </View>

        <View className="mb-4">
          <MembersByMajorChart
            membersByMajor={stats.membersByMajor}
            totalMembers={stats.totalMembers}
            isLoading={loading}
          />
        </View>

        {/* Co-Host Events */}
        <View className="mb-4">
          <CoHostEventsList
            events={stats.activeCoHostEvents}
            clubId={clubId}
            isLoading={loading}
          />
        </View>

        {/* Bottom spacing */}
        <View className="h-24" />
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
