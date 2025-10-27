import { Ionicons } from '@expo/vector-icons';
import type { Event } from '@services/event.service';
import { getEventById } from '@services/event.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function StudentEventDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEventDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getEventById(id);
      setEvent(data);
    } catch (error) {
      console.error('Failed to load event detail:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load event details',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEventDetail();
    setRefreshing(false);
  };

  useEffect(() => {
    loadEventDetail();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'APPROVED':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: 'checkmark-circle' as const,
          label: 'Approved',
        };
      case 'PENDING':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: 'time' as const,
          label: 'Pending',
        };
      case 'REJECTED':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: 'close-circle' as const,
          label: 'Rejected',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: 'ban' as const,
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: 'information-circle' as const,
          label: status,
        };
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'PUBLIC'
      ? { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Public' }
      : { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Private' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if the event is currently active
  const isEventActive = () => {
    if (!event) return false;

    // Must be APPROVED
    if (event.status !== 'APPROVED') return false;

    // Check if date and endTime are present
    if (!event.date || !event.endTime) return false;

    try {
      const now = new Date();
      const eventDate = new Date(event.date);
      const [hours, minutes] = event.endTime.split(':').map(Number);
      const eventEndDateTime = new Date(eventDate);
      eventEndDateTime.setHours(hours, minutes, 0, 0);

      return now <= eventEndDateTime;
    } catch (error) {
      console.error('Error checking event active status:', error);
      return false;
    }
  };

  const handleCheckIn = () => {
    // Navigate to QR scanner
    router.push('/student/scan-qr');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-teal-600 pt-12 pb-6 px-6">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Event Details</Text>
          </View>
        </View>

        {/* Loading */}
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-500 mt-4">Loading event details...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-teal-600 pt-12 pb-6 px-6">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Event Details</Text>
          </View>
        </View>

        {/* Not Found */}
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-900 text-lg font-semibold mt-4">
            Event Not Found
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            The event you're looking for doesn't exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-teal-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusBadge = getStatusBadge(event.status);
  const typeBadge = getTypeBadge(event.type);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-teal-600 pt-12 pb-6 px-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold flex-1" numberOfLines={1}>
              Event Details
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />
        }
      >
        {/* Event Header Card */}
        <View className="bg-white m-4 rounded-xl shadow-sm">
          <View className="p-6">
            {/* Event Name & ID */}
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-2xl font-bold text-gray-900 flex-1 mr-4">
                {event.name}
              </Text>
              <View className="bg-gray-100 px-3 py-1 rounded-lg">
                <Text className="text-gray-600 text-xs font-mono">#{event.id}</Text>
              </View>
            </View>

            {/* Badges */}
            <View className="flex-row gap-2 mb-4">
              <View className={`flex-row items-center px-3 py-1.5 rounded-full ${statusBadge.bg}`}>
                <Ionicons name={statusBadge.icon} size={14} color={statusBadge.text.replace('text-', '#')} />
                <Text className={`ml-1 text-xs font-semibold ${statusBadge.text}`}>
                  {statusBadge.label}
                </Text>
              </View>
              <View className={`px-3 py-1.5 rounded-full ${typeBadge.bg}`}>
                <Text className={`text-xs font-semibold ${typeBadge.text}`}>
                  {typeBadge.label}
                </Text>
              </View>
            </View>

            {/* Description */}
            {event.description && (
              <View className="mb-4">
                <Text className="text-gray-600 leading-6">{event.description}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 mx-6" />

          {/* Date & Time */}
          <View className="p-6 space-y-3">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Date & Time</Text>
            
            <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
              <View className="bg-teal-100 p-3 rounded-lg mr-4">
                <Ionicons name="calendar" size={20} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">{formatDate(event.date)}</Text>
                <Text className="text-gray-500 text-sm">{event.date}</Text>
              </View>
            </View>

            <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
              <View className="bg-teal-100 p-3 rounded-lg mr-4">
                <Ionicons name="time" size={20} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">
                  {event.startTime && event.endTime
                    ? `${event.startTime} - ${event.endTime}`
                    : event.time || 'Time not set'}
                </Text>
                <Text className="text-gray-500 text-sm">Event Duration</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 mx-6" />

          {/* Location & Organization */}
          <View className="p-6 space-y-3">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Location & Organization
            </Text>

            <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
              <View className="bg-teal-100 p-3 rounded-lg mr-4">
                <Ionicons name="location" size={20} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">{event.locationName}</Text>
                <Text className="text-gray-500 text-sm">Event Venue</Text>
              </View>
            </View>

            <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
              <View className="bg-teal-100 p-3 rounded-lg mr-4">
                <Ionicons name="people" size={20} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">{event.hostClub.name}</Text>
                <Text className="text-gray-500 text-sm">Host Club</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Attendance Information Card */}
        <View className="bg-white m-4 rounded-xl shadow-sm">
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Attendance Information
            </Text>

            {/* Capacity Stats */}
            <View className="flex-row mb-4 gap-2">
              <View className="flex-1 bg-blue-50 p-4 rounded-lg">
                <Text className="text-blue-600 text-xs font-medium mb-1">Max Capacity</Text>
                <Text className="text-blue-900 text-xl font-bold">
                  {event.maxCheckInCount}
                </Text>
              </View>
              <View className="flex-1 bg-green-50 p-4 rounded-lg">
                <Text className="text-green-600 text-xs font-medium mb-1">Checked In</Text>
                <Text className="text-green-900 text-xl font-bold">
                  {event.currentCheckInCount}
                </Text>
              </View>
              <View className="flex-1 bg-orange-50 p-4 rounded-lg">
                <Text className="text-orange-600 text-xs font-medium mb-1">Available</Text>
                <Text className="text-orange-900 text-xl font-bold">
                  {event.maxCheckInCount - event.currentCheckInCount}
                </Text>
              </View>
            </View>

            {/* Check-in Action */}
            {isEventActive() && (
              <View className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
                <View className="flex-row items-center mb-3">
                  <View className="bg-teal-100 p-2 rounded-full mr-3">
                    <Ionicons name="qr-code" size={20} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-teal-900 font-semibold">Ready to Check In?</Text>
                    <Text className="text-teal-700 text-xs mt-1">
                      Scan the QR code to mark your attendance
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCheckIn}
                  className="bg-teal-600 p-4 rounded-lg flex-row items-center justify-center"
                >
                  <Ionicons name="scan" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Scan QR Code to Check In
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Status message for non-active events */}
            {!isEventActive() && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-row">
                <Ionicons name="alert-circle" size={20} color="#D97706" />
                <View className="ml-3 flex-1">
                  <Text className="text-yellow-800 font-medium text-sm">
                    Check-in Unavailable
                  </Text>
                  <Text className="text-yellow-700 text-xs mt-1">
                    {event.status !== 'APPROVED'
                      ? `This event is not approved yet. Current status: ${event.status}`
                      : 'This event has ended. Check-in is no longer available.'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Points Information */}
        {event.points !== undefined && event.points > 0 && (
          <View className="bg-white m-4 rounded-xl shadow-sm">
            <View className="p-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Rewards
              </Text>
              <View className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 flex-row items-center">
                <View className="bg-amber-100 p-3 rounded-full mr-4">
                  <Ionicons name="star" size={24} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-amber-900 font-semibold text-lg">
                    {event.points} Points
                  </Text>
                  <Text className="text-amber-700 text-xs mt-1">
                    Earn points by attending this event
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Co-hosted Clubs */}
        {event.coHostClubs && event.coHostClubs.length > 0 && (
          <View className="bg-white m-4 rounded-xl shadow-sm">
            <View className="p-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Co-hosting Clubs
              </Text>
              {event.coHostClubs.map((club) => (
                <View
                  key={club.id}
                  className="bg-gray-50 p-4 rounded-lg flex-row items-center mb-2"
                >
                  <View className="bg-teal-100 p-2 rounded-lg mr-3">
                    <Ionicons name="people" size={18} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">{club.name}</Text>
                    <Text className="text-gray-500 text-xs">Club ID: {club.id}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

