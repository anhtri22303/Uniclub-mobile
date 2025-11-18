import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { queryKeys, useClubs, useProductsByClubId, useProfile } from '@hooks/useQueryHooks';
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
  TextInput,
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

  // Get products for selected club
  const {
    data: products = [],
    isLoading: productsLoading,
    isFetching,
  } = useProductsByClubId(
    Number(selectedClubId),
    !!selectedClubId
  );

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
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.productsByClubId(selectedClubId) 
      });
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
      <View className="flex-1 bg-gray-50">
        <StatusBar style="light" />
        <Sidebar role={user?.role} />

        <ScrollView
          className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header with Gradient */}
        <View className="bg-blue-600 px-6 pt-12 pb-8">
          <Text className="text-3xl font-bold text-white mb-2">Gift Store</Text>
          <Text className="text-base text-white">Redeem your points for amazing rewards</Text>
        </View>

        <View className="px-4 pt-4">
          {/* Tab Buttons */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => setSelectedTab('CLUB_ITEM')}
              className={`flex-1 py-4 px-4 rounded-lg ${
                selectedTab === 'CLUB_ITEM'
                  ? 'bg-blue-600'
                  : 'bg-white border-2 border-gray-200'
              }`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name="gift"
                  size={20}
                  color={selectedTab === 'CLUB_ITEM' ? 'white' : '#374151'}
                />
                <Text
                  className={`font-semibold text-base ${
                    selectedTab === 'CLUB_ITEM' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Club Gift
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedTab('EVENT_ITEM')}
              className={`flex-1 py-4 px-4 rounded-lg ${
                selectedTab === 'EVENT_ITEM'
                  ? 'bg-purple-600'
                  : 'bg-white border-2 border-gray-200'
              }`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name="calendar"
                  size={20}
                  color={selectedTab === 'EVENT_ITEM' ? 'white' : '#374151'}
                />
                <Text
                  className={`font-semibold text-base ${
                    selectedTab === 'EVENT_ITEM' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Event Gift
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Search and Club Filter */}
          <View className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            {/* Search */}
            <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 mb-3">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Search for gifts..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="flex-1 ml-2 text-base"
                placeholderTextColor="#9CA3AF"
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Club Selector */}
            {userClubIds.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2"
              >
                {userClubsDetails.map((club: any) => (
                  <TouchableOpacity
                    key={club.id}
                    onPress={() => setSelectedClubId(club.id)}
                    className={`px-4 py-2 rounded-lg border ${
                      selectedClubId === club.id
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedClubId === club.id ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {club.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Products Grid */}
          {isLoading || profileLoading ? (
            <View className="bg-white rounded-lg border border-gray-200 p-16">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-center text-gray-600 mt-4">Loading Amazing Gifts...</Text>
            </View>
          ) : isFetching ? (
            <View className="bg-white rounded-lg border border-gray-200 p-16">
              <ActivityIndicator size="large" color="#A855F7" />
              <Text className="text-center text-gray-600 mt-4">Loading Products...</Text>
            </View>
          ) : userClubIds.length === 0 ? (
            <View className="bg-orange-50 rounded-lg border border-orange-200 p-16">
              <Ionicons
                name="alert-circle-outline"
                size={64}
                color="#F97316"
                style={{ alignSelf: 'center' }}
              />
              <Text className="text-2xl font-bold text-orange-900 text-center mt-4">
                No Club Membership
              </Text>
              <Text className="text-orange-700 text-center mt-2">
                Join a club to start redeeming amazing rewards!
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/student/clubs')}
                className="bg-orange-500 px-6 py-3 rounded-lg mt-6 self-center"
              >
                <Text className="text-white font-semibold">Browse Clubs</Text>
              </TouchableOpacity>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View className="bg-white rounded-lg border border-gray-200 p-16">
              <Ionicons
                name="cube-outline"
                size={64}
                color="#9CA3AF"
                style={{ alignSelf: 'center' }}
              />
              <Text className="text-2xl font-bold text-gray-900 text-center mt-4">
                No Products Found
              </Text>
              <Text className="text-gray-600 text-center mt-2">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : `No ${selectedTab === 'CLUB_ITEM' ? 'club' : 'event'} gifts available`}
              </Text>
              {searchTerm && (
                <TouchableOpacity
                  onPress={() => setSearchTerm('')}
                  className="bg-gray-200 px-6 py-2 rounded-lg mt-4 self-center"
                >
                  <Text className="text-gray-800 font-medium">Clear Search</Text>
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
                    className="w-[48%] bg-white rounded-lg border border-gray-200 overflow-hidden"
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
                            <View key={tag} className="bg-blue-50 px-2 py-1 rounded border border-blue-200">
                              <Text className="text-xs text-blue-700 font-medium">{tag}</Text>
                            </View>
                          ))}
                          {product.tags.length > 2 && (
                            <View className="bg-gray-100 px-2 py-1 rounded">
                              <Text className="text-xs text-gray-700">+{product.tags.length - 2}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Price and Stock */}
                      <View className="border-t border-gray-200 pt-2">
                        <View className="flex-row items-center justify-between mb-2">
                          <View>
                            <Text className="text-xs text-gray-600 font-medium">Points</Text>
                            <Text className="text-lg font-bold text-gray-900">
                              {product.pointCost.toLocaleString()}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-xs text-gray-600 font-medium text-right">Stock</Text>
                            <Text
                              className={`text-sm font-bold text-right ${
                                isOutOfStock ? 'text-red-500' : 'text-green-600'
                              }`}
                            >
                              {product.stockQuantity.toLocaleString()}
                            </Text>
                          </View>
                        </View>

                        {/* View Button */}
                        <View className="bg-blue-600 py-2 px-3 rounded-lg">
                          <View className="flex-row items-center justify-center gap-2">
                            <Ionicons name="eye" size={14} color="white" />
                            <Text className="text-white text-sm font-semibold">View</Text>
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
