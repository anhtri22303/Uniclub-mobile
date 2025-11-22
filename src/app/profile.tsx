import { AvatarCropModal } from '@components/AvatarCropModal';
import { ChangePasswordModal } from '@components/ChangePasswordModal';
import { CompleteProfileModal } from '@components/CompleteProfileModal';
import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Major, MajorService } from '@services/major.service';
import UserService, { ApiMembershipWallet, EditProfileRequest, ProfileStats, UserProfile } from '@services/user.service';
import { useAuthStore } from '@stores/auth.store';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageBackground,
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
    studentCode: '',
  });
  
  // Validation state for studentCode
  const [studentCodeError, setStudentCodeError] = useState<string | null>(null);

  // Avatar states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Crop modal states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');

  // Background image states
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [showBackgroundCropModal, setShowBackgroundCropModal] = useState(false);
  const [backgroundImageToCrop, setBackgroundImageToCrop] = useState<string>('');

  // Change password modal state
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Complete profile modal state
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  // Wallet memberships state
  const [memberships, setMemberships] = useState<ApiMembershipWallet[]>([]);

  // Majors list state
  const [majors, setMajors] = useState<Major[]>([]);

  // Profile stats state (real data from API)
  const [userStats, setUserStats] = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Animation for flame icon
  const flameAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

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
      
      // Fetch profile and majors in parallel
      const [profileData, majorsList] = await Promise.all([
        UserService.fetchProfile(),
        MajorService.fetchMajors()
      ]);
      
      setProfile(profileData);
      
      // Handle majors list - filter active majors but include user's current major if inactive
      const activeMajors = majorsList.filter(m => m.active);
      const currentMajorName = profileData.majorName;
      const isCurrentMajorActive = activeMajors.some(m => m.name === currentMajorName);
      
      if (!isCurrentMajorActive && currentMajorName) {
        // Add inactive major to list if it's the user's current major
        const currentInactiveMajor = majorsList.find(m => m.name === currentMajorName);
        if (currentInactiveMajor) {
          setMajors([currentInactiveMajor, ...activeMajors]);
        } else {
          setMajors(activeMajors);
        }
      } else {
        setMajors(activeMajors);
      }
      
      // Update form data
      setFormData({
        fullName: profileData.fullName || '',
        phone: profileData.phone || '',
        majorName: profileData.majorName || '',
        bio: profileData.bio || '',
        studentCode: profileData.studentCode || '',
      });

      // Set avatar and background preview
      setAvatarPreview(profileData.avatarUrl);
      setBackgroundPreview(profileData.backgroundUrl || null);

      // Check if profile needs to be completed (for students only)
      if (profileData.needCompleteProfile && user?.role === 'student') {
        setShowCompleteProfile(true);
      }

      // Load wallet memberships for students and club leaders
      if (user?.role === 'student' || user?.role === 'club_leader') {
        let walletsList = profileData.wallets || [];
        
        // If API returns singular wallet, convert to array
        if (!walletsList || walletsList.length === 0) {
          if (profileData.wallet) {
            const clubName = profileData.clubs?.[0]?.clubName || 'My Wallet';
            const clubId = profileData.clubs?.[0]?.clubId || null;
            
            walletsList = [{
              walletId: profileData.wallet.walletId || 0,
              balancePoints: profileData.wallet.balancePoints,
              ownerType: profileData.wallet.ownerType || 'MEMBER',
              clubId: clubId,
              clubName: clubName,
              userId: profileData.wallet.userId || profileData.userId,
              userFullName: profileData.wallet.userFullName || profileData.fullName
            }];
          }
        }
        
        console.log('Wallets from profile:', walletsList);
        setMemberships(walletsList);
      }

      // Load profile statistics for students and club leaders
      if (user?.role === 'student' || user?.role === 'club_leader') {
        try {
          setStatsLoading(true);
          const stats = await UserService.getProfileStats();
          if (stats) {
            setUserStats(stats);
          }
        } catch (statsErr) {
          console.error('Failed to load profile stats:', statsErr);
          // Don't show error - just keep loading state or show 0s
        } finally {
          setStatsLoading(false);
        }
      } else {
        setStatsLoading(false);
      }
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

  // Start flame animation based on points
  useEffect(() => {
    if (!profile?.wallet?.balancePoints) return;

    const points = profile.wallet.balancePoints;
    let animationDuration = 0;
    let scaleRange = [1, 1];

    // Different animations based on points level
    if (points >= 5000) {
      // Strong pulse for 5000+ points
      animationDuration = 800;
      scaleRange = [1, 1.3];
    } else if (points >= 3000) {
      // Medium pulse for 3000+ points
      animationDuration = 1200;
      scaleRange = [1, 1.2];
    } else if (points >= 1000) {
      // Gentle pulse for 1000+ points
      animationDuration = 2000;
      scaleRange = [1, 1.15];
    } else {
      // No animation for < 1000 points
      return;
    }

    // Create pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnimation, {
          toValue: scaleRange[1],
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnimation, {
          toValue: scaleRange[0],
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Create glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [profile?.wallet?.balancePoints]);

  // Validation function for studentCode
  const validateStudentCode = (code: string): string | null => {
    if (!code || code.trim() === '') {
      return null; // Allow empty
    }
    
    // Format: 2 letters followed by 6 numbers (e.g., SE000001)
    const pattern = /^[A-Za-z]{2}\d{6}$/;
    
    if (code.length !== 8) {
      return 'Student code must be exactly 8 characters (2 letters + 6 numbers)';
    }
    
    if (!pattern.test(code)) {
      return 'Student code must start with 2 letters followed by 6 numbers (e.g., SE000001)';
    }
    
    return null; // Valid
  };

  // Handle profile update
  const handleSave = async () => {
    if (!profile) return;

    // Validate studentCode before saving
    if (formData.studentCode) {
      const error = validateStudentCode(formData.studentCode);
      if (error) {
        setStudentCodeError(error);
        Alert.alert('Validation Error', error);
        return;
      }
    }

    try {
      setSaving(true);

      // Find majorId from majorName
      const selectedMajor = majors.find(m => m.name === formData.majorName);
      const majorId = selectedMajor ? selectedMajor.id : undefined;

      if (formData.majorName && !selectedMajor) {
        console.warn(`Cannot find majorId for majorName: ${formData.majorName}`);
      }

      const updateData: EditProfileRequest = {
        fullName: formData.fullName,
        phone: formData.phone,
        majorId: majorId, // Send majorId (number) instead of majorName (string)
        bio: formData.bio,
        studentCode: formData.studentCode || undefined,
      };

      console.log('Sending profile update with payload:', updateData);

      const response = await UserService.editProfile(updateData);
      
      if (response && response.success) {
        setStudentCodeError(null); // Clear validation error on success
        Alert.alert('Success', 'Your profile has been updated successfully!');
        setEditing(false);
        await loadProfile(); // Reload profile data
      } else {
        throw new Error(response?.message || 'Unable to update profile');
      }
    } catch (err: any) {
      console.error('Edit profile failed:', err);
      
      // Handle API error messages
      let errorMessage = 'An error occurred while updating profile';
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.response && err.response.data) {
        try {
          const errorData = err.response.data;
          const firstErrorKey = Object.keys(errorData)[0];
          const firstError = errorData[firstErrorKey];
          
          if (typeof firstError === 'string') {
            errorMessage = firstError;
          } else if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
        } catch (e) {
          // Use default message
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar selection - show crop modal
  const handleAvatarUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload an avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // We'll handle cropping ourselves
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file size (max 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'File size must be smaller than 5MB');
          return;
        }

        // Show crop modal
        setImageToCrop(asset.uri);
        setShowCropModal(true);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred while selecting image');
    }
  };

  // Handle crop complete - upload the cropped image
  const handleCropComplete = async (croppedImage: { uri: string; base64?: string }) => {
    try {
      setUploadingAvatar(true);
      
      Alert.alert('Uploading...', 'Uploading image, please wait...');

      // Create file object for React Native upload
      const fileToUpload = {
        uri: croppedImage.uri,
        type: 'image/jpeg',
        name: 'cropped-avatar.jpg',
      };

      const response = await UserService.uploadAvatar(fileToUpload);
      
      if (response && response.success) {
        Alert.alert('Success', 'Your avatar has been updated successfully!');
        // Clear states
        setImageToCrop('');
        setShowCropModal(false);
        // Reload profile data to get updated avatar
        await loadProfile();
      } else {
        throw new Error(response?.message || 'Unable to update avatar');
      }
    } catch (err) {
      console.error('Upload avatar failed:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred while updating profile picture');
      throw err; // Re-throw to let modal know upload failed
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop('');
  };

  // Handle background upload
  const handleBackgroundUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a background image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file size (max 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'File size must be smaller than 5MB');
          return;
        }

        // Show crop modal for background
        setBackgroundImageToCrop(asset.uri);
        setShowBackgroundCropModal(true);
      }
    } catch (err) {
      console.error('Background image picker error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred while selecting image');
    }
  };

  // Handle background crop complete
  const handleBackgroundCropComplete = async (croppedImage: { uri: string; base64?: string }) => {
    try {
      setUploadingBackground(true);
      
      Alert.alert('Uploading...', 'Uploading background image, please wait...');

      // Create file object for React Native upload
      const fileToUpload = {
        uri: croppedImage.uri,
        type: 'image/jpeg',
        name: 'cropped-background.jpg',
      };

      const response = await UserService.uploadBackground(fileToUpload);
      
      if (response && response.success) {
        Alert.alert('Success', 'Your background has been updated successfully!');
        // Clear states
        setBackgroundImageToCrop('');
        setShowBackgroundCropModal(false);
        // Reload profile data to get updated background
        await loadProfile();
      } else {
        throw new Error(response?.message || 'Unable to update background');
      }
    } catch (err) {
      console.error('Upload background failed:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred while updating background image');
      throw err;
    } finally {
      setUploadingBackground(false);
    }
  };

  // Handle background crop cancel
  const handleBackgroundCropCancel = () => {
    setShowBackgroundCropModal(false);
    setBackgroundImageToCrop('');
  };

  // Handle complete profile submission
  const handleCompleteProfile = async (data: { studentCode: string; majorId: number }) => {
    try {
      const updateData: EditProfileRequest = {
        studentCode: data.studentCode,
        majorId: data.majorId,
      };

      const response = await UserService.editProfile(updateData);
      
      if (response && response.success) {
        Alert.alert('Success', 'Your profile has been completed successfully!');
        setShowCompleteProfile(false);
        await loadProfile(); // Reload profile data
      } else {
        throw new Error(response?.message || 'Unable to complete profile');
      }
    } catch (err) {
      console.error('Complete profile failed:', err);
      throw err; // Re-throw to let modal handle the error
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
        <Text className="text-2xl font-bold text-gray-800">        Profile</Text>
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
        {/* Profile Header with Professional Background for Admin/Uni Staff or Gradient for Others */}
        {isAdminRole ? (
          // Professional background with optional background image for Admin and University Staff
          <View className="rounded-3xl shadow-lg mb-6 overflow-hidden relative">
            {/* Background Image or Solid Color */}
            {backgroundPreview ? (
              <ImageBackground
                source={{ uri: backgroundPreview }}
                className="w-full"
                resizeMode="cover"
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
                        
                        <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-2 border-white shadow-lg">
                          <Ionicons name="camera" size={18} color="white" />
                        </View>
                      </TouchableOpacity>
                    </View>
                    
                    <Text className="text-2xl font-bold text-white mt-4 drop-shadow-lg">{profile.fullName}</Text>
                    <Text className="text-white/90 text-base drop-shadow-lg">{profile.email}</Text>
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="shield-checkmark" size={16} color="white" />
                      <Text className="text-white font-medium ml-1 bg-black/30 px-3 py-1 rounded-full">
                        {formatRoleName(profile.role?.roleName)}
                      </Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            ) : (
              <View style={{ backgroundColor: '#1E40AF' }} className="p-6 pt-8 pb-8">
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
                      
                      <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-2 border-white shadow-lg">
                        <Ionicons name="camera" size={18} color="white" />
                      </View>
                    </TouchableOpacity>
                  </View>
                  
                  <Text className="text-2xl font-bold text-white mt-4">{profile.fullName}</Text>
                  <Text className="text-white/90 text-base">{profile.email}</Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="shield-checkmark" size={16} color="white" />
                    <Text className="text-white font-medium ml-1 bg-white/20 px-3 py-1 rounded-full">
                      {formatRoleName(profile.role?.roleName)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Change Background Button - Top Right */}
            <TouchableOpacity
              onPress={handleBackgroundUpload}
              disabled={uploadingBackground}
              className="absolute top-4 right-4 bg-white/90 px-3 py-2 rounded-lg flex-row items-center shadow-lg"
            >
              {uploadingBackground ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <>
                  <Ionicons name="image" size={16} color="#3B82F6" />
                  <Text className="text-blue-600 font-medium ml-1 text-xs">Change BG</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Gradient background with optional background image for Students and Club Leaders
          <View className="rounded-3xl shadow-lg mb-6 overflow-hidden relative">
            {backgroundPreview ? (
              <ImageBackground
                source={{ uri: backgroundPreview }}
                className="w-full"
                resizeMode="cover"
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
                    
                    <Text className="text-2xl font-bold text-white mt-4 drop-shadow-lg">{profile.fullName}</Text>
                    <Text className="text-white/90 text-base drop-shadow-lg">{profile.email}</Text>
                    <Text className="text-white font-medium mt-1 bg-black/30 px-3 py-1 rounded-full">
                      {formatRoleName(profile.role?.roleName)}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            ) : (
              <LinearGradient
                colors={['#6366F1', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="p-6 pt-8 pb-8"
              >
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
              </LinearGradient>
            )}
            
            {/* Change Background Button - Top Right */}
            <TouchableOpacity
              onPress={handleBackgroundUpload}
              disabled={uploadingBackground}
              className="absolute top-4 right-4 bg-white/90 px-3 py-2 rounded-lg flex-row items-center shadow-lg"
            >
              {uploadingBackground ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <>
                  <Ionicons name="image" size={16} color="#6366F1" />
                  <Text className="text-indigo-600 font-medium ml-1 text-xs">Change BG</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Wallet Cards - Only for Students and Club Leaders */}
        {!isAdminRole && (
          <View className="mb-6">
            {memberships.length > 0 ? (
              memberships.map((membership) => {
                const pointsStyle = getPointsCardStyle(membership.balancePoints);
                return (
                  <View
                    key={membership.walletId}
                    className="rounded-3xl p-6 shadow-lg mb-3"
                    style={{
                      backgroundColor: pointsStyle.cardBgColors[0],
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className={`text-sm font-medium ${pointsStyle.textColor}`}>
                          {membership.clubName}
                        </Text>
                        <Text className={`text-3xl font-bold ${pointsStyle.textColor}`}>
                          {membership.balancePoints.toLocaleString()}
                        </Text>
                      </View>
                      <Animated.View
                        className={`${pointsStyle.iconBg} p-3 rounded-full`}
                        style={{
                          transform: [{ scale: flameAnimation }],
                          opacity: Animated.add(0.7, Animated.multiply(glowAnimation, 0.3)),
                        }}
                      >
                        <Ionicons name="flame" size={24} color={pointsStyle.iconColor} />
                      </Animated.View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="rounded-3xl p-6 shadow-lg bg-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-500">
                      No Club Memberships
                    </Text>
                    <Text className="text-3xl font-bold text-gray-800">0</Text>
                  </View>
                  <View className="bg-gray-200 p-3 rounded-full">
                    <Ionicons name="flame" size={24} color="#6B7280" />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Admin Interface */}
        {isAdminRole ? (
          <View className="space-y-6">
            {/* Admin Profile Edit - Personal Information */}
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
                      value={formData.studentCode}
                      onChangeText={(text) => {
                        const upperText = text.toUpperCase();
                        setFormData({ ...formData, studentCode: upperText });
                        // Validate on change
                        const error = validateStudentCode(upperText);
                        setStudentCodeError(error);
                      }}
                      className={`bg-gray-50 border rounded-xl px-4 py-3 text-base ${
                        studentCodeError ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="SE000001"
                      maxLength={8}
                      autoCapitalize="characters"
                    />
                    {studentCodeError && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text className="text-xs text-red-500 ml-1">{studentCodeError}</Text>
                      </View>
                    )}
                    {!studentCodeError && formData.studentCode && (
                      <Text className="text-xs text-gray-500 mt-1">
                        Format: 2 letters + 6 numbers (e.g., SE000001)
                      </Text>
                    )}
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Major</Text>
                    <View className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                      <Picker
                        selectedValue={formData.majorName}
                        onValueChange={(itemValue) => setFormData({ ...formData, majorName: itemValue })}
                        style={{ height: 50 }}
                      >
                        <Picker.Item label="Select a major" value="" />
                        {majors.map((major) => (
                          <Picker.Item
                            key={major.id}
                            label={`${major.name}${!major.active ? ' (Inactive)' : ''}`}
                            value={major.name}
                          />
                        ))}
                      </Picker>
                    </View>
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
                  
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={handleSave}
                      disabled={saving}
                      className="flex-1 bg-teal-500 rounded-xl py-4 flex-row items-center justify-center"
                    >
                      {saving ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Ionicons name="save" size={20} color="white" />
                          <Text className="text-white font-medium ml-2">Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => setShowChangePassword(true)}
                      className="flex-1 bg-gray-100 rounded-xl py-4 flex-row items-center justify-center border border-gray-300"
                    >
                      <Ionicons name="lock-closed" size={20} color="#4B5563" />
                      <Text className="text-gray-700 font-medium ml-2">Password</Text>
                    </TouchableOpacity>
                  </View>
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
                      <Ionicons name="information-circle" size={20} color="#0D9488" />
                      <Text className="text-gray-700 ml-3 flex-1">Bio: {profile.bio}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

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
                      value={formData.studentCode}
                      onChangeText={(text) => {
                        const upperText = text.toUpperCase();
                        setFormData({ ...formData, studentCode: upperText });
                        // Validate on change
                        const error = validateStudentCode(upperText);
                        setStudentCodeError(error);
                      }}
                      className={`bg-gray-50 border rounded-xl px-4 py-3 text-base ${
                        studentCodeError ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="SE000001"
                      maxLength={8}
                      autoCapitalize="characters"
                    />
                    {studentCodeError && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="alert-circle" size={14} color="#EF4444" />
                        <Text className="text-xs text-red-500 ml-1">{studentCodeError}</Text>
                      </View>
                    )}
                    {!studentCodeError && formData.studentCode && (
                      <Text className="text-xs text-gray-500 mt-1">
                        Format: 2 letters + 6 numbers (e.g., SE000001)
                      </Text>
                    )}
                  </View>
                  
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Major</Text>
                    <View className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                      <Picker
                        selectedValue={formData.majorName}
                        onValueChange={(itemValue) => setFormData({ ...formData, majorName: itemValue })}
                        style={{ height: 50 }}
                      >
                        <Picker.Item label="Select a major" value="" />
                        {majors.map((major) => (
                          <Picker.Item
                            key={major.id}
                            label={`${major.name}${!major.active ? ' (Inactive)' : ''}`}
                            value={major.name}
                          />
                        ))}
                      </Picker>
                    </View>
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
                  
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={handleSave}
                      disabled={saving}
                      className="flex-1 bg-teal-500 rounded-xl py-4 flex-row items-center justify-center"
                    >
                      {saving ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Ionicons name="save" size={20} color="white" />
                          <Text className="text-white font-medium ml-2">Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => setShowChangePassword(true)}
                      className="flex-1 bg-gray-100 rounded-xl py-4 flex-row items-center justify-center border border-gray-300"
                    >
                      <Ionicons name="lock-closed" size={20} color="#4B5563" />
                      <Text className="text-gray-700 font-medium ml-2">Password</Text>
                    </TouchableOpacity>
                  </View>
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

            {/* Activity Statistics - Real data from API */}
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              <Text className="text-xl font-bold text-gray-800 mb-4">Activity Statistics</Text>
              {statsLoading ? (
                <View className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} className="items-center p-4 bg-gray-100 rounded-xl">
                      <ActivityIndicator size="small" color="#6B7280" />
                      <Text className="text-sm text-gray-400 mt-2">Loading...</Text>
                    </View>
                  ))}
                </View>
              ) : userStats ? (
                <View className="grid grid-cols-2 gap-4">
                  <View className="items-center p-4 bg-blue-50 rounded-xl">
                    <Ionicons name="people" size={28} color="#3B82F6" />
                    <Text className="text-2xl font-bold text-blue-600 mt-2">{userStats.totalClubsJoined}</Text>
                    <Text className="text-sm text-gray-600">Clubs Joined</Text>
                  </View>
                  
                  <View className="items-center p-4 bg-green-50 rounded-xl">
                    <Ionicons name="calendar" size={28} color="#10B981" />
                    <Text className="text-2xl font-bold text-green-600 mt-2">{userStats.totalEventsJoined}</Text>
                    <Text className="text-sm text-gray-600">Events Joined</Text>
                  </View>
                  
                  <View className="items-center p-4 bg-purple-50 rounded-xl">
                    <Ionicons name="flame" size={28} color="#8B5CF6" />
                    <Text className="text-2xl font-bold text-purple-600 mt-2">{userStats.totalPointsEarned.toLocaleString()}</Text>
                    <Text className="text-sm text-gray-600">Points Earned</Text>
                  </View>
                  
                  <View className="items-center p-4 bg-amber-50 rounded-xl">
                    <Ionicons name="time" size={28} color="#F59E0B" />
                    <Text className="text-2xl font-bold text-amber-600 mt-2">{userStats.totalAttendanceDays}</Text>
                    <Text className="text-sm text-gray-600">Attendance Days</Text>
                  </View>
                </View>
              ) : (
                <View className="grid grid-cols-2 gap-4">
                  <View className="items-center p-4 bg-blue-50 rounded-xl">
                    <Ionicons name="people" size={28} color="#3B82F6" />
                    <Text className="text-2xl font-bold text-blue-600 mt-2">0</Text>
                    <Text className="text-sm text-gray-600">Clubs Joined</Text>
                  </View>
                  
                  <View className="items-center p-4 bg-green-50 rounded-xl">
                    <Ionicons name="calendar" size={28} color="#10B981" />
                    <Text className="text-2xl font-bold text-green-600 mt-2">0</Text>
                    <Text className="text-sm text-gray-600">Events Joined</Text>
                  </View>
                  
                  <View className="items-center p-4 bg-purple-50 rounded-xl">
                    <Ionicons name="flame" size={28} color="#8B5CF6" />
                    <Text className="text-2xl font-bold text-purple-600 mt-2">0</Text>
                    <Text className="text-sm text-gray-600">Points Earned</Text>
                  </View>
                  
                  <View className="items-center p-4 bg-amber-50 rounded-xl">
                    <Ionicons name="time" size={28} color="#F59E0B" />
                    <Text className="text-2xl font-bold text-amber-600 mt-2">0</Text>
                    <Text className="text-sm text-gray-600">Attendance Days</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <NavigationBar role={user?.role} user={user || undefined} />
      
      {/* Avatar Crop Modal */}
      <AvatarCropModal
        visible={showCropModal}
        onClose={handleCropCancel}
        imageUri={imageToCrop}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        minOutputWidth={512}
      />

      {/* Background Crop Modal (3:1 aspect ratio for wide background) */}
      <AvatarCropModal
        visible={showBackgroundCropModal}
        onClose={handleBackgroundCropCancel}
        imageUri={backgroundImageToCrop}
        onCropComplete={handleBackgroundCropComplete}
        aspectRatio={3}
        minOutputWidth={1800}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Complete Profile Modal */}
      <CompleteProfileModal
        visible={showCompleteProfile}
        onClose={() => {
          // Don't allow closing if profile is incomplete for students
          if (!profile?.needCompleteProfile) {
            setShowCompleteProfile(false);
          }
        }}
        onComplete={handleCompleteProfile}
        currentStudentCode={profile?.studentCode || ''}
        currentMajorName={profile?.majorName || ''}
      />
    </SafeAreaView>
  );
}
