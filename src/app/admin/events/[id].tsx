import { Ionicons } from '@expo/vector-icons';
import type { Event } from '@services/event.service';
import { deleteEvent, getEventById, putEventStatus } from '@services/event.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function AdminEventDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCheckInCode, setShowCheckInCode] = useState(false);

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

  const handleStatusChange = async (newStatus: string) => {
    if (!event || !id) return;

    Alert.alert(
      'Confirm Status Change',
      `Are you sure you want to change the status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setActionLoading(true);
              await putEventStatus(id, newStatus);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: `Event status changed to ${newStatus}`,
              });
              await loadEventDetail();
            } catch (error) {
              console.error('Failed to change status:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to change event status',
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = () => {
    if (!event || !id) return;

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await deleteEvent(id);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Event deleted successfully',
              });
              router.back();
            } catch (error) {
              console.error('Failed to delete event:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete event',
              });
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

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
              Event Management
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

        {/* Check-in Information Card */}
        <View className="bg-white m-4 rounded-xl shadow-sm">
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Check-in Information
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
                <Text className="text-orange-600 text-xs font-medium mb-1">Remaining</Text>
                <Text className="text-orange-900 text-xl font-bold">
                  {event.maxCheckInCount - event.currentCheckInCount}
                </Text>
              </View>
            </View>

            {/* Check-in Code */}
            <View className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-blue-900 font-semibold">Check-in Code</Text>
                  <Text className="text-blue-700 text-xs mt-1">
                    Internal reference code
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="bg-white px-4 py-3 rounded-lg flex-1 mr-3">
                  <Text className="font-mono text-lg font-bold text-blue-800 text-center">
                    {showCheckInCode ? event.checkInCode : '••••••••'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCheckInCode(!showCheckInCode)}
                  className="bg-blue-600 px-4 py-3 rounded-lg"
                >
                  <Text className="text-white font-semibold">
                    {showCheckInCode ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Admin Actions Card */}
        <View className="bg-white m-4 rounded-xl shadow-sm">
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Admin Actions
            </Text>

            {/* Status Change Buttons */}
            <Text className="text-sm text-gray-600 mb-3 font-medium">Change Status:</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              <TouchableOpacity
                onPress={() => handleStatusChange('APPROVED')}
                disabled={actionLoading || event.status === 'APPROVED'}
                className={`flex-1 min-w-[45%] p-3 rounded-lg flex-row items-center justify-center ${
                  event.status === 'APPROVED' ? 'bg-gray-100' : 'bg-green-600'
                }`}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={event.status === 'APPROVED' ? '#9CA3AF' : 'white'}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    event.status === 'APPROVED' ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Approve
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusChange('REJECTED')}
                disabled={actionLoading || event.status === 'REJECTED'}
                className={`flex-1 min-w-[45%] p-3 rounded-lg flex-row items-center justify-center ${
                  event.status === 'REJECTED' ? 'bg-gray-100' : 'bg-red-600'
                }`}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={event.status === 'REJECTED' ? '#9CA3AF' : 'white'}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    event.status === 'REJECTED' ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Reject
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusChange('CANCELLED')}
                disabled={actionLoading || event.status === 'CANCELLED'}
                className={`flex-1 min-w-[45%] p-3 rounded-lg flex-row items-center justify-center ${
                  event.status === 'CANCELLED' ? 'bg-gray-100' : 'bg-gray-600'
                }`}
              >
                <Ionicons
                  name="ban"
                  size={18}
                  color={event.status === 'CANCELLED' ? '#9CA3AF' : 'white'}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    event.status === 'CANCELLED' ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusChange('PENDING')}
                disabled={actionLoading || event.status === 'PENDING'}
                className={`flex-1 min-w-[45%] p-3 rounded-lg flex-row items-center justify-center ${
                  event.status === 'PENDING' ? 'bg-gray-100' : 'bg-yellow-600'
                }`}
              >
                <Ionicons
                  name="time"
                  size={18}
                  color={event.status === 'PENDING' ? '#9CA3AF' : 'white'}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    event.status === 'PENDING' ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Set Pending
                </Text>
              </TouchableOpacity>
            </View>

            {/* Delete Button */}
            <View className="h-px bg-gray-200 my-4" />
            <Text className="text-sm text-gray-600 mb-3 font-medium">Danger Zone:</Text>
            <TouchableOpacity
              onPress={handleDeleteEvent}
              disabled={actionLoading}
              className="bg-red-600 p-4 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="trash" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Delete Event</Text>
            </TouchableOpacity>
          </View>
        </View>

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
                  className="bg-gray-50 p-4 rounded-lg flex-row items-center justify-between mb-2"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-teal-100 p-2 rounded-lg mr-3">
                      <Ionicons name="people" size={18} color="#0D9488" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium">{club.name}</Text>
                      <Text className="text-gray-500 text-xs">Club ID: {club.id}</Text>
                    </View>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      club.coHostStatus === 'APPROVED'
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        club.coHostStatus === 'APPROVED'
                          ? 'text-green-800'
                          : 'text-gray-800'
                      }`}
                    >
                      {club.coHostStatus}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Action Loading Overlay */}
      {actionLoading && (
        <View className="absolute inset-0 bg-black/30 justify-center items-center">
          <View className="bg-white p-6 rounded-xl shadow-lg">
            <ActivityIndicator size="large" color="#0D9488" />
            <Text className="text-gray-900 mt-4 font-medium">Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

