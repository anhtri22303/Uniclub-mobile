import { Ionicons } from '@expo/vector-icons';
import LocationService, {
    Location,
    LocationEvent,
} from '@services/location.service';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

interface LocationEventsCalendarModalProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationEventsCalendarModal({
  location,
  isOpen,
  onClose,
}: LocationEventsCalendarModalProps) {
  const [events, setEvents] = useState<LocationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Load events when modal opens
  useEffect(() => {
    if (isOpen && location) {
      loadLocationEvents();
      setSelectedDate(null);
    }
  }, [isOpen, location]);

  const loadLocationEvents = async () => {
    if (!location) return;

    try {
      setLoading(true);
      const data = await LocationService.getLocationEvents(location.id);
      setEvents(data);
    } catch (error: any) {
      console.error('Error loading location events:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load events for this location',
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get event type badge
  const getEventTypeBadge = (type: string) => {
    const badges = {
      PUBLIC: { label: 'Public', bgColor: '#D1FAE5', color: '#059669' },
      PRIVATE: { label: 'Private', bgColor: '#FED7AA', color: '#EA580C' },
      SPECIAL: { label: 'Special', bgColor: '#E9D5FF', color: '#9333EA' },
    };
    return badges[type as keyof typeof badges] || badges.PUBLIC;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      COMPLETED: { label: 'Completed', bgColor: '#1E3A8A', color: '#FFFFFF' },
      ONGOING: { label: 'Ongoing', bgColor: '#7C3AED', color: '#FFFFFF' },
      UPCOMING: { label: 'Upcoming', bgColor: '#059669', color: '#FFFFFF' },
      CANCELLED: { label: 'Cancelled', bgColor: '#FED7AA', color: '#EA580C' },
    };
    return badges[status as keyof typeof badges] || badges.UPCOMING;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isWithinInterval = (date: Date, start: Date, end: Date) => {
    const time = date.getTime();
    const startTime = start.getTime();
    const endTime = end.getTime();
    return time >= startTime && time <= endTime;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    // Format date to YYYY-MM-DD to match API format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return events.filter((event) => {
      // Check if any day in the event matches the selected date
      return event.days.some((eventDay) => eventDay.date === dateStr);
    });
  };

  // Calendar days
  const calendarDays = useMemo(() => {
    const { daysInMonth, startingDayOfWeek, year, month } =
      getDaysInMonth(currentMonth);
    const days: (Date | null)[] = [];

    // Add empty cells for days before month start
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const eventsForDate = getEventsForDate(selectedDate);

    // Map events and filter their days to only show days matching the selected date
    const eventsWithFilteredDays = eventsForDate.map((event) => {
      const filteredDays = event.days.filter((day) => {
        const dayDate = new Date(day.date);
        return isSameDay(dayDate, selectedDate);
      });

      return {
        ...event,
        days: filteredDays,
      };
    });

    // Sort events by start time (earliest first)
    return eventsWithFilteredDays.sort((a, b) => {
      const aTime = a.days && a.days.length > 0 ? a.days[0].startTime : '23:59';
      const bTime = b.days && b.days.length > 0 ? b.days[0].startTime : '23:59';
      return aTime.localeCompare(bTime);
    });
  }, [selectedDate, events]);

  // Navigate months
  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDate = (date: Date) => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatMonthYear = (date: Date) => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-12 bg-white rounded-t-3xl">
          {/* Header */}
          <View className="p-6 border-b border-gray-200">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1">
                <Ionicons name="location" size={24} color="#3B82F6" />
                <Text className="text-xl font-bold text-gray-800 ml-2 flex-1" numberOfLines={1}>
                  {location?.name || 'Location'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="ml-2">
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-gray-600" numberOfLines={2}>
              {location?.address}
            </Text>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-600 mt-4">Loading events...</Text>
            </View>
          ) : (
            <ScrollView className="flex-1" nestedScrollEnabled>
              <View className="p-4">
                {/* Month Navigation */}
                <View className="flex-row items-center justify-between mb-4">
                  <TouchableOpacity
                    onPress={handlePreviousMonth}
                    className="bg-white border border-gray-200 rounded-lg p-2"
                  >
                    <Ionicons name="chevron-back" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <Text className="text-lg font-semibold text-gray-800">
                    {formatMonthYear(currentMonth)}
                  </Text>
                  <TouchableOpacity
                    onPress={handleNextMonth}
                    className="bg-white border border-gray-200 rounded-lg p-2"
                  >
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Calendar Grid */}
                <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
                  {/* Weekday Headers */}
                  <View className="flex-row mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <View key={day} className="flex-1 items-center py-2">
                        <Text className="text-xs font-semibold text-gray-600">
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Calendar Days */}
                  <View className="flex-row flex-wrap">
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return <View key={`empty-${index}`} className="w-[14.28%] aspect-square" />;
                      }

                      const dayEvents = getEventsForDate(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const hasEvents = dayEvents.length > 0;
                      const isToday = isSameDay(day, new Date());

                      return (
                        <TouchableOpacity
                          key={day.toISOString()}
                          onPress={() => handleDateClick(day)}
                          className={`w-[14.28%] aspect-square p-1 ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <View
                            className={`flex-1 rounded-lg border-2 p-1 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-100'
                                : isToday
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-transparent'
                            }`}
                          >
                            <Text
                              className={`text-xs text-center font-medium ${
                                isToday ? 'text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              {day.getDate()}
                            </Text>
                            {hasEvents && (
                              <View className="flex-row justify-center mt-0.5 gap-0.5">
                                {dayEvents.slice(0, 3).map((event, idx) => (
                                  <View
                                    key={idx}
                                    className="w-1 h-1 rounded-full"
                                    style={{
                                      backgroundColor:
                                        event.type === 'PUBLIC'
                                          ? '#059669'
                                          : event.type === 'PRIVATE'
                                          ? '#EA580C'
                                          : '#9333EA',
                                    }}
                                  />
                                ))}
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Selected Date Events */}
                <View className="bg-white rounded-2xl border border-gray-200 p-4">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="calendar" size={20} color="#3B82F6" />
                      <Text className="text-base font-semibold text-gray-800 ml-2 flex-1" numberOfLines={1}>
                        {selectedDate ? formatDate(selectedDate) : 'Select a date'}
                      </Text>
                    </View>
                    {selectedDateEvents.length > 0 && (
                      <View className="bg-blue-100 px-2 py-1 rounded-full">
                        <Text className="text-xs font-medium text-blue-700">
                          {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  <ScrollView className="max-h-96" nestedScrollEnabled>
                    {!selectedDate ? (
                      <View className="items-center py-8">
                        <Ionicons name="information-circle-outline" size={48} color="#D1D5DB" />
                        <Text className="text-gray-600 mt-2 text-center">
                          Click on a date to view events
                        </Text>
                      </View>
                    ) : selectedDateEvents.length === 0 ? (
                      <View className="items-center py-8">
                        <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                        <Text className="text-gray-600 mt-2 text-center">
                          No events scheduled for this date
                        </Text>
                      </View>
                    ) : (
                      <View className="gap-3">
                        {selectedDateEvents.map((event) => {
                          const typeBadge = getEventTypeBadge(event.type);
                          const statusBadge = getStatusBadge(event.status);

                          return (
                            <View
                              key={event.id}
                              className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                            >
                              {/* Event Name & Type */}
                              <View className="flex-row items-start justify-between gap-2 mb-2">
                                <Text className="text-sm font-semibold text-gray-800 flex-1" numberOfLines={2}>
                                  {event.name}
                                </Text>
                                <View
                                  className="px-2 py-1 rounded-md"
                                  style={{ backgroundColor: typeBadge.bgColor }}
                                >
                                  <Text className="text-xs font-medium" style={{ color: typeBadge.color }}>
                                    {typeBadge.label}
                                  </Text>
                                </View>
                              </View>

                              {/* Time Range */}
                              {event.days && event.days.length > 0 && (
                                <View className="bg-blue-50 rounded-lg px-3 py-2 mb-2">
                                  <View className="flex-row items-center">
                                    <Ionicons name="time" size={16} color="#3B82F6" />
                                    <Text className="text-sm font-semibold text-blue-700 ml-2">
                                      {event.days[0].startTime} - {event.days[0].endTime}
                                    </Text>
                                  </View>
                                </View>
                              )}

                              {/* Status */}
                              <View
                                className="px-2 py-1 rounded-md mb-2 self-start"
                                style={{ backgroundColor: statusBadge.bgColor }}
                              >
                                <Text className="text-xs font-semibold" style={{ color: statusBadge.color }}>
                                  {statusBadge.label}
                                </Text>
                              </View>

                              {/* Capacity */}
                              <View className="flex-row items-center mb-1">
                                <Ionicons name="people" size={14} color="#6B7280" />
                                <Text className="text-xs text-gray-600 ml-2">
                                  {event.currentCheckInCount} / {event.maxCheckInCount} attendees
                                </Text>
                              </View>

                              {/* Host Club */}
                              <View className="flex-row items-center">
                                <Ionicons name="home" size={14} color="#6B7280" />
                                <Text className="text-xs text-gray-600 ml-2">
                                  Host: {event.hostClub.name}
                                </Text>
                              </View>

                              {/* Description */}
                              {event.description && (
                                <Text className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200" numberOfLines={2}>
                                  {event.description}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </ScrollView>
                </View>

                {/* Summary Footer */}
                {!loading && events.length > 0 && (
                  <View className="bg-white rounded-2xl border border-gray-200 p-4 mt-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm text-gray-600">Total Events:</Text>
                      <Text className="text-sm font-bold text-gray-800">{events.length}</Text>
                    </View>
                    <View className="flex-row items-center justify-between gap-4">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-600">Public:</Text>
                        <Text className="text-sm font-bold text-green-600">
                          {events.filter((e) => e.type === 'PUBLIC').length}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-600">Private:</Text>
                        <Text className="text-sm font-bold text-orange-600">
                          {events.filter((e) => e.type === 'PRIVATE').length}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-600">Special:</Text>
                        <Text className="text-sm font-bold text-purple-600">
                          {events.filter((e) => e.type === 'SPECIAL').length}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
