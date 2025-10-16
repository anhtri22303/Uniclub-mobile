import NavigationBar from '@components/navigation/NavigationBar';
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
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UniStaffEventRequestsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | string | null>(null);

  const getLocationById = (id: string | number | undefined) => {
    if (id === undefined || id === null) return null;
    return locations.find((l) => String(l.id) === String(id)) ?? null;
  };

  const getLocationCapacity = (id: string | number | undefined) => {
    const loc: any = getLocationById(id);
    if (!loc) return null;
    return loc.capacity ?? loc.maxCapacity ?? loc.seatingCapacity ?? null;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [eventsRes, locationsRes, clubsRes] = await Promise.all([
          fetchEvent(),
          fetchLocation(),
          fetchClub()
        ]);
        
        if (mounted) {
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
        }
      } catch (err: any) {
        console.error("Error in events-req page:", err);
        if (mounted) setError(err?.message || "Failed to fetch events or locations");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter events based on API shape
  const filteredRequests = events.filter((evt) => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      q === "" ||
      evt.name?.toLowerCase().includes(q) ||
      String(evt.clubId || "").includes(q);

    const matchStatus = statusFilter === "all" ? true : ((evt.status ?? evt.type) === statusFilter);
    const matchCategory = categoryFilter === "all" ? true : (evt.category || "") === categoryFilter;
    const matchType = typeFilter === "all" ? true : (evt.type || "") === typeFilter;

    return matchSearch && matchStatus && matchCategory && matchType;
  });

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

  const handleLogout = async () => {
    await logout();
    router.replace('/login' as any);
  };

  const handleApproveEvent = async (eventId: string | number) => {
    if (processingId) return;
    setProcessingId(eventId);
    try {
      await putEventStatus(eventId, "APPROVED");
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: "APPROVED" } : ev));
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
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: "REJECTED" } : ev));
      Alert.alert('Success', `Event rejected successfully`);
    } catch (err: any) {
      console.error('Reject failed', err);
      Alert.alert('Error', err?.message || 'Failed to reject event');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <Text className="text-2xl font-bold text-gray-800">Event Requests</Text>
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center bg-red-500 px-4 py-2 rounded-xl"
        >
          <Ionicons name="log-out" size={20} color="white" />
          <Text className="text-white font-medium ml-2">Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-lg">
            <View className="flex-row items-center">
              <View className="bg-yellow-500 p-2 rounded-lg mr-3">
                <Ionicons name="time" size={20} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-yellow-900">{pendingCount}</Text>
                <Text className="text-xs text-yellow-600">Pending</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 shadow-lg">
            <View className="flex-row items-center">
              <View className="bg-green-500 p-2 rounded-lg mr-3">
                <Ionicons name="checkmark-circle" size={20} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-green-900">{approvedCount}</Text>
                <Text className="text-xs text-green-600">Approved</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 shadow-lg">
            <View className="flex-row items-center">
              <View className="bg-red-500 p-2 rounded-lg mr-3">
                <Ionicons name="close-circle" size={20} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-red-900">{rejectedCount}</Text>
                <Text className="text-xs text-red-600">Rejected</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search */}
        <View className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <View className="flex-row items-center">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search by event name or organizer..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-3 text-gray-700"
            />
          </View>
        </View>

        {/* Filters */}
        <View className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Status</Text>
              <View className="border border-gray-300 rounded-xl px-3 py-2">
                <Text className="text-gray-600">
                  {statusFilter === "all" ? "All Status" : statusFilter}
                </Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
              <View className="border border-gray-300 rounded-xl px-3 py-2">
                <Text className="text-gray-600">
                  {typeFilter === "all" ? "All Types" : typeFilter}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Events List */}
        {loading ? (
          <View className="bg-white rounded-2xl p-8 shadow-lg">
            <Text className="text-center text-gray-500">Loading events...</Text>
          </View>
        ) : error ? (
          <View className="bg-white rounded-2xl p-8 shadow-lg">
            <Text className="text-center text-red-500">{error}</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 shadow-lg">
            <Text className="text-center text-gray-500">No events found</Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <View key={request.id} className="bg-white rounded-2xl p-6 shadow-lg mb-4">
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="calendar" size={20} color="#6B7280" />
                    <Text className="text-lg font-semibold text-gray-800 ml-2">
                      {request.name || request.eventName}
                    </Text>
                    {getStatusBadge(request.status || request.type)}
                  </View>
                  <Text className="text-gray-600 mb-3">{request.description}</Text>
                  <View className="flex-row items-center gap-4 text-sm text-gray-500">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={16} />
                      <Text className="ml-1">
                        {request.date ? new Date(request.date).toLocaleDateString() : request.eventDate}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="location" size={16} />
                      <Text className="ml-1">
                        {(() => {
                          const loc = locations.find((l) => String(l.id) === String(request.locationId));
                          if (loc && loc.name) return loc.name;
                          if (request.venue) return request.venue;
                          return `Location #${request.locationId ?? "N/A"}`;
                        })()}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="people" size={16} />
                      <Text className="ml-1">
                        {(() => {
                          const cap = getLocationCapacity(request.locationId);
                          if (cap !== null && cap !== undefined) return `${cap} capacity`;
                          if (request.expectedAttendees) return `${request.expectedAttendees} attendees`;
                          return "-";
                        })()}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="business" size={16} />
                      <Text className="ml-1">
                        {(() => {
                          const club = clubs.find((c) => String(c.id) === String(request.clubId));
                          if (club && club.name) return club.name;
                          if (request.requestedBy) return request.requestedBy;
                          return `Club #${request.clubId || "?"}`;
                        })()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {request.status === "PENDING" && (
                <View className="flex-row justify-end gap-2">
                  <TouchableOpacity
                    onPress={() => handleApproveEvent(request.id)}
                    disabled={processingId === request.id}
                    className="bg-green-500 px-4 py-2 rounded-xl flex-row items-center"
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text className="text-white font-medium ml-1">Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRejectEvent(request.id)}
                    disabled={processingId === request.id}
                    className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center"
                  >
                    <Ionicons name="close" size={16} color="white" />
                    <Text className="text-white font-medium ml-1">Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
