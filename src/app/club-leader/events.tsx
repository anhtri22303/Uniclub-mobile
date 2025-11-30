import CalendarModal from '@components/CalendarModal';
import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useClub, useEventCoHostByClub, useEventsByClub } from '@hooks/useQueryHooks';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type ClubLeaderEvent = {
  id: number;
  name: string;
  description: string;
  type: string;
  date: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  registrationDeadline?: string; // NEW: Registration deadline
  status: string;
  locationId?: number;
  locationName?: string;
  checkInCode?: string;
  points?: number;
  budgetPoints?: number;
  commitPointCost?: number; // NEW: Commit point cost (ticket price)
  hostClub?: {
    id: number;
    name: string;
  };
  coHostedClubs?: Array<{
    id: number;
    name: string;
    coHostStatus?: string;
  }>;
  clubId?: number;
  clubName?: string;
  maxCheckInCount?: number;
  currentCheckInCount?: number;
  myCoHostStatus?: string | null;
};

// Helper function to check if event has expired (past endTime) or is COMPLETED
function isEventExpired(event: ClubLeaderEvent): boolean {
  // COMPLETED, REJECTED, CANCELLED status are always considered expired
  if (["COMPLETED", "REJECTED", "CANCELLED"].includes(event.status)) return true;

  if (!event.date) return false;

  try {
    // Get current date/time in Vietnam timezone (UTC+7)
    const now = new Date();
    
    // Parse event date and time (treating as Vietnam timezone UTC+7)
    const [year, month, day] = event.date.split('-').map(Number);
    
    if (event.endTime) {
      // Parse endTime (format: HH:MM:SS or HH:MM)
      const timeParts = event.endTime.split(':');
      const hours = parseInt(timeParts[0] || '0', 10);
      const minutes = parseInt(timeParts[1] || '0', 10);
      
      // Create event end datetime string in ISO format for Vietnam timezone
      const eventEndDateTimeStr = `${event.date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+07:00`;
      const eventEndDateTime = new Date(eventEndDateTimeStr);
      
      // Event is expired if current time is past the end time
      const isExpired = now > eventEndDateTime;
      
      console.log('[EXPIRED CHECK]', event.name, {
        now: now.toISOString(),
        eventEnd: eventEndDateTime.toISOString(),
        expired: isExpired
      });
      
      return isExpired;
    } else {
      // If no endTime, check if the date has passed (end of day Vietnam time)
      const eventEndDateTimeStr = `${event.date}T23:59:59+07:00`;
      const eventEndDateTime = new Date(eventEndDateTimeStr);
      return now > eventEndDateTime;
    }
  } catch (error) {
    console.error('Error checking event expiration:', error, event);
    return false;
  }
}

// Helper function to check if event is active (ONGOING and within date/time range)
function isEventActive(event: ClubLeaderEvent): boolean {
  // COMPLETED status means event has ended
  if (event.status === "COMPLETED") return false;
  
  // Must be ONGOING
  if (event.status !== "ONGOING") return false;

  // Must not be expired
  if (isEventExpired(event)) return false;

  // Check if date and endTime are present
  if (!event.date || !event.endTime) return false;

  return true;
}

// Helper function to get event status based on date and time
function getEventStatus(event: ClubLeaderEvent): string {
  // ONGOING status from API takes priority (matching web implementation)
  if (event.status === "ONGOING") return "Now";
  
  if (!event.date) return 'Finished';
  
  // Get current time in Vietnam timezone (UTC+7)
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
  // Parse event date and time
  const timeStr = event.startTime || event.time || '00:00';
  const [hour = '00', minute = '00'] = timeStr.split(':');
  const [year, month, day] = event.date.split('-').map(Number);
  const eventStart = new Date(year, month - 1, day, Number(hour), Number(minute), 0, 0);

  // Parse event end time
  let eventEnd = eventStart;
  if (event.endTime) {
    const [endHour = '00', endMinute = '00'] = event.endTime.split(':');
    eventEnd = new Date(year, month - 1, day, Number(endHour), Number(endMinute), 0, 0);
  } else {
    // If no end time, assume 2 hours duration
    eventEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);
  }

  const start = eventStart.getTime();
  const end = eventEnd.getTime();

  if (vnTime.getTime() < start) {
    // If event starts within next 7 days, it's "Soon"
    if (start - vnTime.getTime() < 7 * 24 * 60 * 60 * 1000) return 'Soon';
    return 'Future';
  }
  if (vnTime.getTime() >= start && vnTime.getTime() <= end) return 'Now';
  return 'Finished';
}

// Helper function to sort events by date and time (newest to oldest)
function sortEventsByDateTime(eventList: ClubLeaderEvent[]): ClubLeaderEvent[] {
  return eventList.sort((a, b) => {
    // Parse dates for comparison
    const dateA = new Date(a.date || '1970-01-01');
    const dateB = new Date(b.date || '1970-01-01');

    // Compare dates first (newest first)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime();
    }

    // If dates are equal, compare times (latest startTime first)
    const timeA = a.startTime || a.time || '00:00';
    const timeB = b.startTime || b.time || '00:00';

    // Convert time strings to comparable format
    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(':').map(Number);
      const hours = parts[0] || 0;
      const minutes = parts[1] || 0;
      return hours * 60 + minutes;
    };

    return parseTime(timeB) - parseTime(timeA);
  });
}

export default function Events() {
  const router = useRouter();
  const { user } = useAuthStore();
  const clubId = user?.clubIds?.[0] || null;
  
  // View mode state
  const [viewMode, setViewMode] = useState<'hosted' | 'cohost'>('hosted');
  // Status dropdown modal state
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Status filter state
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Fetch data using React Query hooks
  const { data: managedClub, isLoading: clubLoading } = useClub(clubId || 0, !!clubId);
  const { data: rawEvents = [], isLoading: eventsLoading } = useEventsByClub(clubId || 0, !!clubId && viewMode === 'hosted');
  const { data: rawCoHostEvents = [], isLoading: coHostEventsLoading } = useEventCoHostByClub(clubId || 0, !!clubId && viewMode === 'cohost');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [showExpiredEvents, setShowExpiredEvents] = useState<boolean>(false);

  // Process and sort events - matching web version normalization
  const events = useMemo(() => {
    const eventsToProcess = viewMode === 'hosted' ? rawEvents : rawCoHostEvents;
    
    // Normalize events with both new and legacy field support
    const normalized = eventsToProcess
      .filter((e: any) => {
        // For hosted events, ONLY show events where this club is the hostClub
        if (viewMode === 'hosted' && clubId) {
          return e.hostClub?.id === clubId;
        }
        // For co-host events, ONLY show events where this club is in coHostedClubs
        if (viewMode === 'cohost' && clubId) {
          return e.coHostedClubs?.some((club: any) => club.id === clubId);
        }
        return true;
      })
      .map((e: any) => {
        // For co-host events, find the club's co-host status
        const myCoHostStatus = viewMode === 'cohost' && clubId
          ? e.coHostedClubs?.find((club: any) => club.id === clubId)?.coHostStatus
          : null;
        
        return {
          ...e,
          title: e.name || e.title, // Map name to title for consistency
          time: e.startTime || e.time, // Map startTime to time for legacy compatibility
          clubId: e.hostClub?.id || e.clubId, // Map hostClub.id to clubId for backward compatibility
          clubName: e.hostClub?.name || e.clubName, // Map hostClub.name to clubName for backward compatibility
          myCoHostStatus, // Add co-host status for this club
        };
      });
    return sortEventsByDateTime(normalized);
  }, [viewMode, rawEvents, rawCoHostEvents, clubId]);

  // Get all unique statuses from events
  const allStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    events.forEach(ev => {
      if (ev.status) statusSet.add(ev.status);
    });
    return Array.from(statusSet);
  }, [events]);

  // Filter events by search term, expiration status, and selected status
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search term filter
      const matchesSearch = String(event.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      // Expiration filter
      const expired = isEventExpired(event);
      
      // Debug log for expired events
      if (event.status === 'PENDING_UNISTAFF' || event.status === 'PENDING_COCLUB') {
        console.log(`[EVENT FILTER] ${event.name}:`, {
          status: event.status,
          date: event.date,
          endTime: event.endTime,
          expired: expired,
          showExpiredEvents: showExpiredEvents,
          willShow: showExpiredEvents || !expired
        });
      }
      
      const matchesExpirationFilter = showExpiredEvents || !expired;
      // Status filter
      const matchesStatus = selectedStatus === 'ALL' || event.status === selectedStatus;
      return matchesSearch && matchesExpirationFilter && matchesStatus;
    });
  }, [events, searchTerm, showExpiredEvents, selectedStatus]);

  // Create event handler - disabled for mobile, redirect to web
  const handleCreateEvent = () => {
    Toast.show({
      type: 'info',
      text1: 'Create Event on Web',
      text2: 'Please create a new event on the web',
      position: 'bottom',
    });
  };

  const loading = eventsLoading || coHostEventsLoading || clubLoading;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Sidebar role={user?.role} />
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-800">         Events</Text>
          {clubLoading ? (
            <View className="h-5 w-48 bg-gray-200 rounded mt-1" />
          ) : (
            <Text className="text-gray-500 mt-1">
              Event Management for "{managedClub?.name || 'Club'}"
            </Text>
          )}
        </View>

        {/* View Mode Toggle */}
        <View className="px-4 pb-2">
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center px-4 py-2.5 rounded-lg ${
                viewMode === 'hosted'
                  ? 'bg-teal-600'
                  : 'bg-white border border-gray-300'
              }`}
              onPress={() => setViewMode('hosted')}
            >
              <Ionicons
                name="calendar"
                size={18}
                color={viewMode === 'hosted' ? '#FFFFFF' : '#0D9488'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  viewMode === 'hosted' ? 'text-white' : 'text-teal-600'
                }`}
              >
                Hosted Events ({rawEvents.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center px-4 py-2.5 rounded-lg ${
                viewMode === 'cohost'
                  ? 'bg-teal-600'
                  : 'bg-white border border-gray-300'
              }`}
              onPress={() => setViewMode('cohost')}
            >
              <Ionicons
                name="people"
                size={18}
                color={viewMode === 'cohost' ? '#FFFFFF' : '#0D9488'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  viewMode === 'cohost' ? 'text-white' : 'text-teal-600'
                }`}
              >
                Co-host Events ({rawCoHostEvents.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search, Status Filter, and Create Button */}
        <View className="px-4 pb-2 flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200 text-gray-800"
            placeholder="Search events..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {/* Status Dropdown Filter */}
          <View style={{ minWidth: 120 }}>
            <TouchableOpacity
              className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 flex-row items-center"
              onPress={() => setShowStatusDropdown(true)}
            >
              <Ionicons name="filter" size={18} color="#0D9488" />
              <Text className="ml-2 text-gray-700 text-sm font-medium">
                {selectedStatus === 'ALL' ? 'All Status' : selectedStatus}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            {/* Dropdown Modal */}
            {showStatusDropdown && (
              <View style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 10, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
                <TouchableOpacity
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}
                  onPress={() => { setSelectedStatus('ALL'); setShowStatusDropdown(false); }}
                >
                  <Text style={{ color: '#0D9488', fontWeight: 'bold' }}>All Status</Text>
                </TouchableOpacity>
                {allStatuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}
                    onPress={() => { setSelectedStatus(status); setShowStatusDropdown(false); }}
                  >
                    <Text style={{ color: status === selectedStatus ? '#0D9488' : '#374151', fontWeight: status === selectedStatus ? 'bold' : 'normal' }}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg px-3 py-2"
            onPress={() => setShowCalendarModal(true)}
          >
            <Ionicons name="calendar" size={20} color="#fff" />
          </TouchableOpacity>
          {viewMode === 'hosted' && (
            <TouchableOpacity
              className="bg-teal-600 rounded-lg px-3 py-2"
              onPress={handleCreateEvent}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Toggle */}
        <View className="px-4 pb-3">
          <TouchableOpacity
            className={`flex-row items-center justify-center px-4 py-2 rounded-lg border ${
              showExpiredEvents
                ? 'bg-teal-50 border-teal-300'
                : 'bg-gray-100 border-gray-300'
            }`}
            onPress={() => {
              console.log('[TOGGLE] Current showExpiredEvents:', showExpiredEvents, '-> will become:', !showExpiredEvents);
              setShowExpiredEvents(!showExpiredEvents);
            }}
          >
            <Ionicons
              name={showExpiredEvents ? 'eye' : 'eye-off'}
              size={18}
              color={showExpiredEvents ? '#0D9488' : '#6B7280'}
            />
            <Text
              className={`ml-2 font-medium ${
                showExpiredEvents ? 'text-teal-700' : 'text-gray-600'
              }`}
            >
              {showExpiredEvents ? 'Showing All Events' : 'Hiding Expired Events'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0D9488" />
          </View>
        ) : filteredEvents.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons name="calendar" size={48} color="#94A3B8" />
            <Text className="mt-4 text-lg text-gray-500">No events found</Text>
            {searchTerm ? (
              <Text className="mt-2 text-sm text-gray-400">Try different search terms</Text>
            ) : viewMode === 'hosted' ? (
              <TouchableOpacity
                className="mt-4 bg-teal-600 rounded-lg px-6 py-2"
                onPress={handleCreateEvent}
              >
                <Text className="text-white font-semibold">Create Event</Text>
              </TouchableOpacity>
            ) : (
              <Text className="mt-2 text-sm text-gray-400">No co-host events</Text>
            )}
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 80 }}>
            {filteredEvents.map((event) => {
              const isCompleted = event.status === "COMPLETED";
              const expired = isCompleted || isEventExpired(event);
              const status = expired ? 'Finished' : getEventStatus(event);
              
              // Border color logic - expired events and different statuses
              let borderColor = '#e5e7eb';
              if (viewMode === 'cohost') {
                // For co-host events, use coHostStatus
                if (isCompleted) {
                  borderColor = '#1E3A8A'; // blue-900
                } else if (expired) {
                  borderColor = '#9CA3AF'; // gray-400
                } else if (event.myCoHostStatus === 'APPROVED') {
                  borderColor = '#10B981'; // green-500
                } else if (event.myCoHostStatus === 'REJECTED') {
                  borderColor = '#EF4444'; // red-500
                } else if (event.myCoHostStatus === 'PENDING') {
                  borderColor = '#F59E0B'; // amber-500
                }
              } else {
                // For hosted events, use event status
                if (isCompleted) {
                  borderColor = '#1E3A8A'; // blue-900
                } else if (expired) {
                  borderColor = '#9CA3AF'; // gray-400
                } else if (event.status === 'APPROVED' || event.status === 'ONGOING') {
                  borderColor = '#10B981'; // green-500
                } else if (event.status === 'REJECTED') {
                  borderColor = '#EF4444'; // red-500
                } else if (event.status === 'PENDING_COCLUB') {
                  borderColor = '#F97316'; // orange-500
                } else if (event.status === 'PENDING_UNISTAFF' || event.status === 'WAITING') {
                  borderColor = '#F59E0B'; // amber-500
                }
              }

              return (
                <View
                  key={event.id}
                  className="mb-4 bg-white rounded-xl shadow-sm"
                  style={{ borderColor, borderWidth: 2, opacity: expired ? 0.6 : 1 }}
                >
                  <View className="p-4">
                    {/* Title and Status Badge */}
                    <View className="flex-row justify-between items-start mb-2">
                      <View style={{ flex: 1 }}>
                        <Text className="text-lg font-bold text-gray-800" numberOfLines={2}>
                          {event.name}
                        </Text>
                        {event.description ? (
                          <Text className="text-gray-500 mt-1 text-sm" numberOfLines={2}>
                            {event.description}
                          </Text>
                        ) : null}
                      </View>
                      <View className="ml-2">
                        <View
                          className={`px-2 py-1 rounded-full ${
                            status === 'Finished'
                              ? 'bg-gray-200'
                              : status === 'Soon'
                              ? 'bg-yellow-100'
                              : status === 'Now'
                              ? 'bg-red-100'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              status === 'Finished'
                                ? 'text-gray-600'
                                : status === 'Soon'
                                ? 'text-yellow-700'
                                : status === 'Now'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {status === 'Soon' ? 'Soon' : status === 'Now' ? 'Now' : status === 'Finished' ? 'Finished' : 'Future'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Approval Status Badge */}
                    <View className="mb-3 flex-row flex-wrap gap-2">
                      {isCompleted ? (
                        <View className="bg-blue-900 px-2 py-1 rounded-full">
                          <Text className="text-xs font-semibold text-white">Completed</Text>
                        </View>
                      ) : expired ? (
                        <View className="bg-gray-400 px-2 py-1 rounded-full">
                          <Text className="text-xs font-semibold text-white">Expired</Text>
                        </View>
                      ) : viewMode === 'cohost' ? (
                        <>
                          {/* Show co-host status for co-host events */}
                          {event.myCoHostStatus === 'APPROVED' && (
                            <View className="bg-green-600 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">Co-host Approved</Text>
                            </View>
                          )}
                          {event.myCoHostStatus === 'PENDING' && (
                            <View className="bg-amber-500 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">Co-host Pending</Text>
                            </View>
                          )}
                          {event.myCoHostStatus === 'REJECTED' && (
                            <View className="bg-red-500 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">Co-host Rejected</Text>
                            </View>
                          )}
                          {/* Also show overall event status */}
                          {event.status === 'APPROVED' && (
                            <View className="bg-green-100 border border-green-500 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-green-700">Event Approved</Text>
                            </View>
                          )}
                          {event.status === 'ONGOING' && (
                            <View className="bg-cyan-100 border border-cyan-500 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-cyan-700">Event Ongoing</Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <>
                          {event.status === 'APPROVED' && (
                            <View className="bg-green-500 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">Approved</Text>
                            </View>
                          )}
                          {event.status === 'ONGOING' && (
                            <View className="bg-cyan-600 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">Ongoing</Text>
                            </View>
                          )}
                          {event.status === 'WAITING' && (
                            <View className="bg-amber-500 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">Waiting Co-host</Text>
                            </View>
                          )}
                          {event.status === 'PENDING_COCLUB' && (
                            <View className="bg-orange-500 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">Pending Co-host</Text>
                            </View>
                          )}
                          {event.status === 'PENDING_UNISTAFF' && (
                            <View className="bg-amber-500 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">Pending University</Text>
                            </View>
                          )}
                          {event.status === 'REJECTED' && (
                            <View className="bg-red-500 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-white">Rejected</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>

                    {/* Event Details */}
                    <View className="space-y-2 mb-4">
                      {/* Date */}
                      <View className="flex-row items-center">
                        <Ionicons name="calendar" size={16} color="#0D9488" />
                        <Text className="text-sm text-gray-600 ml-2">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>

                      {/* Time */}
                      {event.time && (
                        <View className="flex-row items-center">
                          <Ionicons name="time" size={16} color="#0D9488" />
                          <Text className="text-sm text-gray-600 ml-2">
                            {event.time}
                            {event.endTime && ` - ${event.endTime}`}
                          </Text>
                        </View>
                      )}

                      {/* Location */}
                      {event.locationName && (
                        <View className="flex-row items-center">
                          <Ionicons name="location" size={16} color="#0D9488" />
                          <Text className="text-sm text-gray-600 ml-2">{event.locationName}</Text>
                        </View>
                      )}

                      {/* Points */}
                      {event.points && (
                        <View className="flex-row items-center">
                          <Ionicons name="trophy" size={16} color="#0D9488" />
                          <Text className="text-sm text-gray-600 ml-2">{event.points} points</Text>
                        </View>
                      )}

                      {/* Commit Point Cost (Ticket Price) - NEW */}
                      {event.commitPointCost !== undefined && event.commitPointCost > 0 && (
                        <View className="flex-row items-center">
                          <Ionicons name="pricetag" size={16} color="#F59E0B" />
                          <Text className="text-sm text-gray-600 ml-2">
                            <Text className="font-semibold text-amber-600">{event.commitPointCost}</Text> points (ticket)
                          </Text>
                        </View>
                      )}

                      {/* Receive Points - NEW */}
                      <View className="flex-row items-center">
                        <View className="flex-row items-center px-3 py-1 rounded-full bg-emerald-600">
                          <Ionicons name="gift" size={12} color="white" />
                          <Text className="text-xs font-semibold text-white ml-1">
                            {(() => {
                              const budgetPoints = event.budgetPoints ?? 0
                              const maxCheckInCount = event.maxCheckInCount ?? 1
                              return maxCheckInCount > 0 ? Math.floor(budgetPoints / maxCheckInCount) : 0
                            })()} pts
                          </Text>
                        </View>
                      </View>

                      {/* Registration Deadline - NEW */}
                      {event.registrationDeadline && (
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={16} color="#EF4444" />
                          <Text className="text-sm text-gray-600 ml-2">
                            Reg. deadline: {new Date(event.registrationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                      )}

                      {/* Check-in Count */}
                      {event.maxCheckInCount && (
                        <View className="flex-row items-center">
                          <Ionicons name="people" size={16} color="#0D9488" />
                          <Text className="text-sm text-gray-600 ml-2">
                            {event.currentCheckInCount || 0} / {event.maxCheckInCount} checked in
                          </Text>
                        </View>
                      )}

                      {/* Co-hosts */}
                      {event.coHostedClubs && event.coHostedClubs.length > 0 && (
                        <View className="flex-row items-start">
                          <Ionicons name="people-circle" size={16} color="#0D9488" style={{ marginTop: 2 }} />
                          <View className="ml-2 flex-1">
                            <Text className="text-xs text-gray-500 mb-1">Co-hosts:</Text>
                            <View className="flex-row flex-wrap gap-1">
                              {event.coHostedClubs.map((coHost) => (
                                <View key={coHost.id} className="bg-blue-100 px-2 py-1 rounded">
                                  <Text className="text-xs text-blue-700">{coHost.name}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                        onPress={() => router.push(`/club-leader/events/${event.id}` as any)}
                      >
                        <View className="flex-row items-center">
                          <Ionicons name="eye" size={16} color="#374151" />
                          <Text className="text-gray-700 font-medium ml-1">View Details</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                      {/* Stats Button - chuyển qua trang stats */}
                      <View className="flex-row gap-2 mt-2">
                        <TouchableOpacity
                          className="flex-1 bg-teal-100 rounded-lg py-2 items-center"
                          onPress={() => router.push(`/club-leader/events/${event.id}/stats` as any)}
                        >
                          <View className="flex-row items-center">
                            <Ionicons name="stats-chart" size={16} color="#0D9488" />
                            <Text className="text-teal-700 font-semibold ml-1">Stats</Text>
                          </View>
                        </TouchableOpacity>
                      </View>


                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}


        {/* Calendar Modal */}
        <CalendarModal
          visible={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          events={events}
          onEventClick={(event) => {
            setShowCalendarModal(false);
            router.push(`/club-leader/events/${event.id}` as any);
          }}
        />
      </View>
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
