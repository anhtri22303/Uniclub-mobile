import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
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
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [createPolicyName, setCreatePolicyName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createMajorId, setCreateMajorId] = useState('');
  const [createMaxClubJoin, setCreateMaxClubJoin] = useState('');
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
        (p.policyName || '').toLowerCase().includes(query) ||
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
    setEditPolicyName(policy.policyName || '');
    setEditDescription(policy.description || '');
    setEditMajorId(policy.majorId?.toString() || '');
    setEditMaxClubJoin(policy.maxClubJoin?.toString() || '');
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
      };

      await PolicyService.updatePolicyById(selectedPolicy.id, payload);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Policy updated successfully',
        visibilityTime: 3000,
        autoHide: true,
      });
      setDetailModalVisible(false);
      loadPolicies();
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
      };

      await PolicyService.createPolicy(payload);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Policy created successfully',
        visibilityTime: 3000,
        autoHide: true,
      });
      setCreateModalVisible(false);
      resetCreateForm();
      loadPolicies();
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
      `Are you sure you want to delete "${policy.policyName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PolicyService.deletePolicyById(policy.id);

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Policy deleted successfully',
                visibilityTime: 3000,
                autoHide: true,
              });
              if (selectedPolicy?.id === policy.id) {
                setDetailModalVisible(false);
              }
              loadPolicies();
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
      <View className="bg-white rounded-3xl mx-6 mt-6 p-6 shadow-lg">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="bg-teal-100 p-3 rounded-2xl" style={{ backgroundColor: '#D1FAE5' }}>
              <Ionicons name="document-text" size={28} color="#14B8A6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-2xl font-bold text-gray-800">Policies</Text>
              <Text className="text-gray-600 text-sm mt-1">Manage university policies</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View className="flex-row gap-3 mt-4 mb-4">
          <View className="flex-1 bg-white rounded-3xl p-5 shadow-lg border-2" style={{ borderColor: '#14B8A6' }}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="p-2 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}>
                <Ionicons name="document-text" size={24} color="#14B8A6" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-gray-800">{policies.length}</Text>
            <Text className="text-xs text-gray-600 mt-1">Total Policies</Text>
          </View>

          <View className="flex-1 bg-white rounded-3xl p-5 shadow-lg border-2 border-green-500">
            <View className="flex-row items-center justify-between mb-3">
              <View className="bg-green-100 p-2 rounded-xl">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-gray-800">{policies.filter(p => p.active).length}</Text>
            <Text className="text-xs text-gray-600 mt-1">Active</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-3xl p-4 shadow-lg mb-4">
          <View className="flex-row items-center">
            <View className="p-2 rounded-xl" style={{ backgroundColor: '#14B8A6' }}>
              <Ionicons name="search" size={20} color="white" />
            </View>
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
        </View>

        {/* Create Button */}
        <TouchableOpacity
          onPress={() => setCreateModalVisible(true)}
          className="rounded-3xl py-4 items-center flex-row justify-center shadow-lg mb-4"
          style={{ backgroundColor: '#14B8A6' }}
        >
          <Ionicons name="add-circle" size={22} color="white" />
          <Text className="text-white font-bold text-base ml-2">Create New Policy</Text>
        </TouchableOpacity>

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
                  className="bg-gray-50 rounded-3xl p-5 mb-4 border-2 border-gray-100"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <View
                          className="px-3 py-1 rounded-full mr-2"
                          style={{ backgroundColor: policy.active ? '#D1FAE5' : '#FEE2E2' }}
                        >
                          <Text
                            className="text-xs font-bold"
                            style={{ color: policy.active ? '#14B8A6' : '#EF4444' }}
                          >
                            {policy.active ? '● Active' : '● Inactive'}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-500">ID: {policy.id}</Text>
                      </View>
                      <Text className="text-lg font-bold text-gray-800">
                        {policy.policyName}
                      </Text>
                    </View>
                  </View>

                  {policy.majorName && (
                    <View className="flex-row items-center mb-3 bg-white rounded-xl px-3 py-2">
                      <Ionicons name="school" size={16} color="#14B8A6" />
                      <Text className="text-sm text-gray-700 ml-2 font-medium">{policy.majorName}</Text>
                    </View>
                  )}

                  {policy.description && (
                    <Text className="text-sm text-gray-600 mb-3 leading-5" numberOfLines={2}>
                      {policy.description}
                    </Text>
                  )}

                  {policy.maxClubJoin !== undefined && (
                    <View className="flex-row items-center bg-white rounded-xl px-3 py-2 mb-4">
                      <Ionicons name="people" size={16} color="#14B8A6" />
                      <Text className="text-xs text-gray-700 ml-1 font-medium">
                        Max Club Join: {policy.maxClubJoin}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => openDetail(policy)}
                      className="flex-1 rounded-2xl py-3 items-center"
                      style={{ backgroundColor: '#14B8A6' }}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="create" size={18} color="white" />
                        <Text className="text-white font-bold ml-1">Edit</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(policy)}
                      className="flex-1 bg-red-500 rounded-2xl py-3 items-center"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="trash" size={18} color="white" />
                        <Text className="text-white font-bold ml-1">Delete</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <View className="flex-row items-center justify-center gap-3 mt-2">
                  <TouchableOpacity
                    onPress={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="p-3 rounded-2xl"
                    style={{ backgroundColor: currentPage === 1 ? '#E5E7EB' : '#14B8A6' }}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={currentPage === 1 ? '#9CA3AF' : 'white'}
                    />
                  </TouchableOpacity>

                  <View className="bg-gray-100 px-4 py-2 rounded-2xl">
                    <Text className="text-sm font-bold text-gray-700">
                      {currentPage} / {totalPages}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-2xl"
                    style={{ backgroundColor: currentPage === totalPages ? '#E5E7EB' : '#14B8A6' }}
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

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Max Club Join</Text>
                  <AppTextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                    value={editMaxClubJoin}
                    onChangeText={setEditMaxClubJoin}
                    placeholder="Max clubs a student can join"
                    keyboardType="numeric"
                  />
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
                    className="flex-1 bg-gray-200 rounded-2xl py-3 items-center"
                  >
                    <Text className="text-gray-700 font-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-2xl py-3 items-center"
                    style={{ backgroundColor: saving ? '#9CA3AF' : '#14B8A6' }}
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

            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
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

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Max Club Join</Text>
                  <AppTextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                    value={createMaxClubJoin}
                    onChangeText={setCreateMaxClubJoin}
                    placeholder="Max clubs a student can join"
                    keyboardType="numeric"
                  />
                </View>

                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => {
                      setCreateModalVisible(false);
                      resetCreateForm();
                    }}
                    className="flex-1 bg-gray-200 rounded-2xl py-3 items-center"
                  >
                    <Text className="text-gray-700 font-bold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreate}
                    disabled={creating}
                    className="flex-1 rounded-2xl py-3 items-center"
                    style={{ backgroundColor: creating ? '#9CA3AF' : '#14B8A6' }}
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
