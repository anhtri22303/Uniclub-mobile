import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
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
  TouchableOpacity,
  View
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
      // Don't load if no user
      if (!user) {
        setLoading(false);
        return;
      }

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
  }, [user?.clubIds, user]);

  // Load applications
  const loadApplications = async () => {
    if (!managedClubId || !user) return;

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
    if (managedClubId && user) {
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
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-600 mt-4">Loading club information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="bg-white px-6 py-5 border-b border-gray-100">
        <Text className="text-3xl font-bold text-gray-900">Membership Applications</Text>
        <Text className="text-sm text-gray-500 mt-2">
          Review and manage new applications
          {managedClubName ? ` for "${managedClubName}"` : ''}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setActiveTab('pending')}
            className={`flex-1 flex-row items-center justify-center px-4 py-3.5 rounded-2xl ${
              activeTab === 'pending'
                ? 'bg-teal-600'
                : 'bg-gray-100'
            }`}
            style={activeTab === 'pending' ? {
              shadowColor: '#0D9488',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            } : {}}
          >
            <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
              activeTab === 'pending' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              <Ionicons
                name="hourglass"
                size={16}
                color={activeTab === 'pending' ? 'white' : '#6B7280'}
              />
            </View>
            <Text
              className={`font-bold text-base ${
                activeTab === 'pending' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Pending
            </Text>
            <View className={`ml-2 px-2.5 py-0.5 rounded-full ${
              activeTab === 'pending' ? 'bg-white/20' : 'bg-teal-100'
            }`}>
              <Text className={`text-xs font-bold ${
                activeTab === 'pending' ? 'text-white' : 'text-teal-700'
              }`}>
                {pendingApplications.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('reviewed')}
            className={`flex-1 flex-row items-center justify-center px-4 py-3.5 rounded-2xl ${
              activeTab === 'reviewed'
                ? 'bg-teal-600'
                : 'bg-gray-100'
            }`}
            style={activeTab === 'reviewed' ? {
              shadowColor: '#0D9488',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            } : {}}
          >
            <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
              activeTab === 'reviewed' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              <Ionicons
                name="checkmark-done"
                size={16}
                color={activeTab === 'reviewed' ? 'white' : '#6B7280'}
              />
            </View>
            <Text
              className={`font-bold text-base ${
                activeTab === 'reviewed' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Processed
            </Text>
            <View className={`ml-2 px-2.5 py-0.5 rounded-full ${
              activeTab === 'reviewed' ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              <Text className={`text-xs font-bold ${
                activeTab === 'reviewed' ? 'text-white' : 'text-gray-700'
              }`}>
                {processedApplications.length}
              </Text>
            </View>
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
            {/* Pending Applications */}
            {pendingApplications.length === 0 ? (
              <View className="bg-white rounded-2xl p-12 items-center shadow-sm">
                <View className="bg-teal-50 rounded-full p-6 mb-4">
                  <Ionicons name="checkmark-done" size={48} color="#0D9488" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mt-2">
                  All Caught Up!
                </Text>
                <Text className="text-gray-500 text-center mt-2 text-base">
                  No pending applications to review
                </Text>
              </View>
            ) : (
              pendingApplications.map((app) => (
                <View
                  key={app.applicationId}
                  className="bg-white rounded-2xl mb-3 shadow-md overflow-hidden"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {/* Header */}
                  <View className="px-4 pt-4 pb-2">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {app.applicantName}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                      <Text className="text-xs text-gray-500 ml-1">
                        Submitted on {formatDate(app.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Message */}
                  {app.message && (
                    <View className="px-4 py-2 bg-gray-50">
                      <View className="flex-row items-start">
                        <Ionicons name="chatbox-ellipses" size={14} color="#0D9488" style={{ marginTop: 1 }} />
                        <View className="flex-1 ml-1.5">
                          <Text className="text-xs font-semibold text-gray-700 mb-0.5">Application Message</Text>
                          <Text className="text-sm text-gray-700 leading-5 italic">
                            "{app.message}"
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="px-4 py-3 flex-row gap-2 bg-white">
                    <TouchableOpacity
                      onPress={() => handleViewApplication(app)}
                      className="flex-1 bg-blue-500 rounded-xl py-2.5 flex-row items-center justify-center shadow-sm"
                      style={{
                        shadowColor: '#3B82F6',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <Ionicons name="eye" size={18} color="white" />
                      <Text className="text-white font-bold ml-2 text-base">View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleReject(app)}
                      disabled={processingIds.has(app.applicationId)}
                      className="flex-1 bg-red-500 rounded-xl py-2.5 flex-row items-center justify-center shadow-sm"
                      style={{
                        shadowColor: '#EF4444',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      {processingIds.has(app.applicationId) ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={18} color="white" />
                          <Text className="text-white font-bold ml-2 text-base">Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleApprove(app)}
                      disabled={processingIds.has(app.applicationId)}
                      className="flex-1 bg-green-500 rounded-xl py-2.5 flex-row items-center justify-center shadow-sm"
                      style={{
                        shadowColor: '#10B981',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      {processingIds.has(app.applicationId) ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={18} color="white" />
                          <Text className="text-white font-bold ml-2 text-base">Approve</Text>
                        </>
                      )}
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
              <View className="bg-white rounded-2xl p-12 items-center shadow-sm">
                <View className="bg-gray-100 rounded-full p-6 mb-4">
                  <Ionicons name="document-text" size={48} color="#9CA3AF" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mt-2">
                  No Processed Applications
                </Text>
                <Text className="text-gray-500 text-center mt-2 text-base">
                  Reviewed applications will appear here
                </Text>
              </View>
            ) : (
              processedApplications.map((app) => (
                <View
                  key={app.applicationId}
                  className="bg-white rounded-2xl mb-4 shadow-md overflow-hidden"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {/* Header and Status */}
                  <View className="p-5 bg-gray-50 border-b border-gray-100">
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900 mb-2">
                          {app.applicantName}
                        </Text>
                        {app.studentCode && (
                          <View className="flex-row items-center">
                            <Ionicons name="school" size={13} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-1.5">
                              {app.studentCode}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View
                        className={`px-3 py-1.5 rounded-full ${
                          app.status === 'APPROVED' 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}
                      >
                        <View className="flex-row items-center">
                          <Ionicons 
                            name={app.status === 'APPROVED' ? 'checkmark-circle' : 'close-circle'} 
                            size={14} 
                            color={app.status === 'APPROVED' ? '#10B981' : '#EF4444'} 
                          />
                          <Text
                            className={`text-xs font-bold ml-1 ${
                              app.status === 'APPROVED' 
                                ? 'text-green-700' 
                                : 'text-red-700'
                            }`}
                          >
                            {app.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row items-center bg-white px-3 py-2 rounded-lg">
                      <Ionicons name="calendar-outline" size={13} color="#6B7280" />
                      <Text className="text-xs text-gray-600 ml-1.5">
                        Reviewed on {app.updatedAt ? formatDate(app.updatedAt) : 'Recently'}
                      </Text>
                    </View>
                  </View>

                  {/* Messages */}
                  <View className="p-4">
                    {app.message && (
                      <View className="bg-blue-50 p-3.5 rounded-xl mb-3 border border-blue-100">
                        <View className="flex-row items-start">
                          <Ionicons name="chatbox" size={14} color="#3B82F6" style={{ marginTop: 1 }} />
                          <View className="flex-1 ml-2">
                            <Text className="text-xs font-semibold text-blue-900 mb-1">
                              Application Message
                            </Text>
                            <Text className="text-sm text-blue-800 leading-5">
                              "{app.message}"
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {app.reason && (
                      <View className="bg-amber-50 p-3.5 rounded-xl border border-amber-100">
                        <View className="flex-row items-start">
                          <Ionicons name="document-text" size={14} color="#F59E0B" style={{ marginTop: 1 }} />
                          <View className="flex-1 ml-2">
                            <Text className="text-xs font-semibold text-amber-900 mb-1">
                              Review Note
                            </Text>
                            <Text className="text-sm text-amber-800 leading-5">
                              "{app.reason}"
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showApplicationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%]"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            {/* Modal Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900">Review Application</Text>
                  <Text className="text-sm text-gray-500 mt-1">Make your decision carefully</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowApplicationModal(false)}
                  className="bg-gray-100 p-2.5 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedApplication && (
              <ScrollView showsVerticalScrollIndicator={false} className="px-6 pt-4 pb-6">
                {/* Applicant Info Card */}
                <View className="bg-white rounded-2xl p-5 mb-4 border-2 border-teal-100"
                  style={{
                    shadowColor: '#0D9488',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <View className="mb-3">
                    <Text className="text-xs font-bold text-teal-600 mb-2">APPLICANT</Text>
                    <Text className="text-xl font-bold text-gray-900 mb-2">
                      {selectedApplication.applicantName}
                    </Text>
                    {selectedApplication.studentCode && (
                      <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-lg self-start">
                        <Ionicons name="school" size={14} color="#0D9488" />
                        <Text className="text-sm text-gray-700 ml-1.5 font-medium">
                          {selectedApplication.studentCode}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View className="bg-teal-50 px-3 py-2.5 rounded-xl border border-teal-100">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={14} color="#0D9488" />
                      <Text className="text-xs text-teal-700 ml-1.5 font-medium">
                        Submitted on {formatDate(selectedApplication.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Application Message */}
                {selectedApplication.message && (
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="chatbox-ellipses" size={16} color="#0D9488" />
                      <Text className="text-sm font-bold text-gray-900 ml-1.5">
                        Application Message
                      </Text>
                    </View>
                    <View className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
                      <Text className="text-base text-gray-800 leading-6 italic">
                        "{selectedApplication.message}"
                      </Text>
                    </View>
                  </View>
                )}

                {/* Review Note Input */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="create-outline" size={16} color="#6B7280" />
                    <Text className="text-sm font-bold text-gray-900 ml-1.5">
                      Review Note (Optional)
                    </Text>
                  </View>
                  <AppTextInput
                    value={reviewNote}
                    onChangeText={setReviewNote}
                    placeholder="Add a note about your decision..."
                    multiline
                    numberOfLines={4}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-4 text-base text-gray-800"
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={async () => {
                      await handleReject(
                        selectedApplication,
                        reviewNote || 'Rejected by club leader'
                      );
                      setShowApplicationModal(false);
                    }}
                    className="flex-1 bg-red-500 rounded-2xl py-4 flex-row items-center justify-center"
                    style={{
                      shadowColor: '#EF4444',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 3,
                    }}
                  >
                    <Ionicons name="close-circle" size={22} color="white" />
                    <Text className="text-white font-bold ml-2 text-base">
                      Reject
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      await handleApprove(selectedApplication);
                      setShowApplicationModal(false);
                    }}
                    className="flex-1 bg-green-500 rounded-2xl py-4 flex-row items-center justify-center"
                    style={{
                      shadowColor: '#10B981',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 3,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="white"
                    />
                    <Text className="text-white font-bold ml-2 text-base">
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
