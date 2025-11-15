import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface StatisticsCardsProps {
  totalClubs: number;
  totalPolicies: number;
  totalClubApplications: number;
  pendingClubApplications: number;
  completedClubApplications: number;
  rejectedClubApplications: number;
  totalEventRequests: number;
  pendingEvents: number;
  approvedEvents: number;
  completedEvents: number;
  rejectedEvents: number;
  totalLocations: number;
  totalTags: number;
  coreTags: number;
  totalMajors: number;
  totalFeedbacks: number;
  avgRating: number;
  totalMultiplierPolicies: number;
  totalPointRequests: number;
  pendingPointRequests: number;
  onClubsPress?: () => void;
  onApplicationsPress?: () => void;
  onEventsPress?: () => void;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  totalClubs,
  totalPolicies,
  totalClubApplications,
  pendingClubApplications,
  completedClubApplications,
  rejectedClubApplications,
  totalEventRequests,
  pendingEvents,
  approvedEvents,
  completedEvents,
  rejectedEvents,
  totalLocations,
  totalTags,
  coreTags,
  totalMajors,
  totalFeedbacks,
  avgRating,
  totalMultiplierPolicies,
  totalPointRequests,
  pendingPointRequests,
  onClubsPress,
  onApplicationsPress,
  onEventsPress,
}) => {
  // Debug: Log received props
  React.useEffect(() => {
    console.log('📊 StatisticsCards Props:', {
      totalClubApplications,
      pendingClubApplications,
      completedClubApplications,
      rejectedClubApplications
    });
  }, [totalClubApplications, pendingClubApplications, completedClubApplications, rejectedClubApplications]);

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <Text className="text-lg font-bold text-gray-800 mb-4">📊 Overview Statistics</Text>
      
      {/* Main Overview Stats */}
      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity
          onPress={onClubsPress}
          className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-200"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-blue-700 font-semibold">Total Clubs</Text>
            <View className="bg-blue-500 p-1.5 rounded-lg">
              <Ionicons name="business" size={16} color="white" />
            </View>
          </View>
          <Text className="text-2xl font-bold text-blue-700">{totalClubs}</Text>
        </TouchableOpacity>

        <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-200">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-green-700 font-semibold">Policies</Text>
            <View className="bg-green-500 p-1.5 rounded-lg">
              <Ionicons name="shield-checkmark" size={16} color="white" />
            </View>
          </View>
          <Text className="text-2xl font-bold text-green-700">{totalPolicies}</Text>
        </View>
      </View>

      {/* Divider */}
      <View className="border-t border-gray-200 my-3" />

      {/* Club Applications Section */}
      <View className="mb-4">
        <TouchableOpacity
          onPress={onApplicationsPress}
          className="flex-row items-center justify-between mb-3"
          activeOpacity={0.7}
        >
          <Text className="text-sm font-bold text-gray-700">Club Applications</Text>
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-indigo-600 mr-2">{totalClubApplications}</Text>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </View>
        </TouchableOpacity>
        
        <View className="flex-row gap-2">
          <View className="flex-1 bg-amber-50 rounded-lg p-2 border border-amber-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="time" size={14} color="#D97706" />
              <Text className="text-xs text-amber-700 font-semibold ml-1">Pending</Text>
            </View>
            <Text className="text-xl font-bold text-amber-700">{pendingClubApplications}</Text>
          </View>

          <View className="flex-1 bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text className="text-xs text-emerald-700 font-semibold ml-1">Completed</Text>
            </View>
            <Text className="text-xl font-bold text-emerald-700">{completedClubApplications}</Text>
          </View>

          <View className="flex-1 bg-red-50 rounded-lg p-2 border border-red-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="close-circle" size={14} color="#DC2626" />
              <Text className="text-xs text-red-700 font-semibold ml-1">Rejected</Text>
            </View>
            <Text className="text-xl font-bold text-red-700">{rejectedClubApplications}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View className="border-t border-gray-200 my-3" />

      {/* Event Requests Section */}
      <View className="mb-4">
        <TouchableOpacity
          onPress={onEventsPress}
          className="flex-row items-center justify-between mb-3"
          activeOpacity={0.7}
        >
          <Text className="text-sm font-bold text-gray-700">Event Requests</Text>
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-purple-600 mr-2">{totalEventRequests}</Text>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </View>
        </TouchableOpacity>
        
        <View className="flex-row gap-2 mb-2">
          <View className="flex-1 bg-amber-50 rounded-lg p-2 border border-amber-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="time" size={14} color="#D97706" />
              <Text className="text-xs text-amber-700 font-semibold ml-1">Pending</Text>
            </View>
            <Text className="text-xl font-bold text-amber-700">{pendingEvents}</Text>
          </View>

          <View className="flex-1 bg-green-50 rounded-lg p-2 border border-green-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text className="text-xs text-green-700 font-semibold ml-1">Completed</Text>
            </View>
            <Text className="text-xl font-bold text-green-700">{approvedEvents}</Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 bg-blue-50 rounded-lg p-2 border border-blue-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="checkmark-done-circle" size={14} color="#2563EB" />
              <Text className="text-xs text-blue-700 font-semibold ml-1">Completed</Text>
            </View>
            <Text className="text-xl font-bold text-blue-700">{completedEvents}</Text>
          </View>

          <View className="flex-1 bg-red-50 rounded-lg p-2 border border-red-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="close-circle" size={14} color="#DC2626" />
              <Text className="text-xs text-red-700 font-semibold ml-1">Rejected</Text>
            </View>
            <Text className="text-xl font-bold text-red-700">{rejectedEvents}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View className="border-t border-gray-200 my-3" />

      {/* System Data Section */}
      <View className="mb-4">
        <Text className="text-sm font-bold text-gray-700 mb-3">System Data</Text>
        
        <View className="flex-row flex-wrap gap-2">
          <View className="flex-1 min-w-[48%] bg-purple-50 rounded-lg p-2 border border-purple-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="location" size={14} color="#9333EA" />
              <Text className="text-xs text-purple-700 font-semibold ml-1">Locations</Text>
            </View>
            <Text className="text-xl font-bold text-purple-700">{totalLocations}</Text>
          </View>

          <View className="flex-1 min-w-[48%] bg-indigo-50 rounded-lg p-2 border border-indigo-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="pricetag" size={14} color="#4F46E5" />
              <Text className="text-xs text-indigo-700 font-semibold ml-1">Tags</Text>
            </View>
            <Text className="text-xl font-bold text-indigo-700">{totalTags}</Text>
            <Text className="text-xs text-indigo-500">{coreTags} core</Text>
          </View>

          <View className="flex-1 min-w-[48%] bg-teal-50 rounded-lg p-2 border border-teal-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="school" size={14} color="#0D9488" />
              <Text className="text-xs text-teal-700 font-semibold ml-1">Majors</Text>
            </View>
            <Text className="text-xl font-bold text-teal-700">{totalMajors}</Text>
          </View>

          <View className="flex-1 min-w-[48%] bg-orange-50 rounded-lg p-2 border border-orange-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="trending-up" size={14} color="#EA580C" />
              <Text className="text-xs text-orange-700 font-semibold ml-1">Multipliers</Text>
            </View>
            <Text className="text-xl font-bold text-orange-700">{totalMultiplierPolicies}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View className="border-t border-gray-200 my-3" />

      {/* Additional Metrics Section */}
      <View>
        <Text className="text-sm font-bold text-gray-700 mb-3">Additional Metrics</Text>
        
        <View className="flex-row gap-2">
          <View className="flex-1 bg-pink-50 rounded-lg p-2 border border-pink-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="chatbubbles" size={14} color="#DB2777" />
              <Text className="text-xs text-pink-700 font-semibold ml-1">Feedbacks</Text>
            </View>
            <Text className="text-xl font-bold text-pink-700">{totalFeedbacks}</Text>
            <Text className="text-xs text-pink-500">Avg: {avgRating.toFixed(1)} ⭐</Text>
          </View>

          <View className="flex-1 bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            <View className="flex-row items-center mb-1">
              <Ionicons name="cash" size={14} color="#059669" />
              <Text className="text-xs text-emerald-700 font-semibold ml-1">Point Requests</Text>
            </View>
            <Text className="text-xl font-bold text-emerald-700">{totalPointRequests}</Text>
            <Text className="text-xs text-emerald-500">{pendingPointRequests} pending</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default StatisticsCards;
