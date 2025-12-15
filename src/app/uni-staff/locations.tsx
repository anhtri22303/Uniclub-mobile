import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import LocationService, {
    CreateLocationRequest,
    Location,
    UpdateLocationRequest,
} from '@services/location.service';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type SortField = 'name' | 'capacity' | 'id';
type SortOrder = 'asc' | 'desc';

export default function UniStaffLocationsPage() {
  // Data states
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('capacity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<CreateLocationRequest>({
    name: '',
    address: '',
    capacity: 0,
  });

  // Fetch locations
  useEffect(() => {
    loadLocations();
  }, [currentPage, sortField, sortOrder]);

  const loadLocations = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const sortParam = sortOrder === 'asc' ? [sortField] : [`${sortField},desc`];
      const response = await LocationService.fetchLocations({
        page: currentPage,
        size: pageSize,
        sort: sortParam,
      });

      if (response && response.content) {
        setLocations(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      Alert.alert('Error', 'Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLocations(true);
  };

  // Capacity categorization
  const getCapacityCategory = (capacity: number): string => {
    if (capacity <= 50) return 'small';
    if (capacity <= 150) return 'medium';
    if (capacity <= 350) return 'large';
    return 'xlarge';
  };

  const getCapacityBadge = (capacity: number) => {
    const category = getCapacityCategory(capacity);
    if (category === 'small') {
      return { label: 'Small', color: '#3B82F6', bgColor: '#DBEAFE' };
    }
    if (category === 'medium') {
      return { label: 'Medium', color: '#10B981', bgColor: '#D1FAE5' };
    }
    if (category === 'large') {
      return { label: 'Large', color: '#F59E0B', bgColor: '#FEF3C7' };
    }
    return { label: 'XL', color: '#A855F7', bgColor: '#F3E8FF' };
  };

  // Filter and search
  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const matchesSearch =
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCapacity =
        capacityFilter === 'all' ||
        getCapacityCategory(location.capacity) === capacityFilter;

      return matchesSearch && matchesCapacity;
    });
  }, [locations, searchQuery, capacityFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: totalElements,
      totalCapacity: locations.reduce((sum, l) => sum + l.capacity, 0),
      averageCapacity:
        locations.length > 0
          ? Math.round(
              locations.reduce((sum, l) => sum + l.capacity, 0) / locations.length
            )
          : 0,
    };
  }, [locations, totalElements]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      address: '',
      capacity: 0,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      capacity: location.capacity,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    setFormData({ name: '', address: '', capacity: 0 });
  };

  const handleFormSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Location name is required');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Validation Error', 'Address is required');
      return;
    }
    if (formData.capacity <= 0) {
      Alert.alert('Validation Error', 'Capacity must be greater than 0');
      return;
    }

    if (editingLocation) {
      await handleUpdateLocation();
    } else {
      await handleCreateLocation();
    }
  };

  const handleCreateLocation = async () => {
    try {
      setIsSaving(true);
      await LocationService.createLocation(formData);
      Alert.alert('Success', 'Location created successfully');
      handleModalClose();
      loadLocations();
    } catch (error) {
      console.error('Error creating location:', error);
      Alert.alert('Error', 'Failed to create location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation) return;

    try {
      setIsSaving(true);
      await LocationService.updateLocation(
        editingLocation.id,
        formData as UpdateLocationRequest
      );
      Alert.alert('Success', 'Location updated successfully');
      handleModalClose();
      loadLocations();
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Failed to update location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLocation = (location: Location) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await LocationService.deleteLocation(location.id);
              Alert.alert('Success', 'Location deleted successfully');
              loadLocations();
            } catch (error) {
              console.error('Error deleting location:', error);
              Alert.alert('Error', 'Failed to delete location. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <Sidebar role="uni_staff" />
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0D9488']}
              tintColor="#0D9488"
            />
          }
        >
          <View className="p-4 space-y-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="location" size={28} color="#3B82F6" />
                  <Text className="text-2xl font-bold text-gray-900 ml-5">
                    Locations
                  </Text>
                </View>
                {/* <Text className="text-sm text-gray-600">
                  Manage event locations
                </Text> */}
              </View>
              <TouchableOpacity
                onPress={handleOpenCreateModal}
                className="bg-blue-600 rounded-xl px-4 py-3 flex-row items-center shadow-md"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-semibold ml-1">Create</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <Text className="text-xs text-blue-700 font-medium mb-1">
                  Total Locations
                </Text>
                <Text className="text-3xl font-bold text-blue-900">
                  {stats.total}
                </Text>
                <Text className="text-xs text-blue-600 mt-1">Available venues</Text>
              </View>

              <View className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <Text className="text-xs text-purple-700 font-medium mb-1">
                  Total Capacity
                </Text>
                <Text className="text-3xl font-bold text-purple-900">
                  {stats.totalCapacity.toLocaleString()}
                </Text>
                <Text className="text-xs text-purple-600 mt-1">Combined seats</Text>
              </View>
            </View>

            {/* Search and Filters */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              {/* Search Input */}
              <View className="mb-3">
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                  <Ionicons name="search" size={20} color="#6B7280" />
                  <AppTextInput
                    className="flex-1 ml-2 text-base text-gray-900"
                    placeholder="Search by name or address..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Filters Row */}
              <View className="flex-row gap-2">
                {/* Capacity Filter */}
                <View className="flex-1">
                  <Text className="text-xs font-medium text-gray-700 mb-2">
                    Size
                  </Text>
                  <View className="border border-gray-300 rounded-lg overflow-hidden">
                    <Picker
                      selectedValue={capacityFilter}
                      onValueChange={(value) => setCapacityFilter(value)}
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="All Sizes" value="all" />
                      <Picker.Item label="Small (≤50)" value="small" />
                      <Picker.Item label="Medium (≤150)" value="medium" />
                      <Picker.Item label="Large (≤350)" value="large" />
                      <Picker.Item label="XL (>350)" value="xlarge" />
                    </Picker>
                  </View>
                </View>

                {/* Sort Filter */}
                <View className="flex-1">
                  <Text className="text-xs font-medium text-gray-700 mb-2">
                    Sort By
                  </Text>
                  <View className="border border-gray-300 rounded-lg overflow-hidden">
                    <Picker
                      selectedValue={`${sortField}-${sortOrder}`}
                      onValueChange={(value) => {
                        const [field, order] = value.split('-') as [
                          SortField,
                          SortOrder
                        ];
                        setSortField(field);
                        setSortOrder(order);
                        setCurrentPage(0);
                      }}
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="Capacity (High)" value="capacity-desc" />
                      <Picker.Item label="Capacity (Low)" value="capacity-asc" />
                      <Picker.Item label="Name (A-Z)" value="name-asc" />
                      <Picker.Item label="Name (Z-A)" value="name-desc" />
                      <Picker.Item label="ID (Newest)" value="id-desc" />
                      <Picker.Item label="ID (Oldest)" value="id-asc" />
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            {/* Loading State */}
            {loading && (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="mt-4 text-gray-600">Loading locations...</Text>
              </View>
            )}

            {/* No Results */}
            {!loading && filteredLocations.length === 0 && (
              <View className="bg-white rounded-xl p-8 items-center">
                <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                  No locations found
                </Text>
                <Text className="text-gray-600 text-center">
                  {searchQuery || capacityFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No locations available'}
                </Text>
              </View>
            )}

            {/* Locations List */}
            {!loading &&
              filteredLocations.map((location) => {
                const badge = getCapacityBadge(location.capacity);
                return (
                  <TouchableOpacity
                    key={location.id}
                    onPress={() => handleEditClick(location)}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center mb-1">
                          <Text
                            className="text-base font-bold text-gray-900 flex-1"
                            numberOfLines={2}
                          >
                            {location.name}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2 mt-1">
                          <View
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: badge.bgColor }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: badge.color }}
                            >
                              {badge.label}
                            </Text>
                          </View>
                          <View className="bg-gray-100 px-2 py-1 rounded-full">
                            <Text className="text-xs font-medium text-gray-600">
                              #{location.id}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteLocation(location)}
                        className="bg-red-50 p-2 rounded-lg"
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Address */}
                    <View className="flex-row items-start mb-3">
                      <Ionicons
                        name="business"
                        size={16}
                        color="#6B7280"
                        style={{ marginTop: 2 }}
                      />
                      <Text
                        className="text-sm text-gray-600 ml-2 flex-1"
                        numberOfLines={2}
                      >
                        {location.address}
                      </Text>
                    </View>

                    {/* Capacity */}
                    <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                      <View className="flex-row items-center">
                        <Ionicons name="people" size={18} color="#3B82F6" />
                        <Text className="text-sm font-medium text-gray-700 ml-2">
                          Capacity
                        </Text>
                      </View>
                      <Text className="text-lg font-bold text-blue-600">
                        {location.capacity}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

            {/* Pagination */}
            {!loading && filteredLocations.length > 0 && totalPages > 1 && (
              <View className="bg-white rounded-xl p-4 shadow-sm">
                <Text className="text-sm text-gray-600 text-center mb-3">
                  Showing {currentPage * pageSize + 1} to{' '}
                  {Math.min((currentPage + 1) * pageSize, totalElements)} of{' '}
                  {totalElements} locations
                </Text>

                <View className="flex-row items-center justify-center gap-2">
                  <TouchableOpacity
                    onPress={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className={`px-4 py-2 rounded-lg border ${
                      currentPage === 0
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-white border-blue-600'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        currentPage === 0 ? 'text-gray-400' : 'text-blue-600'
                      }`}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <View className="px-4">
                    <Text className="text-sm font-medium text-gray-900">
                      {currentPage + 1} / {totalPages}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className={`px-4 py-2 rounded-lg border ${
                      currentPage === totalPages - 1
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-white border-blue-600'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        currentPage === totalPages - 1
                          ? 'text-gray-400'
                          : 'text-blue-600'
                      }`}
                    >
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Bottom Spacing */}
            <View className="h-8" />
          </View>
        </ScrollView>

        {/* Create/Edit Modal */}
        <Modal
          visible={isModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={handleModalClose}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">
                  {editingLocation ? 'Edit Location' : 'Create Location'}
                </Text>
                <TouchableOpacity
                  onPress={handleModalClose}
                  className="bg-gray-100 p-2 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <View className="space-y-4">
                  {/* Name Input */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Location Name <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={formData.name}
                      onChangeText={(value) =>
                        setFormData((prev) => ({ ...prev, name: value }))
                      }
                      placeholder="e.g., Innovation Lab A3-201"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Address Input */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Address <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={formData.address}
                      onChangeText={(value) =>
                        setFormData((prev) => ({ ...prev, address: value }))
                      }
                      placeholder="e.g., Building A3, FPT University"
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Capacity Input */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Capacity <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={formData.capacity ? formData.capacity.toString() : ''}
                      onChangeText={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          capacity: parseInt(value) || 0,
                        }))
                      }
                      placeholder="e.g., 40"
                      keyboardType="numeric"
                      editable={!isSaving}
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Maximum number of people this location can accommodate
                    </Text>
                  </View>

                  {/* Buttons */}
                  <View className="flex-row gap-3 mt-6">
                    <TouchableOpacity
                      onPress={handleModalClose}
                      disabled={isSaving}
                      className="flex-1 bg-gray-200 py-3 rounded-xl"
                    >
                      <Text className="text-gray-700 font-semibold text-center">
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleFormSubmit}
                      disabled={isSaving}
                      className={`flex-1 py-3 rounded-xl ${
                        isSaving ? 'bg-blue-300' : 'bg-blue-600'
                      }`}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-center">
                          {editingLocation ? 'Save Changes' : 'Create Location'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
