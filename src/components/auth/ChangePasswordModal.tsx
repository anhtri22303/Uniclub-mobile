import { Ionicons } from '@expo/vector-icons';
import AuthService from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { AppTextInput } from '../ui';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validate inputs
    if (!oldPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your current password',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    if (!newPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a new password',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    if (oldPassword === newPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'New password must be different from current password',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthService.changePassword(oldPassword, newPassword);
      
      Toast.show({
        type: 'success',
        text1: 'Password Changed Successfully',
        text2: response.message || 'Password changed successfully. Please re-login.',
        visibilityTime: 3000,
        autoHide: true,
      });

      // Clear the needsPasswordChange flag from secure storage
      const { deleteItemAsync } = await import('expo-secure-store');
      await deleteItemAsync('needsPasswordChange');
      
      // Reset form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
      
      // Wait a moment for the toast to show, then logout
      setTimeout(async () => {
        await logout();
        router.replace('/login' as any);
      }, 1500);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Change Password',
        text2: error.response?.data?.message || 'Something went wrong. Please check your current password.',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        <View className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <View className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
            <View className="flex-row items-center mb-2">
              <View className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mr-3">
                <Ionicons name="lock-closed" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-white">Change Password</Text>
                <Text className="text-sm text-white/80 mt-1">
                  Please enter your current password and choose a new password
                </Text>
              </View>
            </View>
          </View>

          <ScrollView 
            className="max-h-96"
            showsVerticalScrollIndicator={false}
          >
            <View className="p-6 space-y-4">
              {/* Current Password */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Current Password</Text>
                <View className="relative">
                  <AppTextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="Enter current password"
                    secureTextEntry={!showOldPassword}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-base"
                  />
                  <TouchableOpacity
                    onPress={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Ionicons
                      name={showOldPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">New Password</Text>
                <View className="relative">
                  <AppTextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showNewPassword}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-base"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm New Password */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Confirm New Password</Text>
                <View className="relative">
                  <AppTextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
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
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="p-6 pt-2 space-y-3">
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={isLoading || !oldPassword || !newPassword || !confirmPassword}
              className={`rounded-xl py-4 flex-row items-center justify-center ${
                isLoading || !oldPassword || !newPassword || !confirmPassword
                  ? 'bg-gray-300'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600'
              }`}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-semibold text-base ml-2">Changing...</Text>
                </>
              ) : (
                <Text className="text-white font-semibold text-base">Change Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancel}
              className="border border-gray-300 rounded-xl py-4 flex-row items-center justify-center"
            >
              <Text className="text-gray-700 font-medium text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

