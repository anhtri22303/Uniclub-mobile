import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Application {
  applicationId: number;
  applicantName: string;
  applicantEmail: string;
  status: string;
  createdAt: string;
}

interface RecentApplicationsListProps {
  applications: Application[];
  isLoading: boolean;
}

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

export function RecentApplicationsList({ applications, isLoading }: RecentApplicationsListProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'ALL') {
      return applications;
    }
    return applications.filter(app => app.status === statusFilter);
  }, [applications, statusFilter]);

  const getFilterButtonStyle = (filter: StatusFilter) => {
    return statusFilter === filter
      ? 'bg-green-500 border-green-500'
      : 'bg-white border-gray-300';
  };

  const getFilterTextStyle = (filter: StatusFilter) => {
    return statusFilter === filter ? 'text-white font-semibold' : 'text-gray-700';
  };

  if (isLoading) {
    return (
      <View className="bg-white rounded-3xl p-6 shadow-lg" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
        <View className="h-32 bg-gray-200 rounded-2xl" />
      </View>
    );
  }

  return (
    <View className="bg-white rounded-3xl p-6 shadow-lg" style={{ shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }}>
      {/* Colorful Top Bar */}
      <View className="h-2 bg-green-500 rounded-full mb-5" />
      
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <View className="bg-green-100 p-3 rounded-2xl mr-3">
          <Ionicons name="person-add" size={28} color="#22c55e" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">Recent Applications</Text>
          <Text className="text-sm text-gray-600 mt-0.5">Latest membership requests</Text>
        </View>
      </View>
      
      <View>
        {/* Filter Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setStatusFilter('PENDING')}
              className={`px-4 py-2.5 rounded-2xl shadow-sm ${statusFilter === 'PENDING' ? 'bg-amber-500' : 'bg-gray-100'}`}
              style={statusFilter === 'PENDING' ? { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 } : {}}
            >
              <Text className={`text-sm font-bold ${statusFilter === 'PENDING' ? 'text-white' : 'text-gray-700'}`}>
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatusFilter('APPROVED')}
              className={`px-4 py-2.5 rounded-2xl shadow-sm ${statusFilter === 'APPROVED' ? 'bg-green-500' : 'bg-gray-100'}`}
              style={statusFilter === 'APPROVED' ? { shadowColor: '#22c55e', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 } : {}}
            >
              <Text className={`text-sm font-bold ${statusFilter === 'APPROVED' ? 'text-white' : 'text-gray-700'}`}>
                Approved
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatusFilter('REJECTED')}
              className={`px-4 py-2.5 rounded-2xl shadow-sm ${statusFilter === 'REJECTED' ? 'bg-red-500' : 'bg-gray-100'}`}
              style={statusFilter === 'REJECTED' ? { shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 } : {}}
            >
              <Text className={`text-sm font-bold ${statusFilter === 'REJECTED' ? 'text-white' : 'text-gray-700'}`}>
                Rejected
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatusFilter('ALL')}
              className={`px-4 py-2.5 rounded-2xl shadow-sm ${statusFilter === 'ALL' ? 'bg-blue-500' : 'bg-gray-100'}`}
              style={statusFilter === 'ALL' ? { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 } : {}}
            >
              <Text className={`text-sm font-bold ${statusFilter === 'ALL' ? 'text-white' : 'text-gray-700'}`}>
                All
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {filteredApplications.length === 0 ? (
          <View className="bg-gray-50 rounded-2xl p-8 items-center">
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text className="text-base font-semibold text-gray-600 mt-3">
              No {statusFilter.toLowerCase()} applications
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredApplications.map((application) => (
              <TouchableOpacity
                key={application.applicationId}
                className="bg-gray-50 rounded-2xl p-4 border border-gray-200"
                onPress={() => router.push('/club-leader/application' as any)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                      {application.applicantName}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
                      {application.applicantEmail}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {application.createdAt
                        ? new Date(application.createdAt).toLocaleDateString()
                        : 'Recently'}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1.5 rounded-xl ${
                      application.status === 'APPROVED'
                        ? 'bg-green-500'
                        : application.status === 'PENDING'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  >
                    <Text className="text-xs font-bold text-white">
                      {application.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="bg-teal-500 rounded-2xl p-4 mt-4 shadow-lg"
              style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }}
              onPress={() => router.push('/club-leader/applications' as any)}
            >
              <Text className="text-white font-bold text-center">Manage All Applications</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

