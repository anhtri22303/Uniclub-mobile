/**
 * ✅ EXAMPLE: Admin Users Page with React Query
 * This is a REFERENCE implementation showing React Query patterns.
 * Use this as a guide to update your actual admin/users.tsx
 */

import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/auth.store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// ✅ Import React Query hooks
import { useDeleteUser, useUpdateUser, useUsers } from '@hooks/useQueryHooks';
import { UserProfile } from '@services/user.service';

export default function AdminUsersPageExample() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // ✅ Step 1: Use React Query for data fetching
  // Replaces: useState + useEffect + manual fetchUsers
  const { 
    data: usersData = [],   // Auto-populated from cache or API
    isLoading,               // Loading state
    refetch,                 // Manual refetch function
    isRefetching             // Refetching state for pull-to-refresh
  } = useUsers();
  
  // ✅ Step 2: Use mutations for write operations
  // Auto-invalidates cache after success
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Filter states (UI only)
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // ✅ Step 3: Use useMemo for expensive filtering/sorting
  // Only recalculates when dependencies change
  const filteredUsers = useMemo(() => {
    let filtered = [...usersData];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role?.roleName === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    // Sort by name
    filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));

    return filtered;
  }, [usersData, searchQuery, roleFilter, statusFilter]);

  // ✅ Step 4: Handle mutations with React Query
  const handleUpdateUser = async (userId: number, data: any) => {
    try {
      // mutateAsync returns promise
      await updateUserMutation.mutateAsync({ userId, data });
      
      Toast.show({
        type: 'success',
        text1: 'User updated successfully',
      });
      
      setIsEditModalOpen(false);
      // ✅ No need to manually refetch - mutation auto-invalidates cache
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserMutation.mutateAsync(userId);
              
              Toast.show({
                type: 'success',
                text1: 'User deleted successfully',
              });
              // ✅ Auto-refetch triggered by mutation
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: error.response?.data?.message,
              });
            }
          },
        },
      ]
    );
  };

  // Statistics using filtered data
  const totalUsers = filteredUsers.length;
  const activeStudents = filteredUsers.filter(u => 
    u.role?.roleName === 'STUDENT' && u.status === 'ACTIVE'
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header with Stats */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Users</Text>

        {/* Stats Cards */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-blue-50 rounded-xl p-3">
            <Text className="text-xs text-blue-600 font-medium">Total</Text>
            <Text className="text-xl font-bold text-blue-900">{totalUsers}</Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-xl p-3">
            <Text className="text-xs text-green-600 font-medium">Students</Text>
            <Text className="text-xl font-bold text-green-900">{activeStudents}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Users List with Loading States */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-600 mt-4">Loading users...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="people-outline" size={48} color="#6B7280" />
          <Text className="text-xl font-bold text-gray-800">No Users Found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 mb-3 mx-4"
              onPress={() => {
                setEditingUser(item);
                setIsEditModalOpen(true);
              }}
            >
              <View className="flex-row items-center">
                <View className="bg-teal-100 w-12 h-12 rounded-full items-center justify-center mr-3">
                  <Ionicons name="person" size={24} color="#0D9488" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-800">{item.fullName}</Text>
                  <Text className="text-sm text-gray-600">{item.email}</Text>
                  <Text className="text-xs text-gray-500">{item.role?.roleName}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteUser(item.userId)}
                  className="bg-red-50 p-2 rounded-lg"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.userId.toString()}
          contentContainerStyle={{ paddingVertical: 16 }}
          // ✅ Pull-to-refresh with React Query
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}

      {/* Edit Modal (simplified) */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Edit User</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {editingUser && (
              <View>
                <Text className="text-gray-600 mb-4">
                  Editing: {editingUser.fullName}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    // Example update
                    handleUpdateUser(editingUser.userId, {
                      fullName: editingUser.fullName,
                      email: editingUser.email,
                    });
                  }}
                  className="bg-teal-500 py-3 rounded-xl"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-center">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
