import ApproveBudgetModal from '@components/ApproveBudgetModal';
import AttendeeListModal from '@components/AttendeeListModal';
import EventWalletHistoryModal from '@components/EventWalletHistoryModal';
import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import RegistrationListModal from '@components/RegistrationListModal';
import { Ionicons } from '@expo/vector-icons';
import {
  Event,
  EventSummary,
  completeEvent,
  getEventById,
  getEventSettle,
  getEventSummary,
  rejectEvent
} from '@services/event.service';
import FeedbackService, { Feedback } from '@services/feedback.service';
import { useAuthStore } from '@stores/auth.store';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UniStaffEventDetailPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Summary state
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Settlement state
  const [settling, setSettling] = useState(false);
  const [isEventSettled, setIsEventSettled] = useState(false);
  const [checkingSettled, setCheckingSettled] = useState(false);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showWalletHistoryModal, setShowWalletHistoryModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Feedback states
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  // Attendee and Registration List modal states
  const [showAttendeeListModal, setShowAttendeeListModal] = useState(false);
  const [showRegistrationListModal, setShowRegistrationListModal] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const data = await getEventById(eventId);
      setEvent(data);

      // Fetch event summary if APPROVED, ONGOING or COMPLETED
      if (
        data.status === 'APPROVED' ||
        data.status === 'ONGOING' ||
        data.status === 'COMPLETED'
      ) {
        try {
          setSummaryLoading(true);
          const summaryData = await getEventSummary(eventId);
          setEventSummary(summaryData);
        } catch (summaryError) {
          console.error('Failed to load event summary:', summaryError);
        } finally {
          setSummaryLoading(false);
        }
      }

      // Check if event is settled (if COMPLETED status)
      if (data.status === 'COMPLETED') {
        try {
          setCheckingSettled(true);
          const settledEvents = await getEventSettle();
          const isSettled = settledEvents.some((e: any) => e.id === Number(eventId));
          setIsEventSettled(isSettled);
        } catch (settledError) {
          console.error('Failed to check settled events:', settledError);
        } finally {
          setCheckingSettled(false);
        }
      }

      // Fetch feedback for all statuses
      try {
        setFeedbackLoading(true);
        const feedbackData = await FeedbackService.getFeedbackByEventId(eventId);
        setFeedbacks(feedbackData);
      } catch (feedbackError) {
        console.error('Failed to load feedback:', feedbackError);
      } finally {
        setFeedbackLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEventData();
    setRefreshing(false);
  };

  const handleReject = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!event || !rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await rejectEvent(event.id, rejectReason);
      setEvent({ ...event, status: 'REJECTED' });
      Alert.alert('Success', `Event ${event.name} has been rejected`);
      setShowRejectModal(false);
    } catch (err: any) {
      console.error('Reject failed', err);
      Alert.alert(
        'Error',
        err?.response?.data?.message || err?.message || 'Failed to reject event'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSettle = async () => {
    if (!event) return;
    setSettling(true);
    try {
      const response = await completeEvent(event.id);
      Alert.alert(
        'Event Completed',
        response.message || `Event ${event.name} has been completed successfully`
      );
      setIsEventSettled(true);
      const updatedData = await getEventById(eventId);
      setEvent(updatedData);
    } catch (err: any) {
      console.error('Complete event failed', err);
      Alert.alert(
        'Error',
        err?.response?.data?.message || err?.message || 'Failed to complete event'
      );
    } finally {
      setSettling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-700';
    let icon: keyof typeof Ionicons.glyphMap = 'help-circle';

    switch (status) {
      case 'COMPLETED':
        bgColor = 'bg-blue-900';
        textColor = 'text-white';
        icon = 'checkmark-circle';
        break;
      case 'ONGOING':
        bgColor = 'bg-purple-600';
        textColor = 'text-white';
        icon = 'time';
        break;
      case 'APPROVED':
        bgColor = 'bg-green-100';
        textColor = 'text-green-700';
        icon = 'checkmark-circle';
        break;
      case 'PENDING_COCLUB':
        bgColor = 'bg-orange-100';
        textColor = 'text-orange-700';
        icon = 'time';
        break;
      case 'PENDING_UNISTAFF':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-700';
        icon = 'time';
        break;
      case 'REJECTED':
        bgColor = 'bg-red-100';
        textColor = 'text-red-700';
        icon = 'close-circle';
        break;
    }

    return (
      <View className={`${bgColor} px-3 py-1.5 rounded-full flex-row items-center gap-1`}>
        <Ionicons name={icon} size={14} color={textColor.includes('white') ? '#fff' : undefined} />
        <Text className={`${textColor} text-xs font-semibold`}>{status}</Text>
      </View>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#FBBF24' : '#D1D5DB'}
          />
        ))}
      </View>
    );
  };

  // Filtered feedbacks
  const filteredFeedbacks =
    ratingFilter === 'all'
      ? feedbacks
      : feedbacks.filter((fb) => fb.rating === parseInt(ratingFilter));

  // Average rating
  const averageRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
      : '0.0';

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-gray-600 mt-4">Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4">Event Not Found</Text>
          <Text className="text-gray-600 text-center mt-2">
            The requested event could not be found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-emerald-600 px-6 py-3 rounded-xl mt-6 flex-row items-center"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const effectiveStatus = (event.status ?? event.type ?? '').toString().toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="px-6 py-4 bg-white shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-2"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
          <Text className="text-gray-700 ml-2">Back to Event Requests</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800" numberOfLines={2}>
          {event.name}
        </Text>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-sm text-gray-500">Event Details</Text>
          {getStatusBadge(effectiveStatus)}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Information Card */}
        <View className="bg-white rounded-2xl p-4 shadow-lg mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="calendar" size={20} color="#10B981" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">Event Information</Text>
          </View>

          <View className="space-y-3">
            <View>
              <Text className="text-xs font-medium text-gray-500 mb-1">Event Name</Text>
              <Text className="text-base font-semibold text-gray-800">{event.name}</Text>
            </View>

            <View>
              <Text className="text-xs font-medium text-gray-500 mb-1">Description</Text>
              <Text className="text-sm text-gray-700">{event.description}</Text>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs font-medium text-gray-500 mb-1">Date</Text>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-700 ml-1">
                    {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-gray-500 mb-1">Time</Text>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-700 ml-1">
                    {event.startTime && event.endTime
                      ? `${event.startTime} - ${event.endTime}`
                      : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text className="text-xs font-medium text-gray-500 mb-1">Venue</Text>
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text className="text-sm text-gray-700 ml-1">{event.locationName || 'N/A'}</Text>
              </View>
            </View>

            {/* Points Information */}
            <View className="gap-2 mt-2">
              {event.commitPointCost !== undefined && (
                <View className="flex-1 bg-gray-50 rounded-xl p-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Ionicons name="ticket" size={14} color="#6B7280" />
                    <Text className="text-xs font-medium text-gray-600">Commit Point Cost</Text>
                  </View>
                  <Text className="text-xl font-bold text-gray-800">{event.commitPointCost} points</Text>
                </View>
              )}
              
              {/* Receive Point */}
              <View className="flex-1 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="gift" size={14} color="#059669" />
                  <Text className="text-xs font-medium text-emerald-700">Receive Point</Text>
                </View>
                <Text className="text-xl font-bold text-emerald-700">
                  {(() => {
                    const budgetPoints = event.budgetPoints ?? 0
                    const maxCheckInCount = event.maxCheckInCount ?? 1
                    return maxCheckInCount > 0 ? Math.floor(budgetPoints / maxCheckInCount) : 0
                  })()} points
                </Text>
                <Text className="text-xs text-emerald-600 mt-1">Per full attendance</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Check-in Capacity - Only show if available */}
        {event.maxCheckInCount !== undefined && event.currentCheckInCount !== undefined && (
          <View className="bg-white rounded-2xl p-4 shadow-lg mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="people" size={20} color="#10B981" />
              <Text className="text-lg font-semibold text-gray-800 ml-2">Capacity & Stats</Text>
            </View>

            <View className="flex-row gap-2 mb-3">
              <View className="flex-1 bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-gray-600 mb-1">Max Capacity</Text>
                <Text className="text-xl font-bold text-gray-800">{event.maxCheckInCount}</Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-gray-600 mb-1">Current Check-ins</Text>
                <Text className="text-xl font-bold text-gray-800">
                  {summaryLoading
                    ? 'Loading...'
                    : eventSummary
                    ? `${eventSummary.registrationsCount}/${event.maxCheckInCount}`
                    : `${event.currentCheckInCount}/${event.maxCheckInCount}`}
                </Text>
              </View>
            </View>

            <View className="bg-green-50 rounded-xl p-3 border border-green-200">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-semibold text-green-700">Budget Points</Text>
                <TouchableOpacity onPress={() => setShowWalletHistoryModal(true)}>
                  <Text className="text-xs text-green-600">View History</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-2xl font-bold text-green-800">{event.budgetPoints || 0}</Text>
            </View>

            {/* Event Summary - Only shown when APPROVED, ONGOING or COMPLETED */}
            {(event.status === 'APPROVED' ||
              event.status === 'ONGOING' ||
              event.status === 'COMPLETED') &&
              eventSummary && (
                <View className="mt-3 gap-2">
                  <View className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs font-medium text-blue-700">
                        {event.type === 'PUBLIC' ? 'Total Check-ins' : 'Total Registrations'}
                      </Text>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => setShowAttendeeListModal(true)}
                          className="bg-blue-600 px-3 py-1 rounded-lg"
                        >
                          <Text className="text-xs font-semibold text-white">Lists</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setShowRegistrationListModal(true)}
                          disabled={event.type === 'PUBLIC'}
                          className={`px-3 py-1 rounded-lg ${
                            event.type === 'PUBLIC' ? 'bg-gray-300' : 'bg-purple-600'
                          }`}
                        >
                          <Text className={`text-xs font-semibold ${
                            event.type === 'PUBLIC' ? 'text-gray-500' : 'text-white'
                          }`}>Register Lists</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text className="text-lg font-bold text-blue-900">
                      {summaryLoading ? 'Loading...' : `${eventSummary.registrationsCount} ${event.type === 'PUBLIC' ? 'checked in' : 'registered'}`}
                    </Text>
                  </View>
                  <View className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <Text className="text-xs font-medium text-amber-700 mb-1">Refunded</Text>
                    <Text className="text-lg font-bold text-amber-900">
                      {summaryLoading ? 'Loading...' : `${eventSummary.refundedCount} refunds`}
                    </Text>
                  </View>
                </View>
              )}
          </View>
        )}

        {/* Host Club & Co-hosts */}
        <View className="bg-white rounded-2xl p-4 shadow-lg mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="business" size={20} color="#10B981" />
            <Text className="text-lg font-semibold text-gray-800 ml-2">Host & Co-hosts</Text>
          </View>

          <View className="mb-3">
            <Text className="text-xs font-medium text-gray-500 mb-2">Host Club</Text>
            <View className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
              <Text className="text-base font-semibold text-emerald-800">
                {event.hostClub?.name || `Club #${event.clubId}`}
              </Text>
            </View>
          </View>

          {event.coHostedClubs && event.coHostedClubs.length > 0 && (
            <View>
              <Text className="text-xs font-medium text-gray-500 mb-2">Co-hosting Clubs</Text>
              {event.coHostedClubs.map((club) => (
                <View
                  key={club.id}
                  className="flex-row items-center justify-between p-3 bg-gray-50 rounded-xl mb-2"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-800">{club.name}</Text>
                    <Text className="text-xs text-gray-500">#{club.id}</Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${
                      club.coHostStatus === 'APPROVED'
                        ? 'bg-green-100'
                        : club.coHostStatus === 'REJECTED'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        club.coHostStatus === 'APPROVED'
                          ? 'text-green-700'
                          : club.coHostStatus === 'REJECTED'
                          ? 'text-red-700'
                          : 'text-yellow-700'
                      }`}
                    >
                      {club.coHostStatus}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Feedback Section */}
        {feedbacks.length > 0 && (
          <View className="bg-white rounded-2xl p-4 shadow-lg mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="star" size={20} color="#FBBF24" />
                <Text className="text-lg font-semibold text-gray-800 ml-2">Event Feedback</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="star" size={18} color="#FBBF24" />
                <Text className="text-xl font-bold text-gray-800 ml-1">{averageRating}</Text>
              </View>
            </View>

            <Text className="text-xs text-gray-600 mb-3">
              {feedbacks.length} {feedbacks.length === 1 ? 'review' : 'reviews'}
            </Text>

            {filteredFeedbacks.slice(0, 3).map((feedback) => (
              <View
                key={feedback.feedbackId}
                className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-200"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      {feedback.memberName || `Member #${feedback.membershipId}`}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {renderStars(feedback.rating)}
                </View>
                <Text className="text-sm text-gray-700">{feedback.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View className="mb-8 gap-3">
          {effectiveStatus === 'COMPLETED' && (
            <TouchableOpacity
              onPress={handleSettle}
              disabled={settling || isEventSettled || checkingSettled}
              className={`py-3 rounded-xl flex-row items-center justify-center ${
                isEventSettled ? 'bg-gray-400' : 'bg-blue-600'
              }`}
            >
              {settling ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="cash" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    {checkingSettled
                      ? 'Checking...'
                      : isEventSettled
                      ? 'Already Settled'
                      : 'Settle Event'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {effectiveStatus !== 'APPROVED' &&
            effectiveStatus !== 'REJECTED' &&
            effectiveStatus !== 'COMPLETED' && (
              <>
                <TouchableOpacity
                  onPress={() => setShowApproveModal(true)}
                  disabled={processing}
                  className="bg-green-600 py-3 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Approve Request</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleReject}
                  disabled={processing}
                  className="bg-red-600 py-3 rounded-xl flex-row items-center justify-center"
                >
                  {processing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="white" />
                      <Text className="text-white font-semibold ml-2">Reject Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
        </View>
      </ScrollView>

      {/* Modals */}
      {event && (
        <>
          <ApproveBudgetModal
            visible={showApproveModal}
            onClose={() => setShowApproveModal(false)}
            eventId={event.id}
            hostClubName={event.hostClub?.name}
            defaultRequestPoints={event.budgetPoints || 0}
            onApproved={(approvedBudgetPoints) => {
              setEvent((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'APPROVED',
                      budgetPoints: approvedBudgetPoints,
                    }
                  : prev
              );
            }}
          />

          <EventWalletHistoryModal
            visible={showWalletHistoryModal}
            onClose={() => setShowWalletHistoryModal(false)}
            eventId={event.id}
          />
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-800 mb-2">Reason for Rejection</Text>
            <Text className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this event.
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Type your reason here..."
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-xl p-3 mb-4 text-gray-800"
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                disabled={processing}
                className="flex-1 bg-gray-200 py-3 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReject}
                disabled={processing || !rejectReason.trim()}
                className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${
                  processing || !rejectReason.trim() ? 'bg-gray-300' : 'bg-red-600'
                }`}
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={16} color="white" />
                    <Text className="text-white font-semibold ml-1">Confirm Reject</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Attendee List Modal */}
      {event && (
        <AttendeeListModal
          visible={showAttendeeListModal}
          onClose={() => setShowAttendeeListModal(false)}
          eventId={event.id}
          eventName={event.name}
        />
      )}

      {/* Registration List Modal */}
      {event && (
        <RegistrationListModal
          visible={showRegistrationListModal}
          onClose={() => setShowRegistrationListModal(false)}
          eventId={event.id}
          eventName={event.name}
        />
      )}

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
