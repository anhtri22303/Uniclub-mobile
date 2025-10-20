import { generateCode } from '@services/checkin.service';
import { getCheckinUrl } from '@utils/getLocalUrl';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventName: string;
  eventId?: number;
}

type QRMode = 'prod' | 'dev';

export default function QRModal({
  open,
  onOpenChange,
  eventName,
  eventId,
}: QRModalProps) {
  const REFRESH_SECONDS = 30;
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS);
  const [qrLoading, setQrLoading] = useState(false);
  const [token, setToken] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [qrMode, setQrMode] = useState<QRMode>('prod');

  // Fetch QR code
  const fetchQrCode = async () => {
    if (!eventId) return;
    setQrLoading(true);
    try {
      const { token, qrUrl } = await generateCode(eventId);
      setToken(token);
      setQrUrl(qrUrl);
    } catch (err) {
      setToken('');
      setQrUrl('');
    } finally {
      setQrLoading(false);
    }
  };

  // Initial fetch and refresh every 30s
  useEffect(() => {
    if (!open || !eventId) {
      setSecondsLeft(REFRESH_SECONDS);
      setToken('');
      setQrUrl('');
      return;
    }
    fetchQrCode();
    setSecondsLeft(REFRESH_SECONDS);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventId]);

  // Generate QR data based on mode
  const getQRValue = () => {
    if (qrMode === 'prod') {
      return qrUrl || token;
    } else {
      // Dev mode: generate local URL with token
      return getCheckinUrl(token);
    }
  };

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      onRequestClose={() => onOpenChange(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/80">
        <View className="w-full max-w-md bg-white rounded-xl p-6 shadow-lg items-center">
          <Text className="text-lg font-bold mb-2">Event QR Code</Text>
          <Text className="text-gray-700 mb-4">{eventName}</Text>
          
          {/* Tab Switcher */}
          <View className="flex-row w-full mb-4 bg-gray-100 rounded-lg p-1">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-md ${qrMode === 'prod' ? 'bg-teal-600' : 'bg-transparent'}`}
              onPress={() => setQrMode('prod')}
            >
              <Text className={`text-center font-semibold ${qrMode === 'prod' ? 'text-white' : 'text-gray-600'}`}>
                Production
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-md ${qrMode === 'dev' ? 'bg-teal-600' : 'bg-transparent'}`}
              onPress={() => setQrMode('dev')}
            >
              <Text className={`text-center font-semibold ${qrMode === 'dev' ? 'text-white' : 'text-gray-600'}`}>
                Development
              </Text>
            </TouchableOpacity>
          </View>

          {/* QR Code Display */}
          {qrLoading ? (
            <ActivityIndicator size="large" color="#0D9488" />
          ) : token ? (
            <>
              <View style={{ marginVertical: 12 }}>
                <QRCode value={getQRValue()} size={200} />
              </View>
              
              {/* Mode Info */}
              {qrMode === 'dev' && (
                <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 w-full">
                  <Text className="text-xs text-blue-900 font-medium mb-1">📱 Development Mode</Text>
                  <Text className="text-xs text-blue-700">
                    This QR links to your local app: /student/checkin/{token.substring(0, 10)}...
                  </Text>
                </View>
              )}
              
              <Text className="text-center text-gray-500 mb-2">
                QR code will refresh in <Text className="font-bold text-teal-600">{secondsLeft}s</Text>
              </Text>
            </>
          ) : (
            <Text className="text-gray-400 text-center">No QR code available</Text>
          )}
          
          <TouchableOpacity
            className="mt-2 bg-teal-600 rounded-lg px-6 py-2"
            onPress={() => onOpenChange(false)}
          >
            <Text className="text-white font-medium">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
