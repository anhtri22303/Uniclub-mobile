import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

interface NavigationBarProps {
  role?: string;
  user?: {
    clubIds?: number[];
  };
}

interface TabItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  label: string;
  disabled?: boolean;
}

export default function NavigationBar({ role, user }: NavigationBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Hiển thị navigation bar cho STUDENT, CLUB_LEADER và UNIVERSITY_STAFF
  const shouldShowNavigation = role === 'student' || role === 'club_leader' || role === 'uni_staff';
  
  if (!shouldShowNavigation) {
    return null;
  }

  // Định nghĩa các tab dựa trên role
  const getTabsForRole = (userRole?: string): TabItem[] => {
    if (userRole === 'uni_staff') {
      return [
        {
          name: 'home',
          icon: 'home',
          route: '/uni-staff',
          label: 'Home'
        },
        {
          name: 'club_request',
          icon: 'business',
          route: '/uni-staff/club-requests',
          label: 'Club Request'
        },
        {
          name: 'event_request',
          icon: 'calendar',
          route: '/uni-staff/event-requests',
          label: 'Events Request'
        },
        {
          name: 'profile',
          icon: 'person-circle',
          route: '/profile',
          label: 'Profile'
        }
      ];
    }

    const baseRoute = userRole === 'student' ? '/student' : '/club-leader';
    const tabs: TabItem[] = [
      {
        name: 'home',
        icon: 'home',
        route: baseRoute,
        label: 'Home'
      },
      {
        name: 'club',
        icon: 'people',
        route: userRole === 'student' ? '/student/clubs' : '/club-leader/manage',
        label: 'Club'
      },
      {
        name: 'member',
        icon: 'person',
        route: userRole === 'student' ? '/student/members' : '/club-leader/members',
        label: 'Member'
      },
      {
        name: 'profile',
        icon: 'person-circle',
        route: '/profile',
        label: 'Profile'
      }
    ];

    // Disable Member tab cho STUDENT nếu không có clubIds
    if (userRole === 'student' && (!user?.clubIds || user.clubIds.length === 0)) {
      tabs[2].disabled = true;
    }

    return tabs;
  };

  const tabs = getTabsForRole(role);

  const isActive = (route: string) => {
    if (route === '/student' || route === '/club-leader') {
      return pathname === route;
    }
    return pathname.startsWith(route);
  };

  const handleTabPress = (route: string, disabled?: boolean) => {
    if (disabled) return;
    router.push(route as any);
  };

  return (
    <SafeAreaView className="bg-white border-t border-gray-200">
      <View className="flex-row justify-around items-center py-2 bg-white">
        {tabs.map((tab) => {
          const active = isActive(tab.route);
          const disabled = tab.disabled;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handleTabPress(tab.route, disabled)}
              className="flex-1 items-center py-2"
              activeOpacity={disabled ? 1 : 0.7}
              disabled={disabled}
            >
              <View className="items-center">
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={
                    disabled 
                      ? '#D1D5DB' 
                      : active 
                        ? '#0D9488' 
                        : '#6B7280'
                  }
                />
                <Text
                  className={`text-xs mt-1 font-medium ${
                    disabled
                      ? 'text-gray-300'
                      : active 
                        ? 'text-teal-600' 
                        : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </Text>
              </View>
              
              {/* Active indicator */}
              {active && !disabled && (
                <View className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-teal-600 rounded-full" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
