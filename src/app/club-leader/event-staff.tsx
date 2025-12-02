import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Badge } from '@components/ui/Badge';
import { Card, CardContent } from '@components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import {
  formatEventDateRange,
  getEventByClubId,
  getEventEndTime,
  getEventStartTime,
  isEventExpired,
  type Event
} from '@services/event.service';
import EventStaffService, { type EventStaff, type StaffEvaluation } from '@services/eventStaff.service';
import { useAuthStore } from '@stores/auth.store';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// Hide the navigation header
export const unstable_settings = {
  headerShown: false,
};

type TabType = 'active' | 'completed';



export default function EventStaffPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const clubId = user?.clubIds?.[0] || null;

  // State management
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  // Staff modal states
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffList, setStaffList] = useState<EventStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [evaluations, setEvaluations] = useState<StaffEvaluation[]>([]);

  // Evaluation modal states
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [showEvaluationDetailModal, setShowEvaluationDetailModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<EventStaff | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<StaffEvaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Evaluation form states
  const [performance, setPerformance] = useState<'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT'>('GOOD');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (clubId) {
      loadEvents();
    }
  }, [clubId]);

  const loadEvents = async () => {
    if (!clubId) return;
    
    setLoading(true);
    try {
      const data = await getEventByClubId(clubId);
      setEvents(data);
    } catch (error: any) {
      console.error('Failed to load events:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to load events',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleEventClick = async (event: Event) => {
    setSelectedEvent(event);
    setShowStaffModal(true);
    setLoadingStaff(true);
    setStaffList([]);
    setEvaluations([]);

    try {
      // Load staff list - use different API for completed events
      let staff: EventStaff[];
      if (event.status === 'COMPLETED') {
        staff = await EventStaffService.getEventStaffCompleted(event.id);
      } else {
        staff = await EventStaffService.getEventStaff(event.id);
      }
      setStaffList(staff);

      // Load evaluations
      const evals = await EventStaffService.getEvaluateEventStaff(event.id);
      setEvaluations(evals);
    } catch (error: any) {
      console.error('Failed to load staff:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to load event staff',
      });
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleEvaluateClick = (staff: EventStaff) => {
    setSelectedStaff(staff);
    setPerformance('GOOD');
    setNote('');
    setShowStaffModal(false);
    setShowEvaluateModal(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedStaff || !selectedEvent) return;

    if (!note.trim()) {
      Alert.alert('Error', 'Please provide evaluation notes');
      return;
    }

    setEvaluating(true);
    try {
      await EventStaffService.evaluateEventStaff(selectedEvent.id, {
        membershipId: selectedStaff.membershipId,
        eventId: selectedEvent.id,
        performance,
        note: note.trim(),
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Staff evaluation submitted successfully',
      });

      // Reload evaluations
      const evals = await EventStaffService.getEvaluateEventStaff(selectedEvent.id);
      setEvaluations(evals);

      setShowEvaluateModal(false);
      setShowStaffModal(true);
    } catch (error: any) {
      console.error('Failed to evaluate staff:', error);
      Alert.alert('Error', error?.message || 'Failed to submit evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  const handleViewEvaluation = (staff: EventStaff) => {
    const evaluation = evaluations.find(
      (e) => e.membershipId === staff.membershipId && e.eventId === staff.eventId
    );
    if (evaluation) {
      setSelectedEvaluation(evaluation);
      setShowStaffModal(false);
      setShowEvaluationDetailModal(true);
    }
  };

  const hasEvaluation = (staff: EventStaff) => {
    return evaluations.some(
      (e) => e.membershipId === staff.membershipId && e.eventId === staff.eventId
    );
  };

  // Filter events based on status and time
  const activeEvents = events.filter((event) => {
    const isApprovedOrOngoing = ['APPROVED', 'ONGOING'].includes(event.status);
    const expired = isEventExpired(event);
    return isApprovedOrOngoing && !expired;
  });

  const completedEvents = events.filter((event) => {
    const expired = isEventExpired(event);
    const isCompleted = event.status === 'COMPLETED';
    return expired || isCompleted;
  });

  const displayEvents = activeTab === 'active' ? activeEvents : completedEvents;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeObj: any) => {
    if (!timeObj) return 'N/A';
    if (typeof timeObj === 'string') {
      const parts = timeObj.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    if (typeof timeObj === 'object' && timeObj.hour !== undefined) {
      return `${String(timeObj.hour).padStart(2, '0')}:${String(timeObj.minute).padStart(2, '0')}`;
    }
    return 'N/A';
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return { bg: 'bg-blue-900', text: 'text-white', icon: 'checkmark-done-circle' as const, label: 'Completed' };
      case 'ONGOING':
        return { bg: 'bg-purple-600', text: 'text-white', icon: 'play-circle' as const, label: 'Ongoing' };
      case 'APPROVED':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: 'checkmark-circle' as const, label: 'Approved' };
      case 'PENDING_COCLUB':
        return { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'time' as const, label: 'Pending Co-Club' };
      case 'PENDING_UNISTAFF':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'time' as const, label: 'Pending University' };
      case 'REJECTED':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: 'close-circle' as const, label: 'Rejected' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'information-circle' as const, label: status };
    }
  };

  const getPerformanceColor = (perf: string) => {
    switch (perf) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'GOOD':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'AVERAGE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'POOR':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <Sidebar role={user?.role} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="text-gray-600 mt-4">Loading events...</Text>
        </View>
        <NavigationBar role={user?.role} user={user || undefined} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <View className="bg-teal-600 pt-4 pb-2 px-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
            
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1">      Event Staff Management</Text>
        </View>
        <Text className="text-teal-100 text-sm">
          View and manage staff assignments for your club's events
        </Text>
      </View>

      {/* Tabs */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-lg ${
              activeTab === 'active' ? 'bg-teal-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'active' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Active Events ({activeEvents.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('completed')}
            className={`flex-1 py-3 rounded-lg ${
              activeTab === 'completed' ? 'bg-teal-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'completed' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Completed ({completedEvents.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Events List */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
      >
        {displayEvents.length === 0 ? (
          <Card className="p-8 items-center">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-lg font-semibold text-gray-900 mt-4">No Events Found</Text>
            <Text className="text-gray-600 text-center mt-2">
              {activeTab === 'active'
                ? 'No active events available'
                : 'No completed events found'}
            </Text>
          </Card>
        ) : (
          displayEvents.map((event) => {
            const statusBadge = getStatusBadge(event.status);
            return (
              <TouchableOpacity
                key={event.id}
                onPress={() => handleEventClick(event)}
                className="mb-4"
              >
                <Card>
                  <CardContent className="p-4">
                    <View className="flex-row items-start justify-between mb-3">
                      <Text className="text-lg font-bold text-gray-900 flex-1 mr-2">
                        {event.name}
                      </Text>
                      <View className="flex-row gap-2">
                        <View className={`px-2 py-1 rounded-full ${statusBadge.bg}`}>
                          <Text className={`text-xs font-semibold ${statusBadge.text}`}>
                            {statusBadge.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="space-y-2">
                      <View className="flex-row items-center">
                        <Ionicons name="calendar" size={16} color="#0D9488" />
                        <Text className="text-sm text-gray-600 ml-2">{formatEventDateRange(event)}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="time" size={16} color="#0D9488" />
                        <Text className="text-sm text-gray-600 ml-2">
                          {getEventStartTime(event)} - {getEventEndTime(event)}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="location" size={16} color="#0D9488" />
                        <Text className="text-sm text-gray-600 ml-2">{event.locationName}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="people" size={16} color="#0D9488" />
                        <Text className="text-sm text-gray-600 ml-2">{event.hostClub.name}</Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Staff List Modal */}
      <Modal
        visible={showStaffModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStaffModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900 flex-1">
                  {selectedEvent?.name} - Staff List
                </Text>
                <TouchableOpacity onPress={() => setShowStaffModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600 text-sm mt-1">
                Staff members assigned to this event
              </Text>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
              {loadingStaff ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#0D9488" />
                  <Text className="text-gray-600 mt-4">Loading staff...</Text>
                </View>
              ) : staffList.length === 0 ? (
                <View className="py-12 items-center">
                  <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                  <Text className="text-lg font-semibold text-gray-900 mt-4">No Staff Assigned</Text>
                  <Text className="text-gray-600 text-center mt-2">
                    No staff members assigned to this event yet
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {staffList.map((staff) => {
                    const evaluated = hasEvaluation(staff);
                    return (
                      <Card key={staff.id} className="border shadow-sm">
                        <CardContent className="p-4">
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1">
                              <Text className="font-semibold text-gray-900 text-base">
                                {staff.memberName}
                              </Text>
                              <Text className="text-sm text-gray-600 mt-1">
                                <Text className="font-medium">Duty:</Text> {staff.duty}
                              </Text>
                              <Text className="text-sm text-gray-500 mt-1">
                                <Text className="font-medium">Assigned:</Text>{' '}
                                {new Date(staff.assignedAt).toLocaleDateString()}
                              </Text>
                            </View>
                            <View className="items-end gap-2">
                              <Badge
                                className={
                                  staff.state === 'ACTIVE'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-500 text-white'
                                }
                              >
                                {staff.state}
                              </Badge>
                              {selectedEvent?.status === 'COMPLETED' && (
                                evaluated ? (
                                  <TouchableOpacity
                                    onPress={() => handleViewEvaluation(staff)}
                                    className="bg-blue-50 border border-blue-300 rounded-lg px-3 py-2 flex-row items-center"
                                  >
                                    <Ionicons name="eye" size={16} color="#2563EB" />
                                    <Text className="text-blue-600 font-medium ml-1 text-sm">View</Text>
                                  </TouchableOpacity>
                                ) : (
                                  <TouchableOpacity
                                    onPress={() => handleEvaluateClick(staff)}
                                    className="bg-purple-50 border border-purple-300 rounded-lg px-3 py-2 flex-row items-center"
                                  >
                                    <Ionicons name="star" size={16} color="#7C3AED" />
                                    <Text className="text-purple-600 font-medium ml-1 text-sm">Evaluate</Text>
                                  </TouchableOpacity>
                                )
                              )}
                            </View>
                          </View>
                        </CardContent>
                      </Card>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Evaluate Staff Modal */}
      <Modal
        visible={showEvaluateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEvaluateModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900 flex-1">Evaluate Staff</Text>
                <TouchableOpacity onPress={() => {
                  setShowEvaluateModal(false);
                  setShowStaffModal(true);
                }}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600 text-sm mt-1">
                Provide feedback for {selectedStaff?.memberName}
              </Text>
            </View>

            <ScrollView className="px-6 py-4">
              <View className="space-y-4">
                {/* Performance Selection */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-3">Performance Level</Text>
                  <View className="space-y-2">
                    {(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'] as const).map((level) => (
                      <TouchableOpacity
                        key={level}
                        onPress={() => setPerformance(level)}
                        className={`p-4 rounded-lg border ${
                          performance === level
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`font-medium ${
                              performance === level ? 'text-teal-700' : 'text-gray-700'
                            }`}
                          >
                            {level}
                          </Text>
                          {performance === level && (
                            <Ionicons name="checkmark-circle" size={20} color="#0D9488" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Notes */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Evaluation Notes *</Text>
                  <View className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                    <Text
                      className="text-gray-900"
                      onPress={() => {
                        // This would trigger a TextInput in a real implementation
                        Alert.prompt(
                          'Evaluation Notes',
                          'Provide detailed feedback about the staff member\'s performance',
                          (text) => setNote(text),
                          'plain-text',
                          note
                        );
                      }}
                    >
                      {note || 'Tap to add notes...'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="px-6 py-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={handleSubmitEvaluation}
                disabled={evaluating || !note.trim()}
                className={`rounded-lg py-3 ${
                  evaluating || !note.trim() ? 'bg-gray-300' : 'bg-teal-600'
                }`}
              >
                {evaluating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">Submit Evaluation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Evaluation Detail Modal */}
      <Modal
        visible={showEvaluationDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEvaluationDetailModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl">
            <View className="px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900">Evaluation Details</Text>
                <TouchableOpacity onPress={() => {
                  setShowEvaluationDetailModal(false);
                  setShowStaffModal(true);
                }}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="px-6 py-4">
              {selectedEvaluation && (
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Performance</Text>
                    <View className={`px-4 py-2 rounded-lg border ${getPerformanceColor(selectedEvaluation.performance)}`}>
                      <Text className="font-bold text-center">{selectedEvaluation.performance}</Text>
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Notes</Text>
                    <View className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <Text className="text-gray-900">{selectedEvaluation.note}</Text>
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Evaluated At</Text>
                    <Text className="text-gray-600">
                      {new Date(selectedEvaluation.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View className="px-6 py-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => {
                  setShowEvaluationDetailModal(false);
                  setShowStaffModal(true);
                }}
                className="bg-gray-200 rounded-lg py-3"
              >
                <Text className="text-gray-800 font-semibold text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}
