import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface EventCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  clubId: number;
  locations: Array<{ id: number; name: string; capacity?: number }>;
  clubs: Array<{ id: number; name: string }>;
  locationsLoading?: boolean;
  clubsLoading?: boolean;
}

export interface EventFormData {
  hostClubId: number;
  name: string;
  description: string;
  type: 'PUBLIC' | 'PRIVATE';
  date: string;
  startTime: string;
  endTime: string;
  locationId: number;
  maxCheckInCount: number;
  commitPointCost?: number;
  budgetPoints?: number;
  coHostClubIds?: number[];
}

export default function EventCreateModal({
  visible,
  onClose,
  onSubmit,
  clubId,
  locations,
  clubs,
  locationsLoading = false,
  clubsLoading = false,
}: EventCreateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    hostClubId: clubId,
    name: '',
    description: '',
    type: 'PUBLIC',
    date: '',
    startTime: '09:00:00',
    endTime: '11:00:00',
    locationId: 0,
    maxCheckInCount: 100,
    commitPointCost: 0,
    budgetPoints: 0,
    coHostClubIds: [],
  });
  const [selectedCoHostIds, setSelectedCoHostIds] = useState<number[]>([]);
  const [showCoHostPicker, setShowCoHostPicker] = useState(false);

  const resetForm = () => {
    setFormData({
      hostClubId: clubId,
      name: '',
      description: '',
      type: 'PUBLIC',
      date: '',
      startTime: '09:00:00',
      endTime: '11:00:00',
      locationId: 0,
      maxCheckInCount: 100,
      commitPointCost: 0,
      budgetPoints: 0,
      coHostClubIds: [],
    });
    setSelectedCoHostIds([]);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Missing Information', 'Please enter event name');
      return;
    }
    if (!formData.date) {
      Alert.alert('Missing Information', 'Please select event date');
      return;
    }
    if (!formData.locationId) {
      Alert.alert('Missing Information', 'Please select a location');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        coHostClubIds: selectedCoHostIds.length > 0 ? selectedCoHostIds : undefined,
      });
      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationChange = (locationId: number) => {
    const location = locations.find((loc) => loc.id === locationId);
    setFormData({
      ...formData,
      locationId,
      maxCheckInCount: location?.capacity || 100,
    });
  };

  const toggleCoHost = (clubId: number) => {
    if (selectedCoHostIds.includes(clubId)) {
      setSelectedCoHostIds(selectedCoHostIds.filter((id) => id !== clubId));
    } else {
      setSelectedCoHostIds([...selectedCoHostIds, clubId]);
    }
  };

  const availableCoHosts = clubs.filter((club) => club.id !== clubId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Create Event</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
            {/* Event Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Event Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Enter event name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                editable={!isSubmitting}
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="Describe your event..."
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            {/* Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
              <View className="bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'PUBLIC' | 'PRIVATE' })}
                  enabled={!isSubmitting}
                >
                  <Picker.Item label="Public" value="PUBLIC" />
                  <Picker.Item label="Private" value="PRIVATE" />
                </Picker>
              </View>
            </View>

            {/* Date */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Date <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="YYYY-MM-DD"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                editable={!isSubmitting}
              />
            </View>

            {/* Time Range */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Start Time <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                  placeholder="HH:MM:SS"
                  value={formData.startTime}
                  onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                  editable={!isSubmitting}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  End Time <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                  placeholder="HH:MM:SS"
                  value={formData.endTime}
                  onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Location */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Location <Text className="text-red-500">*</Text>
              </Text>
              {locationsLoading ? (
                <ActivityIndicator color="#0D9488" />
              ) : (
                <View className="bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={formData.locationId}
                    onValueChange={handleLocationChange}
                    enabled={!isSubmitting}
                  >
                    <Picker.Item label="Select a location" value={0} />
                    {locations.map((location) => (
                      <Picker.Item
                        key={location.id}
                        label={`${location.name}${location.capacity ? ` (${location.capacity})` : ''}`}
                        value={location.id}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            {/* Max Check-ins */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Max Check-ins</Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="100"
                value={String(formData.maxCheckInCount)}
                onChangeText={(text) =>
                  setFormData({ ...formData, maxCheckInCount: parseInt(text) || 100 })
                }
                keyboardType="number-pad"
                editable={!isSubmitting}
              />
            </View>

            {/* Point Cost */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Point Cost</Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="0"
                value={String(formData.commitPointCost || 0)}
                onChangeText={(text) =>
                  setFormData({ ...formData, commitPointCost: parseInt(text) || 0 })
                }
                keyboardType="number-pad"
                editable={!isSubmitting}
              />
            </View>

            {/* Budget Points */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Budget Points</Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholder="0"
                value={String(formData.budgetPoints || 0)}
                onChangeText={(text) =>
                  setFormData({ ...formData, budgetPoints: parseInt(text) || 0 })
                }
                keyboardType="number-pad"
                editable={!isSubmitting}
              />
            </View>

            {/* Co-Host Clubs */}
            {availableCoHosts.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Co-Host Clubs ({selectedCoHostIds.length} selected)
                </Text>
                <TouchableOpacity
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
                  onPress={() => setShowCoHostPicker(!showCoHostPicker)}
                  disabled={isSubmitting}
                >
                  <Text className="text-gray-600">
                    {selectedCoHostIds.length > 0
                      ? `${selectedCoHostIds.length} club(s) selected`
                      : 'Select co-host clubs'}
                  </Text>
                  <Ionicons
                    name={showCoHostPicker ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {showCoHostPicker && (
                  <View className="mt-2 bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-48">
                    <ScrollView>
                      {clubsLoading ? (
                        <ActivityIndicator color="#0D9488" />
                      ) : (
                        availableCoHosts.map((club) => (
                          <TouchableOpacity
                            key={club.id}
                            className="flex-row items-center py-2"
                            onPress={() => toggleCoHost(club.id)}
                            disabled={isSubmitting}
                          >
                            <View
                              className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                                selectedCoHostIds.includes(club.id)
                                  ? 'bg-teal-600 border-teal-600'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              {selectedCoHostIds.includes(club.id) && (
                                <Ionicons name="checkmark" size={16} color="white" />
                              )}
                            </View>
                            <Text className="text-gray-800">{club.name}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="px-6 py-4 border-t border-gray-200 flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-lg py-3 items-center ${
                isSubmitting ? 'bg-teal-400' : 'bg-teal-600'
              }`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold">Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

