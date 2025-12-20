import { Ionicons } from '@expo/vector-icons';
import { eventCheckinPublic, formatEventDateRange, getEventByCode, isMultiDayEvent, timeObjectToString } from '@services/event.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  LogBox,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Suppress specific error notifications
LogBox.ignoreLogs([
  'AxiosError',
  'Request failed with status code',
  'Public event check-in error',
  'Couldn\'t find a navigation context',
]);

export default function StudentPublicCheckinPage() {
  const router = useRouter();
  const { checkInCode } = useLocalSearchParams<{ checkInCode: string }>();
  
  console.log('StudentPublicCheckinPage mounted, checkInCode:', checkInCode);
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Handle back navigation
  const handleGoBack = () => {
    try {
      router.back();
    } catch (e) {
      BackHandler.exitApp();
    }
  };

  // Navigate to events page
  const navigateToEvents = () => {
    try {
      router.push('/student/events');
    } catch (e) {
      console.log('Navigation failed:', e);
    }
  };

  // Load event details when component mounts
  useEffect(() => {
    const loadEventDetail = async () => {
      if (!checkInCode) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Check-in Code',
          text2: 'Check-in code is missing from the URL',
        });
        setLoading(false);
        return;
      }

      try {
        const eventData = await getEventByCode(checkInCode as string);
        setEvent(eventData);
      } catch (error: any) {
        console.error('Error loading event:', error);
        Toast.show({
          type: 'error',
          text1: 'Event Not Found',
          text2: error?.response?.data?.message || 'Could not load event details',
        });
      } finally {
        setLoading(false);
      }
    };

    loadEventDetail();
  }, [checkInCode]);

  const handleCheckin = async () => {
    if (!checkInCode || typeof checkInCode !== 'string') {
      Toast.show({
        type: 'error',
        text1: 'Invalid Check-in Code',
        text2: 'Check-in code is missing or invalid',
      });
      return;
    }

    if (isCheckinLoading || isCheckedIn) return;

    setIsCheckinLoading(true);

    try {
      const response = await eventCheckinPublic(checkInCode);


      Toast.show({
        type: 'success',
        text1: 'Check-in Successful! 🎉',
        text2: response?.message || "You've successfully checked in to the event!",
      });

      setIsCheckedIn(true);

      // Redirect after successful check-in
      setTimeout(() => {
        navigateToEvents();
      }, 2000);
    } catch (error: any) {
      // Extract error message from response
      let errorMessage = 'An error occurred during check-in. Please try again.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message && !error.message.includes('status code')) {
        errorMessage = error.message;
      }

      // Check if user already checked in - redirect to profile
      if (errorMessage.toLowerCase().includes('already checked in')) {
        Toast.show({
          type: 'info',
          text1: 'Already Checked In',
          text2: 'Redirecting to your profile...',
          visibilityTime: 2000,
          position: 'top',
        });
        
        setTimeout(() => {
          try {
            router.push('/profile');
          } catch (e) {
            console.log('Navigation to profile failed:', e);
          }
        }, 1500);
        return;
      }

      // Show toast notification only (suppressing console errors)
      Toast.show({
        type: 'error',
        text1: 'Check-in Failed',
        text2: errorMessage,
        visibilityTime: 3000,
        position: 'top',
      });
    } finally {
      setIsCheckinLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeBadge = (type: string) => {
    const typeUpper = type?.toUpperCase();
    switch (typeUpper) {
      case 'PUBLIC':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500', label: 'PUBLIC' };
      case 'PRIVATE':
        return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500', label: 'PRIVATE' };
      case 'SPECIAL':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500', label: 'SPECIAL' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-500', label: type || 'UNKNOWN' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' };
      case 'APPROVED':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' };
      case 'COMPLETED':
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-500' };
    }
  };

  if (loading) {
    console.log('Rendering loading state...');
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={{ marginTop: 16, fontSize: 18, color: '#4B5563' }}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    console.log('Rendering event not found state...');
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>❌</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#DC2626', marginBottom: 8 }}>Event Not Found</Text>
          <Text style={{ color: '#4B5563', textAlign: 'center', marginBottom: 24 }}>
            The event you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            onPress={navigateToEvents}
            style={{ backgroundColor: '#0D9488', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Back to Events</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  console.log('Rendering event details, event:', event.name);

  const typeBadge = getTypeBadge(event.type);
  const statusBadge = getStatusBadge(event.status);
  const isMultiDay = isMultiDayEvent(event);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0FDFA' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          {/* Event Card */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 2, borderColor: '#CCFBF1', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 }}>
            {/* Header Section */}
            <View style={{ backgroundColor: '#0D9488', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
              {/* Type and Status Badges */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ backgroundColor: typeBadge.bg === 'bg-green-100' ? '#DCFCE7' : typeBadge.bg === 'bg-purple-100' ? '#F3E8FF' : typeBadge.bg === 'bg-blue-100' ? '#DBEAFE' : '#F3F4F6', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: typeBadge.border === 'border-green-500' ? '#22C55E' : typeBadge.border === 'border-purple-500' ? '#A855F7' : typeBadge.border === 'border-blue-500' ? '#3B82F6' : '#9CA3AF' }}>
                  <Text style={{ color: typeBadge.text === 'text-green-700' ? '#15803D' : typeBadge.text === 'text-purple-700' ? '#7E22CE' : typeBadge.text === 'text-blue-700' ? '#1D4ED8' : '#374151', fontSize: 12, fontWeight: 'bold' }}>
                    {typeBadge.label}
                  </Text>
                </View>
                {event.status && (
                  <View style={{ backgroundColor: statusBadge.bg === 'bg-green-100' ? '#DCFCE7' : statusBadge.bg === 'bg-blue-100' ? '#DBEAFE' : '#F3F4F6', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: statusBadge.border === 'border-green-500' ? '#22C55E' : statusBadge.border === 'border-blue-500' ? '#3B82F6' : '#9CA3AF' }}>
                    <Text style={{ color: statusBadge.text === 'text-green-700' ? '#15803D' : statusBadge.text === 'text-blue-700' ? '#1D4ED8' : '#374151', fontSize: 12, fontWeight: 'bold' }}>
                      {event.status}
                    </Text>
                  </View>
                )}
              </View>

              {/* Event Title */}
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
                  {event.name}
                </Text>
                {event.description && (
                  <Text style={{ color: '#CCFBF1', fontSize: 14, textAlign: 'center', paddingHorizontal: 16 }}>{event.description}</Text>
                )}
              </View>
            </View>

            {/* Event Details Section */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
              <View style={{ gap: 16 }}>
                {/* Date and Time */}
                <View style={{ backgroundColor: '#F0FDFA', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#99F6E4' }}>
                  {isMultiDay && event.days ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ width: 48, height: 48, backgroundColor: '#0D9488', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="calendar" size={24} color="#FFF" />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={{ color: '#134E4A', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Multi-Day Event</Text>
                          <Text style={{ color: '#115E59', fontWeight: 'bold', fontSize: 16 }}>
                            {formatEventDateRange(event)}
                          </Text>
                          <Text style={{ color: '#0D9488', fontSize: 12, marginTop: 4 }}>
                            {event.days.length} day{event.days.length > 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      {/* Show individual days */}
                      <View style={{ marginTop: 12, gap: 8 }}>
                        {event.days.map((day: any, index: number) => (
                          <View key={index} style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#CCFBF1' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ width: 32, height: 32, backgroundColor: '#0D9488', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>{index + 1}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: '#111827', fontWeight: '600', fontSize: 14 }}>
                                  {formatDate(day.date)}
                                </Text>
                                <Text style={{ color: '#6B7280', fontSize: 12 }}>
                                  {day.startTime} - {day.endTime}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Single-day event display */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ width: 48, height: 48, backgroundColor: '#0D9488', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="calendar" size={24} color="#FFF" />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={{ color: '#134E4A', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Date</Text>
                          <Text style={{ color: '#115E59', fontWeight: 'bold', fontSize: 16 }}>
                            {formatDate(event.date || event.startDate)}
                          </Text>
                          <Text style={{ color: '#0D9488', fontSize: 12 }}>{event.date || event.startDate}</Text>
                        </View>
                      </View>
                      {/* Time */}
                      {(event.startTime || event.endTime) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#CCFBF1' }}>
                          <View style={{ width: 40, height: 40, backgroundColor: '#CCFBF1', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="time" size={20} color="#0D9488" />
                          </View>
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>Time</Text>
                            <Text style={{ color: '#111827', fontWeight: '600', fontSize: 14 }}>
                              {event.startTime && event.endTime
                                ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(event.endTime)}`
                                : 'Time not specified'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* Location */}
                {event.locationName && (
                  <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#BFDBFE' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 48, height: 48, backgroundColor: '#3B82F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="location" size={24} color="#FFF" />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ color: '#1E3A8A', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Location</Text>
                        <Text style={{ color: '#1E40AF', fontWeight: 'bold', fontSize: 16 }}>{event.locationName}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Attendance */}
                <View style={{ backgroundColor: '#FAF5FF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E9D5FF' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, backgroundColor: '#A855F7', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="people" size={24} color="#FFF" />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: '#581C87', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Attendance</Text>
                      <Text style={{ color: '#7E22CE', fontWeight: 'bold', fontSize: 16 }}>
                        {event.currentCheckInCount || 0} / {event.maxCheckInCount || 0} checked in
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Host Club */}
              {event.hostClub && (
                <View style={{ marginTop: 16, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#BFDBFE' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, backgroundColor: '#3B82F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="business" size={24} color="#FFF" />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Hosted by</Text>
                      <Text style={{ color: '#1E3A8A', fontWeight: '800', fontSize: 18 }}>
                        {event.hostClub.name}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Separator */}
              <View style={{ marginVertical: 24, height: 1, backgroundColor: '#E5E7EB' }} />

              {/* Check-in Button */}
              <TouchableOpacity
                onPress={handleCheckin}
                disabled={isCheckinLoading || isCheckedIn}
                activeOpacity={0.8}
                style={{
                  paddingVertical: 24,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCheckedIn ? '#FFFFFF' : isCheckinLoading ? '#D1D5DB' : '#0D9488',
                  borderWidth: isCheckedIn ? 4 : 0,
                  borderColor: isCheckedIn ? '#22C55E' : 'transparent',
                  shadowColor: isCheckedIn ? '#22C55E' : isCheckinLoading ? '#D1D5DB' : '#0D9488',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                {isCheckinLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#666" />
                    <Text style={{ color: '#374151', fontSize: 20, fontWeight: 'bold', marginLeft: 12 }}>Processing...</Text>
                  </>
                ) : isCheckedIn ? (
                  <>
                    <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                    <Text style={{ color: '#16A34A', fontSize: 24, fontWeight: '800', marginLeft: 12 }}>Checked In!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={32} color="#FFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginLeft: 12 }}>Check In Now</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Note with check-in code */}
              <View style={{ marginTop: 24, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ textAlign: 'center', fontSize: 14, color: '#4B5563', marginBottom: 8 }}>
                  This is a public event - no registration required
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
}
