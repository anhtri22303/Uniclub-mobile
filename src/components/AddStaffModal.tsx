import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Member {
  id: number;
  membershipId: number;
  memberName: string;
  memberEmail: string;
}

interface AddStaffModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (membershipId: number, duty: string) => Promise<void>;
  clubMembers: Member[];
  eventName: string;
  existingStaffIds?: number[];
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({
  visible,
  onClose,
  onSubmit,
  clubMembers,
  eventName,
  existingStaffIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [duty, setDuty] = useState('');
  const [errors, setErrors] = useState<{ member?: string; duty?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter members: not already staff and matches search
  const availableMembers = clubMembers.filter(
    (member) =>
      !existingStaffIds.includes(member.membershipId) &&
      (member.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.memberEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedMember = clubMembers.find((m) => m.membershipId === selectedMemberId);

  const validateForm = () => {
    const newErrors: { member?: string; duty?: string } = {};

    if (!selectedMemberId) {
      newErrors.member = 'Please select a member';
    }

    if (!duty.trim()) {
      newErrors.duty = 'Duty is required';
    } else if (duty.trim().length < 3) {
      newErrors.duty = 'Duty must be at least 3 characters';
    } else if (duty.trim().length > 100) {
      newErrors.duty = 'Duty must not exceed 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedMemberId!, duty.trim());
      // Reset form on success
      setSelectedMemberId(null);
      setDuty('');
      setSearchQuery('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to add staff:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedMemberId(null);
      setDuty('');
      setSearchQuery('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white dark:bg-gray-800 rounded-2xl w-11/12 max-w-md max-h-5/6">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">Add Staff Member</Text>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <View className="p-6 space-y-4">
              {/* Event Name */}
              <View>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Adding staff for <Text className="font-semibold text-gray-900 dark:text-white">{eventName}</Text>
                </Text>
              </View>

              {/* Search Members */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Member <Text className="text-red-500">*</Text>
                </Text>
                <View className="relative">
                  <TextInput
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by name or email..."
                    editable={!isSubmitting}
                  />
                  <View className="absolute right-3 top-3">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                  </View>
                </View>
                {errors.member && <Text className="text-sm text-red-500 mt-1">{errors.member}</Text>}
              </View>

              {/* Selected Member Display */}
              {selectedMember && (
                <View className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900 dark:text-white">{selectedMember.memberName}</Text>
                      <Text className="text-sm text-gray-600 dark:text-gray-400">{selectedMember.memberEmail}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedMemberId(null);
                        setErrors({ ...errors, member: undefined });
                      }}
                      disabled={isSubmitting}
                    >
                      <Ionicons name="close-circle" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Member List */}
              {!selectedMember && (
                <View className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-60">
                  <ScrollView>
                    {availableMembers.length === 0 ? (
                      <View className="p-4">
                        <Text className="text-center text-gray-500 dark:text-gray-400">
                          {searchQuery
                            ? 'No members found matching your search'
                            : 'No available members (all are already assigned as staff)'}
                        </Text>
                      </View>
                    ) : (
                      availableMembers.map((member) => (
                        <TouchableOpacity
                          key={member.membershipId}
                          className="p-4 border-b border-gray-200 dark:border-gray-700"
                          onPress={() => {
                            setSelectedMemberId(member.membershipId);
                            setErrors({ ...errors, member: undefined });
                          }}
                          disabled={isSubmitting}
                        >
                          <Text className="font-medium text-gray-900 dark:text-white">{member.memberName}</Text>
                          <Text className="text-sm text-gray-600 dark:text-gray-400">{member.memberEmail}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Duty Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duty / Responsibility <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`border ${errors.duty ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700`}
                  value={duty}
                  onChangeText={(text) => {
                    setDuty(text);
                    setErrors({ ...errors, duty: undefined });
                  }}
                  placeholder="e.g., Registration desk, Sound system, Photography..."
                  multiline
                  numberOfLines={2}
                  maxLength={100}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                <View className="flex-row items-center justify-between mt-1">
                  {errors.duty ? (
                    <Text className="text-sm text-red-500">{errors.duty}</Text>
                  ) : (
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Minimum 3 characters required</Text>
                  )}
                  <Text className="text-sm text-gray-500 dark:text-gray-400">{duty.length}/100</Text>
                </View>
              </View>

              {/* Info Message */}
              <View className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-row items-start gap-2">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="flex-1 text-sm text-blue-800 dark:text-blue-200">
                  The selected member will be assigned as staff for this event. You can evaluate their performance after
                  the event is completed.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="flex-row items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg"
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text className="text-gray-700 dark:text-gray-300 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex-row items-center gap-2 ${isSubmitting || !selectedMemberId ? 'opacity-50' : ''}`}
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedMemberId}
            >
              {isSubmitting && <ActivityIndicator size="small" color="#FFF" />}
              <Text className="text-white font-medium">{isSubmitting ? 'Adding...' : 'Add Staff'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddStaffModal;
