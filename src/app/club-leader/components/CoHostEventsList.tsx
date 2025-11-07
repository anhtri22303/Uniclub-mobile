import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

interface CoHostEvent {
  id: number;
  name: string;
  description: string;
  date: string;
  startTime: any;
  endTime: any;
  locationName: string;
  status: string;
  hostClub: {
    id: number;
    name: string;
  };
  coHostedClubs?: Array<{
    id: number;
    name: string;
    coHostStatus: string;
  }>;
  currentCheckInCount: number;
  maxCheckInCount: number;
}

interface CoHostEventsListProps {
  events: CoHostEvent[];
  clubId: number | null;
  isLoading: boolean;
}

// Helper to convert time object to string
const timeObjectToString = (time: any): string => {
  if (!time) return '00:00:00';
  if (typeof time === 'string') return time;
  const { hour = 0, minute = 0, second = 0 } = time;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
};

export function CoHostEventsList({ events, clubId, isLoading }: CoHostEventsListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <Ionicons name="calendar" size={20} color="#f97316" />
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
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <CardTitle className="flex-row items-center gap-2">
              <Ionicons name="calendar" size={20} color="#f97316" />
              <Text className="text-lg font-bold">Co-Host Event Invitations</Text>
            </CardTitle>
            <CardDescription>
              <Text className="text-xs mt-1 text-gray-600">
                Active events where your club is invited as co-host
              </Text>
            </CardDescription>
          </View>
          <Badge variant="outline" className="ml-2">
            {events.length} Active
          </Badge>
        </View>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text className="text-sm text-gray-500 mt-3">
              No active co-host invitations
            </Text>
            <Text className="text-xs text-gray-400 mt-1 text-center">
              You'll see events here when other clubs invite you to co-host
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {events.map((event) => {
              const myCoHostStatus = event.coHostedClubs?.find(
                (club) => club.id === clubId
              )?.coHostStatus;
              const eventDate = event.date
                ? new Date(event.date).toLocaleDateString()
                : 'N/A';
              const startTimeStr = timeObjectToString(event.startTime);
              const endTimeStr = timeObjectToString(event.endTime);

              return (
                <TouchableOpacity
                  key={event.id}
                  className={`p-4 border-2 rounded-lg ${
                    myCoHostStatus === 'PENDING'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-green-300 bg-green-50'
                  }`}
                  onPress={() => router.push(`/club-leader/events/${event.id}` as any)}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Text className="text-base font-semibold flex-1" numberOfLines={1}>
                          {event.name}
                        </Text>
                        <Badge
                          variant={myCoHostStatus === 'PENDING' ? 'secondary' : 'default'}
                        >
                          {myCoHostStatus}
                        </Badge>
                      </View>

                      <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                        {event.description}
                      </Text>

                      <View className="space-y-1">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="people" size={14} color="#6b7280" />
                          <Text className="text-xs text-gray-600" numberOfLines={1}>
                            Host: {event.hostClub?.name}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="calendar" size={14} color="#6b7280" />
                          <Text className="text-xs text-gray-600">{eventDate}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="time" size={14} color="#6b7280" />
                          <Text className="text-xs text-gray-600">
                            {startTimeStr} - {endTimeStr}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="location" size={14} color="#6b7280" />
                          <Text className="text-xs text-gray-600">{event.locationName}</Text>
                        </View>
                      </View>

                      {event.coHostedClubs && event.coHostedClubs.length > 1 && (
                        <View className="mt-2 pt-2 border-t border-gray-300">
                          <Text className="text-xs text-gray-500">
                            Co-hosts: {event.coHostedClubs.map((c) => c.name).join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="items-end gap-2">
                      <Badge variant={event.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                      <View className="items-center">
                        <Text className="text-xs text-gray-600">
                          {event.currentCheckInCount}/{event.maxCheckInCount}
                        </Text>
                        <Text className="text-xs text-gray-500">Check-ins</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {events.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-3"
                onPress={() => router.push('/club-leader/events' as any)}
              >
                <Text>View All Events</Text>
              </Button>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
}

