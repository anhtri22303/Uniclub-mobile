import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
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
      <Card>
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <Ionicons name="person-add" size={20} color="#22c55e" />
            <Text className="text-lg font-bold">Loading...</Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-row items-center gap-2">
          <Ionicons name="person-add" size={20} color="#22c55e" />
          <Text className="text-lg font-bold">Recent Applications</Text>
        </CardTitle>
        <CardDescription>
          <Text className="text-xs text-gray-600">
            Latest membership requests
          </Text>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 rounded-full border ${getFilterButtonStyle('PENDING')}`}
            >
              <Text className={`text-sm ${getFilterTextStyle('PENDING')}`}>
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatusFilter('APPROVED')}
              className={`px-4 py-2 rounded-full border ${getFilterButtonStyle('APPROVED')}`}
            >
              <Text className={`text-sm ${getFilterTextStyle('APPROVED')}`}>
                Approved
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatusFilter('REJECTED')}
              className={`px-4 py-2 rounded-full border ${getFilterButtonStyle('REJECTED')}`}
            >
              <Text className={`text-sm ${getFilterTextStyle('REJECTED')}`}>
                Rejected
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-full border ${getFilterButtonStyle('ALL')}`}
            >
              <Text className={`text-sm ${getFilterTextStyle('ALL')}`}>
                All
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {filteredApplications.length === 0 ? (
          <Text className="text-sm text-gray-500 text-center py-4">
            No {statusFilter.toLowerCase()} applications
          </Text>
        ) : (
          <View className="space-y-3">
            {filteredApplications.map((application) => (
              <TouchableOpacity
                key={application.applicationId}
                className="p-3 border border-gray-200 rounded-lg"
                onPress={() => router.push('/club-leader/application' as any)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-medium" numberOfLines={1}>
                      {application.applicantName}
                    </Text>
                    <Text className="text-sm text-gray-500" numberOfLines={1}>
                      {application.applicantEmail}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {application.createdAt
                        ? new Date(application.createdAt).toLocaleDateString()
                        : 'Recently'}
                    </Text>
                  </View>
                  <Badge
                    variant={
                      application.status === 'APPROVED'
                        ? 'default'
                        : application.status === 'PENDING'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {application.status}
                  </Badge>
                </View>
              </TouchableOpacity>
            ))}
            <Button
              variant="outline"
              className="w-full mt-3"
              onPress={() => router.push('/club-leader/applications' as any)}
            >
              <Text>Manage All Applications</Text>
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

