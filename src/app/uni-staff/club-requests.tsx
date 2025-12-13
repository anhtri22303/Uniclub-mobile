import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import {
  useClubApplications,
  useCreateClubApplication,
  useUpdateClubApplicationStatus,
} from '@hooks/useQueryHooks';
import { ClubApplication } from '@services/clubApplication.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

interface UiClubRequest {
  id: string;
  applicationId?: number;
  clubName: string;
  majorName: string | null;
  description: string;
  vision: string | null;
  proposerReason: string | null;
  requestedBy: string | null;
  requestDate: string | null;
  status: string;
  rejectReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export default function UniStaffClubRequestsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newClubName, setNewClubName] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newVision, setNewVision] = useState<string>("");
  const [newProposerReason, setNewProposerReason] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("pending");

  //   USE TANSTACK QUERY for data fetching
  const {
    data: clubApplicationsData = [],
    isLoading,
    isError,
    error: queryError,
    refetch,
    isRefetching,
  } = useClubApplications();

  const createApplicationMutation = useCreateClubApplication();
  const updateStatusMutation = useUpdateClubApplicationStatus();

  // Transform API data to UI format
  const requests: UiClubRequest[] = useMemo(() => {
    
    return clubApplicationsData.map((d: ClubApplication) => {
      // Handle both old format (nested objects) and new format (simple strings)
      const proposer = typeof d.proposer === 'string' 
        ? d.proposer 
        : d.proposer?.fullName || d.submittedBy?.fullName || null;
        
      const reviewer = typeof d.reviewedBy === 'string'
        ? d.reviewedBy
        : d.reviewedBy?.fullName || null;
      
      return {
        id: `req-${d.applicationId}`,
        applicationId: d.applicationId,
        clubName: d.clubName,
        majorName: d.majorName || null,
        description: d.description,
        vision: d.vision || null,
        proposerReason: d.proposerReason || null,
        requestedBy: proposer,
        requestDate: d.submittedAt,
        status: d.status,
        rejectReason: d.rejectReason,
        reviewedBy: reviewer,
        reviewedAt: d.reviewedAt,
      };
    });
  }, [clubApplicationsData]);

  async function handleSendNewApplication() {
    if (!newClubName.trim() || !newDescription.trim() || !newProposerReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all required fields.',
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    
    try {
      const created = await createApplicationMutation.mutateAsync({
        clubName: newClubName, 
        description: newDescription,
        vision: newVision || undefined,
        proposerReason: newProposerReason,
        otp: '000000', // TODO: Implement OTP flow later
      });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `${created.clubName} application submitted`,
        visibilityTime: 4000,
        autoHide: true,
      });
      
      setIsModalOpen(false);
      setNewClubName("");
      setNewDescription("");
      setNewVision("");
      setNewProposerReason("");
    } catch (err: any) {
      console.error('  Error creating application:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to send application',
        visibilityTime: 3000,
        autoHide: true,
      });
    }
  }

  async function approveApplication(appId?: number) {
    if (!appId) return;
    
    try {
      await updateStatusMutation.mutateAsync({
        applicationId: appId,
        approve: true,
        rejectReason: '',
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Application approved successfully',
        visibilityTime: 4000,
        autoHide: true,
      });
    } catch (err: any) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to update status',
        visibilityTime: 3000,
        autoHide: true,
      });
    }
  }

  async function rejectApplication(appId?: number) {
    if (!appId) return;
    
    Alert.prompt(
      'Reject Application',
      'Please provide a reason for rejection:',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              await updateStatusMutation.mutateAsync({
                applicationId: appId,
                approve: false,
                rejectReason: reason || 'Rejected by staff',
              });
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Application rejected',
                visibilityTime: 4000,
                autoHide: true,
              });
            } catch (err: any) {
              console.error(err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'Failed to update status',
                visibilityTime: 3000,
                autoHide: true,
              });
            }
          }
        }
      ],
      'plain-text'
    );
  }

  const getFilteredRequests = (tabType: "pending" | "processed") => {
    return requests.filter((req) => {
      const matchSearch =
        req.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.requestedBy?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (req.majorName?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === "all" ? true : req.majorName === categoryFilter;

      let matchStatus = false;
      if (tabType === "pending") {
        matchStatus = req.status === "PENDING";
      } else {
        matchStatus = req.status === "APPROVED" || req.status === "COMPLETED" || req.status === "REJECTED";
      }

      return matchSearch && matchStatus && matchCategory;
    });
  };

  const pendingRequests = getFilteredRequests("pending");
  const processedRequests = getFilteredRequests("processed");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7' }}>
            <Text className="text-xs font-bold" style={{ color: '#F59E0B' }}>● Pending</Text>
          </View>
        );
      case "APPROVED":
        return (
          <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#D1FAE5' }}>
            <Text className="text-xs font-bold" style={{ color: '#14B8A6' }}>● Approved</Text>
          </View>
        );
      case "COMPLETED":
        return (
          <View className="px-3 py-1 rounded-full bg-blue-100">
            <Text className="text-xs font-bold text-blue-700">● Complete</Text>
          </View>
        );
      case "REJECTED":
        return (
          <View className="px-3 py-1 rounded-full bg-red-100">
            <Text className="text-xs font-bold text-red-700">● Rejected</Text>
          </View>
        );
      default:
        return (
          <View className="px-3 py-1 rounded-full bg-gray-100">
            <Text className="text-xs font-bold text-gray-700">● {status}</Text>
          </View>
        );
    }
  };

  const pendingCount = requests.filter((req) => req.status === "PENDING").length;
  const approvedCount = requests.filter((req) => req.status === "APPROVED" || req.status === "COMPLETED").length;
  const rejectedCount = requests.filter((req) => req.status === "REJECTED").length;

  const renderRequestItem = ({ item: request }: { item: UiClubRequest }) => (
    <TouchableOpacity
      onPress={() => router.push(`/uni-staff/club-requests/req-${request.id}` as any)}
      className="bg-white rounded-3xl p-5 shadow-lg mb-4 border border-gray-100"
    >
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View className="p-2 rounded-xl mr-2" style={{ backgroundColor: '#D1FAE5' }}>
              <Ionicons name="business" size={20} color="#14B8A6" />
            </View>
            <Text className="text-lg font-bold text-gray-800 flex-1" numberOfLines={1}>
              {request.clubName}
            </Text>
          </View>
          {getStatusBadge(request.status)}
        </View>
        
        {request.majorName && (
          <View className="px-3 py-1 rounded-full self-start mb-2" style={{ backgroundColor: '#E0E7FF' }}>
            <Text className="text-xs font-medium" style={{ color: '#6366F1' }}>
              {request.majorName}
            </Text>
          </View>
        )}
        
        <Text className="text-gray-700 mb-2 leading-5" numberOfLines={2}>
          {request.description}
        </Text>
          
        {request.vision && (
          <View className="bg-blue-50 p-3 rounded-2xl mb-2">
            <View className="flex-row items-center mb-1">
              <Ionicons name="eye" size={14} color="#3B82F6" />
              <Text className="text-xs font-bold ml-1" style={{ color: '#3B82F6' }}>Vision:</Text>
            </View>
            <Text className="text-sm text-blue-700" numberOfLines={2}>
              {request.vision}
            </Text>
          </View>
        )}
        
        {request.proposerReason && (
          <View className="p-3 rounded-2xl mb-2" style={{ backgroundColor: '#FEF3C7' }}>
            <View className="flex-row items-center mb-1">
              <Ionicons name="bulb" size={14} color="#F59E0B" />
              <Text className="text-xs font-bold ml-1" style={{ color: '#F59E0B' }}>Reason:</Text>
            </View>
            <Text className="text-sm" style={{ color: '#D97706' }} numberOfLines={2}>
              {request.proposerReason}
            </Text>
          </View>
        )}
          
        <View className="flex-row items-center gap-4 mb-2">
          {request.requestDate && (
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={14} color="#14B8A6" />
              <Text className="ml-1 text-xs text-gray-600">
                {new Date(request.requestDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {request.requestedBy && (
            <View className="flex-row items-center">
              <Ionicons name="person" size={14} color="#14B8A6" />
              <Text className="ml-1 text-xs text-gray-600">
                by {String(request.requestedBy)}
              </Text>
            </View>
          )}
        </View>

        {request.reviewedBy && request.reviewedAt && (
          <View className="flex-row items-center bg-gray-50 p-2 rounded-xl mb-2">
            <Ionicons name="checkmark-done" size={14} color="#14B8A6" />
            <Text className="ml-1 text-xs text-gray-600">
              Reviewed by {String(request.reviewedBy)} on {new Date(request.reviewedAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        {request.rejectReason && (
          <View className="bg-red-50 p-3 rounded-2xl mb-2">
            <View className="flex-row items-center mb-1">
              <Ionicons name="warning" size={14} color="#EF4444" />
              <Text className="text-xs font-bold ml-1 text-red-700">Rejection Reason:</Text>
            </View>
            <Text className="text-sm text-red-600" numberOfLines={2}>
              {request.rejectReason}
            </Text>
          </View>
        )}
      </View>

      {activeTab === "pending" && (
        <View className="flex-row justify-end gap-2 mt-2">
          <TouchableOpacity
            onPress={() => approveApplication(request.applicationId)}
            disabled={updateStatusMutation.isPending}
            className={`bg-green-500 px-4 py-2 rounded-xl flex-row items-center ${updateStatusMutation.isPending ? 'opacity-50' : ''}`}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text className="text-white font-medium ml-1">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => rejectApplication(request.applicationId)}
            disabled={updateStatusMutation.isPending}
            className={`bg-red-500 px-4 py-2 rounded-xl flex-row items-center ${updateStatusMutation.isPending ? 'opacity-50' : ''}`}
          >
            <Ionicons name="close" size={16} color="white" />
            <Text className="text-white font-medium ml-1">Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />
      
      {/* Header */}
      <View className="bg-white rounded-3xl mx-6 mt-6 p-6 shadow-lg">
        <View className="flex-row items-center">
          <View className="p-3 rounded-2xl" style={{ backgroundColor: '#D1FAE5' }}>
            <Ionicons name="document-text" size={28} color="#14B8A6" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-2xl font-bold text-gray-800">Club Requests</Text>
            <Text className="text-sm text-gray-600 mt-1">Review and manage club applications</Text>
          </View>
        </View>
      </View>

      <View className="flex-1 px-6 pt-4">
        {/* Stats Cards */}
        <View className="flex-row gap-3 mt-4 mb-4">
          <View className="flex-1 bg-white rounded-3xl p-4 shadow-lg border-2 border-yellow-400">
            <View className="items-center">
              <View className="bg-yellow-100 p-3 rounded-2xl mb-2">
                <Ionicons name="time" size={24} color="#F59E0B" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">{pendingCount}</Text>
              <Text className="text-xs text-gray-600 mt-1">Pending</Text>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-3xl p-4 shadow-lg border-2" style={{ borderColor: '#14B8A6' }}>
            <View className="items-center">
              <View className="p-3 rounded-2xl mb-2" style={{ backgroundColor: '#D1FAE5' }}>
                <Ionicons name="checkmark-circle" size={24} color="#14B8A6" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">{approvedCount}</Text>
              <Text className="text-xs text-gray-600 mt-1">Approved</Text>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-3xl p-4 shadow-lg border-2 border-red-400">
            <View className="items-center">
              <View className="bg-red-100 p-3 rounded-2xl mb-2">
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">{rejectedCount}</Text>
              <Text className="text-xs text-gray-600 mt-1">Rejected</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View className="bg-white rounded-3xl p-4 shadow-lg mb-4">
          <View className="flex-row items-center">
            <View className="p-2 rounded-xl" style={{ backgroundColor: '#14B8A6' }}>
              <Ionicons name="search" size={20} color="white" />
            </View>
            <AppTextInput
              placeholder="Search by club name or requester..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-3 text-base text-gray-800"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <Ionicons name="close-circle" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View className="bg-white rounded-3xl p-2 shadow-lg mb-4">
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setActiveTab("pending")}
              className="flex-1 py-3 px-3 rounded-2xl"
              style={{ backgroundColor: activeTab === "pending" ? '#14B8A6' : 'transparent' }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="time" 
                  size={18} 
                  color={activeTab === "pending" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-2 font-bold text-sm ${
                  activeTab === "pending" ? "text-white" : "text-gray-600"
                }`}>
                  Pending ({pendingRequests.length})
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("processed")}
              className="flex-1 py-3 px-3 rounded-2xl"
              style={{ backgroundColor: activeTab === "processed" ? '#14B8A6' : 'transparent' }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="checkmark-done" 
                  size={18} 
                  color={activeTab === "processed" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-2 font-bold text-sm ${
                  activeTab === "processed" ? "text-white" : "text-gray-600"
                }`}>
                  Processed ({processedRequests.length})
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Requests List with FlatList */}
        <FlatList
          data={activeTab === "pending" ? pendingRequests : processedRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          ListEmptyComponent={
            <View className="bg-white rounded-xl p-8 shadow-sm">
              <Text className="text-center text-gray-500">
                {isLoading 
                  ? "Loading club applications..." 
                  : isError 
                  ? `Error: ${queryError?.message || 'Failed to load applications'}` 
                  : `No ${activeTab} club requests found`}
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => setIsModalOpen(true)}
        className="absolute bottom-24 right-6 bg-emerald-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 5 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Create Application Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Create Club Application</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Club Name</Text>
                <AppTextInput
                  value={newClubName}
                  onChangeText={setNewClubName}
                  placeholder="Enter club name"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700"
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Vision (Optional)</Text>
                <AppTextInput
                  value={newVision}
                  onChangeText={setNewVision}
                  placeholder="Vision for the club"
                  multiline
                  numberOfLines={2}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                <AppTextInput
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Describe the club's purpose"
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Proposer Reason</Text>
                <AppTextInput
                  value={newProposerReason}
                  onChangeText={setNewProposerReason}
                  placeholder="Why do you want to create this club?"
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
              
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-300 py-3 rounded-xl"
                  disabled={createApplicationMutation.isPending}
                >
                  <Text className="text-gray-700 text-center font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSendNewApplication}
                  className={`flex-1 bg-emerald-500 py-3 rounded-xl ${createApplicationMutation.isPending ? 'opacity-50' : ''}`}
                  disabled={createApplicationMutation.isPending}
                >
                  <Text className="text-white text-center font-medium">
                    {createApplicationMutation.isPending ? 'Sending...' : 'Send Application'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Navigation Bar */}
      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
