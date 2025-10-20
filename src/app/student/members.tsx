import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import { MembershipsService, type ApiMembership } from '@services/memberships.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
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
  majorPolicyName: string;
  majorName: string;
  leaderName: string;
}

interface Member {
  id: number;
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
  joinedDate?: string;
}

export default function StudentMembersPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Club selection
  const [userClubIds, setUserClubIds] = useState<number[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [userClubsDetails, setUserClubsDetails] = useState<Club[]>([]);
  const [showClubPicker, setShowClubPicker] = useState(false);

  // Members data
  const [apiMembers, setApiMembers] = useState<ApiMembership[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'leader' | 'staff' | 'member'>('all');

  // Get user's club IDs from memberships
  useEffect(() => {
    const loadUserClubs = async () => {
      try {
        // Get club IDs from user's clubIds property
        const clubIds = user?.clubIds || [];
        
        console.log('User club IDs:', clubIds);
        setUserClubIds(clubIds);
        
        // Set first club as default
        if (clubIds.length > 0) {
          setSelectedClubId(clubIds[0]);
        }
      } catch (error) {
        console.error('Failed to get club IDs:', error);
      }
    };
    
    loadUserClubs();
  }, [user]);

  // Load club details for dropdown
  useEffect(() => {
    if (userClubIds.length === 0) return;
    
    const loadClubsDetails = async () => {
      try {
        const clubsPromises = userClubIds.map((clubId) => ClubService.getClubByIdFull(clubId));
        const clubsResponses = await Promise.all(clubsPromises);
        
        const validClubs = clubsResponses
          .filter((res) => res?.success && res?.data)
          .map((res) => ({
            id: res.data.id,
            name: res.data.name,
            description: res.data.description || '',
            majorPolicyName: res.data.majorPolicyName || '',
            majorName: res.data.majorName || '',
            leaderName: res.data.leaderName || '',
          }));
        
        console.log('Loaded clubs details:', validClubs);
        setUserClubsDetails(validClubs);
      } catch (err) {
        console.error('Failed to load clubs details:', err);
      }
    };
    
    loadClubsDetails();
  }, [userClubIds]);

  // Load club and members when selectedClubId changes
  useEffect(() => {
    if (!selectedClubId) return;

    const loadClubData = async () => {
      setLoading(true);
      setMembersLoading(true);
      try {
        // Load club details
        const clubResponse = await ClubService.getClubByIdFull(selectedClubId);
        if (clubResponse && clubResponse.success && clubResponse.data) {
          setSelectedClub({
            id: clubResponse.data.id,
            name: clubResponse.data.name,
            description: clubResponse.data.description || '',
            majorPolicyName: clubResponse.data.majorPolicyName || '',
            majorName: clubResponse.data.majorName || '',
            leaderName: clubResponse.data.leaderName || '',
          });
        }
        
        // Load members
        const membersData = await MembershipsService.getMembersByClubId(selectedClubId);
        console.log('Loaded members:', membersData);
        setApiMembers(membersData);
      } catch (err: any) {
        console.error('Failed to load club data:', err);
        Alert.alert('Error', err?.message || 'Could not load club information');
      } finally {
        setLoading(false);
        setMembersLoading(false);
      }
    };

    loadClubData();
  }, [selectedClubId]);

  // Format and filter members
  useEffect(() => {
    if (!selectedClubId) {
      setFilteredMembers([]);
      return;
    }

    const allMembers = apiMembers
      .filter((m) => String(m.clubId) === String(selectedClubId) && m.state === 'ACTIVE')
      .map((m) => ({
        id: m.membershipId ?? `m-${m.userId}`,
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
        joinedAt: m.joinedDate ? new Date(m.joinedDate).toLocaleDateString() : 'N/A',
        joinedDate: m.joinedDate,
      }));

    // Apply search filter
    let filtered = allMembers.filter((member) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchName = member.fullName.toLowerCase().includes(searchLower);
        const matchEmail = member.email.toLowerCase().includes(searchLower);
        const matchStudentCode = member.studentCode.toLowerCase().includes(searchLower);
        return matchName || matchEmail || matchStudentCode;
      }
      return true;
    });

    // Apply role filter
    if (activeFilter === 'leader') {
      filtered = filtered.filter((m) => m.role === 'LEADER');
    } else if (activeFilter === 'staff') {
      filtered = filtered.filter((m) => m.isStaff);
    } else if (activeFilter === 'member') {
      filtered = filtered.filter((m) => m.role === 'MEMBER' && !m.isStaff);
    }

    setFilteredMembers(filtered);
  }, [apiMembers, selectedClubId, searchTerm, activeFilter]);

  // Refresh handler
  const onRefresh = async () => {
    if (!selectedClubId) return;
    
    setRefreshing(true);
    try {
      const membersData = await MembershipsService.getMembersByClubId(selectedClubId);
      setApiMembers(membersData);
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string, isStaff: boolean) => {
    if (role === 'LEADER') return 'bg-purple-500';
    if (isStaff) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-6 py-4 space-y-4">
          {/* Club Selector */}
          {userClubIds.length > 0 && (
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Select Club</Text>
              <TouchableOpacity
                onPress={() => setShowClubPicker(!showClubPicker)}
                className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200"
              >
                <View className="flex-1">
                  {selectedClub ? (
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 font-semibold flex-1">{selectedClub.name}</Text>
                      <View className="bg-indigo-100 px-2 py-1 rounded-md">
                        <Text className="text-indigo-700 text-xs font-bold">ID: {selectedClub.id}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text className="text-gray-400">Choose a club</Text>
                  )}
                </View>
                <Ionicons
                  name={showClubPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {/* Club picker dropdown */}
              {showClubPicker && (
                <View className="mt-2 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                  {userClubsDetails.map((club, index) => (
                    <TouchableOpacity
                      key={club.id}
                      onPress={() => {
                        setSelectedClubId(club.id);
                        setShowClubPicker(false);
                      }}
                      className={`flex-row items-center justify-between p-3 ${
                        index !== userClubsDetails.length - 1 ? 'border-b border-gray-200' : ''
                      } ${selectedClubId === club.id ? 'bg-indigo-50' : ''}`}
                    >
                      <Text
                        className={`flex-1 font-medium ${
                          selectedClubId === club.id ? 'text-indigo-700' : 'text-gray-700'
                        }`}
                      >
                        {club.name}
                      </Text>
                      {selectedClubId === club.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {userClubIds.length > 1 && (
                <Text className="text-xs text-gray-500 mt-2">
                  {userClubIds.length} clubs available
                </Text>
              )}
            </View>
          )}

          {/* Search and Filters */}
          {!membersLoading && apiMembers.length > 0 && selectedClubId && (
            <View className="space-y-3">
              {/* Search Bar */}
              <View className="bg-white rounded-2xl px-4 py-3 shadow-sm flex-row items-center">
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Search by name, email, or student code..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  className="flex-1 ml-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
                {searchTerm !== '' && (
                  <TouchableOpacity onPress={() => setSearchTerm('')}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Buttons */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-xl ${
                    activeFilter === 'all' ? 'bg-indigo-500' : 'bg-white border border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm ${
                      activeFilter === 'all' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveFilter('leader')}
                  className={`px-4 py-2 rounded-xl ${
                    activeFilter === 'leader' ? 'bg-purple-500' : 'bg-white border border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm ${
                      activeFilter === 'leader' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    Leaders
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveFilter('staff')}
                  className={`px-4 py-2 rounded-xl ${
                    activeFilter === 'staff' ? 'bg-blue-500' : 'bg-white border border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm ${
                      activeFilter === 'staff' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    Staff
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveFilter('member')}
                  className={`px-4 py-2 rounded-xl ${
                    activeFilter === 'member' ? 'bg-green-500' : 'bg-white border border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-semibold text-sm ${
                      activeFilter === 'member' ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    Members
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Members List */}
          {userClubIds.length === 0 ? (
            <View className="bg-white rounded-3xl p-8 shadow-sm items-center">
              <View className="bg-gray-100 p-6 rounded-full mb-4">
                <Ionicons name="people" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">No Club Membership</Text>
              <Text className="text-gray-600 text-center mb-4">
                You need to join a club first to view members
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/student/clubs' as any)}
                className="bg-indigo-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Browse Clubs</Text>
              </TouchableOpacity>
            </View>
          ) : !selectedClubId ? (
            <View className="bg-white rounded-3xl p-8 shadow-sm items-center">
              <View className="bg-gray-100 p-6 rounded-full mb-4">
                <Ionicons name="people" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">Select a Club</Text>
              <Text className="text-gray-600 text-center">
                You have {userClubIds.length} club{userClubIds.length > 1 ? 's' : ''}. Please select
                one to view its members.
              </Text>
            </View>
          ) : membersLoading ? (
            <View className="bg-white rounded-3xl p-8 shadow-sm items-center">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="text-gray-600 mt-4">Loading members...</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View className="bg-white rounded-3xl p-8 shadow-sm items-center">
              <View className="bg-gray-100 p-6 rounded-full mb-4">
                <Ionicons name="search" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">No Members Found</Text>
              <Text className="text-gray-600 text-center mb-4">
                {searchTerm || activeFilter !== 'all'
                  ? 'No members match your search or filters'
                  : 'This club currently has no active members'}
              </Text>
              {(searchTerm || activeFilter !== 'all') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                  className="bg-gray-100 px-6 py-3 rounded-xl"
                >
                  <Text className="text-gray-700 font-semibold">Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="space-y-3">
              {filteredMembers.map((member) => {
                const borderColorClass =
                  member.role === 'LEADER'
                    ? 'border-l-purple-500'
                    : member.isStaff
                    ? 'border-l-blue-500'
                    : 'border-l-green-500';

                return (
                  <View
                    key={member.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${borderColorClass}`}
                  >
                    <View className="flex-row items-start gap-3">
                      {/* Avatar */}
                      <View className="relative">
                        {member.avatarUrl ? (
                          <Image
                            source={{ uri: member.avatarUrl }}
                            className="w-14 h-14 rounded-full bg-gray-200"
                          />
                        ) : (
                          <View className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 items-center justify-center">
                            <Text className="text-white font-bold text-lg">
                              {getInitials(member.fullName)}
                            </Text>
                          </View>
                        )}
                        
                        {/* Online status indicator (optional) */}
                        <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      </View>

                      {/* Member Info */}
                      <View className="flex-1">
                        {/* Name and Badges */}
                        <View className="flex-row items-center flex-wrap gap-2 mb-2">
                          <Text className="text-base font-bold text-gray-900 flex-shrink">
                            {member.fullName}
                          </Text>
                          <View
                            className={`px-2 py-1 rounded-full ${
                              member.role === 'LEADER' ? 'bg-purple-100' : 'bg-green-100'
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                member.role === 'LEADER' ? 'text-purple-700' : 'text-green-700'
                              }`}
                            >
                              {member.role}
                            </Text>
                          </View>
                          {member.isStaff && (
                            <View className="px-2 py-1 rounded-full bg-blue-100">
                              <Text className="text-xs font-bold text-blue-700">Staff</Text>
                            </View>
                          )}
                        </View>

                        {/* Contact Info */}
                        <View className="space-y-1.5">
                          <View className="flex-row items-center gap-2">
                            <Ionicons name="mail" size={14} color="#6366F1" />
                            <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
                              {member.email}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-2">
                            <Ionicons name="person" size={14} color="#6366F1" />
                            <Text className="text-sm text-gray-600">
                              Student: {member.studentCode}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-2">
                            <Ionicons name="school" size={14} color="#6366F1" />
                            <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
                              {member.majorName}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-2">
                            <Ionicons name="calendar" size={14} color="#6366F1" />
                            <Text className="text-sm text-gray-600">Joined: {member.joinedAt}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
