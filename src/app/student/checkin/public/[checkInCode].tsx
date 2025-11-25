import { Ionicons } from '@expo/vector-icons';
import { eventCheckinPublic, getEventByCode, timeObjectToString } from '@services/event.service';
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
      console.log('Starting public event check-in with code:', checkInCode);
      const response = await eventCheckinPublic(checkInCode);

      console.log('Public event check-in response:', response);

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
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'PUBLIC' };
      case 'PRIVATE':
        return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'PRIVATE' };
      case 'SPECIAL':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'SPECIAL' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: type || 'UNKNOWN' };
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
            <Text className="text-6xl mb-4">❌</Text>
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          {/* Event Card */}
          <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Type and Status Badges */}
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row items-center gap-2">
                <View className={`${typeBadge.bg} px-3 py-1 rounded-full`}>
                  <Text className={`${typeBadge.text} text-xs font-semibold`}>
                    {typeBadge.label}
                  </Text>
                </View>
                {event.status && (
                  <View
                    className={`px-3 py-1 rounded-full ${
                      event.status === 'ONGOING'
                        ? 'bg-purple-100'
                        : event.status === 'APPROVED'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        event.status === 'ONGOING'
                          ? 'text-purple-700'
                          : event.status === 'APPROVED'
                          ? 'text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {event.status}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Event Title */}
            <View className="px-4 pb-4">
              <Text className="text-black text-2xl font-bold mb-1">
                {event.name}
              </Text>
              {event.description && (
                <Text className="text-gray-600 text-sm">{event.description}</Text>
              )}
            </View>

            {/* Event Details */}
            <View className="px-4 pb-4">
              <View className="space-y-3">
                {/* Date */}
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-teal-100 rounded-lg items-center justify-center">
                    <Ionicons name="calendar" size={20} color="#0D9488" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-500 text-xs">Date</Text>
                    <Text className="text-black font-semibold text-sm">
                      {formatDate(event.date)}
                    </Text>
                    <Text className="text-gray-400 text-xs">{event.date}</Text>
                  </View>
                </View>

                {/* Time */}
                {(event.startTime || event.endTime) && (
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-teal-100 rounded-lg items-center justify-center">
                      <Ionicons name="time" size={20} color="#0D9488" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-500 text-xs">Time</Text>
                      <Text className="text-black font-semibold text-sm">
                        {event.startTime && event.endTime
                          ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(
                              event.endTime
                            )}`
                          : 'Time not specified'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Location */}
                {event.locationName && (
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-teal-100 rounded-lg items-center justify-center">
                      <Ionicons name="location" size={20} color="#0D9488" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-500 text-xs">Location</Text>
                      <Text className="text-black font-semibold text-sm">{event.locationName}</Text>
                    </View>
                  </View>
                )}

                {/* Attendance */}
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-teal-100 rounded-lg items-center justify-center">
                    <Ionicons name="people" size={20} color="#0D9488" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-500 text-xs">Attendance</Text>
                    <Text className="text-black font-semibold text-sm">
                      {event.currentCheckInCount || 0} / {event.maxCheckInCount || 0} checked in
                    </Text>
                  </View>
                </View>
              </View>

              {/* Host Club */}
              {event.hostClub && (
                <View className="mt-4 bg-blue-50 p-3 rounded-lg">
                  <Text className="text-gray-500 text-xs">Hosted by</Text>
                  <Text className="text-blue-900 font-bold text-base">
                    {event.hostClub.name}
                  </Text>
                </View>
              )}

              {/* Check-in Button */}
              <TouchableOpacity
                onPress={handleCheckin}
                disabled={isCheckinLoading || isCheckedIn}
                className={`mt-6 py-4 rounded-xl flex-row items-center justify-center ${
                  isCheckedIn
                    ? 'bg-white border-2 border-green-500'
                    : isCheckinLoading
                    ? 'bg-gray-200'
                    : 'bg-teal-600'
                }`}
              >
                {isCheckinLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#666" />
                    <Text className="text-gray-600 text-base font-semibold ml-2">Processing...</Text>
                  </>
                ) : isCheckedIn ? (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                    <Text className="text-green-600 text-base font-bold ml-2">Checked In!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
                    <Text className="text-white text-base font-bold ml-2">Check In Now</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Note */}
              <View className="mt-4 pb-2">
                <Text className="text-center text-xs text-gray-500">
                  This is a public event - no registration required
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
}
