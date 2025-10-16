import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showLogo = false,
  showBack = false,
  onBackPress,
  rightElement,
}) => {
  return (
    <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
      {/* Left Section */}
      <View className="flex-row items-center flex-1">
        {showBack && (
          <TouchableOpacity
            onPress={onBackPress}
            className="mr-3 p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#0D9488" />
          </TouchableOpacity>
        )}
        
        {showLogo && (
          <View className="mr-3">
            <Image
              source={require('@assets/images/uniclub-logo.png')}
              className="w-8 h-8"
              resizeMode="contain"
            />
          </View>
        )}
        
        {title && (
          <Text className="text-lg font-semibold text-gray-800">
            {title}
          </Text>
        )}
      </View>

      {/* Right Section */}
      {rightElement && (
        <View>
          {rightElement}
        </View>
      )}
    </View>
  );
};