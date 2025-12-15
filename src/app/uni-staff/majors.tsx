import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import MajorService, {
    CreateMajorPayload,
    Major,
    UpdateMajorPayload,
} from '@services/major.service';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Color options for major selection
const COLOR_OPTIONS = [
  { value: '#FF6B6B', label: 'Red' },
  { value: '#4ECDC4', label: 'Turquoise' },
  { value: '#45B7D1', label: 'Sky Blue' },
  { value: '#FFA07A', label: 'Light Salmon' },
  { value: '#98D8C8', label: 'Mint' },
  { value: '#F7DC6F', label: 'Yellow' },
  { value: '#BB8FCE', label: 'Purple' },
  { value: '#85C1E2', label: 'Light Blue' },
  { value: '#F8B739', label: 'Orange' },
  { value: '#52B788', label: 'Green' },
  { value: '#E76F51', label: 'Coral' },
  { value: '#2A9D8F', label: 'Teal' },
  { value: '#E9C46A', label: 'Gold' },
  { value: '#F4A261', label: 'Sandy Brown' },
  { value: '#264653', label: 'Dark Slate' },
  { value: '#8338EC', label: 'Violet' },
  { value: '#FB5607', label: 'Orange Red' },
  { value: '#FFBE0B', label: 'Amber' },
  { value: '#3A86FF', label: 'Blue' },
  { value: '#06FFA5', label: 'Aquamarine' },
];

interface MajorFormData {
  name: string;
  majorCode: string;
  description: string;
  colorHex: string;
  active: boolean;
}

export default function UniStaffMajorsPage() {
  // Data states
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);

  // Form data
  const initialFormData: MajorFormData = {
    name: '',
    majorCode: '',
    description: '',
    colorHex: '#3A86FF',
    active: true,
  };

  const [createFormData, setCreateFormData] = useState<MajorFormData>(initialFormData);
  const [editFormData, setEditFormData] = useState<MajorFormData>(initialFormData);

  // Load majors on mount
  useEffect(() => {
    loadMajors();
  }, []);

  const loadMajors = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await MajorService.fetchMajors();
      setMajors(data);
    } catch (error) {
      console.error('Error loading majors:', error);
      Alert.alert('Error', 'Failed to load majors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMajors(true);
  };

  // Filter majors by search
  const filteredMajors = useMemo(() => {
    if (!searchQuery) return majors;
    const q = searchQuery.toLowerCase();
    return majors.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.majorCode && m.majorCode.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [majors, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: majors.length,
      active: majors.filter((m) => m.active).length,
      inactive: majors.filter((m) => !m.active).length,
    };
  }, [majors]);

  // Validate hex color
  const isValidHex = (color: string): boolean => {
    if (!color) return false;
    const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
    return hexRegex.test(color);
  };

  // Check if color is in use by other majors
  const isColorInUse = (color: string, excludeId?: number): boolean => {
    if (!color) return false;
    const normalizedColor = color.trim().toUpperCase();
    return majors.some(
      (major) =>
        major.id !== excludeId &&
        (major.colorHex || '').trim().toUpperCase() === normalizedColor
    );
  };

  // Handlers
  const handleOpenCreateModal = () => {
    setCreateFormData(initialFormData);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (major: Major) => {
    setSelectedMajor(major);
    setEditFormData({
      name: major.name,
      majorCode: major.majorCode || '',
      description: major.description || '',
      colorHex: major.colorHex || '#3A86FF',
      active: major.active,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedMajor(null);
    setCreateFormData(initialFormData);
    setEditFormData(initialFormData);
  };

  const handleCreateMajor = async () => {
    // Validation
    if (!createFormData.name.trim()) {
      Alert.alert('Validation Error', 'Major Name is required');
      return;
    }
    if (!createFormData.majorCode.trim()) {
      Alert.alert('Validation Error', 'Major Code is required');
      return;
    }
    if (!isValidHex(createFormData.colorHex)) {
      Alert.alert('Validation Error', 'Invalid hex color format');
      return;
    }
    if (isColorInUse(createFormData.colorHex)) {
      Alert.alert('Validation Error', 'This color is already in use by another major');
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateMajorPayload = {
        name: createFormData.name.trim(),
        majorCode: createFormData.majorCode.trim(),
        description: createFormData.description.trim(),
        colorHex: createFormData.colorHex,
      };

      await MajorService.createMajor(payload);
      Alert.alert('Success', 'Major created successfully');
      handleCloseModals();
      loadMajors();
    } catch (error: any) {
      console.error('Error creating major:', error);
      Alert.alert('Error', 'Failed to create major. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMajor = async () => {
    if (!selectedMajor) return;

    // Validation
    if (!editFormData.name.trim()) {
      Alert.alert('Validation Error', 'Major Name is required');
      return;
    }
    if (!editFormData.majorCode.trim()) {
      Alert.alert('Validation Error', 'Major Code is required');
      return;
    }
    if (!isValidHex(editFormData.colorHex)) {
      Alert.alert('Validation Error', 'Invalid hex color format');
      return;
    }
    if (isColorInUse(editFormData.colorHex, selectedMajor.id)) {
      Alert.alert('Validation Error', 'This color is already in use by another major');
      return;
    }

    try {
      setIsSaving(true);
      const payload: UpdateMajorPayload = {
        name: editFormData.name.trim(),
        majorCode: editFormData.majorCode.trim(),
        description: editFormData.description.trim(),
        colorHex: editFormData.colorHex,
        active: editFormData.active,
      };

      await MajorService.updateMajorById(selectedMajor.id, payload);
      Alert.alert('Success', 'Major updated successfully');
      handleCloseModals();
      loadMajors();
    } catch (error: any) {
      console.error('Error updating major:', error);
      Alert.alert('Error', 'Failed to update major. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMajor = (major: Major) => {
    Alert.alert(
      'Delete Major',
      `Are you sure you want to delete "${major.name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MajorService.deleteMajorById(major.id);
              Alert.alert('Success', 'Major deleted successfully');
              loadMajors();
            } catch (error) {
              console.error('Error deleting major:', error);
              Alert.alert('Error', 'Failed to delete major. It might be in use.');
            }
          },
        },
      ]
    );
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
                  <Ionicons name="book" size={28} color="#3B82F6" />
                  <Text className="text-2xl font-bold text-gray-900 ml-5">Majors</Text>
                </View>
                {/* <Text className="text-sm text-gray-600">Manage academic majors</Text> */}
              </View>
              <TouchableOpacity
                onPress={handleOpenCreateModal}
                className="bg-blue-600 rounded-xl px-4 py-3 flex-row items-center shadow-md"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-semibold ml-1">Create</Text>
              </TouchableOpacity>
            </View>

            {/* Statistics Cards */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-200">
                <Text className="text-xs text-blue-700 font-medium mb-1">Total Majors</Text>
                <Text className="text-3xl font-bold text-blue-900">{stats.total}</Text>
                <Text className="text-xs text-blue-600 mt-1">All majors</Text>
              </View>

              <View className="flex-1 bg-green-50 rounded-xl p-4 border border-green-200">
                <Text className="text-xs text-green-700 font-medium mb-1">Active</Text>
                <Text className="text-3xl font-bold text-green-900">{stats.active}</Text>
                <Text className="text-xs text-green-600 mt-1">In use</Text>
              </View>

              <View className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <Text className="text-xs text-gray-700 font-medium mb-1">Inactive</Text>
                <Text className="text-3xl font-bold text-gray-900">{stats.inactive}</Text>
                <Text className="text-xs text-gray-600 mt-1">Disabled</Text>
              </View>
            </View>

            {/* Search */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#6B7280" />
                <AppTextInput
                  className="flex-1 ml-2 text-base text-gray-900"
                  placeholder="Search majors..."
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

            {/* Loading State */}
            {loading && (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="mt-4 text-gray-600">Loading majors...</Text>
              </View>
            )}

            {/* No Results */}
            {!loading && filteredMajors.length === 0 && (
              <View className="bg-white rounded-xl p-8 items-center">
                <Ionicons name="book-outline" size={48} color="#9CA3AF" />
                <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                  No majors found
                </Text>
                <Text className="text-gray-600 text-center">
                  {searchQuery ? 'Try adjusting your search' : 'No majors available'}
                </Text>
              </View>
            )}

            {/* Majors List */}
            {!loading &&
              filteredMajors.map((major) => (
                <TouchableOpacity
                  key={major.id}
                  onPress={() => handleOpenEditModal(major)}
                  className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100"
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center mb-2">
                        {/* Color indicator */}
                        <View
                          className="w-6 h-6 rounded-full border-2 border-gray-300 mr-2"
                          style={{ backgroundColor: major.colorHex || '#CCCCCC' }}
                        />
                        <Text
                          className="text-lg font-bold text-gray-900 flex-1"
                          numberOfLines={2}
                        >
                          {major.name}
                        </Text>
                      </View>

                      {/* Major Code */}
                      {major.majorCode && (
                        <View className="flex-row items-center mb-2">
                          <View className="bg-blue-100 px-2 py-1 rounded">
                            <Text className="text-xs font-semibold text-blue-700">
                              {major.majorCode}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Description */}
                      {major.description && (
                        <Text className="text-sm text-gray-600" numberOfLines={2}>
                          {major.description}
                        </Text>
                      )}
                    </View>

                    {/* Actions */}
                    <View className="items-end gap-2">
                      {/* Status Badge */}
                      <View
                        className={`px-3 py-1 rounded-full ${
                          major.active ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            major.active ? 'text-green-700' : 'text-gray-700'
                          }`}
                        >
                          {major.active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>

                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteMajor(major)}
                        className="bg-red-50 p-2 rounded-lg"
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Footer */}
                  <View className="border-t border-gray-200 pt-3 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="color-palette" size={14} color="#6B7280" />
                      <Text className="text-xs font-mono text-gray-600 ml-1">
                        {major.colorHex || 'N/A'}
                      </Text>
                    </View>
                    <View className="bg-gray-100 px-2 py-1 rounded">
                      <Text className="text-xs font-medium text-gray-600">ID: {major.id}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

            {/* Bottom Spacing */}
            <View className="h-8" />
          </View>
        </ScrollView>

        {/* Create Modal */}
        <Modal
          visible={isCreateModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseModals}
        >
          <View
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <View
              className="bg-white rounded-t-3xl p-6 shadow-2xl"
              style={{ maxHeight: '90%' }}
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">Create Major</Text>
                <TouchableOpacity
                  onPress={handleCloseModals}
                  className="bg-gray-100 p-2 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <View className="space-y-4">
                  {/* Major Name */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Major Name <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={createFormData.name}
                      onChangeText={(value) =>
                        setCreateFormData({ ...createFormData, name: value })
                      }
                      placeholder="e.g., Computer Science"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Major Code */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Major Code <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={createFormData.majorCode}
                      onChangeText={(value) =>
                        setCreateFormData({ ...createFormData, majorCode: value })
                      }
                      placeholder="e.g., CS"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Color Hex */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Color <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="border border-gray-300 rounded-xl overflow-hidden">
                      <Picker
                        selectedValue={createFormData.colorHex}
                        onValueChange={(value) =>
                          setCreateFormData({ ...createFormData, colorHex: value })
                        }
                        style={{ height: 50 }}
                      >
                        {COLOR_OPTIONS.map((color) => (
                          <Picker.Item
                            key={color.value}
                            label={`${color.label} (${color.value})`}
                            value={color.value}
                          />
                        ))}
                      </Picker>
                    </View>
                    {/* Color Preview */}
                    <View className="flex-row items-center mt-2">
                      <View
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: createFormData.colorHex }}
                      />
                      <Text className="text-xs font-mono text-gray-600 ml-2">
                        {createFormData.colorHex}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Description
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={createFormData.description}
                      onChangeText={(value) =>
                        setCreateFormData({ ...createFormData, description: value })
                      }
                      placeholder="Optional description"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Buttons */}
                  <View className="flex-row gap-3 mt-6">
                    <TouchableOpacity
                      onPress={handleCloseModals}
                      disabled={isSaving}
                      className="flex-1 bg-gray-200 py-3 rounded-xl"
                    >
                      <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCreateMajor}
                      disabled={isSaving}
                      className={`flex-1 py-3 rounded-xl ${
                        isSaving ? 'bg-blue-300' : 'bg-blue-600'
                      }`}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-center">
                          Create Major
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Edit Modal */}
        <Modal
          visible={isEditModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseModals}
        >
          <View
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <View
              className="bg-white rounded-t-3xl p-6 shadow-2xl"
              style={{ maxHeight: '90%' }}
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">Edit Major</Text>
                <TouchableOpacity
                  onPress={handleCloseModals}
                  className="bg-gray-100 p-2 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <View className="space-y-4">
                  {/* Major ID */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Major ID</Text>
                    <AppTextInput
                      className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-600"
                      value={String(selectedMajor?.id || '')}
                      editable={false}
                    />
                  </View>

                  {/* Major Name */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Major Name <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={editFormData.name}
                      onChangeText={(value) =>
                        setEditFormData({ ...editFormData, name: value })
                      }
                      placeholder="e.g., Computer Science"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Major Code */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Major Code <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={editFormData.majorCode}
                      onChangeText={(value) =>
                        setEditFormData({ ...editFormData, majorCode: value })
                      }
                      placeholder="e.g., CS"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Color Hex */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Color <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="border border-gray-300 rounded-xl overflow-hidden">
                      <Picker
                        selectedValue={editFormData.colorHex}
                        onValueChange={(value) =>
                          setEditFormData({ ...editFormData, colorHex: value })
                        }
                        style={{ height: 50 }}
                      >
                        {COLOR_OPTIONS.map((color) => (
                          <Picker.Item
                            key={color.value}
                            label={`${color.label} (${color.value})`}
                            value={color.value}
                          />
                        ))}
                      </Picker>
                    </View>
                    {/* Color Preview */}
                    <View className="flex-row items-center mt-2">
                      <View
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: editFormData.colorHex }}
                      />
                      <Text className="text-xs font-mono text-gray-600 ml-2">
                        {editFormData.colorHex}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Description
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={editFormData.description}
                      onChangeText={(value) =>
                        setEditFormData({ ...editFormData, description: value })
                      }
                      placeholder="Optional description"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Active Toggle */}
                  <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-300">
                    <Text className="text-sm font-medium text-gray-700">Active Status</Text>
                    <Switch
                      value={editFormData.active}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, active: value })
                      }
                      disabled={isSaving}
                    />
                  </View>

                  {/* Buttons */}
                  <View className="flex-row gap-3 mt-6">
                    <TouchableOpacity
                      onPress={handleCloseModals}
                      disabled={isSaving}
                      className="flex-1 bg-gray-200 py-3 rounded-xl"
                    >
                      <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleUpdateMajor}
                      disabled={isSaving}
                      className={`flex-1 py-3 rounded-xl ${
                        isSaving ? 'bg-blue-300' : 'bg-blue-600'
                      }`}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-center">
                          Save Changes
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
