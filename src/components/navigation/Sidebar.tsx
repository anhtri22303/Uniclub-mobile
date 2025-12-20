import { useProfile } from '@contexts/ProfileContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiMembershipWallet } from '@services/user.service';
import { ClubWallet, WalletService } from '@services/wallet.service';
import { useAuthStore } from '@stores/auth.store';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;
const BUTTON_SIZE = 56; // Size of the toggle button
const STORAGE_KEY = 'sidebar_button_position';

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
  const { profile, refreshProfile, hasClub, userClubs, isLoading: loadingProfile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-SIDEBAR_WIDTH));
  
  // Draggable button position
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 48 })).current; // Default position (left edge, top: 48)
  const [isDragging, setIsDragging] = useState(false);
  
  // Club wallet state (for club leaders)
  const [clubWallet, setClubWallet] = useState<ClubWallet | null>(null);
  const [clubWalletLoading, setClubWalletLoading] = useState(false);
  
  // Wallet selection state (for multiple wallets)
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  
  // Profile widget state (derived from context)
  const avatarUrl = profile?.avatarUrl || '';
  const userName = profile?.fullName || user?.fullName || 'User';
  const userEmail = profile?.email || user?.email || '';

  // Load saved button position
  useEffect(() => {
    loadButtonPosition();
  }, []);

  // Load club wallet for club leaders
  useEffect(() => {
    const loadClubWallet = async () => {
      if (role === 'club_leader' && !loadingProfile && user?.clubIds?.[0]) {
        setClubWalletLoading(true);
        try {
          const clubId = user.clubIds[0];
          const wallet = await WalletService.getClubWallet(clubId);
          setClubWallet(wallet);
        } catch (error) {
          console.error('Failed to load club wallet:', error);
        } finally {
          setClubWalletLoading(false);
        }
      }
    };
    loadClubWallet();
  }, [role, loadingProfile, user?.clubIds]);

  // Refresh profile when sidebar opens
  useEffect(() => {
    if (isOpen && user) {
      refreshProfile();
    }
  }, [isOpen, user, refreshProfile]);

  // Load button position from storage
  const loadButtonPosition = async () => {
    try {
      const savedPosition = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedPosition) {
        const { x, y } = JSON.parse(savedPosition);
        pan.setValue({ x, y });
      }
    } catch (error) {
      console.error('Error loading button position:', error);
    }
  };

  // Save button position to storage
  const saveButtonPosition = async (x: number, y: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
    } catch (error) {
      console.error('Error saving button position:', error);
    }
  };

  // Reset button position to default
  const resetButtonPosition = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      Animated.spring(pan, {
        toValue: { x: 0, y: 48 },
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error('Error resetting button position:', error);
    }
  };

  // Pan responder for draggable button
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gesture) => {
        // Only capture if moved more than 10 pixels (to allow tap and scroll)
        const distance = Math.sqrt(gesture.dx * gesture.dx + gesture.dy * gesture.dy);
        return distance > 10;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        
        // Get final position
        let finalX = (pan.x as any)._value;
        let finalY = (pan.y as any)._value;
        
        // Snap to nearest horizontal edge (left or right)
        const centerX = finalX + BUTTON_SIZE / 2;
        if (centerX < width / 2) {
          finalX = 0; // Snap to left edge
        } else {
          finalX = width - BUTTON_SIZE; // Snap to right edge
        }
        
        // Constrain Y to screen bounds (with padding)
        finalY = Math.max(0, Math.min(finalY, height - BUTTON_SIZE));
        
        // Animate to edge
        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          friction: 8,
          tension: 40,
          useNativeDriver: false,
        }).start();
        
        // Save position
        saveButtonPosition(finalX, finalY);
        
        setIsDragging(false);
      },
    })
  ).current;

  // Helper functions for points card styling - Updated to match web
  const getPointsCardStyle = (points: number, isClubWallet: boolean = false) => {
    // If it's club wallet, return fixed blue style
    if (isClubWallet) {
      return {
        bgColor: '#3B82F6', // Blue for club wallet
        textColor: 'text-white',
        subtitleColor: 'text-white/90',
        iconBg: 'bg-white/20',
        iconColor: 'white',
      };
    }
    if (points >= 10000) {
      return {
        bgColor: '#EC4899', // Pink/Purple gradient base
        textColor: 'text-white',
        subtitleColor: 'text-white/90',
        iconBg: 'bg-white/30',
        iconColor: 'white',
      };
    }
    if (points >= 7000) {
      return {
        bgColor: '#F43F5E', // Rose/Red
        textColor: 'text-white',
        subtitleColor: 'text-white/85',
        iconBg: 'bg-white/25',
        iconColor: 'white',
      };
    }
    if (points >= 5000) {
      return {
        bgColor: '#F97316', // Orange/Red/Pink
        textColor: 'text-white',
        subtitleColor: 'text-white/80',
        iconBg: 'bg-white/20',
        iconColor: 'white',
      };
    }
    if (points >= 3000) {
      return {
        bgColor: '#EA580C', // Orange
        textColor: 'text-white',
        subtitleColor: 'text-white/80',
        iconBg: 'bg-white/20',
        iconColor: 'white',
      };
    }
    if (points >= 2000) {
      return {
        bgColor: '#F59E0B', // Yellow/Orange
        textColor: 'text-white',
        subtitleColor: 'text-white/80',
        iconBg: 'bg-white/20',
        iconColor: 'white',
      };
    }
    if (points >= 1500) {
      return {
        bgColor: '#EAB308', // Yellow
        textColor: 'text-white',
        subtitleColor: 'text-white/75',
        iconBg: 'bg-white/20',
        iconColor: 'white',
      };
    }
    if (points >= 1000) {
      return {
        bgColor: '#84CC16', // Lime/Yellow
        textColor: 'text-white',
        subtitleColor: 'text-white/80',
        iconBg: 'bg-white/20',
        iconColor: 'white',
      };
    }
    if (points >= 500) {
      return {
        bgColor: '#22C55E', // Green/Lime
        textColor: 'text-white',
        subtitleColor: 'text-white/75',
        iconBg: 'bg-white/20',
        iconColor: 'white',
      };
    }
    if (points >= 200) {
      return {
        bgColor: '#14B8A6', // Cyan/Green
        textColor: 'text-white',
        subtitleColor: 'text-white/80',
        iconBg: 'bg-white/20',
        iconColor: 'white',
      };
    }
    if (points >= 50) {
      return {
        bgColor: '#06B6D4', // Blue/Cyan
        textColor: 'text-white',
        subtitleColor: 'text-white/80',
        iconBg: 'bg-white/20',
        iconColor: 'white',
      };
    }
    return {
      bgColor: '#94A3B8', // Slate/Gray
      textColor: 'text-slate-800',
      subtitleColor: 'text-slate-600',
      iconBg: 'bg-slate-200',
      iconColor: '#475569',
    };
  };

  // Point levels configuration for reference
  const pointLevels = [
    { min: 10000, label: '10,000+', name: '🏆 Legendary', desc: 'Rainbow flame' },
    { min: 7000, label: '7,000+', name: '💎 Epic', desc: 'Crimson flame' },
    { min: 5000, label: '5,000+', name: '👑 Master', desc: 'Hot flame' },
    { min: 3000, label: '3,000+', name: '⭐ Expert', desc: 'Orange flame' },
    { min: 2000, label: '2,000+', name: '🌟 Advanced', desc: 'Yellow flame' },
    { min: 1500, label: '1,500+', name: '✨ Skilled', desc: 'Bright flame' },
    { min: 1000, label: '1,000+', name: '📈 Intermediate', desc: 'Warming up' },
    { min: 500, label: '500+', name: '🌱 Beginner', desc: 'Green flame' },
    { min: 200, label: '200+', name: '🔰 Novice', desc: 'Cool flame' },
    { min: 50, label: '50+', name: '🌿 Starter', desc: 'Blue flame' },
    { min: 0, label: '0-49', name: '💤 Inactive', desc: 'No flame' },
  ];

  // Get current point level
  const getCurrentPointLevel = (points: number) => {
    for (const level of pointLevels) {
      if (points >= level.min) {
        return level;
      }
    }
    return pointLevels[pointLevels.length - 1];
  };

  const getUserInitials = () => {
    return (userName || 'User')
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Compute memberships list (similar to web)
  const memberships = useMemo((): ApiMembershipWallet[] => {
    if (!profile) return [];

    // Support both new API (wallets) and old API (wallet)
    let walletsList = profile?.wallets || [];

    if (!walletsList || walletsList.length === 0) {
      if (profile?.wallet) {
        // Create an array with 1 wallet - user's personal wallet
        walletsList = [{
          walletId: profile.wallet.walletId,
          balancePoints: profile.wallet.balancePoints,
          ownerType: profile.wallet.ownerType || 'USER',
          clubId: 0,
          clubName: 'My Points',
          userId: profile.wallet.userId,
          userFullName: profile.wallet.userFullName
        }];
      }
    }

    // For club leaders, add club wallet at the beginning
    if (role === 'club_leader' && clubWallet) {
      const clubWalletEntry: ApiMembershipWallet = {
        walletId: clubWallet.walletId,
        balancePoints: clubWallet.balancePoints,
        ownerType: clubWallet.ownerType,
        clubId: clubWallet.clubId,
        clubName: clubWallet.clubName || 'Club Wallet',
        userId: clubWallet.userId || 0,
        userFullName: clubWallet.userFullName || ''
      };
      
      // Add club wallet at the beginning
      walletsList = [clubWalletEntry, ...walletsList];
    }

    // Map data - rename personal wallet to "My Points"
    return walletsList.map((w: any) => ({
      walletId: w.walletId,
      balancePoints: w.balancePoints,
      ownerType: w.ownerType === 'USER' ? 'USER' : w.ownerType,
      clubId: w.clubId,
      clubName: w.ownerType === 'USER' ? 'My Points' : w.clubName,
      userId: w.userId,
      userFullName: w.userFullName
    }));
  }, [profile, role, clubWallet]);

  // Auto-select first wallet when memberships change
  useEffect(() => {
    if (memberships.length === 0) {
      setSelectedWalletId('');
      return;
    }

    // Prefer Club Wallet (ownerType = "CLUB") as default for club leader
    if (role === 'club_leader' && clubWallet) {
      const clubWalletInList = memberships.find(m => m.ownerType === 'CLUB');
      if (clubWalletInList) {
        setSelectedWalletId(clubWalletInList.walletId.toString());
        return;
      }
    }

    // If no wallet selected yet, select the first one
    if (!selectedWalletId && memberships.length > 0) {
      setSelectedWalletId(memberships[0].walletId.toString());
    }
  }, [memberships, selectedWalletId, role, clubWallet]);

  // Compute user points from selected wallet
  const userPoints = useMemo(() => {
    if (loadingProfile || memberships.length === 0) return 0;

    // Find the selected wallet
    const selectedMembership = memberships.find(m => m.walletId.toString() === selectedWalletId);
    if (selectedMembership) {
      return Number(selectedMembership.balancePoints) || 0;
    }

    // Fallback to 0 if not found
    return 0;
  }, [selectedWalletId, memberships, loadingProfile]);

  // Check if selected wallet is club wallet
  const selectedMembership = memberships.find(m => m.walletId.toString() === selectedWalletId);
  const isClubWallet = selectedMembership?.ownerType === 'CLUB';

  const shouldShowPoints = role === 'student' || role === 'club_leader';
  const pointsStyle = getPointsCardStyle(userPoints, isClubWallet);

  // Handle wallet selection
  const handleWalletSelect = (walletId: string) => {
    setSelectedWalletId(walletId);
    setShowWalletDropdown(false);
  };

  // Handle points card press
  const handlePointsCardPress = () => {
    if (role === 'club_leader') {
      router.push('/club-leader/points' as any);
    } else if (role === 'student') {
      router.push('/student/history?tab=wallet' as any);
    }
    toggleSidebar();
  };

  // Menu items based on role
  const getMenuItems = (): MenuItem[] => {
    if (role === 'club_leader') {
      return [
        // {
        //   name: 'application',
        //   icon: 'document-text',
        //   route: '/club-leader/application',
        //   label: 'Application'
        // },
        // {
        //   name: 'members',
        //   icon: 'people',
        //   route: '/club-leader/members',
        //   label: 'Members'
        // },
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
          name: 'event-orders',
          icon: 'calendar-outline',
          route: '/club-leader/event-orders',
          label: 'Event Orders'
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
        },
        {
          name: 'feedbacks',
          icon: 'star',
          route: '/club-leader/feedbacks',
          label: 'Feedbacks'
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
        },
        {
          name: 'feedbacks',
          icon: 'star',
          route: '/uni-staff/feedbacks',
          label: 'Feedbacks'
        },
        {
          name: 'locations',
          icon: 'location',
          route: '/uni-staff/locations',
          label: 'Locations'
        },
        {
          name: 'tags',
          icon: 'pricetags',
          route: '/uni-staff/tags',
          label: 'Tags'
        },
        {
          name: 'multiplier-policy',
          icon: 'trending-up',
          route: '/uni-staff/multiplier-policy',
          label: 'Multiplier Policy'
        },
        {
          name: 'majors',
          icon: 'book',
          route: '/uni-staff/majors',
          label: 'Majors'
        },
        {
          name: 'points-req',
          icon: 'document-text',
          route: '/uni-staff/points-req',
          label: 'Points Request'
        }
      ];
    } else if (role === 'student') {
      // Use hasClub from ProfileContext (already computed)
      const isStaff = user?.staff === true;
      
      // Debug logging
      // console.log('=== SIDEBAR MENU DEBUG ===');
      // console.log('User clubs from ProfileContext:', JSON.stringify(userClubs, null, 2));
      // console.log('staff:', user?.staff);
      // console.log('hasClub:', hasClub);
      // console.log('isStaff:', isStaff);
      // console.log('====================');
      
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
        }
      ];
      
      // Show "Events Public" and "Check In" when student has NO club
      const publicEventsItems: MenuItem[] = !hasClub ? [
        {
          name: 'events-public',
          icon: 'globe',
          route: '/student/events-public',
          label: 'Events Public'
        },
        {
          name: 'check-in',
          icon: 'checkmark-circle',
          route: '/student/check-in',
          label: 'Check In'
        }
      ] : [];
      
      // Items shown only if student has joined a club
      const clubMemberItems: MenuItem[] = hasClub ? [
        {
          name: 'attendances',
          icon: 'checkmark-done-circle',
          route: '/student/attendances',
          label: 'Attendances'
        },
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
        }
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
      
      // console.log('Base items count:', baseItems.length);
      // console.log('Public events items count:', publicEventsItems.length);
      // console.log('Club member items count:', clubMemberItems.length);
      // console.log('Staff items count:', staffItems.length);
      // console.log('Total menu items:', [...baseItems, ...publicEventsItems, ...clubMemberItems, ...staffItems].length);
      
      return [...baseItems, ...publicEventsItems, ...clubMemberItems, ...staffItems];
    }
    return [];
  };

  const menuItems = useMemo(() => {
    const items = getMenuItems();
    console.log('Menu items recalculated. Total items:', items.length);
    return items;
  }, [role, hasClub, userClubs, user?.staff]);

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
    // Refresh profile before navigation to ensure latest data
    refreshProfile();
    router.push(route as any);
    toggleSidebar();
  };

  const isActive = (route: string) => {
    return pathname === route || pathname.startsWith(route);
  };

  const handleLogout = async () => {
    // Close sidebar first to prevent any re-renders during logout
    toggleSidebar();
    
    // Reset button position on logout
    await resetButtonPosition();
    
    // Small delay to ensure sidebar animation completes
    setTimeout(async () => {
      await logout();
      router.replace('/login' as any);
    }, 300);
  };

  // Only show sidebar for CLUB_LEADER, UNIVERSITY_STAFF, and STUDENT
  const shouldShowSidebar = role === 'club_leader' || role === 'uni_staff' || role === 'student';
  
  if (!shouldShowSidebar) {
    return null;
  }

  return (
    <>
      {/* Draggable Toggle Button */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          zIndex: 9999,
          elevation: 10,
        }}
        pointerEvents="box-none"
      >
        <View
          {...panResponder.panHandlers}
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
          }}
        >
          <TouchableOpacity
            onPress={toggleSidebar}
            activeOpacity={0.7}
            className="bg-teal-600 rounded-full shadow-lg"
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: isDragging ? 0.7 : 1,
            }}
          >
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

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
              {loadingProfile || clubWalletLoading ? (
                <View className="p-6 items-center">
                  <ActivityIndicator size="small" color="#0D9488" />
                </View>
              ) : (
                <View className="p-4 space-y-3">
                  {/* Points Card (for students and club leaders) */}
                  {shouldShowPoints && (
                    <View>
                      {/* Main Points Card */}
                      <TouchableOpacity
                        onPress={memberships.length >= 2 ? () => setShowWalletDropdown(!showWalletDropdown) : handlePointsCardPress}
                        className="rounded-lg overflow-hidden shadow-md"
                        style={{ backgroundColor: pointsStyle.bgColor }}
                        activeOpacity={0.8}
                      >
                        <View className="p-4 flex-row items-center justify-between">
                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text className="text-xs font-medium text-white/80 mb-1">
                                {selectedMembership?.clubName || 'Points'}
                              </Text>
                              {memberships.length >= 2 && (
                                <Ionicons 
                                  name={showWalletDropdown ? 'chevron-up' : 'chevron-down'} 
                                  size={14} 
                                  color="rgba(255,255,255,0.8)" 
                                  style={{ marginLeft: 4, marginBottom: 4 }}
                                />
                              )}
                            </View>
                            <Text className="text-3xl font-bold text-white">
                              {userPoints?.toLocaleString() || '0'}
                            </Text>
                            {/* Point Level Badge */}
                            <View className="flex-row items-center mt-1">
                              <Text className="text-xs text-white/70">
                                {getCurrentPointLevel(userPoints).name}
                              </Text>
                            </View>
                          </View>
                          <View className="p-3 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                            <Ionicons name="flame" size={28} color={pointsStyle.iconColor} />
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Wallet Dropdown (when 2+ memberships) */}
                      {showWalletDropdown && memberships.length >= 2 && (
                        <View className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                          {memberships.map((membership, index) => {
                            const isSelected = selectedWalletId === membership.walletId.toString();
                            const walletColors = [
                              '#3B82F6', // Blue
                              '#10B981', // Emerald
                              '#F59E0B', // Amber
                              '#EF4444', // Red
                              '#8B5CF6', // Purple
                              '#22C55E', // Green
                            ];
                            const color = walletColors[index % walletColors.length];
                            
                            return (
                              <TouchableOpacity
                                key={membership.walletId}
                                onPress={() => handleWalletSelect(membership.walletId.toString())}
                                className={`flex-row items-center p-3 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                                style={{ backgroundColor: isSelected ? '#EBF5FF' : 'white' }}
                              >
                                <View 
                                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                                  style={{ backgroundColor: color }}
                                >
                                  <Text className="text-white font-bold text-lg">
                                    {membership.clubName.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View className="flex-1">
                                  <Text className="font-semibold text-gray-900" numberOfLines={1}>
                                    {membership.clubName}
                                  </Text>
                                  <Text className="text-xs text-gray-500">
                                    {membership.balancePoints.toLocaleString()} pts
                                  </Text>
                                </View>
                                {isSelected && (
                                  <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                                    <Ionicons name="checkmark" size={16} color="white" />
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                          
                          {/* Go to Points Page Button */}
                          <TouchableOpacity
                            onPress={handlePointsCardPress}
                            className="flex-row items-center justify-center p-3 border-t border-gray-200 bg-gray-50"
                          >
                            <Ionicons name="wallet" size={16} color="#6366F1" />
                            <Text className="text-sm font-medium text-indigo-600 ml-2">
                              View Points History
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
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
