import { checkin } from '@/services/checkin.service';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function MemberCheckinByCodePage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Get token from URL params - This is the token from generateCode API
  const token = params?.code as string | undefined;

  useEffect(() => {
    console.debug('Check-in token from URL:', token);
    
    // Validate token on mount
    if (!token || typeof token !== 'string') {
      Alert.alert(
        'Invalid Token',
        'Check-in token is missing or invalid',
        [
          {
            text: 'Go Back',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [token]);

  const handleCheckin = async () => {
    if (!token || typeof token !== 'string') {
      Alert.alert('Invalid Token', 'Check-in token is missing or invalid');
      return;
    }

    if (isCheckinLoading || isCheckedIn) return;

    setIsCheckinLoading(true);

    try {
      console.log('Starting check-in with token:', token);
      // Call checkin API with token from generateCode
      const response = await checkin(token);

      console.log('Check-in response:', response);

      // Response is a simple string like "Checked-in"
      Alert.alert(
        'Check-in Successful! 🎉',
        String(response) || "You've successfully checked in!",
        [
          {
            text: 'OK',
            onPress: () => {
              setIsCheckedIn(true);
              // Redirect after successful check-in
              setTimeout(() => {
                router.replace('/student/events');
              }, 500);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Check-in error:', error);

      // Ensure error message is a string
      const errorMessage =
        error?.message || 'An error occurred during check-in. Please try again.';

      Alert.alert('Check-in Failed', String(errorMessage));
    } finally {
      setIsCheckinLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-2 -ml-2"
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Event Check-in</Text>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          {/* Icon Circle */}
          <View className="w-32 h-32 rounded-full bg-blue-100 items-center justify-center mb-6">
            {isCheckedIn ? (
              <CheckCircle size={64} color="#3b82f6" />
            ) : (
              <CheckCircle size={64} color="#3b82f6" strokeWidth={2} />
            )}
          </View>

          {/* Title */}
          <Text className="text-3xl font-extrabold text-center mb-3 text-gray-900">
            Event Check-in
          </Text>

          {/* Subtitle */}
          <Text className="text-base text-center text-gray-600 mb-2">
            {isCheckedIn
              ? 'Successfully checked in!'
              : 'Tap the button below to check in'}
          </Text>

          {/* Token Info (for debugging) */}
          {__DEV__ && token && (
            <Text className="text-xs text-gray-400 mt-2 text-center">
              Token: {token.substring(0, 20)}...
            </Text>
          )}
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
                  : ['#3b82f6', '#2563eb']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-6"
            >
              <View className="flex-row items-center justify-center">
                {isCheckinLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#fff" className="mr-3" />
                    <Text className="text-white text-2xl font-bold">
                      Processing...
                    </Text>
                  </>
                ) : isCheckedIn ? (
                  <>
                    <CheckCircle size={32} color="#fff" strokeWidth={3} />
                    <Text className="text-white text-2xl font-bold ml-3">
                      Checked In!
                    </Text>
                  </>
                ) : (
                  <>
                    <CheckCircle size={32} color="#fff" strokeWidth={3} />
                    <Text className="text-white text-2xl font-bold ml-3">
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
          <View className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <Text className="text-sm text-blue-900 text-center font-medium">
              💡 Make sure you're at the event venue before checking in
            </Text>
          </View>
        )}

        {/* Success Message */}
        {isCheckedIn && (
          <View className="mt-8 bg-green-50 rounded-xl p-4 border border-green-200">
            <Text className="text-sm text-green-900 text-center font-medium mb-2">
              ✅ You have successfully checked in to this event
            </Text>
            <Text className="text-xs text-green-700 text-center">
              Redirecting to events page...
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <Text className="text-xs text-gray-500 text-center">
          UniClub Event Management System
        </Text>
      </View>
    </SafeAreaView>
  );
}
