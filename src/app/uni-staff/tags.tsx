import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import TagService, { Tag, UpdateTagDto } from '@services/tag.service';
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
    View} from 'react-native';

type SortField = 'name' | 'description' | 'tagId';
type SortOrder = 'asc' | 'desc';
type TagFilter = 'all' | 'core' | 'custom';

interface TagFormData {
  name: string;
  description: string;
  core: boolean;
}

export default function UniStaffTagsPage() {
  // Data states
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    description: '',
    core: false,
  });

  // Fetch tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const response = await TagService.getTags();
      setTags(response);
    } catch (error) {
      console.error('Error loading tags:', error);
      Alert.alert('Error', 'Failed to load tags. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTags(true);
  };

  // Get tag badge
  const getTagBadge = (isCore: boolean) => {
    if (isCore) {
      return { label: 'Core Tag', color: '#A855F7', bgColor: '#F3E8FF' };
    }
    return { label: 'Custom Tag', color: '#64748B', bgColor: '#F1F5F9' };
  };

  // Filter and sort
  const filteredTags = useMemo(() => {
    let processed = [...tags];

    // Filter
    processed = processed.filter((tag) => {
      const matchesSearch =
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        tagFilter === 'all' ||
        (tagFilter === 'core' && tag.core) ||
        (tagFilter === 'custom' && !tag.core);

      return matchesSearch && matchesFilter;
    });

    // Sort
    processed.sort((a, b) => {
      const fieldA = a[sortField] ?? '';
      const fieldB = b[sortField] ?? '';

      let comparison = 0;
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        comparison = fieldA.localeCompare(fieldB, undefined, { sensitivity: 'base' });
      } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        comparison = fieldA - fieldB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return processed;
  }, [tags, searchQuery, tagFilter, sortField, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: tags.length,
      core: tags.filter((t) => t.core).length,
      custom: tags.filter((t) => !t.core).length,
    };
  }, [tags]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingTag(null);
    setFormData({
      name: '',
      description: '',
      core: false,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      core: tag.core,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTag(null);
    setFormData({ name: '', description: '', core: false });
  };

  const handleFormSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Tag name is required');
      return;
    }

    if (editingTag) {
      await handleUpdateTag();
    } else {
      await handleCreateTag();
    }
  };

  const handleCreateTag = async () => {
    try {
      setIsSaving(true);
      await TagService.addTag(formData.name);
      Alert.alert('Success', 'Tag created successfully');
      handleModalClose();
      loadTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('Error', 'Failed to create tag. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;

    try {
      setIsSaving(true);
      const updateData: UpdateTagDto = {
        name: formData.name,
        description: formData.description,
        core: formData.core,
      };
      await TagService.updateTag(editingTag.tagId, updateData);
      Alert.alert('Success', 'Tag updated successfully');
      handleModalClose();
      loadTags();
    } catch (error) {
      console.error('Error updating tag:', error);
      Alert.alert('Error', 'Failed to update tag. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    if (tag.core) {
      Alert.alert('Action Prohibited', 'Core tags cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete "${tag.name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TagService.deleteTag(tag.tagId);
              Alert.alert('Success', 'Tag deleted successfully');
              loadTags();
            } catch (error) {
              console.error('Error deleting tag:', error);
              Alert.alert('Error', 'Failed to delete tag. It might be in use.');
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
                  <Ionicons name="pricetags" size={28} color="#A855F7" />
                  <Text className="text-2xl font-bold text-gray-900 ml-5">Tags</Text>
                </View>
                {/* <Text className="text-sm text-gray-600">
                  Manage system-wide tags
                </Text> */}
              </View>
              <TouchableOpacity
                onPress={handleOpenCreateModal}
                className="bg-purple-600 rounded-xl px-4 py-3 flex-row items-center shadow-md"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-semibold ml-1">Create</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <Text className="text-xs text-purple-700 font-medium mb-1">
                  Total Tags
                </Text>
                <Text className="text-3xl font-bold text-purple-900">
                  {stats.total}
                </Text>
                <Text className="text-xs text-purple-600 mt-1">System-wide</Text>
              </View>

              <View className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <Text className="text-xs text-blue-700 font-medium mb-1">
                  Core Tags
                </Text>
                <Text className="text-3xl font-bold text-blue-900">
                  {stats.core}
                </Text>
                <Text className="text-xs text-blue-600 mt-1">System-defined</Text>
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
                    placeholder="Search by name or description..."
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
                {/* Tag Filter */}
                <View className="flex-1">
                  <Text className="text-xs font-medium text-gray-700 mb-2">
                    Filter
                  </Text>
                  <View className="border border-gray-300 rounded-lg overflow-hidden">
                    <Picker
                      selectedValue={tagFilter}
                      onValueChange={(value) => setTagFilter(value as TagFilter)}
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="All Tags" value="all" />
                      <Picker.Item label="Core Tags" value="core" />
                      <Picker.Item label="Custom Tags" value="custom" />
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
                      }}
                      style={{ height: 50 }}
                    >
                      <Picker.Item label="Name (A-Z)" value="name-asc" />
                      <Picker.Item label="Name (Z-A)" value="name-desc" />
                      <Picker.Item label="Newest" value="tagId-desc" />
                      <Picker.Item label="Oldest" value="tagId-asc" />
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            {/* Loading State */}
            {loading && (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="mt-4 text-gray-600">Loading tags...</Text>
              </View>
            )}

            {/* No Results */}
            {!loading && filteredTags.length === 0 && (
              <View className="bg-white rounded-xl p-8 items-center">
                <Ionicons name="pricetags-outline" size={48} color="#9CA3AF" />
                <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                  No tags found
                </Text>
                <Text className="text-gray-600 text-center">
                  {searchQuery || tagFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No tags available'}
                </Text>
              </View>
            )}

            {/* Tags List */}
            {!loading &&
              filteredTags.map((tag) => {
                const badge = getTagBadge(tag.core);
                return (
                  <TouchableOpacity
                    key={tag.tagId}
                    onPress={() => handleEditClick(tag)}
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
                            {tag.name}
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
                              #{tag.tagId}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Delete Button */}
                      {!tag.core && (
                        <TouchableOpacity
                          onPress={() => handleDeleteTag(tag)}
                          className="bg-red-50 p-2 rounded-lg"
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Description */}
                    <View className="flex-row items-start">
                      <Ionicons
                        name="information-circle"
                        size={16}
                        color="#6B7280"
                        style={{ marginTop: 2 }}
                      />
                      <Text
                        className="text-sm text-gray-600 ml-2 flex-1 italic"
                        numberOfLines={2}
                      >
                        {tag.description || 'No description provided.'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

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
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View className="bg-white rounded-t-3xl p-6 shadow-2xl" style={{ maxHeight: '80%' }}>
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">
                  {editingTag ? 'Edit Tag' : 'Create Tag'}
                </Text>
                <TouchableOpacity
                  onPress={handleModalClose}
                  className="bg-gray-100 p-2 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="space-y-4">
                  {/* Name Input */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Tag Name <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={formData.name}
                      onChangeText={(value) =>
                        setFormData((prev) => ({ ...prev, name: value }))
                      }
                      placeholder="e.g., Workshop, Seminar, Music"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Description Input - Only for Edit */}
                  {editingTag && (
                    <>
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                          Description
                        </Text>
                        <AppTextInput
                          className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                          value={formData.description}
                          onChangeText={(value) =>
                            setFormData((prev) => ({ ...prev, description: value }))
                          }
                          placeholder="e.g., For official academic workshops"
                          multiline
                          numberOfLines={3}
                          textAlignVertical="top"
                          editable={!isSaving}
                        />
                      </View>

                      {/* Core Tag Toggle */}
                      <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-300">
                        <View className="flex-1 mr-3">
                          <Text className="text-sm font-medium text-gray-700">
                            Set as Core Tag
                          </Text>
                          <Text className="text-xs text-gray-500 mt-1">
                            Core tags are system-defined and cannot be deleted
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            setFormData((prev) => ({ ...prev, core: !prev.core }))
                          }
                          className={`w-12 h-7 rounded-full p-1 ${
                            formData.core ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                          disabled={isSaving}
                        >
                          <View
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              formData.core ? 'translate-x-5' : ''
                            }`}
                          />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

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
                        isSaving ? 'bg-purple-300' : 'bg-purple-600'
                      }`}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-center">
                          {editingTag ? 'Save Changes' : 'Create Tag'}
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
