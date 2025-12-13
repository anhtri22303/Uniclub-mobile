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
      CHECKED_IN: {
        label: 'Checked In',
        bg: 'bg-green-100',
        text: 'text-green-800',
      },
      CONFIRMED: {
        label: 'Confirmed',
        bg: 'bg-green-100',
        text: 'text-green-800',
      },
      REGISTERED: {
        label: 'Registered',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
      },
      CANCELLED: {
        label: 'Cancelled',
        bg: 'bg-red-100',
        text: 'text-red-800',
      },
      REFUNDED: {
        label: 'Refunded',
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
      },
    };

    const badge = badges[status] || {
      label: status,
      bg: 'bg-gray-100',
      text: 'text-gray-800',
    };

    return badge;
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
              {/* Summary */}
              <View className="bg-purple-50 mx-4 mt-4 p-4 rounded-lg">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                  <Text className="text-purple-900 font-semibold ml-2">
                    Total Registrations: {registrations.length}
                  </Text>
                </View>
              </View>

              {/* List */}
              <FlatList
                data={registrations}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={renderRegistrationItem}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
              />
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
