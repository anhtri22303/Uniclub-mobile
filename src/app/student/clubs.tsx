import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { AppTextInput } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { ClubService } from '@services/club.service';
import { postClubApplication } from '@services/clubApplication.service';
import { MajorService, type Major } from '@services/major.service';
import { MemberApplicationService } from '@services/memberApplication.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
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
import Toast from 'react-native-toast-message';

interface Club {
  id: number;
  name: string;
  description: string;
  majorName: string;
  majorId?: number; // ID của major từ API
  majorColor?: string; // Thêm màu cho major (giống web)
  members: number;
  majorPolicyName: string;
  status: 'member' | 'pending' | 'none';
}

export default function StudentClubsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // State for clubs
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'member' | 'pending' | 'none'>('all');

  // User's club IDs
  const [userClubIds, setUserClubIds] = useState<number[]>([]);

  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [applicationText, setApplicationText] = useState('');
  const [applying, setApplying] = useState(false);

  // Create club modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVision, setNewVision] = useState('');
  const [newProposerReason, setNewProposerReason] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [creating, setCreating] = useState(false);

  // Pending club IDs (local state for optimistic UI)
  const [pendingClubIds, setPendingClubIds] = useState<number[]>([]);

  // User's pending applications from API
  const [myApplications, setMyApplications] = useState<any[]>([]);
  
  // State cho modal xem mô tả đầy đủ (giống web)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [selectedClubName, setSelectedClubName] = useState('');

  // Auto-refresh data khi component mount (giống như F5)
  useEffect(() => {
    // Invalidate React Query cache để tự động fetch lại dữ liệu mới
    // (Tương tự như web version)
  }, []);

  // Get user's club IDs
  useEffect(() => {
    const clubIds = user?.clubIds || [];
    console.log('User club IDs:', clubIds);
    setUserClubIds(clubIds);
  }, [user]);

  // Load majors
  useEffect(() => {
    const loadMajors = async () => {
      try {
        const data = await MajorService.fetchMajors();
        setMajors(data.filter((m) => m.active));
      } catch (error) {
        console.error('Failed to load majors:', error);
      }
    };
    loadMajors();
  }, []);

  // Load user's applications first, then clubs
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load applications first
        const applications = await MemberApplicationService.getMyMemberApplications();
        console.log('✅ Loaded user applications:', applications);
        setMyApplications(applications);
        
        // Then load clubs with the applications data
        await loadClubs(applications);
      } catch (error) {
        console.error('Failed to load data:', error);
        setMyApplications([]);
      }
    };
    loadData();
  }, []);

  const loadClubs = async (applications?: any[]) => {
    setLoading(true);
    try {
      const response = await ClubService.fetchClubs(0, 100);
      console.log('Fetched clubs:', response);

      // Use provided applications or fall back to state
      const applicationsToUse = applications !== undefined ? applications : myApplications;

      // Load member counts for all clubs
      const clubsWithCounts = await Promise.all(
        response.map(async (club) => {
          const memberCount = await ClubService.getClubMemberCount(club.id);
          
          // Lấy tên major và màu từ danh sách majors (giống web)
          // Club từ API đã được transform, có thuộc tính 'category' thay vì 'majorName'
          let majorName = club.category || '';
          let majorColor = '#E2E8F0'; // Default color
          let majorId: number | undefined = undefined;
          
          if (majors.length > 0) {
            // Tìm major theo tên (vì API response không có majorId sau khi transform)
            const majorFromList = majors.find(m => m.name === club.category);
            if (majorFromList) {
              majorName = majorFromList.name;
              majorColor = majorFromList.colorHex || '#E2E8F0';
              majorId = majorFromList.id;
            }
          }
          
          return {
            id: club.id,
            name: club.name,
            description: club.description || '',
            majorName: majorName,
            majorId: majorId,
            majorColor: majorColor, // Thêm màu major
            members: memberCount.activeMemberCount,
            majorPolicyName: club.policy || '',
            status: getClubStatus(club.id, applicationsToUse) as 'member' | 'pending' | 'none',
          };
        })
      );

      // Filter out user's current clubs
      const filteredClubs = clubsWithCounts.filter(
        (club) => !userClubIds.includes(club.id)
      );

      setClubs(filteredClubs);
    } catch (error) {
      console.error('Error loading clubs:', error);
      Alert.alert('Error', 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const getClubStatus = (clubId: number, applications?: any[]): 'member' | 'pending' | 'none' => {
    // Check if club is in pending list (optimistic UI)
    if (pendingClubIds.includes(clubId)) {
      return 'pending';
    }

    // Check if user is already a member
    if (userClubIds.includes(clubId)) {
      return 'member';
    }

    // Use provided applications or fall back to state
    const applicationsToUse = applications !== undefined ? applications : myApplications;

    //   Check if user has a pending application from API
    const hasPendingApplication = applicationsToUse.some(
      (app: any) => app.clubId === clubId && app.status === 'PENDING'
    );
    if (hasPendingApplication) {
      console.log(`Found pending application for club ${clubId}`);
      return 'pending';
    }

    return 'none';
  };

  // Apply search and filter
  useEffect(() => {
    let filtered = [...clubs];

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (club) =>
          club.name.toLowerCase().includes(searchLower) ||
          club.description.toLowerCase().includes(searchLower) ||
          club.majorName.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((club) => club.status === activeFilter);
    }

    setFilteredClubs(filtered);
  }, [clubs, searchTerm, activeFilter, pendingClubIds, myApplications]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh applications first, then reload clubs with the fresh data
      const applications = await MemberApplicationService.getMyMemberApplications();
      console.log(' Refreshed user applications:', applications);
      setMyApplications(applications);
      
      // Reload clubs with the fresh applications data
      await loadClubs(applications);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle apply to club
  const handleApplyClick = (club: Club) => {
    setSelectedClub(club);
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!selectedClub || !applicationText.trim()) {
      Alert.alert('Missing Information', 'Please provide a reason for joining');
      return;
    }

    setApplying(true);
    try {
      // Use MemberApplicationService instead of MembershipsService
      const response = await MemberApplicationService.createMemberApplication({
        clubId: selectedClub.id,
        message: applicationText.trim(),
      });

      console.log('  Application submitted:', response);

      // Add to pending list for optimistic UI
      setPendingClubIds((prev) => [...prev, selectedClub.id]);

      Alert.alert(
        'Success',
        `Your application to ${response.clubName || selectedClub.name} has been submitted. Status: ${response.status}`
      );
      setShowApplyModal(false);
      setApplicationText('');
      setSelectedClub(null);

      // Refresh applications first, then reload clubs with the new data
      try {
        const applications = await MemberApplicationService.getMyMemberApplications();
        console.log(' Refreshed user applications after submission:', applications);
        setMyApplications(applications);
        
        // Reload clubs with the fresh applications data
        await loadClubs(applications);
      } catch (error) {
        console.error('Failed to refresh data:', error);
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      
      // Lấy thông báo lỗi từ API
      let apiMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to submit application';
      
      // Kiểm tra nếu là lỗi giới hạn số lượng club (giống web)
      if (typeof apiMessage === 'string' && apiMessage.toLowerCase().includes('maximum number of clubs')) {
        // Trích xuất số lượng từ thông báo (ví dụ: "...maximum number of clubs (2)")
        const match = apiMessage.match(/\((\d+)\)/);
        const maxLimit = match ? match[1] : 'Policy';
        
        // Kiểm tra xem giới hạn có phải là 1 không
        const isSingleClubLimit = maxLimit === '1';
        
        // Tạo thông báo tùy biến
        const customMessage = isSingleClubLimit
          ? `According to the major policy, you can only join 1 club.\n\nYou are already a member of a club. You must leave it before joining a new one.`
          : `According to the major policy, you can join up to ${maxLimit} clubs.\n\nYou have now reached this limit.`;
        
        Alert.alert('Participation Limit Reached', customMessage);
      } else {
        // Hiển thị lỗi thông thường
        Alert.alert('Error', apiMessage);
      }
    } finally {
      setApplying(false);
    }
  };

  // Handle create club application
  const submitCreateClubApplication = async () => {
    if (!newClubName.trim() || !newDescription.trim() || !newVision.trim() || !selectedMajorId || !newProposerReason.trim() || !otpCode.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'OTP code must be 6 digits');
      return;
    }

    setCreating(true);
    try {
      // TODO: Verify OTP code with backend before submitting application
      // For now, we'll just validate the format
      
      await postClubApplication({
        clubName: newClubName.trim(),
        description: newDescription.trim(),
        vision: newVision.trim(),
        majorId: selectedMajorId,
        proposerReason: newProposerReason.trim(),
      }, otpCode.trim()); // Pass OTP as second parameter

      Alert.alert('Success', `Your club application for "${newClubName}" has been submitted`);
      setShowCreateModal(false);
      setNewClubName('');
      setNewDescription('');
      setNewVision('');
      setNewProposerReason('');
      setOtpCode('');
      setSelectedMajorId(null);
    } catch (error: any) {
      console.error('Error creating club application:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to create club application';
      Alert.alert('Error', message);
    } finally {
      setCreating(false);
    }
  };

  // Get color for major - Ưu tiên sử dụng majorColor từ club (nếu có)
  const getCategoryColor = (majorName: string, majorColor?: string) => {
    // Ưu tiên sử dụng màu từ API (nếu có)
    if (majorColor) return majorColor;
    
    // Fallback colors (hardcode) - Dùng khi API không trả về màu
    // Sử dụng màu đậm hơn để text trắng đọc được tốt
    const categoryColors: Record<string, string> = {
      'Software Engineering': '#0052CC',
      'Artificial Intelligence': '#7C3AED', // Purple đậm hơn
      'Information Assurance': '#1E40AF', // Blue đậm
      'Data Science': '#0891B2', // Cyan đậm
      'Business Administration': '#7C2D12', // Brown đậm
      'Digital Marketing': '#DC2626', // Red đậm
      'Graphic Design': '#EA580C', // Orange đậm
      'Multimedia Communication': '#C2410C', // Deep orange
      'Hospitality Management': '#92400E', // Amber đậm
      'International Business': '#047857', // Emerald đậm
      'Finance and Banking': '#065F46', // Green đậm
      'Japanese Language': '#BE123C', // Rose đậm
      'Korean Language': '#0369A1', // Sky đậm
    };
    
    return categoryColors[majorName] || '#0D9488'; // Teal đậm làm default
  };

  // Hàm tính độ sáng của màu (luminance) để quyết định text màu trắng hay đen
  const getTextColorForBackground = (hexColor: string): string => {
    // Chuyển hex sang RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Tính luminance (độ sáng)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Nếu màu sáng (> 0.5) thì dùng text đen, ngược lại dùng text trắng
    return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-5 pt-2 pb-4">
          {/* Modern Header with Gradient-like Effect */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-md" style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <View className="bg-teal-100 p-3 rounded-2xl mr-3">
                    <Ionicons name="people" size={28} color="#14B8A6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900">Club Directory</Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      Discover and join clubs
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Feature Not Available',
                    text2: 'Please use this feature on the web',
                    position: 'top',
                    visibilityTime: 3000,
                  });
                }}
                className="bg-teal-500 px-5 py-3 rounded-2xl shadow-lg"
                style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
              >
                <Ionicons name="add-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* Stats Bar */}
            <View className="flex-row items-center justify-between bg-teal-50 rounded-2xl p-4 mt-2">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-teal-600">{clubs.length}</Text>
                <Text className="text-xs text-gray-600 mt-1">Total Clubs</Text>
              </View>
              <View className="w-px h-10 bg-teal-200" />
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-teal-600">{filteredClubs.filter(c => c.status === 'none').length}</Text>
                <Text className="text-xs text-gray-600 mt-1">Available</Text>
              </View>
              <View className="w-px h-10 bg-teal-200" />
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-yellow-600">{filteredClubs.filter(c => c.status === 'pending').length}</Text>
                <Text className="text-xs text-gray-600 mt-1">Pending</Text>
              </View>
            </View>
          </View>

          {/* Enhanced Search Bar */}
          <View className="bg-white rounded-2xl px-5 py-4 mb-4 shadow-md flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }}>
            <View className="bg-teal-50 p-2 rounded-xl mr-3">
              <Ionicons name="search" size={22} color="#14B8A6" />
            </View>
            <AppTextInput
              placeholder="Search clubs by name, category..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 text-gray-900 text-base"
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm !== '' && (
              <TouchableOpacity onPress={() => setSearchTerm('')} className="bg-gray-100 p-2 rounded-xl ml-2">
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Modern Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-3 px-1">
              <TouchableOpacity
                onPress={() => setActiveFilter('all')}
                className={`px-6 py-3 rounded-2xl flex-row items-center shadow-sm ${
                  activeFilter === 'all' ? 'bg-teal-500' : 'bg-white'
                }`}
                style={activeFilter === 'all' ? { shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 } : {}}
              >
                <Ionicons name="apps" size={18} color={activeFilter === 'all' ? 'white' : '#6B7280'} />
                <Text
                  className={`font-bold text-sm ml-2 ${
                    activeFilter === 'all' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  All Clubs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('none')}
                className={`px-6 py-3 rounded-2xl flex-row items-center shadow-sm ${
                  activeFilter === 'none' ? 'bg-teal-500' : 'bg-white'
                }`}
                style={activeFilter === 'none' ? { shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 } : {}}
              >
                <Ionicons name="checkmark-circle" size={18} color={activeFilter === 'none' ? 'white' : '#6B7280'} />
                <Text
                  className={`font-bold text-sm ml-2 ${
                    activeFilter === 'none' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Available
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveFilter('pending')}
                className={`px-6 py-3 rounded-2xl flex-row items-center shadow-sm ${
                  activeFilter === 'pending' ? 'bg-yellow-500' : 'bg-white'
                }`}
                style={activeFilter === 'pending' ? { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 } : {}}
              >
                <Ionicons name="time" size={18} color={activeFilter === 'pending' ? 'white' : '#6B7280'} />
                <Text
                  className={`font-bold text-sm ml-2 ${
                    activeFilter === 'pending' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Pending
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Clubs List */}
          {loading ? (
            <View className="bg-white rounded-3xl p-12 shadow-lg items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-6 rounded-full mb-4">
                <ActivityIndicator size="large" color="#14B8A6" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg">Loading clubs...</Text>
              <Text className="text-gray-500 text-sm mt-2">Please wait a moment</Text>
            </View>
          ) : filteredClubs.length === 0 ? (
            <View className="bg-white rounded-3xl p-10 shadow-lg items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
              <View className="bg-teal-50 p-8 rounded-full mb-6">
                <Ionicons name="search" size={56} color="#14B8A6" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-3">No Clubs Found</Text>
              <Text className="text-gray-600 text-center mb-6 text-base leading-6">
                {searchTerm || activeFilter !== 'all'
                  ? 'No clubs match your search criteria.\nTry adjusting your filters.'
                  : 'No clubs available at the moment.\nCheck back soon!'}
              </Text>
              {(searchTerm || activeFilter !== 'all') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchTerm('');
                    setActiveFilter('all');
                  }}
                  className="bg-teal-500 px-8 py-4 rounded-2xl shadow-lg"
                  style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="refresh" size={20} color="white" />
                    <Text className="text-white font-bold ml-2 text-base">Clear Filters</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="space-y-4">
              {filteredClubs.map((club, index) => {
                const statusConfig =
                  club.status === 'member'
                    ? { bg: 'bg-blue-500', text: 'Member', icon: 'checkmark-circle' }
                    : club.status === 'pending'
                    ? { bg: 'bg-yellow-500', text: 'Pending', icon: 'time' }
                    : { bg: 'bg-teal-500', text: 'Available', icon: 'checkmark-done-circle' };

                return (
                  <View 
                    key={club.id} 
                    className="bg-white rounded-3xl overflow-hidden shadow-lg" 
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}
                  >
                    {/* Colorful Top Bar */}
                    <View className="h-2" style={{ backgroundColor: getCategoryColor(club.majorName, club.majorColor) }} />
                    
                    <View className="p-5">
                      {/* Club Header with Icon */}
                      <View className="flex-row items-start mb-4">
                        <View className="mr-4">
                          <View 
                            className="w-16 h-16 rounded-2xl items-center justify-center shadow-md"
                            style={{ backgroundColor: getCategoryColor(club.majorName, club.majorColor) + '20' }}
                          >
                            <Ionicons name="ribbon" size={32} color={getCategoryColor(club.majorName, club.majorColor)} />
                          </View>
                        </View>
                        
                        <View className="flex-1">
                          <View className="flex-row items-start justify-between mb-2">
                            <Text className="text-xl font-bold text-gray-900 flex-1 pr-2" numberOfLines={2}>
                              {club.name}
                            </Text>
                            <View className={`${statusConfig.bg} px-3 py-1.5 rounded-xl flex-row items-center`}>
                              <Ionicons name={statusConfig.icon as any} size={14} color="white" />
                              <Text className="text-white text-xs font-bold ml-1">
                                {statusConfig.text}
                              </Text>
                            </View>
                          </View>
                          
                          <View
                            className="self-start px-3 py-1.5 rounded-xl"
                            style={{ backgroundColor: getCategoryColor(club.majorName, club.majorColor) }}
                          >
                            <Text 
                              className="text-xs font-bold"
                              style={{ color: getTextColorForBackground(getCategoryColor(club.majorName, club.majorColor)) }}
                            >
                              {club.majorName || '-'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Description with View Full button */}
                      {club.description && (
                        <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                          <Text className="text-sm text-gray-700 leading-5" numberOfLines={3}>
                            {club.description}
                          </Text>
                          {club.description.length > 100 && (
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedClubName(club.name);
                                setSelectedDescription(club.description || '');
                                setShowDescriptionModal(true);
                              }}
                              className="mt-2 flex-row items-center"
                            >
                              <Ionicons name="eye" size={16} color="#14B8A6" />
                              <Text className="text-teal-600 text-sm font-semibold ml-1">View Full Description</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* Enhanced Stats */}
                      <View className="flex-row items-center mb-4">
                        <View className="bg-teal-50 rounded-2xl p-3 flex-row items-center">
                          <View className="bg-teal-100 p-2 rounded-xl mr-2">
                            <Ionicons name="people" size={18} color="#14B8A6" />
                          </View>
                          <View>
                            <Text className="text-lg font-bold text-teal-600">{club.members}</Text>
                            <Text className="text-xs text-gray-600">Members</Text>
                          </View>
                        </View>
                      </View>

                      {/* Apply Button */}
                      {club.status === 'none' && (
                        <TouchableOpacity
                          onPress={() => handleApplyClick(club)}
                          className="bg-teal-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg"
                          style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                        >
                          <Ionicons name="add-circle" size={22} color="white" />
                          <Text className="text-white font-bold ml-2 text-base">Apply to Join</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Apply Modal */}
      <Modal
        visible={showApplyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Apply to {selectedClub?.name}</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-3">
              Tell us why you want to join this club
            </Text>

            <AppTextInput
              placeholder="Share your interests and what you hope to gain from joining..."
              value={applicationText}
              onChangeText={setApplicationText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="bg-gray-50 rounded-xl p-4 text-gray-900 mb-4"
              placeholderTextColor="#9CA3AF"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowApplyModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-xl"
                disabled={applying}
              >
                <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitApplication}
                className="flex-1 bg-teal-500 py-3 rounded-xl"
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Club Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-3xl w-11/12 max-h-5/6">
            <ScrollView showsVerticalScrollIndicator={true}>
              <View className="p-6">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-gray-900">Create Club Application</Text>
                    <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  <View className="space-y-4">
                    {/* Club Name */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Club Name</Text>
                      <AppTextInput
                        placeholder="Enter club name"
                        value={newClubName}
                        onChangeText={setNewClubName}
                        className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    {/* Description */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Description (0/300)</Text>
                      <AppTextInput
                        placeholder="Enter description"
                        value={newDescription}
                        onChangeText={(text) => {
                          if (text.length <= 300) setNewDescription(text);
                        }}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                        placeholderTextColor="#9CA3AF"
                        maxLength={300}
                      />
                      <Text className="text-xs text-gray-500 mt-1 text-right">
                        {newDescription.length}/300
                      </Text>
                    </View>

                    {/* Vision */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Vision (0/300)</Text>
                      <AppTextInput
                        placeholder="Enter the club's vision"
                        value={newVision}
                        onChangeText={(text) => {
                          if (text.length <= 300) setNewVision(text);
                        }}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                        placeholderTextColor="#9CA3AF"
                        maxLength={300}
                      />
                      <Text className="text-xs text-gray-500 mt-1 text-right">
                        {newVision.length}/300
                      </Text>
                    </View>

                    {/* Major Selection with colors */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Major</Text>
                      <ScrollView className="bg-gray-50 rounded-xl p-3 max-h-40" nestedScrollEnabled>
                        {majors.map((major) => (
                          <TouchableOpacity
                            key={major.id}
                            onPress={() => setSelectedMajorId(major.id)}
                            className="flex-row items-center justify-between p-3 rounded-lg mb-2 bg-white shadow-sm"
                            style={{
                              borderWidth: selectedMajorId === major.id ? 2 : 0,
                              borderColor: selectedMajorId === major.id ? (major.colorHex || '#14B8A6') : 'transparent',
                            }}
                          >
                            <View className="flex-row items-center flex-1">
                              {/* Color indicator */}
                              <View
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: major.colorHex || '#E2E8F0' }}
                              />
                              <Text
                                className={`font-medium flex-1 ${
                                  selectedMajorId === major.id ? 'text-gray-900' : 'text-gray-700'
                                }`}
                              >
                                {major.name}
                              </Text>
                            </View>
                            {selectedMajorId === major.id && (
                              <Ionicons name="checkmark-circle" size={20} color={major.colorHex || '#14B8A6'} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Proposer Reason */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 mb-2">
                        Why do you want to create this club?
                      </Text>
                      <AppTextInput
                        placeholder="Share your motivation and vision for this club"
                        value={newProposerReason}
                        onChangeText={(text) => {
                          if (text.length <= 300) setNewProposerReason(text);
                        }}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                        placeholderTextColor="#9CA3AF"
                        maxLength={300}
                      />
                      <Text className="text-xs text-gray-500 mt-1 text-right">
                        {newProposerReason.length}/300
                      </Text>
                    </View>

                    {/* OTP Code */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-700 mb-2">OTP Code (6 digits)</Text>
                      <AppTextInput
                        placeholder="Enter 6-digit OTP"
                        value={otpCode}
                        onChangeText={(text) => {
                          // Only allow numbers and max 6 digits
                          const numericText = text.replace(/[^0-9]/g, '');
                          if (numericText.length <= 6) setOtpCode(numericText);
                        }}
                        keyboardType="numeric"
                        maxLength={6}
                        className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    {/* Buttons */}
                    <View className="flex-row gap-3 mt-4">
                      <TouchableOpacity
                        onPress={() => setShowCreateModal(false)}
                        className="flex-1 bg-gray-100 py-3 rounded-xl"
                        disabled={creating}
                      >
                        <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={submitCreateClubApplication}
                        className="flex-1 bg-teal-500 py-3 rounded-xl"
                        disabled={creating}
                      >
                        {creating ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text className="text-white font-semibold text-center">Send</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
      </Modal>

      {/* Modal xem mô tả đầy đủ (giống web) */}
      <Modal
        visible={showDescriptionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <View className="bg-teal-600 px-6 py-5 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-white text-lg font-bold" numberOfLines={2}>
                  {selectedClubName}
                </Text>
                <Text className="text-teal-100 text-sm mt-1">Full Description</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDescriptionModal(false)}
                className="bg-teal-700 p-2 rounded-full"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Description Content */}
            <ScrollView 
              className="max-h-96 px-6 py-5"
              showsVerticalScrollIndicator={true}
            >
              <Text className="text-gray-800 text-base leading-6">
                {selectedDescription || 'No description provided.'}
              </Text>
            </ScrollView>

            {/* Footer */}
            <View className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => setShowDescriptionModal(false)}
                className="bg-teal-500 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-center">Close</Text>
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
