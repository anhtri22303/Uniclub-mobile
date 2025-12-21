import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface EventDay {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
}

interface Event {
  id: number;
  name: string;
  // Multi-day fields
  startDate?: string;
  endDate?: string;
  days?: EventDay[];
  // Legacy single-day fields
  date?: string;
  startTime?: string;
  endTime?: string;
  time?: string;
}

interface EventDateTimeDisplayProps {
  event: Event;
  variant?: 'compact' | 'detailed';
}

export const EventDateTimeDisplay: React.FC<EventDateTimeDisplayProps> = ({ 
  event, 
  variant = 'compact' 
}) => {
  const isMultiDay = event.days && event.days.length > 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    // Handle both HH:MM and HH:MM:SS formats
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  if (isMultiDay && event.days) {
    // Multi-day event display
    if (variant === 'compact') {
      return (
        <View className="space-y-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600">
              {event.days.length} Day Event
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-600">
              {formatDate(event.days[0].date)} - {formatDate(event.days[event.days.length - 1].date)}
            </Text>
          </View>
        </View>
      );
    } else {
      // Detailed view - show all days
      return (
        <View className="space-y-3">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="calendar" size={18} color="#14B8A6" />
            <Text className="text-base font-semibold text-gray-800">
              {event.days.length} Day Event
            </Text>
          </View>
          {event.days.map((day, index) => (
            <View 
              key={index} 
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View className="w-6 h-6 rounded-full bg-teal-600 items-center justify-center">
                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-800">
                    {formatDate(day.date)}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2 ml-8">
                <Ionicons name="time-outline" size={14} color="#059669" />
                <Text className="text-sm text-gray-600">
                  {formatTime(day.startTime)}
                </Text>
                <Text className="text-sm text-gray-400">→</Text>
                <Ionicons name="time-outline" size={14} color="#DC2626" />
                <Text className="text-sm text-gray-600">
                  {formatTime(day.endTime)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      );
    }
  } else {
    // Single-day event display (legacy)
    const eventDate = event.date || event.startDate;
    const startTime = event.startTime || event.time;
    const endTime = event.endTime;

    if (variant === 'compact') {
      return (
        <View className="space-y-2">
          {eventDate && (
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600">{formatDate(eventDate)}</Text>
            </View>
          )}
          {(startTime || endTime) && (
            <View className="flex-row items-center gap-2">
              <Ionicons name="time" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600">
                {startTime && formatTime(startTime)}
                {startTime && endTime && ' - '}
                {endTime && formatTime(endTime)}
              </Text>
            </View>
          )}
        </View>
      );
    } else {
      // Detailed view
      return (
        <View className="space-y-3">
          {eventDate && (
            <View className="flex-row items-center gap-3 bg-gray-50 rounded-lg p-3">
              <Ionicons name="calendar" size={20} color="#14B8A6" />
              <View>
                <Text className="text-xs text-gray-500 mb-1">Date</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {formatDate(eventDate)}
                </Text>
              </View>
            </View>
          )}
          {(startTime || endTime) && (
            <View className="flex-row items-center gap-3 bg-gray-50 rounded-lg p-3">
              <Ionicons name="time" size={20} color="#14B8A6" />
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Time</Text>
                <View className="flex-row items-center gap-2">
                  {startTime && (
                    <>
                      <Ionicons name="time-outline" size={14} color="#059669" />
                      <Text className="text-sm font-semibold text-gray-800">
                        {formatTime(startTime)}
                      </Text>
                    </>
                  )}
                  {startTime && endTime && (
                    <Text className="text-sm text-gray-400 mx-1">→</Text>
                  )}
                  {endTime && (
                    <>
                      <Ionicons name="time-outline" size={14} color="#DC2626" />
                      <Text className="text-sm font-semibold text-gray-800">
                        {formatTime(endTime)}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      );
    }
  }
};

export default EventDateTimeDisplay;
