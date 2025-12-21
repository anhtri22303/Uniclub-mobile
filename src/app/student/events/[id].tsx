import { Ionicons } from '@expo/vector-icons';
import { useMyEventRegistrations, useRegisterForEvent } from '@hooks/useQueryHooks';
import type { Event } from '@services/event.service';
import {
  formatEventDateRange,
  getEventById,
  getEventDurationDays,
  isMultiDayEvent,
  timeObjectToString
} from '@services/event.service';
import FeedbackService, { Feedback } from '@services/feedback.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import Toast from 'react-native-toast-message';

export default function StudentEventDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Feedback states
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [currentFeedbackPage, setCurrentFeedbackPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const FEEDBACKS_PER_PAGE = 5;

  // React Query hooks
  const { data: myRegistrations = [] } = useMyEventRegistrations();
  const { mutate: registerForEvent, isPending: isRegistering } = useRegisterForEvent();

  const loadEventDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getEventById(id);
      setEvent(data);

      // Load feedbacks for APPROVED, ONGOING, or COMPLETED events
      if (data.status === 'APPROVED' || data.status === 'ONGOING' || data.status === 'COMPLETED') {
        try {
          setFeedbackLoading(true);
          const feedbackData = await FeedbackService.getFeedbackByEventId(id);
          setFeedbacks(feedbackData);
        } catch (feedbackError) {
          console.error('Failed to load feedback:', feedbackError);
        } finally {
          setFeedbackLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to load event detail:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load event details',
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

  // Check if user is registered for this event
  const isRegistered = event ? myRegistrations.some((reg) => reg.eventId === event.id) : false;

  // Handle event registration
  const handleRegister = () => {
    if (!event) return;

    registerForEvent(event.id, {
      onSuccess: (data) => {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Successfully registered for the event!',
        });
        loadEventDetail(); // Refresh event details
      },
      onError: (error: any) => {
        console.error('Error registering for event:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error?.response?.data?.message || 'Failed to register for the event',
        });
      },
    });
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!event || !id) return;

    if (feedbackComment.trim().length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a comment',
      });
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      await FeedbackService.postFeedback(id, {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your feedback has been submitted successfully!',
      });

      // Reset and close modal
      setShowFeedbackModal(false);
      setFeedbackRating(5);
      setFeedbackComment('');

      // Reload feedbacks
      await loadEventDetail();
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Failed to submit feedback. Please try again.',
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Filter and paginate feedbacks
  const filteredFeedbacks = ratingFilter
    ? feedbacks.filter((fb) => fb.rating === ratingFilter)
    : feedbacks;

  const totalFeedbackPages = Math.ceil(filteredFeedbacks.length / FEEDBACKS_PER_PAGE);
  const startIndex = (currentFeedbackPage - 1) * FEEDBACKS_PER_PAGE;
  const paginatedFeedbacks = filteredFeedbacks.slice(startIndex, startIndex + FEEDBACKS_PER_PAGE);

  // Calculate average rating
  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0';

  // Render star rating
  const renderStars = (rating: number, interactive = false, onPress?: (rating: number) => void) => {
    return (
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => interactive && onPress && onPress(star)}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={interactive ? 32 : 16}
              color={star <= rating ? '#FBBF24' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'APPROVED':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: 'checkmark-circle' as const,
          label: 'Approved',
        };
      case 'PENDING':
      case 'PENDING_UNISTAFF':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: 'time' as const,
          label: 'Pending',
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
      case 'COMPLETED':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: 'checkmark-done-circle' as const,
          label: 'Completed',
        };
      case 'ONGOING':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: 'play-circle' as const,
          label: 'Ongoing',
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

  // Check if the event is currently active and can be registered for
  const canRegister = () => {
    if (!event) return false;

    // Must be APPROVED
    if (event.status !== 'APPROVED') return false;

    // Check if event hasn't ended yet
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
      console.error('Error checking if can register:', error);
      return false;
    }
  };

  // Check if the event is currently active for check-in
  const isEventActive = () => {
    if (!event) return false;

    // Must be APPROVED
    if (event.status !== 'APPROVED') return false;

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

  const handleCheckIn = () => {
    // Navigate to QR scanner
    router.push('/student/scan-qr');
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
          <Text className="text-gray-500 mt-4">Loading event details...</Text>
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
            The event you're looking for doesn't exist.
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
  const showRegisterButton = canRegister();
  const showFeedbackButton = event.status === 'APPROVED' || event.status === 'ONGOING' || event.status === 'COMPLETED';

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
          {showFeedbackButton && (
            <TouchableOpacity
              onPress={() => setShowFeedbackModal(true)}
              className="bg-white/20 px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="chatbox-ellipses" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Feedback</Text>
            </TouchableOpacity>
          )}
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
              
            </View>

            {/* Badges */}
            <View className="flex-row gap-2 mb-4 flex-wrap">
              <View className={`flex-row items-center px-3 py-1.5 rounded-full ${statusBadge.bg}`}>
                <Ionicons name={statusBadge.icon} size={14} color={statusBadge.text.replace('text-', '#')} />
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
          <View className="p-6 space-y-3">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Date & Time</Text>
            
            {isMultiDayEvent(event) ? (
              // Multi-day event display
              <View>
                <View className="bg-gray-50 p-4 rounded-lg flex-row items-center mb-3">
                  <View className="bg-teal-100 p-3 rounded-lg mr-4">
                    <Ionicons name="calendar" size={20} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">
                      {formatEventDateRange(event, 'en-US')}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {getEventDurationDays(event)} day{getEventDurationDays(event) > 1 ? 's' : ''} event
                    </Text>
                  </View>
                </View>

                {/* Schedule for each day */}
                {event.days && event.days.length > 0 && (
                  <View className="mt-2">
                    <Text className="text-sm font-semibold text-gray-600 mb-2">Event Schedule</Text>
                    {event.days.map((day, index) => (
                      <View key={day.id} className="bg-gray-50 p-3 rounded-lg mb-2 flex-row items-start border border-gray-200">
                        <View className="w-10 h-10 rounded-full bg-teal-100 items-center justify-center mr-3">
                          <Text className="text-sm font-bold text-teal-700">D{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-medium">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="time" size={12} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                              {day.startTime} - {day.endTime}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              // Single-day event display
              <View>
                <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
                  <View className="bg-teal-100 p-3 rounded-lg mr-4">
                    <Ionicons name="calendar" size={20} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">
                      {event.date ? formatDate(event.date) : 'Date TBA'}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {event.date || 'Date TBA'}
                    </Text>
                  </View>
                </View>

                {event.startTime && event.endTime && (
                  <View className="bg-gray-50 p-4 rounded-lg flex-row items-center mt-3">
                    <View className="bg-teal-100 p-3 rounded-lg mr-4">
                      <Ionicons name="time" size={20} color="#0D9488" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium">
                        {timeObjectToString(event.startTime)} - {timeObjectToString(event.endTime)}
                      </Text>
                      <Text className="text-gray-500 text-sm">Event Duration</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 mx-6" />

          {/* Location & Organization */}
          <View className="p-6 space-y-3">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Location & Organization
            </Text>

            {event.locationName && (
              <View className="bg-gray-50 p-4 rounded-lg flex-row items-center">
                <View className="bg-teal-100 p-3 rounded-lg mr-4">
                  <Ionicons name="location" size={20} color="#0D9488" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">{event.locationName}</Text>
                  <Text className="text-gray-500 text-sm">Event Venue</Text>
                </View>
              </View>
            )}

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

        {/* Attendance Information Card */}
        <View className="bg-white m-4 rounded-xl shadow-sm">
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Attendance Information
            </Text>

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
                  {event.currentCheckInCount}
                </Text>
              </View>
              <View className="flex-1 bg-orange-50 p-4 rounded-lg">
                <Text className="text-orange-600 text-xs font-medium mb-1">Available</Text>
                <Text className="text-orange-900 text-xl font-bold">
                  {event.maxCheckInCount - event.currentCheckInCount}
                </Text>
              </View>
            </View>

            {/* Registration Action */}
            {showRegisterButton && !isRegistered && (
              <View className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                <View className="flex-row items-center mb-3">
                  <View className="bg-blue-100 p-2 rounded-full mr-3">
                    <Ionicons name="clipboard" size={20} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-blue-900 font-semibold">Ready to Join?</Text>
                    <Text className="text-blue-700 text-xs mt-1">
                      Register for this event to participate
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={isRegistering}
                  className={`${isRegistering ? 'bg-gray-400' : 'bg-blue-600'} p-4 rounded-lg flex-row items-center justify-center`}
                >
                  <Ionicons name="person-add" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    {isRegistering ? 'Registering...' : 'Register for Event'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Check-in Action */}
            {isEventActive() && isRegistered && (
              <View className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
                <View className="flex-row items-center mb-3">
                  <View className="bg-teal-100 p-2 rounded-full mr-3">
                    <Ionicons name="qr-code" size={20} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-teal-900 font-semibold">Ready to Check In?</Text>
                    <Text className="text-teal-700 text-xs mt-1">
                      Scan the QR code to mark your attendance
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCheckIn}
                  className="bg-teal-600 p-4 rounded-lg flex-row items-center justify-center"
                >
                  <Ionicons name="scan" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Scan QR Code to Check In
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Status messages */}
            {!showRegisterButton && event.status === 'APPROVED' && (
              <View className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex-row">
                <Ionicons name="information-circle" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-medium text-sm">
                    Event Has Ended
                  </Text>
                  <Text className="text-gray-600 text-xs mt-1">
                    This event has ended. Registration and check-in are no longer available.
                  </Text>
                </View>
              </View>
            )}

            {event.status !== 'APPROVED' && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-row">
                <Ionicons name="alert-circle" size={20} color="#D97706" />
                <View className="ml-3 flex-1">
                  <Text className="text-yellow-800 font-medium text-sm">
                    {event.status === 'PENDING_UNISTAFF' ? 'Pending Approval' : event.status}
                  </Text>
                  <Text className="text-yellow-700 text-xs mt-1">
                    {event.status === 'PENDING_UNISTAFF'
                      ? 'This event is waiting for university approval.'
                      : `This event is ${event.status.toLowerCase()}. Registration is not available.`}
                  </Text>
                </View>
              </View>
            )}

            {isRegistered && !isEventActive() && event.status === 'APPROVED' && (
              <View className="bg-green-50 border border-green-200 rounded-lg p-4 flex-row">
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                <View className="ml-3 flex-1">
                  <Text className="text-green-800 font-medium text-sm">
                    You're Registered!
                  </Text>
                  <Text className="text-green-700 text-xs mt-1">
                    You have successfully registered for this event. Check-in will be available during the event.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Points Information Card */}
        <View className="bg-white m-4 rounded-xl shadow-sm">
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Points Information
            </Text>

            <View className="flex-row mb-0 gap-3">
              {/* Commit Point Cost - Hidden for PUBLIC events */}
              {event.type !== 'PUBLIC' && (
                <View className="flex-1 bg-gray-50 p-4 rounded-lg">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="ticket" size={16} color="#6B7280" />
                    <Text className="text-xs text-gray-600 ml-1">Commit Cost</Text>
                  </View>
                  <Text className="text-xl font-bold text-gray-900">
                    {event.commitPointCost ?? 0}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">points</Text>
                </View>
              )}

              {/* Receive Points */}
              <View className={`${event.type === 'PUBLIC' ? 'w-full' : 'flex-1'} bg-emerald-50 p-4 rounded-lg border border-emerald-200`}>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="gift" size={16} color="#059669" />
                  <Text className="text-xs text-emerald-700 ml-1">Receive Point</Text>
                </View>
                <Text className="text-xl font-bold text-emerald-700">
                  {(() => {
                    const budgetPoints = event.budgetPoints ?? 0;
                    const maxCheckInCount = event.maxCheckInCount ?? 1;
                    return maxCheckInCount > 0 ? Math.floor(budgetPoints / maxCheckInCount) : 0;
                  })()}
                </Text>
                <Text className="text-xs text-emerald-600 mt-1">per full attendance</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Co-hosted Clubs */}
        {event.coHostedClubs && event.coHostedClubs.length > 0 && (
          <View className="bg-white m-4 rounded-xl shadow-sm">
            <View className="p-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Co-hosting Clubs
              </Text>
              {event.coHostedClubs.map((club) => (
                <View
                  key={club.id}
                  className="bg-gray-50 p-4 rounded-lg flex-row items-center mb-2"
                >
                  <View className="bg-teal-100 p-2 rounded-lg mr-3">
                    <Ionicons name="people" size={18} color="#0D9488" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">{club.name}</Text>
                    <Text className="text-gray-500 text-xs">Club ID: {club.id}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded ${
                    club.coHostStatus === 'APPROVED' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      club.coHostStatus === 'APPROVED' ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {club.coHostStatus}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Feedback Section */}
        {showFeedbackButton && (
          <View className="bg-white m-4 rounded-xl shadow-sm">
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">Event Feedback</Text>
                {feedbacks.length > 0 && (
                  <View className="items-center">
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={24} color="#FBBF24" />
                      <Text className="text-2xl font-bold ml-1">{averageRating}</Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      {feedbacks.length} {feedbacks.length === 1 ? 'review' : 'reviews'}
                    </Text>
                  </View>
                )}
              </View>

              {feedbackLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#0D9488" />
                  <Text className="text-gray-500 mt-2">Loading feedback...</Text>
                </View>
              ) : feedbacks.length === 0 ? (
                <View className="py-8 items-center">
                  <Ionicons name="chatbox-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-2">No feedback yet</Text>
                </View>
              ) : (
                <>
                  {/* Rating Filter */}
                  <View className="flex-row gap-2 mb-4 flex-wrap">
                    <TouchableOpacity
                      onPress={() => setRatingFilter(null)}
                      className={`px-3 py-2 rounded-lg ${
                        ratingFilter === null ? 'bg-teal-500' : 'bg-gray-100'
                      }`}
                    >
                      <Text className={ratingFilter === null ? 'text-white font-semibold' : 'text-gray-700'}>
                        All ({feedbacks.length})
                      </Text>
                    </TouchableOpacity>
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = feedbacks.filter((fb) => fb.rating === rating).length;
                      if (count === 0) return null;
                      return (
                        <TouchableOpacity
                          key={rating}
                          onPress={() => setRatingFilter(rating)}
                          className={`px-3 py-2 rounded-lg ${
                            ratingFilter === rating ? 'bg-teal-500' : 'bg-gray-100'
                          }`}
                        >
                          <Text className={ratingFilter === rating ? 'text-white font-semibold' : 'text-gray-700'}>
                            {rating}★ ({count})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Feedback List */}
                  {paginatedFeedbacks.map((feedback) => (
                    <View
                      key={feedback.feedbackId}
                      className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200"
                    >
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-row items-center">
                          <View className="w-8 h-8 bg-teal-100 rounded-full items-center justify-center mr-2">
                            <Ionicons name="person" size={16} color="#0D9488" />
                          </View>
                          <View>
                            <Text className="font-medium text-gray-900">
                              Member #{feedback.membershipId}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                        {renderStars(feedback.rating)}
                      </View>
                      <Text className="text-gray-700 text-sm leading-relaxed">{feedback.comment}</Text>
                      {feedback.updatedAt && (
                        <Text className="text-xs text-gray-400 mt-2">
                          Updated: {new Date(feedback.updatedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  ))}

                  {/* Pagination */}
                  {totalFeedbackPages > 1 && (
                    <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <Text className="text-sm text-gray-500">
                        Page {currentFeedbackPage} of {totalFeedbackPages}
                      </Text>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => setCurrentFeedbackPage((p) => Math.max(1, p - 1))}
                          disabled={currentFeedbackPage === 1}
                          className={`px-3 py-2 rounded-lg ${
                            currentFeedbackPage === 1 ? 'bg-gray-100' : 'bg-teal-500'
                          }`}
                        >
                          <Text className={currentFeedbackPage === 1 ? 'text-gray-400' : 'text-white font-semibold'}>
                            Previous
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setCurrentFeedbackPage((p) => Math.min(totalFeedbackPages, p + 1))}
                          disabled={currentFeedbackPage === totalFeedbackPages}
                          className={`px-3 py-2 rounded-lg ${
                            currentFeedbackPage === totalFeedbackPages ? 'bg-gray-100' : 'bg-teal-500'
                          }`}
                        >
                          <Text className={currentFeedbackPage === totalFeedbackPages ? 'text-gray-400' : 'text-white font-semibold'}>
                            Next
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Give Feedback</Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Event Name */}
            <Text className="text-sm text-gray-600 mb-4">
              For: <Text className="font-semibold">{event?.name}</Text>
            </Text>

            {/* Rating */}
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-900 mb-2">Rating</Text>
              {renderStars(feedbackRating, true, setFeedbackRating)}
            </View>

            {/* Comment */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-2">Comment</Text>
              <TextInput
                value={feedbackComment}
                onChangeText={setFeedbackComment}
                placeholder="Share your experience..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleFeedbackSubmit}
              disabled={isSubmittingFeedback}
              className={`py-3 rounded-lg items-center ${
                isSubmittingFeedback ? 'bg-gray-300' : 'bg-teal-600'
              }`}
            >
              {isSubmittingFeedback ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Submit Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
