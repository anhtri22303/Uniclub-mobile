import { Ionicons } from '@expo/vector-icons';
import { Major } from '@services/major.service';
import { Text, View } from 'react-native';

interface ClubInfoCardProps {
  club: {
    name: string;
    description: string | null;
    majorName: string;
    majorPolicyName: string;
    leaderName: string;
  } | null;
  majorInfo: Major | null;
  isLoading: boolean;
}

export function ClubInfoCard({ club, majorInfo, isLoading }: ClubInfoCardProps) {
  if (isLoading) {
    return (
      <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
        <View className="h-40 bg-gray-200 rounded-2xl" />
      </View>
    );
  }

  if (!club) {
    return (
      <View className="bg-white rounded-3xl p-8 mb-4 shadow-lg" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
        <View className="bg-gray-50 p-8 rounded-full mb-4 self-center">
          <Ionicons name="business-outline" size={56} color="#9CA3AF" />
        </View>
        <Text className="text-xl font-bold text-gray-600 text-center">No club information</Text>
        <Text className="text-sm text-gray-500 text-center mt-2">
          Club information is not available at this time.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg" style={{ shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }}>
      {/* Colorful Top Bar */}
      <View className="h-2 bg-teal-500 rounded-full mb-5" />
      
      {/* Header */}
      <View className="flex-row items-center mb-5">
        <View className="bg-teal-100 p-3 rounded-2xl mr-3">
          <Ionicons name="business" size={32} color="#14B8A6" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-gray-500 uppercase">Club Information</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-0.5">{club.name}</Text>
        </View>
      </View>

      {/* Info Grid */}
      <View className="space-y-3">
        {/* Major and Policy Row */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-blue-50 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center mr-2">
                <Ionicons name="school" size={18} color="#3B82F6" />
              </View>
              <Text className="text-xs font-bold text-gray-500 uppercase">Major</Text>
            </View>
            <Text className="text-sm font-bold text-blue-700" numberOfLines={2}>
              {club.majorName}
            </Text>
          </View>

          <View className="flex-1 bg-purple-50 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-2">
                <Ionicons name="document-text" size={18} color="#A855F7" />
              </View>
              <Text className="text-xs font-bold text-gray-500 uppercase">Policy</Text>
            </View>
            <Text className="text-sm font-bold text-purple-700" numberOfLines={2}>
              {majorInfo?.policies?.[0]?.policyName || majorInfo?.policyName || club.majorPolicyName || '-'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View className="bg-gray-50 rounded-2xl p-4">
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 bg-gray-200 rounded-lg items-center justify-center mr-2">
              <Ionicons name="information-circle" size={18} color="#6B7280" />
            </View>
            <Text className="text-xs font-bold text-gray-500 uppercase">Description</Text>
          </View>
          <Text className="text-sm leading-6 text-gray-700">
            {club.description || 'No description available'}
          </Text>
        </View>

        {/* Club Leader */}
        <View className="bg-teal-50 rounded-2xl p-4 border border-teal-200">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-teal-100 rounded-xl items-center justify-center mr-3">
              <Ionicons name="person" size={22} color="#14B8A6" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-teal-600 uppercase">Club Leader</Text>
              <Text className="text-base font-bold text-teal-800 mt-0.5">
                {club.leaderName}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

