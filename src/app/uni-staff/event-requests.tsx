import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import {
  Club,
  Event,
  fetchClub,
  fetchEvent,
  fetchLocation,
  Location,
  putEventStatus
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
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UniStaffEventRequestsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pending");

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
      const [eventsRes, locationsRes, clubsRes] = await Promise.all([
        fetchEvent(),
        fetchLocation(),
        fetchClub()
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
      
      setEvents(eventsContent);
      setLocations(locationsContent);
      setClubs(clubsContent);
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
  const getFilteredRequests = (tabType: "pending" | "processed") => {
    return events.filter((evt) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        evt.name?.toLowerCase().includes(q) ||
        String(evt.clubId || "").includes(q);

      const matchType = typeFilter === "all" ? true : (evt.type || "") === typeFilter;

      let matchStatus = false;
      if (tabType === "pending") {
        matchStatus = (evt.status ?? "").toUpperCase() === "PENDING";
      } else {
        matchStatus = (evt.status ?? "").toUpperCase() === "APPROVED" || 
                      (evt.status ?? "").toUpperCase() === "REJECTED";
      }

      return matchSearch && matchStatus && matchType;
    });
  };

  const pendingRequests = getFilteredRequests("pending");
  const processedRequests = getFilteredRequests("processed");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <View className="bg-yellow-100 px-2 py-1 rounded-full">
            <Text className="text-yellow-700 text-xs font-medium">Pending</Text>
          </View>
        );
      case "APPROVED":
        return (
          <View className="bg-green-100 px-2 py-1 rounded-full">
            <Text className="text-green-700 text-xs font-medium">Approved</Text>
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

  // Compute counts by status
  const totalCount = events.length;
  const pendingCount = events.filter((e) => (e.status ?? "").toUpperCase() === "PENDING").length;
  const approvedCount = events.filter((e) => (e.status ?? "").toUpperCase() === "APPROVED").length;
  const rejectedCount = events.filter((e) => (e.status ?? "").toUpperCase() === "REJECTED").length;

  const handleApproveEvent = async (eventId: string | number) => {
    if (processingId) return;
    setProcessingId(eventId);
    try {
      await putEventStatus(eventId, "APPROVED");
      await fetchData();
      Alert.alert('Success', `Event approved successfully`);
    } catch (err: any) {
      console.error('Approve failed', err);
      Alert.alert('Error', err?.message || 'Failed to approve event');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectEvent = async (eventId: string | number) => {
    if (processingId) return;
    setProcessingId(eventId);
    try {
      await putEventStatus(eventId, "REJECTED");
      await fetchData();
      Alert.alert('Success', `Event rejected successfully`);
    } catch (err: any) {
      console.error('Reject failed', err);
      Alert.alert('Error', err?.message || 'Failed to reject event');
    } finally {
      setProcessingId(null);
    }
  };

  const renderEventItem = ({ item: request }: { item: Event }) => (
    <View className="bg-white rounded-2xl p-4 shadow-lg mb-4">
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
        {/* Row 1: Date and Location */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-gray-50 rounded-lg p-2">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1" numberOfLines={1}>
                {request.date ? new Date(request.date).toLocaleDateString() : (request as any).eventDate}
              </Text>
            </View>
          </View>
          <View className="flex-1 bg-gray-50 rounded-lg p-2">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1 flex-1" numberOfLines={1}>
                {(() => {
                  const loc = locations.find((l) => String(l.id) === String(request.locationId));
                  if (loc && loc.name) return loc.name;
                  if ((request as any).venue) return (request as any).venue;
                  return `Loc #${request.locationId ?? "N/A"}`;
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Row 2: Capacity and Club */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-gray-50 rounded-lg p-2">
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1" numberOfLines={1}>
                {(() => {
                  const cap = getLocationCapacity(request.locationId);
                  if (cap !== null && cap !== undefined) return `${cap}`;
                  if ((request as any).expectedAttendees) return `${(request as any).expectedAttendees}`;
                  return "-";
                })()}
              </Text>
            </View>
          </View>
          <View className="flex-1 bg-gray-50 rounded-lg p-2">
            <View className="flex-row items-center">
              <Ionicons name="business-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-600 ml-1 flex-1" numberOfLines={1}>
                {(() => {
                  const club = clubs.find((c) => String(c.id) === String(request.clubId));
                  if (club && club.name) return club.name;
                  if ((request as any).requestedBy) return (request as any).requestedBy;
                  return `Club #${request.clubId || "?"}`;
                })()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons for PENDING status */}
      {activeTab === "pending" && request.status === "PENDING" && (
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
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
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
                <Text className="text-lg font-bold text-yellow-900">{pendingCount}</Text>
                <Text className="text-xs text-yellow-600">Pending</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-green-500 p-2 rounded-lg mr-2">
                <Ionicons name="checkmark-circle" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-green-900">{approvedCount}</Text>
                <Text className="text-xs text-green-600">Approved</Text>
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
        </View>

        {/* Search */}
        <View className="bg-white rounded-xl p-3 shadow-sm mb-4">
          <View className="flex-row items-center">
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
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

        {/* Filter - Type only */}
        <View className="bg-white rounded-xl p-3 shadow-sm mb-4">
          <View className="flex-row items-center">
            <Text className="text-xs font-medium text-gray-600 mr-3">Type:</Text>
            <TouchableOpacity
              onPress={() => {
                // Cycle through types
                const types = ["all", "PUBLIC", "PRIVATE"];
                const currentIndex = types.indexOf(typeFilter);
                const nextIndex = (currentIndex + 1) % types.length;
                setTypeFilter(types[nextIndex]);
              }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
            >
              <Text className="text-xs text-gray-700" numberOfLines={1}>
                {typeFilter === "all" ? "All Types" : typeFilter}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="bg-white rounded-xl p-2 shadow-sm mb-4">
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab("pending")}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === "pending" ? "bg-emerald-500" : "bg-transparent"
              }`}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="time" 
                  size={16} 
                  color={activeTab === "pending" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-2 font-medium text-sm ${
                  activeTab === "pending" ? "text-white" : "text-gray-600"
                }`}>
                  Pending ({pendingRequests.length})
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("processed")}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === "processed" ? "bg-emerald-500" : "bg-transparent"
              }`}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={activeTab === "processed" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-2 font-medium text-sm ${
                  activeTab === "processed" ? "text-white" : "text-gray-600"
                }`}>
                  Processed ({processedRequests.length})
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Events List with FlatList */}
        <FlatList
          data={activeTab === "pending" ? pendingRequests : processedRequests}
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
