import NavigationBar from '@components/navigation/NavigationBar';
import { AppTextInput } from '@components/ui';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import PolicyService, { Policy } from '@services/policy.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function UniStaffPoliciesPage() {
  const { user } = useAuthStore();

  // State management
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // Edit form state
  const [editPolicyName, setEditPolicyName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMajorId, setEditMajorId] = useState('');
  const [editMaxClubJoin, setEditMaxClubJoin] = useState('');
  const [editRewardMultiplier, setEditRewardMultiplier] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [createPolicyName, setCreatePolicyName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createMajorId, setCreateMajorId] = useState('');
  const [createMaxClubJoin, setCreateMaxClubJoin] = useState('');
  const [createRewardMultiplier, setCreateRewardMultiplier] = useState('');
  const [creating, setCreating] = useState(false);

  // Load policies
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await PolicyService.fetchPolicies();
      console.log('=== POLICIES PAGE: Loaded policies ===');
      console.log('Total policies:', data.length);
      setPolicies(data);
    } catch (error: any) {
      console.error('Error loading policies:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load policies',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter policies
  const filteredPolicies = useMemo(() => {
    if (!searchQuery) return policies;
    const query = searchQuery.toLowerCase();
    return policies.filter(
      (p) =>
        (p.policyName || p.name || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.majorName || '').toLowerCase().includes(query)
    );
  }, [policies, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const paginatedPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPolicies.slice(startIndex, endIndex);
  }, [filteredPolicies, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Open detail modal
  const openDetail = (policy: Policy) => {
    setSelectedPolicy(policy);
    setEditPolicyName(policy.policyName || policy.name || '');
    setEditDescription(policy.description || '');
    setEditMajorId(policy.majorId?.toString() || '');
    setEditMaxClubJoin(policy.maxClubJoin?.toString() || '');
    setEditRewardMultiplier(policy.rewardMultiplier?.toString() || '');
    setEditActive(policy.active);
    setDetailModalVisible(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedPolicy) return;

    setSaving(true);
    try {
      const payload: Partial<Policy> = {
        policyName: editPolicyName,
        description: editDescription,
        majorId: editMajorId ? parseInt(editMajorId) : selectedPolicy.majorId,
        maxClubJoin: editMaxClubJoin ? parseInt(editMaxClubJoin) : undefined,
        rewardMultiplier: editRewardMultiplier ? parseFloat(editRewardMultiplier) : undefined,
      };

      const result = await PolicyService.updatePolicyById(selectedPolicy.id, payload);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: result.message || 'Policy updated successfully',
          visibilityTime: 3000,
          autoHide: true,
        });
        setDetailModalVisible(false);
        loadPolicies();
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update policy',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle create
  const handleCreate = async () => {
    if (!createPolicyName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Policy name is required',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }

    setCreating(true);
    try {
      const payload: Partial<Policy> = {
        policyName: createPolicyName,
        description: createDescription,
        majorId: createMajorId ? parseInt(createMajorId) : undefined,
        maxClubJoin: createMaxClubJoin ? parseInt(createMaxClubJoin) : undefined,
        rewardMultiplier: createRewardMultiplier ? parseFloat(createRewardMultiplier) : undefined,
      };

      const result = await PolicyService.createPolicy(payload);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: result.message || 'Policy created successfully',
          visibilityTime: 3000,
          autoHide: true,
        });
        setCreateModalVisible(false);
        resetCreateForm();
        loadPolicies();
      } else {
        throw new Error(result.message || 'Create failed');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create policy',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle delete
  const handleDelete = async (policy: Policy) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${policy.policyName || policy.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await PolicyService.deletePolicyById(policy.id);

              if (result.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: result.message || 'Policy deleted successfully',
                  visibilityTime: 3000,
                  autoHide: true,
                });
                if (selectedPolicy?.id === policy.id) {
                  setDetailModalVisible(false);
                }
                loadPolicies();
              } else {
                throw new Error(result.message || 'Delete failed');
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to delete policy',
                visibilityTime: 3000,
                autoHide: true,
              });
            }
          },
        },
      ]
    );
  };

  const resetCreateForm = () => {
    setCreatePolicyName('');
    setCreateDescription('');
    setCreateMajorId('');
    setCreateMaxClubJoin('');
    setCreateRewardMultiplier('');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-lg font-medium mt-4 text-gray-700">Loading policies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />

      {/* Sidebar */}
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center mb-2">
          <Ionicons name="document-text" size={28} color="#3B82F6" />
          <Text className="text-2xl font-bold text-gray-800 ml-2">Policies</Text>
        </View>
        <Text className="text-gray-600">Manage university policies</Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 shadow-lg mt-6 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-blue-700 font-medium">Total Policies</Text>
              <Text className="text-3xl font-bold text-blue-900 mt-1">{policies.length}</Text>
              <Text className="text-xs text-blue-600 mt-1">Active: {policies.filter(p => p.active).length}</Text>
            </View>
            <View className="bg-blue-500 p-4 rounded-2xl">
              <Ionicons name="file-tray-full" size={32} color="white" />
            </View>
          </View>
        </View>

        {/* Search and Create */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-4">
          <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 mb-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <AppTextInput
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Search policies..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setCreateModalVisible(true)}
            className="bg-blue-600 rounded-xl py-3 items-center flex-row justify-center"
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Create New Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Policies List */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Policy List ({filteredPolicies.length})
          </Text>

          {filteredPolicies.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No policies found</Text>
            </View>
          ) : (
            <>
              {paginatedPolicies.map((policy, index) => (
                <View
                  key={policy.id}
                  className={`p-4 rounded-2xl mb-3 ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white border border-gray-100'
                  }`}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-800 mb-1">
                        {policy.policyName || policy.name}
                      </Text>
                      <View
                        className={`self-start px-3 py-1 rounded-full ${
                          policy.active ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            policy.active ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {policy.active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-gray-500">ID: {policy.id}</Text>
                  </View>

                  {policy.majorName && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="school" size={14} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-1">{policy.majorName}</Text>
                    </View>
                  )}

                  {policy.description && (
                    <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                      {policy.description}
                    </Text>
                  )}

                  <View className="flex-row items-center gap-4 mb-3">
                    {policy.maxClubJoin !== undefined && (
                      <View className="flex-row items-center">
                        <Ionicons name="people" size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-600 ml-1">
                          Max Join: {policy.maxClubJoin}
                        </Text>
                      </View>
                    )}
                    {policy.rewardMultiplier !== undefined && (
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-600 ml-1">
                          Reward: {policy.rewardMultiplier}x
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => openDetail(policy)}
                      className="flex-1 bg-blue-600 rounded-xl py-2 items-center"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="eye" size={16} color="white" />
                        <Text className="text-white font-medium ml-1">View</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(policy)}
                      className="flex-1 bg-red-600 rounded-xl py-2 items-center"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="trash" size={16} color="white" />
                        <Text className="text-white font-medium ml-1">Delete</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

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

      {/* Detail/Edit Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '90%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-800">Edit Policy</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Policy Name</Text>
                  <AppTextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                    value={editPolicyName}
                    onChangeText={setEditPolicyName}
                    placeholder="Enter policy name"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                  <AppTextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Enter description"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Major ID</Text>
                  <AppTextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                    value={editMajorId}
                    onChangeText={setEditMajorId}
                    placeholder="Enter major ID"
                    keyboardType="numeric"
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Max Club Join</Text>
                    <AppTextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                      value={editMaxClubJoin}
                      onChangeText={setEditMaxClubJoin}
                      placeholder="Max"
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Reward Multiplier
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                      value={editRewardMultiplier}
                      onChangeText={setEditRewardMultiplier}
                      placeholder="1.0"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View className="flex-row items-center py-2">
                  <TouchableOpacity
                    onPress={() => setEditActive(!editActive)}
                    className="flex-row items-center"
                  >
                    <View
                      className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                        editActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                      }`}
                    >
                      {editActive && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text className="text-gray-700 font-medium">Active</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => setDetailModalVisible(false)}
                    className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
                  >
                    <Text className="text-gray-700 font-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`flex-1 rounded-xl py-3 items-center ${
                      saving ? 'bg-gray-400' : 'bg-blue-600'
                    }`}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold">Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '90%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-800">Create Policy</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Policy Name <Text className="text-red-500">*</Text>
                  </Text>
                  <AppTextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                    value={createPolicyName}
                    onChangeText={setCreatePolicyName}
                    placeholder="Enter policy name"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                  <AppTextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                    value={createDescription}
                    onChangeText={setCreateDescription}
                    placeholder="Enter description"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Major ID</Text>
                  <AppTextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                    value={createMajorId}
                    onChangeText={setCreateMajorId}
                    placeholder="Enter major ID"
                    keyboardType="numeric"
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Max Club Join</Text>
                    <AppTextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                      value={createMaxClubJoin}
                      onChangeText={setCreateMaxClubJoin}
                      placeholder="Max"
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Reward Multiplier
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                      value={createRewardMultiplier}
                      onChangeText={setCreateRewardMultiplier}
                      placeholder="1.0"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => {
                      setCreateModalVisible(false);
                      resetCreateForm();
                    }}
                    className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
                  >
                    <Text className="text-gray-700 font-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreate}
                    disabled={creating}
                    className={`flex-1 rounded-xl py-3 items-center ${
                      creating ? 'bg-gray-400' : 'bg-blue-600'
                    }`}
                  >
                    {creating ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold">Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
