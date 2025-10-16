import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MajorSelectorProps {
  selectedMajor: string;
  onMajorSelect: (major: string) => void;
  placeholder?: string;
}

const majorOptions = [
  'Software Engineering',
  'Artificial Intelligence',
  'Information Assurance',
  'Data Science',
  'Business Administration',
  'Digital Marketing',
  'Graphic Design',
  'Multimedia Communication',
  'Hospitality Management',
  'International Business',
  'Finance and Banking',
  'Japanese Language',
  'Korean Language',
];

export default function MajorSelector({
  selectedMajor,
  onMajorSelect,
  placeholder = 'Select your major',
}: MajorSelectorProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = (major: string) => {
    onMajorSelect(major);
    setIsVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
      >
        <Text className={`text-base ${selectedMajor ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedMajor || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-96">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">Select Major</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Major List */}
            <ScrollView className="flex-1">
              <FlatList
                data={majorOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className="px-4 py-4 border-b border-gray-100 flex-row items-center justify-between"
                  >
                    <Text className="text-base text-gray-900">{item}</Text>
                    {selectedMajor === item && (
                      <Ionicons name="checkmark" size={20} color="#0D9488" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
