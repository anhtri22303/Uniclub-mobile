import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventFraud, useEventStats } from '@hooks/useQueryHooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, bgColor }) => (
  <View className="flex-1 min-w-[45%] p-4 rounded-xl border-2" style={{ borderColor: color, backgroundColor: bgColor }}>
    <View className="flex-row items-center justify-between mb-2">
      <Ionicons name={icon} size={24} color={color} />
      <Text className="text-2xl font-bold" style={{ color }}>
        {value}
      </Text>
    </View>
    <Text className="text-sm font-medium text-gray-700">{label}</Text>
  </View>
);

interface RateCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const RateCard: React.FC<RateCardProps> = ({ label, value, icon, color }) => (
  <View className="flex-1 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
    <View className="flex-row items-center gap-2 mb-1">
      <Ionicons name={icon} size={20} color={color} />
      <Text className="text-sm text-gray-600">{label}</Text>
    </View>
    <Text className="text-3xl font-bold" style={{ color }}>
      {value}
    </Text>
  </View>
);

export default function EventStatsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Number(id);

  const [refreshing, setRefreshing] = useState(false);
  const [showFraudModal, setShowFraudModal] = useState(false);

  // Fetch event details
  const {
    data: event,
    isLoading: eventLoading,
    refetch: refetchEvent,
  } = useEvent(eventId, !!id);

  // Fetch attendance stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useEventStats(eventId, !!id);

  // Fetch fraud records
  const {
    data: fraudRecords = [],
    isLoading: fraudLoading,
    refetch: refetchFraud,
  } = useEventFraud(eventId, !!id);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchEvent(), refetchStats(), refetchFraud()]);
    setRefreshing(false);
  };

  const loading = eventLoading || statsLoading;

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0D9488" />
          <Text className="mt-4 text-gray-500">Loading statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event || !stats) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-lg text-gray-500">Unable to load statistics</Text>
          <TouchableOpacity
            className="mt-4 bg-teal-600 rounded-lg px-6 py-3"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatPercentage = (value?: number) => {
    return value !== undefined ? `${value.toFixed(1)}%` : 'N/A';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {/* Header */}
        <View className="p-4 bg-white border-b border-gray-200">
          <TouchableOpacity
            className="flex-row items-center mb-3"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
            <Text className="ml-2 text-gray-700 font-medium">Back to Event</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">{event.name}</Text>
          <Text className="text-sm text-gray-600 mt-1">Attendance Statistics</Text>
        </View>

        {/* Overview Statistics */}
        <View className="p-4">
          <View className="mb-3">
            <Text className="text-lg font-bold text-gray-900">Overview</Text>
            <Text className="text-sm text-gray-600">Overall event attendance breakdown</Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon="people"
              label="Total Registered"
              value={stats.totalRegistered || 0}
              color="#3B82F6"
              bgColor="#DBEAFE"
            />
            <StatCard
              icon="enter"
              label="Check-in"
              value={stats.checkinCount || 0}
              color="#10B981"
              bgColor="#D1FAE5"
            />
            <StatCard
              icon="timer"
              label="Mid-check"
              value={stats.midCount || 0}
              color="#F59E0B"
              bgColor="#FEF3C7"
            />
            <StatCard
              icon="exit"
              label="Check-out"
              value={stats.checkoutCount || 0}
              color="#8B5CF6"
              bgColor="#EDE9FE"
            />
          </View>
        </View>

        {/* Attendance Status */}
        <View className="px-4 pb-4">
          <View className="mb-3">
            <Text className="text-lg font-bold text-gray-900">Attendance Status</Text>
            <Text className="text-sm text-gray-600">Participation levels by attendees</Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon="checkmark-done-circle"
              label="Full Attendance"
              value={stats.fullCount || 0}
              color="#059669"
              bgColor="#D1FAE5"
            />
            <StatCard
              icon="checkmark-circle"
              label="Partial Attendance"
              value={stats.halfCount || 0}
              color="#F59E0B"
              bgColor="#FEF3C7"
            />
            <StatCard
              icon="close-circle"
              label="No Attendance"
              value={stats.noneCount || 0}
              color="#EF4444"
              bgColor="#FEE2E2"
            />
            <StatCard
              icon="alert-circle"
              label="Suspicious Activity"
              value={stats.suspiciousCount || 0}
              color="#DC2626"
              bgColor="#FEE2E2"
            />
          </View>
        </View>

        {/* Rates */}
        <View className="px-4 pb-4">
          <View className="mb-3">
            <Text className="text-lg font-bold text-gray-900">Performance Rates</Text>
            <Text className="text-sm text-gray-600">Key performance indicators</Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            <RateCard
              label="Participation Rate"
              value={formatPercentage(stats.participationRate)}
              icon="trending-up"
              color="#10B981"
            />
            <RateCard
              label="Mid Compliance"
              value={formatPercentage(stats.midComplianceRate)}
              icon="checkmark-done"
              color="#3B82F6"
            />
          </View>
          <View className="flex-row flex-wrap gap-3 mt-3">
            <RateCard
              label="Fraud Rate"
              value={formatPercentage(stats.fraudRate)}
              icon="warning"
              color="#EF4444"
            />
          </View>
        </View>

        {/* Fraud Detection */}
        {fraudRecords.length > 0 && (
          <View className="px-4 pb-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Fraud Detection</Text>
                <Text className="text-sm text-gray-600">{fraudRecords.length} suspicious record(s) detected</Text>
              </View>
              <TouchableOpacity
                className="bg-red-600 rounded-lg px-4 py-2"
                onPress={() => setShowFraudModal(true)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="alert-circle" size={18} color="white" />
                  <Text className="text-white font-medium ml-1">View All</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Preview first 2 fraud records */}
            <View className="space-y-2">
              {fraudRecords.slice(0, 2).map((record, index) => (
                <View
                  key={record.registrationId || index}
                  className="p-4 bg-red-50 border-2 border-red-300 rounded-xl"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{record.memberName}</Text>
                      <Text className="text-sm text-gray-600">{record.memberEmail}</Text>
                    </View>
                    <View className="bg-red-600 px-2 py-1 rounded">
                      <Text className="text-xs font-semibold text-white">FRAUD</Text>
                    </View>
                  </View>
                  <View className="p-3 bg-white rounded-lg">
                    <Text className="text-sm text-red-800 font-medium">{record.fraudReason}</Text>
                  </View>
                </View>
              ))}
            </View>

            {fraudRecords.length > 2 && (
              <TouchableOpacity
                className="mt-3 p-3 bg-white border border-gray-300 rounded-lg"
                onPress={() => setShowFraudModal(true)}
              >
                <Text className="text-center text-gray-700 font-medium">
                  View {fraudRecords.length - 2} more suspicious record(s)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Info Card */}
        <View className="px-4 pb-6">
          <View className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex-row">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="text-sm text-blue-800 font-medium">About Statistics</Text>
              <Text className="text-xs text-blue-700 mt-1">
                Statistics are updated in real-time. Suspicious activity is automatically flagged based on timing
                patterns and behavioral analysis.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fraud Records Modal */}
      <Modal visible={showFraudModal} animationType="slide" transparent onRequestClose={() => setShowFraudModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white dark:bg-gray-800 rounded-2xl w-11/12 max-w-2xl max-h-5/6">
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Suspicious Activity</Text>
                <Text className="text-sm text-gray-600 mt-1">{fraudRecords.length} record(s) detected</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFraudModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-6">
              {fraudLoading ? (
                <View className="flex-1 items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#0D9488" />
                  <Text className="mt-4 text-gray-500">Loading fraud records...</Text>
                </View>
              ) : fraudRecords.length === 0 ? (
                <View className="flex-1 items-center justify-center py-12">
                  <Ionicons name="shield-checkmark-outline" size={64} color="#10B981" />
                  <Text className="mt-4 text-lg font-semibold text-gray-900">No Suspicious Activity</Text>
                  <Text className="mt-2 text-sm text-gray-600 text-center">
                    All attendance records appear normal
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {fraudRecords.map((record, index) => (
                    <View
                      key={record.registrationId || index}
                      className="p-4 border-2 border-red-300 bg-red-50 rounded-xl"
                    >
                      {/* Member Info */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="font-semibold text-gray-900">{record.memberName}</Text>
                          <Text className="text-sm text-gray-600">{record.memberEmail}</Text>
                        </View>
                        <View className="bg-red-600 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-white">FRAUD</Text>
                        </View>
                      </View>

                      {/* Fraud Reason */}
                      <View className="mb-3 p-3 bg-white rounded-lg">
                        <Text className="text-xs text-gray-500 mb-1">Reason</Text>
                        <Text className="text-sm text-red-800 font-medium">{record.fraudReason}</Text>
                      </View>

                      {/* Timestamps */}
                      <View className="space-y-1">
                        {record.checkinAt && (
                          <View className="flex-row items-center">
                            <Ionicons name="enter" size={14} color="#6B7280" />
                            <Text className="text-xs text-gray-600 ml-2">
                              Check-in: {formatDate(record.checkinAt)}
                            </Text>
                          </View>
                        )}
                        {record.checkMidAt && (
                          <View className="flex-row items-center">
                            <Ionicons name="timer" size={14} color="#6B7280" />
                            <Text className="text-xs text-gray-600 ml-2">
                              Mid-check: {formatDate(record.checkMidAt)}
                            </Text>
                          </View>
                        )}
                        {record.checkoutAt && (
                          <View className="flex-row items-center">
                            <Ionicons name="exit" size={14} color="#6B7280" />
                            <Text className="text-xs text-gray-600 ml-2">
                              Check-out: {formatDate(record.checkoutAt)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View className="p-6 border-t border-gray-200">
              <TouchableOpacity
                className="w-full py-3 bg-gray-200 rounded-lg"
                onPress={() => setShowFraudModal(false)}
              >
                <Text className="text-center text-gray-700 font-medium">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
