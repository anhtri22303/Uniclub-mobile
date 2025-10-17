import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Animated,
    Dimensions,
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
  const [isOpen, setIsOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-SIDEBAR_WIDTH));

  // Only show sidebar for CLUB_LEADER, UNIVERSITY_STAFF, and STUDENT
  if (role !== 'club_leader' && role !== 'university_staff' && role !== 'student') {
    return null;
  }

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
    } else if (role === 'university_staff') {
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
        }
      ];
    } else if (role === 'student') {
      return [
        {
          name: 'clubs',
          icon: 'business',
          route: '/student/clubs',
          label: 'Clubs'
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
        },
        {
          name: 'wallet',
          icon: 'wallet',
          route: '/student/wallet',
          label: 'Wallet'
        },
        {
          name: 'history',
          icon: 'time',
          route: '/student/history',
          label: 'History'
        }
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

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

  return (
    <>
      {/* Toggle Button - Always visible in top-left corner */}
      <TouchableOpacity
        onPress={toggleSidebar}
        className="absolute top-4 left-4 z-50 bg-teal-600 p-3 rounded-full shadow-lg"
        style={{ elevation: 5, opacity: 0.3 }}
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
                  : role === 'university_staff' 
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

            {/* Footer */}
            <View className="border-t border-gray-200 p-4">
              <Text className="text-xs text-gray-500 text-center">
                UniClub Management System
              </Text>
              <Text className="text-xs text-gray-400 text-center mt-1">
                Version 1.0.0
              </Text>
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
