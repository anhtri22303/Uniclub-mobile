import { Ionicons } from '@expo/vector-icons';
import { eventCheckinPublic, formatEventDateRange, getEventByCode, isMultiDayEvent, timeObjectToString } from '@services/event.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LogBox,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Suppress specific error notifications
LogBox.ignoreLogs([
  'AxiosError',
  'Request failed with status code',
  'Public event check-in error',
]);

export default function StudentPublicCheckinPage() {
  const router = useRouter();
  const { checkInCode } = useLocalSearchParams<{ checkInCode: string }>();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Load event details when component mounts
  useEffect(() => {
    const loadEventDetail = async () => {
      if (!checkInCode) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Check-in Code',
          text2: 'Check-in code is missing from the URL',
        });
        setLoading(false);
        return;
      }

      try {
        const eventData = await getEventByCode(checkInCode as string);
        setEvent(eventData);
      } catch (error: any) {
        console.error('Error loading event:', error);
        Toast.show({
          type: 'error',
          text1: 'Event Not Found',
          text2: error?.response?.data?.message || 'Could not load event details',
        });
      } finally {
        setLoading(false);
      }
    };

    loadEventDetail();
  }, [checkInCode]);

  const handleCheckin = async () => {
    if (!checkInCode || typeof checkInCode !== 'string') {
      Toast.show({
        type: 'error',
        text1: 'Invalid Check-in Code',
        text2: 'Check-in code is missing or invalid',
      });
      return;
    }

    if (isCheckinLoading || isCheckedIn) return;

    setIsCheckinLoading(true);

    try {
      const response = await eventCheckinPublic(checkInCode);


      Toast.show({
        type: 'success',
        text1: 'Check-in Successful! 🎉',
        text2: response?.message || "You've successfully checked in to the event!",
      });

      setIsCheckedIn(true);

      // Redirect after successful check-in
      setTimeout(() => {
        router.push('/student/events');
      }, 2000);
    } catch (error: any) {
      // Extract error message from response
      let errorMessage = 'An error occurred during check-in. Please try again.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message && !error.message.includes('status code')) {
        errorMessage = error.message;
      }

      // Show toast notification only (suppressing console errors)
      Toast.show({
        type: 'error',
        text1: 'Check-in Failed',
        text2: errorMessage,
        visibilityTime: 3000,
        position: 'top',
      });
    } finally {
      setIsCheckinLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeBadge = (type: string) => {
    const typeUpper = type?.toUpperCase();
    switch (typeUpper) {
      case 'PUBLIC':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500', label: 'PUBLIC' };
      case 'PRIVATE':
        return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500', label: 'PRIVATE' };
      case 'SPECIAL':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500', label: 'SPECIAL' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-500', label: type || 'UNKNOWN' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' };
      case 'APPROVED':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' };
      case 'COMPLETED':
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-500' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="mt-4 text-lg text-gray-600">Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-4">
          <View className="items-center">
            <Text className="text-6xl mb-4"> </Text>
            <Text className="text-3xl font-bold text-red-600 mb-2">Event Not Found</Text>
            <Text className="text-gray-600 text-center mb-6">
              The event you're looking for doesn't exist or has been removed.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/student/events')}
              className="bg-teal-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Back to Events</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const typeBadge = getTypeBadge(event.type);
  const statusBadge = getStatusBadge(event.status);
  const isMultiDay = isMultiDayEvent(event);

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-teal-50 to-blue-50">
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          {/* Event Card with enhanced shadow and border */}
          <View className="bg-white rounded-3xl shadow-2xl border-2 border-teal-100 overflow-hidden">
            {/* Header Section with Gradient Background */}
            <View className="bg-gradient-to-r from-teal-500 to-blue-500 px-4 pt-6 pb-4">
              {/* Type and Status Badges */}
              <View className="flex-row items-center justify-center gap-2 mb-4">
                <View className={`${typeBadge.bg} px-4 py-1.5 rounded-full border ${typeBadge.border}`}>
                  <Text className={`${typeBadge.text} text-xs font-bold`}>
                    {typeBadge.label}
                  </Text>
                </View>
                {event.status && (
                  <View className={`${statusBadge.bg} px-4 py-1.5 rounded-full border ${statusBadge.border}`}>
                    <Text className={`${statusBadge.text} text-xs font-bold`}>
                      {event.status}
                    </Text>
                  </View>
                )}
              </View>

              {/* Event Title */}
              <View className="items-center">
                <Text className="text-white text-3xl font-extrabold text-center mb-2">
                  {event.name}
                </Text>
                {event.description && (
                  <Text className="text-teal-50 text-base text-center px-4">{event.description}</Text>
                )}
              </View>
            </View>

            {/* Event Details Section */}
            <View className="px-5 py-6">
              <View className="space-y-4">
                {/* Date and Time - Enhanced for Multi-day Events */}
                <View className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                  {isMultiDay && event.days ? (
                    <>
                      <View className="flex-row items-center mb-3">
                        <View className="w-12 h-12 bg-teal-500 rounded-xl items-center justify-center">
                          <Ionicons name="calendar" size={24} color="#FFF" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-teal-900 text-xs font-semibold mb-1">Multi-Day Event</Text>
                          <Text className="text-teal-800 font-bold text-base">
                            {formatEventDateRange(event)}
                          </Text>
                          <Text className="text-teal-600 text-xs mt-1">
                            {event.days.length} day{event.days.length > 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      {/* Show individual days */}
                      <View className="mt-3 space-y-2">
                        {event.days.map((day: any, index: number) => (
                          <View key={index} className="bg-white rounded-lg p-3 border border-teal-100">
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center flex-1">
                                <View className="w-8 h-8 bg-teal-500 rounded-full items-center justify-center mr-2">
                                  <Text className="text-white text-xs font-bold">{index + 1}</Text>
                                </View>
                                <View className="flex-1">
                                  <Text className="text-gray-900 font-semibold text-sm">
                                    {formatDate(day.date)}
                                  </Text>
                                  <Text className="text-gray-500 text-xs">
                                    {day.startTime} - {day.endTime}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Single-day event display */}
                      <View className="flex-row items-center mb-3">
                        <View className="w-12 h-12 bg-teal-500 rounded-xl items-center justify-center">
                          <Ionicons name="calendar" size={24} color="#FFF" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-teal-900 text-xs font-semibold mb-1">Date</Text>
                          <Text className="text-teal-800 font-bold text-base">
                            {formatDate(event.date || event.startDate)}
                          </Text>
                          <Text className="text-teal-600 text-xs">{event.date || event.startDate}</Text>
                        </View>
                      </View>
                      {/* Time */}
                      {(event.startTime || event.endTime) && (
                        <View className="flex-row items-center bg-white rounded-lg p-3 border border-teal-100">
                          <View className="w-10 h-10 bg-teal-100 rounded-lg items-center justify-center">
                            <Ionicons name="time" size={20} color="#0D9488" />
                          </View>
                          <View className="ml-3 flex-1">
                            <Text className="text-gray-500 text-xs mb-1">Time</Text>
                            <Text className="text-gray-900 font-semibold text-sm">
                              {event.startTime && event.endTime
                                ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(event.endTime)}`
                                : 'Time not specified'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* Location */}
                {event.locationName && (
                  <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-blue-500 rounded-xl items-center justify-center">
                        <Ionicons name="location" size={24} color="#FFF" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-blue-900 text-xs font-semibold mb-1">Location</Text>
                        <Text className="text-blue-800 font-bold text-base">{event.locationName}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Attendance */}
                <View className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-purple-500 rounded-xl items-center justify-center">
                      <Ionicons name="people" size={24} color="#FFF" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-purple-900 text-xs font-semibold mb-1">Attendance</Text>
                      <Text className="text-purple-800 font-bold text-base">
                        {event.currentCheckInCount || 0} / {event.maxCheckInCount || 0} checked in
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Host Club - Enhanced with gradient */}
              {event.hostClub && (
                <View className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-blue-500 rounded-xl items-center justify-center">
                      <Ionicons name="business" size={24} color="#FFF" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-blue-600 text-xs font-semibold mb-1">Hosted by</Text>
                      <Text className="text-blue-900 font-extrabold text-lg">
                        {event.hostClub.name}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Separator */}
              <View className="my-6 h-px bg-gray-200" />

              {/* Check-in Button - Enhanced with gradient and animation effect */}
              <TouchableOpacity
                onPress={handleCheckin}
                disabled={isCheckinLoading || isCheckedIn}
                activeOpacity={0.8}
                className={`py-6 rounded-2xl flex-row items-center justify-center shadow-xl ${
                  isCheckedIn
                    ? 'bg-white border-4 border-green-500'
                    : isCheckinLoading
                    ? 'bg-gray-300'
                    : 'bg-gradient-to-r from-teal-600 to-blue-600'
                }`}
                style={{
                  shadowColor: isCheckedIn ? '#22C55E' : isCheckinLoading ? '#D1D5DB' : '#0D9488',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                {isCheckinLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#666" />
                    <Text className="text-gray-700 text-xl font-bold ml-3">Processing...</Text>
                  </>
                ) : isCheckedIn ? (
                  <>
                    <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                    <Text className="text-green-600 text-2xl font-extrabold ml-3">Checked In!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={32} color="#FFF" />
                    <Text className="text-white text-2xl font-extrabold ml-3">Check In Now</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Note with check-in code */}
              <View className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <Text className="text-center text-sm text-gray-600 mb-2">
                  This is a public event - no registration required
                </Text>
                <View className="flex-row items-center justify-center">
                  <Text className="text-xs text-gray-500">Check-in Code: </Text>
                  <Text className="text-xs text-gray-700 font-mono font-bold">{event.checkInCode}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
}
