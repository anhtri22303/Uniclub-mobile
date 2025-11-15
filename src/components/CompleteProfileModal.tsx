import { Ionicons } from '@expo/vector-icons';
import { Major, MajorService } from '@services/major.service';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CompleteProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: { studentCode: string; majorId: number }) => Promise<void>;
  currentStudentCode?: string;
  currentMajorName?: string;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  visible,
  onClose,
  onComplete,
  currentStudentCode = '',
  currentMajorName = '',
}) => {
  const [studentCode, setStudentCode] = useState(currentStudentCode);
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentCodeError, setStudentCodeError] = useState<string | null>(null);

  // Load majors when modal opens
  useEffect(() => {
    if (visible) {
      loadMajors();
    }
  }, [visible]);

  // Set initial values when modal opens
  useEffect(() => {
    if (visible) {
      setStudentCode(currentStudentCode);
      
      // Find and select the current major if it exists
      if (currentMajorName && majors.length > 0) {
        const currentMajor = majors.find(m => m.name === currentMajorName);
        if (currentMajor) {
          setSelectedMajorId(currentMajor.id);
        }
      }
    }
  }, [visible, currentStudentCode, currentMajorName, majors]);

  const loadMajors = async () => {
    try {
      setLoading(true);
      const allMajors = await MajorService.fetchMajors();
      
      // Filter only active majors for new profile completion
      const activeMajors = allMajors.filter(m => m.active);
      
      setMajors(activeMajors);
    } catch (error) {
      console.error('Failed to load majors:', error);
      Alert.alert('Error', 'Failed to load majors list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateStudentCode = (code: string): string | null => {
    if (!code || code.trim() === '') {
      return 'Student code is required';
    }

    // Format: 2 letters followed by 6 numbers (e.g., SE000001)
    const pattern = /^[A-Za-z]{2}\d{6}$/;

    if (code.length !== 8) {
      return 'Student code must be exactly 8 characters';
    }

    if (!pattern.test(code)) {
      return 'Format: 2 letters + 6 numbers (e.g., SE000001)';
    }

    return null;
  };

  const handleStudentCodeChange = (text: string) => {
    const upperText = text.toUpperCase();
    setStudentCode(upperText);

    // Validate on change
    const error = validateStudentCode(upperText);
    setStudentCodeError(error);
  };

  const handleSubmit = async () => {
    // Validate student code
    const codeError = validateStudentCode(studentCode);
    if (codeError) {
      setStudentCodeError(codeError);
      Alert.alert('Validation Error', codeError);
      return;
    }

    // Validate major selection
    if (!selectedMajorId) {
      Alert.alert('Validation Error', 'Please select your major');
      return;
    }

    try {
      setSubmitting(true);
      await onComplete({
        studentCode,
        majorId: selectedMajorId,
      });
      
      // Modal will be closed by parent component after successful completion
    } catch (error) {
      console.error('Failed to complete profile:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to complete profile. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
          {/* Header */}
          <View className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="school" size={28} color="white" />
                <Text className="text-white text-xl font-bold ml-3">
                  Complete Your Profile
                </Text>
              </View>
            </View>
            <Text className="text-white/90 text-sm mt-2">
              Please provide your student information to continue
            </Text>
          </View>

          {/* Content */}
          <ScrollView className="p-6 max-h-96">
            {loading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="text-gray-600 mt-4">Loading majors...</Text>
              </View>
            ) : (
              <>
                {/* Student Code Input */}
                <View className="mb-6">
                  <Text className="text-gray-700 font-semibold mb-2">
                    Student Code <Text className="text-red-500">*</Text>
                  </Text>
                  <View
                    className={`flex-row items-center border rounded-xl px-4 py-3 ${
                      studentCodeError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <Ionicons
                      name="card"
                      size={20}
                      color={studentCodeError ? '#EF4444' : '#6B7280'}
                    />
                    <TextInput
                      value={studentCode}
                      onChangeText={handleStudentCodeChange}
                      placeholder="SE000001"
                      placeholderTextColor="#9CA3AF"
                      maxLength={8}
                      autoCapitalize="characters"
                      className="flex-1 ml-3 text-gray-800 text-base"
                    />
                  </View>
                  {studentCodeError && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="alert-circle" size={14} color="#EF4444" />
                      <Text className="text-red-500 text-xs ml-1">
                        {studentCodeError}
                      </Text>
                    </View>
                  )}
                  {!studentCodeError && studentCode && (
                    <Text className="text-gray-500 text-xs mt-1">
                      Format: 2 letters + 6 numbers
                    </Text>
                  )}
                </View>

                {/* Major Selection */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-3">
                    Select Your Major <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="space-y-2">
                    {majors.map((major) => (
                      <TouchableOpacity
                        key={major.id}
                        onPress={() => setSelectedMajorId(major.id)}
                        className={`flex-row items-center justify-between p-4 rounded-xl border-2 ${
                          selectedMajorId === major.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <View className="flex-1 flex-row items-center">
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: major.colorHex || '#6366F1' }}
                          >
                            <Ionicons name="school" size={20} color="white" />
                          </View>
                          <View className="flex-1">
                            <Text
                              className={`font-semibold ${
                                selectedMajorId === major.id
                                  ? 'text-indigo-700'
                                  : 'text-gray-800'
                              }`}
                            >
                              {major.name}
                            </Text>
                            {major.description && (
                              <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                                {major.description}
                              </Text>
                            )}
                          </View>
                        </View>
                        {selectedMajorId === major.id && (
                          <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  {majors.length === 0 && !loading && (
                    <Text className="text-gray-500 text-center py-4">
                      No majors available
                    </Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="p-6 border-t border-gray-200">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || loading || !studentCode || !selectedMajorId}
              className={`py-4 rounded-xl ${
                submitting || loading || !studentCode || !selectedMajorId
                  ? 'bg-gray-300'
                  : 'bg-indigo-600'
              }`}
            >
              {submitting ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Saving...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Complete Profile
                </Text>
              )}
            </TouchableOpacity>
            <Text className="text-gray-500 text-xs text-center mt-3">
              You must complete your profile to continue using the app
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};
