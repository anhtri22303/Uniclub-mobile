import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
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
      <Card className={`border-4 ${borderColor} ${bgColor}`}>
        <CardContent className="p-6">
          <View className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-4 ${borderColor} ${bgColor} shadow-lg`}>
      <CardHeader className="pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <CardTitle>
              <Text className="text-2xl font-bold" style={{ color: iconColor }}>
                {mainValue}
              </Text>
            </CardTitle>
            <CardDescription>
              <Text className="text-sm font-medium mt-1 text-gray-600">
                {description}
              </Text>
            </CardDescription>
          </View>
          <View
            className="h-14 w-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Ionicons name={icon} size={32} color={iconColor} />
          </View>
        </View>
      </CardHeader>
      <CardContent>
        <View className="space-y-2">
          {stats.map((stat, index) => (
            <View key={index} className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-600">{stat.label}:</Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <Text className="text-sm font-semibold" style={{ color: stat.color }}>
                  {stat.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

