import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Services
import { ClubService } from '@services/club.service';
import { getEventByClubId } from '@services/event.service';
import { AddProductPayload, Product, ProductService } from '@services/product.service';
import { Tag, TagService } from '@services/tag.service';

// Components
import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { useAuthStore } from '@stores/auth.store';

// Types
type StatusFilter = 'all' | 'active' | 'inactive' | 'archived';
type SortBy = 'popular' | 'price_asc' | 'price_desc' | 'hot_promo';

const initialFormState: AddProductPayload = {
  name: '',
  description: '',
  pointCost: 0,
  stockQuantity: 0,
  type: 'CLUB_ITEM',
  tagIds: [],
  eventId: 0,
};

// Fixed tag IDs interface
interface FixedTagIds {
  clubTagId: number | null;
  eventTagId: number | null;
}

// Description length limit
const MAX_DESCRIPTION_LENGTH = 500;

// Parse API error helper
const parseApiError = (error: any): string => {
  const defaultMessage = 'Failed to create product. Please try again.';

  if (error?.response?.data) {
    const data = error.response.data;

    if (data.message && typeof data.message === 'string') {
      return data.message;
    }

    if (data.error && typeof data.error === 'string') {
      const parts = data.error.split(':');
      if (parts.length > 1) {
        const fieldName = parts[0].trim();
        const errorMessage = parts.slice(1).join(':').trim();
        const friendlyFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        return `${friendlyFieldName}: ${errorMessage}`;
      }
      return data.error;
    }
  }

  if (error.message && typeof error.message === 'string') {
    if (error.message.includes('code 400')) {
      return 'Bad request. Please check your input.';
    }
    return error.message;
  }

  return defaultMessage;
};

export default function ClubLeaderGiftPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [clubId, setClubId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [form, setForm] = useState<AddProductPayload>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fixed tag IDs
  const [fixedTagIds, setFixedTagIds] = useState<FixedTagIds>({
    clubTagId: null,
    eventTagId: null,
  });

  // Description validation
  const isDescriptionTooLong = form.description.length > MAX_DESCRIPTION_LENGTH;

  // Get clubId from user
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
    setClubId(id);
  }, [user]);

  // Load data
  const loadData = async () => {
    if (!clubId) return;

    try {
      const [productsData, tagsData, eventsData] = await Promise.all([
        ProductService.getProducts(clubId, {
          includeInactive: true,
          includeArchived: true,
        }).catch(() => []),
        TagService.getTags().catch(() => []),
        getEventByClubId(clubId).catch(() => []),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);

      // Find fixed tags
      if (tagsData.length > 0) {
        const clubTag = tagsData.find((tag: Tag) => tag.name.toLowerCase() === 'club');
        const eventTag = tagsData.find((tag: Tag) => tag.name.toLowerCase() === 'event');

        const ids = {
          clubTagId: clubTag ? clubTag.tagId : null,
          eventTagId: eventTag ? eventTag.tagId : null,
        };
        setFixedTagIds(ids);

        // Set default tag
        if (ids.clubTagId) {
          setForm((prev) => ({
            ...initialFormState,
            tagIds: [ids.clubTagId as number],
          }));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clubId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Filter available events (APPROVED and ONGOING only)
  const availableEvents = useMemo(() => {
    if (!events) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      const parts = event.date.split('-').map(Number);
      const eventDate = new Date(parts[0], parts[1] - 1, parts[2]);

      // Normalize status to handle "ONGOING" and "ON-GOING"
      const normalizedStatus = (event.status || '').toString().toUpperCase().replace(/-/g, '');

      if (normalizedStatus === 'ONGOING') return true;
      if (normalizedStatus === 'APPROVED' && eventDate >= today) return true;

      return false;
    });
  }, [events]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter((p) => p.status === 'ACTIVE');
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((p) => p.status === 'INACTIVE');
    } else if (statusFilter === 'archived') {
      filtered = filtered.filter((p) => p.status === 'ARCHIVED');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by stock
    if (inStockOnly) {
      filtered = filtered.filter((p) => p.status === 'ACTIVE' && p.stockQuantity > 0);
    }

    // Filter by tags
    if (selectedTags.size > 0) {
      const selectedTagsArray = Array.from(selectedTags);
      filtered = filtered.filter((p) =>
        selectedTagsArray.some((selectedTag) => p.tags.includes(selectedTag))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.pointCost - b.pointCost);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.pointCost - a.pointCost);
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchTerm, statusFilter, sortBy, inStockOnly, selectedTags]);

  // Handle form changes
  const handleChange = (name: string, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for numeric fields with formatting
  const handleNumericChange = (name: string, text: string) => {
    const cleanValue = text.replace(/[^0-9]/g, '');
    const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    setForm((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const handleTypeChange = (value: string) => {
    const { clubTagId, eventTagId } = fixedTagIds;

    setForm((prev) => {
      let newTagIds = [...prev.tagIds];
      newTagIds = newTagIds.filter((id) => id !== clubTagId && id !== eventTagId);

      if (value === 'CLUB_ITEM' && clubTagId) {
        newTagIds.push(clubTagId);
      } else if (value === 'EVENT_ITEM' && eventTagId) {
        newTagIds.push(eventTagId);
      }

      const isEventItem = value === 'EVENT_ITEM';
      return {
        ...prev,
        type: value,
        tagIds: newTagIds,
        eventId: isEventItem ? prev.eventId : 0,
      };
    });
  };

  const handleTagToggle = (tagId: number) => {
    const { clubTagId, eventTagId } = fixedTagIds;
    if (tagId === clubTagId || tagId === eventTagId) return;

    setForm((prev) => {
      const currentTags = prev.tagIds || [];
      if (currentTags.includes(tagId)) {
        return { ...prev, tagIds: currentTags.filter((id) => id !== tagId) };
      } else {
        return { ...prev, tagIds: [...currentTags, tagId] };
      }
    });
  };

  const handleCreate = async () => {
    if (!clubId) {
      Alert.alert('Error', 'Club ID not found');
      return;
    }

    if (!form.tagIds || form.tagIds.length === 0) {
      Alert.alert('Error', 'Product must have at least one tag');
      return;
    }

    if (form.type === 'EVENT_ITEM' && (!form.eventId || form.eventId === 0)) {
      Alert.alert('Error', 'You must select an event for Event Item');
      return;
    }

    setSubmitting(true);
    try {
      const payload: AddProductPayload = {
        ...form,
        eventId: form.type === 'EVENT_ITEM' ? form.eventId : 0,
      };

      await ProductService.addProduct(clubId, payload);
      Alert.alert('Success', 'Product created successfully!');
      setAddModalVisible(false);

      // Reset form
      if (fixedTagIds.clubTagId) {
        setForm({
          ...initialFormState,
          tagIds: [fixedTagIds.clubTagId],
        });
      } else {
        setForm(initialFormState);
      }
      setTagSearchTerm('');

      // Reload data
      await loadData();
    } catch (err: any) {
      console.error('Create product error:', err.response || err);
      Alert.alert('Error', parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'INACTIVE':
        return 'bg-gray-500';
      case 'ARCHIVED':
        return 'bg-red-600';
      default:
        return 'bg-gray-400';
    }
  };

  // Show loading while auth or data is loading
  if ((loading && !refreshing) || authLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <Sidebar role={user?.role} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-600 mt-4">Loading products...</Text>
        </View>
      </View>
    );
  }

  // Show error if clubId is not found AFTER auth is loaded
  if (!clubId && !authLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <Sidebar role={user?.role} />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-lg font-bold text-gray-800 mt-4">Club ID Not Found</Text>
          <Text className="text-sm text-gray-600 mt-2 text-center">
            Unable to find your club information. Please make sure you are logged in as a club leader.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-purple-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
        <NavigationBar role={user?.role} user={user || undefined} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-gray-50">
        <StatusBar style="light" />
        <Sidebar role={user?.role} />

        {/* Header */}
        <View className="px-6 pt-12 pb-4 bg-blue-600">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">       Gift Products</Text>
            <Text className="text-sm text-white opacity-90 mt-1">Manage club items and events</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (fixedTagIds.clubTagId) {
                setForm({
                  ...initialFormState,
                  tagIds: [fixedTagIds.clubTagId],
                });
              } else {
                setForm(initialFormState);
              }
              setTagSearchTerm('');
              setAddModalVisible(true);
            }}
            disabled={!clubId}
            className="bg-purple-600 px-4 py-3 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-1">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search products..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-2 text-base"
            />
          </View>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            className="bg-gray-100 p-3 rounded-lg"
          >
            <Ionicons name="filter" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Status Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
        >
          {(['all', 'active', 'inactive', 'archived'] as StatusFilter[]).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full mr-2 ${
                statusFilter === status
                  ? 'bg-purple-600'
                  : 'bg-gray-200'
              }`}
            >
              <Text
                className={`font-medium capitalize ${
                  statusFilter === status ? 'text-white' : 'text-gray-700'
                }`}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
      >
        <View className="px-4 py-4">
          {filteredAndSortedProducts.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-semibold text-gray-700 mt-4">No products found</Text>
              <Text className="text-sm text-gray-500 mt-2 text-center px-8">
                {statusFilter === 'archived'
                  ? 'Your archive is empty'
                  : 'Try adjusting filters or create a new product'}
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredAndSortedProducts.map((product) => {
                const thumbnail =
                  product.media?.filter(m => m && m.url).find((m) => m.thumbnail)?.url || 'https://via.placeholder.com/150';

                return (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => router.push(`/club-leader/gift/${product.id}`)}
                    className="w-[48%] mb-4 bg-white rounded-xl overflow-hidden border border-gray-200"
                    style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }}
                  >
                    {/* Image */}
                    <View className="relative">
                      <Image
                        source={{ uri: thumbnail }}
                        className="w-full h-40"
                        resizeMode="cover"
                      />
                      {/* Status Badge */}
                      <View
                        className={`absolute top-2 right-2 px-2 py-1 rounded-md ${getStatusColor(
                          product.status
                        )}`}
                      >
                        <Text className="text-white text-xs font-bold">{product.status}</Text>
                      </View>
                    </View>

                    {/* Content */}
                    <View className="p-3">
                      <Text className="font-bold text-sm text-gray-800" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                        {product.description || 'No description'}
                      </Text>

                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <View className="flex-row flex-wrap gap-1 mt-2">
                          {product.tags.slice(0, 2).map((tag) => (
                            <View key={tag} className="bg-blue-50 px-2 py-0.5 rounded">
                              <Text className="text-[10px] text-blue-600">{tag}</Text>
                            </View>
                          ))}
                          {product.tags.length > 2 && (
                            <View className="bg-gray-100 px-2 py-0.5 rounded">
                              <Text className="text-[10px] text-gray-600">
                                +{product.tags.length - 2}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Price and Stock */}
                      <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-gray-100">
                        <View className="flex-row items-center">
                          <Ionicons name="wallet" size={16} color="#8B5CF6" />
                          <Text className="text-purple-600 font-bold text-sm ml-1">
                            {product.pointCost.toLocaleString()}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons
                            name="cube"
                            size={16}
                            color={product.stockQuantity === 0 ? '#EF4444' : '#6B7280'}
                          />
                          <Text
                            className={`font-bold text-sm ml-1 ${
                              product.stockQuantity === 0 ? 'text-red-600' : 'text-gray-700'
                            }`}
                          >
                            {product.stockQuantity}
                          </Text>
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

      {/* Add Product Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View className="flex-1 bg-white pt-12">
          <View className="flex-1">
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-800">Add New Product</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Form */}
            <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
              {/* Product Type */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Product Type</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleTypeChange('CLUB_ITEM')}
                    className={`flex-1 py-3 rounded-lg border-2 ${
                      form.type === 'CLUB_ITEM'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        form.type === 'CLUB_ITEM' ? 'text-purple-600' : 'text-gray-600'
                      }`}
                    >
                      Club Item
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleTypeChange('EVENT_ITEM')}
                    className={`flex-1 py-3 rounded-lg border-2 ${
                      form.type === 'EVENT_ITEM'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        form.type === 'EVENT_ITEM' ? 'text-purple-600' : 'text-gray-600'
                      }`}
                    >
                      Event Item
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Event Selection (if Event Item) */}
              {form.type === 'EVENT_ITEM' && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Select Event</Text>
                  <ScrollView
                    className="max-h-40 border border-gray-300 rounded-lg"
                    nestedScrollEnabled
                  >
                    {availableEvents.length > 0 ? (
                      availableEvents.map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          onPress={() => handleChange('eventId', event.id)}
                          className={`p-3 border-b border-gray-100 ${
                            form.eventId === event.id ? 'bg-purple-50' : 'bg-white'
                          }`}
                        >
                          <Text
                            className={`font-medium ${
                              form.eventId === event.id ? 'text-purple-600' : 'text-gray-800'
                            }`}
                          >
                            {event.name}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View className="p-3">
                        <Text className="text-gray-500 text-center">No available events</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Product Name */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Product Name</Text>
                <TextInput
                  placeholder="e.g., F-Code Club T-Shirt"
                  value={form.name}
                  onChangeText={(text) => handleChange('name', text)}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                <TextInput
                  placeholder="Detailed product description..."
                  value={form.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className={`border rounded-lg px-4 py-3 text-base ${
                    isDescriptionTooLong ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <View className="flex-row items-center justify-between mt-1">
                  <View className="flex-1">
                    {isDescriptionTooLong && (
                      <Text className="text-xs text-red-600 font-medium">
                        Description exceeds maximum {MAX_DESCRIPTION_LENGTH} characters. 
                        Please shorten by {form.description.length - MAX_DESCRIPTION_LENGTH} characters.
                      </Text>
                    )}
                  </View>
                  <Text className={`text-xs ml-2 ${
                    isDescriptionTooLong ? 'text-red-600 font-semibold' : 'text-gray-500'
                  }`}>
                    {form.description.length} / {MAX_DESCRIPTION_LENGTH}
                  </Text>
                </View>
              </View>

              {/* Price and Stock */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Price (Points)</Text>
                  <TextInput
                    placeholder="0"
                    value={form.pointCost.toLocaleString('en-US')}
                    onChangeText={(text) => handleNumericChange('pointCost', text)}
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Stock</Text>
                  <TextInput
                    placeholder="0"
                    value={form.stockQuantity.toLocaleString('en-US')}
                    onChangeText={(text) => handleNumericChange('stockQuantity', text)}
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  />
                </View>
              </View>

              {/* Tags */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Tags</Text>
                <TextInput
                  placeholder="Search tags..."
                  value={tagSearchTerm}
                  onChangeText={setTagSearchTerm}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-base mb-2"
                />
                <ScrollView className="max-h-32 border border-gray-300 rounded-lg p-2" nestedScrollEnabled>
                  {tags
                    .filter((tag) => tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                    .map((tag) => {
                      const isDisabled =
                        tag.tagId === fixedTagIds.clubTagId || tag.tagId === fixedTagIds.eventTagId;
                      const isSelected = form.tagIds.includes(tag.tagId);

                      return (
                        <TouchableOpacity
                          key={tag.tagId}
                          onPress={() => !isDisabled && handleTagToggle(tag.tagId)}
                          disabled={isDisabled}
                          className={`flex-row items-center p-2 mb-1 rounded ${
                            isSelected ? 'bg-purple-50' : 'bg-white'
                          }`}
                        >
                          <View
                            className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                              isSelected
                                ? 'border-purple-600 bg-purple-600'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                          </View>
                          <Text
                            className={`flex-1 ${
                              isDisabled ? 'text-gray-400' : 'text-gray-800'
                            }`}
                          >
                            {tag.name} {isDisabled && '(Auto)'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View className="px-6 py-4 border-t border-gray-200 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                disabled={submitting}
                className="flex-1 py-3 rounded-lg border border-gray-300 bg-white"
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={submitting || isDescriptionTooLong}
                className={`flex-1 py-3 rounded-lg ${
                  submitting || isDescriptionTooLong ? 'bg-gray-400' : 'bg-purple-600'
                }`}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center font-semibold text-white">Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">Filters & Sort</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* In Stock Only */}
              <TouchableOpacity
                onPress={() => setInStockOnly(!inStockOnly)}
                className="flex-row items-center justify-between py-3 border-b border-gray-100"
              >
                <Text className="text-gray-800 font-medium">Show In Stock Only</Text>
                <View
                  className={`w-12 h-6 rounded-full ${
                    inStockOnly ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
                      inStockOnly ? 'ml-6' : 'ml-0.5'
                    }`}
                  />
                </View>
              </TouchableOpacity>

              {/* Sort By */}
              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Sort By</Text>
                {(['popular', 'price_asc', 'price_desc'] as SortBy[]).map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    onPress={() => setSortBy(sort)}
                    className={`py-3 px-4 mb-2 rounded-lg border-2 ${
                      sortBy === sort
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        sortBy === sort ? 'text-purple-600' : 'text-gray-700'
                      }`}
                    >
                      {sort === 'popular' && 'Popular'}
                      {sort === 'price_asc' && 'Price: Low to High'}
                      {sort === 'price_desc' && 'Price: High to Low'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filter by Tags */}
              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Filter by Tags</Text>
                <View className="flex-row flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.has(tag.name);
                    return (
                      <TouchableOpacity
                        key={tag.tagId}
                        onPress={() => {
                          const newTags = new Set(selectedTags);
                          if (isSelected) {
                            newTags.delete(tag.name);
                          } else {
                            newTags.add(tag.name);
                          }
                          setSelectedTags(newTags);
                        }}
                        className={`px-4 py-2 rounded-full ${
                          isSelected ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {tag.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Clear Filters */}
              <TouchableOpacity
                onPress={() => {
                  setInStockOnly(false);
                  setSelectedTags(new Set());
                  setSortBy('popular');
                }}
                className="mt-6 py-3 rounded-lg border border-gray-300"
              >
                <Text className="text-center font-semibold text-gray-700">Clear All Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <NavigationBar role={user?.role} user={user || undefined} />
    </View>
    </>
  );
}

