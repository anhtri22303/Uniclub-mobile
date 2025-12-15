import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import PointRequestService, {
    PointRequest,
    ReviewPointRequestPayload,
} from '@services/point-request.service';
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

type TabType = 'PENDING' | 'APPROVED' | 'REJECTED';

export default function UniStaffPointsRequestPage() {
  // Data states
  const [allRequests, setAllRequests] = useState<PointRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('PENDING');

  // Modal states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PointRequest | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  // Load requests on mount
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const response = await PointRequestService.fetchAllPointRequests();
      setAllRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load point requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests(true);
  };

  // Filter requests by tab and search
  const filteredRequests = useMemo(() => {
    return allRequests
      .filter((req) => {
        // Filter by tab
        const matchTab = req.status === activeTab;

        // Filter by search
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          req.clubName.toLowerCase().includes(q) ||
          (req.reason && req.reason.toLowerCase().includes(q));

        return matchTab && matchSearch;
      })
      .sort((a, b) => b.id - a.id); // Newest first
  }, [allRequests, activeTab, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      pending: allRequests.filter((r) => r.status === 'PENDING').length,
      approved: allRequests.filter((r) => r.status === 'APPROVED').length,
      rejected: allRequests.filter((r) => r.status === 'REJECTED').length,
    };
  }, [allRequests]);

  // Get status badge color
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-500',
        };
      case 'APPROVED':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-500',
        };
      case 'REJECTED':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-500',
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-500',
        };
    }
  };

  // Handlers
  const handleOpenReviewModal = (request: PointRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setIsApproving(action === 'approve');
    setReviewNote(request.staffNote || '');
    setIsReviewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
    setReviewNote('');
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    // Validation for rejection
    if (!isApproving && !reviewNote.trim()) {
      Alert.alert('Validation Error', 'Note is required for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      const payload: ReviewPointRequestPayload = {
        approve: isApproving,
        note: reviewNote.trim() || (isApproving ? 'Approved' : 'Rejected'),
      };

      await PointRequestService.reviewPointRequest(selectedRequest.id, payload);
      Alert.alert('Success', 'Request reviewed successfully');
      handleCloseModal();
      loadRequests();
    } catch (error: any) {
      console.error('Error reviewing request:', error);
      Alert.alert('Error', 'Failed to review request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
            <View className="mb-2">
              <View className="flex-row items-center mb-1">
                <Ionicons name="document-text" size={28} color="#F59E0B" />
                <Text className="text-2xl font-bold text-gray-900 ml-5">
                  Point Requests
                </Text>
              </View>
              <Text className="text-sm text-gray-600">
                Review and manage club point requests
              </Text>
            </View>

            {/* Statistics Cards */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <Text className="text-xs text-yellow-700 font-medium mb-1">Pending</Text>
                <Text className="text-3xl font-bold text-yellow-900">{stats.pending}</Text>
                <Text className="text-xs text-yellow-600 mt-1">Waiting</Text>
              </View>

              <View className="flex-1 bg-green-50 rounded-xl p-4 border border-green-200">
                <Text className="text-xs text-green-700 font-medium mb-1">Approved</Text>
                <Text className="text-3xl font-bold text-green-900">{stats.approved}</Text>
                <Text className="text-xs text-green-600 mt-1">Granted</Text>
              </View>

              <View className="flex-1 bg-red-50 rounded-xl p-4 border border-red-200">
                <Text className="text-xs text-red-700 font-medium mb-1">Rejected</Text>
                <Text className="text-3xl font-bold text-red-900">{stats.rejected}</Text>
                <Text className="text-xs text-red-600 mt-1">Denied</Text>
              </View>
            </View>

            {/* Tabs */}
            <View className="flex-row bg-white rounded-xl p-1 shadow-sm">
              <TouchableOpacity
                onPress={() => setActiveTab('PENDING')}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                  activeTab === 'PENDING' ? 'bg-yellow-100' : ''
                }`}
              >
                <Ionicons
                  name="time"
                  size={16}
                  color={activeTab === 'PENDING' ? '#B45309' : '#6B7280'}
                />
                <Text
                  className={`ml-2 font-semibold text-xs ${
                    activeTab === 'PENDING' ? 'text-yellow-700' : 'text-gray-600'
                  }`}
                >
                  Pending ({stats.pending})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('APPROVED')}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                  activeTab === 'APPROVED' ? 'bg-green-100' : ''
                }`}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={activeTab === 'APPROVED' ? '#15803D' : '#6B7280'}
                />
                <Text
                  className={`ml-2 font-semibold text-xs ${
                    activeTab === 'APPROVED' ? 'text-green-700' : 'text-gray-600'
                  }`}
                >
                  Approved ({stats.approved})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('REJECTED')}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                  activeTab === 'REJECTED' ? 'bg-red-100' : ''
                }`}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={activeTab === 'REJECTED' ? '#B91C1C' : '#6B7280'}
                />
                <Text
                  className={`ml-2 font-semibold text-xs ${
                    activeTab === 'REJECTED' ? 'text-red-700' : 'text-gray-600'
                  }`}
                >
                  Rejected ({stats.rejected})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#6B7280" />
                <AppTextInput
                  className="flex-1 ml-2 text-base text-gray-900"
                  placeholder="Search by club or reason..."
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
                <Text className="mt-4 text-gray-600">Loading requests...</Text>
              </View>
            )}

            {/* No Results */}
            {!loading && filteredRequests.length === 0 && (
              <View className="bg-white rounded-xl p-8 items-center">
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                  No requests found
                </Text>
                <Text className="text-gray-600 text-center">
                  {searchQuery ? 'Try adjusting your search' : 'No requests in this tab'}
                </Text>
              </View>
            )}

            {/* Requests List */}
            {!loading &&
              filteredRequests.map((request) => {
                const config = getStatusConfig(request.status);
                return (
                  <View
                    key={request.id}
                    className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${config.borderColor}`}
                  >
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="business" size={18} color="#6B7280" />
                          <Text
                            className="text-lg font-bold text-gray-900 ml-2 flex-1"
                            numberOfLines={1}
                          >
                            {request.clubName}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View className="flex-row items-center mb-2">
                          <View
                            className={`px-3 py-1 rounded-full ${config.bgColor}`}
                          >
                            <Text className={`text-xs font-semibold ${config.textColor}`}>
                              {request.status}
                            </Text>
                          </View>
                        </View>

                        {/* Requested Points */}
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="cash" size={18} color="#10B981" />
                          <Text className="text-xl font-bold text-green-700 ml-2">
                            {request.requestedPoints.toLocaleString()} points
                          </Text>
                        </View>

                        {/* Reason */}
                        <Text className="text-sm text-gray-600 mb-2" numberOfLines={3}>
                          <Text className="font-semibold">Reason: </Text>
                          {request.reason}
                        </Text>

                        {/* Staff Note */}
                        {request.staffNote && request.status !== 'PENDING' && (
                          <View className="bg-gray-50 p-2 rounded-lg border-l-2 border-gray-300">
                            <Text className="text-xs text-gray-600">
                              <Text className="font-semibold">Staff Note: </Text>
                              {request.staffNote}
                            </Text>
                          </View>
                        )}

                        {/* Date */}
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                          <Text className="text-xs text-gray-500 ml-1">
                            {formatDate(request.createdAt)}
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View className="items-end gap-2">
                        {request.status === 'PENDING' && (
                          <>
                            <TouchableOpacity
                              onPress={() => handleOpenReviewModal(request, 'approve')}
                              className="bg-green-500 p-2 rounded-lg"
                              disabled={isProcessing}
                            >
                              <Ionicons name="checkmark" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleOpenReviewModal(request, 'reject')}
                              className="bg-red-500 p-2 rounded-lg"
                              disabled={isProcessing}
                            >
                              <Ionicons name="close" size={20} color="white" />
                            </TouchableOpacity>
                          </>
                        )}
                        {request.status !== 'PENDING' && (
                          <TouchableOpacity
                            onPress={() =>
                              handleOpenReviewModal(
                                request,
                                request.status === 'APPROVED' ? 'approve' : 'reject'
                              )
                            }
                            className="bg-gray-200 px-3 py-2 rounded-lg flex-row items-center"
                            disabled={isProcessing}
                          >
                            <Ionicons name="eye-outline" size={16} color="#6B7280" />
                            <Text className="text-xs text-gray-700 ml-1 font-semibold">
                              View
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Footer - ID */}
                    <View className="border-t border-gray-200 pt-2 mt-2">
                      <Text className="text-xs text-gray-500">Request ID: #{request.id}</Text>
                    </View>
                  </View>
                );
              })}

            {/* Bottom Spacing */}
            <View className="h-8" />
          </View>
        </ScrollView>

        {/* Review Modal */}
        <Modal
          visible={isReviewModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseModal}
        >
          <View
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <View
              className="bg-white rounded-t-3xl p-6 shadow-2xl"
              style={{ maxHeight: '80%' }}
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800">
                  {selectedRequest?.status === 'PENDING'
                    ? isApproving
                      ? 'Approve Request'
                      : 'Reject Request'
                    : 'View/Edit Note'}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  className="bg-gray-100 p-2 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <View className="space-y-4">
                  {/* Request Details */}
                  <View className="bg-gray-50 p-4 rounded-xl">
                    <Text className="text-sm text-gray-600 mb-1">Club Name</Text>
                    <Text className="text-lg font-bold text-gray-900 mb-3">
                      {selectedRequest?.clubName}
                    </Text>

                    <Text className="text-sm text-gray-600 mb-1">Requested Points</Text>
                    <Text className="text-xl font-bold text-green-700 mb-3">
                      {selectedRequest?.requestedPoints.toLocaleString()} points
                    </Text>

                    <Text className="text-sm text-gray-600 mb-1">Reason</Text>
                    <Text className="text-sm text-gray-900">
                      {selectedRequest?.reason}
                    </Text>
                  </View>

                  {/* Note Input */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Note{' '}
                      {selectedRequest?.status === 'PENDING' && !isApproving && (
                        <Text className="text-red-500">* (Required)</Text>
                      )}
                    </Text>
                    <AppTextInput
                      className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base min-h-[100px]"
                      value={reviewNote}
                      onChangeText={setReviewNote}
                      placeholder={
                        isApproving
                          ? 'Reason for approval (optional)'
                          : 'Reason for rejection (required)'
                      }
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      editable={!isProcessing}
                    />
                  </View>

                  {/* Buttons */}
                  <View className="flex-row gap-3 mt-6">
                    <TouchableOpacity
                      onPress={handleCloseModal}
                      disabled={isProcessing}
                      className="flex-1 bg-gray-200 py-3 rounded-xl"
                    >
                      <Text className="text-gray-700 font-semibold text-center">
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSubmitReview}
                      disabled={
                        isProcessing ||
                        (selectedRequest?.status === 'PENDING' &&
                          !isApproving &&
                          !reviewNote.trim())
                      }
                      className={`flex-1 py-3 rounded-xl ${
                        isProcessing ||
                        (selectedRequest?.status === 'PENDING' &&
                          !isApproving &&
                          !reviewNote.trim())
                          ? 'bg-gray-300'
                          : isApproving || selectedRequest?.status === 'APPROVED'
                          ? 'bg-green-600'
                          : 'bg-red-600'
                      }`}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-center">
                          {selectedRequest?.status === 'PENDING'
                            ? `Confirm ${isApproving ? 'Approval' : 'Rejection'}`
                            : 'Save Note'}
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
