import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import WalletService from '@services/wallet.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

interface Club {
  id: number;
  name: string;
  category: string;
  leaderName: string;
  members: number;
  policy: string;
  events: number;
  description: string | null;
  status?: string;
}

export default function UniStaffPointsPage() {
  const { user } = useAuthStore();
  
  // State management
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClubs, setSelectedClubs] = useState<Record<number, boolean>>({});
  const [rewardAmount, setRewardAmount] = useState('');
  const [isDistributing, setIsDistributing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load all clubs
  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const clubs = await ClubService.getAllClubs();
      console.log('=== POINTS PAGE: Loaded clubs ===');
      console.log('Total clubs:', clubs.length);
      console.log('First club sample:', clubs[0]);
      console.log('================================');
      setAllClubs(clubs);
      
      // Initialize selection state
      const initialSelected: Record<number, boolean> = {};
      clubs.forEach(club => {
        initialSelected[club.id] = false;
      });
      setSelectedClubs(initialSelected);
    } catch (error: any) {
      console.error('Error loading clubs:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load clubs',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle club selection
  const handleToggleSelectClub = (clubId: number) => {
    setSelectedClubs(prev => ({
      ...prev,
      [clubId]: !prev[clubId]
    }));
  };

  // Select all clubs
  const handleSelectAll = () => {
    const allSelected: Record<number, boolean> = {};
    allClubs.forEach(club => {
      allSelected[club.id] = true;
    });
    setSelectedClubs(allSelected);
  };

  // Deselect all clubs
  const handleDeselectAll = () => {
    const allDeselected: Record<number, boolean> = {};
    allClubs.forEach(club => {
      allDeselected[club.id] = false;
    });
    setSelectedClubs(allDeselected);
  };

  // Count selected clubs
  const selectedClubCount = useMemo(() => {
    return Object.values(selectedClubs).filter(Boolean).length;
  }, [selectedClubs]);

  // Pagination
  const totalPages = Math.ceil(allClubs.length / itemsPerPage);
  const paginatedClubs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allClubs.slice(startIndex, endIndex);
  }, [allClubs, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Distribute rewards
  const handleDistributeRewards = async () => {
    const amount = parseInt(rewardAmount);
    
    if (!rewardAmount || amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid reward amount.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    const selectedClubIds = Object.keys(selectedClubs)
      .filter(clubId => selectedClubs[parseInt(clubId)])
      .map(id => parseInt(id));

    if (selectedClubIds.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Clubs Selected',
        text2: 'Please select at least one club.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    // Confirmation alert
    Alert.alert(
      'Confirm Distribution',
      `Distribute ${amount} points to ${selectedClubIds.length} club(s)?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsDistributing(true);
            try {
              const result = await WalletService.distributePointsToClubs(
                selectedClubIds,
                amount,
                'Reward from University Staff'
              );

              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: `Successfully distributed ${amount} points to ${selectedClubIds.length} club(s).`,
                  visibilityTime: 3000,
                  autoHide: true,
                });
                
                // Reset form
                setRewardAmount('');
                handleDeselectAll();
              } else {
                throw new Error(result.message || 'Failed to distribute rewards');
              }
            } catch (error: any) {
              console.error('Distribution error:', error);
              Toast.show({
                type: 'error',
                text1: 'Distribution Failed',
                text2: error.response?.data?.message || error.message || 'An error occurred',
                visibilityTime: 3000,
                autoHide: true,
              });
            } finally {
              setIsDistributing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-lg font-medium mt-4 text-gray-700">Loading clubs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Sidebar */}
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center mb-2">
          <Ionicons name="wallet" size={28} color="#3B82F6" />
          <Text className="text-2xl font-bold text-gray-800 ml-2">Club Rewards</Text>
        </View>
        <Text className="text-gray-600">Distribute points to university clubs</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Reward Settings Card */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mt-6 mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">Reward Settings</Text>
          
          {/* Amount Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Points per Club
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Ionicons name="wallet-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="Enter reward points..."
                keyboardType="numeric"
                value={rewardAmount}
                onChangeText={setRewardAmount}
                editable={!isDistributing}
              />
            </View>
          </View>

          {/* Selected Count */}
          <View className="bg-blue-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700 font-medium">Selected Clubs:</Text>
              <Text className="text-blue-600 font-bold text-lg">{selectedClubCount}</Text>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-gray-700 font-medium">Total Points:</Text>
              <Text className="text-blue-600 font-bold text-lg">
                {(parseInt(rewardAmount) || 0) * selectedClubCount}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={handleSelectAll}
              className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
              disabled={isDistributing}
            >
              <Text className="text-gray-700 font-medium">Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeselectAll}
              className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
              disabled={isDistributing}
            >
              <Text className="text-gray-700 font-medium">Deselect All</Text>
            </TouchableOpacity>
          </View>

          {/* Distribute Button */}
          <TouchableOpacity
            onPress={handleDistributeRewards}
            disabled={
              isDistributing ||
              !rewardAmount ||
              parseInt(rewardAmount) <= 0 ||
              selectedClubCount === 0
            }
            className={`rounded-xl py-4 items-center ${
              isDistributing ||
              !rewardAmount ||
              parseInt(rewardAmount) <= 0 ||
              selectedClubCount === 0
                ? 'bg-gray-300'
                : 'bg-blue-600'
            }`}
          >
            {isDistributing ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="send" size={20} color="white" />
                <Text className="text-white font-bold ml-2">
                  Distribute {rewardAmount || 0} pts to {selectedClubCount} club(s)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Clubs List */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Club List ({allClubs.length})
            </Text>
          </View>

          {allClubs.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="albums-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No clubs found</Text>
            </View>
          ) : (
            <>
              {paginatedClubs.map((club) => {
                const isSelected = selectedClubs[club.id] || false;
                return (
                  <TouchableOpacity
                    key={club.id}
                    onPress={() => handleToggleSelectClub(club.id)}
                    className={`mb-3 p-4 rounded-2xl border-2 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-transparent'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-lg font-bold text-gray-800 mb-1">
                          {club.name}
                        </Text>
                        
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="person" size={14} color="#6B7280" />
                          <Text className="text-sm text-gray-600 ml-1">
                            {club.leaderName || 'No Leader'}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-3">
                          <View className="flex-row items-center">
                            <Ionicons name="people" size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                              {club.members > 0 ? `${club.members} members` : 'No members'}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="calendar" size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                              {club.events > 0 ? `${club.events} events` : 'No events'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="items-center">
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="white" />
                          )}
                        </View>
                        {rewardAmount && parseInt(rewardAmount) > 0 && (
                          <Text className="text-xs text-blue-600 font-bold mt-1">
                            +{rewardAmount} pts
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <View className="flex-row items-center justify-center gap-3 mt-4">
                  <TouchableOpacity
                    onPress={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${
                      currentPage === 1 ? 'bg-gray-200' : 'bg-blue-600'
                    }`}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={currentPage === 1 ? '#9CA3AF' : 'white'}
                    />
                  </TouchableOpacity>

                  <Text className="text-sm font-medium text-gray-700">
                    Page {currentPage} / {totalPages}
                  </Text>

                  <TouchableOpacity
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${
                      currentPage === totalPages ? 'bg-gray-200' : 'bg-blue-600'
                    }`}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={currentPage === totalPages ? '#9CA3AF' : 'white'}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
