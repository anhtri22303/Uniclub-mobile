import NavigationBar from '@components/navigation/NavigationBar';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile, UserService } from '@services/user.service';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminUsersPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login' as any);
        },
      },
    ]);
  };

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const data = await UserService.fetchUsers();

      // Sort by role, then major, then name
      const sorted = data.sort((a, b) => {
        const roleA = a.role.roleName.toUpperCase();
        const roleB = b.role.roleName.toUpperCase();
        if (roleA < roleB) return -1;
        if (roleA > roleB) return 1;

        const majorA = (a.majorName || '').toUpperCase();
        const majorB = (b.majorName || '').toUpperCase();
        if (majorA < majorB) return -1;
        if (majorA > majorB) return 1;

        return a.fullName.localeCompare(b.fullName);
      });

      setUsers(sorted);
      setFilteredUsers(sorted);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.role.roleName.toLowerCase().includes(query) ||
          (u.studentCode || '').toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role.roleName.toUpperCase() === roleFilter);
    }

    // Major filter
    if (majorFilter !== 'all') {
      filtered = filtered.filter((u) => u.majorName === majorFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, users, statusFilter, roleFilter, majorFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setMajorFilter('all');
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case 'ADMIN':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
      case 'UNIVERSITY_STAFF':
      case 'UNI_STAFF':
        return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' };
      case 'CLUB_LEADER':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
      case 'MEMBER':
      case 'STUDENT':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
      case 'STAFF':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  const handleEditUser = async (userItem: UserProfile) => {
    try {
      const details = await UserService.fetchUserById(userItem.userId);
      setEditingUser(details);
      setEditFullName(details.fullName);
      setEditEmail(details.email);
      setEditPhone(details.phone || '');
      setIsEditModalOpen(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const payload = {
        fullName: editFullName,
        email: editEmail,
        phone: editPhone || null,
      };

      await UserService.updateUserById(editingUser.userId, payload);
      Alert.alert('Success', 'User updated successfully');
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userItem: UserProfile) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userItem.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserService.deleteUserById(userItem.userId);
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  // Get unique roles and majors for filters
  const uniqueRoles = Array.from(new Set(users.map((u) => u.role.roleName.toUpperCase()))).sort();
  const uniqueMajors = Array.from(new Set(users.map((u) => u.majorName).filter(Boolean))).sort();

  // Statistics
  const totalUsers = filteredUsers.length;
  const activeStudents = filteredUsers.filter((u) => u.role.roleName.toUpperCase() === 'STUDENT' || u.role.roleName.toUpperCase() === 'MEMBER').length;
  const clubLeaders = filteredUsers.filter((u) => u.role.roleName.toUpperCase() === 'CLUB_LEADER').length;

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || roleFilter !== 'all' || majorFilter !== 'all';
  const filterCount = [searchQuery.trim() !== '', statusFilter !== 'all', roleFilter !== 'all', majorFilter !== 'all'].filter(Boolean).length;

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const roleColors = getRoleBadgeColor(item.role.roleName);
    
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
        onPress={() => {
          Alert.alert(
            item.fullName,
            `Email: ${item.email}\nRole: ${item.role.roleName}\nStatus: ${item.status}${
              item.phone ? `\nPhone: ${item.phone}` : ''
            }${item.studentCode ? `\nStudent Code: ${item.studentCode}` : ''}${
              item.majorName ? `\nMajor: ${item.majorName}` : ''
            }`,
            [
              { text: 'Close', style: 'cancel' },
              { text: 'Edit', onPress: () => handleEditUser(item) },
            ]
          );
        }}
      >
        <View className="flex-row items-start">
          {/* Avatar */}
          <View className="bg-teal-100 w-12 h-12 rounded-full items-center justify-center mr-3">
            {item.avatarUrl ? (
              <Text className="text-lg font-bold text-teal-700">
                {item.fullName.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={24} color="#0D9488" />
            )}
          </View>

          {/* User Info */}
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800">{item.fullName}</Text>
            <Text className="text-sm text-gray-600 mb-1">{item.email}</Text>
            
            {/* Badges Row */}
            <View className="flex-row items-center flex-wrap gap-2 mb-2">
              <View className={`px-2 py-1 rounded-full border ${roleColors.bg} ${roleColors.border}`}>
                <Text className={`text-xs font-medium ${roleColors.text}`}>
                  {item.role.roleName}
                </Text>
              </View>
              
              {item.status === 'ACTIVE' && (
                <View className="px-2 py-1 rounded-full border bg-green-100 border-green-300">
                  <Text className="text-xs font-medium text-green-700">ACTIVE</Text>
                </View>
              )}
            </View>

            {/* Additional Info */}
            {(item.studentCode || item.majorName) && (
              <View className="flex-row items-center gap-2 flex-wrap">
                {item.studentCode && (
                  <Text className="text-xs text-gray-500">📚 {item.studentCode}</Text>
                )}
                {item.majorName && (
                  <Text className="text-xs text-gray-500">🎓 {item.majorName}</Text>
                )}
              </View>
            )}
          </View>

          {/* Actions */}
          <View className="flex-row gap-1">
            <TouchableOpacity
              onPress={() => handleEditUser(item)}
              className="bg-blue-50 p-2 rounded-lg"
            >
              <Ionicons name="create-outline" size={18} color="#3B82F6" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleDeleteUser(item)}
              className="bg-red-50 p-2 rounded-lg"
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-800">Users</Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center bg-red-500 px-3 py-2 rounded-xl"
          >
            <Ionicons name="log-out" size={18} color="white" />
            <Text className="text-white font-medium ml-1 text-sm">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-blue-600 font-medium">Total</Text>
                <Text className="text-xl font-bold text-blue-900">{totalUsers}</Text>
              </View>
              <View className="bg-blue-500 p-2 rounded-lg">
                <Ionicons name="people" size={20} color="white" />
              </View>
            </View>
          </View>

          <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-green-600 font-medium">Students</Text>
                <Text className="text-xl font-bold text-green-900">{activeStudents}</Text>
              </View>
              <View className="bg-green-500 p-2 rounded-lg">
                <Ionicons name="school" size={20} color="white" />
              </View>
            </View>
          </View>

          <View className="flex-1 bg-purple-50 rounded-xl p-3 border border-purple-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-purple-600 font-medium">Leaders</Text>
                <Text className="text-xl font-bold text-purple-900">{clubLeaders}</Text>
              </View>
              <View className="bg-purple-500 p-2 rounded-lg">
                <Ionicons name="shield-checkmark" size={20} color="white" />
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center mb-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Toggle */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center bg-gray-100 px-4 py-2 rounded-xl"
          >
            <Ionicons name="filter" size={18} color="#0D9488" />
            <Text className="text-teal-600 font-medium ml-2">Filters</Text>
            {filterCount > 0 && (
              <View className="bg-teal-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {hasActiveFilters && (
            <TouchableOpacity
              onPress={clearFilters}
              className="flex-row items-center bg-red-50 px-4 py-2 rounded-xl"
            >
              <Ionicons name="close" size={18} color="#EF4444" />
              <Text className="text-red-600 font-medium ml-1">Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Filter Options</Text>
            
            {/* Status Filter */}
            <View className="mb-3">
              <Text className="text-xs text-gray-600 mb-2">Status</Text>
              <View className="flex-row gap-2">
                {['all', 'ACTIVE', 'INACTIVE'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setStatusFilter(status)}
                    className={`px-3 py-2 rounded-lg border ${
                      statusFilter === status
                        ? 'bg-teal-500 border-teal-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        statusFilter === status ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {status === 'all' ? 'All' : status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Role Filter */}
            <View className="mb-3">
              <Text className="text-xs text-gray-600 mb-2">Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setRoleFilter('all')}
                    className={`px-3 py-2 rounded-lg border ${
                      roleFilter === 'all'
                        ? 'bg-teal-500 border-teal-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        roleFilter === 'all' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {uniqueRoles.map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setRoleFilter(role)}
                      className={`px-3 py-2 rounded-lg border ${
                        roleFilter === role
                          ? 'bg-teal-500 border-teal-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          roleFilter === role ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Major Filter */}
            {uniqueMajors.length > 0 && (
              <View>
                <Text className="text-xs text-gray-600 mb-2">Major</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setMajorFilter('all')}
                      className={`px-3 py-2 rounded-lg border ${
                        majorFilter === 'all'
                          ? 'bg-teal-500 border-teal-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          majorFilter === 'all' ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {uniqueMajors.map((major) => (
                      <TouchableOpacity
                        key={major}
                        onPress={() => setMajorFilter(major as string)}
                        className={`px-3 py-2 rounded-lg border ${
                          majorFilter === major
                            ? 'bg-teal-500 border-teal-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            majorFilter === major ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {major}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Users List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-600 mt-4">Loading users...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-gray-100 p-6 rounded-full mb-4">
            <Ionicons name="people-outline" size={48} color="#6B7280" />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">No Users Found</Text>
          <Text className="text-gray-600 text-center">
            {hasActiveFilters ? 'Try adjusting your filters' : 'No users available'}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={clearFilters}
              className="mt-4 bg-teal-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-medium">Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.userId.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#0D9488']}
              tintColor="#0D9488"
            />
          }
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Edit User</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                {/* Full Name */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={editFullName}
                    onChangeText={setEditFullName}
                    placeholder="Enter full name"
                  />
                </View>

                {/* Email */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Phone */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Phone</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Buttons */}
                <View className="flex-row gap-3 mt-6">
                  <TouchableOpacity
                    onPress={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-200 py-3 rounded-xl"
                  >
                    <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    className="flex-1 bg-teal-500 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold text-center">Save</Text>
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
