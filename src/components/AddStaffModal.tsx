import { Ionicons } from '@expo/vector-icons';
import { useEventStaff } from '@hooks/useQueryHooks';
import { postEventStaff } from '@services/eventStaff.service';
import { MembershipsService } from '@services/memberships.service';
import { useAuthStore } from '@stores/auth.store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: number;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({
  visible,
  onClose,
  eventId,
}) => {
  const { user } = useAuthStore();
  const userClubId = user?.clubIds?.[0] || null;
  
  const [view, setView] = useState<'list' | 'add'>('list');
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [duty, setDuty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch staff data
  const {
    data: staffList = [],
    isLoading: staffLoading,
    refetch: refetchStaff,
  } = useEventStaff(eventId, !!eventId);

  // Load club members when switching to add view
  useEffect(() => {
    if (view === 'add' && userClubId) {
      loadClubMembers();
    }
  }, [view, userClubId, staffList]);

  const loadClubMembers = async () => {
    if (!userClubId) return;
    setLoadingMembers(true);
    try {
      const members = await MembershipsService.getMembersByClubId(userClubId);
      console.log('📋 All club members:', members);
      console.log('👥 Current staff list:', staffList);
      
      // Filter out members who are already staff
      const staffMemberIds = staffList.map(s => s.membershipId);
      console.log('🔍 Staff membershipIds to filter:', staffMemberIds);
      
      const availableMembers = members.filter((m: any) => !staffMemberIds.includes(m.membershipId));
      console.log('✅ Available members after filter:', availableMembers);
      
      setClubMembers(availableMembers || []);
    } catch (error) {
      console.error('Failed to load club members:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to load club members',
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddStaff = async () => {
    if (!selectedMember || !duty.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please select a member and enter their duty',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await postEventStaff(eventId, selectedMember.membershipId, duty.trim());
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Staff member assigned successfully',
      });
      await refetchStaff();
      setView('list');
      setSelectedMember(null);
      setDuty('');
      setSearchTerm('');
    } catch (error: any) {
      console.error('Failed to assign staff:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Failed to assign staff',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setView('list');
    setSelectedMember(null);
    setDuty('');
    setSearchTerm('');
    onClose();
  };

  const filteredMembers = clubMembers.filter(member => 
    member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.studentCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug log
  console.log('🎯 Club members count:', clubMembers.length);
  console.log('🔍 Filtered members count:', filteredMembers.length);
  console.log('🔎 Search term:', searchTerm);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white dark:bg-gray-800 rounded-2xl w-11/12 max-h-5/6" style={{ maxWidth: 600, height: '80%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {view === 'list' ? 'Event Staff' : 'Add Staff Member'}
              </Text>
              {view === 'list' && (
                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {staffList.length} staff member(s)
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
            {view === 'list' ? (
              // Staff List View
              <View className="p-6">
                {staffLoading ? (
                  <View className="py-12 items-center">
                    <ActivityIndicator size="large" color="#0D9488" />
                    <Text className="mt-4 text-gray-500">Loading staff...</Text>
                  </View>
                ) : staffList.length === 0 ? (
                  <View className="py-12 items-center">
                    <Ionicons name="people-outline" size={64} color="#9CA3AF" />
                    <Text className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                      No Staff Assigned
                    </Text>
                    <Text className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                      Add staff members to help manage this event
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-3">
                    {staffList.map((staff) => (
                      <View
                        key={staff.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1">
                            <Text className="font-semibold text-gray-900 dark:text-white">
                              {staff.memberName}
                            </Text>
                            {staff.memberEmail && (
                              <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {staff.memberEmail}
                              </Text>
                            )}
                            <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {staff.duty}
                            </Text>
                          </View>
                          <View
                            className={`px-2 py-1 rounded ${
                              staff.state === 'ACTIVE'
                                ? 'bg-green-100 dark:bg-green-900'
                                : staff.state === 'EXPIRED'
                                ? 'bg-blue-100 dark:bg-blue-900'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                staff.state === 'ACTIVE'
                                  ? 'text-green-800 dark:text-green-200'
                                  : staff.state === 'EXPIRED'
                                  ? 'text-blue-800 dark:text-blue-200'
                                  : 'text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {staff.state}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-1 mt-2">
                          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                          <Text className="text-xs text-gray-500 dark:text-gray-400">
                            Assigned: {new Date(staff.assignedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              // Add Staff View
              <View className="p-6 flex-1">
                {/* Member Selection */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Member <Text className="text-red-500">*</Text>
                  </Text>
                  
                  {/* Search */}
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700 mb-3"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />

                  {loadingMembers ? (
                    <View className="py-8 items-center">
                      <ActivityIndicator size="large" color="#0D9488" />
                    </View>
                  ) : filteredMembers.length === 0 ? (
                    <View className="py-8 items-center">
                      <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                      <Text className="mt-2 text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No members found' : 'No available members'}
                      </Text>
                    </View>
                  ) : (
                    <View className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden" style={{ maxHeight: 250 }}>
                      <ScrollView>
                        {filteredMembers.map((member, index) => (
                          <TouchableOpacity
                            key={member.membershipId || member.id || index}
                            className={`p-4 ${index < filteredMembers.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''} ${
                              selectedMember?.membershipId === member.membershipId
                                ? 'bg-teal-50 dark:bg-teal-900/20'
                                : 'bg-white dark:bg-gray-700'
                            }`}
                            onPress={() => {
                              console.log('🎯 Selected member:', member);
                              setSelectedMember(member);
                            }}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <Text className="font-semibold text-gray-900 dark:text-white">
                                  {member.fullName || 'Unknown'}
                                </Text>
                                <Text className="text-sm text-gray-600 dark:text-gray-400">
                                  {member.email || member.studentCode || 'No email'}
                                </Text>
                              </View>
                              {selectedMember?.membershipId === member.membershipId && (
                                <Ionicons name="checkmark-circle" size={24} color="#0D9488" />
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Duty Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duty/Responsibility <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="e.g., Registration Desk, Sound System, etc."
                    value={duty}
                    onChangeText={setDuty}
                    maxLength={100}
                  />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {duty.length}/100 characters
                  </Text>
                </View>

                {/* Selected Member Preview */}
                {selectedMember && (
                  <View className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-lg">
                    <Text className="text-sm font-medium text-teal-800 dark:text-teal-200 mb-2">
                      Selected Member
                    </Text>
                    <Text className="font-semibold text-gray-900 dark:text-white">
                      {selectedMember.fullName}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedMember.email || selectedMember.studentCode}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="p-6 border-t border-gray-200 dark:border-gray-700">
            {view === 'list' ? (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-teal-600 rounded-lg py-3 items-center"
                  onPress={() => {
                    setView('add');
                    loadClubMembers();
                  }}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text className="text-white font-medium ml-2">Add Staff</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg py-3 items-center"
                  onPress={handleClose}
                >
                  <Text className="text-gray-700 dark:text-gray-300 font-medium">Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg py-3 items-center"
                  onPress={() => {
                    setView('list');
                    setSelectedMember(null);
                    setDuty('');
                    setSearchTerm('');
                  }}
                  disabled={isSubmitting}
                >
                  <Text className="text-gray-700 dark:text-gray-300 font-medium">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 bg-teal-600 rounded-lg py-3 items-center ${
                    (!selectedMember || !duty.trim() || isSubmitting) ? 'opacity-50' : ''
                  }`}
                  onPress={handleAddStaff}
                  disabled={!selectedMember || !duty.trim() || isSubmitting}
                >
                  <View className="flex-row items-center">
                    {isSubmitting && <ActivityIndicator size="small" color="white" />}
                    <Text className="text-white font-medium ml-2">
                      {isSubmitting ? 'Adding...' : 'Assign Staff'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddStaffModal;
