import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TimeExtensionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (newDate: string, newStartTime: string, newEndTime: string, reason: string) => Promise<void>;
  currentDate: string;
  currentStartTime: string;
  currentEndTime: string;
  eventName: string;
}

const TimeExtensionModal: React.FC<TimeExtensionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  currentDate,
  currentStartTime,
  currentEndTime,
  eventName,
}) => {
  const [newDate, setNewDate] = useState(currentDate);
  const [newEndTime, setNewEndTime] = useState(currentEndTime);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ date?: string; endTime?: string; reason?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { date?: string; endTime?: string; reason?: string } = {};

    // Validate date
    if (!newDate) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(newDate);
      const currDate = new Date(currentDate);
      if (selectedDate < currDate) {
        newErrors.date = 'New date must be after or equal to current date';
      }
    }

    // Validate end time
    if (!newEndTime) {
      newErrors.endTime = 'End time is required';
    } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(newEndTime)) {
      newErrors.endTime = 'Invalid time format (HH:mm)';
    }

    // Validate time range
    if (newDate === currentDate && newEndTime <= currentStartTime) {
      newErrors.endTime = 'End time must be after current start time on the same date';
    }

    // Validate reason
    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    } else if (reason.trim().length > 500) {
      newErrors.reason = 'Reason must not exceed 500 characters';
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
      await onSubmit(newDate, currentStartTime, newEndTime, reason.trim());
      // Reset form on success
      setReason('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to extend event time:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNewDate(currentDate);
      setNewEndTime(currentEndTime);
      setReason('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white dark:bg-gray-800 rounded-2xl w-11/12 max-w-md max-h-5/6">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">Extend Event Time</Text>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="p-6 space-y-4">
              {/* Event Name */}
              <View>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Extending time for <Text className="font-semibold text-gray-900 dark:text-white">{eventName}</Text>
                </Text>
              </View>

              {/* Current Time Display */}
              <View className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Current Event Time</Text>
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="calendar" size={16} color="#3B82F6" />
                  <Text className="font-medium text-gray-900 dark:text-white">{currentDate}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time" size={16} color="#3B82F6" />
                  <Text className="font-medium text-gray-900 dark:text-white">
                    {currentStartTime} - {currentEndTime}
                  </Text>
                </View>
              </View>

              {/* New Date */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Date <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`border ${errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700`}
                  value={newDate}
                  onChangeText={(text) => {
                    setNewDate(text);
                    setErrors({ ...errors, date: undefined });
                  }}
                  placeholder="YYYY-MM-DD"
                  editable={!isSubmitting}
                />
                {errors.date && (
                  <Text className="text-sm text-red-500 mt-1">{errors.date}</Text>
                )}
              </View>

              {/* Start Time (Read-only) */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time <Text className="text-xs text-gray-500">(unchanged)</Text>
                </Text>
                <TextInput
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                  value={currentStartTime}
                  editable={false}
                />
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Start time cannot be changed. Only date and end time can be extended.
                </Text>
              </View>

              {/* New End Time */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New End Time <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`border ${errors.endTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700`}
                  value={newEndTime}
                  onChangeText={(text) => {
                    setNewEndTime(text);
                    setErrors({ ...errors, endTime: undefined });
                  }}
                  placeholder="HH:MM"
                  editable={!isSubmitting}
                />
                {errors.endTime && (
                  <Text className="text-sm text-red-500 mt-1">{errors.endTime}</Text>
                )}
              </View>

              {/* Reason */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Extension <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`border ${errors.reason ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-white dark:bg-gray-700`}
                  value={reason}
                  onChangeText={(text) => {
                    setReason(text);
                    setErrors({ ...errors, reason: undefined });
                  }}
                  placeholder="Please provide a detailed reason..."
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                <View className="flex-row items-center justify-between mt-1">
                  {errors.reason ? (
                    <Text className="text-sm text-red-500">{errors.reason}</Text>
                  ) : (
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Minimum 10 characters required</Text>
                  )}
                  <Text className="text-sm text-gray-500 dark:text-gray-400">{reason.length}/500</Text>
                </View>
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
              className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex-row items-center gap-2 ${isSubmitting ? 'opacity-50' : ''}`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && <ActivityIndicator size="small" color="#FFF" />}
              <Text className="text-white font-medium">{isSubmitting ? 'Saving...' : 'Save Extension'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TimeExtensionModal;
