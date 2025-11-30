import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { fetchEvent, getMyEventRegistrations, registerForEvent, timeObjectToString, type Event, type EventRegistration } from '@services/event.service';
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function PublicEventsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpiredFilter, setShowExpiredFilter] = useState<'hide' | 'show' | 'only'>('hide');
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [registeringEventId, setRegisteringEventId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<Event | null>(null);

  // Load events and registrations
  const loadEvents = async () => {
    try {
      setLoading(true);
      const [allEvents, registrations] = await Promise.all([
        fetchEvent(),
        getMyEventRegistrations(),
      ]);

      // CRITICAL: Filter ONLY PUBLIC events - First line of defense
      const publicEvents = allEvents.filter((event) => event.type === 'PUBLIC');
      console.log('✅ PUBLIC events filter applied:', publicEvents.length, 'of', allEvents.length);
      
      // CRITICAL: Filter registrations to ONLY include PUBLIC events
      const publicEventIds = new Set(publicEvents.map(e => e.id));
      const publicRegistrations = registrations.filter((reg) => {
        // Find the event in our public events list
        const isPublicEvent = publicEventIds.has(reg.eventId);
        if (!isPublicEvent) {
          console.log('⚠️ Filtered out non-public registration for event:', reg.eventId);
        }
        return isPublicEvent;
      });
      
      console.log('✅ PUBLIC registrations filter applied:', publicRegistrations.length, 'of', registrations.length);
      
      setEvents(publicEvents);
      setMyRegistrations(publicRegistrations);
    } catch (error) {
      console.error('Failed to load public events:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load public events',
      });
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    loadEvents();
  }, []);

  // Helper function to check if event is registered
  const isEventRegistered = (eventId: number) => {
    return myRegistrations.some((reg) => reg.eventId === eventId);
  };

  // Enhanced isEventExpired function from event.service.ts (supports both single-day and multi-day events)
  const isEventExpired = (event: Event) => {
    if (event.status === 'COMPLETED') return true;
    
    const now = new Date();
    
    // Check if event is multi-day
    if (event.days && event.days.length > 0) {
      const lastDay = event.days[event.days.length - 1];
      const [endHour, endMinute] = lastDay.endTime.split(':').map(Number);
      const [year, month, dayNum] = lastDay.date.split('-').map(Number);
      const eventEnd = new Date(year, month - 1, dayNum, endHour, endMinute);
      
      return now > eventEnd;
    }
    
    // Single-day event check
    
    // Check if event is multi-day
    if (event.days && event.days.length > 0) {
      const lastDay = event.days[event.days.length - 1];
      const [endHour, endMinute] = lastDay.endTime.split(':').map(Number);
      const [year, month, dayNum] = lastDay.date.split('-').map(Number);
      const eventEnd = new Date(year, month - 1, dayNum, endHour, endMinute);
      
      return now > eventEnd;
    }
    
    // Single-day event check
    if (!event.date || !event.endTime) return false;

    try {
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

    // CRITICAL: Extra safety check - ensure all events are PUBLIC type
    filtered = filtered.filter((event) => event.type === 'PUBLIC');

    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter((event) => {
        const eventName = event.name || '';
        const clubName = event.hostClub?.name || '';
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
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    };

    filtered = filtered.filter((event) => {
      const isExpired = isEventExpired(event);
      const isFuture = isFutureEvent(event);
      
      if (showExpiredFilter === 'hide') {
        if (event.status === 'REJECTED') return false;
        if (!['APPROVED', 'PENDING_UNISTAFF', 'ONGOING'].includes(event.status)) return false;
        if (event.status === 'ONGOING') return true;
        if (isExpired) return false;
        if (!isFuture) return false;
      } else if (showExpiredFilter === 'only') {
        if (!isExpired) return false;
      } else if (showExpiredFilter === 'show') {
        if (!['APPROVED', 'PENDING_UNISTAFF', 'COMPLETED', 'ONGOING'].includes(event.status)) {
          return false;
        }
      }
      
      return true;
    });

    setFilteredEvents(filtered);
  }, [searchTerm, events, showExpiredFilter, showRegisteredOnly, myRegistrations]);

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
    
    const isExpired = isEventExpired(event);
    if (isExpired) return 'Past';
    
    const eventDate = event.date || event.startDate;
    if (eventDate) {
      const status = getEventStatus(eventDate);
      if (status === 'upcoming') return 'Soon';
    }
    return 'Approved';
  };

  // Get event status
  const getEventStatus = (eventDate: string): 'past' | 'upcoming' | 'future' => {
    const now = new Date();
    const event = new Date(eventDate);

    if (event < now) return 'past';
    if (event.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000)
      return 'upcoming';
    return 'future';
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
    router.push(`/student/events-public/${eventId}` as any);
  };

  // Handle register click
  const handleRegisterClick = (event: Event) => {
    console.log('Selected event for registration:', event);
    setSelectedEventForRegistration(event);
    setShowConfirmModal(true);
  };

  // Handle confirm register
  const handleConfirmRegister = async () => {
    if (!selectedEventForRegistration) return;
    
    const eventId = selectedEventForRegistration.id;
    setRegisteringEventId(eventId);
    setShowConfirmModal(false);
    
    try {
      const result = await registerForEvent(eventId);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: result.message || 'Successfully registered for the event!',
      });
      // Reload registrations
      const registrations = await getMyEventRegistrations();
      setMyRegistrations(registrations);
    } catch (error: any) {
      console.error('Error registering for event:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Failed to register for the event',
      });
    } finally {
      setRegisteringEventId(null);
      setSelectedEventForRegistration(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-gray-900">        Public Events</Text>
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              className="bg-blue-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold">🎛️ Filters</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-600 mt-1">
            Discover upcoming public events from all clubs
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search events..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 text-base ml-2"
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
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
              <Text className="text-gray-500 mt-4">Loading public events...</Text>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-6xl mb-4">📅</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No public events found
              </Text>
              <Text className="text-gray-500 text-center px-8">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : showRegisteredOnly
                  ? 'You have not registered for any public events yet'
                  : 'No public events available at the moment'}
              </Text>
            </View>
          ) : (
            <View className="pb-4">
              {filteredEvents
                // CRITICAL: Final safety filter - ONLY render PUBLIC events
                .filter((event) => event.type === 'PUBLIC')
                .map((event) => {
                const isRegistered = isEventRegistered(event.id);
                const isExpired = isEventExpired(event);
                const statusText = getStatusText(event);

                return (
                  <View
                    key={event.id}
                    className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden"
                  >
                    {/* Event Header */}
                    <View className={`p-4 border-l-4 ${getStatusBadgeStyle(event)}`}>
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 mr-3">
                          <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
                            {event.name}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="business" size={14} color="#1F2937" />
                            <Text className="text-sm text-gray-900 ml-1">
                              {event.hostClub?.name || 'Unknown Club'}
                            </Text>
                          </View>
                        </View>
                        <View className="bg-gray-100 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-gray-700">PUBLIC</Text>
                        </View>
                      </View>

                      {/* Event Info */}
                      <View className="space-y-2 mt-3">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar" size={16} color="#1F2937" />
                          <Text className="text-sm text-gray-900 ml-2">
                            {event.date 
                              ? formatDate(event.date) 
                              : event.startDate && event.endDate
                              ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
                              : 'Date TBA'}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="time" size={16} color="#1F2937" />
                          <Text className="text-sm text-gray-900 ml-2">
                            {event.startTime && event.endTime
                              ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(event.endTime)}`
                              : event.days && event.days.length > 0
                              ? `${event.days[0].startTime} - ${event.days[event.days.length - 1].endTime}`
                              : 'Time not set'}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="location" size={16} color="#1F2937" />
                          <Text className="text-sm text-gray-900 ml-2">
                            {event.locationName || 'Location TBA'}
                          </Text>
                        </View>
                      </View>

                      {/* Status Badges */}
                      <View className="flex-row items-center gap-2 mt-3 flex-wrap">
                        <View className={`px-3 py-1 rounded-full ${getStatusBadgeStyle(event)}`}>
                          <Text className="text-xs font-semibold text-white">
                            {statusText}
                          </Text>
                        </View>
                        {/* Receive Points Badge */}
                        <View className="flex-row items-center px-3 py-1 rounded-full bg-emerald-600">
                          <Ionicons name="gift" size={12} color="white" />
                          <Text className="text-xs font-semibold text-white ml-1">
                            {(() => {
                              const budgetPoints = event.budgetPoints ?? 0;
                              const maxCheckInCount = event.maxCheckInCount ?? 1;
                              const receivePoint = maxCheckInCount > 0 ? Math.floor(budgetPoints / maxCheckInCount) : 0;
                              return receivePoint;
                            })()} pts
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row gap-2 mt-4">
                        <TouchableOpacity
                          onPress={() => handleEventDetail(event.id)}
                          className="flex-1 bg-gray-100 py-3 rounded-lg"
                        >
                          <Text className="text-center text-gray-900 font-semibold">
                            View Details
                          </Text>
                        </TouchableOpacity>
                        {!isRegistered && !isExpired && statusText !== 'Past' && (
                          <TouchableOpacity
                            onPress={() => handleRegisterClick(event)}
                            disabled={registeringEventId === event.id}
                            className={`flex-1 py-3 rounded-lg ${
                              registeringEventId === event.id ? 'bg-gray-400' : 'bg-blue-600'
                            }`}
                          >
                            <Text className="text-center text-white font-semibold">
                              {registeringEventId === event.id ? 'Registering...' : 'Register'}
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
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Filters</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
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
                  <Text className="font-semibold text-gray-900">Hide Expired</Text>
                  <Text className="text-sm text-gray-600 mt-1">Show only upcoming events</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowExpiredFilter('show')}
                  className={`p-4 rounded-lg mb-2 ${
                    showExpiredFilter === 'show' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'
                  }`}
                >
                  <Text className="font-semibold text-gray-900">Show All</Text>
                  <Text className="text-sm text-gray-600 mt-1">Include past events</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowExpiredFilter('only')}
                  className={`p-4 rounded-lg mb-2 ${
                    showExpiredFilter === 'only' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'
                  }`}
                >
                  <Text className="font-semibold text-gray-900">Only Expired</Text>
                  <Text className="text-sm text-gray-600 mt-1">Show only past events</Text>
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
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">My Registrations</Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      Show only events I registered for ({myRegistrations.length})
                    </Text>
                  </View>
                  <View className={`w-5 h-5 rounded ${showRegisteredOnly ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    {showRegisteredOnly && (
                      <Ionicons name="checkmark" size={16} color="white" style={{ marginLeft: 2 }} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

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
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Confirm Event Registration
            </Text>
            
            {selectedEventForRegistration && (
              <>
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-gray-900">
                    {selectedEventForRegistration.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {selectedEventForRegistration.hostClub?.name}
                  </Text>
                </View>
                
                {selectedEventForRegistration.budgetPoints > 0 && (
                  <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <Text className="text-sm font-medium text-yellow-800">
                      Commitment Required
                    </Text>
                    <Text className="text-sm text-yellow-700 mt-1">
                      {selectedEventForRegistration.budgetPoints} points will be held as commitment.
                      These points will be returned after successful attendance.
                    </Text>
                  </View>
                )}
              </>
            )}
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowConfirmModal(false);
                  setSelectedEventForRegistration(null);
                }}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                <Text className="text-center text-gray-900 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmRegister}
                className="flex-1 bg-blue-600 py-3 rounded-lg"
              >
                <Text className="text-center text-white font-semibold">
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
