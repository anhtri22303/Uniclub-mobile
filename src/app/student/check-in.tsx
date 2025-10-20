import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { fetchEvent, getEventByCode } from '@services/event.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CheckInEvent {
  id: number;
  clubId: number;
  name: string;
  description: string;
  type: string;
  date: string;
  time?: string;
  locationId: number;
  status: string;
  venue?: string;
  checkInCode?: string;
}

export default function StudentCheckInPage() {
  const { user } = useAuthStore();

  const [checkInCode, setCheckInCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [todayEvents, setTodayEvents] = useState<CheckInEvent[]>([]);
  const [checkedInEvents, setCheckedInEvents] = useState<number[]>([]);
  const [userClubIds, setUserClubIds] = useState<number[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  // Get today's date (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  // // Load user's club memberships
  // useEffect(() => {
  //   const loadUserClubs = async () => {
  //     try {
  //       const memberships = await MembershipsService.getMyMemberships();
  //       const clubIds = memberships
  //         .filter((m: any) => m.state === 'ACTIVE')
  //         .map((m: any) => Number(m.clubId))
  //         .filter((id: number, index: number, self: number[]) => 
  //           !isNaN(id) && self.indexOf(id) === index
  //         );
  //       setUserClubIds(clubIds);
  //     } catch (error) {
  //       console.error('Failed to load user clubs:', error);
  //     }
  //   };

  //   if (user) {
  //     loadUserClubs();
  //   }
  // }, [user]);

  // Load today's events
  const loadTodayEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await fetchEvent();
      
      // Filter events for today from user's clubs
      const filtered = allEvents.filter((event: any) => {
        const eventDate = new Date(event.date).toISOString().split('T')[0];
        const isToday = eventDate === today;
        const isUserClub = userClubIds.length === 0 || userClubIds.includes(Number(event.clubId));
        return isToday && isUserClub;
      });

      setTodayEvents(filtered);
    } catch (error) {
      console.error('Failed to load today events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayEvents();
    setRefreshing(false);
  };

  // Load events when user clubs are ready
  useEffect(() => {
    if (userClubIds.length > 0) {
      loadTodayEvents();
    }
  }, [userClubIds]);

  // Handle check-in with code
  const handleCheckInSubmit = async () => {
    if (!checkInCode.trim()) {
      Alert.alert('Error', 'Please enter a check-in code');
      return;
    }

    try {
      setLoading(true);
      const event = await getEventByCode(checkInCode.trim());
      
      if (event) {
        // Check if already checked in
        if (checkedInEvents.includes(event.id)) {
          Alert.alert('Already Checked In', 'You have already checked in to this event');
          return;
        }

        // TODO: Call actual check-in API
        // For now, just mark as checked in locally
        setCheckedInEvents((prev) => [...prev, event.id]);
        setTotalPoints((prev) => prev + 50); // Example points

        Alert.alert(
          'Check-in Successful! ✅',
          `You've checked in to "${event.name}"\n+50 points earned!`,
          [{ text: 'OK', onPress: () => setCheckInCode('') }]
        );
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      Alert.alert(
        'Invalid Code',
        'This check-in code is invalid or expired. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle quick check-in from today's events
  const handleQuickCheckIn = (event: CheckInEvent) => {
    if (checkedInEvents.includes(event.id)) {
      Alert.alert('Already Checked In', 'You have already checked in to this event');
      return;
    }

    // TODO: Call actual check-in API
    setCheckedInEvents((prev) => [...prev, event.id]);
    setTotalPoints((prev) => prev + 50);

    Alert.alert(
      'Check-in Successful! ✅',
      `You've checked in to "${event.name}"\n+50 points earned!`
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-gray-900">Event Check-in</Text>
          <Text className="text-sm text-gray-600 mt-1">
            Check in to events and earn points
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Check-in Code Input Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <View className="items-center mb-4">
              <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-3">
                <Text className="text-4xl">📱</Text>
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">
                Enter Check-in Code
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Enter the check-in code from the event to participate
              </Text>
            </View>

            <View className="space-y-3">
              <TextInput
                placeholder="Enter check-in code..."
                value={checkInCode}
                onChangeText={setCheckInCode}
                className="bg-gray-50 rounded-xl px-4 py-4 text-center text-lg font-semibold"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                onSubmitEditing={handleCheckInSubmit}
              />

              <TouchableOpacity
                onPress={handleCheckInSubmit}
                disabled={!checkInCode.trim() || loading}
                className={`py-4 rounded-xl items-center ${
                  !checkInCode.trim() || loading
                    ? 'bg-gray-300'
                    : 'bg-blue-500'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center">
                    <Text className="text-white text-lg font-semibold mr-2">
                      ✅ Join Event
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Events */}
          {todayEvents.length > 0 && (
            <View className="mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Today's Events
              </Text>

              {todayEvents.map((event) => {
                const isCheckedIn = checkedInEvents.includes(event.id);

                return (
                  <View
                    key={event.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm mb-3 ${
                      isCheckedIn ? 'border-2 border-green-500' : ''
                    }`}
                  >
                    {/* Event Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center mb-2">
                          {isCheckedIn && (
                            <Text className="text-green-600 text-lg mr-2">✅</Text>
                          )}
                          <Text
                            className="text-lg font-bold text-gray-900 flex-1"
                            numberOfLines={2}
                          >
                            {event.name}
                          </Text>
                        </View>

                        <View className="flex-row items-center flex-wrap">
                          <View className="flex-row items-center mr-3 mb-1">
                            <Text className="text-gray-400 mr-1">👥</Text>
                            <Text className="text-xs text-gray-600">
                              Club {event.clubId}
                            </Text>
                          </View>
                          <View className="flex-row items-center mb-1">
                            <Text className="text-gray-400 mr-1">📅</Text>
                            <Text className="text-xs text-gray-600">
                              {new Date(event.date).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Points Badge */}
                      <View className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-full">
                        <View className="flex-row items-center">
                          <Text className="text-white text-xs mr-1">🏆</Text>
                          <Text className="text-white text-sm font-bold">
                            50 pts
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Event Details */}
                    <View className="flex-row items-center mb-3 flex-wrap">
                      {event.time && (
                        <View className="flex-row items-center mr-4 mb-1">
                          <Text className="text-gray-400 mr-1">🕐</Text>
                          <Text className="text-xs text-gray-600">
                            Starts {event.time}
                          </Text>
                        </View>
                      )}
                      {event.venue && (
                        <View className="flex-row items-center mb-1">
                          <Text className="text-gray-400 mr-1">📍</Text>
                          <Text className="text-xs text-gray-600">
                            {event.venue}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Check-in Button */}
                    <TouchableOpacity
                      onPress={() => handleQuickCheckIn(event)}
                      disabled={isCheckedIn}
                      className={`py-3 rounded-xl items-center ${
                        isCheckedIn ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-white text-base font-semibold">
                          {isCheckedIn ? '✅ Checked In' : '✅ Quick Check In'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Summary Card */}
          <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-4">
            <View className="flex-row items-center mb-4">
              <Text className="text-xl mr-2">🏆</Text>
              <Text className="text-lg font-bold text-blue-900">
                Today's Progress
              </Text>
            </View>

            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-3xl font-bold text-blue-700">
                  {checkedInEvents.length}
                </Text>
                <Text className="text-sm text-blue-700 font-medium mt-1">
                  Events Checked In
                </Text>
              </View>

              <View className="w-px bg-blue-200" />

              <View className="items-center">
                <Text className="text-3xl font-bold text-blue-700">
                  {totalPoints}
                </Text>
                <Text className="text-sm text-blue-700 font-medium mt-1">
                  Points Earned
                </Text>
              </View>
            </View>
          </View>

          {/* Empty State */}
          {!loading && todayEvents.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-6xl mb-4">📅</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No Events Today
              </Text>
              <Text className="text-gray-500 text-center px-8">
                There are no events scheduled for today from your clubs
              </Text>
            </View>
          )}

          {/* Loading State */}
          {loading && todayEvents.length === 0 && (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 mt-4">Loading events...</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
