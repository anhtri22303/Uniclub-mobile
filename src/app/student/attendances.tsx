import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import {
  useMemberAttendanceHistory,
  useMyMemberships,
  type AttendanceRecord
} from '@hooks/useQueryHooks';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SimpleClub {
  id: number;
  name: string;
}

// Status badge component
const AttendanceStatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'PRESENT':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          text: 'text-green-700',
        };
      case 'LATE':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-500',
          text: 'text-yellow-700',
        };
      case 'ABSENT':
        return {
          bg: 'bg-red-100',
          border: 'border-red-500',
          text: 'text-red-700',
        };
      case 'EXCUSED':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          text: 'text-blue-700',
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-400',
          text: 'text-gray-700',
        };
    }
  };

  const style = getStatusStyle();

  return (
    <View className={`px-3 py-1 rounded-full border ${style.bg} ${style.border}`}>
      <Text className={`text-xs font-bold ${style.text}`}>{status}</Text>
    </View>
  );
};

export default function StudentAttendancesPage() {
  const { user } = useAuthStore();
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [userClubsDetails, setUserClubsDetails] = useState<SimpleClub[]>([]);
  const [showClubDropdown, setShowClubDropdown] = useState(false);

  // Fetch current user's memberships
  const {
    data: myMemberships = [],
    isLoading: isLoadingMemberships,
    refetch: refetchMemberships,
  } = useMyMemberships();

  // Extract club details from memberships
  useEffect(() => {
    if (myMemberships.length > 0) {
      const details = myMemberships.map((membership: any) => ({
        id: membership.clubId,
        name: membership.clubName,
      }));

      setUserClubsDetails(details);

      // Auto-select first club
      if (details.length > 0 && selectedClubId === null) {
        setSelectedClubId(details[0].id);
      }
    }
  }, [myMemberships, selectedClubId]);

  // Get attendance history for the selected club
  const {
    data: rawHistoryResponse,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useMemberAttendanceHistory(selectedClubId);

  // Debug logging
  useEffect(() => {
    console.log('=== Attendance Debug Info ===');
    console.log('Selected Club ID:', selectedClubId);
    console.log('Raw History Response:', rawHistoryResponse);
    console.log('Is Loading History:', isLoadingHistory);
  }, [selectedClubId, rawHistoryResponse, isLoadingHistory]);

  // Extract and sort attendance records (newest first)
  const attendanceRecords = useMemo(() => {
    const records = rawHistoryResponse?.data?.attendanceHistory || [];
    // Sort by date descending (newest first) - same as web
    const sorted = [...records].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Descending: newest first
    });
    console.log('Extracted & Sorted Attendance Records:', sorted);
    return sorted;
  }, [rawHistoryResponse]);

  // Loading state
  const isLoading = isLoadingMemberships || isLoadingHistory;

  // Refresh handler
  const onRefresh = async () => {
    await Promise.all([refetchMemberships(), refetchHistory()]);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Attendance History</Text>
          <Text className="text-sm text-gray-600 mt-1">
            View your personal attendance records
          </Text>
        </View>

        {/* Club Selector */}
        <View className="px-4 py-4 bg-white">
          {userClubsDetails.length > 0 ? (
            <View>
              <Text className="text-xs font-semibold text-gray-500 mb-2">SELECT CLUB</Text>
              <TouchableOpacity
                onPress={() => setShowClubDropdown(!showClubDropdown)}
                className="flex-row items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-4 py-3"
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="business" size={20} color="#6B7280" />
                  <Text className="ml-3 text-base text-gray-900 font-medium">
                    {userClubsDetails.find((c) => c.id === selectedClubId)?.name ||
                      'Select a club'}
                  </Text>
                </View>
                <Ionicons
                  name={showClubDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {/* Dropdown */}
              {showClubDropdown && (
                <View className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                  {userClubsDetails.map((club) => (
                    <TouchableOpacity
                      key={club.id}
                      onPress={() => {
                        setSelectedClubId(club.id);
                        setShowClubDropdown(false);
                      }}
                      className={`px-4 py-3 flex-row items-center border-b border-gray-100 ${
                        selectedClubId === club.id ? 'bg-teal-50' : ''
                      }`}
                    >
                      <Ionicons
                        name={selectedClubId === club.id ? 'checkmark-circle' : 'business'}
                        size={20}
                        color={selectedClubId === club.id ? '#0D9488' : '#6B7280'}
                      />
                      <Text
                        className={`ml-3 text-base ${
                          selectedClubId === club.id
                            ? 'text-teal-700 font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {club.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="bg-gray-50 rounded-lg px-4 py-3">
              <ActivityIndicator size="small" color="#0D9488" />
              <Text className="text-center text-gray-500 text-sm mt-2">
                Loading clubs...
              </Text>
            </View>
          )}
        </View>

        {/* Attendance List */}
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          }
        >
          {isLoading && attendanceRecords.length === 0 ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#0D9488" />
              <Text className="text-gray-500 mt-4">Loading attendance records...</Text>
            </View>
          ) : myMemberships.length === 0 ? (
            <View className="items-center py-20">
              <Ionicons name="people-outline" size={64} color="#9CA3AF" />
              <Text className="text-lg font-semibold text-gray-900 mb-2 mt-4">
                No club membership found
              </Text>
              <Text className="text-gray-600 text-center px-8">
                Your attendance history will appear here once you join a club.
              </Text>
            </View>
          ) : attendanceRecords.length === 0 ? (
            <View className="items-center py-20">
              <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
              <Text className="text-lg font-semibold text-gray-900 mb-2 mt-4">
                No data Attendance
              </Text>
              <Text className="text-gray-600 text-center px-8">
                There are no attendance records for this club yet.
              </Text>
            </View>
          ) : (
            <View className="py-4">
              {attendanceRecords.map((record: AttendanceRecord, index: number) => (
                <View
                  key={index}
                  className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden border border-gray-200"
                >
                  <View className="p-4">
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-bold text-gray-900 mb-1">
                          {record.date
                            ? formatDate(record.date)
                            : 'Unknown Date'}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="business" size={14} color="#6B7280" />
                          <Text className="text-sm text-gray-600 ml-1">
                            {record.clubName || 'Unknown Club'}
                          </Text>
                        </View>
                      </View>
                      <AttendanceStatusBadge status={record.status} />
                    </View>

                    {/* Note */}
                    {record.note ? (
                      <View className="bg-gray-50 rounded-lg p-3">
                        <Text className="text-xs font-semibold text-gray-700 mb-1">
                          Note:
                        </Text>
                        <Text className="text-sm text-gray-600">{record.note}</Text>
                      </View>
                    ) : (
                      <View className="bg-gray-50 rounded-lg p-3">
                        <Text className="text-sm text-gray-500 italic">
                          No note for this attendance.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}

