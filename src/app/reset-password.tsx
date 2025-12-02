import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '@services/auth.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    // Get email and token from URL params
    const emailParam = params?.email as string;
    const tokenParam = params?.token as string;

    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);

    // Validate params
    if (!emailParam || !tokenParam) {
      Alert.alert(
        'Invalid Link',
        'The password reset link is invalid or expired.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    }
  }, [params]);

  const validatePassword = (pwd: string) => {
    if (!pwd) {
      setPasswordError('Please enter your new password.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (pwd: string) => {
    if (!pwd) {
      setConfirmPasswordError('Please confirm your password.');
      return false;
    }
    if (pwd !== newPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSubmit = async () => {
    // Validate all fields
    const isPasswordValid = validatePassword(newPassword);
    const isConfirmValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmValid) {
      return;
    }

    if (!email || !token) {
      Alert.alert(
        'Missing Information',
        'Email or token is missing. Please use the link from your email.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthService.resetPassword(email, token, newPassword);

      if (response.success) {
        Alert.alert(
          'Password Reset Successful',
          response.message || 'Your password has been successfully reset.',
          [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert(
        'Reset Failed',
        error.response?.data?.message ||
          'Failed to reset password. The link may be expired or invalid.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-8">
            {/* Header Icon */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-teal-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="lock-closed" size={40} color="#0D9488" />
              </View>
              <Text className="text-3xl font-bold text-teal-600 mb-2">
                Reset Password
              </Text>
              <Text className="text-gray-600 text-center">
                Enter your new password below
              </Text>
            </View>

            {/* Form Section */}
            <View className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6">
              <View className="space-y-4">
                {/* Email field (disabled) */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2 flex-row items-center">
                    <Ionicons name="mail" size={16} color="#374151" /> Email
                  </Text>
                  <AppTextInput
                    value={email}
                    editable={false}
                    className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-500"
                  />
                </View>

                {/* Token field (disabled) */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    <Ionicons name="key" size={16} color="#374151" /> Reset Token
                  </Text>
                  <AppTextInput
                    value={token}
                    editable={false}
                    className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-500 font-mono"
                    numberOfLines={1}
                  />
                </View>

                {/* New Password field */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    <Ionicons name="lock-closed" size={16} color="#374151" /> New Password
                  </Text>
                  <View className="relative">
                    <AppTextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      onBlur={() => validatePassword(newPassword)}
                      placeholder="Enter your new password"
                      secureTextEntry={!showPassword}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-base"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3"
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordError ? (
                    <Text className="text-sm text-red-500 mt-1">{passwordError}</Text>
                  ) : null}
                </View>

                {/* Confirm Password field */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    <Ionicons name="checkmark-circle" size={16} color="#374151" /> Confirm New Password
                  </Text>
                  <View className="relative">
                    <AppTextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onBlur={() => validateConfirmPassword(confirmPassword)}
                      placeholder="Confirm your new password"
                      secureTextEntry={!showConfirmPassword}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-base"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3"
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordError ? (
                    <Text className="text-sm text-red-500 mt-1">{confirmPasswordError}</Text>
                  ) : null}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading || !!passwordError || !!confirmPasswordError}
                  className="bg-teal-500 rounded-xl py-4 flex-row items-center justify-center shadow-lg mt-6"
                  style={{ opacity: isLoading || passwordError || confirmPasswordError ? 0.5 : 1 }}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator color="white" className="mr-2" />
                      <Text className="text-white font-medium text-lg">
                        Resetting Password...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={20} color="white" />
                      <Text className="text-white font-medium text-lg ml-2">
                        Reset Password
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Back to Login */}
                <View className="border-t border-gray-200 pt-4 mt-4">
                  <TouchableOpacity onPress={() => router.replace('/login')}>
                    <Text className="text-center text-teal-600 underline">
                      Back to Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
