import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { queryKeys, useProfile } from '@hooks/useQueryHooks';
import { Product, ProductMedia, ProductService } from '@services/product.service';
import { redeemClubProduct, redeemEventProduct, RedeemPayload } from '@services/redeem.service';
import { useAuthStore } from '@stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { ResizeMode, Video } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function StudentProductDetailPage() {
  const router = useRouter();
  const { id, clubId: clubIdParam } = useLocalSearchParams<{ id: string; clubId?: string }>();
  const productId = id ? parseInt(id, 10) : null;
  const clubIdFromQuery = clubIdParam ? parseInt(clubIdParam, 10) : null;
  const { user } = useAuthStore();
  const videoRef = useRef<Video>(null);
  const queryClient = useQueryClient();

  // States
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(null);

  // Fetch profile with React Query
  const { data: profile = [], isLoading: profileLoading } = useProfile(true);

  // Get user's membership for this club (using profile data)
  const currentMembership = useMemo(() => {
    if (!product || !profile) {
      console.log('Waiting for product or profile data...');
      return null;
    }

    console.log('CHECKING MEMBERSHIP:');
    console.log('Product belongs to clubId:', product.clubId);
    console.log('All memberships from profile:', profile);

    // Find membership directly in profile array
    const foundMembership = profile.find((membership: any) => membership.clubId === product.clubId);

    if (!foundMembership) {
      console.error(`[LOGIC ERROR] You are not a member of clubId: ${product.clubId}`);
      return null;
    }

    if (!foundMembership.membershipId) {
      console.error(`[API ERROR] Profile data is MISSING 'membershipId' for club ${product.clubId}!`);
    } else {
      console.log(`[SUCCESS] Found membership:`, foundMembership);
    }

    return foundMembership;
  }, [product, profile]);

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    if (!productId || !clubIdFromQuery) {
      console.warn('Waiting for productId or clubId...');
      return;
    }

    setLoading(true);
    try {
      const productData = await ProductService.getProductById(clubIdFromQuery, productId);
      
      // Filter out null media
      if (productData.media && Array.isArray(productData.media)) {
        productData.media = productData.media.filter(m => m && m.url);
      }
      
      setProduct(productData);

      // Set initial thumbnail
      const thumbnail = productData.media?.find((m) => m.thumbnail);
      setSelectedImage(thumbnail ? thumbnail.url : productData.media?.[0]?.url || null);
    } catch (error) {
      console.error('Failed to load product details:', error);
      Alert.alert('Error', 'Unable to load product details.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [productId, clubIdFromQuery, router]);

  useEffect(() => {
    if (clubIdFromQuery) {
      fetchProduct();
    }
  }, [fetchProduct, clubIdFromQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProduct();
    // Refresh profile data
    await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() });
    setRefreshing(false);
  };

  // Sorted media (thumbnail first)
  const sortedMedia = useMemo(() => {
    if (!product || !product.media) return [];
    const mediaArray = [...product.media];
    return mediaArray.sort((a, b) => {
      if (a.thumbnail && !b.thumbnail) return -1;
      if (!a.thumbnail && b.thumbnail) return 1;
      return 0;
    });
  }, [product]);

  // Handle image navigation
  const handleImageNavigation = (direction: 'next' | 'prev') => {
    if (!selectedImage || sortedMedia.length <= 1) return;

    const currentIndex = sortedMedia.findIndex((m) => m.url === selectedImage);
    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % sortedMedia.length;
    } else {
      nextIndex = (currentIndex - 1 + sortedMedia.length) % sortedMedia.length;
    }

    setSelectedImage(sortedMedia[nextIndex].url);
  };

  // Handle quantity change
  const handleQuantityChange = (amount: number) => {
    setQuantity((prev) => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (product && newQuantity > product.stockQuantity) {
        Alert.alert('Warning', 'Quantity cannot exceed stock.');
        return product.stockQuantity;
      }
      return newQuantity;
    });
  };

  // Handle redeem
  const handleRedeem = async () => {
    if (!product || !currentMembership) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Cannot redeem. Product or membership data is missing.',
      });
      return;
    }

    if (!currentMembership.membershipId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Membership ID not found. Cannot redeem.',
      });
      return;
    }

    setIsRedeeming(true);
    const payload: RedeemPayload = {
      productId: product.id,
      quantity: quantity,
      membershipId: currentMembership.membershipId,
    };

    try {
      let redeemedOrder;
      if (product.type === 'EVENT_ITEM' && product.eventId) {
        redeemedOrder = await redeemEventProduct(product.eventId, payload);
      } else if (product.type === 'CLUB_ITEM') {
        redeemedOrder = await redeemClubProduct(product.clubId, payload);
      } else {
        throw new Error('Invalid product data. Cannot determine redeem endpoint.');
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `You have successfully redeemed ${redeemedOrder.quantity} x ${redeemedOrder.productName}.`,
      });
      setIsConfirmOpen(false);
      setQuantity(1);

      // Refresh profile data and product
      await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() });
      await fetchProduct();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Redemption Failed',
        text2: error.message || 'Not enough points or product is out of stock.',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Open media viewer
  const openMediaViewer = (media: ProductMedia) => {
    setSelectedMedia(media);
    setShowMediaViewer(true);
  };

  // Close media viewer
  const closeMediaViewer = () => {
    setShowMediaViewer(false);
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
    setTimeout(() => setSelectedMedia(null), 300);
  };

  // Check if media is video
  const isVideo = (media: ProductMedia | null): boolean => {
    if (!media || !media.url) return false;
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
    const extension = media.url.split('.').pop()?.toLowerCase() || '';
    return videoExtensions.includes(extension) || media.type?.toLowerCase().includes('video');
  };

  // Handle back navigation
  const handleBack = () => {
    if (clubIdFromQuery) {
      router.push(`/student/gift?clubId=${clubIdFromQuery}` as any);
    } else {
      router.push('/student/gift' as any);
    }
  };

  if (loading && !product || profileLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-gray-50 pt-12">
          <StatusBar style="dark" />
          <Sidebar role={user?.role} />
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-4">Loading product...</Text>
          </View>
        </View>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-gray-50 pt-12">
          <StatusBar style="dark" />
          <Sidebar role={user?.role} />
          <View className="p-4">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <View className="flex-row items-center">
                <Ionicons name="arrow-back" size={24} color="#374151" />
                <Text className="ml-2 text-base font-medium">Back</Text>
              </View>
            </TouchableOpacity>
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-semibold text-gray-900 mt-4">Product Not Found</Text>
              <Text className="text-gray-600 mt-2">This product may have been removed or is unavailable.</Text>
            </View>
          </View>
        </View>
      </>
    );
  }

  const isAvailable = product.status === 'ACTIVE' && product.stockQuantity > 0;
  const canRedeem = isAvailable && currentMembership != null && !profileLoading;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />
      
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Back Button */}
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={handleBack}>
            <View className="flex-row items-center">
              <Ionicons name="arrow-back" size={24} color="#374151" />
              <Text className="ml-2 text-base font-medium">Back to Gift Shop</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="p-4 space-y-4">
          {/* Main Image */}
          <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                const currentMedia = sortedMedia.find((m) => m.url === selectedImage);
                if (currentMedia) {
                  openMediaViewer(currentMedia);
                }
              }}
              className="aspect-square bg-gray-100 relative"
            >
              {selectedImage ? (
                <>
                  {isVideo(sortedMedia.find((m) => m.url === selectedImage) || null) ? (
                    <View className="relative w-full h-full">
                      <Image
                        source={{ uri: selectedImage }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <View className="absolute inset-0 items-center justify-center bg-black/30">
                        <View className="bg-white/90 rounded-full p-4">
                          <Ionicons name="play" size={48} color="#3B82F6" />
                        </View>
                        <Text className="text-white font-semibold mt-2 bg-black/50 px-3 py-1 rounded">
                          Tap to play video
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: selectedImage }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  )}
                </>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">No image available</Text>
                </View>
              )}

              {/* Navigation Buttons */}
              {sortedMedia.length > 1 && (
                <>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleImageNavigation('prev');
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full"
                  >
                    <Ionicons name="chevron-back" size={24} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleImageNavigation('next');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full"
                  >
                    <Ionicons name="chevron-forward" size={24} color="#374151" />
                  </TouchableOpacity>
                </>
              )}

              {/* Image Counter */}
              {sortedMedia.length > 1 && (
                <View className="absolute bottom-2 right-2 bg-black/60 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    {sortedMedia.findIndex((m) => m.url === selectedImage) + 1} / {sortedMedia.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Thumbnails */}
          {sortedMedia.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {sortedMedia.map((m) => (
                <TouchableOpacity
                  key={m.mediaId}
                  onPress={() => setSelectedImage(m.url)}
                  className={`aspect-square w-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === m.url ? 'border-blue-600' : 'border-gray-200'
                  }`}
                >
                  {isVideo(m) ? (
                    <View className="relative w-full h-full">
                      <Image source={{ uri: m.url }} className="w-full h-full" resizeMode="cover" />
                      <View className="absolute inset-0 items-center justify-center bg-black/30">
                        <Ionicons name="play-circle" size={24} color="white" />
                      </View>
                    </View>
                  ) : (
                    <Image source={{ uri: m.url }} className="w-full h-full" resizeMode="cover" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Product Name */}
          <View>
            <Text className="text-3xl font-bold text-gray-900">{product.name}</Text>
            <View className="h-1 w-16 bg-blue-600 rounded-full mt-2" />
          </View>

          {/* Price and Stock */}
          <View className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-gray-500 uppercase tracking-wide mb-1">Redemption Cost</Text>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="wallet" size={20} color="#3B82F6" />
                  <Text className="text-3xl font-bold text-blue-600">
                    {product.pointCost.toLocaleString()}
                  </Text>
                  <Text className="text-lg text-gray-600">pts</Text>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-xs text-gray-500 uppercase tracking-wide mb-1">Availability</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    isAvailable ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  <Text className="text-white text-sm font-semibold">
                    {isAvailable ? `${product.stockQuantity} in stock` : 'Out of Stock'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quantity Selector */}
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-base font-semibold mb-3">Select Quantity</Text>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || !canRedeem}
                className={`p-3 rounded-lg border-2 ${
                  quantity <= 1 || !canRedeem
                    ? 'border-gray-300 bg-gray-100'
                    : 'border-blue-600 bg-blue-50'
                }`}
              >
                <Ionicons name="remove" size={24} color={quantity <= 1 || !canRedeem ? '#9CA3AF' : '#3B82F6'} />
              </TouchableOpacity>

              <TextInput
                value={quantity.toString()}
                editable={false}
                className="w-20 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg py-2"
              />

              <TouchableOpacity
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= product.stockQuantity || !canRedeem}
                className={`p-3 rounded-lg border-2 ${
                  quantity >= product.stockQuantity || !canRedeem
                    ? 'border-gray-300 bg-gray-100'
                    : 'border-blue-600 bg-blue-50'
                }`}
              >
                <Ionicons name="add" size={24} color={quantity >= product.stockQuantity || !canRedeem ? '#9CA3AF' : '#3B82F6'} />
              </TouchableOpacity>
            </View>

            {/* Total Cost */}
            <View className="mt-4 p-3 bg-blue-100 rounded-lg">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-semibold text-gray-700">Total Cost:</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-2xl font-bold text-blue-600">
                    {(product.pointCost * quantity).toLocaleString()}
                  </Text>
                  <Text className="text-base text-gray-600">points</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Warning Messages */}
          {!isAvailable && (
            <View className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text className="font-semibold text-red-900">This item is currently unavailable.</Text>
              </View>
            </View>
          )}
          {isAvailable && !currentMembership && !profileLoading && (
            <View className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                <Text className="font-semibold text-yellow-900">
                  You must be a member of this club to redeem this item.
                </Text>
              </View>
            </View>
          )}

          {/* Redeem Button */}
          <TouchableOpacity
            onPress={() => setIsConfirmOpen(true)}
            disabled={!canRedeem || isRedeeming || profileLoading}
            className={`py-4 rounded-xl ${
              !canRedeem || isRedeeming || profileLoading ? 'bg-gray-300' : 'bg-blue-600'
            }`}
          >
            <View className="flex-row items-center justify-center gap-2">
              {profileLoading ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white text-lg font-bold">Loading membership...</Text>
                </>
              ) : isRedeeming ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white text-lg font-bold">Processing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cart" size={20} color="white" />
                  <Text className="text-white text-lg font-bold">Redeem Now</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Description */}
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-lg font-semibold">Product Description</Text>
            </View>
            <Text className="text-base text-gray-700 leading-relaxed">
              {product.description || 'No description provided for this amazing product.'}
            </Text>
          </View>

          {/* Tags */}
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="pricetag" size={20} color="#8B5CF6" />
              <Text className="text-lg font-semibold">Product Tags</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {product.tags.length > 0 ? (
                product.tags.map((tag) => (
                  <View
                    key={tag}
                    className="bg-purple-50 border-2 border-purple-200 px-3 py-1 rounded-full"
                  >
                    <Text className="text-purple-700 text-sm font-semibold">{tag}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-gray-500 italic">No tags available for this product.</Text>
              )}
            </View>
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={isConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConfirmOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="bg-blue-500 p-2 rounded-lg">
                <Ionicons name="cart" size={24} color="white" />
              </View>
              <Text className="text-xl font-bold">Confirm Redemption</Text>
            </View>

            <View className="bg-blue-50 rounded-lg p-4 mb-4">
              <View className="flex-row items-start gap-2 mb-3">
                <Ionicons name="cube" size={20} color="#3B82F6" />
                <View className="flex-1">
                  <Text className="text-sm text-gray-600">Product</Text>
                  <Text className="font-bold text-gray-900">{product.name}</Text>
                </View>
              </View>
              
              <View className="h-px bg-gray-300 mb-3" />
              
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-sm text-gray-600">Quantity</Text>
                  <Text className="font-bold text-gray-900 text-lg">{quantity}</Text>
                </View>
                <View>
                  <Text className="text-sm text-gray-600 text-right">Total Cost</Text>
                  <Text className="font-bold text-blue-600 text-lg">
                    {(product.pointCost * quantity).toLocaleString()} pts
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mb-6">
              <View className="flex-row items-start gap-2">
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <Text className="text-sm font-semibold text-yellow-900 flex-1">
                  This action cannot be undone! Points will be deducted immediately.
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsConfirmOpen(false)}
                disabled={isRedeeming}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRedeem}
                disabled={isRedeeming}
                className="flex-1 bg-blue-600 py-3 rounded-lg"
              >
                {isRedeeming ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center font-semibold text-white">Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Media Viewer Modal */}
      <Modal
        visible={showMediaViewer}
        transparent
        animationType="fade"
        onRequestClose={closeMediaViewer}
      >
        <View className="flex-1 bg-black">
          {/* Header with close button */}
          <SafeAreaView className="absolute top-0 left-0 right-0 z-10">
            <View className="flex-row items-center justify-between px-4 py-2">
              <View className="flex-1">
                {selectedMedia && (
                  <View>
                    <Text className="text-white font-semibold text-lg">
                      {isVideo(selectedMedia) ? 'Video' : 'Image'}
                    </Text>
                    {selectedMedia.thumbnail && (
                      <Text className="text-white/70 text-sm">Thumbnail</Text>
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={closeMediaViewer}
                className="bg-white/20 p-2 rounded-full"
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Media Content */}
          <View className="flex-1 items-center justify-center">
            {selectedMedia && (
              <>
                {isVideo(selectedMedia) ? (
                  <Video
                    ref={videoRef}
                    source={{ uri: selectedMedia.url }}
                    style={{
                      width: Dimensions.get('window').width,
                      height: Dimensions.get('window').height * 0.7,
                    }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    isLooping
                  />
                ) : (
                  <ScrollView
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: Dimensions.get('window').height,
                    }}
                  >
                    <Image
                      source={{ uri: selectedMedia.url }}
                      style={{
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height,
                      }}
                      resizeMode="contain"
                    />
                  </ScrollView>
                )}
              </>
            )}
          </View>

          {/* Bottom info bar */}
          <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-sm">
                  {isVideo(selectedMedia!) ? '📹 Video' : '🖼️ Image'} • Tap to interact
                </Text>
              </View>
              {selectedMedia && !isVideo(selectedMedia) && (
                <Text className="text-white/70 text-xs">Pinch to zoom</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </>
  );
}
