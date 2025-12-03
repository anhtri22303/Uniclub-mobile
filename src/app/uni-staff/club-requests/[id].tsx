import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useClubApplicationById } from '@hooks/useQueryHooks';
import { useAuthStore } from '@stores/auth.store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function ClubRequestDetailPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Extract applicationId from params (format: req-123)
  const applicationId = id?.startsWith('req-') 
    ? parseInt(id.replace('req-', '')) 
    : parseInt(id || '0');

  // Fetch club application by ID
  const { data: application, isLoading: loading, error } = useClubApplicationById(applicationId);

  // State for rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text className="text-gray-600 mt-4">Loading request details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !application) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-2xl font-bold text-gray-800 mt-4">Request Not Found</Text>
          <Text className="text-gray-600 text-center mt-2">
            {error ? String(error) : 'The requested club application could not be found.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 py-3 px-6 rounded-2xl"
            style={{ backgroundColor: '#14B8A6' }}
          >
            <Text className="text-white font-bold">Back to Requests</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <View className="px-4 py-2 rounded-full" style={{ backgroundColor: '#FEF3C7' }}>
            <Text className="text-sm font-bold" style={{ color: '#F59E0B' }}>● Pending</Text>
          </View>
        );
      case "APPROVED":
        return (
          <View className="px-4 py-2 rounded-full" style={{ backgroundColor: '#D1FAE5' }}>
            <Text className="text-sm font-bold" style={{ color: '#14B8A6' }}>● Approved</Text>
          </View>
        );
      case "COMPLETED":
        return (
          <View className="px-4 py-2 rounded-full bg-blue-100">
            <Text className="text-sm font-bold text-blue-700">● Completed</Text>
          </View>
        );
      case "REJECTED":
        return (
          <View className="px-4 py-2 rounded-full bg-red-100">
            <Text className="text-sm font-bold text-red-700">● Rejected</Text>
          </View>
        );
      default:
        return (
          <View className="px-4 py-2 rounded-full bg-gray-100">
            <Text className="text-sm font-bold text-gray-700">● {status}</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="bg-white rounded-3xl mx-6 mt-6 p-6 shadow-lg">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-3"
        >
          <Ionicons name="arrow-back" size={24} color="#14B8A6" />
          <Text className="text-base font-medium ml-2" style={{ color: '#14B8A6' }}>
            Back to Requests
          </Text>
        </TouchableOpacity>
        
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">{application.clubName}</Text>
            <Text className="text-sm text-gray-600 mt-1">Club Registration Request</Text>
          </View>
          {getStatusBadge(application.status)}
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* Main Information Card */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-4">
          <View className="flex-row items-center mb-4">
            <View className="p-3 rounded-2xl" style={{ backgroundColor: '#D1FAE5' }}>
              <Ionicons name="business" size={24} color="#14B8A6" />
            </View>
            <Text className="text-xl font-bold text-gray-800 ml-3">Club Information</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-600 mb-1">Club Name</Text>
              <Text className="text-base text-gray-800 font-semibold">{application.clubName}</Text>
            </View>

            {application.majorName && (
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Major</Text>
                <View className="px-3 py-2 rounded-full self-start" style={{ backgroundColor: '#E0E7FF' }}>
                  <Text className="text-sm font-medium" style={{ color: '#6366F1' }}>
                    {application.majorName}
                  </Text>
                </View>
              </View>
            )}

            <View>
              <Text className="text-sm font-medium text-gray-600 mb-1">Description</Text>
              <Text className="text-base text-gray-800 leading-6">{application.description}</Text>
            </View>

            {application.vision && (
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Vision</Text>
                <View className="bg-blue-50 p-4 rounded-2xl">
                  <Text className="text-base text-blue-700 leading-6">{application.vision}</Text>
                </View>
              </View>
            )}

            {application.proposerReason && (
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-1">Proposer Reason</Text>
                <View className="p-4 rounded-2xl" style={{ backgroundColor: '#FEF3C7' }}>
                  <Text className="text-base leading-6" style={{ color: '#D97706' }}>
                    {application.proposerReason}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Request Details Card */}
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-4">
          <View className="flex-row items-center mb-4">
            <View className="p-3 rounded-2xl" style={{ backgroundColor: '#D1FAE5' }}>
              <Ionicons name="information-circle" size={24} color="#14B8A6" />
            </View>
            <Text className="text-xl font-bold text-gray-800 ml-3">Request Details</Text>
          </View>

          <View className="space-y-3">
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={18} color="#14B8A6" />
              <View className="ml-3 flex-1">
                <Text className="text-sm text-gray-600">Submitted Date</Text>
                <Text className="text-base font-medium text-gray-800">
                  {new Date(application.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>

            {application.proposer && (
              <>
                <View className="flex-row items-center">
                  <Ionicons name="person" size={18} color="#14B8A6" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-600">Requested By</Text>
                    <Text className="text-base font-medium text-gray-800">
                      {application.proposer.fullName}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="mail" size={18} color="#14B8A6" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-600">Contact Email</Text>
                    <Text className="text-base font-medium text-gray-800">
                      {application.proposer.email}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {application.reviewedBy && application.reviewedAt && (
              <>
                <View className="h-px bg-gray-200 my-2" />
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-done" size={18} color="#14B8A6" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-600">Reviewed By</Text>
                    <Text className="text-base font-medium text-gray-800">
                      {typeof application.reviewedBy === 'string' 
                        ? application.reviewedBy 
                        : application.reviewedBy.fullName}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="time" size={18} color="#14B8A6" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-600">Reviewed Date</Text>
                    <Text className="text-base font-medium text-gray-800">
                      {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {application.rejectReason && (
              <>
                <View className="h-px bg-gray-200 my-2" />
                <View className="bg-red-50 p-4 rounded-2xl">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="warning" size={18} color="#EF4444" />
                    <Text className="text-sm font-bold text-red-700 ml-2">Rejection Reason</Text>
                  </View>
                  <Text className="text-base text-red-600 leading-6">
                    {application.rejectReason}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Actions Card (only show for PENDING status) */}
        {application.status === "PENDING" && (
          <View className="bg-white rounded-3xl p-6 shadow-lg mb-24">
            <View className="flex-row items-center mb-4">
              <View className="p-3 rounded-2xl" style={{ backgroundColor: '#D1FAE5' }}>
                <Ionicons name="settings" size={24} color="#14B8A6" />
              </View>
              <Text className="text-xl font-bold text-gray-800 ml-3">Actions</Text>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => {
                  // TODO: Implement approve function
                  Toast.show({
                    type: 'info',
                    text1: 'Coming Soon',
                    text2: 'Approve functionality will be implemented',
                    visibilityTime: 3000,
                    autoHide: true,
                  });
                }}
                className="py-4 rounded-2xl flex-row items-center justify-center"
                style={{ backgroundColor: '#14B8A6' }}
              >
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text className="text-white font-bold text-base ml-2">Approve Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsRejectModalOpen(true)}
                className="bg-red-500 py-4 rounded-2xl flex-row items-center justify-center"
              >
                <Ionicons name="close-circle" size={24} color="white" />
                <Text className="text-white font-bold text-base ml-2">Reject Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Space for Navigation Bar */}
        <View className="h-20" />
      </ScrollView>

      {/* Rejection Modal */}
      <Modal
        visible={isRejectModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRejectModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Reject Application</Text>
              <TouchableOpacity onPress={() => setIsRejectModalOpen(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 mb-4">
              Please provide a clear reason for rejecting this club application.
            </Text>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Reason for Rejection</Text>
              <AppTextInput
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Type your reason here..."
                multiline
                numberOfLines={4}
                className="border border-gray-300 rounded-2xl px-4 py-3 text-gray-800"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setIsRejectModalOpen(false);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-200 py-3 rounded-2xl"
              >
                <Text className="text-gray-700 text-center font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!rejectionReason.trim()) {
                    Toast.show({
                      type: 'error',
                      text1: 'Validation Error',
                      text2: 'Please provide a reason for rejection',
                      visibilityTime: 3000,
                      autoHide: true,
                    });
                    return;
                  }
                  // TODO: Implement reject function
                  Toast.show({
                    type: 'info',
                    text1: 'Coming Soon',
                    text2: 'Reject functionality will be implemented',
                    visibilityTime: 3000,
                    autoHide: true,
                  });
                  setIsRejectModalOpen(false);
                  setRejectionReason('');
                }}
                className="flex-1 bg-red-500 py-3 rounded-2xl"
                disabled={!rejectionReason.trim()}
                style={{ opacity: !rejectionReason.trim() ? 0.5 : 1 }}
              >
                <Text className="text-white text-center font-bold">Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
