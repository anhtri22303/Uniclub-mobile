import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import MultiplierPolicyService, {
    ConditionType,
    MultiplierPolicy,
    PolicyTargetType,
} from '@services/multiplierPolicy.service';
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

type TabType = PolicyTargetType;

interface PolicyFormData extends Omit<MultiplierPolicy, 'id' | 'updatedBy'> {
  minThresholdString: string;
  maxThresholdString: string;
  multiplierString: string;
}

export default function UniStaffMultiplierPolicyPage() {
  // Data states
  const [allPolicies, setAllPolicies] = useState<MultiplierPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('CLUB');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<MultiplierPolicy | null>(null);

  // Form data
  const initialFormData: PolicyFormData = {
    targetType: 'CLUB',
    activityType: '',
    ruleName: '',
    conditionType: 'PERCENTAGE',
    minThreshold: 0,
    maxThreshold: 0,
    policyDescription: '',
    multiplier: 1,
    active: true,
    minThresholdString: '0',
    maxThresholdString: '0',
    multiplierString: '1',
  };

  const [createFormData, setCreateFormData] = useState<PolicyFormData>(initialFormData);
  const [editFormData, setEditFormData] = useState<Partial<PolicyFormData>>({});

  // Load policies on mount
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const policies = await MultiplierPolicyService.getMultiplierPolicies();
      setAllPolicies(policies);
    } catch (error) {
      console.error('Error loading policies:', error);
      Alert.alert('Error', 'Failed to load multiplier policies. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPolicies(true);
  };

  // Filter policies by tab
  const filteredPolicies = useMemo(() => {
    return allPolicies.filter((p) => p.targetType === activeTab);
  }, [allPolicies, activeTab]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredPolicies.length;
    const avgMultiplier =
      total > 0
        ? filteredPolicies.reduce((sum, p) => sum + p.multiplier, 0) / total
        : 0;
    const maxMultiplier = Math.max(...filteredPolicies.map((p) => p.multiplier), 0);

    return { total, avgMultiplier, maxMultiplier };
  }, [filteredPolicies]);

  // Get multiplier badge color
  const getMultiplierBadgeColor = (multiplier: number) => {
    if (multiplier === 0) return 'bg-red-100 border-red-300';
    if (multiplier < 1) return 'bg-orange-100 border-orange-300';
    if (multiplier === 1) return 'bg-blue-100 border-blue-300';
    if (multiplier > 2) return 'bg-purple-100 border-purple-300';
    return 'bg-green-100 border-green-300';
  };

  const getMultiplierTextColor = (multiplier: number) => {
    if (multiplier === 0) return 'text-red-700';
    if (multiplier < 1) return 'text-orange-700';
    if (multiplier === 1) return 'text-blue-700';
    if (multiplier > 2) return 'text-purple-700';
    return 'text-green-700';
  };

  // Get target type config
  const getTargetConfig = (targetType: PolicyTargetType) => {
    if (targetType === 'CLUB') {
      return {
        label: 'Club Policy',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
      };
    }
    return {
      label: 'Member Policy',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
    };
  };

  // Parse number from string (with commas)
  const parseNumber = (value: string): number => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    return parseFloat(cleanedValue) || 0;
  };

  const parseIntValue = (value: string): number => {
    const cleanedValue = value.replace(/[^0-9]/g, '');
    return parseInt(cleanedValue) || 0;
  };

  // Format number with commas
  const formatNumberWithCommas = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '') return '';
    const stringValue = String(value).replace(/,/g, '');
    const parts = stringValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Handlers
  const handleOpenCreateModal = () => {
    setCreateFormData({ ...initialFormData, targetType: activeTab });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (policy: MultiplierPolicy) => {
    setSelectedPolicy(policy);
    setEditFormData({
      ...policy,
      minThresholdString: String(policy.minThreshold),
      maxThresholdString: String(policy.maxThreshold),
      multiplierString: String(policy.multiplier),
    });
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedPolicy(null);
    setCreateFormData(initialFormData);
    setEditFormData({});
  };

  const handleCreatePolicy = async () => {
    // Validation
    if (!createFormData.ruleName.trim()) {
      Alert.alert('Validation Error', 'Rule Name is required');
      return;
    }
    if (!createFormData.activityType.trim()) {
      Alert.alert('Validation Error', 'Activity Type is required');
      return;
    }

    const minThreshold = parseIntValue(createFormData.minThresholdString);
    const maxThreshold = parseIntValue(createFormData.maxThresholdString);
    const multiplier = parseNumber(createFormData.multiplierString);

    if (minThreshold < 0 || maxThreshold < 0) {
      Alert.alert('Validation Error', 'Thresholds must be 0 or greater');
      return;
    }
    if (multiplier < 0) {
      Alert.alert('Validation Error', 'Multiplier must be 0 or greater');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Omit<MultiplierPolicy, 'id'> = {
        targetType: createFormData.targetType,
        activityType: createFormData.activityType,
        ruleName: createFormData.ruleName,
        conditionType: createFormData.conditionType,
        minThreshold,
        maxThreshold,
        policyDescription: createFormData.policyDescription || null,
        multiplier,
        active: createFormData.active,
        updatedBy: 'mobile-user', // You can get from auth context
      };

      await MultiplierPolicyService.createMultiplierPolicy(payload);
      Alert.alert('Success', 'Multiplier policy created successfully');
      handleCloseModals();
      loadPolicies();
    } catch (error: any) {
      console.error('Error creating policy:', error);
      Alert.alert('Error', 'Failed to create policy. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePolicy = async () => {
    if (!selectedPolicy) return;

    // Validation
    if (!editFormData.ruleName?.trim()) {
      Alert.alert('Validation Error', 'Rule Name is required');
      return;
    }
    if (!editFormData.activityType?.trim()) {
      Alert.alert('Validation Error', 'Activity Type is required');
      return;
    }

    const minThreshold = parseIntValue(editFormData.minThresholdString || '0');
    const maxThreshold = parseIntValue(editFormData.maxThresholdString || '0');
    const multiplier = parseNumber(editFormData.multiplierString || '1');

    if (minThreshold < 0 || maxThreshold < 0) {
      Alert.alert('Validation Error', 'Thresholds must be 0 or greater');
      return;
    }
    if (multiplier < 0) {
      Alert.alert('Validation Error', 'Multiplier must be 0 or greater');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<MultiplierPolicy> = {
        targetType: editFormData.targetType,
        activityType: editFormData.activityType,
        ruleName: editFormData.ruleName,
        conditionType: editFormData.conditionType,
        minThreshold,
        maxThreshold,
        policyDescription: editFormData.policyDescription,
        multiplier,
        active: editFormData.active,
        updatedBy: 'mobile-user',
      };

      await MultiplierPolicyService.updateMultiplierPolicy(selectedPolicy.id, payload);
      Alert.alert('Success', 'Multiplier policy updated successfully');
      handleCloseModals();
      loadPolicies();
    } catch (error: any) {
      console.error('Error updating policy:', error);
      Alert.alert('Error', 'Failed to update policy. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePolicy = (policy: MultiplierPolicy) => {
    Alert.alert(
      'Delete Policy',
      `Are you sure you want to delete "${policy.ruleName}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MultiplierPolicyService.deleteMultiplierPolicy(policy.id);
              Alert.alert('Success', 'Policy deleted successfully');
              loadPolicies();
            } catch (error) {
              console.error('Error deleting policy:', error);
              Alert.alert('Error', 'Failed to delete policy. Please try again.');
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
                  <Ionicons name="trending-up" size={28} color="#A855F7" />
                  <Text className="text-2xl font-bold text-gray-900 ml-5">
                    Multiplier Policy
                  </Text>
                </View>
                {/* <Text className="text-sm text-gray-600">
                  Configure point multipliers
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

            {/* Statistics Cards */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-200">
                <Text className="text-xs text-blue-700 font-medium mb-1">
                  Total Policies
                </Text>
                <Text className="text-3xl font-bold text-blue-900">{stats.total}</Text>
                <Text className="text-xs text-blue-600 mt-1">Active policies</Text>
              </View>

              <View className="flex-1 bg-green-50 rounded-xl p-4 border border-green-200">
                <Text className="text-xs text-green-700 font-medium mb-1">
                  Avg Multiplier
                </Text>
                <Text className="text-3xl font-bold text-green-900">
                  {stats.avgMultiplier.toFixed(2)}x
                </Text>
                <Text className="text-xs text-green-600 mt-1">Mean value</Text>
              </View>

              <View className="flex-1 bg-purple-50 rounded-xl p-4 border border-purple-200">
                <Text className="text-xs text-purple-700 font-medium mb-1">
                  Max Multiplier
                </Text>
                <Text className="text-3xl font-bold text-purple-900">
                  {stats.maxMultiplier.toFixed(1)}x
                </Text>
                <Text className="text-xs text-purple-600 mt-1">Highest bonus</Text>
              </View>
            </View>

            {/* Tabs */}
            <View className="flex-row bg-white rounded-xl p-1 shadow-sm">
              <TouchableOpacity
                onPress={() => setActiveTab('CLUB')}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                  activeTab === 'CLUB' ? 'bg-blue-100' : ''
                }`}
              >
                <Ionicons
                  name="shield"
                  size={16}
                  color={activeTab === 'CLUB' ? '#1D4ED8' : '#6B7280'}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    activeTab === 'CLUB' ? 'text-blue-700' : 'text-gray-600'
                  }`}
                >
                  Club ({allPolicies.filter((p) => p.targetType === 'CLUB').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('MEMBER')}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                  activeTab === 'MEMBER' ? 'bg-purple-100' : ''
                }`}
              >
                <Ionicons
                  name="people"
                  size={16}
                  color={activeTab === 'MEMBER' ? '#7C3AED' : '#6B7280'}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    activeTab === 'MEMBER' ? 'text-purple-700' : 'text-gray-600'
                  }`}
                >
                  Member ({allPolicies.filter((p) => p.targetType === 'MEMBER').length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Loading State */}
            {loading && (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="mt-4 text-gray-600">Loading policies...</Text>
              </View>
            )}

            {/* No Results */}
            {!loading && filteredPolicies.length === 0 && (
              <View className="bg-white rounded-xl p-8 items-center">
                <Ionicons name="trending-up-outline" size={48} color="#9CA3AF" />
                <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                  No policies found
                </Text>
                <Text className="text-gray-600 text-center">
                  No multiplier policies configured for {activeTab.toLowerCase()}
                </Text>
              </View>
            )}

            {/* Policies List */}
            {!loading &&
              filteredPolicies
                .sort((a, b) => b.multiplier - a.multiplier)
                .map((policy) => {
                  const config = getTargetConfig(policy.targetType);
                  return (
                    <TouchableOpacity
                      key={policy.id}
                      onPress={() => handleOpenEditModal(policy)}
                      className={`bg-white rounded-xl p-4 shadow-sm border-2 ${config.borderColor}`}
                    >
                      {/* Header */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1 mr-2">
                          <Text
                            className="text-lg font-bold text-gray-900 mb-1"
                            numberOfLines={2}
                          >
                            {policy.ruleName}
                          </Text>
                          <View className="flex-row items-center gap-2 mb-2">
                            <View
                              className={`px-2 py-1 rounded-full ${config.bgColor}`}
                            >
                              <Text className={`text-xs font-semibold ${config.textColor}`}>
                                {config.label}
                              </Text>
                            </View>
                            <View className="bg-gray-100 px-2 py-1 rounded-full">
                              <Text className="text-xs font-medium text-gray-600">
                                #{policy.id}
                              </Text>
                            </View>
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="pulse" size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1">
                              {policy.activityType}
                            </Text>
                          </View>
                        </View>

                        {/* Multiplier Badge */}
                        <View className="items-end gap-2">
                          <View
                            className={`px-4 py-2 rounded-lg border-2 ${getMultiplierBadgeColor(
                              policy.multiplier
                            )}`}
                          >
                            <Text
                              className={`text-xl font-bold ${getMultiplierTextColor(
                                policy.multiplier
                              )}`}
                            >
                              {policy.multiplier}x
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleDeletePolicy(policy)}
                            className="bg-red-50 p-2 rounded-lg"
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Thresholds */}
                      <View className="flex-row gap-2 mb-3">
                        <View className={`flex-1 p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                          <Text className="text-xs text-gray-600 mb-1">Min Threshold</Text>
                          <Text className={`text-xl font-bold ${config.textColor}`}>
                            {formatNumberWithCommas(policy.minThreshold)}
                          </Text>
                        </View>
                        <View className={`flex-1 p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                          <Text className="text-xs text-gray-600 mb-1">Max Threshold</Text>
                          <Text className={`text-xl font-bold ${config.textColor}`}>
                            {formatNumberWithCommas(policy.maxThreshold)}
                          </Text>
                        </View>
                      </View>

                      {/* Metadata */}
                      <View className="border-t border-gray-200 pt-3 space-y-2">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-gray-600">Condition Type</Text>
                          <View className="bg-gray-100 px-2 py-1 rounded">
                            <Text className="text-xs font-semibold text-gray-700">
                              {policy.conditionType}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-gray-600">Status</Text>
                          <View
                            className={`px-2 py-1 rounded ${
                              policy.active ? 'bg-green-100' : 'bg-gray-100'
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                policy.active ? 'text-green-700' : 'text-gray-700'
                              }`}
                            >
                              {policy.active ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-gray-600">Updated By</Text>
                          <Text className="text-xs font-mono text-gray-700">
                            {policy.updatedBy}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

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
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View className="bg-white rounded-t-3xl p-6 shadow-2xl" style={{ maxHeight: '90%' }}>
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">Create Policy</Text>
                <TouchableOpacity
                  onPress={handleCloseModals}
                  className="bg-gray-100 p-2 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <View className="space-y-4">
                  {/* Target Type */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Target Type <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="border border-gray-300 rounded-xl overflow-hidden">
                      <Picker
                        selectedValue={createFormData.targetType}
                        onValueChange={(value) =>
                          setCreateFormData({ ...createFormData, targetType: value as PolicyTargetType })
                        }
                        style={{ height: 50 }}
                      >
                        <Picker.Item label="Club" value="CLUB" />
                        <Picker.Item label="Member" value="MEMBER" />
                      </Picker>
                    </View>
                  </View>

                  {/* Rule Name */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Rule Name <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={createFormData.ruleName}
                      onChangeText={(value) =>
                        setCreateFormData({ ...createFormData, ruleName: value })
                      }
                      placeholder="e.g., High Activity Bonus"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Activity Type */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Activity Type <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={createFormData.activityType}
                      onChangeText={(value) =>
                        setCreateFormData({ ...createFormData, activityType: value })
                      }
                      placeholder="e.g., EVENT_PARTICIPATION"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Condition Type */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Condition Type <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="border border-gray-300 rounded-xl overflow-hidden">
                      <Picker
                        selectedValue={createFormData.conditionType}
                        onValueChange={(value) =>
                          setCreateFormData({
                            ...createFormData,
                            conditionType: value as ConditionType,
                          })
                        }
                        style={{ height: 50 }}
                      >
                        <Picker.Item label="PERCENTAGE" value="PERCENTAGE" />
                        <Picker.Item label="ABSOLUTE" value="ABSOLUTE" />
                      </Picker>
                    </View>
                  </View>

                  {/* Min/Max Threshold */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Min Threshold <Text className="text-red-500">*</Text>
                      </Text>
                      <AppTextInput
                        className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                        value={createFormData.minThresholdString}
                        onChangeText={(value) =>
                          setCreateFormData({
                            ...createFormData,
                            minThresholdString: value.replace(/[^0-9]/g, ''),
                          })
                        }
                        placeholder="0"
                        keyboardType="numeric"
                        editable={!isSaving}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Max Threshold <Text className="text-red-500">*</Text>
                      </Text>
                      <AppTextInput
                        className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                        value={createFormData.maxThresholdString}
                        onChangeText={(value) =>
                          setCreateFormData({
                            ...createFormData,
                            maxThresholdString: value.replace(/[^0-9]/g, ''),
                          })
                        }
                        placeholder="0"
                        keyboardType="numeric"
                        editable={!isSaving}
                      />
                    </View>
                  </View>

                  {/* Multiplier */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Multiplier <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={createFormData.multiplierString}
                      onChangeText={(value) =>
                        setCreateFormData({
                          ...createFormData,
                          multiplierString: value.replace(/[^0-9.]/g, ''),
                        })
                      }
                      placeholder="1.0"
                      keyboardType="decimal-pad"
                      editable={!isSaving}
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      e.g., 1.5 = +50%, 0.8 = -20%, 1.0 = no change
                    </Text>
                  </View>

                  {/* Policy Description */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={createFormData.policyDescription || ''}
                      onChangeText={(value) =>
                        setCreateFormData({ ...createFormData, policyDescription: value })
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
                      value={createFormData.active}
                      onValueChange={(value) =>
                        setCreateFormData({ ...createFormData, active: value })
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
                      onPress={handleCreatePolicy}
                      disabled={isSaving}
                      className={`flex-1 py-3 rounded-xl ${
                        isSaving ? 'bg-purple-300' : 'bg-purple-600'
                      }`}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-center">
                          Create Policy
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
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View className="bg-white rounded-t-3xl p-6 shadow-2xl" style={{ maxHeight: '90%' }}>
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">Edit Policy</Text>
                <TouchableOpacity
                  onPress={handleCloseModals}
                  className="bg-gray-100 p-2 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <View className="space-y-4">
                  {/* Policy ID */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Policy ID</Text>
                    <AppTextInput
                      className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-600"
                      value={String(selectedPolicy?.id || '')}
                      editable={false}
                    />
                  </View>

                  {/* Target Type */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Target Type <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="border border-gray-300 rounded-xl overflow-hidden">
                      <Picker
                        selectedValue={editFormData.targetType}
                        onValueChange={(value) =>
                          setEditFormData({ ...editFormData, targetType: value as PolicyTargetType })
                        }
                        style={{ height: 50 }}
                      >
                        <Picker.Item label="Club" value="CLUB" />
                        <Picker.Item label="Member" value="MEMBER" />
                      </Picker>
                    </View>
                  </View>

                  {/* Rule Name */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Rule Name <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={editFormData.ruleName}
                      onChangeText={(value) =>
                        setEditFormData({ ...editFormData, ruleName: value })
                      }
                      placeholder="e.g., High Activity Bonus"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Activity Type */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Activity Type <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={editFormData.activityType}
                      onChangeText={(value) =>
                        setEditFormData({ ...editFormData, activityType: value })
                      }
                      placeholder="e.g., EVENT_PARTICIPATION"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Condition Type */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Condition Type <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="border border-gray-300 rounded-xl overflow-hidden">
                      <Picker
                        selectedValue={editFormData.conditionType}
                        onValueChange={(value) =>
                          setEditFormData({
                            ...editFormData,
                            conditionType: value as ConditionType,
                          })
                        }
                        style={{ height: 50 }}
                      >
                        <Picker.Item label="PERCENTAGE" value="PERCENTAGE" />
                        <Picker.Item label="ABSOLUTE" value="ABSOLUTE" />
                      </Picker>
                    </View>
                  </View>

                  {/* Min/Max Threshold */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Min Threshold <Text className="text-red-500">*</Text>
                      </Text>
                      <AppTextInput
                        className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                        value={editFormData.minThresholdString || ''}
                        onChangeText={(value) =>
                          setEditFormData({
                            ...editFormData,
                            minThresholdString: value.replace(/[^0-9]/g, ''),
                          })
                        }
                        placeholder="0"
                        keyboardType="numeric"
                        editable={!isSaving}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-2">
                        Max Threshold <Text className="text-red-500">*</Text>
                      </Text>
                      <AppTextInput
                        className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                        value={editFormData.maxThresholdString || ''}
                        onChangeText={(value) =>
                          setEditFormData({
                            ...editFormData,
                            maxThresholdString: value.replace(/[^0-9]/g, ''),
                          })
                        }
                        placeholder="0"
                        keyboardType="numeric"
                        editable={!isSaving}
                      />
                    </View>
                  </View>

                  {/* Multiplier */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Multiplier <Text className="text-red-500">*</Text>
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={editFormData.multiplierString || ''}
                      onChangeText={(value) =>
                        setEditFormData({
                          ...editFormData,
                          multiplierString: value.replace(/[^0-9.]/g, ''),
                        })
                      }
                      placeholder="1.0"
                      keyboardType="decimal-pad"
                      editable={!isSaving}
                    />
                  </View>

                  {/* Policy Description */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                      value={editFormData.policyDescription || ''}
                      onChangeText={(value) =>
                        setEditFormData({ ...editFormData, policyDescription: value })
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
                      onPress={handleUpdatePolicy}
                      disabled={isSaving}
                      className={`flex-1 py-3 rounded-xl ${
                        isSaving ? 'bg-purple-300' : 'bg-purple-600'
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
