import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import UserService, { EditProfileRequest, UserProfile } from '@services/user.service';
import { useAuthStore } from '@stores/auth.store';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  // State management
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    majorName: '',
    bio: '',
  });

  // Avatar states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Static data for user stats
  const userStats = {
    clubsJoined: 5,
    eventsAttended: 12,
    monthsActive: 6,
    achievements: 3,
  };

  // Static data for admin stats
  const adminStats = {
    totalUsers: '1,247',
    activeEvents: '89',
    reportsGenerated: '156',
  };

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
      
      // Update form data
      setFormData({
        fullName: profileData.fullName || '',
        phone: profileData.phone || '',
        majorName: profileData.majorName || '',
        bio: profileData.bio || '',
      });

      // Set avatar preview
      setAvatarPreview(profileData.avatarUrl);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [user?.userId]);

  // Handle profile update
  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      const updateData: EditProfileRequest = {
        fullName: formData.fullName,
        phone: formData.phone,
        majorName: formData.majorName,
        bio: formData.bio,
      };

      const response = await UserService.editProfile(updateData);
      
      if (response && response.success) {
        Alert.alert('Success', 'Your profile has been updated successfully!');
        setEditing(false);
        await loadProfile(); // Reload profile data
      } else {
        throw new Error(response?.message || 'Unable to update profile');
      }
    } catch (err) {
      console.error('Edit profile failed:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingAvatar(true);

        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const response = await UserService.uploadAvatar(formData);
        
        if (response && response.success) {
          Alert.alert('Success', 'Your avatar has been updated successfully!');
          setAvatarPreview(response.data?.avatarUrl || asset.uri);
          await loadProfile(); // Reload profile data
        } else {
          throw new Error(response?.message || 'Unable to update avatar');
        }
      }
    } catch (err) {
      console.error('Upload avatar failed:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred while uploading avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserPoints = () => {
    return profile?.wallet?.balancePoints || 0;
  };

  const getPointsCardStyle = (points: number) => {
    if (points >= 5000) {
      return {
        cardBgColors: ['#9333EA', '#EC4899'], // purple to pink gradient
        textColor: 'text-white',
        iconColor: 'white',
        iconBg: 'bg-white/20',
      };
    }
    if (points >= 3000) {
      return {
        cardBgColors: ['#0EA5E9', '#6366F1'], // sky to indigo gradient
        textColor: 'text-white',
        iconColor: 'white',
        iconBg: 'bg-white/20',
      };
    }
    if (points >= 1000) {
      return {
        cardBgColors: ['#FEF3C7', '#FEF3C7'], // amber light
        textColor: 'text-amber-900',
        iconColor: '#D97706',
        iconBg: 'bg-amber-200',
      };
    }
    return {
      cardBgColors: ['#F1F5F9', '#F1F5F9'], // gray
      textColor: 'text-gray-800',
      iconColor: '#6B7280',
      iconBg: 'bg-gray-200',
    };
  };

  const isAdminRole = ['uni_staff', 'uni_admin', 'admin', 'staff'].includes(user?.role || '');

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-lg font-medium mt-4 text-gray-700">Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-xl font-semibold text-gray-800 mt-4 mb-2">Unable to Load Profile</Text>
          <Text className="text-gray-600 text-center mb-6">{error}</Text>
          <TouchableOpacity
            onPress={loadProfile}
            className="bg-teal-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="person-circle-outline" size={64} color="#F59E0B" />
          <Text className="text-lg font-medium text-gray-800 mt-4">No Profile Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pointsStyle = getPointsCardStyle(getUserPoints());

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />
      
      {/* Header with view card */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Profile</Text>
        <TouchableOpacity
          onPress={() => router.push('/virtual-card' as any)}
          className="flex-row items-center px-4 py-2 rounded-xl"
          style={{ backgroundColor: '#3B82F6' }}
        >
          <Ionicons name="card" size={20} color="white" />
          <Text className="text-white font-medium ml-2">View Card</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Header with Gradient Background */}
        <LinearGradient
          colors={['#6366F1', '#EC4899']} // Indigo to Pink gradient like in the image
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-3xl shadow-lg mb-6 overflow-hidden"
        >
          <View className="p-6 pt-8 pb-8">
            <View className="items-center">
              <View className="relative">
                <TouchableOpacity
                  onPress={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="relative"
                >
                  {avatarPreview ? (
                    <Image
                      source={{ uri: avatarPreview }}
                      className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
                    />
                  ) : (
                    <View className="w-28 h-28 rounded-full bg-white/30 border-4 border-white shadow-lg items-center justify-center">
                      <Text className="text-3xl font-bold text-white">
                        {getInitials(profile.fullName || 'U')}
                      </Text>
                    </View>
                  )}
                  
                  {uploadingAvatar && (
                    <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                      <ActivityIndicator color="white" />
                    </View>
                  )}
                  
                  <View className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-2 border-2 border-white shadow-lg">
                    <Ionicons name="camera" size={18} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
              
              <Text className="text-2xl font-bold text-white mt-4">{profile.fullName}</Text>
              <Text className="text-white/90 text-base">{profile.email}</Text>
              <Text className="text-white font-medium mt-1 bg-white/20 px-3 py-1 rounded-full">
                {formatRoleName(profile.role?.roleName)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Points Card */}
        <View 
          className="rounded-3xl p-6 shadow-lg mb-6"
          style={{
            backgroundColor: pointsStyle.cardBgColors[0],
          }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className={`text-sm font-medium ${pointsStyle.textColor}`}>
                Accumulated Points
              </Text>
              <Text className={`text-3xl font-bold ${pointsStyle.textColor}`}>
                {getUserPoints().toLocaleString()}
              </Text>
            </View>
            <View className={`${pointsStyle.iconBg} p-3 rounded-full`}>
              <Ionicons name="flame" size={24} color={pointsStyle.iconColor} />
            </View>
          </View>
        </View>

        {/* Admin Interface */}
        {isAdminRole ? (
          <View className="space-y-6">
            {/* Admin Statistics */}
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              <Text className="text-xl font-bold text-gray-800 mb-4">Quick Statistics</Text>
              <View className="grid grid-cols-1 gap-4">
                <View className="flex-row items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <View className="flex-row items-center">
                    <Ionicons name="people" size={24} color="#3B82F6" />
                    <Text className="text-gray-700 ml-3">Total Users</Text>
                  </View>
                  <Text className="text-xl font-bold text-blue-600">{adminStats.totalUsers}</Text>
                </View>
                
                <View className="flex-row items-center justify-between p-4 bg-green-50 rounded-xl">
                  <View className="flex-row items-center">
                    <Ionicons name="calendar" size={24} color="#10B981" />
                    <Text className="text-gray-700 ml-3">Active Events</Text>
                  </View>
                  <Text className="text-xl font-bold text-green-600">{adminStats.activeEvents}</Text>
                </View>
                
                <View className="flex-row items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <View className="flex-row items-center">
                    <Ionicons name="document-text" size={24} color="#8B5CF6" />
                    <Text className="text-gray-700 ml-3">Reports Generated</Text>
                  </View>
                  <Text className="text-xl font-bold text-purple-600">{adminStats.reportsGenerated}</Text>
                </View>
              </View>
            </View>

            {/* Admin Profile Edit */}
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-800">Personal Information</Text>
                <TouchableOpacity
                  onPress={() => setEditing(!editing)}
                  className="bg-teal-500 px-4 py-2 rounded-xl"
                >
                  <Text className="text-white font-medium">
                    {editing ? 'Cancel' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {editing ? (
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
                    <TextInput
                      value={formData.fullName}
                      onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      placeholder="Enter your full name"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Phone</Text>
                    <TextInput
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Major</Text>
                    <TextInput
                      value={formData.majorName}
                      onChangeText={(text) => setFormData({ ...formData, majorName: text })}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      placeholder="Enter your major"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Bio</Text>
                    <TextInput
                      value={formData.bio}
                      onChangeText={(text) => setFormData({ ...formData, bio: text })}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      placeholder="Tell us about yourself"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="bg-teal-500 rounded-xl py-4 flex-row items-center justify-center"
                  >
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons name="save" size={20} color="white" />
                        <Text className="text-white font-medium ml-2">Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="space-y-3">
                  <View className="flex-row items-center">
                    <Ionicons name="person" size={20} color="#0D9488" />
                    <Text className="text-gray-700 ml-3">Name: {profile.fullName}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="mail" size={20} color="#0D9488" />
                    <Text className="text-gray-700 ml-3">Email: {profile.email}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="call" size={20} color="#0D9488" />
                    <Text className="text-gray-700 ml-3">Phone: {profile.phone || 'Not provided'}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="school" size={20} color="#0D9488" />
                    <Text className="text-gray-700 ml-3">Major: {profile.majorName || 'Not provided'}</Text>
                  </View>
                  {profile.bio && (
                    <View className="flex-row items-start">
                      <Ionicons name="document-text" size={20} color="#0D9488" />
                      <Text className="text-gray-700 ml-3 flex-1">Bio: {profile.bio}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Student Interface */
          <View className="space-y-6">
            {/* Student Profile Edit */}
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-800">Personal Information</Text>
                <TouchableOpacity
                  onPress={() => setEditing(!editing)}
                  className="bg-teal-500 px-4 py-2 rounded-xl"
                >
                  <Text className="text-white font-medium">
                    {editing ? 'Cancel' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {editing ? (
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
                    <TextInput
                      value={formData.fullName}
                      onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      placeholder="Enter your full name"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Phone</Text>
                    <TextInput
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Student Code</Text>
                    <TextInput
                      value={profile.studentCode || ''}
                      className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-500"
                      placeholder="Student code (read-only)"
                      editable={false}
                    />
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Major</Text>
                    <TextInput
                      value={formData.majorName}
                      onChangeText={(text) => setFormData({ ...formData, majorName: text })}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      placeholder="Enter your major"
                    />
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Bio</Text>
                    <TextInput
                      value={formData.bio}
                      onChangeText={(text) => setFormData({ ...formData, bio: text })}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                      placeholder="Tell us about yourself"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="bg-teal-500 rounded-xl py-4 flex-row items-center justify-center"
                  >
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons name="save" size={20} color="white" />
                        <Text className="text-white font-medium ml-2">Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="space-y-3">
                  <View className="flex-row items-center">
                    <Ionicons name="person" size={20} color="#0D9488" />
                    <Text className="text-gray-700 ml-3">Name: {profile.fullName}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="mail" size={20} color="#0D9488" />
                    <Text className="text-gray-700 ml-3">Email: {profile.email}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="call" size={20} color="#0D9488" />
                    <Text className="text-gray-700 ml-3">Phone: {profile.phone || 'Not provided'}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="card" size={20} color="#0D9488" />
                    <Text className="text-gray-700 ml-3">Student Code: {profile.studentCode || 'Not provided'}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="school" size={20} color="#0D9488" />
                    <Text className="text-gray-700 ml-3">Major: {profile.majorName || 'Not provided'}</Text>
                  </View>
                  {profile.bio && (
                    <View className="flex-row items-start">
                      <Ionicons name="document-text" size={20} color="#0D9488" />
                      <Text className="text-gray-700 ml-3 flex-1">Bio: {profile.bio}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Activity Statistics - Moved to bottom */}
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              <Text className="text-xl font-bold text-gray-800 mb-4">Activity Statistics</Text>
              <View className="grid grid-cols-2 gap-4">
                <View className="items-center p-4 bg-blue-50 rounded-xl">
                  <Ionicons name="people" size={28} color="#3B82F6" />
                  <Text className="text-2xl font-bold text-blue-600 mt-2">{userStats.clubsJoined}</Text>
                  <Text className="text-sm text-gray-600">Clubs Joined</Text>
                </View>
                
                <View className="items-center p-4 bg-green-50 rounded-xl">
                  <Ionicons name="calendar" size={28} color="#10B981" />
                  <Text className="text-2xl font-bold text-green-600 mt-2">{userStats.eventsAttended}</Text>
                  <Text className="text-sm text-gray-600">Events Attended</Text>
                </View>
                
                <View className="items-center p-4 bg-purple-50 rounded-xl">
                  <Ionicons name="time" size={28} color="#8B5CF6" />
                  <Text className="text-2xl font-bold text-purple-600 mt-2">{userStats.monthsActive}</Text>
                  <Text className="text-sm text-gray-600">Months Active</Text>
                </View>
                
                <View className="items-center p-4 bg-amber-50 rounded-xl">
                  <Ionicons name="trophy" size={28} color="#F59E0B" />
                  <Text className="text-2xl font-bold text-amber-600 mt-2">{userStats.achievements}</Text>
                  <Text className="text-sm text-gray-600">Achievements</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
