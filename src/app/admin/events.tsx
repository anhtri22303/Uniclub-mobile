import NavigationBar from '@components/navigation/NavigationBar';
import { Ionicons } from '@expo/vector-icons';
import { createEvent, Event, fetchEvent } from '@services/event.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminEventsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');

  // Create modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clubId: 1,
    name: '',
    description: '',
    type: 'PUBLIC',
    date: '',
    time: '13:30',
    locationId: 1,
  });

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login' as any);
        },
      },
    ]);
  };

  // Helper to get event status based on date and time
  const getEventStatus = (eventDate: string, eventTime?: string) => {
    if (!eventDate) return 'Finished';
    const now = new Date();
    const [hour = '00', minute = '00'] = (eventTime || '00:00').split(':');
    const event = new Date(eventDate);
    event.setHours(Number(hour), Number(minute), 0, 0);

    const EVENT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
    const start = event.getTime();
    const end = start + EVENT_DURATION_MS;

    if (now.getTime() < start) {
      if (start - now.getTime() < 7 * 24 * 60 * 60 * 1000) return 'Soon';
      return 'Future';
    }
    if (now.getTime() >= start && now.getTime() <= end) return 'Now';
    return 'Finished';
  };

  const sortEventsByDateTime = (eventList: Event[]) => {
    return eventList.sort((a: any, b: any) => {
      const dateA = new Date(a.date || '1970-01-01');
      const dateB = new Date(b.date || '1970-01-01');

      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }

      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';

      const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours || 0) * 60 + (minutes || 0);
      };

      return parseTime(timeB) - parseTime(timeA);
    });
  };

  const fetchEvents = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const data = await fetchEvent();
      const normalized = data.map((e: any) => ({ ...e, title: e.title ?? e.name }));
      const sorted = sortEventsByDateTime(normalized);
      setEvents(sorted);
      setFilteredEvents(sorted);
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = events;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          (e.name || '').toLowerCase().includes(query) ||
          (e.description || '').toLowerCase().includes(query) ||
          (e.type || '').toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((e) => e.type?.toUpperCase() === typeFilter);
    }

    // Status filter (Soon/Now/Finished)
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => {
        const status = getEventStatus(e.date, e.time);
        return status.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    // Approval status filter
    if (approvalFilter !== 'all') {
      filtered = filtered.filter((e) => e.status?.toUpperCase() === approvalFilter);
    }

    setFilteredEvents(filtered);
  }, [searchQuery, events, typeFilter, statusFilter, approvalFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEvents(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setApprovalFilter('all');
  };

  const resetForm = () => {
    setFormData({
      clubId: 1,
      name: '',
      description: '',
      type: 'PUBLIC',
      date: '',
      time: '13:30',
      locationId: 1,
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.date) {
      Alert.alert('Missing Information', 'Please fill in event name and date');
      return;
    }

    try {
      const payload = {
        clubId: formData.clubId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        locationId: formData.locationId,
      };

      await createEvent(payload);
      Alert.alert('Success', 'Event created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create event');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Soon':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
      case 'Now':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
      case 'Finished':
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
      default:
        return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' };
    }
  };

  const getApprovalBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
      case 'PENDING':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
      case 'REJECTED':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all' || approvalFilter !== 'all';
  const filterCount = [
    searchQuery.trim() !== '',
    typeFilter !== 'all',
    statusFilter !== 'all',
    approvalFilter !== 'all',
  ].filter(Boolean).length;

  // Statistics
  const totalEvents = filteredEvents.length;
  const approvedEvents = filteredEvents.filter((e) => e.status === 'APPROVED').length;
  const upcomingEvents = filteredEvents.filter((e) => {
    const status = getEventStatus(e.date, e.time);
    return status === 'Soon' || status === 'Future';
  }).length;

  const renderEventItem = ({ item }: { item: Event }) => {
    const status = getEventStatus(item.date, item.time);
    const statusColors = getStatusBadgeColor(status);
    const approvalColors = getApprovalBadgeColor(item.status || '');

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
        onPress={() => {
          const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          Alert.alert(
            item.name,
            `${item.description || 'No description'}\n\nDate: ${formattedDate}\nTime: ${item.time || 'N/A'}\nType: ${
              item.type
            }\nStatus: ${item.status || 'N/A'}\nEvent Status: ${status}`,
            [{ text: 'Close', style: 'cancel' }]
          );
        }}
      >
        <View className="flex-row items-start">
          {/* Icon */}
          <View className="bg-indigo-100 w-12 h-12 rounded-full items-center justify-center mr-3">
            <Ionicons name="calendar" size={24} color="#6366F1" />
          </View>

          {/* Event Info */}
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800 mb-1">{item.name}</Text>

            {item.description && (
              <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Badges Row */}
            <View className="flex-row items-center flex-wrap gap-2 mb-2">
              <View className={`px-2 py-1 rounded-full border ${statusColors.bg} ${statusColors.border}`}>
                <Text className={`text-xs font-medium ${statusColors.text}`}>{status}</Text>
              </View>

              <View className={`px-2 py-1 rounded-full border ${approvalColors.bg} ${approvalColors.border}`}>
                <Text className={`text-xs font-medium ${approvalColors.text}`}>{item.status || 'N/A'}</Text>
              </View>

              {item.type && (
                <View className="px-2 py-1 rounded-full border bg-purple-100 border-purple-300">
                  <Text className="text-xs font-medium text-purple-700">{item.type}</Text>
                </View>
              )}
            </View>

            {/* Date & Time */}
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              {item.time && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1">{item.time}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity className="bg-indigo-50 p-2 rounded-lg">
            <Ionicons name="eye-outline" size={18} color="#6366F1" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-800">Events</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setIsCreateModalOpen(true)}
              className="flex-row items-center bg-indigo-500 px-3 py-2 rounded-xl"
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-medium ml-1 text-sm">Create</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center bg-red-500 px-3 py-2 rounded-xl"
            >
              <Ionicons name="log-out" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-indigo-50 rounded-xl p-3 border border-indigo-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-indigo-600 font-medium">Total</Text>
                <Text className="text-xl font-bold text-indigo-900">{totalEvents}</Text>
              </View>
              <View className="bg-indigo-500 p-2 rounded-lg">
                <Ionicons name="calendar" size={20} color="white" />
              </View>
            </View>
          </View>

          <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-green-600 font-medium">Approved</Text>
                <Text className="text-xl font-bold text-green-900">{approvedEvents}</Text>
              </View>
              <View className="bg-green-500 p-2 rounded-lg">
                <Ionicons name="checkmark-circle" size={20} color="white" />
              </View>
            </View>
          </View>

          <View className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-blue-600 font-medium">Upcoming</Text>
                <Text className="text-xl font-bold text-blue-900">{upcomingEvents}</Text>
              </View>
              <View className="bg-blue-500 p-2 rounded-lg">
                <Ionicons name="rocket" size={20} color="white" />
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center mb-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Toggle */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center bg-gray-100 px-4 py-2 rounded-xl"
          >
            <Ionicons name="filter" size={18} color="#6366F1" />
            <Text className="text-indigo-600 font-medium ml-2">Filters</Text>
            {filterCount > 0 && (
              <View className="bg-indigo-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity
              onPress={clearFilters}
              className="flex-row items-center bg-red-50 px-4 py-2 rounded-xl"
            >
              <Ionicons name="close" size={18} color="#EF4444" />
              <Text className="text-red-600 font-medium ml-1">Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Filter Options</Text>

            {/* Type Filter */}
            <View className="mb-3">
              <Text className="text-xs text-gray-600 mb-2">Type</Text>
              <View className="flex-row gap-2">
                {['all', 'PUBLIC', 'PRIVATE'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setTypeFilter(type)}
                    className={`px-3 py-2 rounded-lg border ${
                      typeFilter === type ? 'bg-indigo-500 border-indigo-600' : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${typeFilter === type ? 'text-white' : 'text-gray-700'}`}
                    >
                      {type === 'all' ? 'All' : type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View className="mb-3">
              <Text className="text-xs text-gray-600 mb-2">Event Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {['all', 'Soon', 'Now', 'Finished'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setStatusFilter(status)}
                      className={`px-3 py-2 rounded-lg border ${
                        statusFilter === status ? 'bg-indigo-500 border-indigo-600' : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${statusFilter === status ? 'text-white' : 'text-gray-700'}`}
                      >
                        {status === 'all' ? 'All' : status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Approval Filter */}
            <View>
              <Text className="text-xs text-gray-600 mb-2">Approval Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {['all', 'APPROVED', 'PENDING', 'REJECTED'].map((approval) => (
                    <TouchableOpacity
                      key={approval}
                      onPress={() => setApprovalFilter(approval)}
                      className={`px-3 py-2 rounded-lg border ${
                        approvalFilter === approval ? 'bg-indigo-500 border-indigo-600' : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          approvalFilter === approval ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {approval === 'all' ? 'All' : approval}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      {/* Events List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-gray-600 mt-4">Loading events...</Text>
        </View>
      ) : filteredEvents.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-gray-100 p-6 rounded-full mb-4">
            <Ionicons name="calendar-outline" size={48} color="#6B7280" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">No Events Found</Text>
          <Text className="text-gray-600 text-center mb-4">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first event to get started'}
          </Text>
          {hasActiveFilters ? (
            <TouchableOpacity onPress={clearFilters} className="bg-indigo-500 px-6 py-3 rounded-xl">
              <Text className="text-white font-medium">Clear Filters</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setIsCreateModalOpen(true)}
              className="flex-row items-center bg-indigo-500 px-6 py-3 rounded-xl"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-medium ml-2">Create Event</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#6366F1']} tintColor="#6366F1" />
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '85%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Create New Event</Text>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                {/* Event Name */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Event Name *</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Enter event name"
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Describe your event..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Date and Time */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Date *</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={formData.date}
                      onChangeText={(text) => setFormData({ ...formData, date: text })}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Time</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={formData.time}
                      onChangeText={(text) => setFormData({ ...formData, time: text })}
                      placeholder="HH:MM"
                    />
                  </View>
                </View>

                {/* Type and Location */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
                    <View className="flex-row gap-2">
                      {['PUBLIC', 'PRIVATE'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setFormData({ ...formData, type })}
                          className={`flex-1 px-3 py-3 rounded-xl border ${
                            formData.type === type
                              ? 'bg-indigo-500 border-indigo-600'
                              : 'bg-gray-50 border-gray-300'
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium text-center ${
                              formData.type === type ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Buttons */}
                <View className="flex-row gap-3 mt-6">
                  <TouchableOpacity
                    onPress={() => {
                      setIsCreateModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 py-3 rounded-xl"
                  >
                    <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleCreate} className="flex-1 bg-indigo-500 py-3 rounded-xl">
                    <Text className="text-white font-semibold text-center">Create Event</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
