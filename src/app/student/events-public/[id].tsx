import { Ionicons } from '@expo/vector-icons';
import {
  formatEventDateRange,
  getEventById,
  getEventDurationDays,
  getMyEventRegistrations,
  isMultiDayEvent,
  registerForEvent,
  timeObjectToString,
  type Event
} from '@services/event.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function PublicEventDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadEventDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getEventById(id);
      setEvent(data);

      // Check if user is registered
      const registrations = await getMyEventRegistrations();
      const registered = registrations.some((reg) => reg.eventId === data.id);
      setIsRegistered(registered);
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
      case 'PENDING_UNISTAFF':
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
      case 'COMPLETED':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: 'checkmark-done-circle' as const,
          label: 'Completed',
        };
      case 'ONGOING':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: 'play-circle' as const,
          label: 'Ongoing',
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
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canRegister = () => {
    if (!event) return false;
    if (event.status !== 'APPROVED') return false;
    if (!event.date || !event.endTime) return false;

    try {
      const now = new Date();
      const eventDate = new Date(event.date);
      const endTimeStr = timeObjectToString(event.endTime);
      const [hours, minutes] = endTimeStr.split(':').map(Number);
      const eventEndDateTime = new Date(eventDate);
      eventEndDateTime.setHours(hours, minutes, 0, 0);

      return now <= eventEndDateTime;
    } catch (error) {
      console.error('Error checking if can register:', error);
      return false;
    }
  };

  const handleRegisterClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmRegister = async () => {
    if (!event) return;
    
    setIsRegistering(true);
    setShowConfirmModal(false);
    
    try {
      const result = await registerForEvent(event.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: result.message || 'Successfully registered for the event!',
      });
      setIsRegistered(true);
      await loadEventDetail();
    } catch (error: any) {
      console.error('Error registering for event:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Failed to register for the event',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCheckIn = () => {
    router.push('/student/scan-qr');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
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
  const showRegisterButton = canRegister();

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
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-2xl font-bold text-gray-900 flex-1 mr-4">
                {event.name}
              </Text>
              <View className="bg-gray-100 px-3 py-1 rounded-lg">
                <Text className="text-gray-600 text-xs font-mono">#{event.id}</Text>
              </View>
            </View>

            {/* Badges */}
            <View className="flex-row gap-2 mb-4 flex-wrap">
              <View className={`flex-row items-center px-3 py-1.5 rounded-full ${statusBadge.bg}`}>
                <Ionicons name={statusBadge.icon} size={14} color="#16803d" />
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
            
            {isMultiDayEvent(event) ? (
              // Multi-day event display
              <View>
                <View className="bg-gray-50 p-4 rounded-lg flex-row items-center mb-3">
                  <View className="bg-teal-100 p-3 rounded-lg mr-4">
                    <Ionicons name="calendar" size={20} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">
                      {formatEventDateRange(event, 'en-US')}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {getEventDurationDays(event)} day{getEventDurationDays(event) > 1 ? 's' : ''} event
                    </Text>
                  </View>
                </View>

                {/* Schedule for each day */}
                {event.days && event.days.length > 0 && (
                  <View className="mt-2">
                    <Text className="text-sm font-semibold text-gray-600 mb-2">Event Schedule</Text>
                    {event.days.map((day, index) => (
                      <View key={day.id} className="bg-gray-50 p-3 rounded-lg mb-2 flex-row items-start border border-gray-200">
                        <View className="w-10 h-10 rounded-full bg-teal-100 items-center justify-center mr-3">
                          <Text className="text-sm font-bold text-teal-700">D{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-medium">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="time" size={12} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                              {day.startTime} - {day.endTime}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              // Single-day event display
              <View>
                <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
                  <View className="bg-teal-100 p-3 rounded-lg mr-4">
                    <Ionicons name="calendar" size={20} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">
                      {event.date ? formatDate(event.date) : 'Date TBA'}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {event.date || 'Date TBA'}
                    </Text>
                  </View>
                </View>

                {event.startTime && event.endTime && (
                  <View className="bg-gray-50 p-4 rounded-lg flex-row items-center mt-3">
                    <View className="bg-teal-100 p-3 rounded-lg mr-4">
                      <Ionicons name="time" size={20} color="#0D9488" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium">
                        {timeObjectToString(event.startTime)} - {timeObjectToString(event.endTime)}
                      </Text>
                      <Text className="text-gray-500 text-sm">Event Duration</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 mx-6" />

          {/* Location & Organization */}
          <View className="p-6 space-y-3">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Location & Organization
            </Text>

            {event.locationName && (
              <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
                <View className="bg-teal-100 p-3 rounded-lg mr-4">
                  <Ionicons name="location" size={20} color="#0D9488" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">{event.locationName}</Text>
                  <Text className="text-gray-500 text-sm">Event Venue</Text>
                </View>
              </View>
            )}

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

        {/* Points Information Card */}
        <View className="bg-white m-4 rounded-xl shadow-sm">
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Points Information
            </Text>

            <View className="flex-row mb-0 gap-3">
              {/* Commit Point Cost */}
              <View className="flex-1 bg-gray-50 p-4 rounded-lg">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="ticket" size={16} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1">Commit Cost</Text>
                </View>
                <Text className="text-xl font-bold text-gray-900">
                  {event.commitPointCost ?? 0}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">points</Text>
              </View>

              {/* Receive Points */}
              <View className="flex-1 bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="gift" size={16} color="#059669" />
                  <Text className="text-xs text-emerald-700 ml-1">Receive Point</Text>
                </View>
                <Text className="text-xl font-bold text-emerald-700">
                  {(() => {
                    const budgetPoints = event.budgetPoints ?? 0;
                    const maxCheckInCount = event.maxCheckInCount ?? 1;
                    return maxCheckInCount > 0 ? Math.floor(budgetPoints / maxCheckInCount) : 0;
                  })()}
                </Text>
                <Text className="text-xs text-emerald-600 mt-1">per full attendance</Text>
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

            {/* Registration Action */}
            {showRegisterButton && !isRegistered && (
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <View className="flex-row items-center mb-3">
                  <View className="bg-blue-100 p-2 rounded-full mr-3">
                    <Ionicons name="clipboard" size={20} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-blue-900 font-semibold">Ready to Join?</Text>
                    <Text className="text-blue-700 text-sm mt-1">
                      Register now to secure your spot
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleRegisterClick}
                  disabled={isRegistering}
                  className={`${isRegistering ? 'bg-gray-400' : 'bg-blue-600'} p-4 rounded-lg flex-row items-center justify-center`}
                >
                  <Ionicons name="person-add" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    {isRegistering ? 'Registering...' : 'Register for Event'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Check-in Action */}
            {event.status === 'APPROVED' && isRegistered && (
              <View className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <View className="flex-row items-center mb-3">
                  <View className="bg-teal-100 p-2 rounded-full mr-3">
                    <Ionicons name="qr-code" size={20} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-teal-900 font-semibold">Ready to Check In?</Text>
                    <Text className="text-teal-700 text-sm mt-1">
                      Scan QR code to mark your attendance
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

            {/* Status messages */}
            {!showRegisterButton && event.status === 'APPROVED' && (
              <View className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex-row">
                <Ionicons name="information-circle" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-medium text-sm">
                    Event Has Ended
                  </Text>
                  <Text className="text-gray-600 text-xs mt-1">
                    This event has ended. Registration and check-in are no longer available.
                  </Text>
                </View>
              </View>
            )}

            {event.status !== 'APPROVED' && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-row">
                <Ionicons name="alert-circle" size={20} color="#D97706" />
                <View className="ml-3 flex-1">
                  <Text className="text-yellow-800 font-medium text-sm">
                    Event Status: {statusBadge.label}
                  </Text>
                  <Text className="text-yellow-700 text-xs mt-1">
                    Registration is not available for events with this status.
                  </Text>
                </View>
              </View>
            )}

            {isRegistered && !showRegisterButton && event.status === 'APPROVED' && (
              <View className="bg-green-50 border border-green-200 rounded-lg p-4 flex-row">
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                <View className="ml-3 flex-1">
                  <Text className="text-green-800 font-medium text-sm">
                    You're Registered!
                  </Text>
                  <Text className="text-green-700 text-xs mt-1">
                    You have successfully registered for this event.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Points Information */}
        {event.budgetPoints !== undefined && event.budgetPoints > 0 && (
          <View className="bg-white m-4 rounded-xl shadow-sm">
            <View className="p-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Event Budget
              </Text>
              <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex-row items-center">
                <View className="bg-amber-100 p-3 rounded-full mr-4">
                  <Ionicons name="wallet" size={24} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-amber-900 text-2xl font-bold">
                    {event.budgetPoints.toLocaleString()} pts
                  </Text>
                  <Text className="text-amber-700 text-sm mt-1">
                    Total event budget points
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Co-hosted Clubs */}
        {event.coHostedClubs && event.coHostedClubs.length > 0 && (
          <View className="bg-white m-4 rounded-xl shadow-sm">
            <View className="p-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Co-hosting Clubs
              </Text>
              {event.coHostedClubs.map((club) => (
                <View
                  key={club.id}
                  className="bg-gray-50 p-4 rounded-lg flex-row items-center mb-2"
                >
                  <View className="bg-teal-100 p-2 rounded-full mr-3">
                    <Ionicons name="people" size={20} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">{club.name}</Text>
                    <Text className="text-gray-500 text-xs mt-1">Co-host Club</Text>
                  </View>
                  <View className={`px-2 py-1 rounded ${
                    club.coHostStatus === 'APPROVED' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      club.coHostStatus === 'APPROVED' ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {club.coHostStatus}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Registration Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Confirm Event Registration
            </Text>
            
            {event && (
              <>
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-gray-900">
                    {event.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {event.hostClub?.name}
                  </Text>
                </View>
                
                {event.budgetPoints > 0 && (
                  <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <Text className="text-sm font-medium text-yellow-800">
                      Commitment Required
                    </Text>
                    <Text className="text-sm text-yellow-700 mt-1">
                      {event.budgetPoints} points will be held as commitment.
                      These points will be returned after successful attendance.
                    </Text>
                  </View>
                )}
              </>
            )}
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-center text-gray-900 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmRegister}
                className="flex-1 bg-blue-600 py-3 rounded-lg"
              >
                <Text className="text-center text-white font-semibold">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
