import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PhaseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPhase: (phase: 'START' | 'END' | 'MID') => void;
  eventName: string;
}

type Phase = {
  value: 'START' | 'END' | 'MID';
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
};

const PHASES: Phase[] = [
  {
    value: 'START',
    label: 'Start (Check-In)',
    description: 'Generate QR code for event check-in',
    icon: 'enter-outline',
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  {
    value: 'END',
    label: 'End (Check-Out)',
    description: 'Generate QR code for event check-out',
    icon: 'exit-outline',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    value: 'MID',
    label: 'Mid (Attendance)',
    description: 'Generate QR code for attendance tracking',
    icon: 'people-outline',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
];

export default function PhaseSelectionModal({
  visible,
  onClose,
  onSelectPhase,
  eventName,
}: PhaseSelectionModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl shadow-2xl">
          {/* Header */}
          <View className="p-6 border-b border-gray-200">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xl font-bold text-gray-900">Select QR Phase</Text>
              <TouchableOpacity
                onPress={onClose}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-600 text-sm" numberOfLines={2}>
              {eventName}
            </Text>
          </View>

          {/* Phase Options */}
          <View className="p-4">
            {PHASES.map((phase) => (
              <TouchableOpacity
                key={phase.value}
                onPress={() => {
                  onSelectPhase(phase.value);
                  onClose();
                }}
                className="mb-3 rounded-xl border-2 border-gray-200 overflow-hidden active:opacity-70"
                style={{ borderColor: phase.color + '40' }}
              >
                <View className="flex-row items-center p-4">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: phase.bgColor }}
                  >
                    <Ionicons name={phase.icon} size={24} color={phase.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      {phase.label}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {phase.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <View className="p-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 rounded-xl py-4 items-center"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

