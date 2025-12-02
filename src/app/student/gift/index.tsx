import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { queryKeys, useClubs, useEventProductsOnTime, useProductsByClubId, useProfile } from '@hooks/useQueryHooks';
import { useAuthStore } from '@stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type TabType = 'CLUB_ITEM' | 'EVENT_ITEM';

interface Club {
  id: number;
  name: string;
  description?: string;
  // Add other club properties as needed
}

export default function StudentGiftPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clubId: clubIdParam } = useLocalSearchParams<{ clubId?: string }>();

  // States
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabType>('CLUB_ITEM');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [redeemingProductId, setRedeemingProductId] = useState<number | null>(null);

  // Fetch data using React Query
  const { data: profile = [], isLoading: profileLoading } = useProfile(true);
  const { data: clubsData = [], isLoading: clubsLoading } = useClubs();

  // Get CLUB_ITEM products for selected club
  const {
    data: clubProducts = [],
    isLoading: clubProductsLoading,
    isFetching: clubProductsFetching,
  } = useProductsByClubId(
    Number(selectedClubId),
    !!selectedClubId && selectedTab === 'CLUB_ITEM'
  );

  // Get EVENT_ITEM products for selected club (auto-refresh every 10 seconds)
  const {
    data: eventProducts = [],
    isLoading: eventProductsLoading,
    isFetching: eventProductsFetching,
  } = useEventProductsOnTime(
    Number(selectedClubId),
    !!selectedClubId && selectedTab === 'EVENT_ITEM'
  );

  // Combine products based on selected tab
  const products = selectedTab === 'CLUB_ITEM' ? clubProducts : eventProducts;
  const productsLoading = selectedTab === 'CLUB_ITEM' ? clubProductsLoading : eventProductsLoading;
  const isFetching = selectedTab === 'CLUB_ITEM' ? clubProductsFetching : eventProductsFetching;

  // Extract user club IDs and details from profile
  const userClubIds = useMemo(() => {
    return profile.map((m) => m.clubId);
  }, [profile]);

  const userClubsDetails = useMemo(() => {
    if (!clubsData.length || !userClubIds.length) return [];
    return userClubIds
      .map((id) => clubsData.find((club: any) => club.id === id))
      .filter(Boolean);
  }, [userClubIds, clubsData]);

  // Initialize selected club from URL or user's first club
  useEffect(() => {
    if (userClubIds.length === 0) return;

    const validClubIds = userClubsDetails.map((c: any) => c.id);

    // If clubId from URL and it's valid, use it
    if (clubIdParam && validClubIds.includes(Number(clubIdParam))) {
      if (selectedClubId !== Number(clubIdParam)) {
        setSelectedClubId(Number(clubIdParam));
      }
      return;
    }

    // If current selection is valid, keep it
    if (selectedClubId && validClubIds.includes(selectedClubId)) {
      return;
    }

    // Otherwise, select first club
    if (validClubIds.length > 0) {
      setSelectedClubId(validClubIds[0]);
    }
  }, [userClubIds, userClubsDetails, clubIdParam, selectedClubId]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() });
    if (selectedClubId) {
      if (selectedTab === 'CLUB_ITEM') {
        await queryClient.invalidateQueries({ 
          queryKey: queryKeys.productsByClubId(selectedClubId) 
        });
      } else {
        await queryClient.invalidateQueries({ 
          queryKey: queryKeys.eventProductsOnTime(selectedClubId) 
        });
      }
    }
    setRefreshing(false);
  };

  // Filter products by tab and search (always filter ACTIVE first)
  const filteredProducts = useMemo(() => {
    const activeProducts = products.filter((p) => p.status === 'ACTIVE');
    const typeFilteredProducts = activeProducts.filter((p) => p.type === selectedTab);

    if (!searchTerm) {
      return typeFilteredProducts;
    }

    const searchLower = searchTerm.toLowerCase();
    return typeFilteredProducts.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    });
  }, [products, searchTerm, selectedTab]);

  // Loading state
  const isLoading = clubsLoading || profileLoading || (productsLoading && !selectedClubId);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="light" />
        <Sidebar role={user?.role} />

        <ScrollView
          className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header with Gradient */}
        <View className="bg-gradient-to-br from-teal-500 to-teal-600 px-6 pt-12 pb-8 shadow-lg" style={{ backgroundColor: '#14B8A6' }}>
          <View className="flex-row items-center mb-3">
            <View className="bg-white/20 p-3 rounded-2xl mr-3">
              <Ionicons name="gift" size={32} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-3xl font-bold text-white mb-1">Gift Store</Text>
              <Text className="text-base text-white/90">Redeem your points for amazing rewards</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4">
          {/* Tab Buttons */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => setSelectedTab('CLUB_ITEM')}
              className={`flex-1 py-4 px-4 rounded-2xl shadow-md ${
                selectedTab === 'CLUB_ITEM'
                  ? 'bg-teal-500'
                  : 'bg-white'
              }`}
              style={selectedTab === 'CLUB_ITEM' ? { shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 } : {}}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name="gift"
                  size={20}
                  color={selectedTab === 'CLUB_ITEM' ? 'white' : '#14B8A6'}
                />
                <Text
                  className={`font-bold text-base ${
                    selectedTab === 'CLUB_ITEM' ? 'text-white' : 'text-teal-600'
                  }`}
                >
                  Club Gift
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedTab('EVENT_ITEM')}
              className={`flex-1 py-4 px-4 rounded-2xl shadow-md ${
                selectedTab === 'EVENT_ITEM'
                  ? 'bg-cyan-500'
                  : 'bg-white'
              }`}
              style={selectedTab === 'EVENT_ITEM' ? { shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 } : {}}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name="calendar"
                  size={20}
                  color={selectedTab === 'EVENT_ITEM' ? 'white' : '#06B6D4'}
                />
                <Text
                  className={`font-bold text-base ${
                    selectedTab === 'EVENT_ITEM' ? 'text-white' : 'text-cyan-600'
                  }`}
                >
                  Event Gift
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Search and Club Filter */}
          <View className="bg-white rounded-3xl shadow-lg p-5 mb-4" style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
            {/* Search */}
            <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 mb-4">
              <View className="bg-teal-50 p-2 rounded-xl mr-3">
                <Ionicons name="search" size={20} color="#14B8A6" />
              </View>
              <AppTextInput
                placeholder="Search for gifts..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="flex-1 text-base text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')} className="bg-gray-200 p-2 rounded-xl ml-2">
                  <Ionicons name="close" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            {/* Club Selector */}
            {userClubIds.length > 1 && (
              <View>
                <Text className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Select Club</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-2"
                >
                  {userClubsDetails.map((club: any) => (
                    <TouchableOpacity
                      key={club.id}
                      onPress={() => setSelectedClubId(club.id)}
                      className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                        selectedClubId === club.id
                          ? 'bg-teal-500'
                          : 'bg-gray-100'
                      }`}
                      style={selectedClubId === club.id ? { shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 } : {}}
                    >
                      <Text
                        className={`font-bold text-sm ${
                          selectedClubId === club.id ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {club.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Products Grid */}
          {isLoading || profileLoading ? (
            <View className="bg-white rounded-3xl shadow-lg p-12" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-6 rounded-full mb-4 self-center">
                <ActivityIndicator size="large" color="#14B8A6" />
              </View>
              <Text className="text-center text-gray-800 font-semibold text-lg">Loading Amazing Gifts...</Text>
              <Text className="text-center text-gray-500 text-sm mt-2">Please wait a moment</Text>
            </View>
          ) : isFetching ? (
            <View className="bg-white rounded-3xl shadow-lg p-12" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-6 rounded-full mb-4 self-center">
                <ActivityIndicator size="large" color="#14B8A6" />
              </View>
              <Text className="text-center text-gray-800 font-semibold text-lg">Loading Products...</Text>
              <Text className="text-center text-gray-500 text-sm mt-2">Please wait a moment</Text>
            </View>
          ) : userClubIds.length === 0 ? (
            <View className="bg-white rounded-3xl shadow-lg p-10" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-8 rounded-full mb-6 self-center">
                <Ionicons
                  name="business"
                  size={56}
                  color="#14B8A6"
                />
              </View>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
                No Club Membership
              </Text>
              <Text className="text-gray-600 text-center text-base leading-6 px-4 mb-6">
                Join a club to start redeeming amazing rewards!
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/student/clubs')}
                className="bg-teal-500 px-6 py-3.5 rounded-2xl self-center shadow-lg"
                style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }}
              >
                <Text className="text-white font-bold">Browse Clubs</Text>
              </TouchableOpacity>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View className="bg-white rounded-3xl shadow-lg p-10" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-8 rounded-full mb-6 self-center">
                <Ionicons
                  name="cube-outline"
                  size={56}
                  color="#14B8A6"
                />
              </View>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
                No Products Found
              </Text>
              <Text className="text-gray-600 text-center text-base leading-6 px-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : `No ${selectedTab === 'CLUB_ITEM' ? 'club' : 'event'} gifts available`}
              </Text>
              {searchTerm && (
                <TouchableOpacity
                  onPress={() => setSearchTerm('')}
                  className="bg-gray-200 px-6 py-2.5 rounded-2xl mt-6 self-center"
                >
                  <Text className="text-gray-800 font-bold">Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {filteredProducts.map((product) => {
                const thumbnail =
                  product.media?.find((m) => m.thumbnail)?.url || '/placeholder.svg';
                const isOutOfStock = product.stockQuantity === 0;

                return (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => {
                      if (selectedClubId) {
                        router.push(`/student/gift/${product.id}?clubId=${selectedClubId}` as any);
                      }
                    }}
                    className="w-[48%] bg-white rounded-3xl shadow-lg overflow-hidden"
                    style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 }}
                  >
                    {/* Image */}
                    <View className="relative aspect-square bg-gray-100">
                      <Image
                        source={{ uri: thumbnail }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      {isOutOfStock && (
                        <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-semibold">Out of Stock</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View className="p-3">
                      <Text className="text-sm font-bold text-gray-900 line-clamp-2 mb-2" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-xs text-gray-700 line-clamp-2 mb-2" numberOfLines={2}>
                        {product.description || 'An amazing reward waiting for you!'}
                      </Text>

                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <View className="flex-row flex-wrap gap-1 mb-2">
                          {product.tags.slice(0, 2).map((tag) => (
                            <View key={tag} className="bg-teal-50 px-2 py-1 rounded-lg">
                              <Text className="text-xs text-teal-700 font-bold">{tag}</Text>
                            </View>
                          ))}
                          {product.tags.length > 2 && (
                            <View className="bg-gray-100 px-2 py-1 rounded-lg">
                              <Text className="text-xs text-gray-700 font-bold">+{product.tags.length - 2}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Price and Stock */}
                      <View className="border-t border-gray-100 pt-2.5">
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-1">
                            <Text className="text-xs text-gray-500 font-semibold mb-1">Points</Text>
                            <View className="flex-row items-center">
                              <Ionicons name="trophy" size={18} color="#F59E0B" />
                              <Text className="text-lg font-bold text-amber-600 ml-1">
                                {product.pointCost.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-gray-500 font-semibold text-right mb-1">Stock</Text>
                            <Text
                              className={`text-base font-bold text-right ${
                                isOutOfStock ? 'text-red-500' : 'text-teal-600'
                              }`}
                            >
                              {product.stockQuantity.toLocaleString()}
                            </Text>
                          </View>
                        </View>

                        {/* View Button */}
                        <View className="bg-teal-500 py-2.5 px-3 rounded-2xl shadow-md" style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }}>
                          <View className="flex-row items-center justify-center gap-2">
                            <Ionicons name="eye" size={16} color="white" />
                            <Text className="text-white text-sm font-bold">View Details</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      <NavigationBar role={user?.role} user={user || undefined} />
    </View>
    </>
  );
}
