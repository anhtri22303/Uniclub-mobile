import EventDateTimeDisplay from '@components/EventDateTimeDisplay';
import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import {
  Club,
  Event,
  fetchClub,
  fetchEvent,
  fetchLocation,
  getEventSettle,
  isEventExpired as isEventExpiredUtil,
  Location,
  putEventStatus,
  rejectEvent
} from '@services/event.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UniStaffEventRequestsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [pendingFilter, setPendingFilter] = useState<"PENDING_UNISTAFF" | "PENDING_COCLUB">("PENDING_UNISTAFF");
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [settledEventIds, setSettledEventIds] = useState<Set<number>>(new Set());

  // Helper functions to safely get event date
  const getEventDate = (event: Event): Date | null => {
    // Multi-day event: use startDate or first day's date
    if (event.days && event.days.length > 0) {
      return event.days[0].date ? new Date(event.days[0].date) : null;
    }
    // Single-day event: use date field
    if (event.date) {
      return new Date(event.date);
    }
    return null;
  };

  const getEventDateString = (event: Event): string => {
    const date = getEventDate(event);
    return date ? date.toISOString().split('T')[0] : '';
  };

  // Helper function to check if event has valid date/time
  const hasValidDateTime = (event: Event): boolean => {
    // Check if event has multi-day format (days array)
    const isMultiDay = !!(event.days && event.days.length > 0);

    // Check if event has single-day format (date and endTime)
    const isSingleDay = !!(event.date || event.endTime);

    // Event must have either multi-day or single-day date/time
    return isMultiDay || isSingleDay;
  };

  // Use isEventExpired from eventApi.ts which supports both single-day and multi-day events
  const isEventExpired = isEventExpiredUtil;

  const getLocationById = (id: string | number | undefined) => {
    if (id === undefined || id === null) return null;
    return locations.find((l) => String(l.id) === String(id)) ?? null;
  };

  const getLocationCapacity = (id: string | number | undefined) => {
    const loc: any = getLocationById(id);
    if (!loc) return null;
    return loc.capacity ?? loc.maxCapacity ?? loc.seatingCapacity ?? null;
  };

  const fetchData = async () => {
    try {
      const [eventsRes, locationsRes, clubsRes, settledEventsRes] = await Promise.all([
        fetchEvent({ size: 200 }),
        fetchLocation(),
        fetchClub(),
        getEventSettle().catch(err => {
          console.warn("Failed to fetch settled events:", err);
          return [];
        })
      ]);
      
      const eventsContent = (eventsRes as any) && Array.isArray((eventsRes as any).content) 
        ? (eventsRes as any).content 
        : Array.isArray(eventsRes) ? eventsRes : [];
      const locationsContent = (locationsRes as any) && Array.isArray((locationsRes as any).content) 
        ? (locationsRes as any).content 
        : Array.isArray(locationsRes) ? locationsRes : [];
      const clubsContent = (clubsRes as any) && Array.isArray((clubsRes as any).content) 
        ? (clubsRes as any).content 
        : Array.isArray(clubsRes) ? clubsRes : [];
      
      // Create a set of settled event IDs
      const settledIds = new Set(
        Array.isArray(settledEventsRes)
          ? settledEventsRes.map((e: any) => e.id)
          : []
      );
      
      console.log('=== EVENT REQUESTS DEBUG ===');
      console.log('Total events fetched:', eventsContent.length);
      console.log('Events by status:', 
        eventsContent.reduce((acc: any, e: Event) => {
          acc[e.status] = (acc[e.status] || 0) + 1;
          return acc;
        }, {})
      );
      
      setEvents(eventsContent);
      setLocations(locationsContent);
      setClubs(clubsContent);
      setSettledEventIds(settledIds);
      setError(null);
    } catch (err: any) {
      console.error("Error in events-req page:", err);
      setError(err?.message || "Failed to fetch events or locations");
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchData()
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Filter events based on tabs and search
  const getFilteredRequests = (tabType: "pending" | "processed" | "completed" | "ongoing") => {
    const filtered = events.filter((evt) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        evt.name?.toLowerCase().includes(q) ||
        String(evt.clubId || "").includes(q);

      const matchType = typeFilter === "all" ? true : (evt.type || "") === typeFilter;

      // Filter out events without valid date/time (draft events)
      if (!hasValidDateTime(evt)) {
        return false;
      }

      let matchStatus = false;
      if (tabType === "pending") {
        // Show all pending events (expired or not) so staff can review them
        // PENDING_UNISTAFF and PENDING_COCLUB events should be visible regardless of expiration
        matchStatus = (evt.status ?? "").toUpperCase() === pendingFilter;
      } else if (tabType === "completed") {
        // Show all COMPLETED events regardless of expiration
        matchStatus = (evt.status ?? "").toUpperCase() === "COMPLETED";
      } else if (tabType === "ongoing") {
        // Show all ONGOING events
        matchStatus = (evt.status ?? "").toUpperCase() === "ONGOING";
      } else {
        // Processed tab: APPROVED, REJECTED, or CANCELLED
        matchStatus = (evt.status ?? "").toUpperCase() === "APPROVED" || 
                      (evt.status ?? "").toUpperCase() === "REJECTED" ||
                      (evt.status ?? "").toUpperCase() === "CANCELLED";
      }

      return matchSearch && matchStatus && matchType;
    });

    // Sort by date (newest first)
    const sorted = filtered.sort((a, b) => {
      const dateA = getEventDate(a);
      const dateB = getEventDate(b);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    console.log(`Filtered ${tabType}:`, sorted.length, 'events');
    return sorted;
  };

  const pendingRequests = getFilteredRequests("pending");
  const processedRequests = getFilteredRequests("processed");
  const completedRequests = getFilteredRequests("completed");
  const ongoingRequests = getFilteredRequests("ongoing");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
      case "PENDING_UNISTAFF":
        return (
          <View className="bg-yellow-100 px-2 py-1 rounded-full">
            <Text className="text-yellow-700 text-xs font-medium">Pending UniStaff</Text>
          </View>
        );
      case "PENDING_COCLUB":
        return (
          <View className="bg-orange-100 px-2 py-1 rounded-full">
            <Text className="text-orange-700 text-xs font-medium">Pending CoClub</Text>
          </View>
        );
      case "APPROVED":
        return (
          <View className="bg-green-100 px-2 py-1 rounded-full">
            <Text className="text-green-700 text-xs font-medium">Approved</Text>
          </View>
        );
      case "ONGOING":
        return (
          <View className="bg-purple-100 px-2 py-1 rounded-full">
            <Text className="text-purple-700 text-xs font-medium">Ongoing</Text>
          </View>
        );
      case "COMPLETED":
        return (
          <View className="bg-blue-100 px-2 py-1 rounded-full">
            <Text className="text-blue-700 text-xs font-medium">Completed</Text>
          </View>
        );
      case "REJECTED":
        return (
          <View className="bg-red-100 px-2 py-1 rounded-full">
            <Text className="text-red-700 text-xs font-medium">Rejected</Text>
          </View>
        );
      default:
        return (
          <View className="bg-gray-100 px-2 py-1 rounded-full">
            <Text className="text-gray-700 text-xs font-medium">{status}</Text>
          </View>
        );
    }
  };

  // Compute counts by status from ALL events
  const totalCount = events.length;
  const pendingUnistaffCount = events.filter((e) => 
    (e.status ?? "").toUpperCase() === "PENDING_UNISTAFF"
  ).length;
  const pendingCoclubCount = events.filter((e) => 
    (e.status ?? "").toUpperCase() === "PENDING_COCLUB"
  ).length;
  const approvedCount = events.filter((e) => 
    (e.status ?? "").toUpperCase() === "APPROVED"
  ).length;
  const rejectedCount = events.filter((e) => 
    (e.status ?? "").toUpperCase() === "REJECTED"
  ).length;
  const cancelledCount = events.filter((e) => 
    (e.status ?? "").toUpperCase() === "CANCELLED"
  ).length;
  const completedCount = events.filter((e) => 
    (e.status ?? "").toUpperCase() === "COMPLETED"
  ).length;
  const ongoingCount = events.filter((e) => 
    (e.status ?? "").toUpperCase() === "ONGOING"
  ).length;

  const handleApproveEvent = async (eventId: string | number) => {
    if (processingId) return;
    setProcessingId(eventId);
    try {
      // Find the event to get its budget points
      const event = events.find(e => e.id === eventId);
      const approvedBudgetPoints = event?.budgetPoints || 0;
      
      await putEventStatus(eventId, approvedBudgetPoints);
      await fetchData();
      Alert.alert('Success', `Event approved with ${approvedBudgetPoints} points`);
    } catch (err: any) {
      console.error('Approve failed', err);
      Alert.alert('Error', err?.message || 'Failed to approve event');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectEvent = async (eventId: string | number) => {
    if (processingId) return;
    
    // Show alert to get rejection reason
    Alert.prompt(
      'Reject Event',
      'Please provide a reason for rejecting this event:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setProcessingId(null)
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Error', 'Please provide a reason for rejection');
              setProcessingId(null);
              return;
            }
            
            setProcessingId(eventId);
            try {
              await rejectEvent(eventId, reason);
              await fetchData();
              Alert.alert('Success', 'Event rejected successfully');
            } catch (err: any) {
              console.error('Reject failed', err);
              Alert.alert('Error', err?.message || 'Failed to reject event');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const renderEventItem = ({ item: request }: { item: Event }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/uni-staff/event-requests/${request.id}` as any)}
      className="bg-white rounded-2xl p-4 shadow-lg mb-4"
      activeOpacity={0.7}
    >
      {/* Header with title and badges */}
      <View className="mb-3">
        <View className="flex-row items-center mb-2">
          <Ionicons name="calendar" size={18} color="#10B981" />
          <Text 
            className="text-base font-semibold text-gray-800 ml-2 flex-1" 
            numberOfLines={2}
          >
            {request.name || (request as any).eventName}
          </Text>
        </View>
        
        {/* Status and Type badges */}
        <View className="flex-row items-center gap-2 mt-1">
          {getStatusBadge(request.status || "PENDING")}
          {request.type && (
            <View className={`px-2 py-1 rounded-full ${
              request.type === "PUBLIC" ? "bg-blue-100" : "bg-purple-100"
            }`}>
              <Text className={`text-xs font-medium ${
                request.type === "PUBLIC" ? "text-blue-700" : "text-purple-700"
              }`}>
                {request.type}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
        {request.description}
      </Text>

      {/* Event details in grid layout - 2 columns */}
      <View className="space-y-2 mb-4">
        {/* Row 1: Date/Time (full width for multi-day support) */}
        <View className="bg-gray-50 rounded-lg p-2">
          <EventDateTimeDisplay event={request as any} variant="compact" />
        </View>

        {/* Row 2: Location and Capacity */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-gray-50 rounded-lg p-2">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1 flex-1" numberOfLines={1}>
                {request.locationName || '-'}
              </Text>
            </View>
          </View>
          <View className="flex-1 bg-gray-50 rounded-lg p-2">
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1" numberOfLines={1}>
                {typeof request.maxCheckInCount === 'number' ? `${request.maxCheckInCount} max` : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Row 3: Club */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-gray-50 rounded-lg p-2">
            <View className="flex-row items-center">
              <Ionicons name="business-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1 flex-1" numberOfLines={1}>
                {request.hostClub?.name || request.clubName || '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons for PENDING status */}
      {activeTab === "pending" && (request.status === "PENDING_UNISTAFF" || request.status === "PENDING") && (
        <View className="flex-row gap-2 mt-2">
          <TouchableOpacity
            onPress={() => handleApproveEvent(request.id)}
            disabled={processingId === request.id}
            className={`flex-1 bg-green-500 py-2.5 rounded-xl flex-row items-center justify-center ${
              processingId === request.id ? 'opacity-50' : ''
            }`}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text className="text-white font-medium ml-1 text-sm">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRejectEvent(request.id)}
            disabled={processingId === request.id}
            className={`flex-1 bg-red-500 py-2.5 rounded-xl flex-row items-center justify-center ${
              processingId === request.id ? 'opacity-50' : ''
            }`}
          >
            <Ionicons name="close" size={16} color="white" />
            <Text className="text-white font-medium ml-1 text-sm">Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />
      
      {/* Header */}
      <View className="px-6 py-4 bg-white shadow-sm">
        <Text className="text-2xl font-bold text-gray-800">Event Requests</Text>
        <Text className="text-sm text-gray-500">{totalCount} total events</Text>
      </View>

      <View className="flex-1 px-6 pt-4">
        {/* Stats Cards */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-yellow-500 p-2 rounded-lg mr-2">
                <Ionicons name="time" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-yellow-900">{pendingUnistaffCount}</Text>
                <Text className="text-xs text-yellow-600">UniStaff</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-orange-500 p-2 rounded-lg mr-2">
                <Ionicons name="hourglass" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-orange-900">{pendingCoclubCount}</Text>
                <Text className="text-xs text-orange-600">CoClub</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-purple-500 p-2 rounded-lg mr-2">
                <Ionicons name="play-circle" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-purple-900">{ongoingCount}</Text>
                <Text className="text-xs text-purple-600">Ongoing</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Second row of stats */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-blue-500 p-2 rounded-lg mr-2">
                <Ionicons name="checkmark-done" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-blue-900">{completedCount}</Text>
                <Text className="text-xs text-blue-600">Completed</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-red-500 p-2 rounded-lg mr-2">
                <Ionicons name="close-circle" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-red-900">{rejectedCount}</Text>
                <Text className="text-xs text-red-600">Rejected</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-gray-500 p-2 rounded-lg mr-2">
                <Ionicons name="ban" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-gray-900">{cancelledCount}</Text>
                <Text className="text-xs text-gray-600">Cancelled</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search */}
        <View className="bg-white rounded-xl p-3 shadow-sm mb-4">
          <View className="flex-row items-center">
            <Ionicons name="search" size={18} color="#6B7280" />
            <AppTextInput
              placeholder="Search by event name..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-3 text-gray-700"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter - Type and Pending Status */}
        <View className="bg-white rounded-xl p-3 shadow-sm mb-4">
          <View className="flex-row items-center gap-2">
            {/* Type Filter */}
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-600 mb-2">Type:</Text>
              <TouchableOpacity
                onPress={() => {
                  // Cycle through types
                  const types = ["all", "PUBLIC", "PRIVATE"];
                  const currentIndex = types.indexOf(typeFilter);
                  const nextIndex = (currentIndex + 1) % types.length;
                  setTypeFilter(types[nextIndex]);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
              >
                <Text className="text-xs text-gray-700" numberOfLines={1}>
                  {typeFilter === "all" ? "All Types" : typeFilter}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pending Filter - Only show when in Pending tab */}
            {activeTab === "pending" && (
              <View className="flex-1">
                <Text className="text-xs font-medium text-gray-600 mb-2">Pending:</Text>
                <TouchableOpacity
                  onPress={() => {
                    setPendingFilter(
                      pendingFilter === "PENDING_UNISTAFF" 
                        ? "PENDING_COCLUB" 
                        : "PENDING_UNISTAFF"
                    );
                  }}
                  className={`border rounded-lg px-3 py-2 ${
                    pendingFilter === "PENDING_UNISTAFF"
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-orange-50 border-orange-300"
                  }`}
                >
                  <Text className={`text-xs font-medium ${
                    pendingFilter === "PENDING_UNISTAFF"
                      ? "text-yellow-700"
                      : "text-orange-700"
                  }`} numberOfLines={1}>
                    {pendingFilter === "PENDING_UNISTAFF" ? "UniStaff" : "CoClub"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View className="bg-white rounded-xl p-2 shadow-sm mb-4">
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              onPress={() => setActiveTab("pending")}
              className={`flex-1 py-2 px-2 rounded-lg ${
                activeTab === "pending" ? "bg-emerald-500" : "bg-transparent"
              }`}
              style={{ minWidth: '22%' }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="time" 
                  size={14} 
                  color={activeTab === "pending" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-1 font-medium text-xs ${
                  activeTab === "pending" ? "text-white" : "text-gray-600"
                }`} numberOfLines={1}>
                  Pending ({pendingRequests.length})
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("ongoing")}
              className={`flex-1 py-2 px-2 rounded-lg ${
                activeTab === "ongoing" ? "bg-emerald-500" : "bg-transparent"
              }`}
              style={{ minWidth: '22%' }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="play-circle" 
                  size={14} 
                  color={activeTab === "ongoing" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-1 font-medium text-xs ${
                  activeTab === "ongoing" ? "text-white" : "text-gray-600"
                }`} numberOfLines={1}>
                  Ongoing ({ongoingRequests.length})
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("completed")}
              className={`flex-1 py-2 px-2 rounded-lg ${
                activeTab === "completed" ? "bg-emerald-500" : "bg-transparent"
              }`}
              style={{ minWidth: '22%' }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="checkmark-done" 
                  size={14} 
                  color={activeTab === "completed" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-1 font-medium text-xs ${
                  activeTab === "completed" ? "text-white" : "text-gray-600"
                }`} numberOfLines={1}>
                  Completed ({completedRequests.length})
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("processed")}
              className={`flex-1 py-2 px-2 rounded-lg ${
                activeTab === "processed" ? "bg-emerald-500" : "bg-transparent"
              }`}
              style={{ minWidth: '22%' }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="list" 
                  size={14} 
                  color={activeTab === "processed" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-1 font-medium text-xs ${
                  activeTab === "processed" ? "text-white" : "text-gray-600"
                }`} numberOfLines={1}>
                  Other ({processedRequests.length})
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Events List with FlatList */}
        <FlatList
          data={
            activeTab === "pending" 
              ? pendingRequests 
              : activeTab === "ongoing"
              ? ongoingRequests
              : activeTab === "completed" 
              ? completedRequests 
              : processedRequests
          }
          renderItem={renderEventItem}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="bg-white rounded-xl p-8 shadow-sm">
              <View className="items-center">
                <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
                <Text className="text-center text-gray-500 mt-2">
                  {loading 
                    ? "Loading events..." 
                    : error 
                    ? error 
                    : `No ${activeTab} events found`}
                </Text>
                {!loading && !error && (
                  <Text className="text-center text-gray-400 text-xs mt-1">
                    Try adjusting your filters
                  </Text>
                )}
              </View>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
