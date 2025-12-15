import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { useProfile } from '@contexts/ProfileContext';
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
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
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
  const { profile, userClubs } = useProfile();
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

  // Leave club modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Get user's club IDs from userClubs (from ProfileContext/Sidebar)
  useEffect(() => {
    const loadUserClubs = async () => {
      try {
        // Get club IDs from userClubs array (same as Sidebar)
        const clubIds = userClubs.map((club) => club.clubId);
        
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
  }, [userClubs]);

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
        phone: 'N/A',
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

  // Handle leave club request
  const handleOpenLeaveModal = () => {
    if (!selectedClubId) {
      Alert.alert('Error', 'Please select a club first');
      return;
    }
    setLeaveReason('');
    setShowLeaveModal(true);
  };

  const handleLeaveClub = async () => {
    if (!selectedClubId) return;
    
    if (!leaveReason.trim()) {
      Alert.alert('Error', 'Please enter reason for leaving the club');
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const result = await MembershipsService.postLeaveRequest(selectedClubId, leaveReason);
      Alert.alert('Success', result || 'Request to leave the club has been sent successfully');
      setShowLeaveModal(false);
      setLeaveReason('');
    } catch (error: any) {
      console.error('Failed to submit leave request:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.error || 
        error?.response?.data?.message || 
        error?.message ||
        'Unable to submit a request to leave the club'
      );
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
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
            <View className="bg-white rounded-3xl p-6 shadow-lg" style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="flex-row items-center mb-4">
                <View className="bg-teal-100 p-3 rounded-2xl mr-3">
                  <Ionicons name="business" size={24} color="#14B8A6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900">Your Club</Text>
                  <Text className="text-xs text-gray-500">{userClubIds.length} club{userClubIds.length > 1 ? 's' : ''} available</Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => setShowClubPicker(!showClubPicker)}
                className="flex-row items-center justify-between bg-teal-50 rounded-2xl px-5 py-4 border-2 border-teal-200"
              >
                <View className="flex-1 flex-row items-center">
                  {selectedClub ? (
                    <>
                      <View className="bg-teal-500 p-2 rounded-xl mr-3">
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-bold text-base">{selectedClub.name}</Text>
                        <Text className="text-teal-600 text-xs font-semibold mt-0.5">ID: {selectedClub.id}</Text>
                      </View>
                    </>
                  ) : (
                    <Text className="text-gray-400 font-medium">Choose a club</Text>
                  )}
                </View>
                <View className="bg-teal-500 p-2 rounded-xl">
                  <Ionicons
                    name={showClubPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="white"
                  />
                </View>
              </TouchableOpacity>

              {/* Club picker dropdown */}
              {showClubPicker && (
                <View className="mt-3 bg-white rounded-2xl overflow-hidden border-2 border-teal-100 shadow-md">
                  {userClubsDetails.map((club, index) => (
                    <TouchableOpacity
                      key={club.id}
                      onPress={() => {
                        setSelectedClubId(club.id);
                        setShowClubPicker(false);
                      }}
                      className={`flex-row items-center p-4 ${
                        index !== userClubsDetails.length - 1 ? 'border-b border-gray-100' : ''
                      } ${selectedClubId === club.id ? 'bg-teal-50' : ''}`}
                    >
                      <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                        selectedClubId === club.id ? 'bg-teal-500' : 'bg-gray-200'
                      }`}>
                        <Ionicons name="people" size={20} color={selectedClubId === club.id ? 'white' : '#6B7280'} />
                      </View>
                      <Text
                        className={`flex-1 font-semibold ${
                          selectedClubId === club.id ? 'text-teal-700' : 'text-gray-700'
                        }`}
                      >
                        {club.name}
                      </Text>
                      {selectedClubId === club.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#14B8A6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Leave Club Button */}
              {selectedClubId && (
                <TouchableOpacity
                  onPress={handleOpenLeaveModal}
                  className="mt-4 bg-red-500 px-6 py-4 rounded-2xl flex-row items-center justify-center shadow-lg"
                  style={{ shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                >
                  <Ionicons name="log-out-outline" size={22} color="white" />
                  <Text className="text-white font-bold ml-2 text-base">Leave Club</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Search and Filters */}
          {!membersLoading && apiMembers.length > 0 && selectedClubId && (
            <View>
              {/* Search Bar */}
              <View className="bg-white rounded-2xl px-5 py-4 mb-4 shadow-md flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }}>
                <View className="bg-teal-50 p-2 rounded-xl mr-3">
                  <Ionicons name="search" size={22} color="#14B8A6" />
                </View>
                <AppTextInput
                  placeholder="Search by name, email, or student code..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  className="flex-1 text-gray-900 text-base"
                  placeholderTextColor="#9CA3AF"
                />
                {searchTerm !== '' && (
                  <TouchableOpacity onPress={() => setSearchTerm('')} className="bg-gray-100 p-2 rounded-xl ml-2">
                    <Ionicons name="close" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Buttons */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" nestedScrollEnabled>
                <View className="flex-row gap-3 px-1">
                  <TouchableOpacity
                    onPress={() => setActiveFilter('all')}
                    className={`px-6 py-3 rounded-2xl flex-row items-center shadow-sm ${
                      activeFilter === 'all' ? 'bg-teal-500' : 'bg-white'
                    }`}
                    style={activeFilter === 'all' ? { shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 } : {}}
                  >
                    <Ionicons name="apps" size={18} color={activeFilter === 'all' ? 'white' : '#6B7280'} />
                    <Text
                      className={`font-bold text-sm ml-2 ${
                        activeFilter === 'all' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      All Members
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveFilter('leader')}
                    className={`px-6 py-3 rounded-2xl flex-row items-center shadow-sm ${
                      activeFilter === 'leader' ? 'bg-purple-500' : 'bg-white'
                    }`}
                    style={activeFilter === 'leader' ? { shadowColor: '#A855F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 } : {}}
                  >
                    <Ionicons name="star" size={18} color={activeFilter === 'leader' ? 'white' : '#6B7280'} />
                    <Text
                      className={`font-bold text-sm ml-2 ${
                        activeFilter === 'leader' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Leaders
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveFilter('staff')}
                    className={`px-6 py-3 rounded-2xl flex-row items-center shadow-sm ${
                      activeFilter === 'staff' ? 'bg-blue-500' : 'bg-white'
                    }`}
                    style={activeFilter === 'staff' ? { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 } : {}}
                  >
                    <Ionicons name="briefcase" size={18} color={activeFilter === 'staff' ? 'white' : '#6B7280'} />
                    <Text
                      className={`font-bold text-sm ml-2 ${
                        activeFilter === 'staff' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Staff
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveFilter('member')}
                    className={`px-6 py-3 rounded-2xl flex-row items-center shadow-sm ${
                      activeFilter === 'member' ? 'bg-emerald-500' : 'bg-white'
                    }`}
                    style={activeFilter === 'member' ? { shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 } : {}}
                  >
                    <Ionicons name="person" size={18} color={activeFilter === 'member' ? 'white' : '#6B7280'} />
                    <Text
                      className={`font-bold text-sm ml-2 ${
                        activeFilter === 'member' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Members
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}

          {/* Members List */}
          {userClubIds.length === 0 ? (
            <View className="bg-white rounded-3xl p-10 shadow-lg items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-8 rounded-full mb-6">
                <Ionicons name="people" size={56} color="#14B8A6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-3">No Club Membership</Text>
              <Text className="text-gray-600 text-center mb-6 text-base leading-6">
                You need to join a club first to view members
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/student/clubs' as any)}
                className="bg-teal-500 px-8 py-4 rounded-2xl shadow-lg flex-row items-center"
                style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
              >
                <Ionicons name="search" size={22} color="white" />
                <Text className="text-white font-bold ml-2 text-base">Browse Clubs</Text>
              </TouchableOpacity>
            </View>
          ) : !selectedClubId ? (
            <View className="bg-white rounded-3xl p-10 shadow-lg items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-8 rounded-full mb-6">
                <Ionicons name="people" size={56} color="#14B8A6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-3">Select a Club</Text>
              <Text className="text-gray-600 text-center text-base leading-6">
                You have {userClubIds.length} club{userClubIds.length > 1 ? 's' : ''}. Please select
                one to view its members.
              </Text>
            </View>
          ) : membersLoading ? (
            <View className="bg-white rounded-3xl p-12 shadow-lg items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-6 rounded-full mb-4">
                <ActivityIndicator size="large" color="#14B8A6" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg">Loading members...</Text>
              <Text className="text-gray-500 text-sm mt-2">Please wait a moment</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View className="bg-white rounded-3xl p-10 shadow-lg items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-8 rounded-full mb-6">
                <Ionicons name="search" size={56} color="#14B8A6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-3">No Members Found</Text>
              <Text className="text-gray-600 text-center mb-6 text-base leading-6">
                {searchTerm || activeFilter !== 'all'
                  ? 'No members match your search criteria.\nTry adjusting your filters.'
                  : 'This club currently has no active members'}
              </Text>
              {(searchTerm || activeFilter !== 'all') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                  className="bg-teal-500 px-8 py-4 rounded-2xl shadow-lg flex-row items-center"
                  style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text className="text-white font-bold ml-2 text-base">Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="space-y-4">
              {filteredMembers.map((member) => {
                const roleConfig =
                  member.role === 'LEADER' || member.role === 'VICE_LEADER'
                    ? { bg: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600', icon: 'star', borderColor: '#A855F7' }
                    : member.isStaff
                    ? { bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600', icon: 'briefcase', borderColor: '#3B82F6' }
                    : { bg: 'bg-teal-500', gradient: 'from-teal-500 to-teal-600', icon: 'person', borderColor: '#14B8A6' };

                return (
                  <View
                    key={member.id}
                    className="bg-white rounded-3xl overflow-hidden shadow-lg"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}
                  >
                    {/* Colorful Top Bar */}
                    <View className="h-2" style={{ backgroundColor: roleConfig.borderColor }} />
                    
                    <View className="p-5">
                      <View className="flex-row items-start">
                        {/* Avatar */}
                        <View className="relative mr-4">
                          {member.avatarUrl ? (
                            <Image
                              source={{ uri: member.avatarUrl }}
                              className="w-16 h-16 rounded-2xl bg-gray-200"
                            />
                          ) : (
                            <View className={`w-16 h-16 rounded-2xl ${roleConfig.bg} items-center justify-center shadow-md`}>
                              <Text className="text-white font-bold text-xl">
                                {getInitials(member.fullName)}
                              </Text>
                            </View>
                          )}
                          
                          {/* Online status indicator */}
                          <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full" />
                        </View>

                        {/* Member Info */}
                        <View className="flex-1">
                          {/* Name */}
                          <Text className="text-lg font-bold text-gray-900 mb-2">
                            {member.fullName}
                          </Text>
                          
                          {/* Role Badges */}
                          <View className="flex-row flex-wrap gap-2 mb-3">
                            <View className={`${roleConfig.bg} px-3 py-1.5 rounded-xl flex-row items-center shadow-sm`}>
                              <Ionicons name={roleConfig.icon as any} size={14} color="white" />
                              <Text className="text-white text-xs font-bold ml-1">
                                {member.role === 'VICE_LEADER' ? 'VICE LEADER' : member.role}
                              </Text>
                            </View>
                            {member.isStaff && (
                              <View className="bg-blue-500 px-3 py-1.5 rounded-xl flex-row items-center shadow-sm">
                                <Ionicons name="briefcase" size={14} color="white" />
                                <Text className="text-white text-xs font-bold ml-1">STAFF</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Contact Info Grid */}
                      <View className="mt-4 bg-gray-50 rounded-2xl p-4 space-y-3">
                        <View className="flex-row items-center">
                          <View className="bg-teal-100 p-2 rounded-xl mr-3">
                            <Ionicons name="mail" size={16} color="#14B8A6" />
                          </View>
                          <Text className="text-sm text-gray-700 flex-1 font-medium" numberOfLines={1}>
                            {member.email}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <View className="bg-purple-100 p-2 rounded-xl mr-3">
                            <Ionicons name="card" size={16} color="#A855F7" />
                          </View>
                          <Text className="text-sm text-gray-700 font-medium">
                            {member.studentCode}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <View className="bg-blue-100 p-2 rounded-xl mr-3">
                            <Ionicons name="school" size={16} color="#3B82F6" />
                          </View>
                          <Text className="text-sm text-gray-700 flex-1 font-medium" numberOfLines={1}>
                            {member.majorName}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <View className="bg-green-100 p-2 rounded-xl mr-3">
                            <Ionicons name="calendar" size={16} color="#10B981" />
                          </View>
                          <Text className="text-sm text-gray-700 font-medium">Joined: {member.joinedAt}</Text>
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

      {/* Leave Club Modal */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-3xl w-full max-w-md shadow-lg">
            {/* Modal Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xl font-bold text-gray-900">Leave the club</Text>
                <TouchableOpacity
                  onPress={() => setShowLeaveModal(false)}
                  className="p-2 rounded-full bg-gray-100"
                  disabled={isSubmittingLeave}
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600">
                Are you sure you want to leave{' '}
                <Text className="font-semibold text-gray-900">"{selectedClub?.name}"</Text>?
                {'\n'}Please enter a reason for Leader to review.
              </Text>
            </View>

            {/* Modal Body */}
            <View className="px-6 py-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Reason for leaving the club <Text className="text-red-500">*</Text>
              </Text>
              <AppTextInput
                placeholder="Enter your reason..."
                value={leaveReason}
                onChangeText={setLeaveReason}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-[120px]"
                editable={!isSubmittingLeave}
              />
            </View>

            {/* Modal Footer */}
            <View className="px-6 pb-6 flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowLeaveModal(false);
                  setLeaveReason('');
                }}
                className="flex-1 bg-gray-100 px-4 py-3 rounded-xl"
                disabled={isSubmittingLeave}
              >
                <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLeaveClub}
                className={`flex-1 px-4 py-3 rounded-xl ${
                  isSubmittingLeave || !leaveReason.trim() ? 'bg-red-300' : 'bg-red-500'
                }`}
                disabled={isSubmittingLeave || !leaveReason.trim()}
              >
                {isSubmittingLeave ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">Leave</Text>
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
