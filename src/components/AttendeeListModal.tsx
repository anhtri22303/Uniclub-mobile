import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { EventAttendee, getEventCheckin } from '../services/event.service';

interface AttendeeListModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: number;
  eventName?: string;
}

export default function AttendeeListModal({
  visible,
  onClose,
  eventId,
  eventName,
}: AttendeeListModalProps) {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAttendees();
    }
  }, [visible, eventId]);

  const fetchAttendees = async () => {
    setIsLoading(true);
    try {
      const data = await getEventCheckin(eventId);
      setAttendees(data);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load attendee list',
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

  const getAttendanceBadge = (level: string) => {
    switch (level) {
      case 'FULL':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Full' };
      case 'PARTIAL':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partial' };
      case 'NONE':
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'None' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'None' };
    }
  };

  const renderAttendeeItem = ({ item, index }: { item: EventAttendee; index: number }) => {
    const badge = getAttendanceBadge(item.attendanceLevel);
    
    return (
      <View className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-3">
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

        {/* Check-in times */}
        <View className="space-y-2">
          <View className="flex-row items-center">
            <View className="w-24">
              <Text className="text-gray-600 text-xs font-medium">Check-in:</Text>
            </View>
            {item.checkinAt ? (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text className="text-gray-700 text-xs ml-1">
                  {formatDateTime(item.checkinAt)}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="close-circle" size={14} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1">-</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center">
            <View className="w-24">
              <Text className="text-gray-600 text-xs font-medium">Check-mid:</Text>
            </View>
            {item.checkMidAt ? (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text className="text-gray-700 text-xs ml-1">
                  {formatDateTime(item.checkMidAt)}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="close-circle" size={14} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1">-</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center">
            <View className="w-24">
              <Text className="text-gray-600 text-xs font-medium">Check-out:</Text>
            </View>
            {item.checkoutAt ? (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text className="text-gray-700 text-xs ml-1">
                  {formatDateTime(item.checkoutAt)}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="close-circle" size={14} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1">-</Text>
              </View>
            )}
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
              <Ionicons name="people" size={24} color="#2563EB" />
              <View className="ml-3 flex-1">
                <Text className="text-xl font-bold text-gray-900">Attendee List</Text>
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
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-gray-500 mt-4">Loading attendees...</Text>
            </View>
          ) : attendees.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Ionicons name="people-outline" size={64} color="#9CA3AF" />
              <Text className="text-lg font-semibold text-gray-900 mt-4">
                No attendees yet
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-2">
                Check-in data will appear here
              </Text>
            </View>
          ) : (
            <View className="flex-1">
              {/* Summary */}
              <View className="bg-blue-50 mx-4 mt-4 p-4 rounded-lg">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#1E40AF" />
                  <Text className="text-blue-900 font-semibold ml-2">
                    Total Check-ins: {attendees.length}
                  </Text>
                </View>
              </View>

              {/* List */}
              <FlatList
                data={attendees}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={renderAttendeeItem}
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
