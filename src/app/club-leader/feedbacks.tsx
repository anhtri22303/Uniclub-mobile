import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { Feedback, FeedbackService } from '@services/feedback.service';
import { useAuthStore } from '@stores/auth.store';
import { Stack } from 'expo-router';
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
import Toast from 'react-native-toast-message';

// Hide the navigation header
export const unstable_settings = {
  headerShown: false,
};

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1';

// Event Feedback Group interface
interface EventFeedbackGroup {
  eventId: number;
  eventName: string;
  feedbacks: Feedback[];
  averageRating: number;
  totalFeedbacks: number;
}

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
  
  // Expand/collapse and pagination states
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load feedbacks
  useEffect(() => {
    loadFeedbacks();
  }, [user?.clubIds]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const clubId = user?.clubIds?.[0];
      if (!clubId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Club ID not found',
          position: 'top',
        });
        return;
      }

      const data = await FeedbackService.getFeedbackByClubId(clubId);
      setFeedbacks(data);
    } catch (error: any) {
      console.error('Error fetching feedbacks:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load feedbacks',
        position: 'top',
      });
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

  // Group feedbacks by event
  const groupedFeedbacks = useMemo(() => {
    const groups = new Map<number, EventFeedbackGroup>();

    feedbacks.forEach((feedback) => {
      if (!groups.has(feedback.eventId)) {
        groups.set(feedback.eventId, {
          eventId: feedback.eventId,
          eventName: feedback.eventName,
          feedbacks: [],
          averageRating: 0,
          totalFeedbacks: 0,
        });
      }

      const group = groups.get(feedback.eventId)!;
      group.feedbacks.push(feedback);
    });

    // Calculate averages
    groups.forEach((group) => {
      group.totalFeedbacks = group.feedbacks.length;
      const sum = group.feedbacks.reduce((acc, f) => acc + f.rating, 0);
      group.averageRating = sum / group.totalFeedbacks;
    });

    return Array.from(groups.values());
  }, [feedbacks]);

  // Get unique events for filter
  const uniqueEvents = useMemo(() => {
    return groupedFeedbacks.map((group) => ({
      id: group.eventId,
      name: group.eventName,
    }));
  }, [groupedFeedbacks]);

  // Filter grouped feedbacks
  const filteredGroups = useMemo(() => {
    return groupedFeedbacks.filter((group) => {
      const matchesEvent =
        selectedEvent === 'all' || group.eventId.toString() === selectedEvent;

      const matchesRating =
        selectedRating === 'all' ||
        group.feedbacks.some((f) => f.rating.toString() === selectedRating);

      const matchesSearch =
        group.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.feedbacks.some(
          (f) =>
            f.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.comment.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return matchesEvent && matchesRating && matchesSearch;
    });
  }, [groupedFeedbacks, searchTerm, selectedEvent, selectedRating]);

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredGroups.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGroups, currentPage]);

  // Toggle event expansion
  const toggleEventExpansion = (eventId: number) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEvent, selectedRating]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  // Total feedbacks count (filtered)
  const totalFeedbacksCount = useMemo(() => {
    return filteredGroups.reduce((acc, group) => acc + group.totalFeedbacks, 0);
  }, [filteredGroups]);

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
        <Stack.Screen options={{ headerShown: false }} />
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
        <Text className="text-2xl font-bold text-gray-800 mb-1">       Club Feedbacks</Text>
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
              {totalFeedbacksCount}
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
        {paginatedGroups.length === 0 ? (
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
          <>
            {paginatedGroups.map((group) => {
              const isExpanded = expandedEvents.has(group.eventId);
              return (
                <View key={group.eventId} className="mb-3">
                  {/* Event Group Header */}
                  <TouchableOpacity
                    onPress={() => toggleEventExpansion(group.eventId)}
                    className="bg-teal-600 rounded-t-xl p-4 flex-row items-center justify-between"
                    activeOpacity={0.7}
                  >
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold mb-1">
                        {group.eventName}
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <Ionicons name="chatbubbles" size={14} color="white" />
                          <Text className="text-white text-sm ml-1">
                            {group.totalFeedbacks} feedback{group.totalFeedbacks !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="star" size={14} color="#FCD34D" />
                          <Text className="text-white text-sm ml-1 font-semibold">
                            {group.averageRating.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>

                  {/* Feedbacks List (Collapsed/Expanded) */}
                  {isExpanded && (
                    <View className="bg-white rounded-b-xl border-x border-b border-gray-200">
                      {group.feedbacks.map((feedback, index) => (
                        <View
                          key={feedback.feedbackId}
                          className={`p-4 ${
                            index !== group.feedbacks.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          {/* Feedback Header */}
                          <View className="flex-row items-start justify-between mb-3">
                            <View className="flex-1 mr-2">
                              <View className="flex-row items-center">
                                <Ionicons name="person" size={14} color="#6B7280" />
                                <Text className="text-sm text-gray-600 ml-1 font-medium">
                                  {feedback.memberName || 'Unknown'}
                                </Text>
                              </View>
                            </View>
                            <View
                              className={`px-3 py-1 rounded-full border ${getRatingColor(
                                feedback.rating
                              )}`}
                            >
                              <Text
                                className={`text-sm font-bold ${getRatingTextColor(
                                  feedback.rating
                                )}`}
                              >
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
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View className="mt-4 mb-6">
                {/* Page Info */}
                <Text className="text-center text-sm text-gray-600 mb-3">
                  Showing{' '}
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredGroups.length)} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredGroups.length)} of{' '}
                  {filteredGroups.length} events
                </Text>

                {/* Pagination Buttons */}
                <View className="flex-row items-center justify-center gap-2">
                  {/* Previous Button */}
                  <TouchableOpacity
                    onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === 1
                        ? 'bg-gray-200'
                        : 'bg-teal-600 active:bg-teal-700'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        currentPage === 1 ? 'text-gray-400' : 'text-white'
                      }`}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  {/* Page Numbers */}
                  <View className="flex-row items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <TouchableOpacity
                          key={pageNum}
                          onPress={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg items-center justify-center ${
                            currentPage === pageNum
                              ? 'bg-teal-600'
                              : 'bg-gray-100 active:bg-gray-200'
                          }`}
                        >
                          <Text
                            className={`font-semibold ${
                              currentPage === pageNum ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Next Button */}
                  <TouchableOpacity
                    onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === totalPages
                        ? 'bg-gray-200'
                        : 'bg-teal-600 active:bg-teal-700'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        currentPage === totalPages ? 'text-gray-400' : 'text-white'
                      }`}
                    >
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
