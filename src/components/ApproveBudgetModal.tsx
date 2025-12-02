import { Ionicons } from '@expo/vector-icons';
import { putEventStatus } from '@services/event.service';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AppTextInput } from './ui';

// Point allocation policies
const POINT_POLICIES = [
  {
    icon: 'people',
    title: 'Event Scale',
    items: [
      { label: 'Small (< 50 attendees)', points: '500 - 1,000 pts' },
      { label: 'Medium (50-150 attendees)', points: '1,000 - 3,000 pts' },
      { label: 'Large (> 150 attendees)', points: '3,000 - 5,000 pts' },
    ]
  },
  {
    icon: 'location',
    title: 'Venue Type',
    items: [
      { label: 'Campus Indoor', points: '+0 pts' },
      { label: 'Campus Outdoor', points: '+200 pts' },
      { label: 'Off-campus Venue', points: '+500 - 1,000 pts' },
    ]
  },
  {
    icon: 'trophy',
    title: 'Event Type',
    items: [
      { label: 'Workshop/Seminar', points: 'Standard rate' },
      { label: 'Competition/Contest', points: '+500 pts' },
      { label: 'Festival/Fair', points: '+1,000 pts' },
    ]
  }
];

interface ApproveBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: number;
  hostClubName?: string;
  defaultRequestPoints?: number;
  onApproved?: (approvedBudgetPoints: number) => void;
}

export default function ApproveBudgetModal({
  visible,
  onClose,
  eventId,
  hostClubName,
  defaultRequestPoints = 0,
  onApproved
}: ApproveBudgetModalProps) {
  const [approvedPointsInput, setApprovedPointsInput] = useState<string>('');
  const [policyChecked, setPolicyChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setApprovedPointsInput(String(defaultRequestPoints || 0));
      setPolicyChecked(false);
    }
  }, [visible, defaultRequestPoints]);

  const approvedPoints = Number(approvedPointsInput) || 0;

  const handleApprove = async () => {
    if (!policyChecked) {
      Alert.alert('Error', 'Please confirm that you have read the scoring policy');
      return;
    }

    if (approvedPoints <= 0) {
      Alert.alert('Error', 'Please enter a valid point amount');
      return;
    }

    setSubmitting(true);
    try {
      await putEventStatus(eventId, approvedPoints);
      Alert.alert('Success', `Approved ${approvedPoints.toLocaleString()} pts for ${hostClubName || 'club'}`);
      onApproved?.(approvedPoints);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Could not approve budget');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-2xl max-h-[90%] overflow-hidden">
          {/* Header */}
          <View className="bg-emerald-600 p-4 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">Approve Event Budget</Text>
              <Text className="text-white/80 text-sm mt-1">
                Club: {hostClubName || 'N/A'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            {/* Approval Form */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-800 mb-2">
                Approved Budget Points
              </Text>
              <AppTextInput
                value={approvedPointsInput}
                onChangeText={(text) => {
                  if (text === '' || /^\d+$/.test(text)) {
                    setApprovedPointsInput(text);
                  }
                }}
                keyboardType="numeric"
                placeholder="0"
                className="border-2 border-gray-300 rounded-xl p-4 text-lg bg-gray-50"
              />
              <Text className="text-sm text-gray-500 mt-2">
                Enter the approved budget points for this event
              </Text>
            </View>

            {/* Point Allocation Guidelines */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="information-circle" size={20} color="#10B981" />
                <Text className="text-base font-semibold text-gray-800 ml-2">
                  Point Allocation Guidelines
                </Text>
              </View>

              {POINT_POLICIES.map((policy, idx) => (
                <View key={idx} className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name={policy.icon as any} size={16} color="#10B981" />
                    <Text className="text-sm font-semibold text-gray-800 ml-2">
                      {policy.title}
                    </Text>
                  </View>
                  {policy.items.map((item, itemIdx) => (
                    <View key={itemIdx} className="flex-row justify-between items-center py-1">
                      <Text className="text-xs text-gray-600 flex-1">{item.label}</Text>
                      <Text className="text-xs font-semibold text-emerald-600">
                        {item.points}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* Policy Confirmation Checkbox */}
            <TouchableOpacity
              onPress={() => setPolicyChecked(!policyChecked)}
              className="flex-row items-start bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4"
            >
              <View className={`w-6 h-6 rounded border-2 ${policyChecked ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-gray-300'} items-center justify-center mr-3 mt-0.5`}>
                {policyChecked && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text className="text-xs text-gray-700 flex-1">
                I confirm that I have read and understood the entire scoring policy above.
              </Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
                className="flex-1 bg-gray-200 py-3 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApprove}
                disabled={submitting || approvedPointsInput === '' || !policyChecked}
                className={`flex-1 py-3 rounded-xl items-center ${
                  submitting || approvedPointsInput === '' || !policyChecked
                    ? 'bg-gray-300'
                    : 'bg-emerald-600'
                }`}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Approve Budget</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
