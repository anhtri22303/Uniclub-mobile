/**
 * Admin Clubs Management Page (Mobile)
 * 
 * ✅ Matches web version functionality:
 * - Uses React Query (useClubs hook) for data fetching
 * - Fetches activeMemberCount and approvedEvents for each club
 * - Displays member count and approved events in UI
 * - Category colors match web version exactly
 * - Filters: Category, Leader, Policy
 * - Search functionality
 * - Edit and Delete club actions
 * - Mobile-optimized responsive design
 */

import NavigationBar from '@components/navigation/NavigationBar';
import { Ionicons } from '@expo/vector-icons';
import { useClubs } from '@hooks/useQueryHooks';
import { Club, ClubService } from '@services/club.service';
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

// Category colors matching web version
const CATEGORY_COLORS: Record<string, string> = {
  'Software Engineering': '#0052CC',
  'Artificial Intelligence': '#6A00FF',
  'Information Assurance': '#243447',
  'Data Science': '#00B8A9',
  'Business Administration': '#1E2A78',
  'Digital Marketing': '#FF3366',
  'Graphic Design': '#FFC300',
  'Multimedia Communication': '#FF6B00',
  'Hospitality Management': '#E1B382',
  'International Business': '#007F73',
  'Finance and Banking': '#006B3C',
  'Japanese Language': '#D80032',
  'Korean Language': '#5DADEC',
};

// Extended club type with member count and approved events
type ClubWithData = Club & {
  memberCount?: number;
  approvedEvents?: number;
};

export default function AdminClubsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // ✅ USE REACT QUERY for clubs (matching web version)
  const { data: clubs = [], isLoading, error: queryError, refetch } = useClubs({
    page: 0,
    size: 1000,
    sort: ['name']
  });

  // Data states
  const [clubsWithData, setClubsWithData] = useState<ClubWithData[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<ClubWithData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [leaderFilter, setLeaderFilter] = useState('all');
  const [policyFilter, setPolicyFilter] = useState('all');

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

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

  // Fetch member count and approved events for each club (matching web version)
  useEffect(() => {
    const fetchClubData = async () => {
      if (clubs.length === 0) {
        setClubsWithData([]);
        return;
      }
      
      const clubsWithMemberCount = await Promise.all(
        clubs.map(async (club: any) => {
          try {
            const clubData = await ClubService.getClubMemberCount(club.id);
            return {
              ...club,
              memberCount: clubData.activeMemberCount,
              approvedEvents: clubData.approvedEvents
            };
          } catch (error) {
            console.error(`Failed to fetch data for club ${club.id}:`, error);
            return {
              ...club,
              memberCount: 0,
              approvedEvents: 0
            };
          }
        })
      );
      
      setClubsWithData(clubsWithMemberCount);
    }
    
    fetchClubData();
  }, [clubs]);

  // Apply filters
  useEffect(() => {
    let filtered = clubsWithData;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query) ||
          c.leaderName.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    // Leader filter
    if (leaderFilter !== 'all') {
      filtered = filtered.filter((c) => c.leaderName === leaderFilter);
    }

    // Policy filter
    if (policyFilter !== 'all') {
      filtered = filtered.filter((c) => c.policy === policyFilter);
    }

    setFilteredClubs(filtered);
  }, [searchQuery, clubsWithData, categoryFilter, leaderFilter, policyFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setLeaderFilter('all');
    setPolicyFilter('all');
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || '#E2E8F0';
  };

  const handleEditClub = async (club: Club) => {
    try {
      const details = await ClubService.getClubById(club.id);
      setEditingClub(club);
      setEditName(details.name);
      setEditDescription(details.description || '');
      setIsEditModalOpen(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load club details');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingClub) return;

    try {
      await ClubService.updateClub(editingClub.id, {
        name: editName,
        description: editDescription || undefined,
      });
      Alert.alert('Success', 'Club updated successfully');
      setIsEditModalOpen(false);
      setEditingClub(null);
      refetch(); // Use React Query refetch
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update club');
    }
  };

  const handleDeleteClub = async (club: ClubWithData) => {
    Alert.alert(
      'Delete Club',
      `Are you sure you want to delete "${club.name}"?\n\nThis action cannot be undone. Please ensure all members and events are removed first.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ClubService.deleteClub(club.id);
              Alert.alert('Success', 'Club deleted successfully');
              refetch(); // Use React Query refetch
            } catch (error: any) {
              Alert.alert(
                'Delete Failed',
                'Cannot delete this club. Please remove all related members and events before deleting.'
              );
            }
          },
        },
      ]
    );
  };

  // Get unique values for filters (matching web version)
  const uniqueCategories = Array.from(new Set(clubsWithData.map((c) => c.category).filter((c) => c !== '-'))).sort();
  const uniqueLeaders = Array.from(new Set(clubsWithData.map((c) => c.leaderName).filter((l) => l !== '-'))).sort();
  const uniquePolicies = Array.from(new Set(clubsWithData.map((c) => c.policy).filter((p) => p !== '-'))).sort();

  // Statistics (use memberCount and approvedEvents from API, matching web version)
  const totalClubs = filteredClubs.length;
  const totalMembers = filteredClubs.reduce((sum, c) => sum + (c.memberCount ?? c.members ?? 0), 0);
  const totalEvents = filteredClubs.reduce((sum, c) => sum + (c.approvedEvents ?? c.events ?? 0), 0);

  const hasActiveFilters =
    searchQuery.trim() !== '' || categoryFilter !== 'all' || leaderFilter !== 'all' || policyFilter !== 'all';
  const filterCount = [
    searchQuery.trim() !== '',
    categoryFilter !== 'all',
    leaderFilter !== 'all',
    policyFilter !== 'all',
  ].filter(Boolean).length;

  const renderClubItem = ({ item }: { item: ClubWithData }) => {
    const categoryColor = getCategoryColor(item.category);
    const memberCount = item.memberCount ?? item.members ?? 0;
    const eventCount = item.approvedEvents ?? item.events ?? 0;

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
        onPress={() => {
          Alert.alert(
            item.name,
            `Category: ${item.category}\nLeader: ${item.leaderName}\nMembers: ${memberCount}\nApproved Events: ${eventCount}\nPolicy: ${item.policy}${
              item.description ? `\n\nDescription: ${item.description}` : ''
            }`,
            [
              { text: 'Close', style: 'cancel' },
              { text: 'Edit', onPress: () => handleEditClub(item) },
            ]
          );
        }}
      >
        <View className="flex-row items-start">
          {/* Icon */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: categoryColor + '20' }}
          >
            <Ionicons name="business" size={24} color={categoryColor} />
          </View>

          {/* Club Info */}
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800 mb-1">{item.name}</Text>

            {/* Category Badge */}
            <View
              className="self-start px-2 py-1 rounded-full mb-2"
              style={{ backgroundColor: categoryColor }}
            >
              <Text className="text-xs font-medium text-white">{item.category}</Text>
            </View>

            {/* Stats Row */}
            <View className="flex-row items-center gap-3 flex-wrap">
              <View className="flex-row items-center">
                <Ionicons name="people" size={14} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1">{memberCount} members</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={14} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1">{eventCount} events</Text>
              </View>
            </View>

            {/* Leader & Policy */}
            {item.leaderName !== '-' && (
              <Text className="text-xs text-gray-500 mt-1">👤 {item.leaderName}</Text>
            )}
          </View>

          {/* Actions */}
          <View className="flex-row gap-1">
            <TouchableOpacity onPress={() => handleEditClub(item)} className="bg-blue-50 p-2 rounded-lg">
              <Ionicons name="create-outline" size={18} color="#3B82F6" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDeleteClub(item)} className="bg-red-50 p-2 rounded-lg">
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
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
          <Text className="text-2xl font-bold text-gray-800">Clubs</Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center bg-red-500 px-3 py-2 rounded-xl"
          >
            <Ionicons name="log-out" size={18} color="white" />
            <Text className="text-white font-medium ml-1 text-sm">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-blue-600 font-medium">Total Clubs</Text>
                <Text className="text-xl font-bold text-blue-900">{totalClubs}</Text>
              </View>
              <View className="bg-blue-500 p-2 rounded-lg">
                <Ionicons name="business" size={20} color="white" />
              </View>
            </View>
          </View>

          <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-green-600 font-medium">Members</Text>
                <Text className="text-xl font-bold text-green-900">{totalMembers}</Text>
              </View>
              <View className="bg-green-500 p-2 rounded-lg">
                <Ionicons name="people" size={20} color="white" />
              </View>
            </View>
          </View>

          <View className="flex-1 bg-purple-50 rounded-xl p-3 border border-purple-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-purple-600 font-medium">Events</Text>
                <Text className="text-xl font-bold text-purple-900">{totalEvents}</Text>
              </View>
              <View className="bg-purple-500 p-2 rounded-lg">
                <Ionicons name="calendar" size={20} color="white" />
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center mb-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Search clubs..."
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
            <Ionicons name="filter" size={18} color="#0D9488" />
            <Text className="text-teal-600 font-medium ml-2">Filters</Text>
            {filterCount > 0 && (
              <View className="bg-teal-500 rounded-full w-5 h-5 items-center justify-center ml-2">
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

            {/* Category Filter */}
            {uniqueCategories.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs text-gray-600 mb-2">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setCategoryFilter('all')}
                      className={`px-3 py-2 rounded-lg border ${
                        categoryFilter === 'all'
                          ? 'bg-teal-500 border-teal-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          categoryFilter === 'all' ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {uniqueCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategoryFilter(cat)}
                        className={`px-3 py-2 rounded-lg border ${
                          categoryFilter === cat
                            ? 'bg-teal-500 border-teal-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            categoryFilter === cat ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Leader Filter */}
            {uniqueLeaders.length > 0 && (
              <View className="mb-3">
                <Text className="text-xs text-gray-600 mb-2">Leader</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setLeaderFilter('all')}
                      className={`px-3 py-2 rounded-lg border ${
                        leaderFilter === 'all'
                          ? 'bg-teal-500 border-teal-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          leaderFilter === 'all' ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {uniqueLeaders.map((leader) => (
                      <TouchableOpacity
                        key={leader}
                        onPress={() => setLeaderFilter(leader)}
                        className={`px-3 py-2 rounded-lg border ${
                          leaderFilter === leader
                            ? 'bg-teal-500 border-teal-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            leaderFilter === leader ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {leader}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Policy Filter */}
            {uniquePolicies.length > 0 && (
              <View>
                <Text className="text-xs text-gray-600 mb-2">Policy</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setPolicyFilter('all')}
                      className={`px-3 py-2 rounded-lg border ${
                        policyFilter === 'all'
                          ? 'bg-teal-500 border-teal-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          policyFilter === 'all' ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {uniquePolicies.map((policy) => (
                      <TouchableOpacity
                        key={policy}
                        onPress={() => setPolicyFilter(policy)}
                        className={`px-3 py-2 rounded-lg border ${
                          policyFilter === policy
                            ? 'bg-teal-500 border-teal-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            policyFilter === policy ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {policy}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Clubs List */}
      {isLoading || (clubs.length > 0 && clubsWithData.length === 0) ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-600 mt-4">
            {isLoading ? 'Loading clubs...' : 'Loading club data...'}
          </Text>
        </View>
      ) : queryError ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-100 p-6 rounded-full mb-4">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">Error Loading Clubs</Text>
          <Text className="text-gray-600 text-center mb-4">
            {String(queryError)}
          </Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-teal-500 px-6 py-3 rounded-xl">
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredClubs.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-gray-100 p-6 rounded-full mb-4">
            <Ionicons name="business-outline" size={48} color="#6B7280" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">No Clubs Found</Text>
          <Text className="text-gray-600 text-center">
            {hasActiveFilters ? 'Try adjusting your filters' : 'No clubs available'}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearFilters} className="mt-4 bg-teal-500 px-6 py-3 rounded-xl">
              <Text className="text-white font-medium">Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredClubs}
          renderItem={renderClubItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#0D9488']} tintColor="#0D9488" />
          }
        />
      )}

      {/* Edit Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsEditModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Edit Club</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} className="bg-gray-100 p-2 rounded-full">
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                {/* Club Name */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Club Name</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter club name"
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Enter description"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Buttons */}
                <View className="flex-row gap-3 mt-6">
                  <TouchableOpacity onPress={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-200 py-3 rounded-xl">
                    <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleSaveEdit} className="flex-1 bg-teal-500 py-3 rounded-xl">
                    <Text className="text-white font-semibold text-center">Save</Text>
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
