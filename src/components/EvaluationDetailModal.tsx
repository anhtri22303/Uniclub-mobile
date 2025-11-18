import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface StaffEvaluation {
  id: number;
  eventStaffId: number;
  membershipId: number;
  eventId: number;
  performance: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
  note: string;
  createdAt: string;
}

interface StaffWithEvaluation {
  memberName: string;
  memberEmail?: string;
  duty: string;
  evaluation: StaffEvaluation;
}

interface EvaluationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  evaluations: StaffWithEvaluation[];
  eventName: string;
}

const performanceConfig = {
  POOR: {
    label: 'Poor',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    darkBgColor: '#7F1D1D',
    icon: 'sad-outline',
  },
  AVERAGE: {
    label: 'Average',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    darkBgColor: '#78350F',
    icon: 'remove-circle-outline',
  },
  GOOD: {
    label: 'Good',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    darkBgColor: '#1E3A8A',
    icon: 'thumbs-up-outline',
  },
  EXCELLENT: {
    label: 'Excellent',
    color: '#10B981',
    bgColor: '#D1FAE5',
    darkBgColor: '#064E3B',
    icon: 'trophy-outline',
  },
};

const EvaluationDetailModal: React.FC<EvaluationDetailModalProps> = ({
  visible,
  onClose,
  evaluations,
  eventName,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPerformanceStats = () => {
    const stats = {
      POOR: 0,
      AVERAGE: 0,
      GOOD: 0,
      EXCELLENT: 0,
    };

    evaluations.forEach((item) => {
      stats[item.evaluation.performance]++;
    });

    return stats;
  };

  const stats = getPerformanceStats();
  const totalEvaluations = evaluations.length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white dark:bg-gray-800 rounded-2xl w-11/12 max-w-2xl max-h-5/6">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">Staff Evaluations</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">{eventName}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Performance Statistics */}
            <View className="p-6 border-b border-gray-200 dark:border-gray-700">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Performance Overview</Text>
              <View className="flex-row flex-wrap gap-3">
                {Object.entries(performanceConfig).map(([key, config]) => {
                  const count = stats[key as keyof typeof stats];
                  const percentage = totalEvaluations > 0 ? ((count / totalEvaluations) * 100).toFixed(0) : 0;
                  return (
                    <View
                      key={key}
                      className="flex-1 min-w-[45%] p-4 rounded-lg"
                      style={{ backgroundColor: config.bgColor }}
                    >
                      <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons name={config.icon as any} size={20} color={config.color} />
                        <Text className="font-semibold" style={{ color: config.color }}>
                          {config.label}
                        </Text>
                      </View>
                      <Text className="text-2xl font-bold" style={{ color: config.color }}>
                        {count}
                      </Text>
                      <Text className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</Text>
                    </View>
                  );
                })}
              </View>
              <View className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Text className="text-sm text-blue-800 dark:text-blue-200">
                  Total Evaluations: <Text className="font-semibold">{totalEvaluations}</Text>
                </Text>
              </View>
            </View>

            {/* Evaluation List */}
            <View className="p-6 space-y-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Individual Evaluations</Text>
              {evaluations.length === 0 ? (
                <View className="p-8 items-center">
                  <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">
                    No evaluations available for this event.
                  </Text>
                </View>
              ) : (
                evaluations.map((item, index) => {
                  const config = performanceConfig[item.evaluation.performance];
                  return (
                    <View
                      key={item.evaluation.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      {/* Staff Info */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="font-semibold text-gray-900 dark:text-white">{item.memberName}</Text>
                          {item.memberEmail && (
                            <Text className="text-sm text-gray-600 dark:text-gray-400">{item.memberEmail}</Text>
                          )}
                          <View className="flex-row items-center gap-2 mt-1">
                            <Ionicons name="briefcase-outline" size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600 dark:text-gray-400">{item.duty}</Text>
                          </View>
                        </View>
                        <View
                          className="px-3 py-1 rounded-full flex-row items-center gap-1"
                          style={{ backgroundColor: config.bgColor }}
                        >
                          <Ionicons name={config.icon as any} size={16} color={config.color} />
                          <Text className="font-semibold text-sm" style={{ color: config.color }}>
                            {config.label}
                          </Text>
                        </View>
                      </View>

                      {/* Evaluation Note */}
                      <View className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Text className="text-sm text-gray-700 dark:text-gray-300">{item.evaluation.note}</Text>
                      </View>

                      {/* Timestamp */}
                      <View className="flex-row items-center gap-1 mt-2">
                        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Evaluated on {formatDate(item.evaluation.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-6 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity className="w-full py-3 bg-gray-200 dark:bg-gray-700 rounded-lg" onPress={onClose}>
              <Text className="text-center text-gray-700 dark:text-gray-300 font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EvaluationDetailModal;
