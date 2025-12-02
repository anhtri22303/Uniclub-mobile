import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ClubService } from '@services/club.service';
import FeedbackService, { Feedback } from '@services/feedback.service';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View} from 'react-native';

interface Club {
  id: number;
  name: string;
}

export default function UniStaffFeedbacksPage() {
  // Sidebar state
  // The Sidebar component manages its own open/close state, just render it with the correct role
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch clubs on mount
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoadingClubs(true);
        const clubList = await ClubService.fetchClubs(0, 100);
        // Transform to our local Club interface
        const transformedClubs = clubList.map(club => ({
          id: club.id,
          name: club.name,
        }));
        setClubs(transformedClubs);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        Alert.alert('Error', 'Failed to load clubs');
      } finally {
        setLoadingClubs(false);
      }
    };

    fetchClubs();
  }, []);

  // Fetch feedbacks when club is selected
  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!selectedClubId) {
        setFeedbacks([]);
        return;
      }

      try {
        setLoading(true);
        const data = await FeedbackService.getFeedbackByClubId(selectedClubId);
        setFeedbacks(data);
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
        Alert.alert('Error', 'Failed to load feedbacks');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
    setCurrentPage(1);
  }, [selectedClubId]);

  // Get unique events for filter
  const uniqueEvents = useMemo(() => {
    const events = feedbacks.map((f) => ({
      id: f.eventId,
      name: f.eventName,
    }));
    const unique = Array.from(
      new Map(events.map((e) => [e.id, e])).values()
    );
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

  // Pagination
  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const paginatedFeedbacks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFeedbacks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFeedbacks, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEvent, selectedRating]);

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <View className="flex-row gap-0.5">
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

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (filteredFeedbacks.length === 0) return '0.0';
    const sum = filteredFeedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / filteredFeedbacks.length).toFixed(1);
  }, [filteredFeedbacks]);

  // Get selected club name
  const selectedClubName = useMemo(() => {
    const club = clubs.find((c) => c.id.toString() === selectedClubId);
    return club?.name || '';
  }, [clubs, selectedClubId]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loadingClubs) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0D9488" />
        <Text className="mt-4 text-gray-600">Loading clubs...</Text>
      </View>
    );
  }

  return (
    <>
      {/* Remove default header */}
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        {/* Sidebar Toggle Button */}
        <Sidebar role="uni_staff" />
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="p-4 space-y-4">
        {/* Header */}
        <View className="mb-2">
          <Text className="text-2xl font-bold text-gray-900">Club Feedbacks</Text>
          {/* <Text className="text-sm text-gray-600 mt-1">
            View and analyze feedback from club events
          </Text> */}
        </View>

        {/* Club Selection Card */}
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Ionicons name="business" size={20} color="#0D9488" />
            <Text className="text-base font-semibold text-gray-900 ml-2">
              Select Club
            </Text>
          </View>
          <View className="border border-gray-300 rounded-lg overflow-hidden">
            <Picker
              selectedValue={selectedClubId}
              onValueChange={(value) => setSelectedClubId(value)}
              style={{ height: 50 }}
            >
              <Picker.Item label="Select a club to view feedbacks" value="" />
              {clubs.map((club) => (
                <Picker.Item
                  key={club.id}
                  label={club.name}
                  value={club.id.toString()}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Stats Cards - Show only when club is selected */}
        {selectedClubId && (
          <View className="space-y-3">
            {/* Total Feedbacks */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-gray-600 mb-1">         Total Feedbacks</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {filteredFeedbacks.length}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                    {selectedClubName}
                  </Text>
                </View>
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                  <Ionicons name="chatbox-ellipses" size={24} color="#3B82F6" />
                </View>
              </View>
            </View>

            {/* Average Rating */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-gray-600 mb-1">Average Rating</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {averageRating}
                  </Text>
                  <View className="mt-2">
                    {renderStars(Math.round(Number(averageRating)))}
                  </View>
                </View>
                <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center">
                  <Ionicons name="star" size={24} color="#F59E0B" />
                </View>
              </View>
            </View>

            {/* Events with Feedback */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-gray-600 mb-1">Events with Feedback</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {uniqueEvents.length}
                  </Text>
                </View>
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
                  <Ionicons name="calendar" size={24} color="#10B981" />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Filters - Show only when club is selected */}
        {selectedClubId && (
          <View className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <Text className="text-base font-semibold text-gray-900">Filters</Text>

            {/* Search Input */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Search</Text>
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#6B7280" />
                <AppTextInput
                  className="flex-1 ml-2 text-base text-gray-900"
                  placeholder="Search by member, event, or comment..."
                  placeholderTextColor="#9CA3AF"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>
            </View>

            {/* Event Filter */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Event</Text>
              <View className="border border-gray-300 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={selectedEvent}
                  onValueChange={(value) => setSelectedEvent(value)}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="All Events" value="all" />
                  {uniqueEvents.map((event) => (
                    <Picker.Item
                      key={event.id}
                      label={event.name}
                      value={event.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Rating Filter */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Rating</Text>
              <View className="border border-gray-300 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={selectedRating}
                  onValueChange={(value) => setSelectedRating(value)}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="All Ratings" value="all" />
                  <Picker.Item label="5 Stars" value="5" />
                  <Picker.Item label="4 Stars" value="4" />
                  <Picker.Item label="3 Stars" value="3" />
                  <Picker.Item label="2 Stars" value="2" />
                  <Picker.Item label="1 Star" value="1" />
                </Picker>
              </View>
            </View>
          </View>
        )}

        {/* Feedback List - Show only when club is selected */}
        {selectedClubId && (
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-base font-semibold text-gray-900">
                Feedback List
              </Text>
            </View>

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="mt-4 text-gray-600">Loading feedbacks...</Text>
              </View>
            ) : paginatedFeedbacks.length === 0 ? (
              <View className="py-12 items-center px-4">
                <Ionicons name="chatbox-ellipses-outline" size={48} color="#9CA3AF" />
                <Text className="mt-4 text-lg font-medium text-gray-900">
                  No feedbacks found
                </Text>
                <Text className="mt-2 text-sm text-gray-600 text-center">
                  Try adjusting your filters or this club hasn't received any feedback yet
                </Text>
              </View>
            ) : (
              <View>
                {/* Feedback Cards */}
                {paginatedFeedbacks.map((feedback, index) => (
                  <View
                    key={feedback.feedbackId}
                    className={`p-4 ${
                      index !== paginatedFeedbacks.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    {/* Event Name and Rating Badge */}
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                          {feedback.eventName}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="person" size={14} color="#6B7280" />
                          <Text className="text-sm text-gray-600 ml-1">
                            {feedback.memberName || 'Unknown'}
                          </Text>
                        </View>
                      </View>
                      <View className="bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                        <Text className="text-sm font-semibold text-yellow-700">
                          {feedback.rating} ★
                        </Text>
                      </View>
                    </View>

                    {/* Star Rating */}
                    <View className="mb-2">
                      {renderStars(feedback.rating)}
                    </View>

                    {/* Comment */}
                    <Text className="text-sm text-gray-700 mb-2">
                      {feedback.comment}
                    </Text>

                    {/* Date */}
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                      <Text className="text-xs text-gray-500 ml-1">
                        {formatDate(feedback.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <View className="p-4 border-t border-gray-200">
                    {/* Info */}
                    <Text className="text-sm text-gray-600 text-center mb-3">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredFeedbacks.length)} of{' '}
                      {filteredFeedbacks.length} feedbacks
                    </Text>

                    {/* Pagination Controls */}
                    <View className="flex-row items-center justify-center space-x-2">
                      <TouchableOpacity
                        onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg border ${
                          currentPage === 1
                            ? 'bg-gray-100 border-gray-300'
                            : 'bg-white border-teal-600'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            currentPage === 1 ? 'text-gray-400' : 'text-teal-600'
                          }`}
                        >
                          Previous
                        </Text>
                      </TouchableOpacity>

                      <View className="flex-row items-center px-4">
                        <Text className="text-sm font-medium text-gray-900">
                          {currentPage} / {totalPages}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg border ${
                          currentPage === totalPages
                            ? 'bg-gray-100 border-gray-300'
                            : 'bg-white border-teal-600'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            currentPage === totalPages ? 'text-gray-400' : 'text-teal-600'
                          }`}
                        >
                          Next
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-8" />
          </View>
        </ScrollView>
      </View>
    </>
  );
}
