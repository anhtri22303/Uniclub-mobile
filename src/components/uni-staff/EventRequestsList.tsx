import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EventRequest {
  id: number;
  name: string;
  status: string;
  clubName?: string;
  hostClub?: {
    name: string;
  };
  date?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name: string;
  };
  locationName?: string;
  description?: string;
  submittedAt?: string;
  reviewedBy?: any;
}

interface EventRequestsListProps {
  eventRequests: EventRequest[];
  maxItems?: number;
  showAll?: boolean;
  onViewAll?: () => void;
  onItemPress?: (eventId: number) => void;
}

export const EventRequestsList: React.FC<EventRequestsListProps> = ({
  eventRequests,
  maxItems = 3,
  showAll = false,
  onViewAll,
  onItemPress,
}) => {

  const displayedEvents = showAll
    ? eventRequests
    : eventRequests.slice(0, maxItems);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
      case 'AWAITING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'ONGOING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if same day
    const isSameDay = start.toDateString() === end.toDateString();
    
    if (isSameDay) {
      return `${formatDate(startDate)}`;
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (eventRequests.length === 0) {
    return (
      <View className="bg-white rounded-xl p-6 items-center justify-center border border-gray-200">
        <Text className="text-4xl mb-2"></Text>
        <Text className="text-base font-semibold text-gray-900 mb-1">
          No Event Requests
        </Text>
        <Text className="text-sm text-gray-500 text-center">
          Event requests will appear here
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {displayedEvents.map((event) => (
        <TouchableOpacity
          key={event.id}
          onPress={() => onItemPress?.(event.id)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          activeOpacity={0.7}
          disabled={!onItemPress}
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-base font-bold text-gray-900 mb-1">
                {event.name}
              </Text>
              {(event.clubName || event.hostClub) && (
                <Text className="text-xs text-gray-500 mb-1">
                  🏢 {event.clubName || event.hostClub?.name}
                </Text>
              )}
            </View>
            <View
              className={`px-3 py-1 rounded-full border ${getStatusColor(
                event.status
              )}`}
            >
              <Text className="text-xs font-semibold">{event.status}</Text>
            </View>
          </View>

          {event.description && (
            <Text
              className="text-sm text-gray-600 mb-2"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {event.description}
            </Text>
          )}

          <View className="gap-1">
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500">
                📅{' '}
                {event.startDate && event.endDate
                  ? formatTimeRange(event.startDate, event.endDate)
                  : event.date
                  ? formatDate(event.date)
                  : 'Date TBD'}
              </Text>
            </View>
            {(event.location || event.locationName) && (
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-500">
                   {event.location?.name || event.locationName}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {!showAll && eventRequests.length > maxItems && onViewAll && (
        <TouchableOpacity
          onPress={onViewAll}
          className="bg-blue-50 rounded-xl p-4 items-center border border-blue-200"
          activeOpacity={0.7}
        >
          <Text className="text-sm font-semibold text-blue-600">
            View All Event Requests ({eventRequests.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EventRequestsList;
