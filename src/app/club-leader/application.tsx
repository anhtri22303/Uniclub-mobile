import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import {
    MemberApplication,
    MemberApplicationService,
} from '@services/memberApplication.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'pending' | 'reviewed';

export default function ClubLeaderApplicationPage() {
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Modal states
  const [selectedApplication, setSelectedApplication] =
    useState<MemberApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  // Club info
  const [managedClubId, setManagedClubId] = useState<number | null>(null);
  const [managedClubName, setManagedClubName] = useState<string>('');

  // Get club ID from user's token/auth
  useEffect(() => {
    const loadClubInfo = async () => {
      // Club leaders have clubIds array, use the first one
      const clubId = user?.clubIds?.[0];
      
      if (!clubId) {
        console.warn('No clubId found for club leader');
        setLoading(false);
        return;
      }

      setManagedClubId(clubId);

      try {
        const clubResponse = await ClubService.getClubByIdFull(clubId);
        if (clubResponse?.success && clubResponse.data) {
          setManagedClubName(clubResponse.data.name);
        }
      } catch (error) {
        console.error('Error loading club info:', error);
      }
    };

    loadClubInfo();
  }, [user?.clubIds]);

  // Load applications
  const loadApplications = async () => {
    if (!managedClubId) return;

    try {
      setLoading(true);
      const data =
        await MemberApplicationService.getMemberApplicationsByClubId(
          managedClubId
        );
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (managedClubId) {
      loadApplications();
    }
  }, [managedClubId]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  // Filter applications
  const pendingApplications = applications.filter(
    (a) => a.status === 'PENDING'
  );
  const processedApplications = applications.filter(
    (a) => a.status !== 'PENDING'
  );

  // Approve handler
  const handleApprove = async (app: MemberApplication) => {
    setProcessingIds((prev) => new Set([...prev, app.applicationId]));
    try {
      await MemberApplicationService.approveMemberApplication(
        app.applicationId
      );
      Alert.alert('Success', `${app.applicantName}'s application approved!`);
      await loadApplications();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve application');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(app.applicationId);
        return newSet;
      });
    }
  };

  // Reject handler
  const handleReject = async (
    app: MemberApplication,
    reason = 'Rejected by club leader'
  ) => {
    setProcessingIds((prev) => new Set([...prev, app.applicationId]));
    try {
      await MemberApplicationService.rejectMemberApplication(
        app.applicationId,
        reason
      );
      Alert.alert('Success', `${app.applicantName}'s application rejected.`);
      await loadApplications();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject application');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(app.applicationId);
        return newSet;
      });
    }
  };

  // Bulk approve all
  const handleBulkApprove = async () => {
    Alert.alert(
      'Approve All',
      `Are you sure you want to approve all ${pendingApplications.length} applications?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          style: 'default',
          onPress: async () => {
            setBulkProcessing(true);
            try {
              await Promise.all(
                pendingApplications.map((app) =>
                  MemberApplicationService.approveMemberApplication(
                    app.applicationId
                  )
                )
              );
              Alert.alert(
                'Success',
                `All ${pendingApplications.length} applications approved!`
              );
              await loadApplications();
            } catch (error) {
              Alert.alert('Error', 'Some applications could not be approved');
            } finally {
              setBulkProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Bulk reject all
  const handleBulkReject = async () => {
    Alert.alert(
      'Reject All',
      `Are you sure you want to reject all ${pendingApplications.length} applications?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject All',
          style: 'destructive',
          onPress: async () => {
            setBulkProcessing(true);
            try {
              await Promise.all(
                pendingApplications.map((app) =>
                  MemberApplicationService.rejectMemberApplication(
                    app.applicationId,
                    'Bulk rejected by club leader'
                  )
                )
              );
              Alert.alert(
                'Success',
                `All ${pendingApplications.length} applications rejected.`
              );
              await loadApplications();
            } catch (error) {
              Alert.alert('Error', 'Some applications could not be rejected');
            } finally {
              setBulkProcessing(false);
            }
          },
        },
      ]
    );
  };

  // View application details
  const handleViewApplication = (app: MemberApplication) => {
    setSelectedApplication(app);
    setReviewNote('');
    setShowApplicationModal(true);
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

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-yellow-100 border-yellow-300';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-800';
      case 'REJECTED':
        return 'text-red-800';
      default:
        return 'text-yellow-800';
    }
  };

  // Loading state
  if (loading && !managedClubId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-600 mt-4">Loading club information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">
          Membership Applications
        </Text>
        <Text className="text-sm text-gray-600 mt-1">
          Review and manage new applications
          {managedClubName ? ` for "${managedClubName}"` : ''}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white px-6 py-3 border-b border-gray-200">
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => setActiveTab('pending')}
            className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl ${
              activeTab === 'pending'
                ? 'bg-teal-600'
                : 'bg-gray-100'
            }`}
          >
            <Ionicons
              name="hourglass"
              size={18}
              color={activeTab === 'pending' ? 'white' : '#6B7280'}
            />
            <Text
              className={`ml-2 font-semibold ${
                activeTab === 'pending' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Pending ({pendingApplications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('reviewed')}
            className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl ${
              activeTab === 'reviewed'
                ? 'bg-teal-600'
                : 'bg-gray-100'
            }`}
          >
            <Ionicons
              name="checkmark-done"
              size={18}
              color={activeTab === 'reviewed' ? 'white' : '#6B7280'}
            />
            <Text
              className={`ml-2 font-semibold ${
                activeTab === 'reviewed' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Processed ({processedApplications.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
      >
        {activeTab === 'pending' ? (
          <>
            {/* Bulk Actions */}
            {pendingApplications.length > 0 && (
              <View className="bg-teal-50 rounded-xl p-4 mb-4 border border-teal-200">
                <Text className="text-sm text-gray-700 mb-3">
                  {pendingApplications.length} pending application
                  {pendingApplications.length > 1 ? 's' : ''}
                </Text>
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={handleBulkReject}
                    disabled={bulkProcessing}
                    className="flex-1 bg-red-500 rounded-xl py-3 flex-row items-center justify-center"
                  >
                    <Ionicons name="close-circle" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      {bulkProcessing ? 'Processing...' : 'Reject All'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleBulkApprove}
                    disabled={bulkProcessing}
                    className="flex-1 bg-green-500 rounded-xl py-3 flex-row items-center justify-center"
                  >
                    <Ionicons name="checkmark-circle" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      {bulkProcessing ? 'Processing...' : 'Approve All'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Pending Applications */}
            {pendingApplications.length === 0 ? (
              <View className="bg-white rounded-xl p-8 items-center">
                <Ionicons name="checkmark-done" size={48} color="#D1D5DB" />
                <Text className="text-lg font-semibold text-gray-800 mt-4">
                  No Pending Applications
                </Text>
                <Text className="text-gray-600 text-center mt-2">
                  All applications have been reviewed
                </Text>
              </View>
            ) : (
              pendingApplications.map((app) => (
                <View
                  key={app.applicationId}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-800">
                        {app.applicantName}
                      </Text>
                      {app.studentCode && (
                        <Text className="text-sm text-gray-600 mt-1">
                          Student Code: {app.studentCode}
                        </Text>
                      )}
                      <Text className="text-xs text-gray-500 mt-1">
                        Submitted: {formatDate(app.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {app.message && (
                    <View className="bg-gray-50 p-3 rounded-lg mb-3">
                      <Text className="text-sm text-gray-700">
                        "{app.message}"
                      </Text>
                    </View>
                  )}

                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => handleViewApplication(app)}
                      className="flex-1 bg-blue-500 rounded-lg py-3 flex-row items-center justify-center"
                    >
                      <Ionicons name="eye" size={18} color="white" />
                      <Text className="text-white font-medium ml-2">View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleReject(app)}
                      disabled={processingIds.has(app.applicationId)}
                      className="flex-1 bg-red-500 rounded-lg py-3 flex-row items-center justify-center"
                    >
                      <Ionicons name="close-circle" size={18} color="white" />
                      <Text className="text-white font-medium ml-2">
                        Reject
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleApprove(app)}
                      disabled={processingIds.has(app.applicationId)}
                      className="flex-1 bg-green-500 rounded-lg py-3 flex-row items-center justify-center"
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="white"
                      />
                      <Text className="text-white font-medium ml-2">
                        Approve
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {/* Processed Applications */}
            {processedApplications.length === 0 ? (
              <View className="bg-white rounded-xl p-8 items-center">
                <Ionicons name="time" size={48} color="#D1D5DB" />
                <Text className="text-lg font-semibold text-gray-800 mt-4">
                  No Processed Applications
                </Text>
                <Text className="text-gray-600 text-center mt-2">
                  Applications you've processed will appear here
                </Text>
              </View>
            ) : (
              processedApplications.map((app) => (
                <View
                  key={app.applicationId}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-800">
                        {app.applicantName}
                      </Text>
                      {app.studentCode && (
                        <Text className="text-sm text-gray-600 mt-1">
                          Student Code: {app.studentCode}
                        </Text>
                      )}
                      <Text className="text-xs text-gray-500 mt-1">
                        Reviewed:{' '}
                        {app.updatedAt
                          ? formatDate(app.updatedAt)
                          : 'Recently'}
                      </Text>
                    </View>

                    <View
                      className={`px-3 py-1 rounded-full border ${getStatusBadgeColor(
                        app.status
                      )}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${getStatusTextColor(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </Text>
                    </View>
                  </View>

                  {app.message && (
                    <View className="bg-gray-50 p-3 rounded-lg mb-2">
                      <Text className="text-xs font-medium text-gray-700 mb-1">
                        Application Message:
                      </Text>
                      <Text className="text-sm text-gray-700">
                        "{app.message}"
                      </Text>
                    </View>
                  )}

                  {app.reason && (
                    <View className="bg-red-50 p-3 rounded-lg">
                      <Text className="text-xs font-medium text-red-700 mb-1">
                        Review Note:
                      </Text>
                      <Text className="text-sm text-red-700">
                        "{app.reason}"
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Application Detail Modal */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Review Application
              </Text>
              <TouchableOpacity
                onPress={() => setShowApplicationModal(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {selectedApplication && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Applicant Info */}
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Applicant
                  </Text>
                  <Text className="text-lg font-bold text-gray-800">
                    {selectedApplication.applicantName}
                  </Text>
                  {selectedApplication.studentCode && (
                    <Text className="text-sm text-gray-600 mt-1">
                      Student Code: {selectedApplication.studentCode}
                    </Text>
                  )}
                </View>

                {/* Application Message */}
                {selectedApplication.message && (
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Application Message
                    </Text>
                    <View className="bg-gray-50 rounded-xl p-4">
                      <Text className="text-sm text-gray-700">
                        {selectedApplication.message}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Review Note Input */}
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Review Note (Optional)
                  </Text>
                  <TextInput
                    value={reviewNote}
                    onChangeText={setReviewNote}
                    placeholder="Add a note about your decision..."
                    multiline
                    numberOfLines={4}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-base text-gray-800"
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={async () => {
                      await handleReject(
                        selectedApplication,
                        reviewNote || 'Rejected by club leader'
                      );
                      setShowApplicationModal(false);
                    }}
                    className="flex-1 bg-red-500 rounded-xl py-4 flex-row items-center justify-center"
                  >
                    <Ionicons name="close-circle" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Reject
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      await handleApprove(selectedApplication);
                      setShowApplicationModal(false);
                    }}
                    className="flex-1 bg-green-500 rounded-xl py-4 flex-row items-center justify-center"
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="white"
                    />
                    <Text className="text-white font-semibold ml-2">
                      Approve
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
