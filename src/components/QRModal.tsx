import { Ionicons } from '@expo/vector-icons';
import { eventQR } from '@services/event.service';
import { getCheckinUrl } from '@utils/getLocalUrl';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';

interface QRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventName: string;
  eventId?: number;
  phase?: 'START' | 'END' | 'MID';
  checkInCode?: string;
  isPublicEvent?: boolean;
}

type QRMode = 'prod' | 'dev' | 'mobile';

export default function QRModal({
  open,
  onOpenChange,
  eventName,
  eventId,
  phase = 'START',
  checkInCode,
  isPublicEvent = false,
}: QRModalProps) {
  const REFRESH_SECONDS = 120; // Updated to match API expiresIn default
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS);
  const [qrLoading, setQrLoading] = useState(false);
  const [token, setToken] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'START' | 'END' | 'MID'>(phase || 'START');
  const [qrMode, setQrMode] = useState<QRMode>('prod');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const qrSize = isFullscreen ? Math.min(screenWidth * 0.8, 400) : 220;

  // Fetch QR code with phase (for non-public events)
  const fetchQrCode = async () => {
    if (!eventId || isPublicEvent) return;
    console.log(`[QRModal] Fetching QR with eventId: ${eventId}, currentPhase: ${currentPhase}`);
    setQrLoading(true);
    setError('');
    try {
      const result = await eventQR(eventId, currentPhase);
      console.log(`[QRModal] Received QR result - phase: ${result.phase}, token: ${result.token.substring(0, 20)}..., expiresIn: ${result.expiresIn}`);
      setToken(result.token);
      // Type assertion: API returns string but we know it's one of the valid phase values
      setCurrentPhase(result.phase as 'START' | 'END' | 'MID');
      // Update refresh timer based on API response
      if (result.expiresIn) {
        setSecondsLeft(result.expiresIn);
      }
    } catch (err: any) {
      console.error('Failed to fetch QR code:', err);
      setToken('');
      setError(err?.response?.data?.message || err?.message || 'Failed to generate QR code');
      Toast.show({
        type: 'error',
        text1: 'QR Error',
        text2: err?.response?.data?.message || 'Could not generate QR code',
      });
    } finally {
      setQrLoading(false);
    }
  };

  // Initial fetch and refresh based on expiresIn
  useEffect(() => {
    if (!open) {
      setSecondsLeft(REFRESH_SECONDS);
      setToken('');
      setCurrentPhase(phase);
      setError('');
      return;
    }
    
    // For public events, use checkInCode directly
    if (isPublicEvent && checkInCode) {
      setToken(checkInCode);
      setQrLoading(false);
      return;
    }
    
    // For non-public events, fetch QR token
    if (!isPublicEvent && eventId) {
      setCurrentPhase(phase);
      fetchQrCode();
      const timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            fetchQrCode();
            return REFRESH_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventId, phase, isPublicEvent, checkInCode]);

  // Generate QR data based on mode
  const getQRValue = () => {
    if (!token) return '';
    
    let qrValue = '';
    
    // For public events, generate URL with check-in code
    if (isPublicEvent) {
      if (qrMode === 'prod') {
        qrValue = `https://uniclub.id.vn/student/checkin/public/${token}`;
      } else if (qrMode === 'mobile') {
        qrValue = `exp://192.168.1.50:8081/--/student/checkin/public/${token}`;
      } else {
        qrValue = `http://localhost:3000/student/checkin/public/${token}`;
      }
    } else {
      // For non-public events, use token and phase
      if (qrMode === 'prod') {
        // Production mode: use token directly for web check-in
        qrValue = token;
      } else if (qrMode === 'mobile') {
        // Mobile mode: generate deep link URL with token and phase
        qrValue = getCheckinUrl(token, currentPhase);
      } else {
        // Dev mode: generate local URL with token and phase
        qrValue = getCheckinUrl(token, currentPhase);
      }
    }
    
    console.log('[QR VALUE]', {
      mode: qrMode,
      isPublicEvent,
      token: token.substring(0, 20) + '...',
      qrValue: qrValue.substring(0, 60) + '...'
    });
    
    return qrValue;
  };

  const handleManualRefresh = () => {
    if (!isPublicEvent) {
      fetchQrCode();
      setSecondsLeft(REFRESH_SECONDS);
    }
  };

  // Fullscreen Modal
  if (isFullscreen) {
    return (
      <Modal
        visible={open}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsFullscreen(false)}
        statusBarTranslucent
      >
        <View className="flex-1 bg-gray-900">
          {/* Fullscreen Header */}
          <View className="pt-12 pb-6 px-6 bg-gray-800">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-xl font-bold mb-1">{eventName}</Text>
                <Text className="text-gray-400 text-sm">
                  {isPublicEvent ? 'Public Event QR Code' : `QR Code - Phase: ${currentPhase.replace('_', ' ')}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFullscreen(false)}
                className="p-2 bg-gray-700 rounded-lg"
              >
                <Ionicons name="contract" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="flex-1 justify-center items-center px-6"
          >
            {/* Environment Selector */}
            <View className="w-full mb-6">
              <View className="flex-row bg-gray-800 rounded-xl p-1">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${qrMode === 'prod' ? 'bg-teal-600' : 'bg-transparent'}`}
                  onPress={() => setQrMode('prod')}
                >
                  <Text className={`text-center font-semibold text-sm ${qrMode === 'prod' ? 'text-white' : 'text-gray-400'}`}>
                    Web
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${qrMode === 'mobile' ? 'bg-teal-600' : 'bg-transparent'}`}
                  onPress={() => setQrMode('mobile')}
                >
                  <Text className={`text-center font-semibold text-sm ${qrMode === 'mobile' ? 'text-white' : 'text-gray-400'}`}>
                    Mobile
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${qrMode === 'dev' ? 'bg-teal-600' : 'bg-transparent'}`}
                  onPress={() => setQrMode('dev')}
                >
                  <Text className={`text-center font-semibold text-sm ${qrMode === 'dev' ? 'text-white' : 'text-gray-400'}`}>
                    Dev
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* QR Code */}
            {qrLoading ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="text-gray-400 mt-4">Generating QR Code...</Text>
              </View>
            ) : token ? (
              <View className="items-center">
                <View className="bg-white p-8 rounded-3xl shadow-2xl mb-6">
                  <QRCode value={getQRValue()} size={qrSize} />
                </View>

                {/* Mode Info */}
                {qrMode === 'mobile' && (
                  <View className="bg-purple-900/50 border border-purple-500 rounded-lg p-4 mb-4 w-full">
                    <Text className="text-purple-200 text-sm font-medium mb-2">
                      📱 Mobile Deep Link
                    </Text>
                    <Text className="text-purple-300 text-xs">
                      This QR opens the mobile app for check-in
                    </Text>
                  </View>
                )}
                {qrMode === 'dev' && (
                  <View className="bg-blue-900/50 border border-blue-500 rounded-lg p-4 mb-4 w-full">
                    <Text className="text-blue-200 text-sm font-medium mb-2">
                      🔧 Development Mode
                    </Text>
                    <Text className="text-blue-300 text-xs">
                      This QR links to your local development server
                    </Text>
                  </View>
                )}
                {qrMode === 'prod' && (
                  <View className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-4 w-full">
                    <Text className="text-green-200 text-sm font-medium mb-2">
                      🌐 Web Check-in
                    </Text>
                    <Text className="text-green-300 text-xs">
                      {isPublicEvent 
                        ? 'This QR code opens the public event check-in page' 
                        : 'This QR code opens the web check-in page'}
                    </Text>
                  </View>
                )}

                {/* Countdown - only show for non-public events */}
                {!isPublicEvent && (
                  <View className="flex-row items-center bg-gray-800 px-6 py-3 rounded-full mb-4">
                    <Ionicons name="sync" size={16} color="#6B7280" />
                    <Text className="text-gray-400 ml-2">
                      Auto-refresh in{' '}
                      <Text className="text-teal-400 font-bold">{secondsLeft}s</Text>
                    </Text>
                  </View>
                )}

                {/* Manual Refresh Button - only show for non-public events */}
                {!isPublicEvent && (
                  <TouchableOpacity
                    onPress={handleManualRefresh}
                    className="bg-teal-600 px-6 py-3 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="refresh" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Refresh Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="items-center py-20">
                <Ionicons name="alert-circle-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-center mt-4">
                  {error || 'No QR code available'}
                </Text>
                <TouchableOpacity
                  onPress={handleManualRefresh}
                  className="bg-teal-600 px-6 py-3 rounded-lg mt-6"
                >
                  <Text className="text-white font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Fullscreen Footer */}
          <View className="p-6 bg-gray-800 border-t border-gray-700">
            <TouchableOpacity
              className="bg-gray-700 rounded-lg px-6 py-4 flex-row items-center justify-center"
              onPress={() => {
                setIsFullscreen(false);
                onOpenChange(false);
              }}
            >
              <Ionicons name="close" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Regular Modal
  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      onRequestClose={() => onOpenChange(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/80 px-4">
        <View className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <View className="bg-teal-600 p-6">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-white text-xl font-bold mb-1">Event QR Code</Text>
                <Text className="text-white text-sm" numberOfLines={2}>
                  {eventName}
                </Text>
                {!isPublicEvent && (
                  <View className="mt-2 bg-white/20 px-3 py-1 rounded-full self-start">
                    <Text className="text-white text-xs font-semibold">
                      Phase: {currentPhase.replace('_', ' ')}
                    </Text>
                  </View>
                )}
                {isPublicEvent && (
                  <View className="mt-2 bg-white/20 px-3 py-1 rounded-full self-start">
                    <Text className="text-white text-xs font-semibold">
                      Public Event
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setIsFullscreen(true)}
                className="bg-white/20 p-2 rounded-lg"
              >
                <Ionicons name="expand" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="p-6">
            {/* Environment Tabs */}
            <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${qrMode === 'prod' ? 'bg-teal-600 shadow-sm' : 'bg-transparent'}`}
                onPress={() => {
                  console.log('[QR MODAL] Switching to PROD mode');
                  setQrMode('prod');
                }}
                activeOpacity={0.7}
              >
                <Text className={`text-center font-semibold text-xs ${qrMode === 'prod' ? 'text-white' : 'text-gray-600'}`}>
                  Web
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${qrMode === 'mobile' ? 'bg-teal-600 shadow-sm' : 'bg-transparent'}`}
                onPress={() => {
                  console.log('[QR MODAL] Switching to MOBILE mode');
                  setQrMode('mobile');
                }}
                activeOpacity={0.7}
              >
                <Text className={`text-center font-semibold text-xs ${qrMode === 'mobile' ? 'text-white' : 'text-gray-600'}`}>
                  Mobile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${qrMode === 'dev' ? 'bg-teal-600 shadow-sm' : 'bg-transparent'}`}
                onPress={() => {
                  console.log('[QR MODAL] Switching to DEV mode');
                  setQrMode('dev');
                }}
                activeOpacity={0.7}
              >
                <Text className={`text-center font-semibold text-xs ${qrMode === 'dev' ? 'text-white' : 'text-gray-600'}`}>
                  Dev
                </Text>
              </TouchableOpacity>
            </View>

            {/* QR Code Display */}
            {qrLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color="#0D9488" />
                <Text className="text-gray-500 mt-4">Generating...</Text>
              </View>
            ) : token ? (
              <View className="items-center">
                {/* QR Code */}
                <View className="bg-white border-4 border-dashed border-gray-200 rounded-2xl p-6 mb-4">
                  <QRCode value={getQRValue()} size={qrSize} />
                </View>

                {/* Mode Info */}
                {qrMode === 'mobile' && (
                  <View className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3 w-full">
                    <Text className="text-xs text-purple-900 font-medium mb-1">
                      📱 Mobile Deep Link
                    </Text>
                    <Text className="text-xs text-purple-700">
                      Opens mobile app for check-in
                    </Text>
                  </View>
                )}
                {qrMode === 'dev' && (
                  <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 w-full">
                    <Text className="text-xs text-blue-900 font-medium mb-1">
                      🔧 Development Mode
                    </Text>
                    <Text className="text-xs text-blue-700">
                      QR links to local development server
                    </Text>
                  </View>
                )}
                {qrMode === 'prod' && (
                  <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 w-full">
                    <Text className="text-xs text-green-900 font-medium mb-1">
                      🌐 Web Check-in
                    </Text>
                    <Text className="text-xs text-green-700">
                      {isPublicEvent 
                        ? 'QR opens public event check-in page' 
                        : 'QR opens web check-in page'}
                    </Text>
                  </View>
                )}

                {/* Countdown Timer - only show for non-public events */}
                {!isPublicEvent && (
                  <View className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full mb-3">
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-2">
                      Refreshing in{' '}
                      <Text className="font-bold text-teal-600">{secondsLeft}s</Text>
                    </Text>
                  </View>
                )}

                {/* Refresh Button - only show for non-public events */}
                {!isPublicEvent && (
                  <TouchableOpacity
                    onPress={handleManualRefresh}
                    className="flex-row items-center justify-center bg-gray-100 px-4 py-2 rounded-lg mb-2"
                  >
                    <Ionicons name="refresh" size={16} color="#0D9488" />
                    <Text className="text-teal-600 font-medium ml-2 text-sm">
                      Refresh Now
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="items-center py-10">
                <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-400 text-center mt-3">
                  {error || 'No QR code available'}
                </Text>
                <TouchableOpacity
                  onPress={handleManualRefresh}
                  className="bg-teal-600 px-4 py-2 rounded-lg mt-4"
                >
                  <Text className="text-white font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer */}
          <View className="p-4 bg-gray-50 border-t border-gray-200">
            <TouchableOpacity
              className="bg-teal-600 rounded-lg px-6 py-3 flex-row items-center justify-center"
              onPress={() => onOpenChange(false)}
            >
              <Text className="text-white font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
