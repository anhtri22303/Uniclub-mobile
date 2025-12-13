import { Ionicons } from '@expo/vector-icons';
import { useEventStaff } from '@hooks/useQueryHooks';
import {
  deleteEventStaff,
  EventStaff,
  getEvaluateEventStaff,
  getTopEvaluatedStaff,
  postEventStaff,
  StaffEvaluation
} from '@services/eventStaff.service';
import { MembershipsService } from '@services/memberships.service';
import { useAuthStore } from '@stores/auth.store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import EvaluateStaffModal from './EvaluateStaffModal';
import EvaluationDetailModal from './EvaluationDetailModal';
import { AppTextInput } from './ui';

interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: number;
  eventStatus?: string;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({
  visible,
  onClose,
  eventId,
  eventStatus = '',
}) => {
  const { user } = useAuthStore();
  const userClubId = user?.clubIds?.[0] || null;
  
  const [view, setView] = useState<'list' | 'add'>('list');
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dutyInput, setDutyInput] = useState<{ [key: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Evaluation states
  const [staffEvaluations, setStaffEvaluations] = useState<StaffEvaluation[]>([]);
  const [topEvaluations, setTopEvaluations] = useState<StaffEvaluation[]>([]);
  const [evaluationsLoading, setEvaluationsLoading] = useState(false);
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [showEvaluationDetailModal, setShowEvaluationDetailModal] = useState(false);
  const [selectedStaffForEvaluation, setSelectedStaffForEvaluation] = useState<EventStaff | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<StaffEvaluation | null>(null);
  
  // Delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<EventStaff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch staff data
  const {
    data: staffList = [],
    isLoading: staffLoading,
    refetch: refetchStaff,
  } = useEventStaff(eventId, !!eventId);
  
  // Check if event is completed
  const isEventCompleted = eventStatus === 'COMPLETED';

  // Load club members when switching to add view
  useEffect(() => {
    if (view === 'add' && userClubId) {
      loadClubMembers();
    }
  }, [view, userClubId, staffList]);
  
  // Load evaluations for completed events
  useEffect(() => {
    if (visible && view === 'list' && isEventCompleted) {
      loadEvaluations();
      loadTopEvaluations();
    }
  }, [visible, view, isEventCompleted, eventId]);

  const loadClubMembers = async () => {
    if (!userClubId) return;
    setLoadingMembers(true);
    try {
      const members = await MembershipsService.getMembersByClubId(userClubId);
      console.log(' All club members:', members);
      console.log(' Current staff list:', staffList);
      
      // Filter only members with "MEMBER" role and ACTIVE state
      const filteredMembers = members.filter(
        (member: any) => member.clubRole === 'MEMBER' && member.state === 'ACTIVE'
      );
      
      // Filter out members who are already staff (only ACTIVE staff)
      const activeStaffMemberIds = staffList
        .filter(s => s.state === 'ACTIVE')
        .map(s => s.membershipId);
      console.log(' Active staff membershipIds to filter:', activeStaffMemberIds);
      
      const availableMembers = filteredMembers.filter(
        (m: any) => !activeStaffMemberIds.includes(m.membershipId)
      );
      console.log('  Available members after filter:', availableMembers);
      
      setClubMembers(availableMembers || []);
    } catch (error) {
      // Không dùng console.error để tránh hiển thị error overlay
      if (__DEV__) console.log('Failed to load club members');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to load club members',
      });
    } finally {
      setLoadingMembers(false);
    }
  };
  
  const loadEvaluations = async () => {
    setEvaluationsLoading(true);
    try {
      const data = await getEvaluateEventStaff(eventId);
      setStaffEvaluations(data);
    } catch (error: any) {
      console.error('Failed to load evaluations:', error);
      // Don't show error toast, it's not critical
    } finally {
      setEvaluationsLoading(false);
    }
  };
  
  const loadTopEvaluations = async () => {
    try {
      const data = await getTopEvaluatedStaff(eventId);
      setTopEvaluations(data);
    } catch (error: any) {
      console.error('Failed to load top evaluations:', error);
      // Don't show error toast, it's not critical
    }
  };

  const handleAddStaff = async (membershipId: number) => {
    const duty = dutyInput[membershipId]?.trim();

    if (!duty) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a duty for this member',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await postEventStaff(eventId, membershipId, duty);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Staff member assigned successfully',
      });
      // Clear duty input for this member
      setDutyInput((prev) => {
        const newInputs = { ...prev };
        delete newInputs[membershipId];
        return newInputs;
      });
      // Reload both lists after successful addition
      await Promise.all([refetchStaff(), loadClubMembers()]);
    } catch (error: any) {
      console.error('Failed to add staff:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to assign staff';
      
      // Đóng modal trước rồi mới hiển thị toast để toast không bị che
      setIsSubmitting(false);
      onClose();
      
      // Delay nhỏ để modal đóng xong
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Cannot Assign Staff',
          text2: errorMessage,
          position: 'top',
          visibilityTime: 4000,
        });
      }, 300);
      return;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteStaff = (staff: EventStaff) => {
    setStaffToDelete(staff);
    setShowDeleteConfirm(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteEventStaff(eventId, staffToDelete.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Staff member removed successfully',
      });
      await refetchStaff();
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete staff:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.error || error?.response?.data?.message || 'Failed to remove staff member',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleOpenEvaluateModal = (staff: EventStaff) => {
    setSelectedStaffForEvaluation(staff);
    setShowEvaluateModal(true);
  };
  
  const handleCloseEvaluateModal = () => {
    setShowEvaluateModal(false);
    setSelectedStaffForEvaluation(null);
  };
  
  const handleEvaluationSuccess = async () => {
    // Reload staff list and evaluations after successful evaluation
    await Promise.all([refetchStaff(), loadEvaluations(), loadTopEvaluations()]);
  };
  
  const getStaffEvaluation = (membershipId: number): StaffEvaluation | undefined => {
    return staffEvaluations.find(
      (evaluation) => evaluation.membershipId === membershipId
    );
  };
  
  const handleOpenEvaluationDetail = (staff: EventStaff) => {
    const evaluation = getStaffEvaluation(staff.membershipId);
    if (evaluation) {
      setSelectedEvaluation(evaluation);
      setShowEvaluationDetailModal(true);
    }
  };
  
  const handleCloseEvaluationDetail = () => {
    setShowEvaluationDetailModal(false);
    setSelectedEvaluation(null);
  };

  const handleDutyChange = (membershipId: number, value: string) => {
    setDutyInput((prev) => ({
      ...prev,
      [membershipId]: value,
    }));
  };

  const handleClose = () => {
    setView('list');
    setDutyInput({});
    setSearchTerm('');
    onClose();
  };

  const filteredMembers = clubMembers.filter(member => 
    member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.studentCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredStaff = staffList
    .filter((staff) => staff.state !== 'REMOVED') // Exclude REMOVED staff
    .filter(
      (staff) =>
        staff.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.duty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  // Sort staff by performance if event is completed and top evaluations are available
  const sortedFilteredStaff =
    isEventCompleted && topEvaluations.length > 0
      ? [...filteredStaff].sort((a, b) => {
          const evalA = topEvaluations.find(
            (e) => e.membershipId === a.membershipId
          );
          const evalB = topEvaluations.find(
            (e) => e.membershipId === b.membershipId
          );

          // Performance order: EXCELLENT > GOOD > AVERAGE > POOR
          const performanceOrder: { [key: string]: number } = {
            EXCELLENT: 4,
            GOOD: 3,
            AVERAGE: 2,
            POOR: 1,
          };
          const scoreA = evalA ? performanceOrder[evalA.performance] || 0 : 0;
          const scoreB = evalB ? performanceOrder[evalB.performance] || 0 : 0;

          return scoreB - scoreA; // Descending order
        })
      : filteredStaff;

  // Debug log
  console.log(' Club members count:', clubMembers.length);
  console.log(' Filtered members count:', filteredMembers.length);
  console.log(' Search term:', searchTerm);
  console.log(' Current view:', view);
  console.log(' Loading members:', loadingMembers);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white dark:bg-gray-800 rounded-2xl w-11/12 flex-1" style={{ maxWidth: 600, maxHeight: '85%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Event Staff Management
              </Text>
              {view === 'list' && (
                <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {sortedFilteredStaff.length} staff member(s)
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {/* Tabs - Hide add tab for completed events */}
          {!isEventCompleted && (
            <View className="flex-row border-b border-gray-200 dark:border-gray-700">
              <TouchableOpacity
                onPress={() => setView('list')}
                className={`flex-1 px-6 py-4 ${view === 'list' ? 'border-b-2 border-purple-600' : ''}` }
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons 
                    name="people" 
                    size={18} 
                    color={view === 'list' ? '#9333EA' : '#6B7280'} 
                  />
                  <Text 
                    className={`ml-2 text-sm font-medium ${view === 'list' ? 'text-purple-600' : 'text-gray-500'}`}
                  >
                    Event Staff
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setView('add')}
                className={`flex-1 px-6 py-4 ${view === 'add' ? 'border-b-2 border-purple-600' : ''}` }
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons 
                    name="person-add" 
                    size={18} 
                    color={view === 'add' ? '#9333EA' : '#6B7280'} 
                  />
                  <Text 
                    className={`ml-2 text-sm font-medium ${view === 'add' ? 'text-purple-600' : 'text-gray-500'}`}
                  >
                    Add Staff
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Search Bar */}
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <AppTextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              placeholder={view === 'list' ? 'Search by member name or duty...' : 'Search by name, student code, or email...'}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {/* Content */}
          {view === 'list' ? (
            <ScrollView className="flex-1">
              {/* Staff List View */}
              <View className="p-4">
                {staffLoading ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="large" color="#9333EA" />
                    <Text className="mt-3 text-gray-500 text-sm">Loading staff...</Text>
                  </View>
                ) : sortedFilteredStaff.length === 0 ? (
                  <View className="py-8 items-center">
                    <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                    <Text className="mt-3 text-base font-semibold text-gray-900 dark:text-white">
                      {searchTerm ? 'No staff found matching your search' : 'No Staff Assigned'}
                    </Text>
                    {!searchTerm && (
                      <Text className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-center px-4">
                        Add staff members to help manage this event
                      </Text>
                    )}
                  </View>
                ) : (
                  <View className="space-y-3">
                    {sortedFilteredStaff.map((staff) => {
                      const staffEvaluation = getStaffEvaluation(staff.membershipId);
                      
                      return (
                        <View
                          key={staff.id}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <View className="flex-row items-start justify-between mb-2">
                            {/* Avatar */}
                            <View className="mr-3">
                              <View className="h-12 w-12 rounded-full bg-purple-600 items-center justify-center">
                                <Text className="text-white font-semibold text-lg">
                                  {staff.memberName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            </View>
                            
                            {/* Staff Info */}
                            <View className="flex-1">
                              <View className="flex-row items-center gap-2 mb-1">
                                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {staff.memberName}
                                </Text>
                                {/* Show performance badge for completed events */}
                                {isEventCompleted && staffEvaluation && (
                                  <View
                                    className={`px-2 py-0.5 rounded flex-row items-center ${
                                      staffEvaluation.performance === 'EXCELLENT'
                                        ? 'bg-green-100 border border-green-500'
                                        : staffEvaluation.performance === 'GOOD'
                                        ? 'bg-blue-100 border border-blue-500'
                                        : staffEvaluation.performance === 'AVERAGE'
                                        ? 'bg-yellow-100 border border-yellow-500'
                                        : 'bg-red-100 border border-red-500'
                                    }`}
                                  >
                                    <Ionicons 
                                      name="star" 
                                      size={10} 
                                      color={
                                        staffEvaluation.performance === 'EXCELLENT'
                                          ? '#15803D'
                                          : staffEvaluation.performance === 'GOOD'
                                          ? '#1E40AF'
                                          : staffEvaluation.performance === 'AVERAGE'
                                          ? '#A16207'
                                          : '#991B1B'
                                      } 
                                    />
                                    <Text
                                      className={`text-xs font-semibold ml-1 ${
                                        staffEvaluation.performance === 'EXCELLENT'
                                          ? 'text-green-700'
                                          : staffEvaluation.performance === 'GOOD'
                                          ? 'text-blue-700'
                                          : staffEvaluation.performance === 'AVERAGE'
                                          ? 'text-yellow-700'
                                          : 'text-red-700'
                                      }`}
                                    >
                                      {staffEvaluation.performance}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                Duty: {staff.duty}
                              </Text>
                              <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                Assigned: {new Date(staff.assignedAt).toLocaleDateString('vi-VN')}
                              </Text>
                            </View>
                            
                            {/* Status Badge */}
                            <View
                              className={`px-2 py-0.5 rounded ml-2 ${
                                staff.state === 'ACTIVE'
                                  ? 'bg-green-100 border border-green-500'
                                  : 'bg-gray-100 border border-gray-300'
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  staff.state === 'ACTIVE'
                                    ? 'text-green-700'
                                    : 'text-gray-700'
                                }`}
                              >
                                {staff.state}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Action Buttons */}
                          <View className="flex-row items-center gap-2 mt-2">
                            {/* Delete Button - Only show if event is not completed */}
                            {!isEventCompleted && (
                              <TouchableOpacity
                                onPress={() => handleDeleteStaff(staff)}
                                className="flex-1 border border-red-500 rounded-lg py-2 items-center"
                              >
                                <View className="flex-row items-center">
                                  <Ionicons name="trash" size={16} color="#DC2626" />
                                  <Text className="text-red-600 font-medium ml-1 text-xs">Remove</Text>
                                </View>
                              </TouchableOpacity>
                            )}
                            
                            {/* Evaluate Button - Only show for completed events */}
                            {isEventCompleted && (
                              staffEvaluation ? (
                                <TouchableOpacity
                                  onPress={() => handleOpenEvaluationDetail(staff)}
                                  className="flex-1 bg-green-600 rounded-lg py-2 items-center"
                                >
                                  <View className="flex-row items-center">
                                    <Ionicons name="checkmark-circle" size={16} color="white" />
                                    <Text className="text-white font-medium ml-1 text-xs">Has Been Evaluated</Text>
                                  </View>
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  onPress={() => handleOpenEvaluateModal(staff)}
                                  className="flex-1 bg-amber-600 rounded-lg py-2 items-center"
                                >
                                  <View className="flex-row items-center">
                                    <Ionicons name="star" size={16} color="white" />
                                    <Text className="text-white font-medium ml-1 text-xs">Evaluate</Text>
                                  </View>
                                </TouchableOpacity>
                              )
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
            <ScrollView className="flex-1">
              {/* Add Staff View */}
              <View className="p-4">
                {loadingMembers ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="mt-3 text-gray-500 text-sm">Loading members...</Text>
                  </View>
                ) : filteredMembers.length === 0 ? (
                  <View className="py-8 items-center">
                    <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                    <Text className="mt-3 text-base font-semibold text-gray-900 dark:text-white">
                      {searchTerm ? 'No members found matching your search' : 'No members available to add as staff'}
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-3">
                    {filteredMembers.map((member, index) => (
                      <View
                        key={member.membershipId || member.id || index}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 mb-3"
                      >
                        <View className="flex-row items-center mb-3">
                          {/* Avatar */}
                          <View className="mr-3">
                            {member.avatarUrl ? (
                              <View className="h-12 w-12 rounded-full overflow-hidden">
                                {/* Note: React Native Image would go here */}
                                <View className="h-12 w-12 rounded-full bg-blue-600 items-center justify-center">
                                  <Text className="text-white font-semibold text-lg">
                                    {member.fullName.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                              </View>
                            ) : (
                              <View className="h-12 w-12 rounded-full bg-blue-600 items-center justify-center">
                                <Text className="text-white font-semibold text-lg">
                                  {member.fullName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                          
                          {/* Member Info */}
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                              {member.fullName || 'Unknown'}
                            </Text>
                            <Text className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {member.studentCode} • {member.email || 'No email'}
                            </Text>
                            {member.major && (
                              <Text className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                {member.major}
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        {/* Duty Input */}
                        <AppTextInput
                          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 mb-2"
                          placeholder="Enter duty..."
                          value={dutyInput[member.membershipId] || ''}
                          onChangeText={(value) => handleDutyChange(member.membershipId, value)}
                        />
                        
                        {/* Add Button */}
                        <TouchableOpacity
                          onPress={() => handleAddStaff(member.membershipId)}
                          disabled={isSubmitting || eventStatus === 'ONGOING' || !dutyInput[member.membershipId]?.trim()}
                          className={`bg-blue-600 rounded-lg py-2 items-center ${
                            (isSubmitting || eventStatus === 'ONGOING' || !dutyInput[member.membershipId]?.trim()) ? 'opacity-50' : ''
                          }`}
                        >
                          <View className="flex-row items-center">
                            {isSubmitting ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                <Ionicons name="person-add" size={16} color="white" />
                                <Text className="text-white font-medium ml-1 text-sm">Add</Text>
                              </>
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* Footer */}
          <View className="p-4 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              className="bg-gray-200 dark:bg-gray-700 rounded-lg py-2.5 items-center"
              onPress={handleClose}
            >
              <Text className="text-gray-700 dark:text-gray-300 font-medium text-sm">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Evaluate Staff Modal */}
      {selectedStaffForEvaluation && (
        <EvaluateStaffModal
          visible={showEvaluateModal}
          onClose={handleCloseEvaluateModal}
          onSubmit={async (membershipId: number, eventId: number, performance: any, note: string) => {
            // This will be handled by the parent component
            // But we need to call the service directly here
            const { evaluateEventStaff } = require('@services/eventStaff.service');
            await evaluateEventStaff(eventId, { membershipId, eventId, performance, note });
            await handleEvaluationSuccess();
          }}
          staffMember={{
            membershipId: selectedStaffForEvaluation.membershipId,
            memberName: selectedStaffForEvaluation.memberName,
            duty: selectedStaffForEvaluation.duty,
          }}
          eventId={eventId}
          eventName={'Event'} // You may want to pass the actual event name
        />
      )}
      
      {/* Evaluation Detail Modal */}
      {selectedEvaluation && (
        <EvaluationDetailModal
          visible={showEvaluationDetailModal}
          onClose={handleCloseEvaluationDetail}
          evaluations={[{
            memberName: selectedStaffForEvaluation?.memberName || 'Unknown',
            memberEmail: undefined,
            duty: selectedStaffForEvaluation?.duty || 'N/A',
            evaluation: selectedEvaluation,
          }]}
          eventName={'Event'} // You may want to pass the actual event name
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && staffToDelete && (
        <Modal visible={true} animationType="fade" transparent>
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white dark:bg-gray-800 rounded-2xl w-11/12 max-w-md p-6">
              <View className="items-center">
                <View className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-4">
                  <Ionicons name="trash" size={24} color="#DC2626" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
                  Remove Staff Member
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                  Are you sure you want to remove{' '}
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    {staffToDelete.memberName}
                  </Text>
                  {' '}from this event? This action cannot be undone.
                </Text>
                <View className="flex-row gap-3 w-full">
                  <TouchableOpacity
                    onPress={() => {
                      setShowDeleteConfirm(false);
                      setStaffToDelete(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 items-center"
                  >
                    <Text className="text-gray-700 dark:text-gray-300 font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 rounded-lg py-2.5 items-center"
                  >
                    <View className="flex-row items-center">
                      {isDeleting ? (
                        <>
                          <ActivityIndicator size="small" color="white" />
                          <Text className="text-white font-medium ml-2">Removing...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="trash" size={16} color="white" />
                          <Text className="text-white font-medium ml-2">Remove</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

export default AddStaffModal;
