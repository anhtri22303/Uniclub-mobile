import { Ionicons } from '@expo/vector-icons';
import { eventCheckinPublic, getEventByCode, timeObjectToString } from '@services/event.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

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
      console.error('Public event check-in error:', error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'An error occurred during check-in. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Check-in Failed',
        text2: String(errorMessage),
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="max-w-4xl mx-auto px-4 py-8">
          {/* Event Card */}
          <View className="bg-white rounded-2xl shadow-xl border-2 border-teal-200 overflow-hidden">
            {/* Header */}
            <View className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6">
              <View className="items-center mb-3">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className={`${typeBadge.bg} px-3 py-1 rounded-full`}>
                    <Text className={`${typeBadge.text} text-xs font-semibold`}>
                      {typeBadge.label}
                    </Text>
                  </View>
                  {event.status && (
                    <View
                      className={`px-3 py-1 rounded-full ${
                        event.status === 'ONGOING'
                          ? 'bg-green-100'
                          : event.status === 'APPROVED'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          event.status === 'ONGOING'
                            ? 'text-green-700'
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
              <Text className="text-white text-3xl font-extrabold text-center mb-2">
                {event.name}
              </Text>
              {event.description && (
                <Text className="text-white/90 text-center">{event.description}</Text>
              )}
            </View>

            {/* Event Details */}
            <View className="p-6">
              <View className="space-y-4 mb-6">
                {/* Date */}
                <View className="flex-row items-start bg-gray-50 p-4 rounded-lg">
                  <Ionicons name="calendar" size={20} color="#0D9488" />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Date</Text>
                    <Text className="text-gray-900 font-medium">
                      {formatDate(event.date)}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">{event.date}</Text>
                  </View>
                </View>

                {/* Time */}
                {(event.startTime || event.endTime) && (
                  <View className="flex-row items-start bg-gray-50 p-4 rounded-lg">
                    <Ionicons name="time" size={20} color="#0D9488" />
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-500 text-xs mb-1">Time</Text>
                      <Text className="text-gray-900 font-medium">
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
                  <View className="flex-row items-start bg-gray-50 p-4 rounded-lg">
                    <Ionicons name="location" size={20} color="#0D9488" />
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-500 text-xs mb-1">Location</Text>
                      <Text className="text-gray-900 font-medium">{event.locationName}</Text>
                    </View>
                  </View>
                )}

                {/* Attendance */}
                <View className="flex-row items-start bg-gray-50 p-4 rounded-lg">
                  <Ionicons name="people" size={20} color="#0D9488" />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Attendance</Text>
                    <Text className="text-gray-900 font-medium">
                      {event.currentCheckInCount || 0} / {event.maxCheckInCount || 0} checked in
                    </Text>
                  </View>
                </View>
              </View>

              {/* Host Club */}
              {event.hostClub && (
                <View className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6">
                  <Text className="text-gray-500 text-xs mb-1">Hosted by</Text>
                  <Text className="text-blue-900 font-semibold text-lg">
                    {event.hostClub.name}
                  </Text>
                </View>
              )}

              {/* Check-in Button */}
              <TouchableOpacity
                onPress={handleCheckin}
                disabled={isCheckinLoading || isCheckedIn}
                className={`py-6 rounded-xl flex-row items-center justify-center ${
                  isCheckedIn
                    ? 'bg-green-600'
                    : isCheckinLoading
                    ? 'bg-gray-400'
                    : 'bg-gradient-to-r from-teal-600 to-cyan-600'
                }`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                {isCheckinLoading ? (
                  <>
                    <ActivityIndicator size="large" color="white" />
                    <Text className="text-white text-2xl font-bold ml-3">Processing...</Text>
                  </>
                ) : isCheckedIn ? (
                  <>
                    <Ionicons name="checkmark-circle" size={32} color="white" />
                    <Text className="text-white text-2xl font-bold ml-3">Checked In!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={32} color="white" />
                    <Text className="text-white text-2xl font-bold ml-3">Check In Now</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Note */}
              <View className="mt-4">
                <Text className="text-center text-sm text-gray-600">
                  This is a public event - no registration required
                </Text>
                <Text className="text-center text-xs text-gray-500 mt-1">
                  Code: {event.checkInCode || checkInCode}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
