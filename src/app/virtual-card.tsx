import { Ionicons } from '@expo/vector-icons';
import UserService, { UserProfile } from '@services/user.service';
import { useAuthStore } from '@stores/auth.store';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Share,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

export default function VirtualCardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const viewShotRef = useRef<View>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const formatRoleName = (roleName?: string) => {
    if (!roleName) return '';
    const map: Record<string, string> = {
      STUDENT: 'STUDENT',
      MEMBER: 'STUDENT',
      CLUB_MANAGER: 'CLUB LEADER',
      UNIVERSITY_STAFF: 'UNIVERSITY STAFF',
      UNI_ADMIN: 'UNIVERSITY ADMIN',
      ADMIN: 'ADMIN',
      STAFF: 'STAFF',
    };
    return map[roleName.toUpperCase()] || roleName.replace(/_/g, ' ').toUpperCase();
  };

  // Load profile data
  const loadProfile = async () => {
    if (!user?.userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const profileData = await UserService.fetchProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.userId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate QR code data
  const getQRData = () => {
    if (!profile) return '';
    
    return JSON.stringify({
      userId: profile.userId,
      fullName: profile.fullName,
      email: profile.email,
      studentCode: profile.studentCode,
      majorName: profile.majorName,
      role: profile.role?.roleName || 'STUDENT',
      timestamp: new Date().toISOString()
    });
  };

  // Handle download card
  const handleDownloadCard = async () => {
    if (!viewShotRef.current) return;

    try {
      setDownloading(true);

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save images to your device');
        setDownloading(false);
        return;
      }

      // Capture the view as image
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });
      
      // Save to media library
      await MediaLibrary.saveToLibraryAsync(uri);
      
      Alert.alert('Success', 'Virtual card has been saved to your gallery!');
    } catch (err) {
      console.error('Error downloading card:', err);
      Alert.alert('Error', 'Failed to save card. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Handle share card
  const handleShareCard = async () => {
    if (!viewShotRef.current || !profile) return;

    try {
      // Capture the view as image
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });
      
      await Share.share({
        message: `${profile.fullName} - ${profile.studentCode}`,
        url: uri,
        title: 'My Student Card'
      });
    } catch (err) {
      console.error('Error sharing card:', err);
      Alert.alert('Error', 'Failed to share card. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-lg font-medium mt-4 text-gray-700">Generating Virtual Card...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-xl font-semibold text-gray-800 mt-4 mb-2">Unable to Load Card</Text>
          <Text className="text-gray-600 text-center mb-6">{error || 'Card data not available'}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 px-6 py-3 rounded-xl flex-row items-center"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text className="text-white font-medium ml-2">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
          <Text className="text-gray-700 font-medium ml-2">Back</Text>
        </TouchableOpacity>
        
        <Text className="text-lg font-bold text-gray-800">Virtual Card</Text>
        
        {/* Action Icons */}
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleShareCard}
            className="mr-3 p-2"
          >
            <Ionicons name="share-social" size={24} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleDownloadCard}
            disabled={downloading}
            className="p-2"
            style={{ opacity: downloading ? 0.5 : 1 }}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Ionicons name="download" size={24} color="#3B82F6" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Virtual Card - No Scroll, Centered */}
      <View className="flex-1 justify-center px-4">
        <View ref={viewShotRef} collapsable={false}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Background Pattern */}
            <View className="absolute inset-0 opacity-10">
              <View className="absolute -top-8 -left-8 w-32 h-32 bg-white rounded-full" />
              <View className="absolute -bottom-12 -right-12 w-48 h-48 bg-white rounded-full" />
              <View className="absolute top-1/2 left-1/3 w-20 h-20 bg-white rounded-full" />
            </View>

            <View className="p-6 relative z-10">
              {/* Card Header */}
              <View className="flex-row items-start justify-between mb-5">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-white mb-1">UniClub Digital ID</Text>
                  <Text className="text-white/80 text-sm">Student Identification Card</Text>
                </View>
                <View className="items-end">
                  <Text className="text-white/70 text-sm">Valid Until</Text>
                  <Text className="text-white font-semibold text-base">
                    {new Date().getFullYear() + 1}
                  </Text>
                </View>
              </View>

              {/* Avatar Section */}
              <View className="items-center mb-5">
                <View className="w-28 h-28 rounded-full bg-white/20 border-4 border-white/30 items-center justify-center overflow-hidden mb-4">
                  {profile.avatarUrl ? (
                    <Image
                      source={{ uri: profile.avatarUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-3xl font-bold text-white">
                      {getInitials(profile.fullName)}
                    </Text>
                  )}
                </View>
                
                <Text className="text-2xl font-bold text-white text-center mb-2">
                  {profile.fullName}
                </Text>
                <Text className="text-white/90 text-base text-center mb-3">
                  {profile.email}
                </Text>
                <View className="bg-white/20 px-4 py-2 rounded-full">
                  <Text className="text-white font-medium text-sm">
                    {formatRoleName(profile.role?.roleName)}
                  </Text>
                </View>
              </View>

              {/* Student Info */}
              <View className="bg-white/10 rounded-xl p-4 mb-5">
                <View className="flex-row items-center justify-center mb-3">
                  <Text className="text-white/80 text-sm bg-white/20 px-3 py-1.5 rounded mr-2">
                    STUDENT ID
                  </Text>
                  <Text className="text-white font-mono text-lg font-bold">
                    {profile.studentCode || 'N/A'}
                  </Text>
                </View>
                <Text className="text-white text-center text-base font-medium">
                  {profile.majorName || 'N/A'}
                </Text>
                {profile.phone && (
                  <Text className="text-white/80 text-center text-sm mt-2">
                    {profile.phone}
                  </Text>
                )}
              </View>

              {/* QR Code */}
              <View className="items-center mb-5">
                <View className="bg-white p-4 rounded-xl">
                  <QRCode
                    value={getQRData()}
                    size={160}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text className="text-white/80 text-sm text-center mt-3">
                  Scan for profile info
                </Text>
              </View>

              {/* Additional Info Grid */}
              <View className="border-t border-white/20 pt-4">
                <View className="flex-row justify-between mb-3">
                  <View className="bg-white/10 rounded-lg p-3 flex-1 mr-2">
                    <Text className="text-white/70 text-sm mb-1">Status</Text>
                    <Text className="text-white text-sm font-medium">{profile.status}</Text>
                  </View>
                  <View className="bg-white/10 rounded-lg p-3 flex-1 ml-2">
                    <Text className="text-white/70 text-sm mb-1">Since</Text>
                    <Text className="text-white text-sm font-medium">
                      {new Date().getFullYear()}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between">
                  <View className="bg-white/10 rounded-lg p-3 flex-1 mr-2">
                    <Text className="text-white/70 text-sm mb-1">Card ID</Text>
                    <Text className="text-white text-sm font-medium font-mono">
                      #UC{String(profile.userId).padStart(6, '0')}
                    </Text>
                  </View>
                  <View className="bg-white/10 rounded-lg p-3 flex-1 ml-2">
                    <Text className="text-white/70 text-sm mb-1">Points</Text>
                    <Text className="text-white text-sm font-medium">
                      {profile.wallet?.balancePoints.toLocaleString() || '0'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
  );
}
