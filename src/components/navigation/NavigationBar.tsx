import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

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
  activeRoute?: string; // Optional custom route for active checking
}

export default function NavigationBar({ role, user }: NavigationBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Hiển thị navigation bar cho STUDENT, CLUB_LEADER, UNIVERSITY_STAFF
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

    const baseRoute = userRole === 'student' ? '/profile' : '/club-leader';
    const homeActiveRoute = userRole === 'student' ? '/student' : '/club-leader';
    const tabs: TabItem[] = [
      {
        name: 'home',
        icon: 'home',
        route: baseRoute,
        label: 'Home',
        activeRoute: homeActiveRoute // Custom active route for checking
      },
      {
        name: 'club',
        icon: 'people',
        route: userRole === 'student' ? '/student/clubs' : '/club-leader/application',
        label: userRole === 'club_leader' ? 'Apply' : 'Club'
      },
      {
        name: 'check-in',
        icon: 'checkmark-circle',
        route: userRole === 'student' ? '/student/check-in' : '/club-leader/members',
        label: userRole === 'student' ? 'Check' : 'Member'
      },
      {
        name: 'profile',
        icon: 'person-circle',
        route: '/profile',
        label: 'Profile'
      }
    ];

    return tabs;
  };

  const tabs = getTabsForRole(role);

  const isActive = (tab: TabItem) => {
    const routeToCheck = tab.activeRoute || tab.route;
    
    // Exact match for profile and home routes
    if (routeToCheck === '/profile') {
      return pathname === '/profile';
    }
    if (routeToCheck === '/student' || routeToCheck === '/club-leader') {
      return pathname === routeToCheck;
    }
    return pathname.startsWith(routeToCheck);
  };

  const handleTabPress = (route: string, disabled?: boolean) => {
    if (disabled) return;
    router.push(route as any);
  };

  return (
    <SafeAreaView className="bg-white shadow-2xl" style={{ 
      shadowColor: '#14B8A6', 
      shadowOffset: { width: 0, height: -4 }, 
      shadowOpacity: 0.15, 
      shadowRadius: 12,
      elevation: 20 
    }}>
      <View className="flex-row justify-around items-center px-2 py-1 bg-white">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const disabled = tab.disabled;
          
          return (
            <NavTab
              key={tab.name}
              tab={tab}
              active={active}
              disabled={disabled}
              onPress={() => handleTabPress(tab.route, disabled)}
            />
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// Animated Navigation Tab Component
function NavTab({ 
  tab, 
  active, 
  disabled, 
  onPress 
}: { 
  tab: TabItem; 
  active: boolean; 
  disabled?: boolean; 
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(active ? 1 : 0.95)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(active ? 0 : 5)).current;
  const opacityAnim = useRef(new Animated.Value(active ? 1 : 0.6)).current;

  useEffect(() => {
    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: active ? 1 : 0.95,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Slide up animation
    Animated.spring(slideUpAnim, {
      toValue: active ? 0 : 5,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Opacity animation
    Animated.timing(opacityAnim, {
      toValue: active ? 1 : 0.6,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [active]);

  const handlePressIn = () => {
    Animated.spring(iconScaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.sequence([
      Animated.spring(iconScaleAnim, {
        toValue: 1.15,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="flex-1 items-center"
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <Animated.View
        className="items-center"
        style={{
          transform: [
            { scale: scaleAnim },
            { translateY: slideUpAnim },
          ],
          opacity: opacityAnim,
        }}
      >
        {/* Icon Container with Animation */}
        <Animated.View
          className="items-center justify-center mb-1"
          style={[
            {
              width: 56,
              height: 56,
              borderRadius: 28,
              transform: [{ scale: iconScaleAnim }],
              backgroundColor: active && !disabled ? '#14B8A6' : 'transparent',
            },
            active && !disabled && {
              shadowColor: '#14B8A6',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 10,
            },
          ]}
        >
          {/* Icon */}
          <Ionicons
            name={tab.icon}
            size={active && !disabled ? 28 : 24}
            color={
              disabled
                ? '#D1D5DB'
                : active
                ? '#FFFFFF'
                : '#6B7280'
            }
          />
          
          {/* Active Indicator Dot */}
          {active && !disabled && (
            <View className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
          )}
        </Animated.View>

        {/* Label */}
        <Text
          className={`text-xs font-bold ${
            disabled
              ? 'text-gray-300'
              : active
              ? 'text-teal-600'
              : 'text-gray-500'
          }`}
          style={{ 
            marginTop: 2,
            letterSpacing: 0.3 
          }}
        >
          {tab.label}
        </Text>
        
        {/* Active Underline */}
        {active && !disabled && (
          <View className="absolute -bottom-2 w-6 h-1 bg-teal-500 rounded-full" />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
