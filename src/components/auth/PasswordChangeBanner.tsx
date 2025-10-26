import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChangePasswordModal from './ChangePasswordModal';

export default function PasswordChangeBanner() {
  const { needsPasswordChange } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const insets = useSafeAreaInsets();

  if (!needsPasswordChange) {
    return null;
  }

  return (
    <>
      {/* Password Change Banner - Yellow Professional Design */}
      <TouchableOpacity 
        onPress={() => setShowPasswordModal(true)}
        className="rounded-xl overflow-hidden shadow-md active:opacity-90"
        style={{
          marginTop: insets.top + 8,
          marginBottom: 8,
          marginLeft: 60,
          marginRight: 16,
          shadowColor: '#f59e0b',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 6,
          backgroundColor: '#fbbf24', // Solid yellow
        }}
      >
        <View className="flex-row items-center px-3 py-2">
          {/* Icon Section */}
          <View className="bg-amber-900/10 p-2 rounded-lg mr-2.5">
            <Ionicons name="key" size={20} color="#78350f" />
          </View>
          
          {/* Content Section */}
          <View className="flex-1">
            <Text className="text-amber-950 font-bold text-sm">
              Update Password
            </Text>
            <Text className="text-amber-900/70 text-xs">
              Security action required
            </Text>
          </View>
          
          {/* Arrow Section */}
          <View className="bg-amber-900/10 p-1.5 rounded-full">
            <Ionicons name="arrow-forward" size={16} color="#78350f" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={showPasswordModal} 
        onOpenChange={setShowPasswordModal}
      />
    </>
  );
}

