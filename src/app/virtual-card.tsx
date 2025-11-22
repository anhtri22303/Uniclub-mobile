import { PatternRenderer } from '@components/PatternRenderer';
import { Ionicons } from '@expo/vector-icons';
import CardService, { CardDesign } from '@services/card.service';
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
  Modal,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

// Helper function to parse gradient colors from Tailwind classes or hex colors
const parseGradientColors = (gradient?: string): string[] => {
  if (!gradient) return ['#6366F1', '#8B5CF6', '#EC4899']; // Default gradient

  // If gradient is already hex colors separated by spaces
  const hexColors = gradient.match(/#[0-9A-Fa-f]{6}/g);
  if (hexColors && hexColors.length > 0) {
    return hexColors;
  }

  // Comprehensive map of Tailwind color names to hex values
  const tailwindColorMap: Record<string, string> = {
    // Blues
    'blue-200': '#BFDBFE', 'blue-300': '#93C5FD', 'blue-400': '#60A5FA',
    'blue-500': '#3B82F6', 'blue-600': '#2563EB', 'blue-700': '#1D4ED8', 'blue-800': '#1E40AF',
    // Indigos
    'indigo-500': '#6366F1', 'indigo-600': '#4F46E5', 'indigo-700': '#4338CA', 'indigo-800': '#3730A3',
    // Purples
    'purple-200': '#E9D5FF', 'purple-300': '#D8B4FE', 'purple-400': '#C084FC',
    'purple-500': '#A855F7', 'purple-600': '#9333EA', 'purple-700': '#7E22CE', 'purple-800': '#6B21A8',
    // Pinks
    'pink-200': '#FBCFE8', 'pink-300': '#F9A8D4', 'pink-400': '#F472B6',
    'pink-500': '#EC4899', 'pink-600': '#DB2777', 'pink-700': '#BE185D', 'pink-800': '#9F1239',
    // Roses
    'rose-200': '#FECDD3', 'rose-300': '#FDA4AF', 'rose-400': '#FB7185',
    'rose-500': '#F43F5E', 'rose-600': '#E11D48', 'rose-700': '#BE123C', 'rose-800': '#9F1239',
    // Sky
    'sky-200': '#BAE6FD', 'sky-300': '#7DD3FC', 'sky-400': '#38BDF8',
    'sky-500': '#0EA5E9', 'sky-600': '#0284C7', 'sky-700': '#0369A1',
    // Cyans
    'cyan-200': '#A5F3FC', 'cyan-300': '#67E8F9', 'cyan-400': '#22D3EE',
    'cyan-500': '#06B6D4', 'cyan-600': '#0891B2', 'cyan-700': '#0E7490', 'cyan-800': '#155E75',
    // Teals
    'teal-500': '#14B8A6', 'teal-600': '#0D9488', 'teal-700': '#0F766E',
    // Emeralds
    'emerald-500': '#10B981', 'emerald-600': '#059669', 'emerald-700': '#047857',
    // Greens
    'green-200': '#BBF7D0', 'green-300': '#86EFAC', 'green-400': '#4ADE80',
    'green-500': '#22C55E', 'green-600': '#16A34A', 'green-700': '#15803D', 'green-800': '#166534',
    // Limes
    'lime-500': '#84CC16', 'lime-600': '#65A30D', 'lime-700': '#4D7C0F',
    // Yellows
    'yellow-500': '#EAB308', 'yellow-600': '#CA8A04', 'yellow-700': '#A16207',
    // Ambers
    'amber-500': '#F59E0B', 'amber-600': '#D97706', 'amber-700': '#B45309',
    // Oranges
    'orange-500': '#F97316', 'orange-600': '#EA580C', 'orange-700': '#C2410C',
    // Reds
    'red-500': '#EF4444', 'red-600': '#DC2626', 'red-700': '#B91C1C', 'red-800': '#991B1B',
    // Violets
    'violet-500': '#8B5CF6', 'violet-600': '#7C3AED', 'violet-700': '#6D28D9',
    // Fuchsias
    'fuchsia-500': '#D946EF', 'fuchsia-600': '#C026D3', 'fuchsia-700': '#A21CAF',
    // Grays
    'gray-300': '#D1D5DB', 'gray-400': '#9CA3AF', 'gray-500': '#6B7280',
    'gray-600': '#4B5563', 'gray-700': '#374151', 'gray-800': '#1F2937', 'gray-900': '#111827',
    // Blacks
    'black': '#000000',
  };

  // Extract color names from Tailwind classes (e.g., "from-blue-600 via-purple-600 to-indigo-700")
  const colorMatches = gradient.match(/(?:from-|via-|to-)([a-z]+-\d+)/g);
  if (colorMatches) {
    return colorMatches.map(match => {
      const colorName = match.replace(/^(?:from-|via-|to-)/, '');
      return tailwindColorMap[colorName] || '#6366F1';
    });
  }

  // Check if it's a solid color class (e.g., "bg-blue-600")
  const solidColorMatch = gradient.match(/bg-([a-z]+-\d+|black)/);
  if (solidColorMatch) {
    const colorName = solidColorMatch[1];
    const color = tailwindColorMap[colorName] || '#6366F1';
    return [color, color]; // Return same color twice for solid effect
  }

  return ['#6366F1', '#8B5CF6', '#EC4899']; // Default gradient
};

// Helper function to parse border radius from Tailwind classes to numeric value
const parseBorderRadius = (borderRadius?: string): number => {
  if (!borderRadius) return 24; // Default rounded-3xl

  const radiusMap: Record<string, number> = {
    'rounded-sm': 4,
    'rounded': 8,
    'rounded-md': 12,
    'rounded-lg': 16,
    'rounded-xl': 20,
    'rounded-2xl': 24,
    'rounded-3xl': 28,
    'rounded-full': 9999,
  };

  return radiusMap[borderRadius] || 24;
};

export default function VirtualCardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const viewShotRef = useRef<View>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  
  // Card design states
  const [cardDesign, setCardDesign] = useState<CardDesign | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  
  // Club selection states
  const [availableClubIds, setAvailableClubIds] = useState<number[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [showClubSelector, setShowClubSelector] = useState(false);

  const formatRoleName = (roleName?: string) => {
    if (!roleName) return '';
    const map: Record<string, string> = {
      STUDENT: 'STUDENT',
      MEMBER: 'STUDENT',
      CLUB_MANAGER: 'CLUB LEADER',
      UNIVERSITY_STAFF: 'UNIVERSITY STAFF',
      UNI_ADMIN: 'UNIVERSITY ADMIN',
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
      
      // Extract club IDs from multiple possible sources
      const clubIds: number[] = [];
      
      // 1. From clubs array (wallet data)
      if (profileData.clubs && Array.isArray(profileData.clubs)) {
        profileData.clubs.forEach((club: any) => {
          if (club.clubId) {
            clubIds.push(club.clubId);
          }
        });
      }
      
      // 2. From memberships array
      if (profileData.memberships && Array.isArray(profileData.memberships)) {
        profileData.memberships.forEach((membership: any) => {
          if (membership.club?.clubId && !clubIds.includes(membership.club.clubId)) {
            clubIds.push(membership.club.clubId);
          }
        });
      }
      
      console.log('📋 Available club IDs:', clubIds);
      setAvailableClubIds(clubIds);
      
      // Auto-select first club if available
      if (clubIds.length > 0 && !selectedClubId) {
        setSelectedClubId(clubIds[0]);
      }
    } catch (err) {
      console.error('❌ Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.userId]);

  // Fetch card design when selectedClubId changes
  useEffect(() => {
    const fetchCardDesign = async () => {
      if (!selectedClubId) {
        setCardDesign(null);
        return;
      }

      try {
        setLoadingCard(true);
        console.log('  Fetching card design for clubId:', selectedClubId);
        const design = await CardService.getCardByClubId(selectedClubId);
        console.log('  Card design fetched:', JSON.stringify(design, null, 2));
        
        // Debug: Show parsed colors
        const colors = parseGradientColors(design.gradient);
        console.log('  Parsed gradient colors:', colors);
        console.log('  Border radius:', design.borderRadius, '→', parseBorderRadius(design.borderRadius));
        console.log('  Pattern:', design.pattern);
        console.log('  Pattern opacity:', design.patternOpacity);
        console.log('  Card opacity:', design.cardOpacity);
        console.log('  QR size:', design.qrSize);
        console.log('  Show logo:', design.showLogo);
        console.log('  Logo URL:', design.logoUrl);
        
        setCardDesign(design);
      } catch {
        // Silently use default design if card design is not found
        console.log('  No custom card design found, using default template');
        setCardDesign(null);
      } finally {
        setLoadingCard(false);
      }
    };

    fetchCardDesign();
  }, [selectedClubId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get current club's info
  const getCurrentClubWallet = () => {
    if (!profile?.clubs || !selectedClubId) return null;
    return profile.clubs.find((club: any) => club.clubId === selectedClubId);
  };

  // Get current membership info
  const getCurrentMembership = () => {
    if (!profile?.memberships || !selectedClubId) return null;
    return profile.memberships.find((membership: any) => 
      membership.club?.clubId === selectedClubId
    );
  };

  // Get club name for display
  const getClubName = () => {
    if (cardDesign?.clubName) return cardDesign.clubName;
    
    // Try wallet first
    const club = getCurrentClubWallet();
    if (club?.clubName) return club.clubName;
    
    // Try membership
    const membership = getCurrentMembership();
    if (membership?.club?.name) return membership.club.name;
    
    return 'UniClub';
  };

  // Get member role/level for display
  const getMemberRole = () => {
    const membership = getCurrentMembership();
    if (membership?.level) {
      return formatRoleName(membership.level);
    }
    return formatRoleName(profile?.role?.roleName);
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
          {availableClubIds.length > 1 && (
            <TouchableOpacity
              onPress={() => setShowClubSelector(true)}
              className="mr-3 p-2"
            >
              <Ionicons name="list" size={24} color="#3B82F6" />
            </TouchableOpacity>
          )}
          
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

      {/* Virtual Card - Scrollable and Responsive */}
      <ScrollView 
        className="flex-1 px-4 py-3"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {loadingCard && (
          <View className="items-center mb-4">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="text-gray-600 mt-2 text-sm">Loading card design...</Text>
          </View>
        )}
        
        <View ref={viewShotRef} collapsable={false} style={{ width: '100%', flex: 1 }}>
          <LinearGradient
            colors={parseGradientColors(cardDesign?.gradient) as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ 
              flex: 1,
              borderRadius: parseBorderRadius(cardDesign?.borderRadius),
              opacity: cardDesign?.cardOpacity ? cardDesign.cardOpacity / 100 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
              overflow: 'hidden',
            }}
          >
            {/* Background Pattern */}
            <PatternRenderer 
              pattern={cardDesign?.pattern || 'circles'} 
              opacity={cardDesign?.patternOpacity || 10} 
            />

            <View className="p-6 relative z-10 flex-1 justify-between">
              {/* Card Header */}
              <View className="flex-row items-start justify-between mb-6">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white mb-1" numberOfLines={2}>
                    {getClubName()}
                  </Text>
                  <Text className="text-white/80 text-xs">Member Identification Card</Text>
                </View>
                <View className="items-end ml-2">
                  {cardDesign?.showLogo && cardDesign?.logoUrl ? (
                    <Image
                      source={{ uri: cardDesign.logoUrl }}
                      style={{ 
                        width: cardDesign.logoSize || 45, 
                        height: cardDesign.logoSize || 45 
                      }}
                      resizeMode="contain"
                    />
                  ) : (
                    <>
                      <Text className="text-white/70 text-xs">Valid Until</Text>
                      <Text className="text-white font-semibold text-sm">
                        {new Date().getFullYear() + 1}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Avatar Section */}
              <View className="items-center mb-6">
                <View className="w-28 h-28 rounded-full bg-white/20 items-center justify-center overflow-hidden mb-4">
                  {profile.avatarUrl ? (
                    <Image
                      source={{ uri: profile.avatarUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-2xl font-bold text-white">
                      {getInitials(profile.fullName)}
                    </Text>
                  )}
                </View>
                
                <Text className="text-2xl font-bold text-white text-center mb-2" numberOfLines={2}>
                  {profile.fullName}
                </Text>
                <Text className="text-white/90 text-base text-center mb-3" numberOfLines={1}>
                  {profile.email}
                </Text>
                <View className="bg-white/20 px-4 py-2 rounded-full">
                  <Text className="text-white font-medium text-sm">
                    {getMemberRole()}
                  </Text>
                </View>
              </View>

              {/* Student Info */}
              <View className="bg-white/10 rounded-xl p-4 mb-6">
                <View className="flex-row items-center justify-center mb-3">
                  <Text className="text-white/80 text-sm bg-white/20 px-3 py-1.5 rounded mr-2">
                    STUDENT ID
                  </Text>
                  <Text className="text-white font-mono text-lg font-bold">
                    {profile.studentCode || 'N/A'}
                  </Text>
                </View>
                <Text className="text-white text-center text-base font-medium" numberOfLines={2}>
                  {profile.majorName || 'N/A'}
                </Text>
                {profile.phone && (
                  <Text className="text-white/80 text-center text-sm mt-2">
                    {profile.phone}
                  </Text>
                )}
              </View>

              {/* QR Code */}
              <View className="items-center">
                <View className="bg-white p-4 rounded-xl">
                  <QRCode
                    value={getQRData()}
                    size={cardDesign?.qrSize || 160}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text className="text-white/80 text-sm text-center mt-3">
                  Scan for profile info
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Club Selector Modal */}
      <Modal
        visible={showClubSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowClubSelector(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">Select Club</Text>
              <TouchableOpacity onPress={() => setShowClubSelector(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="max-h-96">
              {availableClubIds.map((clubId) => {
                const club = profile?.clubs?.find((c: any) => c.clubId === clubId);
                const membership = profile?.memberships?.find((m: any) => m.club?.clubId === clubId);
                const isSelected = selectedClubId === clubId;
                
                // Get club name from either source
                const clubName = club?.clubName || membership?.club?.name || `Club ${clubId}`;
                const memberLevel = membership?.level ? formatRoleName(membership.level) : null;
                
                return (
                  <TouchableOpacity
                    key={clubId}
                    onPress={() => {
                      setSelectedClubId(clubId);
                      setShowClubSelector(false);
                    }}
                    className={`flex-row items-center justify-between p-4 mb-2 rounded-xl ${
                      isSelected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'
                    }`}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text className={`text-lg font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                          {clubName}
                        </Text>
                        {memberLevel && (
                          <View className="bg-teal-500 px-2 py-1 rounded ml-2">
                            <Text className="text-white text-xs font-medium">{memberLevel}</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-gray-600">
                        Points: {club?.balancePoints?.toLocaleString() || '0'}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={28} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
