import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Club, ClubService } from '@services/club.service';
import { sendOtp } from '@services/clubApplication.service';
import { Major, MajorService } from '@services/major.service';
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
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function UniStaffClubsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Data states
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // OTP modal states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Fetch majors
  const fetchMajors = async () => {
    try {
      const data = await MajorService.fetchMajors();
      setMajors(data);
    } catch (error) {
      console.error('Failed to fetch majors:', error);
    }
  };

  const fetchClubs = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const data = await ClubService.fetchClubs(0, 100);

      // Sort by name
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));

      setClubs(sorted);
      setFilteredClubs(sorted);
    } catch (error: any) {
      console.error('Failed to fetch clubs:', error);
      Alert.alert('Error', 'Failed to load clubs. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMajors();
    fetchClubs();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = clubs;

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
  }, [searchQuery, clubs, categoryFilter, leaderFilter, policyFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchClubs(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setLeaderFilter('all');
    setPolicyFilter('all');
  };

  const getCategoryColor = (category: string, majorId?: number) => {
    // Find major by name first
    let foundMajor = majors.find(m => m.name === category);
    
    // If not found by name, try by ID
    if (!foundMajor && majorId) {
      foundMajor = majors.find(m => m.id === majorId);
    }
    
    // Return color from major or default
    return foundMajor?.colorHex || '#E2E8F0';
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
      fetchClubs();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update club');
    }
  };

  const handleDeleteClub = async (club: Club) => {
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
              fetchClubs();
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

  // Get unique values for filters
  const uniqueCategories = Array.from(new Set(clubs.map((c) => c.category).filter((c) => c !== '-'))).sort();
  const uniqueLeaders = Array.from(new Set(clubs.map((c) => c.leaderName).filter((l) => l !== '-'))).sort();
  const uniquePolicies = Array.from(new Set(clubs.map((c) => c.policy).filter((p) => p !== '-'))).sort();

  // Statistics
  const totalClubs = filteredClubs.length;
  const totalMembers = filteredClubs.reduce((sum, c) => sum + c.members, 0);
  const totalEvents = filteredClubs.reduce((sum, c) => sum + c.events, 0);

  const hasActiveFilters =
    searchQuery.trim() !== '' || categoryFilter !== 'all' || leaderFilter !== 'all' || policyFilter !== 'all';
  const filterCount = [
    searchQuery.trim() !== '',
    categoryFilter !== 'all',
    leaderFilter !== 'all',
    policyFilter !== 'all',
  ].filter(Boolean).length;

  const renderClubItem = ({ item }: { item: Club }) => {
    // Get the club's majorId if available from the original API response
    const club = clubs.find(c => c.id === item.id);
    const majorId = (club as any)?.majorId;
    const categoryColor = getCategoryColor(item.category, majorId);

    return (
      <TouchableOpacity
        className="bg-white rounded-3xl p-4 mb-3 shadow-sm"
        style={{
          shadowColor: '#14B8A6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
        onPress={() => {
          Alert.alert(
            item.name,
            `Category: ${item.category}\nLeader: ${item.leaderName}\nMembers: ${item.members}\nEvents: ${item.events}\nPolicy: ${item.policy}${
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
            className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
            style={{ backgroundColor: categoryColor }}
          >
            <Ionicons name="business" size={24} color="white" />
          </View>

          {/* Club Info */}
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800 mb-1">{item.name}</Text>

            {/* Category Badge */}
            <View
              className="self-start px-3 py-1 rounded-xl mb-2"
              style={{ backgroundColor: categoryColor }}
            >
              <Text className="text-xs font-semibold text-white">{item.category}</Text>
            </View>

            {/* Stats Row */}
            <View className="flex-row items-center gap-3 flex-wrap">
              <View className="flex-row items-center">
                <Ionicons name="people" size={14} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1">{item.members} members</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={14} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1">{item.events} events</Text>
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-white rounded-3xl p-6" style={{
          shadowColor: '#14B8A6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8
        }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: '#14B8A6' }}>
                <Ionicons name="business-outline" size={24} color="white" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-gray-900">Clubs</Text>
                <Text className="text-sm text-gray-600 mt-1">Manage all student clubs</Text>
              </View>
            </View>
            
            {/* Send OTP Button */}
            <TouchableOpacity
              onPress={() => setShowOtpModal(true)}
              className="rounded-2xl px-4 py-3 flex-row items-center" style={{ backgroundColor: '#14B8A6', shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
            >
              <Ionicons name="mail-outline" size={18} color="white" />
              <Text className="text-white font-bold ml-2 text-sm">Send OTP</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View className="flex-row gap-2 mb-4">
            <View className="flex-1 rounded-2xl p-3 border-2" style={{ backgroundColor: '#D1FAE5', borderColor: '#14B8A6' }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-medium" style={{ color: '#14B8A6' }}>Total Clubs</Text>
                  <Text className="text-xl font-bold" style={{ color: '#0F766E' }}>{totalClubs}</Text>
                </View>
                <View className="p-2 rounded-xl" style={{ backgroundColor: '#14B8A6' }}>
                  <Ionicons name="business" size={20} color="white" />
                </View>
              </View>
            </View>

            <View className="flex-1 bg-green-50 rounded-2xl p-3 border-2 border-green-200">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-green-600 font-medium">Members</Text>
                  <Text className="text-xl font-bold text-green-900">{totalMembers}</Text>
                </View>
                <View className="bg-green-500 p-2 rounded-xl">
                  <Ionicons name="people" size={20} color="white" />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3 bg-white">
        <View className="bg-white rounded-2xl px-4 py-3 flex-row items-center border-2 border-gray-100" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2
        }}>
          <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: '#14B8A6' }}>
            <Ionicons name="search" size={18} color="white" />
          </View>
          <AppTextInput
            className="flex-1 ml-3 text-base text-gray-800"
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
        <View className="flex-row items-center justify-between mt-3">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center rounded-xl px-4 py-2" style={{ backgroundColor: '#D1FAE5' }}
          >
            <Ionicons name="filter" size={18} color="#14B8A6" />
            <Text className="font-bold ml-2" style={{ color: '#14B8A6' }}>Filters</Text>
            {filterCount > 0 && (
              <View className="rounded-full w-5 h-5 items-center justify-center ml-2" style={{ backgroundColor: '#F59E0B' }}>
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
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-600 mt-4">Loading clubs...</Text>
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
                  <AppTextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter club name"
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                  <AppTextInput
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

      {/* OTP Modal */}
      <Modal visible={showOtpModal} animationType="slide" transparent={true} onRequestClose={() => setShowOtpModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <View className="bg-teal-100 p-2 rounded-full mr-3">
                  <Ionicons name="mail" size={24} color="#0D9488" />
                </View>
                <Text className="text-xl font-bold text-gray-800">Send OTP</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowOtpModal(false);
                  setOtpEmail('');
                }}
                className="bg-gray-100 p-2 rounded-full"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 mb-6">
              Enter student email to send OTP for club application
            </Text>

            <View className="space-y-4">
              {/* Email Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Student Email</Text>
                <View className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 flex-row items-center">
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  <AppTextInput
                    className="flex-1 ml-3 text-base"
                    value={otpEmail}
                    onChangeText={setOtpEmail}
                    placeholder="student@university.edu"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isSendingOtp}
                  />
                </View>
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3 mt-6">
                <TouchableOpacity
                  onPress={() => {
                    setShowOtpModal(false);
                    setOtpEmail('');
                  }}
                  disabled={isSendingOtp}
                  className="flex-1 bg-gray-200 py-3 rounded-xl"
                >
                  <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    if (!otpEmail.trim()) {
                      Toast.show({
                        type: 'error',
                        text1: 'Email Required',
                        text2: 'Please enter a student email address',
                        visibilityTime: 3000,
                        autoHide: true,
                      });
                      return;
                    }

                    // Basic email validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(otpEmail.trim())) {
                      Toast.show({
                        type: 'error',
                        text1: 'Invalid Email',
                        text2: 'Please enter a valid email address',
                        visibilityTime: 3000,
                        autoHide: true,
                      });
                      return;
                    }

                    setIsSendingOtp(true);
                    try {
                      const result = await sendOtp(otpEmail.trim());
                      
                      Toast.show({
                        type: 'success',
                        text1: 'OTP Sent Successfully',
                        text2: result || `OTP has been sent to ${otpEmail}`,
                        visibilityTime: 4000,
                        autoHide: true,
                      });

                      // Reset and close modal
                      setShowOtpModal(false);
                      setOtpEmail('');
                    } catch (err: any) {
                      console.error('Error sending OTP:', err);
                      Toast.show({
                        type: 'error',
                        text1: 'Failed to Send OTP',
                        text2: err?.response?.data?.message || err?.message || 'An error occurred while sending OTP',
                        visibilityTime: 3000,
                        autoHide: true,
                      });
                    } finally {
                      setIsSendingOtp(false);
                    }
                  }}
                  disabled={isSendingOtp}
                  className={`flex-1 py-3 rounded-xl ${
                    isSendingOtp ? 'bg-teal-300' : 'bg-teal-500'
                  }`}
                >
                  {isSendingOtp ? (
                    <View className="flex-row items-center justify-center">
                      <ActivityIndicator size="small" color="white" />
                      <Text className="text-white font-semibold ml-2">Sending...</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-semibold text-center">Send OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
