import CalendarModal from '@components/CalendarModal';
import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useMyEventRegistrations, useRegisterForEvent } from '@hooks/useQueryHooks';
import { ClubService } from '@services/club.service';
import { Event, fetchEvent, getEventByClubId, timeObjectToString } from '@services/event.service';
import { MembershipsService } from '@services/memberships.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

interface Club {
  id: number;
  name: string;
}

export default function StudentEventsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userClubIds, setUserClubIds] = useState<number[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [showExpiredFilter, setShowExpiredFilter] = useState<'hide' | 'show' | 'only'>('hide');
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [clubSelectorVisible, setClubSelectorVisible] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<Event | null>(null);

  // React Query hooks
  const { data: myRegistrations = [], isLoading: registrationsLoading } = useMyEventRegistrations();
  const { mutate: registerForEvent, isPending: isRegistering } = useRegisterForEvent();

  // Get user's club IDs from auth store or user data
  useEffect(() => {
    const loadUserClubIds = async () => {
      try {
        // First, try to get from user object if available
        if (user?.clubIds && Array.isArray(user.clubIds)) {
          const clubIdNumbers = user.clubIds.map((id) => Number(id)).filter((id) => !isNaN(id));
          console.log('Events page - Setting userClubIds from user object:', clubIdNumbers);
          setUserClubIds(clubIdNumbers);
          if (clubIdNumbers.length > 0 && !selectedClubId) {
            setSelectedClubId(String(clubIdNumbers[0]));
          }
          return;
        }

        // If not in user object, fetch from memberships API
        const memberships = await MembershipsService.getMyMemberships();
        const clubIds = memberships
          .filter((m: any) => m.state === 'ACTIVE') // Only active memberships
          .map((m: any) => Number(m.clubId))
          .filter((id: number, index: number, self: number[]) => !isNaN(id) && self.indexOf(id) === index); // Unique IDs
        
        console.log('Events page - Setting userClubIds from API:', clubIds);
        setUserClubIds(clubIds);
        if (clubIds.length > 0 && !selectedClubId) {
          setSelectedClubId(String(clubIds[0]));
        }
      } catch (error) {
        console.error('Failed to load user club IDs:', error);
        // If both methods fail, show all events (no filter)
        setUserClubIds([]);
      }
    };

    if (user) {
      loadUserClubIds();
    }
  }, [user]);

  // Load events and clubs
  const loadEvents = async (clubId?: string | number) => {
    try {
      setLoading(true);
      
      // Load events and clubs in parallel
      let eventsPromise;
      if (clubId && clubId !== 'all') {
        console.log('Loading events for specific club:', clubId);
        eventsPromise = getEventByClubId(clubId);
      } else if (clubId === 'all' && userClubIds.length > 0) {
        // Load events from all user's clubs
        console.log('Loading events for all user clubs:', userClubIds);
        eventsPromise = Promise.all(
          userClubIds.map(id => getEventByClubId(id))
        ).then(results => results.flat());
      } else {
        // Load all events (default behavior)
        eventsPromise = fetchEvent();
      }
      
      const [eventsData, clubsData] = await Promise.all([
        eventsPromise,
        ClubService.fetchClubs(0, 100),
      ]);

      console.log('Events page - Loaded events:', eventsData.length);
      console.log('Events page - User club IDs:', userClubIds);
      console.log('Events page - Selected club ID:', clubId);

      setEvents(eventsData);
      setClubs(clubsData);
    } catch (error) {
      console.error('Failed to load events:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load events',
      });
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents(selectedClubId || undefined);
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    loadEvents();
  }, []);

  // Reload events when selected club changes
  useEffect(() => {
    if (selectedClubId) {
      console.log('Selected club changed to:', selectedClubId);
      loadEvents(selectedClubId);
    }
  }, [selectedClubId]);

  // Helper function to check if event is registered
  const isEventRegistered = (eventId: number) => {
    return myRegistrations.some((reg) => reg.eventId === eventId);
  };

  // Helper function to check if event has expired
  const isEventExpired = (event: Event) => {
    if (event.status === 'COMPLETED') return true;
    
    if (!event.date || !event.endTime) return false;

    try {
      const now = new Date();
      const eventDate = new Date(event.date);
      const endTimeStr = timeObjectToString(event.endTime);
      const [hours, minutes] = endTimeStr.split(':').map(Number);
      const eventEndDateTime = new Date(eventDate);
      eventEndDateTime.setHours(hours, minutes, 0, 0);

      return now > eventEndDateTime;
    } catch (error) {
      console.error('Error checking event expiration:', error);
      return false;
    }
  };

  // Apply all filters
  useEffect(() => {
    let filtered = events;

    // Note: Club filtering is now done at the API level in loadEvents()
    // No need to filter by club here since events are already filtered by the API call

    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter((event) => {
        const eventName = event.name || '';
        const clubName = clubs.find((c) => c.id === (event.hostClub?.id || event.clubId))?.name || '';
        return (
          eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clubName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filter by registered only
    if (showRegisteredOnly) {
      filtered = filtered.filter((event) => isEventRegistered(event.id));
    }

    // Filter by expired status
    const isFutureEvent = (event: Event) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      return eventDate >= today;
    };

    filtered = filtered.filter((event) => {
      const isExpired = isEventExpired(event);
      const isFuture = isFutureEvent(event);
      
      if (showExpiredFilter === 'hide') {
        // Hide expired and rejected events, show only APPROVED/PENDING_UNISTAFF/ONGOING events
        if (event.status === 'REJECTED') return false;
        if (!['APPROVED', 'PENDING_UNISTAFF', 'ONGOING'].includes(event.status)) return false;
        
        // ONGOING events should always be shown (they're happening now!)
        if (event.status === 'ONGOING') return true;
        
        // For other statuses, check if expired or not future
        if (isExpired) return false;
        if (!isFuture) return false;
      } else if (showExpiredFilter === 'only') {
        if (!isExpired) return false;
      } else if (showExpiredFilter === 'show') {
        // Show all events with APPROVED, PENDING_UNISTAFF, COMPLETED, or ONGOING status
        if (!['APPROVED', 'PENDING_UNISTAFF', 'COMPLETED', 'ONGOING'].includes(event.status)) {
          return false;
        }
      }
      
      return true;
    });

    setFilteredEvents(filtered);
  }, [searchTerm, events, clubs, showExpiredFilter, showRegisteredOnly, myRegistrations]);

  // Get event status
  const getEventStatus = (eventDate: string): 'past' | 'upcoming' | 'future' => {
    const now = new Date();
    const event = new Date(eventDate);

    if (event < now) return 'past';
    if (event.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000)
      return 'upcoming';
    return 'future';
  };

  // Get status badge color
  const getStatusBadgeStyle = (event: Event) => {
    if (event.status === 'COMPLETED') {
      return 'bg-blue-900';
    } else if (event.status === 'ONGOING') {
      return 'bg-cyan-600';
    } else if (event.status === 'APPROVED') {
      return 'bg-green-500';
    } else if (event.status === 'PENDING_UNISTAFF') {
      return 'bg-yellow-500';
    } else if (event.status === 'REJECTED') {
      return 'bg-red-500';
    }
    return 'bg-gray-400';
  };

  // Get status text
  const getStatusText = (event: Event) => {
    if (event.status === 'COMPLETED') return 'COMPLETED';
    if (event.status === 'ONGOING') return 'ONGOING';
    if (event.status === 'PENDING_UNISTAFF') return 'PENDING';
    if (event.status === 'REJECTED') return 'REJECTED';
    
    const status = getEventStatus(event.date);
    if (status === 'past') return 'Past';
    if (status === 'upcoming') return 'Soon';
    return 'Approved';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle event detail
  const handleEventDetail = (eventId: number) => {
    router.push(`/student/events/${eventId}`);
  };

  // Handle event registration button click - show confirmation modal
  const handleRegisterClick = (event: Event) => {
    console.log('Selected event for registration:', event);
    console.log('commitPointCost:', event.commitPointCost);
    setSelectedEventForRegistration(event);
    setShowConfirmModal(true);
  };

  // Handle confirmed registration
  const handleConfirmRegister = () => {
    if (!selectedEventForRegistration) return;
    
    const eventId = selectedEventForRegistration.id;
    setShowConfirmModal(false);
    
    registerForEvent(eventId, {
      onSuccess: (data) => {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Successfully registered for the event!',
        });
        setSelectedEventForRegistration(null);
      },
      onError: (error: any) => {
        console.error('Error registering for event:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error?.response?.data?.message || 'Failed to register for the event',
        });
        setSelectedEventForRegistration(null);
      },
    });
  };

  // Get user's club details for filter
  const userClubsDetails = clubs.filter((club) => userClubIds.includes(club.id));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-gray-900">          Events</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setClubSelectorVisible(true)}
                className="bg-purple-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">🏫 Clubs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(true)}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">🎛️ Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text className="text-sm text-gray-600 mt-1">
            Discover upcoming events from your clubs
          </Text>
          {userClubIds.length > 0 && (
            <Text className="text-xs text-gray-500 mt-1">
              {selectedClubId && selectedClubId !== 'all' 
                ? `Viewing events from ${clubs.find(c => String(c.id) === selectedClubId)?.name || 'selected club'}`
                : `Showing events from ${userClubIds.length} club${userClubIds.length > 1 ? 's' : ''}`
              }
            </Text>
          )}
        </View>

        {/* Search Bar */}
        <View className="mb-4 flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm">
            <Text className="text-gray-400 mr-2">🔍</Text>
            <TextInput
              placeholder="Search events..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 text-base"
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Text className="text-gray-400 text-lg">✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => setShowCalendarModal(true)}
            className="bg-blue-600 rounded-lg px-4 py-3 shadow-sm justify-center"
          >
            <Ionicons name="calendar" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Events List */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 mt-4">Loading events...</Text>
            </View>
          ) : userClubIds.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-6xl mb-4">🏫</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No club membership found
              </Text>
              <Text className="text-gray-500 text-center px-8">
                You need to join a club first to see events
              </Text>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-6xl mb-4">📅</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No events found
              </Text>
              <Text className="text-gray-500 text-center px-8">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : showRegisteredOnly
                  ? 'You have not registered for any events yet'
                  : "Your clubs haven't posted any events yet"}
              </Text>
            </View>
          ) : (
            <View className="pb-4">
              {filteredEvents.map((event) => {
                const club = clubs.find((c) => c.id === (event.hostClub?.id || event.clubId));
                const eventDate = event.date || '';
                const eventName = event.name || 'Untitled Event';
                const isRegistered = isEventRegistered(event.id);
                const isExpired = isEventExpired(event);

                return (
                  <View
                    key={event.id}
                    className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden"
                  >
                    <View className="p-4">
                      {/* Event Header */}
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 mr-3">
                          <Text
                            className="text-lg font-bold text-gray-900 mb-1"
                            numberOfLines={2}
                          >
                            {eventName}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className="text-gray-400 mr-1">👥</Text>
                            <Text className="text-sm text-gray-600">
                              {club?.name || 'Unknown Club'}
                            </Text>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View
                          className={`${getStatusBadgeStyle(event)} px-3 py-1 rounded-full`}
                        >
                          <Text className="text-white text-xs font-medium">
                            {getStatusText(event)}
                          </Text>
                        </View>
                      </View>

                      {/* Event Details */}
                      <View className="space-y-2 mb-3">
                        {/* Date */}
                        {eventDate && (
                          <View className="flex-row items-center">
                            <Text className="text-gray-400 mr-2">📅</Text>
                            <Text className="text-sm text-gray-600">
                              {formatDate(eventDate)}
                            </Text>
                          </View>
                        )}

                        {/* Time */}
                        {event.startTime && event.endTime && (
                          <View className="flex-row items-center">
                            <Text className="text-gray-400 mr-2">🕐</Text>
                            <Text className="text-sm text-gray-600">
                              {timeObjectToString(event.startTime)} - {timeObjectToString(event.endTime)}
                            </Text>
                          </View>
                        )}

                        {/* Point Cost */}
                        {event.commitPointCost !== undefined && event.commitPointCost > 0 && (
                          <View className="flex-row items-center">
                            <Text className="text-gray-400 mr-2">🏆</Text>
                            <Text className="text-sm text-gray-600">
                              Cost: <Text className="font-semibold text-amber-600">{event.commitPointCost}</Text> points
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleEventDetail(event.id)}
                          className="flex-1 py-3 rounded-lg items-center bg-gray-100"
                        >
                          <Text className="font-semibold text-gray-700">
                            View Details
                          </Text>
                        </TouchableOpacity>
                        
                        {!isExpired && (event.status === 'APPROVED' || event.status === 'ONGOING') && (
                          <TouchableOpacity
                            onPress={() => handleRegisterClick(event)}
                            disabled={isRegistering || isRegistered}
                            className={`flex-1 py-3 rounded-lg items-center ${
                              isRegistered
                                ? 'bg-green-100'
                                : isRegistering
                                ? 'bg-gray-300'
                                : 'bg-blue-500'
                            }`}
                          >
                            <Text
                              className={`font-semibold ${
                                isRegistered
                                  ? 'text-green-700'
                                  : isRegistering
                                  ? 'text-gray-500'
                                  : 'text-white'
                              }`}
                            >
                              {isRegistering
                                ? 'Registering...'
                                : isRegistered
                                ? '✓ Registered'
                                : '📝 Register'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-white rounded-t-3xl mt-32">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Filters</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Text className="text-gray-600 text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-6">
              {/* Expired Filter */}
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Event Status
                </Text>
                <TouchableOpacity
                  onPress={() => setShowExpiredFilter('hide')}
                  className={`p-4 rounded-lg mb-2 ${
                    showExpiredFilter === 'hide' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'
                  }`}
                >
                  <Text className={`font-semibold ${showExpiredFilter === 'hide' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Hide Expired
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Show only upcoming events
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowExpiredFilter('show')}
                  className={`p-4 rounded-lg mb-2 ${
                    showExpiredFilter === 'show' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'
                  }`}
                >
                  <Text className={`font-semibold ${showExpiredFilter === 'show' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Show All
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Show all events including past ones
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowExpiredFilter('only')}
                  className={`p-4 rounded-lg mb-2 ${
                    showExpiredFilter === 'only' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'
                  }`}
                >
                  <Text className={`font-semibold ${showExpiredFilter === 'only' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Only Expired
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Show only past events
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Registration Filter */}
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Registration Status
                </Text>
                <TouchableOpacity
                  onPress={() => setShowRegisteredOnly(!showRegisteredOnly)}
                  className={`p-4 rounded-lg flex-row items-center justify-between ${
                    showRegisteredOnly ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'
                  }`}
                >
                  <View>
                    <Text className={`font-semibold ${showRegisteredOnly ? 'text-blue-700' : 'text-gray-700'}`}>
                      My Registrations
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      Show only events you registered for
                    </Text>
                  </View>
                  {showRegisteredOnly && myRegistrations.length > 0 && (
                    <View className="bg-blue-500 px-3 py-1 rounded-full">
                      <Text className="text-white font-semibold text-sm">
                        {myRegistrations.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Apply Button */}
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                className="bg-blue-500 py-4 rounded-lg items-center mt-4"
              >
                <Text className="text-white font-bold text-base">
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Club Selector Modal */}
      <Modal
        visible={clubSelectorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setClubSelectorVisible(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-white rounded-t-3xl mt-32">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Select Club</Text>
              <TouchableOpacity
                onPress={() => setClubSelectorVisible(false)}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Text className="text-gray-600 text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-6">
              {/* All Clubs Option */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedClubId('all');
                  setClubSelectorVisible(false);
                }}
                className={`p-4 rounded-lg mb-3 ${
                  selectedClubId === 'all' ? 'bg-purple-100 border-2 border-purple-500' : 'bg-gray-50'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className={`text-lg font-bold ${selectedClubId === 'all' ? 'text-purple-700' : 'text-gray-900'}`}>
                      All My Clubs
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      Show events from all {userClubIds.length} club{userClubIds.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {selectedClubId === 'all' && (
                    <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Individual Clubs */}
              {userClubsDetails.length > 0 && (
                <View className="mt-2">
                  <Text className="text-sm font-semibold text-gray-500 mb-3 uppercase">
                    My Clubs
                  </Text>
                  {userClubsDetails.map((club) => (
                    <TouchableOpacity
                      key={club.id}
                      onPress={() => {
                        setSelectedClubId(String(club.id));
                        setClubSelectorVisible(false);
                      }}
                      className={`p-4 rounded-lg mb-3 ${
                        selectedClubId === String(club.id) ? 'bg-purple-100 border-2 border-purple-500' : 'bg-gray-50'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className={`text-lg font-bold ${selectedClubId === String(club.id) ? 'text-purple-700' : 'text-gray-900'}`}>
                            {club.name}
                          </Text>
                          <Text className="text-sm text-gray-600 mt-1">
                            View events from this club only
                          </Text>
                        </View>
                        {selectedClubId === String(club.id) && (
                          <View className="w-6 h-6 bg-purple-500 rounded-full items-center justify-center">
                            <Text className="text-white text-xs font-bold">✓</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* No Clubs Message */}
              {userClubsDetails.length === 0 && (
                <View className="items-center justify-center py-10">
                  <Text className="text-6xl mb-4">🏫</Text>
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    No clubs found
                  </Text>
                  <Text className="text-gray-500 text-center px-8">
                    Join a club to see events
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Registration Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowConfirmModal(false);
          setSelectedEventForRegistration(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            {selectedEventForRegistration && (
              <>
                {/* Header */}
                <View className="items-center mb-4">
                  <Text className="text-xl font-bold text-gray-900 text-center mb-2">
                    Confirm Event Registration
                  </Text>
                  <Text className="text-base font-semibold text-gray-800 text-center">
                    {selectedEventForRegistration.name}
                  </Text>
                  <Text className="text-sm text-gray-600 text-center mt-1">
                    {selectedEventForRegistration.hostClub?.name}
                  </Text>
                </View>

                {/* Point Cost Warning */}
                <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <View className="flex-row items-start">
                    <Text className="text-2xl mr-3">🏆</Text>
                    <View className="flex-1">
                      <Text className="font-bold text-yellow-900 mb-2">
                        Point Cost: {selectedEventForRegistration.commitPointCost || 0} points
                      </Text>
                      <Text className="text-sm text-gray-600 mt-3">
                        <Text className="font-semibold">{selectedEventForRegistration.commitPointCost || 0} points</Text> will be received back along with bonus points if you fully participate in the event.
                      </Text>
                      <Text className="text-sm text-yellow-800">
                        Otherwise, they will be <Text className="font-semibold">lost and not refunded</Text>.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowConfirmModal(false);
                      setSelectedEventForRegistration(null);
                    }}
                    className="flex-1 py-3 rounded-lg bg-gray-100 items-center"
                  >
                    <Text className="font-semibold text-gray-700">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmRegister}
                    className="flex-1 py-3 rounded-lg bg-blue-500 items-center"
                  >
                    <Text className="font-semibold text-white">Confirm Registration</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        events={filteredEvents.map(event => ({
          ...event,
          startTime: typeof event.startTime === 'string' ? event.startTime : event.startTime ? timeObjectToString(event.startTime) : undefined,
          endTime: typeof event.endTime === 'string' ? event.endTime : event.endTime ? timeObjectToString(event.endTime) : undefined,
        }))}
        onEventClick={(event) => {
          setShowCalendarModal(false);
          router.push(`/student/events/${event.id}` as any);
        }}
      />

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
