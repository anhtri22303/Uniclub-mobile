import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import { Product, ProductMedia, ProductService, StockHistory, UpdateProductPayload } from '@services/product.service';
import { Tag, TagService } from '@services/tag.service';
import { useAuthStore } from '@stores/auth.store';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'details' | 'media' | 'stock' | 'redemptions';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = id ? parseInt(id, 10) : null;

  // Get user from auth store
  const { user } = useAuthStore();

  // States
  const [clubId, setClubId] = useState<number | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProductPayload>({
    name: '',
    description: '',
    pointCost: 0,
    stockQuantity: 0,
    type: 'CLUB_ITEM',
    eventId: 0,
    status: 'ACTIVE',
    tagIds: [],
  });
  
  // Stock update modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockDelta, setStockDelta] = useState('0');
  const [stockNote, setStockNote] = useState('');
  
  // Media viewer modal
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(null);
  const videoRef = useRef<Video>(null);

  // Get clubId from user or token (same logic as gift/index.tsx)
  useEffect(() => {
    const getClubId = () => {
      // Try to get clubId from user
      if (user?.clubIds && user.clubIds.length > 0) {
        return user.clubIds[0];
      }
      
      // Try to get from token
      const id = ClubService.getClubIdFromToken();
      return id || null;
    };

    const id = getClubId();
    if (id) {
      setClubId(id);
    } else {
      Alert.alert('Error', 'Club ID not found');
      router.back();
    }
  }, [user]);

  // Load data
  useEffect(() => {
    if (clubId && productId) {
      loadData();
    }
  }, [clubId, productId]);

  const loadData = async () => {
    if (!clubId || !productId) return;

    try {
      setLoading(true);
      const [productData, tagsData] = await Promise.all([
        ProductService.getProductById(clubId, productId),
        TagService.getTags(),
      ]);

      // Log and filter out null/invalid media items
      console.log('📦 Raw product media:', productData.media);
      if (productData.media && Array.isArray(productData.media)) {
        const validMedia = productData.media.filter(m => {
          const isValid = m !== null && m !== undefined && m.url;
          if (!isValid) {
            console.log('❌ Invalid media item found:', m);
          }
          return isValid;
        });
        console.log('✅ Valid media after filtering:', validMedia);
        productData.media = validMedia;
      }

      setProduct(productData);
      setTags(tagsData);
      
      // Initialize form data
      setFormData({
        name: productData.name,
        description: productData.description,
        pointCost: productData.pointCost,
        stockQuantity: productData.stockQuantity,
        type: productData.type,
        eventId: productData.eventId || 0,
        status: productData.status,
        tagIds: productData.tags.map(tagName => {
          const tag = tagsData.find(t => t.name === tagName);
          return tag?.tagId || 0;
        }).filter(id => id > 0),
      });

      // Load stock history if on stock tab
      if (activeTab === 'stock') {
        const history = await ProductService.getStockHistory(clubId, productId);
        setStockHistory(history);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load product');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Save product changes
  const handleSave = async () => {
    if (!clubId || !productId) return;

    try {
      setSaving(true);
      const updatedProduct = await ProductService.updateProduct(clubId, productId, formData);
      
      // Filter out null/invalid media items
      if (updatedProduct.media) {
        updatedProduct.media = updatedProduct.media.filter(m => m && m.url);
      }
      
      setProduct(updatedProduct);
      setIsEditing(false);
      Alert.alert('Success', 'Product updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  // Update stock
  const handleUpdateStock = async () => {
    if (!clubId || !productId) return;

    const delta = parseInt(stockDelta, 10);
    if (isNaN(delta) || delta === 0) {
      Alert.alert('Error', 'Please enter a valid stock change');
      return;
    }

    try {
      const updatedProduct = await ProductService.updateStock(clubId, productId, delta, stockNote);
      setProduct(updatedProduct);
      setShowStockModal(false);
      setStockDelta('0');
      setStockNote('');
      
      // Reload stock history
      const history = await ProductService.getStockHistory(clubId, productId);
      setStockHistory(history);
      
      Alert.alert('Success', 'Stock updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update stock');
    }
  };

  // Delete product
  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!clubId || !productId) return;
            try {
              await ProductService.deleteProduct(clubId, productId);
              Alert.alert('Success', 'Product deleted successfully');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  // Add media
  const handleAddMedia = async () => {
    if (!clubId || !productId) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      try {
        setUploading(true);
        
        // Create FormData with the image URI directly (React Native way)
        const formData = new FormData();
        
        // Extract file extension from URI or use default
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = asset.fileName || `image_${Date.now()}.${fileType}`;
        
        // Append the file for React Native
        formData.append('file', {
          uri: asset.uri,
          type: asset.type === 'image' ? `image/${fileType}` : asset.mimeType || 'image/jpeg',
          name: fileName,
        } as any);

        console.log('📤 Uploading media:', { fileName, type: asset.type, uri: asset.uri });
        
        await ProductService.addMediaToProduct(clubId, productId, formData);
        Alert.alert('Success', 'Image uploaded successfully');
        await loadData();
      } catch (error: any) {
        console.error('Error uploading media:', error);
        Alert.alert('Error', error.message || 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  // Delete media
  const handleDeleteMedia = (mediaId: number) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!clubId || !productId) return;
            try {
              await ProductService.deleteMediaFromProduct(clubId, productId, mediaId);
              Alert.alert('Success', 'Image deleted successfully');
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  // Set thumbnail
  const handleSetThumbnail = async (mediaId: number) => {
    if (!clubId || !productId) return;
    try {
      await ProductService.setMediaThumbnail(clubId, productId, mediaId);
      Alert.alert('Success', 'Thumbnail set successfully');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set thumbnail');
    }
  };

  // Toggle tag selection
  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  // Open media viewer
  const openMediaViewer = (media: ProductMedia) => {
    setSelectedMedia(media);
    setShowMediaViewer(true);
  };

  // Close media viewer
  const closeMediaViewer = () => {
    setShowMediaViewer(false);
    // Pause video if it was playing
    if (videoRef.current) {
      videoRef.current.pauseAsync();
    }
    setTimeout(() => setSelectedMedia(null), 300); // Delay to allow modal animation
  };

  // Check if media is a video
  const isVideo = (media: ProductMedia | null): boolean => {
    if (!media || !media.url) return false;
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
    const extension = media.url.split('.').pop()?.toLowerCase() || '';
    return videoExtensions.includes(extension) || media.type?.toLowerCase().includes('video');
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    const colors = {
      ACTIVE: '#10b981',
      INACTIVE: '#6b7280',
      ARCHIVED: '#ef4444',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-4">Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-600 text-lg font-semibold mt-4">Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const thumbnail = product.media?.filter(m => m && m.url).find(m => m.thumbnail)?.url || product.media?.filter(m => m && m.url)[0]?.url;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
            {/* Header */}
            <View className="bg-white border-b border-gray-200 p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Code: {product.productCode}
                    </Text>
                  </View>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: getStatusBadgeColor(product.status) }}
                >
                  <Text className="text-white text-xs font-semibold">
                    {product.status}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2">
                {!isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      className="flex-1 bg-blue-500 px-4 py-3 rounded-lg flex-row items-center justify-center"
                    >
                      <Ionicons name="create-outline" size={20} color="white" />
                      <Text className="text-white font-semibold ml-2">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleDelete}
                      className="bg-red-500 px-4 py-3 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={20} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={handleSave}
                      disabled={saving}
                      className="flex-1 bg-green-500 px-4 py-3 rounded-lg flex-row items-center justify-center"
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={20} color="white" />
                          <Text className="text-white font-semibold ml-2">Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setIsEditing(false);
                        // Reset form data
                        setFormData({
                          name: product.name,
                          description: product.description,
                          pointCost: product.pointCost,
                          stockQuantity: product.stockQuantity,
                          type: product.type,
                          eventId: product.eventId || 0,
                          status: product.status,
                          tagIds: product.tags.map(tagName => {
                            const tag = tags.find(t => t.name === tagName);
                            return tag?.tagId || 0;
                          }).filter(id => id > 0),
                        });
                      }}
                      className="bg-gray-500 px-4 py-3 rounded-lg"
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="bg-white border-b border-gray-200 px-4 py-2"
            >
              {(['details', 'media', 'stock', 'redemptions'] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab);
                    if (tab === 'stock' && clubId && productId) {
                      ProductService.getStockHistory(clubId, productId).then(setStockHistory);
                    }
                  }}
                  className={`mr-3 px-4 py-2 rounded-lg ${
                    activeTab === tab ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`font-semibold capitalize ${
                      activeTab === tab ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tab Content */}
            <View className="p-4">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <View>
                  {/* Thumbnail */}
                  {thumbnail && (
                    <View className="mb-4">
                      <Image
                        source={{ uri: thumbnail }}
                        className="w-full h-64 rounded-xl"
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Form Fields */}
                  <View className="bg-white rounded-xl p-4 mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Product Name</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4"
                      value={formData.name}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                      editable={isEditing}
                      placeholder="Enter product name"
                    />

                    <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4"
                      value={formData.description}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                      editable={isEditing}
                      placeholder="Enter description"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />

                    <Text className="text-sm font-semibold text-gray-700 mb-2">Point Cost</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4"
                      value={formData.pointCost.toString()}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, pointCost: parseInt(text) || 0 }))}
                      editable={isEditing}
                      placeholder="Enter point cost"
                      keyboardType="numeric"
                    />

                    <Text className="text-sm font-semibold text-gray-700 mb-2">Stock Quantity</Text>
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4"
                      value={formData.stockQuantity.toString()}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(text) || 0 }))}
                      editable={isEditing}
                      placeholder="Enter stock quantity"
                      keyboardType="numeric"
                    />

                    <Text className="text-sm font-semibold text-gray-700 mb-2">Type</Text>
                    <View className="flex-row gap-2 mb-4">
                      {['CLUB_ITEM', 'EVENT_ITEM'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => isEditing && setFormData(prev => ({ ...prev, type }))}
                          disabled={!isEditing}
                          className={`flex-1 px-4 py-3 rounded-lg border ${
                            formData.type === type
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Text
                            className={`text-center font-medium ${
                              formData.type === type ? 'text-blue-700' : 'text-gray-600'
                            }`}
                          >
                            {type.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text className="text-sm font-semibold text-gray-700 mb-2">Status</Text>
                    <View className="flex-row gap-2 mb-4">
                      {['ACTIVE', 'INACTIVE', 'ARCHIVED'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          onPress={() => isEditing && setFormData(prev => ({ ...prev, status }))}
                          disabled={!isEditing}
                          className={`flex-1 px-3 py-2 rounded-lg border ${
                            formData.status === status
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Text
                            className={`text-center text-xs font-medium ${
                              formData.status === status ? 'text-blue-700' : 'text-gray-600'
                            }`}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Tags */}
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Tags</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {tags.map((tag) => (
                        <TouchableOpacity
                          key={tag.tagId}
                          onPress={() => isEditing && toggleTag(tag.tagId)}
                          disabled={!isEditing}
                          className={`px-3 py-2 rounded-lg ${
                            formData.tagIds.includes(tag.tagId)
                              ? 'bg-purple-500'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              formData.tagIds.includes(tag.tagId) ? 'text-white' : 'text-gray-600'
                            }`}
                          >
                            #{tag.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Stats */}
                  <View className="bg-white rounded-xl p-4">
                    <Text className="text-lg font-bold text-gray-900 mb-3">Statistics</Text>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-gray-600">Total Redeemed:</Text>
                      <Text className="font-semibold text-gray-900">{product.redeemCount || 0}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-gray-600">Current Stock:</Text>
                      <Text className="font-semibold text-gray-900">{product.stockQuantity}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Created:</Text>
                      <Text className="font-semibold text-gray-900">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <View>
                  <TouchableOpacity
                    onPress={handleAddMedia}
                    disabled={uploading}
                    className={`px-4 py-3 rounded-lg flex-row items-center justify-center mb-4 ${
                      uploading ? 'bg-blue-300' : 'bg-blue-500'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text className="text-white font-semibold ml-2">Uploading...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="add" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Add Image</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {product.media && product.media.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2">
                      {product.media
                        .filter(media => media && media.url) // Filter out null/invalid media
                        .map((media) => (
                        <View key={media.mediaId} className="w-[48%] bg-white rounded-xl overflow-hidden">
                          <TouchableOpacity
                            onPress={() => openMediaViewer(media)}
                            activeOpacity={0.8}
                          >
                            {isVideo(media) ? (
                              <View className="relative">
                                <Image
                                  source={{ uri: media.url }}
                                  className="w-full h-48"
                                  resizeMode="cover"
                                />
                                <View className="absolute inset-0 items-center justify-center bg-black/30">
                                  <View className="bg-white/90 rounded-full p-3">
                                    <Ionicons name="play" size={32} color="#3b82f6" />
                                  </View>
                                </View>
                              </View>
                            ) : (
                              <Image
                                source={{ uri: media.url }}
                                className="w-full h-48"
                                resizeMode="cover"
                              />
                            )}
                          </TouchableOpacity>
                          {media.thumbnail && (
                            <View className="absolute top-2 right-2 bg-blue-500 px-2 py-1 rounded">
                              <Text className="text-white text-xs font-semibold">Thumbnail</Text>
                            </View>
                          )}
                          {isVideo(media) && (
                            <View className="absolute top-2 left-2 bg-purple-500 px-2 py-1 rounded">
                              <Text className="text-white text-xs font-semibold">VIDEO</Text>
                            </View>
                          )}
                          <View className="p-2 flex-row gap-1">
                            {!media.thumbnail && (
                              <TouchableOpacity
                                onPress={() => handleSetThumbnail(media.mediaId)}
                                className="flex-1 bg-blue-500 px-2 py-2 rounded"
                              >
                                <Text className="text-white text-xs text-center font-medium">
                                  Set Thumbnail
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => handleDeleteMedia(media.mediaId)}
                              className="bg-red-500 px-3 py-2 rounded"
                            >
                              <Ionicons name="trash-outline" size={16} color="white" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View className="items-center justify-center py-20">
                      <Ionicons name="images-outline" size={64} color="#d1d5db" />
                      <Text className="text-gray-600 text-lg font-semibold mt-4">No images yet</Text>
                      <Text className="text-gray-500 text-sm mt-2">Add images to showcase your product</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Stock Tab */}
              {activeTab === 'stock' && (
                <View>
                  <TouchableOpacity
                    onPress={() => setShowStockModal(true)}
                    className="bg-blue-500 px-4 py-3 rounded-lg flex-row items-center justify-center mb-4"
                  >
                    <Ionicons name="add" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Update Stock</Text>
                  </TouchableOpacity>

                  <View className="bg-white rounded-xl p-4 mb-4">
                    <Text className="text-lg font-bold text-gray-900 mb-2">Current Stock</Text>
                    <Text className="text-4xl font-bold text-blue-600">{product.stockQuantity}</Text>
                  </View>

                  {/* Stock History */}
                  <Text className="text-lg font-bold text-gray-900 mb-3">Stock History</Text>
                  {stockHistory.length > 0 ? (
                    stockHistory.map((history) => (
                      <View key={history.id} className="bg-white rounded-xl p-4 mb-2">
                        <View className="flex-row justify-between items-start mb-2">
                          <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                              <Text className="font-semibold text-gray-900 mr-2">
                                {history.oldStock} → {history.newStock}
                              </Text>
                              <View
                                className={`px-2 py-1 rounded ${
                                  history.newStock > history.oldStock ? 'bg-green-100' : 'bg-red-100'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-semibold ${
                                    history.newStock > history.oldStock ? 'text-green-700' : 'text-red-700'
                                  }`}
                                >
                                  {history.newStock > history.oldStock ? '+' : ''}
                                  {history.newStock - history.oldStock}
                                </Text>
                              </View>
                            </View>
                            {history.note && (
                              <Text className="text-gray-600 text-sm">{history.note}</Text>
                            )}
                          </View>
                          <Text className="text-gray-500 text-xs">
                            {new Date(history.changedAt).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="items-center justify-center py-12 bg-white rounded-xl">
                      <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
                      <Text className="text-gray-600 mt-2">No stock history yet</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Redemptions Tab */}
              {activeTab === 'redemptions' && (
                <View className="items-center justify-center py-20">
                  <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
                  <Text className="text-gray-600 text-lg font-semibold mt-4">
                    Redemption history coming soon
                  </Text>
                  <Text className="text-gray-500 text-sm mt-2">
                    Total redemptions: {product.redeemCount || 0}
                  </Text>
                </View>
              )}
            </View>
      </ScrollView>

      {/* Stock Update Modal */}
      <Modal
        visible={showStockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStockModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Update Stock</Text>
              <TouchableOpacity onPress={() => setShowStockModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-semibold text-gray-700 mb-2">Stock Change</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4"
              value={stockDelta}
              onChangeText={setStockDelta}
              placeholder="Enter change (e.g., +10 or -5)"
              keyboardType="numeric"
            />

            <Text className="text-sm font-semibold text-gray-700 mb-2">Note (Optional)</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4"
              value={stockNote}
              onChangeText={setStockNote}
              placeholder="Enter a note for this change"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleUpdateStock}
              className="bg-blue-500 px-4 py-4 rounded-lg"
            >
              <Text className="text-white font-semibold text-center">Update Stock</Text>
            </TouchableOpacity>
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

          {/* Bottom info bar (optional) */}
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
    </SafeAreaView>
  );
}

