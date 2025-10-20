import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import QRModal from '@components/QRModal';
import { Ionicons } from '@expo/vector-icons';
import { generateCode } from '@services/checkin.service';
import { createEvent, getEventByClubId } from '@services/event.service';
import { useAuthStore } from '@stores/auth.store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ClubLeaderEvent = {
  id: number;
  clubId: number;
  name: string;
  description: string;
  type: string;
  date: string;
  time?: string;
  status: string;
  locationId: number;
  locationName?: string;
  checkInCode?: string;
  points?: number;
};

function getEventStatus(eventDate: string, eventTime: string): string {
  if (!eventDate) return 'Finished';
  const now = new Date();
  const [hour = '00', minute = '00'] = (eventTime || '00:00').split(':');
  const event = new Date(eventDate);
  event.setHours(Number(hour), Number(minute), 0, 0);
  const EVENT_DURATION_MS = 2 * 60 * 60 * 1000;
  const start = event.getTime();
  const end = start + EVENT_DURATION_MS;
  if (now.getTime() < start) {
    if (start - now.getTime() < 7 * 24 * 60 * 60 * 1000) return 'Soon';
    return 'Future';
  }
  if (now.getTime() >= start && now.getTime() <= end) return 'Now';
  return 'Finished';
}

export default function Events() {
  const { user } = useAuthStore();
  const clubId = user?.clubIds?.[0] || null;
  const [events, setEvents] = useState<ClubLeaderEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubLeaderEvent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PUBLIC',
    date: '',
    time: '13:30',
    locationId: '',
  });

  // QR modal states
  const [qrUrl, setQrUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [qrToken, setQrToken] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    if (!clubId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    getEventByClubId(clubId)
      .then((data) => {
        if (!mounted) return;
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [clubId, showCreateModal]);

  // Filter events by search term
  const filteredEvents = events.filter((event: ClubLeaderEvent) => {
    const v = String(event.name || '').toLowerCase();
    return v.includes(searchTerm.toLowerCase());
  });

  // Create event handler
  const handleCreateEvent = async () => {
    if (!formData.name || !formData.date) return;
    try {
      setLoading(true);
      await createEvent({
        clubId,
        ...formData,
        locationId: formData.locationId ? Number(formData.locationId) : undefined,
      });
      setShowCreateModal(false);
      setFormData({ name: '', description: '', type: 'PUBLIC', date: '', time: '13:30', locationId: '' });
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  // QR modal logic using new API
  const handleShowQrModal = async (event: ClubLeaderEvent) => {
    setSelectedEvent(event);
    setQrLoading(true);
    try {
      const { token, qrUrl } = await generateCode(event.id);
      setQrToken(token);
      setQrUrl(qrUrl);
      setShowQrModal(true);
    } catch (err: any) {
      Alert.alert('QR Error', err?.message || 'Could not generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Sidebar role={user?.role} />
      <View className="flex-1">
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-800">Events</Text>
          <Text className="text-gray-500 mt-1">Manage your club's events</Text>
        </View>
        <View className="px-4 pb-2 flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-200 text-gray-800"
            placeholder="Search events..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity
            className="bg-teal-600 rounded-lg px-4 py-2 ml-2"
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0D9488" />
          </View>
        ) : filteredEvents.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="calendar" size={48} color="#94A3B8" />
            <Text className="mt-4 text-lg text-gray-500">No events found</Text>
            <TouchableOpacity
              className="mt-4 bg-teal-600 rounded-lg px-6 py-2"
              onPress={() => setShowCreateModal(true)}
            >
              <Text className="text-white font-semibold">Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-2" contentContainerStyle={{ paddingBottom: 80 }}>
            {filteredEvents.map((event) => {
              const status = getEventStatus(event.date, event.time ?? '');
              let borderColor = '#e5e7eb';
              if (event.status === 'APPROVED') borderColor = '#0D9488';
              else if (event.status === 'REJECTED') borderColor = '#ef4444';
              else if (status === 'Soon') borderColor = '#fde68a';
              else if (status === 'Now') borderColor = '#f87171';
              return (
                <View
                  key={event.id}
                  className="mb-4 bg-white rounded-xl shadow-sm border"
                  style={{ borderColor, borderWidth: 2 }}
                >
                  <View className="p-4">
                    <View className="flex-row justify-between items-center">
                      <View style={{ flex: 1 }}>
                        <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>{event.name}</Text>
                        {event.description ? (
                          <Text className="text-gray-500 mt-1" numberOfLines={2}>{event.description}</Text>
                        ) : null}
                      </View>
                      <View className="ml-2">
                        <Text className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'Finished' ? 'bg-gray-200 text-gray-600' : status === 'Soon' ? 'bg-yellow-100 text-yellow-700' : status === 'Now' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{status}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center mt-2 gap-3">
                      <Ionicons name="calendar" size={16} color="#0D9488" />
                      <Text className="text-sm text-gray-600">{event.date} {event.time}</Text>
                      {event.locationName ? (
                        <View className="flex-row items-center ml-2">
                          <Ionicons name="location" size={16} color="#0D9488" />
                          <Text className="text-sm text-gray-600 ml-1">{event.locationName}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="flex-row gap-2 mt-4">
                      <TouchableOpacity
                        className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                        onPress={() => {/* TODO: navigate to event detail */}}
                      >
                        <Text className="text-gray-700 font-medium">View Detail</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                        onPress={() => {/* TODO: implement edit modal */}}
                      >
                        <Text className="text-gray-700 font-medium">Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      className={`mt-4 w-full flex-row items-center justify-center rounded-2xl py-3 shadow-xl ${event.status === 'APPROVED' ? 'bg-teal-500' : 'bg-gray-100'} ${event.status !== 'APPROVED' ? 'opacity-60 grayscale' : ''}`}
                      activeOpacity={event.status === 'APPROVED' ? 0.85 : 1}
                      onPress={event.status === 'APPROVED' ? () => handleShowQrModal(event) : undefined}
                      disabled={event.status !== 'APPROVED'}
                    >
                      <Ionicons name="qr-code" size={24} color={event.status === 'APPROVED' ? '#fff' : '#d1d5db'} style={{ marginRight: 10 }} />
                      <Text className={`font-extrabold text-base tracking-wide drop-shadow ${event.status === 'APPROVED' ? 'text-white' : 'text-gray-400'}`}>Generate QR Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Create Event Modal */}
        {/* Create Event Modal */}
        {/* You can refactor this to a separate component if needed. */}

        {/* QR Modal component */}
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
