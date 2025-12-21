import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { EventRegistrationDetail, getEventRegistrations } from '../services/event.service';
import { AppTextInput } from './ui';

interface RegistrationListModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: number;
  eventName?: string;
}

export default function RegistrationListModal({
  visible,
  onClose,
  eventId,
  eventName,
}: RegistrationListModalProps) {
  const [registrations, setRegistrations] = useState<EventRegistrationDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (visible) {
      fetchRegistrations();
    }
  }, [visible, eventId]);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const data = await getEventRegistrations(eventId);
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load registration list',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; bg: string; text: string }> = {
      PENDING: {
        label: 'Pending',
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
      },
      CONFIRMED: {
        label: 'Confirmed',
        bg: 'bg-green-100',
        text: 'text-green-800',
      },
      CHECKED_IN: {
        label: 'Checked In',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
      },
      REWARDED: {
        label: 'Rewarded',
        bg: 'bg-purple-100',
        text: 'text-purple-800',
      },
      NO_SHOW: {
        label: 'No Show',
        bg: 'bg-orange-100',
        text: 'text-orange-800',
      },
      CANCELED: {
        label: 'Canceled',
        bg: 'bg-red-100',
        text: 'text-red-800',
      },
    };

    const badge = badges[status] || {
      label: status,
      bg: 'bg-gray-100',
      text: 'text-gray-800',
    };

    return badge;
  };

  // Filter registrations based on search term
  const filteredRegistrations = registrations.filter((registration) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      registration.fullName.toLowerCase().includes(searchLower) ||
      registration.email.toLowerCase().includes(searchLower)
    );
  });

  // Calculate status counts from filtered registrations
  const statusCounts = {
    PENDING: filteredRegistrations.filter(r => r.status === 'PENDING').length,
    CONFIRMED: filteredRegistrations.filter(r => r.status === 'CONFIRMED').length,
    CHECKED_IN: filteredRegistrations.filter(r => r.status === 'CHECKED_IN').length,
    REWARDED: filteredRegistrations.filter(r => r.status === 'REWARDED').length,
    NO_SHOW: filteredRegistrations.filter(r => r.status === 'NO_SHOW').length,
    CANCELED: filteredRegistrations.filter(r => r.status === 'CANCELED').length,
  };

  const renderRegistrationItem = ({ item, index }: { item: EventRegistrationDetail; index: number }) => {
    const badge = getStatusBadge(item.status);
    
    return (
      <View className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-purple-600 items-center justify-center mr-3">
              <Text className="text-white font-semibold text-base">
                {item.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-base">
                {item.fullName}
              </Text>
              <Text className="text-gray-500 text-xs mt-0.5">{item.email}</Text>
            </View>
          </View>
          <View className={`px-2 py-1 rounded-full ${badge.bg}`}>
            <Text className={`text-xs font-medium ${badge.text}`}>{badge.label}</Text>
          </View>
        </View>

        {/* Details */}
        <View className="space-y-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 text-xs font-medium">Registered At:</Text>
            <Text className="text-gray-700 text-xs">
              {formatDateTime(item.registeredAt)}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 text-xs font-medium">Committed Points:</Text>
            <View className="flex-row items-center">
              <Text className="text-purple-600 font-semibold text-sm">
                {item.committedPoints}
              </Text>
              <Text className="text-purple-400 text-xs ml-1">pts</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-20 bg-white rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
            <View className="flex-row items-center flex-1">
              <Ionicons name="person-add" size={24} color="#9333EA" />
              <View className="ml-3 flex-1">
                <Text className="text-xl font-bold text-gray-900">Registration List</Text>
                {eventName && (
                  <Text className="text-sm text-gray-500 mt-0.5">{eventName}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#9333EA" />
              <Text className="text-gray-500 mt-4">Loading registrations...</Text>
            </View>
          ) : registrations.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Ionicons name="person-add-outline" size={64} color="#9CA3AF" />
              <Text className="text-lg font-semibold text-gray-900 mt-4">
                No registrations yet
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-2">
                Registration data will appear here
              </Text>
            </View>
          ) : (
            <View className="flex-1">
              {/* Search Box */}
              <View className="mx-4 mt-4">
                <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
                  <Ionicons name="search" size={18} color="#9CA3AF" />
                  <AppTextInput
                    className="flex-1 ml-2 text-sm"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                </View>
              </View>

              {/* Summary */}
              <View className="bg-purple-50 mx-4 mt-4 p-4 rounded-lg">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                  <Text className="text-purple-900 font-semibold ml-2">
                    Total Registrations: {filteredRegistrations.length}
                    {filteredRegistrations.length !== registrations.length && ` (filtered from ${registrations.length})`}
                  </Text>
                </View>

                {/* Status breakdown */}
                <View className="flex-row flex-wrap gap-2">
                  {statusCounts.PENDING > 0 && (
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-yellow-500" />
                      <Text className="text-xs text-gray-700">
                        Pending: <Text className="font-semibold">{statusCounts.PENDING}</Text>
                      </Text>
                    </View>
                  )}
                  {statusCounts.CONFIRMED > 0 && (
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-green-500" />
                      <Text className="text-xs text-gray-700">
                        Confirmed: <Text className="font-semibold">{statusCounts.CONFIRMED}</Text>
                      </Text>
                    </View>
                  )}
                  {statusCounts.CHECKED_IN > 0 && (
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-blue-500" />
                      <Text className="text-xs text-gray-700">
                        Checked In: <Text className="font-semibold">{statusCounts.CHECKED_IN}</Text>
                      </Text>
                    </View>
                  )}
                  {statusCounts.REWARDED > 0 && (
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-purple-500" />
                      <Text className="text-xs text-gray-700">
                        Rewarded: <Text className="font-semibold">{statusCounts.REWARDED}</Text>
                      </Text>
                    </View>
                  )}
                  {statusCounts.NO_SHOW > 0 && (
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-orange-500" />
                      <Text className="text-xs text-gray-700">
                        No Show: <Text className="font-semibold">{statusCounts.NO_SHOW}</Text>
                      </Text>
                    </View>
                  )}
                  {statusCounts.CANCELED > 0 && (
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-red-500" />
                      <Text className="text-xs text-gray-700">
                        Canceled: <Text className="font-semibold">{statusCounts.CANCELED}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* List */}
              {filteredRegistrations.length === 0 ? (
                <View className="flex-1 items-center justify-center py-12">
                  <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-4">No registrations found</Text>
                  <Text className="text-gray-400 text-sm">Try different search terms</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredRegistrations}
                  keyExtractor={(item) => item.userId.toString()}
                  renderItem={renderRegistrationItem}
                  contentContainerStyle={{ padding: 16 }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          )}

          {/* Footer */}
          <View className="p-6 border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-600 py-3 px-6 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
