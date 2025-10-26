import EventCreateModal, { EventFormData } from '@components/EventCreateModal';
import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import QRModal from '@components/QRModal';
import { Ionicons } from '@expo/vector-icons';
import { useClub, useClubs, useCreateEvent, useEventsByClub, useLocations } from '@hooks/useQueryHooks';
import { generateCode } from '@services/checkin.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ClubLeaderEvent = {
  id: number;
  name: string;
  description: string;
  type: string;
  date: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  status: string;
  locationId?: number;
  locationName?: string;
  checkInCode?: string;
  points?: number;
  hostClub?: {
    id: number;
    name: string;
  };
  coHostClubs?: Array<{
    id: number;
    name: string;
  }>;
  clubId?: number;
  clubName?: string;
  maxCheckInCount?: number;
  currentCheckInCount?: number;
};

// Helper function to check if event has expired (past endTime)
function isEventExpired(event: ClubLeaderEvent): boolean {
  if (!event.date || !event.endTime) return false;

  try {
    // Get current date/time in Vietnam timezone (UTC+7)
    const now = new Date();
    const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    // Parse event date (format: YYYY-MM-DD)
    const [year, month, day] = event.date.split('-').map(Number);
    
    // Parse endTime (format: HH:MM:SS or HH:MM)
    const [hours, minutes] = event.endTime.split(':').map(Number);

    // Create event end datetime in Vietnam timezone
    const eventEndDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // Event is expired if current VN time is past the end time
    return vnTime > eventEndDateTime;
  } catch (error) {
    console.error('Error checking event expiration:', error);
    return false;
  }
}

// Helper function to check if event is active (APPROVED and within date/time range)
function isEventActive(event: ClubLeaderEvent): boolean {
  // Must be APPROVED
  if (event.status !== "APPROVED") return false;

  // Must not be expired
  if (isEventExpired(event)) return false;

  // Check if date and endTime are present
  if (!event.date || !event.endTime) return false;

  return true;
}

// Helper function to get event status based on date and time
function getEventStatus(eventDate: string, eventTime: string): string {
  if (!eventDate) return 'Finished';
  
  // Get current time in Vietnam timezone (UTC+7)
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  
  // Parse event date and time
  const [hour = '00', minute = '00'] = (eventTime || '00:00').split(':');
  const [year, month, day] = eventDate.split('-').map(Number);
  const event = new Date(year, month - 1, day, Number(hour), Number(minute), 0, 0);

  // Event duration: assume 2 hours for "Now" window
  const EVENT_DURATION_MS = 2 * 60 * 60 * 1000;
  const start = event.getTime();
  const end = start + EVENT_DURATION_MS;

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
  
  // Fetch data using React Query hooks
  const { data: managedClub, isLoading: clubLoading } = useClub(clubId || 0, !!clubId);
  const { data: rawEvents = [], isLoading: eventsLoading, refetch: refetchEvents } = useEventsByClub(clubId || 0, !!clubId);
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const { data: allClubs = [], isLoading: clubsLoading } = useClubs();
  const createEventMutation = useCreateEvent();
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubLeaderEvent | null>(null);
  const [showExpiredEvents, setShowExpiredEvents] = useState<boolean>(false);

  // Process and sort events - matching web version normalization
  const events = useMemo(() => {
    // Normalize events with both new and legacy field support
    const normalized = rawEvents.map((e: any) => ({
      ...e,
      title: e.name || e.title, // Map name to title for consistency
      time: e.startTime || e.time, // Map startTime to time for legacy compatibility
      clubId: e.hostClub?.id || e.clubId, // Map hostClub.id to clubId for backward compatibility
      clubName: e.hostClub?.name || e.clubName, // Map hostClub.name to clubName for backward compatibility
    }));
    return sortEventsByDateTime(normalized);
  }, [rawEvents]);

  // Filter events by search term and expiration status
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search term filter
      const matchesSearch = String(event.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Expiration filter
      const expired = isEventExpired(event);
      const matchesExpirationFilter = showExpiredEvents || !expired;
      
      return matchesSearch && matchesExpirationFilter;
    });
  }, [events, searchTerm, showExpiredEvents]);

  // Create event handler
  const handleCreateEvent = async (formData: EventFormData) => {
    try {
      await createEventMutation.mutateAsync(formData);
      Alert.alert('Success', 'Event created successfully');
      refetchEvents();
    } catch (error: any) {
      throw error;
    }
  };

  // QR modal logic using new API - matching web version
  const handleShowQrModal = async (event: ClubLeaderEvent) => {
    setSelectedEvent(event);
    try {
      // Generate fresh token and qrUrl using the new API
      console.log('Generating check-in token for event:', event.id);
      const { token, qrUrl } = await generateCode(event.id);
      console.log('Generated token:', token);
      console.log('Generated qrUrl:', qrUrl);
      
      setShowQrModal(true);
      
      // Show success alert
      Alert.alert(
        'QR Code Generated',
        'Check-in QR code has been generated successfully',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Failed to generate QR', err);
      Alert.alert('QR Error', err?.message || 'Could not generate QR code');
    }
  };

  const loading = eventsLoading || clubLoading;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Sidebar role={user?.role} />
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-800">Events</Text>
          {clubLoading ? (
            <View className="h-5 w-48 bg-gray-200 rounded mt-1" />
          ) : (
            <Text className="text-gray-500 mt-1">
              Event management for "{managedClub?.name || 'Club'}"
            </Text>
          )}
        </View>

        {/* Search and Create Button */}
        <View className="px-4 pb-2 flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200 text-gray-800"
            placeholder="Search events..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity
            className="bg-teal-600 rounded-lg px-4 py-2"
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filter Toggle */}
        <View className="px-4 pb-3">
          <TouchableOpacity
            className={`flex-row items-center justify-center px-4 py-2 rounded-lg border ${
              showExpiredEvents
                ? 'bg-gray-100 border-gray-300'
                : 'bg-teal-50 border-teal-300'
            }`}
            onPress={() => setShowExpiredEvents(!showExpiredEvents)}
          >
            <Ionicons
              name={showExpiredEvents ? 'eye-off' : 'eye'}
              size={18}
              color={showExpiredEvents ? '#6B7280' : '#0D9488'}
            />
            <Text
              className={`ml-2 font-medium ${
                showExpiredEvents ? 'text-gray-600' : 'text-teal-700'
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
              <Text className="mt-2 text-sm text-gray-400">Try a different search term</Text>
            ) : (
              <TouchableOpacity
                className="mt-4 bg-teal-600 rounded-lg px-6 py-2"
                onPress={() => setShowCreateModal(true)}
              >
                <Text className="text-white font-semibold">Create Event</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 80 }}>
            {filteredEvents.map((event) => {
              const expired = isEventExpired(event);
              const status = expired ? 'Finished' : getEventStatus(event.date, event.time ?? '');
              
              // Border color logic - expired events override approval status
              let borderColor = '#e5e7eb';
              if (expired) {
                borderColor = '#9CA3AF'; // gray-400
              } else if (event.status === 'APPROVED') {
                borderColor = '#10B981'; // green-500
              } else if (event.status === 'REJECTED') {
                borderColor = '#EF4444'; // red-500
              } else if (event.status === 'PENDING') {
                borderColor = '#F59E0B'; // amber-500
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
                            {status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Approval Status Badge */}
                    <View className="mb-3">
                      {expired ? (
                        <View className="bg-gray-400 px-2 py-1 rounded-full self-start">
                          <Text className="text-xs font-semibold text-white">Expired</Text>
                        </View>
                      ) : (
                        <>
                          {event.status === 'APPROVED' && (
                            <View className="bg-green-500 px-2 py-1 rounded-full self-start">
                              <Text className="text-xs font-semibold text-white">Approved</Text>
                            </View>
                          )}
                          {event.status === 'PENDING' && (
                            <View className="bg-amber-500 px-2 py-1 rounded-full self-start">
                              <Text className="text-xs font-semibold text-white">Pending</Text>
                            </View>
                          )}
                          {event.status === 'REJECTED' && (
                            <View className="bg-red-500 px-2 py-1 rounded-full self-start">
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
                          <Text className="text-sm text-gray-600 ml-2">{event.points} loyalty points</Text>
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
                      {event.coHostClubs && event.coHostClubs.length > 0 && (
                        <View className="flex-row items-start">
                          <Ionicons name="people-circle" size={16} color="#0D9488" style={{ marginTop: 2 }} />
                          <View className="ml-2 flex-1">
                            <Text className="text-xs text-gray-500 mb-1">Co-hosts:</Text>
                            <View className="flex-row flex-wrap gap-1">
                              {event.coHostClubs.map((coHost) => (
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
                          <Text className="text-gray-700 font-medium ml-1">View Detail</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* QR Code Button - Only show if APPROVED and event is still active */}
                    {isEventActive(event) && (
                      <TouchableOpacity
                        className="mt-3 w-full flex-row items-center justify-center rounded-2xl py-3 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600"
                        style={{
                          backgroundColor: '#0D9488',
                        }}
                        activeOpacity={0.85}
                        onPress={() => handleShowQrModal(event)}
                      >
                        <Ionicons name="qr-code" size={24} color="#fff" style={{ marginRight: 10 }} />
                        <Text className="font-extrabold text-base tracking-wide text-white">
                          Generate QR Code
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Create Event Modal */}
        <EventCreateModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          clubId={clubId || 0}
          locations={locations}
          clubs={allClubs}
          locationsLoading={locationsLoading}
          clubsLoading={clubsLoading}
        />

        {/* QR Modal */}
        <QRModal
          open={showQrModal}
          onOpenChange={setShowQrModal}
          eventName={selectedEvent?.name || ''}
          eventId={selectedEvent?.id}
        />
      </View>
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
