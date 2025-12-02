import CalendarModal from '@components/CalendarModal';
import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
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
  TouchableOpacity,
  View
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
    
    if (!event.date) return 'Approved';
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <View className="flex-1 px-5">
        {/* Header */}
        <View className="bg-white rounded-3xl p-6 my-4 shadow-lg" style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="bg-teal-100 p-3 rounded-2xl mr-3">
                <Ionicons name="calendar" size={28} color="#14B8A6" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">Events</Text>
                <Text className="text-sm text-gray-500 mt-0.5">
                  Discover upcoming events
                </Text>
              </View>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setClubSelectorVisible(true)}
              className="flex-1 bg-purple-500 px-4 py-3 rounded-2xl flex-row items-center justify-center shadow-md"
              style={{ shadowColor: '#A855F7', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }}
            >
              <Ionicons name="business" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Clubs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              className="flex-1 bg-blue-500 px-4 py-3 rounded-2xl flex-row items-center justify-center shadow-md"
              style={{ shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }}
            >
              <Ionicons name="options" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Filters</Text>
            </TouchableOpacity>
          </View>
          
          {/* Info Badge */}
          {userClubIds.length > 0 && (
            <View className="mt-3 bg-teal-50 rounded-2xl p-3">
              <Text className="text-xs text-teal-700 font-semibold">
                {selectedClubId && selectedClubId !== 'all' 
                  ? `📍 ${clubs.find(c => String(c.id) === selectedClubId)?.name || 'Selected club'}`
                  : `📚 Showing from ${userClubIds.length} club${userClubIds.length > 1 ? 's' : ''}`
                }
              </Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View className="mb-4 flex-row gap-3">
          <View className="flex-1 flex-row items-center bg-white rounded-2xl px-5 py-4 shadow-md" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }}>
            <View className="bg-teal-50 p-2 rounded-xl mr-3">
              <Ionicons name="search" size={22} color="#14B8A6" />
            </View>
            <AppTextInput
              placeholder="Search events..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')} className="bg-gray-100 p-2 rounded-xl ml-2">
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => setShowCalendarModal(true)}
            className="bg-teal-500 rounded-2xl px-5 py-4 shadow-lg justify-center"
            style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }}
          >
            <Ionicons name="calendar" size={24} color="#fff" />
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
            <View className="bg-white rounded-3xl p-12 shadow-lg items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-6 rounded-full mb-4">
                <ActivityIndicator size="large" color="#14B8A6" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg">Loading events...</Text>
              <Text className="text-gray-500 text-sm mt-2">Please wait a moment</Text>
            </View>
          ) : userClubIds.length === 0 ? (
            <View className="bg-white rounded-3xl p-10 shadow-lg items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-8 rounded-full mb-6">
                <Ionicons name="business" size={56} color="#14B8A6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-3">
                No Club Membership
              </Text>
              <Text className="text-gray-600 text-center text-base leading-6 px-4">
                You need to join a club first to see events
              </Text>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View className="bg-white rounded-3xl p-10 shadow-lg items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-8 rounded-full mb-6">
                <Ionicons name="calendar-outline" size={56} color="#14B8A6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-3">
                No Events Found
              </Text>
              <Text className="text-gray-600 text-center text-base leading-6 px-4">
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
                    className="bg-white rounded-3xl shadow-lg mb-4 overflow-hidden"
                    style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }}
                  >
                    {/* Colorful Top Bar */}
                    <View 
                      className={`h-2 ${
                        isExpired 
                          ? 'bg-gray-400' 
                          : event.status === 'APPROVED' 
                          ? 'bg-teal-500' 
                          : event.status === 'ONGOING'
                          ? 'bg-cyan-500'
                          : event.status === 'PENDING'
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    
                    <View className="p-5">
                      {/* Event Header */}
                      <View className="flex-row items-start justify-between mb-4">
                        <View className="flex-1 mr-3">
                          <Text
                            className="text-lg font-bold text-gray-900 mb-2"
                            numberOfLines={2}
                          >
                            {eventName}
                          </Text>
                          <View className="flex-row items-center bg-teal-50 px-3 py-1.5 rounded-full self-start">
                            <View className="w-2 h-2 rounded-full bg-teal-500 mr-2" />
                            <Text className="text-sm font-semibold text-teal-700">
                              {club?.name || 'Unknown Club'}
                            </Text>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View
                          className={`${getStatusBadgeStyle(event)} px-4 py-2 rounded-2xl shadow-sm`}
                        >
                          <Text className="text-white text-xs font-bold">
                            {getStatusText(event)}
                          </Text>
                        </View>
                      </View>

                      {/* Event Description */}
                      {event.description && (
                        <View className="bg-gray-50 px-4 py-3 rounded-2xl mb-3">
                          <Text className="text-sm text-gray-600 leading-5" numberOfLines={3}>
                            {event.description}
                          </Text>
                        </View>
                      )}

                      {/* Event Info Grid */}
                      <View className="space-y-3 mb-4">
                        {/* Date */}
                        {eventDate && (
                          <View className="flex-row items-center bg-gray-50 px-4 py-3 rounded-2xl">
                            <View className="w-10 h-10 bg-teal-100 rounded-xl items-center justify-center mr-3">
                              <Ionicons name="calendar" size={20} color="#14B8A6" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs text-gray-500 mb-0.5">Event Date</Text>
                              <Text className="text-sm font-bold text-gray-800">
                                {formatDate(eventDate)}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Time */}
                        {event.startTime && event.endTime && (
                          <View className="flex-row items-center bg-gray-50 px-4 py-3 rounded-2xl">
                            <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
                              <Ionicons name="time" size={20} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs text-gray-500 mb-0.5">Time</Text>
                              <Text className="text-sm font-bold text-gray-800">
                                {timeObjectToString(event.startTime)} - {timeObjectToString(event.endTime)}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Location */}
                        {event.locationName && (
                          <View className="flex-row items-center bg-gray-50 px-4 py-3 rounded-2xl">
                            <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center mr-3">
                              <Ionicons name="location" size={20} color="#A855F7" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs text-gray-500 mb-0.5">Location</Text>
                              <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>
                                {event.locationName}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Type & Check-ins Grid */}
                        <View className="flex-row gap-3">
                          {/* Event Type */}
                          <View className="flex-1 flex-row items-center bg-gray-50 px-3 py-3 rounded-2xl">
                            <View className="w-9 h-9 bg-indigo-100 rounded-xl items-center justify-center mr-2.5">
                              <Ionicons name="pricetag" size={18} color="#6366F1" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs text-gray-500 mb-0.5">Type</Text>
                              <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>
                                {event.type === 'PUBLIC' ? 'Public' : 'Private'}
                              </Text>
                            </View>
                          </View>

                          {/* Check-in Count */}
                          <View className="flex-1 flex-row items-center bg-gray-50 px-3 py-3 rounded-2xl">
                            <View className="w-9 h-9 bg-green-100 rounded-xl items-center justify-center mr-2.5">
                              <Ionicons name="people" size={18} color="#10B981" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs text-gray-500 mb-0.5">Attendees</Text>
                              <Text className="text-sm font-bold text-gray-800">
                                {event.currentCheckInCount}/{event.maxCheckInCount}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Registration Deadline */}
                        {event.registrationDeadline && (
                          <View className="flex-row items-center bg-orange-50 px-4 py-3 rounded-2xl border border-orange-200">
                            <View className="w-10 h-10 bg-orange-100 rounded-xl items-center justify-center mr-3">
                              <Ionicons name="alarm" size={20} color="#F97316" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs text-orange-600 mb-0.5 font-semibold">Registration Deadline</Text>
                              <Text className="text-sm font-bold text-orange-700">
                                {new Date(event.registrationDeadline).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Point Cost */}
                        {event.commitPointCost !== undefined && event.commitPointCost > 0 && (
                          <View className="flex-row items-center bg-amber-50 px-4 py-3 rounded-2xl border border-amber-200">
                            <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center mr-3">
                              <Ionicons name="trophy" size={20} color="#F59E0B" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs text-amber-600 mb-0.5 font-semibold">Commitment Cost</Text>
                              <Text className="text-sm text-gray-700">
                                <Text className="font-bold text-amber-600 text-lg">{event.commitPointCost}</Text> points required
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row gap-3">
                        <TouchableOpacity
                          onPress={() => handleEventDetail(event.id)}
                          className="flex-1 py-3.5 rounded-2xl items-center bg-gray-100 shadow-sm"
                        >
                          <View className="flex-row items-center">
                            <Ionicons name="information-circle" size={18} color="#6B7280" />
                            <Text className="font-bold text-gray-700 ml-2">
                              Details
                            </Text>
                          </View>
                        </TouchableOpacity>
                        
                        {!isExpired && (event.status === 'APPROVED' || event.status === 'ONGOING') && (
                          <TouchableOpacity
                            onPress={() => handleRegisterClick(event)}
                            disabled={isRegistering || isRegistered}
                            className={`flex-1 py-3.5 rounded-2xl items-center shadow-lg ${
                              isRegistered
                                ? 'bg-green-500'
                                : isRegistering
                                ? 'bg-gray-300'
                                : 'bg-teal-500'
                            }`}
                            style={!isRegistering && !isRegistered ? { shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 } : {}}
                          >
                            <View className="flex-row items-center">
                              {isRegistered ? (
                                <Ionicons name="checkmark-circle" size={18} color="white" />
                              ) : (
                                <Ionicons name="add-circle" size={18} color="white" />
                              )}
                              <Text
                                className={`font-bold ml-2 ${
                                  isRegistering ? 'text-gray-500' : 'text-white'
                                }`}
                              >
                                {isRegistering
                                  ? 'Registering...'
                                  : isRegistered
                                  ? 'Registered'
                                  : 'Register'}
                              </Text>
                            </View>
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
        events={filteredEvents
          .filter(event => event.date !== undefined && event.date !== null)
          .map(event => ({
            ...event,
            date: event.date as string,
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
