import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Event {
  id: number;
  name: string;
  date: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  status: string;
  type: string;
  locationName?: string;
  commitPointCost?: number;
  hostClub?: {
    id: number;
    name: string;
  };
}

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  events: Event[];
  onEventClick?: (event: Event) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarModal({
  visible,
  onClose,
  events,
  onEventClick,
}: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(false);

  const screenHeight = Dimensions.get('window').height;

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create calendar grid
    const calendar: (Date | null)[] = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }
    
    // Add all days of month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(new Date(year, month, day));
    }
    
    return calendar;
  }, [currentDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: Event[] } = {};
    
    // Only include APPROVED, ONGOING, and COMPLETED events
    const validStatuses = ['APPROVED', 'ONGOING', 'COMPLETED'];
    
    events
      .filter(event => validStatuses.includes(event.status))
      .forEach(event => {
        if (event.date) {
          const dateKey = new Date(event.date).toDateString();
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(event);
        }
      });
    
    return grouped;
  }, [events]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toDateString();
    return eventsByDate[dateKey] || [];
  }, [selectedDate, eventsByDate]);

  // Get event indicator color for a date
  const getEventIndicator = (date: Date) => {
    const dateKey = date.toDateString();
    const dateEvents = eventsByDate[dateKey];
    
    if (!dateEvents || dateEvents.length === 0) return null;
    
    // Priority: ONGOING > APPROVED > COMPLETED
    const hasOngoing = dateEvents.some(e => e.status === 'ONGOING');
    const hasApproved = dateEvents.some(e => e.status === 'APPROVED');
    const hasCompleted = dateEvents.some(e => e.status === 'COMPLETED');
    
    if (hasOngoing) return '#EC4899'; // Pink for ONGOING
    if (hasApproved) return '#3B82F6'; // Blue for APPROVED
    if (hasCompleted) return '#F59E0B'; // Orange for COMPLETED
    
    return null;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' };
      case 'APPROVED':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
      case 'COMPLETED':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-lg bg-gray-100"
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            
            <Text className="text-xl font-bold text-gray-800">
              Event Calendar
            </Text>
            
            <View className="w-10" />
          </View>

          {/* Month Navigation */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={goToPreviousMonth}
              className="p-2 rounded-lg bg-gray-100"
            >
              <Ionicons name="chevron-back" size={20} color="#374151" />
            </TouchableOpacity>
            
            <Text className="text-lg font-semibold text-gray-800">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            
            <TouchableOpacity
              onPress={goToNextMonth}
              className="p-2 rounded-lg bg-gray-100"
            >
              <Ionicons name="chevron-forward" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Grid - Upper Half */}
        {!isCalendarCollapsed && (
          <View className="bg-white px-2 py-4">
            {/* Day Headers */}
            <View className="flex-row mb-2">
              {DAYS.map((day) => (
                <View key={day} className="flex-1 items-center">
                  <Text className="text-xs font-semibold text-gray-500">
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View className="flex-row flex-wrap">
              {calendarData.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} className="w-[14.28%] aspect-square p-1" />;
                }

                const indicator = getEventIndicator(date);
                const today = isToday(date);
                const selected = isSameDate(date, selectedDate);

                return (
                  <TouchableOpacity
                    key={index}
                    className="w-[14.28%] aspect-square p-1"
                    onPress={() => setSelectedDate(date)}
                  >
                    <View
                      className={`flex-1 items-center justify-center rounded-lg ${
                        selected
                          ? 'bg-teal-600'
                          : today
                          ? 'bg-teal-100 border border-teal-300'
                          : 'bg-gray-50'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected
                            ? 'text-white'
                            : today
                            ? 'text-teal-700'
                            : 'text-gray-800'
                        }`}
                      >
                        {date.getDate()}
                      </Text>
                      
                      {indicator && (
                        <View
                          className="w-1.5 h-1.5 rounded-full mt-1"
                          style={{ backgroundColor: indicator }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Toggle Calendar Button */}
        <View className="bg-white border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
            className="py-2 px-4 flex-row items-center justify-center"
          >
            <Ionicons 
              name={isCalendarCollapsed ? "chevron-down" : "chevron-up"} 
              size={20} 
              color="#0D9488" 
            />
            <Text className="text-teal-600 font-semibold ml-2 text-sm">
              {isCalendarCollapsed ? 'Show Calendar' : 'Hide Calendar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Event List - Lower Half */}
        <View className="flex-1 bg-gray-50 px-4 pt-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-800">
              {selectedDate
                ? `Events on ${selectedDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`
                : 'My Appointments'}
            </Text>
            
            {selectedDate && selectedDateEvents.length > 0 && (
              <View className="bg-teal-100 px-3 py-1 rounded-full">
                <Text className="text-teal-700 text-xs font-semibold">
                  {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
                </Text>
              </View>
            )}
          </View>

          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => {
                  const statusColors = getStatusBadgeColor(event.status);
                  const indicatorColor = getEventIndicator(new Date(event.date));
                  
                  return (
                    <TouchableOpacity
                      key={event.id}
                      className="mb-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                      onPress={() => onEventClick?.(event)}
                      activeOpacity={0.7}
                    >
                      {/* Color Indicator Bar */}
                      <View
                        className="h-1"
                        style={{ backgroundColor: indicatorColor || '#9CA3AF' }}
                      />
                      
                      <View className="p-4">
                        <View className="flex-row items-start justify-between mb-2">
                          <Text className="flex-1 text-base font-bold text-gray-800 mr-2" numberOfLines={2}>
                            {event.name}
                          </Text>
                          
                          {/* Status Badge */}
                          <View className={`px-2 py-1 rounded-full border ${statusColors.border} ${statusColors.bg}`}>
                            <Text className={`text-xs font-semibold ${statusColors.text}`}>
                              {event.status}
                            </Text>
                          </View>
                        </View>

                        {/* Event Details */}
                        <View className="space-y-2">
                          {/* Time */}
                          {(event.startTime || event.time) && (
                            <View className="flex-row items-center">
                              <Ionicons name="time-outline" size={14} color="#6B7280" />
                              <Text className="text-sm text-gray-600 ml-2">
                                {event.startTime || event.time}
                                {event.endTime && ` - ${event.endTime}`}
                              </Text>
                            </View>
                          )}

                          {/* Location */}
                          {event.locationName && (
                            <View className="flex-row items-center">
                              <Ionicons name="location-outline" size={14} color="#6B7280" />
                              <Text className="text-sm text-gray-600 ml-2" numberOfLines={1}>
                                {event.locationName}
                              </Text>
                            </View>
                          )}

                          {/* Type Badge */}
                          <View className="flex-row items-center">
                            <View
                              className={`px-2 py-1 rounded border ${
                                event.type === 'PRIVATE'
                                  ? 'bg-purple-50 border-purple-200'
                                  : event.type === 'SPECIAL'
                                  ? 'bg-pink-50 border-pink-200'
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  event.type === 'PRIVATE'
                                    ? 'text-purple-700'
                                    : event.type === 'SPECIAL'
                                    ? 'text-pink-700'
                                    : 'text-blue-700'
                                }`}
                              >
                                {event.type}
                              </Text>
                            </View>

                            {/* Commit Points */}
                            {event.commitPointCost !== undefined && event.commitPointCost > 0 && (
                              <View className="flex-row items-center ml-3">
                                <Ionicons name="pricetag" size={14} color="#F59E0B" />
                                <Text className="text-xs text-gray-600 ml-1">
                                  {event.commitPointCost} pts
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Host Club */}
                          {event.hostClub && (
                            <View className="flex-row items-center">
                              <Ionicons name="people-outline" size={14} color="#6B7280" />
                              <Text className="text-xs text-gray-500 ml-2">
                                By {event.hostClub.name}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="flex-1 items-center justify-center py-12">
                  <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                  <Text className="text-gray-400 mt-4 text-center">
                    No events on this date
                  </Text>
                </View>
              )
            ) : (
              <View className="flex-1 items-center justify-center py-12">
                <Ionicons name="hand-left-outline" size={64} color="#D1D5DB" />
                <Text className="text-gray-400 mt-4 text-center">
                  Select a date to view events
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
