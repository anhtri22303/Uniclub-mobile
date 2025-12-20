import { eventCheckin } from '@/services/checkin.service';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

// Phase configuration with colors and labels
const PHASE_CONFIG = {
  START: {
    label: 'START',
    description: 'Beginning of event',
    colors: ['#10b981', '#059669'] as const, // green
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
    textColor: 'text-green-700',
  },
  MID: {
    label: 'MID',
    description: 'Middle of event',
    colors: ['#3b82f6', '#2563eb'] as const, // blue
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700',
  },
  END: {
    label: 'END',
    description: 'End of event',
    colors: ['#a855f7', '#9333ea'] as const, // purple
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-700',
  },
  NONE: {
    label: 'GENERAL',
    description: 'Event check-in',
    colors: ['#6b7280', '#4b5563'] as const, // gray
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-500',
    textColor: 'text-gray-700',
  },
};

export default function MemberCheckinByTimeAndCodePage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Get time (phase) and token from URL
  const checkInTime = params?.time as string | undefined;
  const checkInCode = params?.code as string | undefined;

  // Get phase configuration
  const phaseKey = (checkInTime?.toUpperCase() || 'NONE') as keyof typeof PHASE_CONFIG;
  const phaseConfig = PHASE_CONFIG[phaseKey] || PHASE_CONFIG.NONE;

  useEffect(() => {
    console.debug('Check-in phase from URL:', checkInTime);
    console.debug('Check-in token from URL:', checkInCode);
    
    // Validate parameters on mount
    if (!checkInCode || typeof checkInCode !== 'string') {
      Toast.show({
        type: 'error',
        text1: 'Invalid Token',
        text2: 'Check-in token is missing or invalid',
        visibilityTime: 3000,
        position: 'top',
      });
      setTimeout(() => router.back(), 3000);
      return;
    }

    if (!checkInTime || typeof checkInTime !== 'string') {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phase',
        text2: 'Check-in phase is missing or invalid',
        visibilityTime: 3000,
        position: 'top',
      });
      setTimeout(() => router.back(), 3000);
    }
  }, [checkInCode, checkInTime]);

  const handleCheckin = async () => {
    if (!checkInCode || typeof checkInCode !== 'string') {
      Toast.show({
        type: 'error',
        text1: 'Invalid Token',
        text2: 'Check-in token is missing or invalid',
        visibilityTime: 3000,
        position: 'top',
      });
      return;
    }

    if (!checkInTime || typeof checkInTime !== 'string') {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phase',
        text2: 'Check-in phase is missing or invalid',
        visibilityTime: 3000,
        position: 'top',
      });
      return;
    }

    if (isCheckinLoading || isCheckedIn) return;

    setIsCheckinLoading(true);

    try {
      // Call event check-in API with JWT token and phase
      // Using START, MID, END directly as per API requirements
      const response = await eventCheckin(checkInCode, checkInTime.toUpperCase());

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Check-in Successful! 🎉',
        text2: response?.message || "You've successfully checked in to the event!",
        visibilityTime: 3000,
        position: 'top',
      });

      setIsCheckedIn(true);
      
      // Redirect after successful check-in
      setTimeout(() => {
        router.replace('/student/events');
      }, 2000);
    } catch (error: any) {
      // Extract error message
      const errorMessage =
        error?.message || 'An error occurred during check-in. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Check-in Failed',
        text2: String(errorMessage),
        visibilityTime: 3000,
        position: 'top',
      });

      // Redirect after showing error
      setTimeout(() => {
        router.replace('/student/events');
      }, 2000);
    } finally {
      setIsCheckinLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-4 py-5 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 -ml-2"
          >
            <ArrowLeft size={28} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold">Event Check-in</Text>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          {/* Icon Circle */}
          <View className="w-36 h-36 rounded-full bg-blue-100 items-center justify-center mb-8">
            {isCheckedIn ? (
              <CheckCircle size={72} color="#10b981" />
            ) : (
              <CheckCircle size={72} color="#3b82f6" strokeWidth={2} />
            )}
          </View>

          {/* Title */}
          <Text className="text-4xl font-extrabold text-center mb-4 text-gray-900">
            Event Check-in
          </Text>

          {/* Subtitle */}
          <Text className="text-lg text-center text-gray-600 mb-6">
            {isCheckedIn
              ? 'Successfully checked in!'
              : 'Tap the button below to check in'}
          </Text>

          {/* Phase Badge */}
          <View className={`rounded-full px-8 py-4 border-2 ${phaseConfig.borderColor} ${phaseConfig.bgColor} flex-row items-center mb-6`}>
            <Clock size={28} color={phaseConfig.colors[0]} />
            <View className="ml-4">
              <Text className={`text-xl font-bold ${phaseConfig.textColor}`}>
                {phaseConfig.label}
              </Text>
              <Text className={`text-sm ${phaseConfig.textColor}`}>
                {phaseConfig.description}
              </Text>
            </View>
          </View>

        </View>

        {/* Check-in Button */}
        <View className="w-full">
          <TouchableOpacity
            onPress={handleCheckin}
            disabled={isCheckinLoading || isCheckedIn}
            activeOpacity={0.8}
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <LinearGradient
              colors={
                isCheckedIn
                  ? ['#10b981', '#059669']
                  : phaseConfig.colors
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-7"
            >
              <View className="flex-row items-center justify-center">
                {isCheckinLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#fff" className="mr-4" />
                    <Text className="text-white text-2xl font-bold">
                      Processing...
                    </Text>
                  </>
                ) : isCheckedIn ? (
                  <>
                    <CheckCircle size={36} color="#fff" strokeWidth={3} />
                    <Text className="text-white text-2xl font-bold ml-4">
                      Checked In!
                    </Text>
                  </>
                ) : (
                  <>
                    <CheckCircle size={36} color="#fff" strokeWidth={3} />
                    <Text className="text-white text-2xl font-bold ml-4">
                      Check In Now
                    </Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        {!isCheckedIn && (
          <View className={`mt-10 rounded-xl p-5 border ${phaseConfig.borderColor} ${phaseConfig.bgColor}`}>
            <Text className={`text-base font-medium text-center ${phaseConfig.textColor}`}>
              💡 Make sure you're at the event venue before checking in
            </Text>
            <Text className={`text-sm text-center mt-3 ${phaseConfig.textColor}`}>
              This QR code is valid for a limited time
            </Text>
            <Text className={`text-sm text-center font-bold mt-2 ${phaseConfig.textColor}`}>
              Phase: {phaseConfig.label}
            </Text>
          </View>
        )}

        {/* Success Message */}
        {isCheckedIn && (
          <View className="mt-10 bg-green-50 rounded-xl p-5 border border-green-200">
            <Text className="text-base text-green-900 text-center font-medium mb-2">
                You have successfully checked in to this event
            </Text>
            <Text className="text-sm text-green-700 text-center">
              Redirecting to events page...
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View className="px-6 py-5 bg-white border-t border-gray-200">
        <Text className="text-sm text-gray-500 text-center">
          UniClub Event Management System
        </Text>
      </View>
    </SafeAreaView>
  );
}