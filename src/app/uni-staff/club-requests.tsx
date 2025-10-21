import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import {
  ClubApplication,
  getClubApplications,
  postClubApplication,
  putClubApplicationStatus
} from '@services/clubApplication.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [requests, setRequests] = useState<UiClubRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newClubName, setNewClubName] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newVision, setNewVision] = useState<string>("");
  const [newProposerReason, setNewProposerReason] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("pending");

  const fetchData = async () => {
    try {
      const data: ClubApplication[] = await getClubApplications();
      console.log('📋 Fetched club applications:', JSON.stringify(data, null, 2));
      
      const mapped: UiClubRequest[] = data.map((d: any) => {
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
          majorName: d.majorName || d.category || null,
          description: d.description,
          vision: d.vision,
          proposerReason: d.proposerReason,
          requestedBy: proposer,
          requestDate: d.submittedAt,
          status: d.status,
          rejectReason: d.rejectReason,
          reviewedBy: reviewer,
          reviewedAt: d.reviewedAt,
        };
      });
      
      console.log('📋 Mapped UI requests:', JSON.stringify(mapped, null, 2));
      setRequests(mapped);
      setError(null);
    } catch (err) {
      console.error('❌ Error in fetchData:', err);
      setError("Failed to load club applications");
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchData()
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  async function handleSendNewApplication() {
    if (!newClubName.trim() || !newDescription.trim() || !newProposerReason.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const created = await postClubApplication({ 
        clubName: newClubName, 
        description: newDescription,
        vision: newVision || undefined,
        proposerReason: newProposerReason,
      });
      Alert.alert('Success', `${created.clubName} application submitted`);
      
      // Reload list
      await fetchData();
      setIsModalOpen(false);
      setNewClubName("");
      setNewDescription("");
      setNewVision("");
      setNewProposerReason("");
    } catch (err) {
      console.error('❌ Error creating application:', err);
      setError('Failed to create application');
      Alert.alert('Error', 'Failed to send application');
    } finally {
      setLoading(false);
    }
  }

  async function approveApplication(appId?: number) {
    if (!appId) return;
    setLoading(true);
    try {
      await putClubApplicationStatus(appId, true, '');
      await fetchData();
      Alert.alert('Success', `Application approved successfully`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setLoading(false);
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
            setLoading(true);
            try {
              await putClubApplicationStatus(appId, false, reason || 'Rejected by staff');
              await fetchData();
              Alert.alert('Success', `Application rejected`);
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to update status');
            } finally {
              setLoading(false);
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
        matchStatus = req.status === "SUBMITTED" || req.status === "REJECTED";
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
          <View className="bg-yellow-100 px-2 py-1 rounded-full">
            <Text className="text-yellow-700 text-xs font-medium">Pending</Text>
          </View>
        );
      case "SUBMITTED":
        return (
          <View className="bg-green-100 px-2 py-1 rounded-full">
            <Text className="text-green-700 text-xs font-medium">Submitted</Text>
          </View>
        );
      case "REJECTED":
        return (
          <View className="bg-red-100 px-2 py-1 rounded-full">
            <Text className="text-red-700 text-xs font-medium">Rejected</Text>
          </View>
        );
      default:
        return (
          <View className="bg-gray-100 px-2 py-1 rounded-full">
            <Text className="text-gray-700 text-xs font-medium">{status}</Text>
          </View>
        );
    }
  };

  const pendingCount = requests.filter((req) => req.status === "PENDING").length;
  const approvedCount = requests.filter((req) => req.status === "SUBMITTED").length;
  const rejectedCount = requests.filter((req) => req.status === "REJECTED").length;

  const renderRequestItem = ({ item: request }: { item: UiClubRequest }) => (
    <View className="bg-white rounded-2xl p-6 shadow-lg mb-4">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1">
          <View className="flex-row items-center mb-2 flex-wrap gap-2">
            <Ionicons name="business" size={20} color="#6B7280" />
            <Text className="text-lg font-semibold text-gray-800 flex-1">
              {request.clubName}
            </Text>
            {getStatusBadge(request.status)}
          </View>
          
          {request.majorName && (
            <View className="bg-indigo-100 px-3 py-1 rounded-full self-start mb-2">
              <Text className="text-indigo-700 text-xs font-medium">
                Major: {request.majorName}
              </Text>
            </View>
          )}
          
          <Text className="text-gray-600 mb-2" numberOfLines={2}>
            {request.description}
          </Text>
          
          {request.vision && (
            <View className="bg-blue-50 p-2 rounded-lg mb-2">
              <Text className="text-xs text-blue-700 font-medium mb-1">Vision:</Text>
              <Text className="text-sm text-blue-600" numberOfLines={2}>
                {request.vision}
              </Text>
            </View>
          )}
          
          {request.proposerReason && (
            <View className="bg-amber-50 p-2 rounded-lg mb-2">
              <Text className="text-xs text-amber-700 font-medium mb-1">Proposer Reason:</Text>
              <Text className="text-sm text-amber-600" numberOfLines={2}>
                {request.proposerReason}
              </Text>
            </View>
          )}
          
          <View className="space-y-2">
            {request.requestDate && (
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={16} color="#6B7280" />
                <Text className="ml-2 text-sm text-gray-500">
                  {new Date(request.requestDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            {request.requestedBy && (
              <View className="flex-row items-center">
                <Ionicons name="person" size={16} color="#6B7280" />
                <Text className="ml-2 text-sm text-gray-500">
                  by {String(request.requestedBy)}
                </Text>
              </View>
            )}

            {request.reviewedBy && request.reviewedAt && (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-done" size={16} color="#6B7280" />
                <Text className="ml-2 text-sm text-gray-500">
                  Reviewed by {String(request.reviewedBy)} on {new Date(request.reviewedAt).toLocaleDateString()}
                </Text>
              </View>
            )}

            {request.rejectReason && (
              <View className="flex-row items-start mt-2 bg-red-50 p-2 rounded-lg">
                <Ionicons name="warning" size={16} color="#DC2626" />
                <Text className="ml-2 text-sm text-red-700 flex-1">
                  Reason: {request.rejectReason}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {activeTab === "pending" && (
        <View className="flex-row justify-end gap-2 mt-2">
          <TouchableOpacity
            onPress={() => approveApplication(request.applicationId)}
            disabled={loading}
            className={`bg-green-500 px-4 py-2 rounded-xl flex-row items-center ${loading ? 'opacity-50' : ''}`}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text className="text-white font-medium ml-1">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => rejectApplication(request.applicationId)}
            disabled={loading}
            className={`bg-red-500 px-4 py-2 rounded-xl flex-row items-center ${loading ? 'opacity-50' : ''}`}
          >
            <Ionicons name="close" size={16} color="white" />
            <Text className="text-white font-medium ml-1">Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />
      
      {/* Header */}
      <View className="px-6 py-4 bg-white shadow-sm">
        <Text className="text-2xl font-bold text-gray-800">Club Requests</Text>
        <Text className="text-sm text-gray-500">Review and manage applications</Text>
      </View>

      <View className="flex-1 px-6 pt-4">
        {/* Stats Cards */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-yellow-500 p-2 rounded-lg mr-2">
                <Ionicons name="time" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-yellow-900">{pendingCount}</Text>
                <Text className="text-xs text-yellow-600">Pending</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-green-500 p-2 rounded-lg mr-2">
                <Ionicons name="checkmark-circle" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-green-900">{approvedCount}</Text>
                <Text className="text-xs text-green-600">Submitted</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="bg-red-500 p-2 rounded-lg mr-2">
                <Ionicons name="close-circle" size={18} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-red-900">{rejectedCount}</Text>
                <Text className="text-xs text-red-600">Rejected</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search */}
        <View className="bg-white rounded-xl p-3 shadow-sm mb-4">
          <View className="flex-row items-center">
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              placeholder="Search by club name or requester..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 ml-3 text-gray-700"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View className="bg-white rounded-xl p-2 shadow-sm mb-4">
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab("pending")}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === "pending" ? "bg-emerald-500" : "bg-transparent"
              }`}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="time" 
                  size={16} 
                  color={activeTab === "pending" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-2 font-medium text-sm ${
                  activeTab === "pending" ? "text-white" : "text-gray-600"
                }`}>
                  Pending ({pendingRequests.length})
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("processed")}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === "processed" ? "bg-emerald-500" : "bg-transparent"
              }`}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={activeTab === "processed" ? "white" : "#6B7280"} 
                />
                <Text className={`ml-2 font-medium text-sm ${
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="bg-white rounded-xl p-8 shadow-sm">
              <Text className="text-center text-gray-500">
                {loading 
                  ? "Loading club applications..." 
                  : error 
                  ? error 
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
                <TextInput
                  value={newClubName}
                  onChangeText={setNewClubName}
                  placeholder="Enter club name"
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-700"
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Vision (Optional)</Text>
                <TextInput
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
                <TextInput
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
                <TextInput
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
                  disabled={loading}
                >
                  <Text className="text-gray-700 text-center font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSendNewApplication}
                  className={`flex-1 bg-emerald-500 py-3 rounded-xl ${loading ? 'opacity-50' : ''}`}
                  disabled={loading}
                >
                  <Text className="text-white text-center font-medium">
                    {loading ? 'Sending...' : 'Send Application'}
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
