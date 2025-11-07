import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

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

export function RecentApplicationsList({ applications, isLoading }: RecentApplicationsListProps) {
  const router = useRouter();

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
        {applications.length === 0 ? (
          <Text className="text-sm text-gray-500 text-center py-4">
            No recent applications
          </Text>
        ) : (
          <View className="space-y-3">
            {applications.map((application) => (
              <TouchableOpacity
                key={application.applicationId}
                className="p-3 border border-gray-200 rounded-lg"
                onPress={() => router.push('/club-leader/applications' as any)}
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

