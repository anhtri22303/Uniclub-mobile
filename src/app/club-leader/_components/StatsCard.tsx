import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

interface StatItem {
  label: string;
  value: number | string;
  color: string;
}

interface StatsCardProps {
  title: string;
  mainValue: number | string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  stats: StatItem[];
  isLoading?: boolean;
}

export function StatsCard({
  title,
  mainValue,
  description,
  icon,
  iconColor,
  borderColor,
  bgColor,
  stats,
  isLoading = false,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <View className="bg-white rounded-3xl p-6 shadow-lg" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
        <View className="h-32 bg-gray-200 rounded-2xl" />
      </View>
    );
  }

  return (
    <View className="bg-white rounded-3xl p-6 shadow-lg" style={{ shadowColor: iconColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }}>
      {/* Header with colorful bar */}
      <View className="h-2 rounded-full mb-4" style={{ backgroundColor: iconColor }} />
      
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 mr-3">
          <Text className="text-sm font-semibold text-gray-500 uppercase mb-1">{title}</Text>
          <Text className="text-3xl font-bold text-gray-900">{mainValue}</Text>
          <Text className="text-sm text-gray-600 mt-1">{description}</Text>
        </View>
        <View
          className="h-16 w-16 rounded-2xl items-center justify-center shadow-md"
          style={{ backgroundColor: `${iconColor}15`, shadowColor: iconColor, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }}
        >
          <Ionicons name={icon} size={36} color={iconColor} />
        </View>
      </View>
      
      {/* Stats Grid */}
      <View className="space-y-3 mt-2">
        {stats.map((stat, index) => (
          <View key={index} className="flex-row items-center justify-between bg-gray-50 px-4 py-3 rounded-2xl">
            <Text className="text-sm font-semibold text-gray-700 flex-1">{stat.label}</Text>
            <View
              className="px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: stat.color }}
            >
              <Text className="text-sm font-bold text-white">
                {stat.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

