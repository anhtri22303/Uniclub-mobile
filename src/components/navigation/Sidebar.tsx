import { Ionicons } from '@expo/vector-icons';
import UserService from '@services/user.service';
import { useAuthStore } from '@stores/auth.store';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

interface SidebarProps {
  role?: string;
}

interface MenuItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  label: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-SIDEBAR_WIDTH));
  
  // Profile widget state
  const [userPoints, setUserPoints] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Load user profile data
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      // Don't load if sidebar is closed or user is not logged in
      if (!isOpen || !user) return;
      
      try {
        setLoadingProfile(true);
        const profileData = await UserService.fetchProfile();
        
        if (!mounted) return;
        
        console.log('=== SIDEBAR PROFILE DATA ===');
        console.log('Full profile data:', JSON.stringify(profileData, null, 2));
        console.log('Wallet object:', profileData?.wallet);
        console.log('Balance points:', profileData?.wallet?.balancePoints);
        console.log('===========================');
        
        setAvatarUrl(profileData?.avatarUrl || '');
        setUserName(profileData?.fullName || user?.fullName || 'User');
        setUserEmail(profileData?.email || user?.email || '');
        
        // Get wallet points from profile - handle multiple cases
        const points = profileData?.wallet?.balancePoints ?? 0;
        console.log('Setting userPoints to:', points);
        setUserPoints(points);
      } catch (err) {
        console.error('Failed to load profile in Sidebar:', err);
        // Fallback to auth store data
        if (mounted) {
          setUserName(user?.fullName || 'User');
          setUserEmail(user?.email || '');
          setUserPoints(0); // Reset to 0 on error
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };
    
    loadProfile();
    
    return () => {
      mounted = false;
    };
  }, [isOpen, user]);

  // Helper functions for points card styling
  const getPointsCardStyle = (points: number) => {
    if (points >= 5000) {
      return {
        bgColor: 'bg-gradient-to-r from-purple-600 to-pink-600',
        textColor: 'text-white',
        subtitleColor: 'text-white/80',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
      };
    }
    if (points >= 3000) {
      return {
        bgColor: 'bg-gradient-to-r from-sky-500 to-indigo-500',
        textColor: 'text-white',
        subtitleColor: 'text-white/80',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
      };
    }
    if (points >= 1000) {
      return {
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-900',
        subtitleColor: 'text-amber-700',
        iconBg: 'bg-amber-200',
        iconColor: 'text-amber-600',
      };
    }
    return {
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-800',
      subtitleColor: 'text-slate-500',
      iconBg: 'bg-slate-200',
      iconColor: 'text-slate-600',
    };
  };

  const getUserInitials = () => {
    return (userName || 'User')
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const shouldShowPoints = role === 'student' || role === 'club_leader';
  const pointsStyle = getPointsCardStyle(userPoints);

  // Menu items based on role
  const getMenuItems = (): MenuItem[] => {
    if (role === 'club_leader') {
      return [
        {
          name: 'application',
          icon: 'document-text',
          route: '/club-leader/application',
          label: 'Application'
        },
        {
          name: 'members',
          icon: 'people',
          route: '/club-leader/members',
          label: 'Members'
        },
        {
          name: 'events',
          icon: 'calendar',
          route: '/club-leader/events',
          label: 'Events'
        },
        {
          name: 'gift',
          icon: 'gift',
          route: '/club-leader/gift',
          label: 'Gift'
        },
        {
          name: 'orders',
          icon: 'receipt',
          route: '/club-leader/orders',
          label: 'Orders'
        },
        {
          name: 'points',
          icon: 'trophy',
          route: '/club-leader/points',
          label: 'Points'
        },
        {
          name: 'attendances',
          icon: 'checkmark-done',
          route: '/club-leader/attendances',
          label: 'Attendances'
        }
      ];
    } else if (role === 'uni_staff') {
      return [
        {
          name: 'clubs',
          icon: 'business',
          route: '/uni-staff/clubs',
          label: 'Clubs'
        },
        {
          name: 'policies',
          icon: 'shield-checkmark',
          route: '/uni-staff/policies',
          label: 'Policies'
        },
        {
          name: 'club-requests',
          icon: 'document-text',
          route: '/uni-staff/club-requests',
          label: 'Club Requests'
        },
        {
          name: 'event-requests',
          icon: 'calendar',
          route: '/uni-staff/event-requests',
          label: 'Event Requests'
        },
        {
          name: 'points',
          icon: 'wallet',
          route: '/uni-staff/points',
          label: 'Points'
        }
      ];
    } else if (role === 'student') {
      const hasClub = user?.clubIds && user.clubIds.length > 0;
      const isStaff = user?.staff === true;
      
      // Debug logging
      console.log('=== SIDEBAR DEBUG ===');
      console.log('User object:', JSON.stringify(user, null, 2));
      console.log('clubIds:', user?.clubIds);
      console.log('staff:', user?.staff);
      console.log('hasClub:', hasClub);
      console.log('isStaff:', isStaff);
      console.log('====================');
      
      // Base menu items that are always shown
      const baseItems: MenuItem[] = [
        {
          name: 'clubs',
          icon: 'business',
          route: '/student/clubs',
          label: 'Clubs'
        },
        {
          name: 'history',
          icon: 'time',
          route: '/student/history',
          label: 'History'
        },
        {
          name: 'attendances',
          icon: 'checkmark-done-circle',
          route: '/student/attendances',
          label: 'Attendances'
        }
      ];
      
      // Items shown only if student has joined a club
      const clubMemberItems: MenuItem[] = hasClub ? [
        {
          name: 'my-club',
          icon: 'people',
          route: '/student/members',
          label: 'My Club'
        },
        {
          name: 'events',
          icon: 'calendar',
          route: '/student/events',
          label: 'Events'
        },
        {
          name: 'check-in',
          icon: 'checkmark-circle',
          route: '/student/check-in',
          label: 'Check In'
        },
        {
          name: 'gift',
          icon: 'gift',
          route: '/student/gift',
          label: 'Gift'
        },
        // {
        //   name: 'wallet',
        //   icon: 'wallet',
        //   route: '/student/wallet',
        //   label: 'Wallet'
        // }
      ] : [];
      
      // Items shown only if student is a staff member
      const staffItems: MenuItem[] = isStaff ? [
        {
          name: 'staff-history',
          icon: 'document-text',
          route: '/student/staff-history',
          label: 'Staff History'
        },
        {
          name: 'staff-gift',
          icon: 'gift-outline',
          route: '/student/staff-gift',
          label: 'Staff Gift'
        }
      ] : [];
      
      console.log('Base items count:', baseItems.length);
      console.log('Club member items count:', clubMemberItems.length);
      console.log('Staff items count:', staffItems.length);
      console.log('Total menu items:', [...baseItems, ...clubMemberItems, ...staffItems].length);
      
      return [...baseItems, ...clubMemberItems, ...staffItems];
    }
    return [];
  };

  const menuItems = useMemo(() => {
    const items = getMenuItems();
    console.log('Menu items recalculated. Total items:', items.length);
    return items;
  }, [role, user?.clubIds, user?.staff]);

  const toggleSidebar = () => {
    if (isOpen) {
      // Close sidebar
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsOpen(false));
    } else {
      // Open sidebar
      setIsOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleMenuPress = (route: string) => {
    router.push(route as any);
    toggleSidebar();
  };

  const isActive = (route: string) => {
    return pathname === route || pathname.startsWith(route);
  };

  const handleLogout = async () => {
    await logout();
    toggleSidebar();
    router.replace('/login' as any);
  };

  // Only show sidebar for CLUB_LEADER, UNIVERSITY_STAFF, and STUDENT
  const shouldShowSidebar = role === 'club_leader' || role === 'uni_staff' || role === 'student';
  
  if (!shouldShowSidebar) {
    return null;
  }

  return (
    <>
      {/* Toggle Button - Always visible in top-left corner */}
      <TouchableOpacity
        onPress={toggleSidebar}
        className="absolute top-4 left-4 bg-teal-600 p-3 rounded-full shadow-lg"
        style={{ 
          zIndex: 9999,
          elevation: 10
        }}
      >
        <Ionicons name="menu" size={24} color="white" />
      </TouchableOpacity>

      {/* Sidebar Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        onRequestClose={toggleSidebar}
      >
        <View className="flex-1 flex-row">
          {/* Sidebar Content */}
          <Animated.View
            className="bg-white h-full shadow-2xl"
            style={{
              width: SIDEBAR_WIDTH,
              transform: [{ translateX: slideAnim }],
              elevation: 16,
            }}
          >
            {/* Header */}
            <View className="bg-teal-600 pt-12 pb-6 px-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-2xl font-bold">Menu</Text>
                <TouchableOpacity
                  onPress={toggleSidebar}
                  className="bg-teal-700 p-2 rounded-full"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="text-teal-100 text-sm">
                {role === 'club_leader' 
                  ? 'Club Leader Portal' 
                  : role === 'uni_staff' 
                  ? 'University Staff Portal' 
                  : 'Student Portal'}
              </Text>
            </View>

            {/* Menu Items */}
            <ScrollView className="flex-1 py-4" showsVerticalScrollIndicator={false}>
              {menuItems.map((item) => {
                const active = isActive(item.route);
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => handleMenuPress(item.route)}
                    className={`flex-row items-center px-6 py-4 ${
                      active ? 'bg-teal-50 border-l-4 border-teal-600' : ''
                    }`}
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        active ? 'bg-teal-600' : 'bg-gray-100'
                      }`}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={active ? 'white' : '#6B7280'}
                      />
                    </View>
                    <Text
                      className={`ml-4 text-base font-medium ${
                        active ? 'text-teal-600' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </Text>
                    {active && (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#0D9488"
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Profile Widget Footer */}
            <View className="border-t border-gray-200 bg-gray-50">
              {loadingProfile ? (
                <View className="p-6 items-center">
                  <ActivityIndicator size="small" color="#0D9488" />
                </View>
              ) : (
                <View className="p-4 space-y-3">
                  {/* Points Card (for students and club leaders) */}
                  {shouldShowPoints && (
                    <View className="rounded-lg overflow-hidden shadow-sm bg-gradient-to-r from-purple-600 to-pink-600" style={{ backgroundColor: '#9333EA' }}>
                      <View className="p-4 flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-xs font-medium text-white/80 mb-1">
                            Accumulated Points
                          </Text>
                          <Text className="text-3xl font-bold text-white">
                            {userPoints?.toLocaleString() || '0'}
                          </Text>
                        </View>
                        <View className="p-3 rounded-full bg-white/20">
                          <Ionicons name="flame" size={28} color="white" />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* User Info Card */}
                  <View className="bg-white rounded-lg p-3 shadow-sm">
                    <View className="flex-row items-center">
                      {/* Avatar */}
                      <View className="w-12 h-12 rounded-full overflow-hidden bg-teal-600 items-center justify-center">
                        {avatarUrl ? (
                          <Image
                            source={{ uri: avatarUrl }}
                            className="w-12 h-12 rounded-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-white font-bold text-sm">{getUserInitials()}</Text>
                        )}
                      </View>
                      
                      {/* User Details */}
                      <View className="flex-1 ml-3">
                        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                          {userName}
                        </Text>
                        <Text className="text-xs text-gray-500" numberOfLines={1}>
                          {userEmail}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Logout Button */}
                  <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-red-50 rounded-lg px-4 py-3 flex-row items-center justify-center space-x-2 border border-red-200"
                  >
                    <Ionicons name="log-out" size={20} color="#DC2626" />
                    <Text className="text-base font-semibold text-red-600">
                      Logout
                    </Text>
                  </TouchableOpacity>

                  {/* Version Info */}
                  <View className="pt-2">
                    <Text className="text-xs text-gray-500 text-center">
                      UniClub Management System
                    </Text>
                    <Text className="text-xs text-gray-400 text-center mt-1">
                      Version 1.0.0
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Overlay - Close sidebar when tapping outside */}
          <TouchableOpacity
            className="flex-1 bg-black/50"
            activeOpacity={1}
            onPress={toggleSidebar}
          />
        </View>
      </Modal>
    </>
  );
}
