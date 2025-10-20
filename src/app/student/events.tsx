import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { ClubService } from '@services/club.service';
import { Event, fetchEvent } from '@services/event.service';
import { MembershipsService } from '@services/memberships.service';
import { useAuthStore } from '@stores/auth.store';
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

interface Club {
  id: number;
  name: string;
}

export default function StudentEventsPage() {
  const { user } = useAuthStore();

  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userClubIds, setUserClubIds] = useState<number[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Get user's club IDs from auth store or user data
  useEffect(() => {
    const loadUserClubIds = async () => {
      try {
        // First, try to get from user object if available
        if (user?.clubIds && Array.isArray(user.clubIds)) {
          const clubIdNumbers = user.clubIds.map((id) => Number(id)).filter((id) => !isNaN(id));
          console.log('Events page - Setting userClubIds from user object:', clubIdNumbers);
          setUserClubIds(clubIdNumbers);
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
  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Load events and clubs in parallel
      const [eventsData, clubsData] = await Promise.all([
        fetchEvent(),
        ClubService.fetchClubs(0, 100),
      ]);

      console.log('Events page - Loaded events:', eventsData.length);
      console.log('Events page - User club IDs:', userClubIds);

      setEvents(eventsData);
      setClubs(clubsData);

      // Filter events by user's club IDs only if user has club memberships
      // If userClubIds is empty, show all events (user might not have joined any clubs yet)
      if (userClubIds.length > 0) {
        const userEvents = eventsData.filter((event) => {
          const eventClubId = Number(event.clubId);
          const isUserEvent = userClubIds.includes(eventClubId);
          if (isUserEvent) {
            console.log(`Including event "${event.name}" from club ${eventClubId}`);
          }
          return isUserEvent;
        });
        console.log('Events page - Filtered events for user:', userEvents.length);
        setFilteredEvents(userEvents);
      } else {
        // Show all events if user hasn't joined any clubs
        console.log('Events page - Showing all events (no club filter)');
        setFilteredEvents(eventsData);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
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
  }, [userClubIds]);

  // Search filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // No search term - show filtered events based on club membership
      if (userClubIds.length > 0) {
        const userEvents = events.filter((event) =>
          userClubIds.includes(Number(event.clubId))
        );
        setFilteredEvents(userEvents);
      } else {
        // Show all events if no club filter
        setFilteredEvents(events);
      }
    } else {
      // Apply search filter
      const filtered = events.filter((event) => {
        const eventName = event.name || event.eventName || '';
        const club = clubs.find((c) => c.id === event.clubId);
        const clubName = club?.name || '';

        const matchesSearch =
          eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clubName.toLowerCase().includes(searchTerm.toLowerCase());

        // Filter by club membership only if user has clubs
        const matchesClub =
          userClubIds.length === 0 || userClubIds.includes(Number(event.clubId));

        return matchesSearch && matchesClub;
      });
      setFilteredEvents(filtered);
    }
  }, [searchTerm, events, clubs, userClubIds]);

  // Get event status
  const getEventStatus = (eventDate: string): 'past' | 'upcoming' | 'future' => {
    const now = new Date();
    const event = new Date(eventDate);

    if (event < now) return 'past';
    if (event.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000)
      return 'upcoming';
    return 'future';
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'past':
        return 'bg-gray-400';
      case 'upcoming':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'past':
        return 'Past';
      case 'upcoming':
        return 'Soon';
      default:
        return 'Future';
    }
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
  const handleEventDetail = (event: Event) => {
    setSelectedEvent(event);
    setDetailModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-gray-900">Events</Text>
          <Text className="text-sm text-gray-600 mt-1">
            Discover upcoming events from your clubs
          </Text>
          {userClubIds.length > 0 && (
            <Text className="text-xs text-gray-500 mt-1">
              Showing events from club{userClubIds.length > 1 ? 's' : ''}{' '}
              {userClubIds.join(', ')}
            </Text>
          )}
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm">
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
          ) : filteredEvents.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-6xl mb-4">📅</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No events found
              </Text>
              <Text className="text-gray-500 text-center px-8">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : "Your clubs haven't posted any events yet"}
              </Text>
            </View>
          ) : (
            <View className="pb-4">
              {filteredEvents.map((event) => {
                const club = clubs.find((c) => c.id === event.clubId);
                const eventDate = event.date || event.eventDate || '';
                const status = getEventStatus(eventDate);
                const eventName = event.name || event.eventName || 'Untitled Event';

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
                              {club?.name || `Club ${event.clubId}`}
                            </Text>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View
                          className={`${getStatusColor(
                            status
                          )} px-3 py-1 rounded-full`}
                        >
                          <Text className="text-white text-xs font-medium">
                            {getStatusText(status)}
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

                        {/* Type */}
                        {(event.type || event.eventType) && (
                          <View className="flex-row items-center">
                            <Text className="text-gray-400 mr-2">🏷️</Text>
                            <Text className="text-sm text-gray-600">
                              {event.type || event.eventType}
                            </Text>
                          </View>
                        )}

                        {/* Expected Attendees */}
                        {event.expectedAttendees && (
                          <View className="flex-row items-center">
                            <Text className="text-gray-400 mr-2">👤</Text>
                            <Text className="text-sm text-gray-600">
                              {event.expectedAttendees} expected attendees
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Detail Button */}
                      <TouchableOpacity
                        onPress={() => handleEventDetail(event)}
                        disabled={status === 'past'}
                        className={`py-3 rounded-lg items-center ${
                          status === 'past' ? 'bg-gray-300' : 'bg-blue-500'
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            status === 'past' ? 'text-gray-500' : 'text-white'
                          }`}
                        >
                          {status === 'past' ? 'Event Ended' : 'View Details'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Event Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-white rounded-t-3xl mt-20">
            {/* Modal Header - Fixed */}
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-gray-200">
              <View className="flex-row items-center">
                <Text className="text-gray-400 mr-2">👁️</Text>
                <Text className="text-base text-gray-600">Event Details</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Text className="text-gray-600 text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <ScrollView 
                showsVerticalScrollIndicator={false}
                className="flex-1"
              >
                <View className="p-6">
                  {/* Event Header */}
                  <View className="mb-6">
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-3">
                        <Text className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedEvent.name || selectedEvent.eventName}
                        </Text>
                        
                        {/* Type Badge */}
                        <View className="flex-row items-center">
                          <View
                            className={`px-3 py-1 rounded-full ${
                              selectedEvent.type === 'PUBLIC'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                            }`}
                          >
                            <Text className="text-white text-xs font-medium">
                              {selectedEvent.type || selectedEvent.eventType || 'Event'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Event ID */}
                      <View className="bg-gray-50 px-3 py-2 rounded-lg">
                        <Text className="text-xs text-gray-500">Event ID</Text>
                        <Text className="text-base font-bold text-gray-900 font-mono">
                          #{selectedEvent.id}
                        </Text>
                      </View>
                    </View>

                    {/* Club Name */}
                    <View className="flex-row items-center bg-blue-50 p-3 rounded-lg">
                      <Text className="text-blue-600 mr-2">🏢</Text>
                      <Text className="text-sm text-blue-900 font-medium">
                        {clubs.find((c) => c.id === selectedEvent.clubId)?.name ||
                          `Club ${selectedEvent.clubId}`}
                      </Text>
                    </View>
                  </View>

                  {/* Separator */}
                  <View className="h-px bg-gray-200 mb-6" />

                  {/* Description */}
                  {selectedEvent.description && (
                    <View className="mb-6">
                      <Text className="text-base font-semibold text-gray-900 mb-3">
                        Description
                      </Text>
                      <Text className="text-sm text-gray-600 leading-6">
                        {selectedEvent.description}
                      </Text>
                    </View>
                  )}

                  {/* Separator */}
                  <View className="h-px bg-gray-200 mb-6" />

                  {/* Date & Time Section */}
                  <View className="mb-6">
                    <Text className="text-base font-semibold text-gray-900 mb-3">
                      📅 Date & Time
                    </Text>
                    <View className="space-y-3">
                      {/* Date */}
                      {(selectedEvent.date || selectedEvent.eventDate) && (
                        <View className="bg-gray-50 p-4 rounded-xl">
                          <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                              <Text className="text-xl">📅</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-semibold text-gray-900">
                                {formatDate(
                                  selectedEvent.date || selectedEvent.eventDate || ''
                                )}
                              </Text>
                              <Text className="text-xs text-gray-500 mt-1">
                                {selectedEvent.date || selectedEvent.eventDate}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Time */}
                      {selectedEvent.time && (
                        <View className="bg-gray-50 p-4 rounded-xl">
                          <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                              <Text className="text-xl">🕐</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-semibold text-gray-900">
                                {selectedEvent.time}
                              </Text>
                              <Text className="text-xs text-gray-500 mt-1">
                                Start Time
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Location & Organization Section */}
                  <View className="mb-6">
                    <Text className="text-base font-semibold text-gray-900 mb-3">
                      📍 Location & Organization
                    </Text>
                    <View className="space-y-3">
                      {/* Location */}
                      {selectedEvent.locationId && (
                        <View className="bg-gray-50 p-4 rounded-xl">
                          <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                              <Text className="text-xl">📍</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-semibold text-gray-900">
                                {selectedEvent.venue || `Location ID: ${selectedEvent.locationId}`}
                              </Text>
                              <Text className="text-xs text-gray-500 mt-1">
                                Event Venue
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Club/Organization */}
                      <View className="bg-gray-50 p-4 rounded-xl">
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                            <Text className="text-xl">�</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-gray-900">
                              {clubs.find((c) => c.id === selectedEvent.clubId)?.name ||
                                `Club ID: ${selectedEvent.clubId}`}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-1">
                              Organizing Club
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Additional Info */}
                  {(selectedEvent.category || 
                    selectedEvent.expectedAttendees || 
                    selectedEvent.status) && (
                    <>
                      <View className="h-px bg-gray-200 mb-6" />
                      <View className="mb-6">
                        <Text className="text-base font-semibold text-gray-900 mb-3">
                          ℹ️ Additional Information
                        </Text>
                        <View className="space-y-2">
                          {/* Category */}
                          {selectedEvent.category && (
                            <View className="flex-row items-center py-2">
                              <Text className="text-gray-500 text-sm w-32">Category</Text>
                              <Text className="text-gray-900 text-sm font-medium flex-1">
                                {selectedEvent.category}
                              </Text>
                            </View>
                          )}

                          {/* Expected Attendees */}
                          {selectedEvent.expectedAttendees && (
                            <View className="flex-row items-center py-2">
                              <Text className="text-gray-500 text-sm w-32">Expected</Text>
                              <Text className="text-gray-900 text-sm font-medium flex-1">
                                {selectedEvent.expectedAttendees} attendees
                              </Text>
                            </View>
                          )}

                          {/* Status */}
                          {selectedEvent.status && (
                            <View className="flex-row items-center py-2">
                              <Text className="text-gray-500 text-sm w-32">Status</Text>
                              <View
                                className={`px-3 py-1 rounded-full ${
                                  selectedEvent.status === 'ACTIVE' ||
                                  selectedEvent.status === 'APPROVED'
                                    ? 'bg-green-100'
                                    : 'bg-gray-100'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-medium ${
                                    selectedEvent.status === 'ACTIVE' ||
                                    selectedEvent.status === 'APPROVED'
                                      ? 'text-green-700'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {selectedEvent.status}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </>
                  )}
                </View>

                {/* Action Buttons - Fixed at bottom inside scroll */}
                <View className="p-6 pt-0 pb-8">
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setDetailModalVisible(false)}
                      className="flex-1 py-4 rounded-xl bg-gray-100 items-center"
                    >
                      <Text className="font-semibold text-gray-700">
                        Close
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        // TODO: Implement register for event
                        console.log('Register for event:', selectedEvent.id);
                        setDetailModalVisible(false);
                      }}
                      className="flex-1 py-4 rounded-xl bg-blue-500 items-center"
                    >
                      <Text className="font-semibold text-white">
                        📝 Register
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
