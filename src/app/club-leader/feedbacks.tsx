import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { Feedback, FeedbackService } from '@services/feedback.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1';

export default function ClubLeaderFeedbacksPage() {
  const { user } = useAuthStore();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<FilterType>('all');
  const [showEventFilter, setShowEventFilter] = useState(false);
  const [showRatingFilter, setShowRatingFilter] = useState(false);

  // Load feedbacks
  useEffect(() => {
    loadFeedbacks();
  }, [user?.clubIds]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const clubId = user?.clubIds?.[0];
      if (!clubId) {
        throw new Error('No club found for this leader');
      }

      const data = await FeedbackService.getFeedbackByClubId(clubId);
      setFeedbacks(data);
    } catch (error: any) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeedbacks();
    setRefreshing(false);
  };

  // Get unique events for filter
  const uniqueEvents = useMemo(() => {
    const events = feedbacks.map((f) => ({
      id: f.eventId,
      name: f.eventName,
    }));
    const unique = Array.from(new Map(events.map((e) => [e.id, e])).values());
    return unique;
  }, [feedbacks]);

  // Filter feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((feedback) => {
      const matchesSearch =
        feedback.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.comment.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEvent =
        selectedEvent === 'all' || feedback.eventId.toString() === selectedEvent;

      const matchesRating =
        selectedRating === 'all' || feedback.rating.toString() === selectedRating;

      return matchesSearch && matchesEvent && matchesRating;
    });
  }, [feedbacks, searchTerm, selectedEvent, selectedRating]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (filteredFeedbacks.length === 0) return 0;
    const sum = filteredFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / filteredFeedbacks.length).toFixed(1);
  }, [filteredFeedbacks]);

  // Render star rating
  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#FBBF24' : '#D1D5DB'}
          />
        ))}
      </View>
    );
  };

  // Get rating badge color
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100 border-green-300';
    if (rating >= 3.5) return 'bg-blue-100 border-blue-300';
    if (rating >= 2.5) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const getRatingTextColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-800';
    if (rating >= 3.5) return 'text-blue-800';
    if (rating >= 2.5) return 'text-yellow-800';
    return 'text-red-800';
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-600 mt-4">Loading feedbacks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800 mb-1">Club Feedbacks</Text>
        <Text className="text-gray-600 text-sm">
          View and manage feedback from club events
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row gap-3">
          {/* Total Feedbacks */}
          <View className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-200">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                Total
              </Text>
              <Ionicons name="chatbubbles" size={20} color="#2563EB" />
            </View>
            <Text className="text-2xl font-bold text-blue-900">
              {filteredFeedbacks.length}
            </Text>
          </View>

          {/* Average Rating */}
          <View className="flex-1 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-yellow-600 font-semibold uppercase tracking-wide">
                Average
              </Text>
              <Ionicons name="star" size={20} color="#F59E0B" />
            </View>
            <Text className="text-2xl font-bold text-yellow-900">{averageRating}</Text>
            <View className="mt-1">{renderStars(Math.round(Number(averageRating)), 12)}</View>
          </View>

          {/* Events */}
          <View className="flex-1 bg-green-50 rounded-xl p-4 border border-green-200">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-green-600 font-semibold uppercase tracking-wide">
                Events
              </Text>
              <Ionicons name="calendar" size={20} color="#10B981" />
            </View>
            <Text className="text-2xl font-bold text-green-900">
              {uniqueEvents.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search by member, event, or comment..."
            className="flex-1 ml-2 text-base text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <View className="flex-row gap-3">
          {/* Event Filter */}
          <TouchableOpacity
            onPress={() => setShowEventFilter(!showEventFilter)}
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={18} color="#0D9488" />
              <Text className="text-teal-700 font-semibold ml-2">Event</Text>
            </View>
            {selectedEvent !== 'all' && (
              <View className="bg-teal-600 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">1</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Rating Filter */}
          <TouchableOpacity
            onPress={() => setShowRatingFilter(!showRatingFilter)}
            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="star-outline" size={18} color="#0D9488" />
              <Text className="text-teal-700 font-semibold ml-2">Rating</Text>
            </View>
            {selectedRating !== 'all' && (
              <View className="bg-teal-600 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Event Filter Options */}
        {showEventFilter && (
          <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Filter by Event</Text>
            <ScrollView className="max-h-48" showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedEvent('all');
                  setShowEventFilter(false);
                }}
                className={`px-4 py-3 rounded-lg mb-2 ${
                  selectedEvent === 'all' ? 'bg-teal-600' : 'bg-white border border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedEvent === 'all' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  All Events
                </Text>
              </TouchableOpacity>
              {uniqueEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => {
                    setSelectedEvent(event.id.toString());
                    setShowEventFilter(false);
                  }}
                  className={`px-4 py-3 rounded-lg mb-2 ${
                    selectedEvent === event.id.toString()
                      ? 'bg-teal-600'
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedEvent === event.id.toString() ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {event.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Rating Filter Options */}
        {showRatingFilter && (
          <View className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Filter by Rating</Text>
            <View className="flex-row flex-wrap gap-2">
              {(['all', '5', '4', '3', '2', '1'] as FilterType[]).map((rating) => (
                <TouchableOpacity
                  key={rating}
                  onPress={() => {
                    setSelectedRating(rating);
                    setShowRatingFilter(false);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    selectedRating === rating
                      ? 'bg-teal-600'
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedRating === rating ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {rating === 'all' ? 'All Ratings' : `${rating} Stars`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Clear Filters */}
        {(selectedEvent !== 'all' || selectedRating !== 'all' || searchTerm) && (
          <TouchableOpacity
            onPress={() => {
              setSelectedEvent('all');
              setSelectedRating('all');
              setSearchTerm('');
            }}
            className="mt-3 flex-row items-center justify-center"
          >
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text className="text-red-600 text-sm font-medium ml-1">Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Feedback List */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
      >
        {filteredFeedbacks.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center">
            <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-800 mt-4">No Feedbacks Found</Text>
            <Text className="text-gray-600 text-center mt-2">
              {searchTerm || selectedEvent !== 'all' || selectedRating !== 'all'
                ? 'Try adjusting your filters'
                : 'Wait for members to submit feedback'}
            </Text>
          </View>
        ) : (
          filteredFeedbacks.map((feedback) => (
            <View
              key={feedback.feedbackId}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200"
            >
              {/* Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-base font-bold text-gray-900 mb-1">
                    {feedback.eventName}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="person" size={14} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-1">
                      {feedback.memberName || 'Unknown'}
                    </Text>
                  </View>
                </View>
                <View
                  className={`px-3 py-1 rounded-full border ${getRatingColor(
                    feedback.rating
                  )}`}
                >
                  <Text className={`text-sm font-bold ${getRatingTextColor(feedback.rating)}`}>
                    {feedback.rating} ★
                  </Text>
                </View>
              </View>

              {/* Rating Stars */}
              <View className="mb-3">{renderStars(feedback.rating, 18)}</View>

              {/* Comment */}
              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-sm text-gray-700">{feedback.comment}</Text>
              </View>

              {/* Date */}
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1">
                  {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
