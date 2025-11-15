import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Club {
  clubId: number;
  name: string;
  description?: string;
  memberCount?: number;
  ranking?: number;
  logo?: string;
  category?: string;
  status?: string;
  foundedDate?: string;
}

interface AllClubsListProps {
  clubs: Club[];
  showSearch?: boolean;
  maxItems?: number;
  showAll?: boolean;
  onViewAll?: () => void;
  onItemPress?: (clubId: number) => void;
}

export const AllClubsList: React.FC<AllClubsListProps> = ({
  clubs,
  showSearch = false,
  maxItems = 5,
  showAll = false,
  onViewAll,
  onItemPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClubs = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedClubs = showAll
    ? filteredClubs
    : filteredClubs.slice(0, maxItems);

  const getRankingColor = (ranking?: number) => {
    if (!ranking) return 'text-gray-500';
    if (ranking <= 3) return 'text-yellow-600';
    if (ranking <= 10) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getRankingEmoji = (ranking?: number) => {
    if (!ranking) return '🏛️';
    if (ranking === 1) return '🥇';
    if (ranking === 2) return '🥈';
    if (ranking === 3) return '🥉';
    return '🏆';
  };

  if (clubs.length === 0) {
    return (
      <View className="bg-white rounded-xl p-6 items-center justify-center border border-gray-200">
        <Text className="text-4xl mb-2">🏛️</Text>
        <Text className="text-base font-semibold text-gray-900 mb-1">
          No Clubs Found
        </Text>
        <Text className="text-sm text-gray-500 text-center">
          Clubs will appear here once created
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {showSearch && (
        <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TextInput
            className="px-4 py-3 text-sm"
            placeholder="Search clubs by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}

      {displayedClubs.length === 0 ? (
        <View className="bg-white rounded-xl p-6 items-center justify-center border border-gray-200">
          <Text className="text-4xl mb-2">🔍</Text>
          <Text className="text-base font-semibold text-gray-900 mb-1">
            No Results
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            No clubs match your search
          </Text>
        </View>
      ) : (
        <>
          {displayedClubs.map((club, index) => (
            <TouchableOpacity
              key={`club-${club.clubId}-${index}`}
              onPress={() => onItemPress?.(club.clubId)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              activeOpacity={0.7}
              disabled={!onItemPress}
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center mb-1">
                    {club.ranking && (
                      <Text className="text-lg mr-2">
                        {getRankingEmoji(club.ranking)}
                      </Text>
                    )}
                    <Text className="text-base font-bold text-gray-900 flex-1">
                      {club.name}
                    </Text>
                  </View>
                  {club.category && (
                    <Text className="text-xs text-gray-500 mb-1">
                      {club.category}
                    </Text>
                  )}
                </View>
                {club.ranking && (
                  <View className="items-center">
                    <Text
                      className={`text-sm font-bold ${getRankingColor(
                        club.ranking
                      )}`}
                    >
                      #{club.ranking}
                    </Text>
                    <Text className="text-xs text-gray-400">Rank</Text>
                  </View>
                )}
              </View>

              {club.description && (
                <Text
                  className="text-sm text-gray-600 mb-2"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {club.description}
                </Text>
              )}

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  {club.memberCount !== undefined && (
                    <View className="flex-row items-center">
                      <Text className="text-xs text-gray-500">
                        👥 {club.memberCount} members
                      </Text>
                    </View>
                  )}
                  {club.status && (
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        club.status === 'ACTIVE'
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          club.status === 'ACTIVE'
                            ? 'text-green-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {club.status}
                      </Text>
                    </View>
                  )}
                </View>
                {club.foundedDate && (
                  <Text className="text-xs text-gray-400">
                    Founded {new Date(club.foundedDate).getFullYear()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {!showAll && filteredClubs.length > maxItems && onViewAll && (
            <TouchableOpacity
              onPress={onViewAll}
              className="bg-blue-50 rounded-xl p-4 items-center border border-blue-200"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-semibold text-blue-600">
                View All Clubs ({filteredClubs.length})
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default AllClubsList;
