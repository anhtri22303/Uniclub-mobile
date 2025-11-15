import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface ClubRanking {
  rank: number;
  clubId: number;
  clubName: string;
  totalPoints: number;
  leaderName?: string;
  majorName?: string;
  memberCount?: number;
}

interface TopClubsRankingProps {
  rankings: ClubRanking[];
  totalUniversityPoints: number;
  isLoading?: boolean;
  sortBy?: 'rank' | 'points';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: 'rank' | 'points', sortOrder: 'asc' | 'desc') => void;
  onClubPress?: (clubId: number) => void;
}

export const TopClubsRanking: React.FC<TopClubsRankingProps> = ({
  rankings,
  totalUniversityPoints,
  isLoading = false,
  sortBy = 'rank',
  sortOrder = 'asc',
  onSortChange,
  onClubPress,
}) => {
  const [localSortBy, setLocalSortBy] = useState<'rank' | 'points'>(sortBy);
  const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc'>(sortOrder);

  const handleSortToggle = (field: 'rank' | 'points') => {
    let newOrder: 'asc' | 'desc' = 'asc';
    
    if (localSortBy === field) {
      newOrder = localSortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    setLocalSortBy(field);
    setLocalSortOrder(newOrder);
    onSortChange?.(field, newOrder);
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-orange-500';
    if (rank <= 5) return 'bg-blue-400';
    return 'bg-gray-300';
  };

  const getRankTextColor = (rank: number) => {
    if (rank <= 5) return 'text-white';
    return 'text-gray-700';
  };

  const getAvatarColor = (index: number) => {
    const colors = ['bg-purple-500', 'bg-cyan-500', 'bg-violet-500', 'bg-purple-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-gray-800">🏢 All Clubs List</Text>
          <View className="flex-row items-center">
            <Ionicons name="trophy" size={16} color="#A855F7" />
            <Text className="text-sm font-semibold text-purple-600 ml-1">
              Total University Points: {totalUniversityPoints.toLocaleString()}
            </Text>
          </View>
        </View>
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color="#14B8A6" />
        </View>
      </View>
    );
  }

  if (rankings.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-gray-800">🏢 All Clubs List</Text>
          <View className="flex-row items-center">
            <Ionicons name="trophy" size={16} color="#A855F7" />
            <Text className="text-sm font-semibold text-purple-600 ml-1">
              Total University Points: 0
            </Text>
          </View>
        </View>
        <View className="items-center justify-center py-8">
          <Text className="text-4xl mb-2">🏛️</Text>
          <Text className="text-base font-semibold text-gray-900 mb-1">No Clubs Found</Text>
          <Text className="text-sm text-gray-500 text-center">
            Clubs will appear here once created
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-gray-800">🏢 All Clubs List</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Sort and filter clubs</Text>
          <View className="flex-row items-center">
            <Ionicons name="trophy" size={14} color="#A855F7" />
            <Text className="text-xs font-semibold text-purple-600 ml-1">
              Total University Points: {totalUniversityPoints.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Sort Controls */}
      <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <Ionicons name="filter" size={16} color="#6B7280" />
          <TouchableOpacity
            onPress={() => handleSortToggle('rank')}
            className="flex-row items-center ml-2 px-3 py-1 rounded-lg bg-gray-100"
            activeOpacity={0.7}
          >
            <Text className={`text-xs font-semibold ${localSortBy === 'rank' ? 'text-gray-800' : 'text-gray-600'}`}>
              Sort by Rank
            </Text>
            {localSortBy === 'rank' && (
              <Ionicons 
                name={localSortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} 
                size={12} 
                color="#1F2937"
                style={{ marginLeft: 4 }}
              />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => handleSortToggle('rank')}
            className={`px-3 py-1 rounded-lg ${localSortOrder === 'asc' && localSortBy === 'rank' ? 'bg-teal-500' : 'bg-gray-200'}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="arrow-up" size={14} color={localSortOrder === 'asc' && localSortBy === 'rank' ? 'white' : '#6B7280'} />
              <Text className={`text-xs font-semibold ml-1 ${localSortOrder === 'asc' && localSortBy === 'rank' ? 'text-white' : 'text-gray-600'}`}>
                Ascending
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSortToggle('rank')}
            className={`px-3 py-1 rounded-lg ${localSortOrder === 'desc' && localSortBy === 'rank' ? 'bg-gray-700' : 'bg-gray-200'}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="arrow-down" size={14} color={localSortOrder === 'desc' && localSortBy === 'rank' ? 'white' : '#6B7280'} />
              <Text className={`text-xs font-semibold ml-1 ${localSortOrder === 'desc' && localSortBy === 'rank' ? 'text-white' : 'text-gray-600'}`}>
                Descending
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Club List */}
      <View className="gap-3">
        {rankings.map((club, index) => (
          <TouchableOpacity
            key={`club-${club.clubId}-${club.rank}`}
            onPress={() => onClubPress?.(club.clubId)}
            className="flex-row items-center p-3 bg-gray-50 rounded-xl border border-gray-200"
            activeOpacity={0.7}
          >
            {/* Rank Badge */}
            <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${getRankBadgeColor(club.rank)}`}>
              <Text className={`text-sm font-bold ${getRankTextColor(club.rank)}`}>
                #{club.rank}
              </Text>
            </View>

            {/* Avatar */}
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${getAvatarColor(index)}`}>
              <Text className="text-white font-bold text-base">
                {club.clubName.charAt(0).toUpperCase()}
              </Text>
            </View>

            {/* Club Info */}
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900 mb-0.5">
                {club.clubName}
              </Text>
              {club.leaderName && (
                <Text className="text-xs text-gray-500">
                  Leader: {club.leaderName}
                </Text>
              )}
              {club.majorName && (
                <Text className="text-xs text-gray-500">
                  Major: {club.majorName}
                </Text>
              )}
            </View>

            {/* Points & Members */}
            <View className="items-end">
              <View className="flex-row items-center mb-1">
                <Ionicons name="trophy" size={12} color="#A855F7" />
                <Text className="text-sm font-bold text-purple-600 ml-1">
                  {club.totalPoints.toLocaleString()}
                </Text>
              </View>
              <Text className="text-xs text-gray-500">Points</Text>
              {club.memberCount !== undefined && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="people" size={12} color="#3B82F6" />
                  <Text className="text-xs font-semibold text-blue-600 ml-1">
                    {club.memberCount}
                  </Text>
                  <Text className="text-xs text-gray-500 ml-1">Members</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default TopClubsRanking;
