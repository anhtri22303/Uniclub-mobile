import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import { ApiMembership, MembershipsService } from '@services/memberships.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Club {
  id: number;
  name: string;
  description: string;
  majorName: string;
  leaderName: string;
}

interface Member {
  id: string;
  userId: number;
  clubId: number;
  fullName: string;
  email: string;
  phone: string;
  studentCode: string;
  majorName: string;
  avatarUrl: string;
  role: string;
  isStaff: boolean;
  status: string;
  joinedAt: string;
  joinedDate: string;
}

type FilterType = 'all' | 'LEADER' | 'MEMBER' | 'staff' | 'non-staff';

export default function ClubLeaderMembersPage() {
  const { user } = useAuthStore();

  const [managedClub, setManagedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiMembers, setApiMembers] = useState<ApiMembership[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load club info and members
  useEffect(() => {
    loadInitialData();
  }, [user?.clubIds]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const clubId = user?.clubIds?.[0];
      if (!clubId) {
        throw new Error('No club found for this leader');
      }

      // Load club info
      const clubResponse = await ClubService.getClubByIdFull(clubId);
      if (clubResponse?.success && clubResponse.data) {
        setManagedClub({
          id: clubResponse.data.id,
          name: clubResponse.data.name,
          description: clubResponse.data.description || '',
          majorName: clubResponse.data.majorName || '',
          leaderName: clubResponse.data.leaderName || '',
        });

        // Load members
        setMembersLoading(true);
        setMembersError(null);
        try {
          const memberData = await MembershipsService.getMembersByClubId(clubId);
          setApiMembers(memberData);
        } catch (err: any) {
          setMembersError(err?.message || 'Failed to load members');
        } finally {
          setMembersLoading(false);
        }
      } else {
        throw new Error('Could not load club information');
      }
    } catch (error: any) {
      setMembersError(error.message);
      console.error('Error loading data:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // Transform API members to display format
  const allClubMembers: Member[] = managedClub
    ? apiMembers
        .filter(
          (m) =>
            String(m.clubId) === String(managedClub.id) && m.state === 'ACTIVE'
        )
        .map((m) => ({
          id: m.membershipId?.toString() ?? `m-${m.userId}`,
          userId: m.userId,
          clubId: m.clubId,
          fullName: m.fullName ?? `User ${m.userId}`,
          email: m.email ?? 'N/A',
          phone: m.phone ?? 'N/A',
          studentCode: m.studentCode ?? 'N/A',
          majorName: m.major ?? 'N/A',
          avatarUrl: m.avatarUrl ?? '',
          role: m.clubRole ?? 'MEMBER',
          isStaff: m.staff ?? false,
          status: m.state,
          joinedAt: m.joinedDate
            ? new Date(m.joinedDate).toLocaleDateString()
            : 'N/A',
          joinedDate: m.joinedDate || '',
        }))
    : [];

  // Apply filters
  const filteredMembers = allClubMembers.filter((member) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchName = member.fullName.toLowerCase().includes(searchLower);
      const matchEmail = member.email.toLowerCase().includes(searchLower);
      const matchStudentCode = member.studentCode
        .toLowerCase()
        .includes(searchLower);
      if (!matchName && !matchEmail && !matchStudentCode) return false;
    }

    // Role filter
    if (roleFilter === 'LEADER' && member.role !== 'LEADER') return false;
    if (roleFilter === 'MEMBER' && member.role !== 'MEMBER') return false;
    if (roleFilter === 'staff' && !member.isStaff) return false;
    if (roleFilter === 'non-staff' && member.isStaff) return false;

    return true;
  });

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    if (role === 'LEADER') return 'bg-purple-100 border-purple-300';
    return 'bg-green-100 border-green-300';
  };

  const getRoleTextColor = (role: string) => {
    if (role === 'LEADER') return 'text-purple-800';
    return 'text-green-800';
  };

  // Get border color based on role
  const getBorderColor = (member: Member) => {
    if (member.role === 'LEADER') return 'border-l-red-500';
    if (member.role === 'MEMBER' && member.isStaff) return 'border-l-blue-500';
    return 'border-l-green-500';
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-600 mt-4">Loading club information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800 mb-1">
              Club Members
            </Text>
            {managedClub ? (
              <Text className="text-gray-600 text-sm">
                Managing "{managedClub.name}"
              </Text>
            ) : (
              <Text className="text-red-600 text-sm">
                Could not load club details
              </Text>
            )}
          </View>

          {!membersLoading && allClubMembers.length > 0 && (
            <View className="bg-teal-50 rounded-xl px-4 py-3 border border-teal-200">
              <Text className="text-xs text-teal-600 uppercase tracking-wide text-center font-semibold">
                Total
              </Text>
              <Text className="text-2xl font-bold text-teal-600 text-center">
                {allClubMembers.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Search and Filter */}
      {!membersLoading && allClubMembers.length > 0 && (
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search by name, email, or student code..."
              className="flex-1 ml-2 text-base text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Toggle */}
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center justify-center bg-teal-50 rounded-xl px-4 py-3 border border-teal-200"
          >
            <Ionicons name="filter" size={18} color="#0D9488" />
            <Text className="text-teal-700 font-semibold ml-2">
              Filters {roleFilter !== 'all' ? '(1)' : ''}
            </Text>
          </TouchableOpacity>

          {/* Filter Options */}
          {showFilters && (
            <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Filter by Role
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(['all', 'LEADER', 'MEMBER', 'staff', 'non-staff'] as FilterType[]).map(
                  (filter) => (
                    <TouchableOpacity
                      key={filter}
                      onPress={() => setRoleFilter(filter)}
                      className={`px-4 py-2 rounded-lg border ${
                        roleFilter === filter
                          ? 'bg-teal-600 border-teal-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          roleFilter === filter ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {filter === 'all'
                          ? 'All'
                          : filter === 'staff'
                          ? 'Staff Only'
                          : filter === 'non-staff'
                          ? 'Non-Staff'
                          : filter}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {roleFilter !== 'all' && (
                <TouchableOpacity
                  onPress={() => setRoleFilter('all')}
                  className="mt-3 flex-row items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="#EF4444" />
                  <Text className="text-red-600 text-sm font-medium ml-1">
                    Clear Filter
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
      >
        {membersLoading ? (
          <View className="bg-white rounded-xl p-8 items-center">
            <ActivityIndicator size="large" color="#0D9488" />
            <Text className="text-gray-600 mt-4">Loading members...</Text>
          </View>
        ) : membersError ? (
          <View className="bg-red-50 rounded-xl p-8 items-center border border-red-200">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text className="text-lg font-semibold text-red-900 mt-4">
              Failed to load members
            </Text>
            <Text className="text-red-700 text-center mt-2">{membersError}</Text>
          </View>
        ) : allClubMembers.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center">
            <Ionicons name="people" size={48} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-800 mt-4">
              No Members Yet
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              Your club currently has no active members.
            </Text>
          </View>
        ) : filteredMembers.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center">
            <Ionicons name="filter" size={48} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-800 mt-4">
              No Members Found
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              No members match your current filters.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchTerm('');
                setRoleFilter('all');
              }}
              className="bg-teal-500 rounded-xl px-6 py-3 mt-4"
            >
              <Text className="text-white font-semibold">Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredMembers.map((member) => (
            <View
              key={member.id}
              className={`bg-white rounded-xl p-4 mb-3 shadow-sm border-l-4 ${getBorderColor(
                member
              )}`}
            >
              {/* Member Info */}
              <View className="flex-row items-start">
                {/* Avatar */}
                <View className="mr-3">
                  {member.avatarUrl ? (
                    <Image
                      source={{ uri: member.avatarUrl }}
                      className="w-16 h-16 rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <View className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center border-2 border-gray-200">
                      <Text className="text-white font-bold text-lg">
                        {getInitials(member.fullName)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Details */}
                <View className="flex-1">
                  {/* Name and Role */}
                  <View className="flex-row items-center mb-2 flex-wrap">
                    <Text className="text-lg font-bold text-gray-800 mr-2">
                      {member.fullName}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-full border ${getRoleBadgeColor(
                        member.role
                      )}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${getRoleTextColor(
                          member.role
                        )}`}
                      >
                        {member.role}
                      </Text>
                    </View>
                    {member.isStaff && (
                      <View className="px-2 py-1 rounded-full border bg-blue-100 border-blue-300 ml-1">
                        <Text className="text-xs font-semibold text-blue-800">
                          Staff
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Contact Info */}
                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <Ionicons name="mail" size={14} color="#3B82F6" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {member.email}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Ionicons name="person" size={14} color="#3B82F6" />
                      <Text className="text-sm text-gray-600 ml-2">
                        Student: {member.studentCode}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Ionicons name="school" size={14} color="#3B82F6" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {member.majorName}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={14} color="#3B82F6" />
                      <Text className="text-sm text-gray-600 ml-2">
                        Joined: {member.joinedAt}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
