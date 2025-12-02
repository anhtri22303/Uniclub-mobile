import { Ionicons } from '@expo/vector-icons';
import AuthService from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppTextInput } from './ui';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
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
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthService.changePassword(oldPassword, newPassword);
      
      // Always show success message
      Alert.alert(
        'Password Changed Successfully',
        'Your password has been changed successfully. You will be logged out in a moment.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form and close modal
              setOldPassword('');
              setNewPassword('');
              setConfirmPassword('');
              onClose();
              
              // Logout after a moment
              setTimeout(() => {
                logout();
              }, 500);
            }
          }
        ]
      );
    } catch (error: any) {
      // Always show error message
      Alert.alert(
        'Failed to Change Password',
        'Unable to change password. Please verify your current password is correct and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <View className="h-12 w-12 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Ionicons name="lock-closed" size={24} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">Change Password</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Enter your current password and choose a new one
              </Text>
            </View>
          </View>

          {/* Current Password */}
          <View className="mb-4">
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
                className="absolute right-4 top-3.5"
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
          <View className="mb-4">
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
                className="absolute right-4 top-3.5"
              >
                <Ionicons 
                  name={showNewPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
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
                className="absolute right-4 top-3.5"
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCancel}
              className="flex-1 bg-gray-100 py-3 rounded-xl"
            >
              <Text className="text-center text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={isLoading || !oldPassword || !newPassword || !confirmPassword}
              className={`flex-1 py-3 rounded-xl ${
                isLoading || !oldPassword || !newPassword || !confirmPassword
                  ? 'bg-gray-300'
                  : 'bg-blue-600'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-white font-semibold">Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

