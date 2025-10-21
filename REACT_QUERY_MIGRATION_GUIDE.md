# React Query Migration Guide for Mobile App

## 📋 Overview
Tài liệu này hướng dẫn áp dụng @tanstack/react-query vào mobile app để tối ưu hóa data fetching như web version.

## 🎯 Why React Query?

### **Benefits:**
1. ✅ **Auto-caching**: Tự động cache data, giảm số lần call API
2. ✅ **Stale-while-revalidate**: Hiển thị data cũ ngay lập tức, fetch data mới ở background
3. ✅ **Auto-refetch**: Tự động refetch khi cần (network reconnect, window focus)
4. ✅ **Centralized state**: Quản lý state tập trung, không cần useState rườm rà
5. ✅ **Built-in loading states**: isLoading, isError, isRefetching sẵn có
6. ✅ **Optimistic updates**: Cập nhật UI trước, gọi API sau
7. ✅ **Parallel queries**: Dễ dàng gọi nhiều API song song

## 📦 Installation

```bash
npm install @tanstack/react-query
```

## 🏗️ Architecture Setup

### 1. **Create QueryProvider** (`src/contexts/QueryProvider.tsx`)

```tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes  
      retry: 1,
      refetchOnWindowFocus: false, // Mobile optimization
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { queryClient };
```

### 2. **Wrap App with QueryProvider** (`src/app/_layout.tsx`)

```tsx
import { QueryProvider } from '@contexts/QueryProvider';

export default function RootLayout() {
  return (
    <QueryProvider>
      {/* Existing providers (auth, toast, etc.) */}
      <Stack>
        {/* routes */}
      </Stack>
    </QueryProvider>
  );
}
```

### 3. **Create Centralized Query Hooks** (`src/hooks/useQueryHooks.ts`)

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@services/user.service';

// Define query keys
export const queryKeys = {
  users: ['users'] as const,
  usersList: () => [...queryKeys.users, 'list'] as const,
  userDetail: (id: number | string) => [...queryKeys.users, 'detail', id] as const,
};

// Hook to fetch all users
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.usersList(),
    queryFn: async () => {
      const response = await UserService.fetchUsers();
      return response;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to fetch single user
export function useUser(userId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userDetail(userId),
    queryFn: async () => {
      return await UserService.fetchUserById(userId);
    },
    enabled: !!userId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation hook to update user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: number | string; data: any }) => {
      return await UserService.updateUserById(userId, data);
    },
    onSuccess: (_data: any, variables: any) => {
      // Invalidate cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.usersList() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(variables.userId) });
    },
  });
}

// Mutation hook to delete user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number | string) => {
      return await UserService.deleteUserById(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usersList() });
    },
  });
}
```

## 🔄 Migration Pattern: Before & After

### ❌ **OLD WAY** (Without React Query)

```tsx
export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch users manually
  const fetchUsers = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const data = await UserService.fetchUsers();
      setUsers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers(true);
  };

  const handleUpdate = async (userId: number, data: any) => {
    try {
      await UserService.updateUserById(userId, data);
      Toast.show({ type: 'success', text1: 'Updated' });
      fetchUsers(); // Manual refetch
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed' });
    }
  };

  // ...render logic
}
```

### ✅ **NEW WAY** (With React Query)

```tsx
export default function AdminUsersPage() {
  // ✅ Single hook replaces all state management
  const { 
    data: users = [], 
    isLoading, 
    refetch, 
    isRefetching 
  } = useUsers();

  // ✅ Mutations auto-invalidate cache
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // ✅ No manual fetchUsers needed - React Query handles it

  const handleRefresh = () => {
    refetch(); // Simple!
  };

  const handleUpdate = async (userId: number, data: any) => {
    try {
      await updateUserMutation.mutateAsync({ userId, data });
      Toast.show({ type: 'success', text1: 'Updated' });
      // ✅ No manual refetch - mutation auto-invalidates cache
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed' });
    }
  };

  // ...render logic with users data
}
```

## 📊 Performance Optimization with useMemo

### **Filter và Sort với useMemo**

```tsx
// ✅ useMemo prevents unnecessary recalculations
const filteredUsers = useMemo(() => {
  let filtered = [...users]; // users from useUsers()

  // Sort
  filtered.sort((a, b) => {
    const roleA = a.role?.roleName?.toUpperCase() || '';
    const roleB = b.role?.roleName?.toUpperCase() || '';
    if (roleA !== roleB) return roleA.localeCompare(roleB);
    return a.fullName.localeCompare(b.fullName);
  });

  // Filter by search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(u =>
      u.fullName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }

  // Filter by role
  if (roleFilter !== 'all') {
    filtered = filtered.filter(u => u.role?.roleName === roleFilter);
  }

  return filtered;
}, [users, searchQuery, roleFilter]); // ✅ Only recalculate when dependencies change
```

## 🎨 UI Pattern: Loading & Error States

```tsx
{isLoading ? (
  <View className="flex-1 justify-center items-center">
    <ActivityIndicator size="large" color="#0D9488" />
    <Text className="text-gray-600 mt-4">Loading users...</Text>
  </View>
) : filteredUsers.length === 0 ? (
  <View className="flex-1 justify-center items-center px-6">
    <Ionicons name="people-outline" size={48} color="#6B7280" />
    <Text className="text-xl font-bold text-gray-800">No Users Found</Text>
  </View>
) : (
  <FlatList
    data={filteredUsers}
    renderItem={renderUserItem}
    keyExtractor={(item) => item.userId.toString()}
    onRefresh={refetch} // ✅ Simple refetch
    refreshing={isRefetching}
  />
)}
```

## 🔄 Refetch Strategies

### **1. Manual Refetch**
```tsx
const { refetch } = useUsers();

<TouchableOpacity onPress={() => refetch()}>
  <Text>Refresh</Text>
</TouchableOpacity>
```

### **2. Auto Refetch on Mutation**
```tsx
// ✅ Defined in mutation hook - auto happens
const updateUserMutation = useUpdateUser();

// When you call:
await updateUserMutation.mutateAsync({ userId, data });
// → Automatically invalidates users cache
// → Triggers background refetch
// → UI updates automatically
```

### **3. Pull-to-Refresh**
```tsx
<FlatList
  data={users}
  onRefresh={refetch}
  refreshing={isRefetching}
/>
```

## 🔥 Advanced Patterns

### **1. Parallel Queries**
```tsx
// Fetch multiple resources simultaneously
function AdminDashboard() {
  const { data: users } = useUsers();
  const { data: clubs } = useClubs();
  const { data: events } = useEvents();
  
  // All queries run in parallel, cache independently
}
```

### **2. Dependent Queries**
```tsx
// Fetch user first, then their details
const { data: user } = useUser(userId);
const { data: userDetails } = useUserDetails(user?.id, !!user); // enabled when user exists
```

### **3. Prefetching**
```tsx
export function usePrefetchUsers() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.usersList(),
      queryFn: async () => await UserService.fetchUsers(),
    });
  };
}

// Usage: Prefetch on hover/navigation
<TouchableOpacity onPressIn={prefetchUsers()}>
  <Text>Users Page</Text>
</TouchableOpacity>
```

## 📝 Migration Checklist for admin/users.tsx

- [ ] 1. Install @tanstack/react-query
- [ ] 2. Create QueryProvider và wrap app
- [ ] 3. Create useQueryHooks.ts với query keys
- [ ] 4. Replace useState + useEffect với useUsers()
- [ ] 5. Replace manual fetch với refetch()
- [ ] 6. Replace update/delete với mutations
- [ ] 7. Add useMemo cho filtering/sorting
- [ ] 8. Remove manual loading state management
- [ ] 9. Update pull-to-refresh với isRefetching
- [ ] 10. Test cache behavior

## 🎯 Key Points to Remember

1. **Query Keys**: Unique identifiers for cache entries
2. **staleTime**: How long data stays fresh (no refetch)
3. **gcTime**: How long unused data stays in cache (formerly cacheTime)
4. **Mutations**: For CREATE/UPDATE/DELETE operations
5. **invalidateQueries**: Trigger refetch after mutation
6. **useMemo**: Optimize expensive calculations
7. **enabled**: Conditional query execution

## 🚀 Next Steps

Áp dụng pattern này cho các pages khác:
- `admin/clubs.tsx`
- `admin/events.tsx`
- `uni-staff/policies.tsx`
- `uni-staff/points.tsx`

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Query Keys Guide](https://tkdodo.eu/blog/effective-react-query-keys)
