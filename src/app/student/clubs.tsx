import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import { postClubApplication } from '@services/clubApplication.service';
import { MajorService, type Major } from '@services/major.service';
import { MembershipsService } from '@services/memberships.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Club {
  id: number;
  name: string;
  description: string;
  majorName: string;
  members: number;
  majorPolicyName: string;
  status: 'member' | 'pending' | 'none';
}

export default function StudentClubsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // State for clubs
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'member' | 'pending' | 'none'>('all');

  // User's club IDs
  const [userClubIds, setUserClubIds] = useState<number[]>([]);

  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [applicationText, setApplicationText] = useState('');
  const [applying, setApplying] = useState(false);

  // Create club modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProposerReason, setNewProposerReason] = useState('');
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [creating, setCreating] = useState(false);

  // Pending club IDs (local state for optimistic UI)
  const [pendingClubIds, setPendingClubIds] = useState<number[]>([]);

  // Get user's club IDs
  useEffect(() => {
    const clubIds = user?.clubIds || [];
    console.log('User club IDs:', clubIds);
    setUserClubIds(clubIds);
  }, [user]);

  // Load majors
  useEffect(() => {
    const loadMajors = async () => {
      try {
        const data = await MajorService.fetchMajors();
        setMajors(data.filter((m) => m.active));
      } catch (error) {
        console.error('Failed to load majors:', error);
      }
    };
    loadMajors();
  }, []);

  // Load clubs
  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    setLoading(true);
    try {
      const response = await ClubService.fetchClubs(0, 100);
      console.log('Fetched clubs:', response);

      // Load member counts for all clubs
      const clubsWithCounts = await Promise.all(
        response.map(async (club) => {
          const memberCount = await ClubService.getClubMemberCount(club.id);
          return {
            id: club.id,
            name: club.name,
            description: club.description || '',
            majorName: club.category || '',
            members: memberCount,
            majorPolicyName: club.policy || '',
            status: getClubStatus(club.id) as 'member' | 'pending' | 'none',
          };
        })
      );

      // Filter out user's current clubs
      const filteredClubs = clubsWithCounts.filter(
        (club) => !userClubIds.includes(club.id)
      );

      setClubs(filteredClubs);
    } catch (error) {
      console.error('Error loading clubs:', error);
      Alert.alert('Error', 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const getClubStatus = (clubId: number): 'member' | 'pending' | 'none' => {
    // Check if club is in pending list
    if (pendingClubIds.includes(clubId)) {
      return 'pending';
    }

    // Check if user is already a member
    if (userClubIds.includes(clubId)) {
      return 'member';
    }

    return 'none';
  };

  // Apply search and filter
  useEffect(() => {
    let filtered = [...clubs];

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (club) =>
          club.name.toLowerCase().includes(searchLower) ||
          club.description.toLowerCase().includes(searchLower) ||
          club.majorName.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((club) => club.status === activeFilter);
    }

    setFilteredClubs(filtered);
  }, [clubs, searchTerm, activeFilter, pendingClubIds]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubs();
    setRefreshing(false);
  };

  // Handle apply to club
  const handleApplyClick = (club: Club) => {
    setSelectedClub(club);
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!selectedClub || !applicationText.trim()) {
      Alert.alert('Missing Information', 'Please provide a reason for joining');
      return;
    }

    setApplying(true);
    try {
      await MembershipsService.applyToClub(selectedClub.id, applicationText.trim());

      // Add to pending list for optimistic UI
      setPendingClubIds((prev) => [...prev, selectedClub.id]);

      Alert.alert('Success', `Your application to ${selectedClub.name} has been submitted`);
      setShowApplyModal(false);
      setApplicationText('');
      setSelectedClub(null);

      // Refresh clubs to get updated status
      await loadClubs();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to submit application';
      Alert.alert('Error', message);
    } finally {
      setApplying(false);
    }
  };

  // Handle create club application
  const submitCreateClubApplication = async () => {
    if (!newClubName.trim() || !newDescription.trim() || !selectedMajorId || !newProposerReason.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    setCreating(true);
    try {
      await postClubApplication({
        clubName: newClubName.trim(),
        description: newDescription.trim(),
        category: selectedMajorId,
        proposerReason: newProposerReason.trim(),
      });

      Alert.alert('Success', `Your club application for "${newClubName}" has been submitted`);
      setShowCreateModal(false);
      setNewClubName('');
      setNewDescription('');
      setNewProposerReason('');
      setSelectedMajorId(null);
    } catch (error: any) {
      console.error('Error creating club application:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to create club application';
      Alert.alert('Error', message);
    } finally {
      setCreating(false);
    }
  };

  // Category colors
  const categoryColors: Record<string, string> = {
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

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || '#6B7280';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-6 py-4 space-y-4">
          {/* Header with Create Club Button */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">Club Directory</Text>
              <Text className="text-sm text-gray-500">
                Discover and join clubs that match your interests
              </Text>
              {userClubIds.length > 0 && (
                <Text className="text-xs text-gray-400 mt-1">
                  (Your club{userClubIds.length > 1 ? 's' : ''} {userClubIds.join(', ')}{' '}
                  {userClubIds.length > 1 ? 'are' : 'is'} hidden)
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="bg-indigo-500 px-4 py-2.5 rounded-xl flex-row items-center"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-1 text-sm">New Club</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="bg-white rounded-2xl px-4 py-3 shadow-sm flex-row items-center">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search clubs..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm !== '' && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl ${
                activeFilter === 'all' ? 'bg-indigo-500' : 'bg-white border border-gray-200'
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  activeFilter === 'all' ? 'text-white' : 'text-gray-700'
                }`}
              >
                All Clubs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('none')}
              className={`px-4 py-2 rounded-xl ${
                activeFilter === 'none' ? 'bg-green-500' : 'bg-white border border-gray-200'
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  activeFilter === 'none' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Not Applied
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('pending')}
              className={`px-4 py-2 rounded-xl ${
                activeFilter === 'pending' ? 'bg-yellow-500' : 'bg-white border border-gray-200'
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  activeFilter === 'pending' ? 'text-white' : 'text-gray-700'
                }`}
              >
                Pending
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Clubs List */}
          {loading ? (
            <View className="bg-white rounded-3xl p-8 shadow-sm items-center">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="text-gray-600 mt-4">Loading clubs...</Text>
            </View>
          ) : filteredClubs.length === 0 ? (
            <View className="bg-white rounded-3xl p-8 shadow-sm items-center">
              <View className="bg-gray-100 p-6 rounded-full mb-4">
                <Ionicons name="search" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">No Clubs Found</Text>
              <Text className="text-gray-600 text-center mb-4">
                {searchTerm || activeFilter !== 'all'
                  ? 'No clubs match your search or filters'
                  : 'No clubs available at the moment'}
              </Text>
              {(searchTerm || activeFilter !== 'all') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                  className="bg-gray-100 px-6 py-3 rounded-xl"
                >
                  <Text className="text-gray-700 font-semibold">Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="space-y-3">
              {filteredClubs.map((club) => {
                const statusColor =
                  club.status === 'member'
                    ? 'bg-blue-100 text-blue-700'
                    : club.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700';

                return (
                  <View key={club.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    {/* Club Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900 mb-1">{club.name}</Text>
                        <View
                          className="self-start px-3 py-1 rounded-full"
                          style={{ backgroundColor: getCategoryColor(club.majorName) }}
                        >
                          <Text className="text-white text-xs font-bold">{club.majorName || '-'}</Text>
                        </View>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${statusColor}`}>
                        <Text className="text-xs font-bold">
                          {club.status === 'member'
                            ? 'Member'
                            : club.status === 'pending'
                            ? 'Pending'
                            : 'Available'}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    {club.description && (
                      <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                        {club.description}
                      </Text>
                    )}

                    {/* Stats */}
                    <View className="flex-row items-center gap-4 mb-3">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="people" size={16} color="#6366F1" />
                        <Text className="text-sm text-gray-600">{club.members} members</Text>
                      </View>
                      {club.majorPolicyName && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="shield-checkmark" size={16} color="#6366F1" />
                          <Text className="text-sm text-gray-600" numberOfLines={1}>
                            {club.majorPolicyName}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Apply Button */}
                    {club.status === 'none' && (
                      <TouchableOpacity
                        onPress={() => handleApplyClick(club)}
                        className="bg-indigo-500 py-3 rounded-xl flex-row items-center justify-center"
                      >
                        <Ionicons name="add-circle" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Apply to Join</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Apply Modal */}
      <Modal
        visible={showApplyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Apply to {selectedClub?.name}</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-3">
              Tell us why you want to join this club
            </Text>

            <TextInput
              placeholder="Share your interests and what you hope to gain from joining..."
              value={applicationText}
              onChangeText={setApplicationText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="bg-gray-50 rounded-xl p-4 text-gray-900 mb-4"
              placeholderTextColor="#9CA3AF"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowApplyModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-xl"
                disabled={applying}
              >
                <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitApplication}
                className="flex-1 bg-indigo-500 py-3 rounded-xl"
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Club Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <ScrollView className="flex-1 bg-black/50">
          <View className="min-h-full justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900">Create Club Application</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                {/* Club Name */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Club Name</Text>
                  <TextInput
                    placeholder="Enter club name"
                    value={newClubName}
                    onChangeText={setNewClubName}
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                  <TextInput
                    placeholder="Enter description"
                    value={newDescription}
                    onChangeText={setNewDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Major Selection */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Category (Major)</Text>
                  <ScrollView className="bg-gray-50 rounded-xl p-3 max-h-40">
                    {majors.map((major) => (
                      <TouchableOpacity
                        key={major.id}
                        onPress={() => setSelectedMajorId(major.id)}
                        className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                          selectedMajorId === major.id ? 'bg-indigo-100' : 'bg-white'
                        }`}
                      >
                        <Text
                          className={`font-medium ${
                            selectedMajorId === major.id ? 'text-indigo-700' : 'text-gray-700'
                          }`}
                        >
                          {major.name}
                        </Text>
                        {selectedMajorId === major.id && (
                          <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Proposer Reason */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Why do you want to create this club?
                  </Text>
                  <TextInput
                    placeholder="Share your motivation and vision for this club"
                    value={newProposerReason}
                    onChangeText={setNewProposerReason}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Buttons */}
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 py-3 rounded-xl"
                    disabled={creating}
                  >
                    <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={submitCreateClubApplication}
                    className="flex-1 bg-indigo-500 py-3 rounded-xl"
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-semibold text-center">Send</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
