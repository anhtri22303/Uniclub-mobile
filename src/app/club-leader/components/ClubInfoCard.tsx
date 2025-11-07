import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface ClubInfoCardProps {
  club: {
    name: string;
    description: string | null;
    majorName: string;
    majorPolicyName: string;
    leaderName: string;
  } | null;
  isLoading: boolean;
}

export function ClubInfoCard({ club, isLoading }: ClubInfoCardProps) {
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <Ionicons name="people" size={24} color="#8B5CF6" />
            <Text className="text-xl font-bold">Loading...</Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!club) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <Text className="text-center text-red-600">
              Could not load club information
            </Text>
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-l-4 border-l-purple-500">
      <CardHeader>
        <CardTitle className="flex-row items-center gap-2">
          <Ionicons name="people" size={24} color="#8B5CF6" />
          <Text className="text-xl font-bold">Club Information</Text>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Club Name */}
        <View className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <Text className="text-xs font-medium text-gray-600 uppercase mb-1">
            Club Name
          </Text>
          <Text className="text-2xl font-bold text-purple-700">
            {club.name}
          </Text>
        </View>

        {/* Major and Policy */}
        <View className="flex-row gap-4">
          <View className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <Text className="text-xs font-medium text-gray-600 uppercase mb-2">
              Major
            </Text>
            <Text className="text-sm font-semibold text-blue-700">
              {club.majorName}
            </Text>
          </View>

          <View className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <Text className="text-xs font-medium text-gray-600 uppercase mb-2">
              Policy
            </Text>
            <Text className="text-sm font-semibold text-purple-700">
              {club.majorPolicyName}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <Text className="text-xs font-medium text-gray-600 uppercase mb-2">
            Description
          </Text>
          <Text className="text-sm leading-relaxed text-gray-800">
            {club.description || 'No description available'}
          </Text>
        </View>

        {/* Club Leader */}
        <View className="flex-row items-center gap-2 pt-2 border-t border-gray-200">
          <Text className="text-sm text-gray-600">Club Leader:</Text>
          <Text className="text-sm font-medium text-gray-800">
            {club.leaderName}
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}

