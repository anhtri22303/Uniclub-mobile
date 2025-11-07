import { Badge } from '@components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

interface MembersByMajorChartProps {
  membersByMajor: Record<string, number>;
  totalMembers: number;
  isLoading: boolean;
}

export function MembersByMajorChart({
  membersByMajor,
  totalMembers,
  isLoading,
}: MembersByMajorChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <Ionicons name="school" size={20} color="#8B5CF6" />
            <Text className="text-lg font-bold">Loading...</Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const sortedMajors = Object.entries(membersByMajor)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-row items-center gap-2">
          <Ionicons name="school" size={20} color="#8B5CF6" />
          <Text className="text-lg font-bold">Members by Major</Text>
        </CardTitle>
        <CardDescription>
          <Text className="text-xs text-gray-600">
            Distribution across majors
          </Text>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedMajors.length === 0 ? (
          <Text className="text-sm text-gray-500 text-center py-4">
            No major data available
          </Text>
        ) : (
          <ScrollView className="space-y-3 max-h-80">
            {sortedMajors.map(([major, count]) => {
              const percentage = ((count as number) / totalMembers) * 100;
              return (
                <View
                  key={major}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium flex-1" numberOfLines={1}>
                      {major}
                    </Text>
                    <Badge variant="outline" className="ml-2">
                      {count as number}
                    </Badge>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </View>
                </View>
              );
            })}
            {Object.keys(membersByMajor).length > 10 && (
              <Text className="text-xs text-gray-500 text-center pt-2">
                Showing top 10 of {Object.keys(membersByMajor).length} majors
              </Text>
            )}
          </ScrollView>
        )}
      </CardContent>
    </Card>
  );
}

