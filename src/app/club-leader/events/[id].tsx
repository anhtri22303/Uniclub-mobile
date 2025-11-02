import PhaseSelectionModal from '@components/PhaseSelectionModal';
import QRModal from '@components/QRModal';
import WalletHistoryModal from '@components/WalletHistoryModal';
import { Ionicons } from '@expo/vector-icons';
import type { Event, EventSummary } from '@services/event.service';
import {
  coHostRespond,
  completeEvent,
  getEventById,
  getEventSummary,
  submitForUniversityApproval,
  timeObjectToString
} from '@services/event.service';
import { useAuthStore } from '@stores/auth.store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const userClubId = user?.clubIds?.[0] || null;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<'START' | 'END' | 'MID'>('START');
  const [showWalletHistoryModal, setShowWalletHistoryModal] = useState(false);
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAcceptingCoHost, setIsAcceptingCoHost] = useState(false);
  const [isRejectingCoHost, setIsRejectingCoHost] = useState(false);
  const [isEndingEvent, setIsEndingEvent] = useState(false);
  const [myCoHostStatus, setMyCoHostStatus] = useState<string | null>(null);

  const loadEventDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getEventById(id);
      setEvent(data);
      
      // Check if current club is a co-host
      if (userClubId && data.coHostedClubs) {
        const myCoHost = data.coHostedClubs.find((club: any) => club.id === userClubId);
        if (myCoHost) {
          setMyCoHostStatus(myCoHost.coHostStatus);
        }
      }

      // Fetch event summary if APPROVED, ONGOING or COMPLETED
      if (data.status === "APPROVED" || data.status === "ONGOING" || data.status === "COMPLETED") {
        try {
          setSummaryLoading(true);
          const summaryData = await getEventSummary(id);
          setEventSummary(summaryData);
        } catch (summaryError) {
          console.error("Failed to load event summary:", summaryError);
        } finally {
          setSummaryLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to load event detail:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to load event details',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEventDetail();
    setRefreshing(false);
  };

  useEffect(() => {
    loadEventDetail();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'COMPLETED':
        return {
          bg: 'bg-blue-900',
          text: 'text-white',
          icon: 'checkmark-done-circle' as const,
          label: 'Completed',
        };
      case 'APPROVED':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: 'checkmark-circle' as const,
          label: 'Approved',
        };
      case 'ONGOING':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: 'play-circle' as const,
          label: 'Ongoing',
        };
      case 'WAITING':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: 'time' as const,
          label: 'Waiting Co-host',
        };
      case 'PENDING_COCLUB':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          icon: 'time' as const,
          label: 'Pending Co-host',
        };
      case 'PENDING_UNISTAFF':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: 'time' as const,
          label: 'Pending University',
        };
      case 'REJECTED':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: 'close-circle' as const,
          label: 'Rejected',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: 'ban' as const,
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: 'information-circle' as const,
          label: status,
        };
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'PUBLIC'
      ? { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Public' }
      : { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Private' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if the event is currently active
  const isEventActive = () => {
    if (!event) return false;

    // COMPLETED status means event has ended
    if (event.status === 'COMPLETED') return false;

    // Must be ONGOING
    if (event.status !== 'ONGOING') return false;

    // Check if date and endTime are present
    if (!event.date || !event.endTime) return false;

    try {
      const now = new Date();
      const eventDate = new Date(event.date);
      const endTimeStr = timeObjectToString(event.endTime);
      const [hours, minutes] = endTimeStr.split(':').map(Number);
      const eventEndDateTime = new Date(eventDate);
      eventEndDateTime.setHours(hours, minutes, 0, 0);

      return now <= eventEndDateTime;
    } catch (error) {
      console.error('Error checking event active status:', error);
      return false;
    }
  };

  const handleGenerateQR = () => {
    if (!event) return;
    setShowPhaseModal(true);
  };

  const handlePhaseSelected = (phase: 'START' | 'END' | 'MID') => {
    setSelectedPhase(phase);
    setShowQrModal(true);
  };

  const handleSubmitToUniversity = async () => {
    if (!event) return;

    Alert.alert(
      'Submit to University',
      'Are you sure you want to submit this event to the university for approval?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await submitForUniversityApproval(event.id);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Event submitted to university for approval',
              });
              // Update local state
              setEvent(prev => prev ? { ...prev, status: "PENDING_UNISTAFF" } : null);
              await loadEventDetail();
            } catch (error: any) {
              console.error("Failed to submit to university:", error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.response?.data?.message || 'Submission failed',
              });
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleAcceptCoHost = async () => {
    if (!event) return;

    Alert.alert(
      'Accept Co-host Invitation',
      'Are you sure you want to accept the co-host invitation for this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setIsAcceptingCoHost(true);
              await coHostRespond(event.id, true);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Co-host invitation accepted',
              });
              await loadEventDetail();
            } catch (err: any) {
              console.error('Failed to accept co-host invitation', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err?.response?.data?.message || 'Failed to accept',
              });
            } finally {
              setIsAcceptingCoHost(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectCoHost = async () => {
    if (!event) return;

    Alert.alert(
      'Reject Co-host Invitation',
      'Are you sure you want to reject the co-host invitation for this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsRejectingCoHost(true);
              await coHostRespond(event.id, false);
              Toast.show({
                type: 'info',
                text1: 'Rejected',
                text2: 'Co-host invitation rejected',
              });
              await loadEventDetail();
            } catch (err: any) {
              console.error('Failed to reject co-host invitation', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err?.response?.data?.message || 'Failed to reject',
              });
            } finally {
              setIsRejectingCoHost(false);
            }
          },
        },
      ]
    );
  };

  const handleEndEvent = async () => {
    if (!event) return;

    Alert.alert(
      'End Event',
      'Are you sure you want to end this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsEndingEvent(true);
              await completeEvent(event.id);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Event has been ended',
              });
              await loadEventDetail();
            } catch (err: any) {
              console.error('Failed to complete event', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err?.response?.data?.message || 'Failed to end event',
              });
            } finally {
              setIsEndingEvent(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-teal-600 pt-12 pb-6 px-6">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Event Details</Text>
          </View>
        </View>

        {/* Loading */}
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-500 mt-4">Loading...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-teal-600 pt-12 pb-6 px-6">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Event Details</Text>
          </View>
        </View>

        {/* Not Found */}
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-900 text-lg font-semibold mt-4">
            Event Not Found
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            The event you're looking for does not exist
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-teal-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusBadge = getStatusBadge(event.status);
  const typeBadge = getTypeBadge(event.type);

  // Calculate co-host status
  const coHosts = event.coHostedClubs || [];
  const pendingCoHosts = coHosts.filter(club => club.coHostStatus === "PENDING").length;
  const allCoHostsResponded = coHosts.length > 0 && pendingCoHosts === 0;
  const anyCoHostRejected = coHosts.some(club => club.coHostStatus === "REJECTED");

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-teal-600 pt-12 pb-6 px-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold flex-1" numberOfLines={1}>
              Event Details
            </Text>
          </View>
          {/* Action buttons */}
          <View className="flex-row gap-2">
            {myCoHostStatus === 'PENDING' && (
              <>
                <TouchableOpacity
                  onPress={handleAcceptCoHost}
                  disabled={isAcceptingCoHost || isRejectingCoHost}
                  className="bg-green-600 px-3 py-2 rounded-lg"
                >
                  {isAcceptingCoHost ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRejectCoHost}
                  disabled={isAcceptingCoHost || isRejectingCoHost}
                  className="bg-red-600 px-3 py-2 rounded-lg"
                >
                  {isRejectingCoHost ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="close" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </>
            )}
            {event.status === 'APPROVED' && (
              <TouchableOpacity
                onPress={handleEndEvent}
                disabled={isEndingEvent}
                className="bg-red-600 px-3 py-2 rounded-lg"
              >
                {isEndingEvent ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="stop-circle" size={20} color="white" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />
        }
      >
        {/* Event Header Card */}
        <View className="bg-white m-4 rounded-xl shadow-sm">
          <View className="p-6">
            {/* Event Name & ID */}
            <View className="flex-row justify-between items-start mb-4">
              <Text className="text-2xl font-bold text-gray-900 flex-1 mr-4">
                {event.name}
              </Text>
              <View className="bg-gray-100 px-3 py-1 rounded-lg">
                <Text className="text-gray-600 text-xs font-mono">#{event.id}</Text>
              </View>
            </View>

            {/* Badges */}
            <View className="flex-row gap-2 mb-4 flex-wrap">
              <View className={`flex-row items-center px-3 py-1.5 rounded-full ${statusBadge.bg}`}>
                <Ionicons name={statusBadge.icon} size={14} color={statusBadge.text.includes('white') ? '#FFFFFF' : undefined} />
                <Text className={`ml-1 text-xs font-semibold ${statusBadge.text}`}>
                  {statusBadge.label}
                </Text>
              </View>
              <View className={`px-3 py-1.5 rounded-full ${typeBadge.bg}`}>
                <Text className={`text-xs font-semibold ${typeBadge.text}`}>
                  {typeBadge.label}
                </Text>
              </View>
            </View>

            {/* Description */}
            {event.description && (
              <View className="mb-4">
                <Text className="text-gray-600 leading-6">{event.description}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 mx-6" />

          {/* Date & Time */}
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Date & Time</Text>
            
            <View className="bg-gray-50 p-4 rounded-lg flex-row items-center mb-3">
              <View className="bg-teal-100 p-3 rounded-lg mr-4">
                <Ionicons name="calendar" size={20} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">{formatDate(event.date)}</Text>
                <Text className="text-gray-500 text-sm">{event.date}</Text>
              </View>
            </View>

            <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
              <View className="bg-teal-100 p-3 rounded-lg mr-4">
                <Ionicons name="time" size={20} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">
                  {event.startTime && event.endTime
                    ? `${timeObjectToString(event.startTime)} - ${timeObjectToString(event.endTime)}`
                    : 'Time not set'}
                </Text>
                <Text className="text-gray-500 text-sm">Event Duration</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 mx-6" />

          {/* Location & Organization */}
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Location & Organization
            </Text>

            <View className="bg-gray-50 p-4 rounded-lg flex-row items-center mb-3">
              <View className="bg-teal-100 p-3 rounded-lg mr-4">
                <Ionicons name="location" size={20} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">{event.locationName}</Text>
                <Text className="text-gray-500 text-sm">Event Location</Text>
              </View>
            </View>

            <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
              <View className="bg-teal-100 p-3 rounded-lg mr-4">
                <Ionicons name="people" size={20} color="#0D9488" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">{event.hostClub.name}</Text>
                <Text className="text-gray-500 text-sm">Host Club</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Check-in Information Card */}
        <View className="bg-white m-4 rounded-xl shadow-sm">
          <View className="p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Check-in Information
              </Text>
            </View>

            {/* Capacity Stats */}
            <View className="flex-row mb-4 gap-2">
              <View className="flex-1 bg-blue-50 p-4 rounded-lg">
                <Text className="text-blue-600 text-xs font-medium mb-1">Max Capacity</Text>
                <Text className="text-blue-900 text-xl font-bold">
                  {event.maxCheckInCount}
                </Text>
              </View>
              <View className="flex-1 bg-green-50 p-4 rounded-lg">
                <Text className="text-green-600 text-xs font-medium mb-1">Checked In</Text>
                <Text className="text-green-900 text-xl font-bold">
                  {summaryLoading ? '...' : eventSummary ? eventSummary.registrationsCount : event.currentCheckInCount}
                </Text>
              </View>
              <View className="flex-1 bg-orange-50 p-4 rounded-lg">
                <Text className="text-orange-600 text-xs font-medium mb-1">Remaining</Text>
                <Text className="text-orange-900 text-xl font-bold">
                  {summaryLoading ? '...' : eventSummary 
                    ? event.maxCheckInCount - eventSummary.registrationsCount 
                    : event.maxCheckInCount - event.currentCheckInCount}
                </Text>
              </View>
            </View>

            {/* Budget Points with History Button */}
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-green-700 text-xs font-medium">Budget Points</Text>
                <TouchableOpacity
                  onPress={() => setShowWalletHistoryModal(true)}
                  className="bg-teal-600 px-3 py-1.5 rounded-lg flex-row items-center"
                >
                  <Ionicons name="time-outline" size={14} color="white" />
                  <Text className="text-white text-xs font-semibold ml-1">History</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-green-900 text-xl font-bold">
                {event.budgetPoints || 0} points
              </Text>
            </View>

            {/* Event Summary */}
            {(event.status === 'APPROVED' || event.status === 'ONGOING' || event.status === 'COMPLETED') && eventSummary && (
              <View className="flex-row gap-2 mb-4">
                <View className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Text className="text-blue-700 text-xs font-medium mb-1">Total Registrations</Text>
                  <Text className="text-blue-900 text-xl font-bold">
                    {summaryLoading ? '...' : eventSummary.registrationsCount}
                  </Text>
                </View>
                <View className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <Text className="text-amber-700 text-xs font-medium mb-1">Refunded</Text>
                  <Text className="text-amber-900 text-xl font-bold">
                    {summaryLoading ? '...' : eventSummary.refundedCount}
                  </Text>
                </View>
              </View>
            )}

            {/* QR Code Generation */}
            {isEventActive() && (
              <TouchableOpacity
                onPress={handleGenerateQR}
                className="bg-teal-600 p-4 rounded-lg flex-row items-center justify-center"
              >
                <Ionicons name="qr-code" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Generate QR Code
                </Text>
              </TouchableOpacity>
            )}

            {/* Status message for non-active events */}
            {!isEventActive() && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex-row">
                <Ionicons name="alert-circle" size={20} color="#D97706" />
                <View className="ml-3 flex-1">
                  <Text className="text-yellow-800 font-medium text-sm">
                    QR Code Unavailable
                  </Text>
                  <Text className="text-yellow-700 text-xs mt-1">
                    {event.status !== 'ONGOING'
                      ? `QR codes are only available for ongoing events. Current status: ${statusBadge.label}`
                      : 'This event has ended or is missing date/time information.'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Co-hosted Clubs */}
        {event.coHostedClubs && event.coHostedClubs.length > 0 && (
          <View className="bg-white m-4 rounded-xl shadow-sm">
            <View className="p-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Co-host Clubs
              </Text>
              {event.coHostedClubs.map((club) => (
                <View
                  key={club.id}
                  className="bg-gray-50 p-4 rounded-lg flex-row items-center justify-between mb-2"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-teal-100 p-2 rounded-lg mr-3">
                      <Ionicons name="people" size={18} color="#0D9488" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium">{club.name}</Text>
                      <Text className="text-gray-500 text-xs">Club ID: {club.id}</Text>
                    </View>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      club.coHostStatus === 'APPROVED'
                        ? 'bg-green-100'
                        : club.coHostStatus === 'REJECTED'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        club.coHostStatus === 'APPROVED'
                          ? 'text-green-800'
                          : club.coHostStatus === 'REJECTED'
                          ? 'text-red-800'
                          : 'text-yellow-800'
                      }`}
                    >
                      {club.coHostStatus === 'APPROVED' ? 'Approved' : 
                       club.coHostStatus === 'REJECTED' ? 'Rejected' : 
                       club.coHostStatus === 'PENDING' ? 'Pending' : club.coHostStatus}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Co-host Approval Section - Show if user's club has PENDING status */}
        {myCoHostStatus === 'PENDING' && (
          <View className="bg-white m-4 rounded-xl shadow-sm">
            <View className="p-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Co-host Invitation
              </Text>
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <View className="flex-row">
                  <Ionicons name="information-circle" size={20} color="#2563EB" />
                  <View className="ml-3 flex-1">
                    <Text className="text-blue-800 font-medium text-sm">
                      You have been invited to co-host this event
                    </Text>
                    <Text className="text-blue-700 text-xs mt-1">
                      Please review the event details and decide whether to accept or reject this co-host invitation.
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleAcceptCoHost}
                  disabled={isAcceptingCoHost || isRejectingCoHost}
                  className="flex-1 bg-green-600 rounded-lg py-3 items-center"
                  style={{ opacity: (isAcceptingCoHost || isRejectingCoHost) ? 0.5 : 1 }}
                >
                  <View className="flex-row items-center">
                    {isAcceptingCoHost ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text className="text-white font-semibold ml-2">Accepting...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Accept Invitation</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRejectCoHost}
                  disabled={isAcceptingCoHost || isRejectingCoHost}
                  className="flex-1 bg-red-600 rounded-lg py-3 items-center"
                  style={{ opacity: (isAcceptingCoHost || isRejectingCoHost) ? 0.5 : 1 }}
                >
                  <View className="flex-row items-center">
                    {isRejectingCoHost ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text className="text-white font-semibold ml-2">Rejecting...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Reject Invitation</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* University Approval Section */}
        {event.status === 'WAITING' && (
          <View className="bg-white m-4 rounded-xl shadow-sm">
            <View className="p-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                University Approval Status
              </Text>

              {!allCoHostsResponded && (
                <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex-row mb-4">
                  <Ionicons name="alert-circle" size={20} color="#D97706" />
                  <View className="ml-3 flex-1">
                    <Text className="text-yellow-800 font-medium text-sm">
                      Waiting for Co-host Response
                    </Text>
                    <Text className="text-yellow-700 text-xs mt-1">
                      Waiting for {pendingCoHosts} co-host(s) to respond before submitting to university
                    </Text>
                  </View>
                </View>
              )}

              {allCoHostsResponded && anyCoHostRejected && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-3 flex-row">
                  <Ionicons name="close-circle" size={20} color="#DC2626" />
                  <View className="ml-3 flex-1">
                    <Text className="text-red-800 font-medium text-sm">
                      Co-host Rejected
                    </Text>
                    <Text className="text-red-700 text-xs mt-1">
                      At least one co-host has rejected this event. Cannot submit to university.
                    </Text>
                  </View>
                </View>
              )}

              {allCoHostsResponded && !anyCoHostRejected && (
                <View className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-green-800 font-medium text-sm">
                        Ready to Submit
                      </Text>
                      <Text className="text-green-700 text-xs mt-1">
                        All co-hosts have approved. You can now submit to university for approval.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleSubmitToUniversity}
                    disabled={isSubmitting}
                    className="bg-teal-600 p-3 rounded-lg flex-row items-center justify-center mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text className="text-white font-semibold ml-2">Submitting...</Text>
                      </>
                    ) : (
                      <Text className="text-white font-semibold">Submit to University</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Phase Selection Modal */}
      {event && (
        <PhaseSelectionModal
          visible={showPhaseModal}
          onClose={() => setShowPhaseModal(false)}
          onSelectPhase={handlePhaseSelected}
          eventName={event.name}
        />
      )}

      {/* QR Modal */}
      {event && (
        <QRModal
          open={showQrModal}
          onOpenChange={setShowQrModal}
          eventName={event.name}
          eventId={event.id}
          phase={selectedPhase}
        />
      )}

      {/* Wallet History Modal */}
      {event && (
        <WalletHistoryModal
          visible={showWalletHistoryModal}
          onClose={() => setShowWalletHistoryModal(false)}
          eventId={event.id}
          budgetPoints={event.budgetPoints || 0}
        />
      )}
    </View>
  );
}
