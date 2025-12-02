import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from './ui';

type PerformanceLevel = 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';

interface EvaluateStaffModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (membershipId: number, eventId: number, performance: PerformanceLevel, note: string) => Promise<void>;
  staffMember: {
    membershipId: number;
    memberName: string;
    duty: string;
  } | null;
  eventId: number;
  eventName: string;
}

const performanceOptions: { level: PerformanceLevel; label: string; color: string; icon: string; description: string }[] = [
  {
    level: 'POOR',
    label: 'Poor',
    color: '#EF4444',
    icon: 'sad-outline',
    description: 'Did not meet expectations',
  },
  {
    level: 'AVERAGE',
    label: 'Average',
    color: '#F59E0B',
    icon: 'remove-circle-outline',
    description: 'Met basic expectations',
  },
  {
    level: 'GOOD',
    label: 'Good',
    color: '#3B82F6',
    icon: 'thumbs-up-outline',
    description: 'Exceeded expectations',
  },
  {
    level: 'EXCELLENT',
    label: 'Excellent',
    color: '#10B981',
    icon: 'trophy-outline',
    description: 'Outstanding performance',
  },
];

const EvaluateStaffModal: React.FC<EvaluateStaffModalProps> = ({
  visible,
  onClose,
  onSubmit,
  staffMember,
  eventId,
  eventName,
}) => {
  const [performance, setPerformance] = useState<PerformanceLevel | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ performance?: string; note?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { performance?: string; note?: string } = {};

    if (!performance) {
      newErrors.performance = 'Please select a performance rating';
    }

    if (!note.trim()) {
      newErrors.note = 'Evaluation note is required';
    } else if (note.trim().length < 10) {
      newErrors.note = 'Note must be at least 10 characters';
    } else if (note.trim().length > 500) {
      newErrors.note = 'Note must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !staffMember) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(staffMember.membershipId, eventId, performance!, note.trim());
      // Reset form on success
      setPerformance(null);
      setNote('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to evaluate staff:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPerformance(null);
      setNote('');
      setErrors({});
      onClose();
    }
  };

  if (!staffMember) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white dark:bg-gray-800 rounded-2xl w-11/12 max-w-md max-h-5/6">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">Evaluate Staff</Text>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="p-6 space-y-4">
              {/* Event & Staff Info */}
              <View className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                <Text className="text-sm text-gray-600 dark:text-gray-400">Event</Text>
                <Text className="font-semibold text-gray-900 dark:text-white">{eventName}</Text>
                
                <View className="h-px bg-gray-200 dark:bg-gray-600 my-2" />
                
                <Text className="text-sm text-gray-600 dark:text-gray-400">Staff Member</Text>
                <Text className="font-semibold text-gray-900 dark:text-white">{staffMember.memberName}</Text>
                
                <View className="flex-row items-center gap-2 mt-1">
                  <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 dark:text-gray-400">{staffMember.duty}</Text>
                </View>
              </View>

              {/* Performance Rating */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Performance Rating <Text className="text-red-500">*</Text>
                </Text>
                <View className="space-y-3">
                  {performanceOptions.map((option) => {
                    const isSelected = performance === option.level;
                    return (
                      <TouchableOpacity
                        key={option.level}
                        className={`p-4 rounded-lg border-2 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        }`}
                        onPress={() => {
                          setPerformance(option.level);
                          setErrors({ ...errors, performance: undefined });
                        }}
                        disabled={isSubmitting}
                      >
                        <View className="flex-row items-center gap-3">
                          <View
                            className="w-12 h-12 rounded-full items-center justify-center"
                            style={{ backgroundColor: option.color + '20' }}
                          >
                            <Ionicons name={option.icon as any} size={24} color={option.color} />
                          </View>
                          <View className="flex-1">
                            <Text
                              className="font-semibold text-base"
                              style={{ color: isSelected ? option.color : '#374151' }}
                            >
                              {option.label}
                            </Text>
                            <Text className="text-sm text-gray-600 dark:text-gray-400">{option.description}</Text>
                          </View>
                          {isSelected && <Ionicons name="checkmark-circle" size={24} color={option.color} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.performance && <Text className="text-sm text-red-500 mt-2">{errors.performance}</Text>}
              </View>

              {/* Evaluation Note */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evaluation Notes <Text className="text-red-500">*</Text>
                </Text>
                <AppTextInput
                  className={`border ${errors.note ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700`}
                  value={note}
                  onChangeText={(text) => {
                    setNote(text);
                    setErrors({ ...errors, note: undefined });
                  }}
                  placeholder="Provide detailed feedback on their performance..."
                  multiline
                  numberOfLines={5}
                  maxLength={500}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                <View className="flex-row items-center justify-between mt-1">
                  {errors.note ? (
                    <Text className="text-sm text-red-500">{errors.note}</Text>
                  ) : (
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Minimum 10 characters required</Text>
                  )}
                  <Text className="text-sm text-gray-500 dark:text-gray-400">{note.length}/500</Text>
                </View>
              </View>

              {/* Info Message */}
              <View className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex-row items-start gap-2">
                <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                <Text className="flex-1 text-sm text-yellow-800 dark:text-yellow-200">
                  This evaluation will be recorded and may affect the staff member's future opportunities. Please be fair
                  and constructive.
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
              className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex-row items-center gap-2 ${isSubmitting || !performance ? 'opacity-50' : ''}`}
              onPress={handleSubmit}
              disabled={isSubmitting || !performance}
            >
              {isSubmitting && <ActivityIndicator size="small" color="#FFF" />}
              <Text className="text-white font-medium">{isSubmitting ? 'Submitting...' : 'Submit Evaluation'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EvaluateStaffModal;
