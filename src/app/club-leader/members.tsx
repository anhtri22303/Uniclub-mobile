import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import { ApiMembership, LeaveRequest, MembershipsService } from '@services/memberships.service';
import { useAuthStore } from '@stores/auth.store';
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

  // Leave requests state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);
  const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);

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
          phone: 'N/A', // Phone not in API response
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

  // Load leave requests
  const loadLeaveRequests = async () => {
    const clubId = user?.clubIds?.[0];
    if (!clubId) return;
    
    setLoadingLeaveRequests(true);
    try {
      const requests = await MembershipsService.getLeaveRequests(clubId);
      setLeaveRequests(requests);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    } finally {
      setLoadingLeaveRequests(false);
    }
  };

  // Open leave request modal
  const handleOpenLeaveRequestModal = () => {
    loadLeaveRequests();
    setShowLeaveRequestModal(true);
  };

  // Handle approve/reject leave request
  const handleLeaveRequestAction = async (requestId: number, action: 'APPROVED' | 'REJECTED') => {
    setProcessingRequestId(requestId);
    try {
      const message = await MembershipsService.processLeaveRequest(requestId, action);
      Alert.alert(
        'Success',
        message || `Request has been ${action === 'APPROVED' ? 'approved' : 'rejected'}`
      );
      // Reload leave requests and members
      await loadLeaveRequests();
      await loadInitialData();
    } catch (error: any) {
      console.error('Failed to process leave request:', error);
      Alert.alert(
        'Error',
        error?.message || 'Could not process request'
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Count pending requests
  const pendingRequestsCount = leaveRequests.filter(req => req.status === 'PENDING').length;

  // Sort requests by createdAt (latest first)
  const sortedLeaveRequests = [...leaveRequests].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Handle delete member
  const handleDeleteMember = async (membershipId: string) => {
    const member = allClubMembers.find((m) => m.id === membershipId);
    if (!member) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.fullName} from the club?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const membershipIdNum = typeof membershipId === 'string' 
                ? parseInt(membershipId, 10) 
                : membershipId;
              await MembershipsService.deleteMember(membershipIdNum);
              
              Alert.alert('Success', `${member.fullName} has been removed from the club`);
              await loadInitialData();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.message || 'An error occurred while removing the member'
              );
            }
          },
        },
      ]
    );
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

        {/* Request Out Button */}
        {managedClub && (
          <View className="mt-4">
            <TouchableOpacity
              onPress={handleOpenLeaveRequestModal}
              className="bg-orange-500 rounded-xl px-4 py-3 flex-row items-center justify-center"
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Request Out</Text>
              {pendingRequestsCount > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white">
                  <Text className="text-white text-xs font-bold">{pendingRequestsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
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

      {/* Leave Requests Modal */}
      <Modal
        visible={showLeaveRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLeaveRequestModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%]">
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">Leave Requests</Text>
                <TouchableOpacity onPress={() => setShowLeaveRequestModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600 text-sm mt-1">
                List of requests to leave the club from club members
              </Text>
            </View>

            {/* Modal Content */}
            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
              {loadingLeaveRequests ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#0D9488" />
                  <Text className="text-gray-600 mt-4">Loading requests...</Text>
                </View>
              ) : sortedLeaveRequests.length === 0 ? (
                <View className="py-12 items-center">
                  <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-3">
                    <Ionicons name="log-out-outline" size={32} color="#9CA3AF" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-900 mb-1">No Requests</Text>
                  <Text className="text-gray-600 text-center">
                    No members have requested to leave the club
                  </Text>
                </View>
              ) : (
                sortedLeaveRequests.map((request) => {
                  const statusColors = {
                    PENDING: 'bg-yellow-100 border-yellow-300',
                    APPROVED: 'bg-green-100 border-green-300',
                    REJECTED: 'bg-red-100 border-red-300',
                  };

                  const statusTextColors = {
                    PENDING: 'text-yellow-800',
                    APPROVED: 'text-green-800',
                    REJECTED: 'text-red-800',
                  };

                  const statusText = {
                    PENDING: 'Pending',
                    APPROVED: 'Approved',
                    REJECTED: 'Rejected',
                  };

                  return (
                    <View
                      key={request.requestId}
                      className={`bg-white rounded-xl p-4 mb-3 border ${
                        request.status === 'PENDING' ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-200'
                      }`}
                      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          {/* Member Info */}
                          <View className="flex-row items-center mb-2 flex-wrap">
                            <Text className="text-base font-bold text-gray-900 mr-2">
                              {request.memberName}
                            </Text>
                            <View className={`px-2 py-1 rounded-full border ${statusColors[request.status]}`}>
                              <Text className={`text-xs font-semibold ${statusTextColors[request.status]}`}>
                                {statusText[request.status]}
                              </Text>
                            </View>
                            <View className="px-2 py-1 rounded-full border border-gray-300 bg-gray-100 ml-2">
                              <Text className="text-xs font-semibold text-gray-700">
                                {request.memberRole}
                              </Text>
                            </View>
                          </View>

                          {/* Contact & Date */}
                          <View className="mb-2">
                            <View className="flex-row items-center mb-1">
                              <Ionicons name="mail" size={14} color="#3B82F6" />
                              <Text className="text-sm text-gray-600 ml-2">{request.memberEmail}</Text>
                            </View>
                            <View className="flex-row items-center">
                              <Ionicons name="calendar" size={14} color="#3B82F6" />
                              <Text className="text-sm text-gray-600 ml-2">
                                Sent: {new Date(request.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </View>
                          </View>

                          {/* Reason */}
                          <View className="pt-2 border-t border-gray-200">
                            <Text className="text-xs font-semibold text-gray-700 mb-1">Reason:</Text>
                            <Text className="text-sm text-gray-600 italic">"{request.reason}"</Text>
                          </View>

                          {request.processedAt && (
                            <Text className="text-xs text-gray-500 mt-2">
                              Processed: {new Date(request.processedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          )}
                        </View>

                        {/* Action Buttons */}
                        {request.status === 'PENDING' && (
                          <View className="ml-3">
                            <TouchableOpacity
                              onPress={() => handleLeaveRequestAction(request.requestId, 'APPROVED')}
                              disabled={processingRequestId === request.requestId}
                              className="bg-green-500 rounded-lg px-3 py-2 mb-2 items-center"
                            >
                              {processingRequestId === request.requestId ? (
                                <ActivityIndicator size="small" color="white" />
                              ) : (
                                <>
                                  <Ionicons name="checkmark" size={16} color="white" />
                                  <Text className="text-white text-xs font-semibold">Approve</Text>
                                </>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleLeaveRequestAction(request.requestId, 'REJECTED')}
                              disabled={processingRequestId === request.requestId}
                              className="bg-red-500 rounded-lg px-3 py-2 items-center"
                            >
                              {processingRequestId === request.requestId ? (
                                <ActivityIndicator size="small" color="white" />
                              ) : (
                                <>
                                  <Ionicons name="close" size={16} color="white" />
                                  <Text className="text-white text-xs font-semibold">Reject</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View className="px-6 py-4 border-t border-gray-200 flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setShowLeaveRequestModal(false)}
                className="bg-gray-200 rounded-xl px-6 py-3"
              >
                <Text className="text-gray-800 font-semibold">Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={loadLeaveRequests}
                disabled={loadingLeaveRequests}
                className="bg-teal-600 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">
                  {loadingLeaveRequests ? 'Loading...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
