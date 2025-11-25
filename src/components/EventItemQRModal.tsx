import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface EventItemQRModalProps {
  visible: boolean;
  onClose: () => void;
  productId: number;
  quantity: number;
  membershipId: number;
  eventId: number;
  productName?: string;
  eventName?: string;
  memberName?: string;
}

export function EventItemQRModal({
  visible,
  onClose,
  productId,
  quantity,
  membershipId,
  eventId,
  productName = 'Product',
  eventName,
  memberName,
}: EventItemQRModalProps) {
  const [qrData, setQrData] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const qrRef = React.useRef<View>(null);

  // Generate QR data whenever modal opens or data changes
  useEffect(() => {
    if (visible) {
      generateQRData();
    }
  }, [visible, productId, quantity, membershipId, eventId, productName, eventName, memberName]);

  const generateQRData = () => {
    try {
      // Create the QR data object
      const data = {
        productId,
        quantity,
        membershipId,
        eventId,
        productName,
        eventName,
        memberName,
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(data);
      setQrData(jsonString);
    } catch (error) {
      console.error('Failed to generate QR code data:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };

  const handleCopyData = () => {
    try {
      const data = {
        productId,
        quantity,
        membershipId,
        eventId,
        productName,
        eventName,
        memberName,
      };
      Clipboard.setString(JSON.stringify(data, null, 2));
      setCopied(true);
      Alert.alert('Success', 'Order data copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy data:', error);
      Alert.alert('Error', 'Failed to copy data');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-3xl w-full max-w-md shadow-lg overflow-hidden">
          {/* Header */}
          <View className="px-6 pt-6 pb-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <View className="p-2 bg-purple-100 rounded-full">
                  <Ionicons name="qr-code" size={24} color="#9333EA" />
                </View>
                <Text className="text-xl font-bold text-gray-900">Your Order QR Code</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="p-2 rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Info */}
          <View className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-sm text-purple-600 font-medium mb-1">
                  Event Item Order
                </Text>
                <Text className="text-base font-bold text-purple-900">
                  {productName}
                </Text>
                {eventName && (
                  <Text className="text-sm text-purple-700 mt-1">
                    {eventName}
                  </Text>
                )}
              </View>
            </View>

            {/* Order Details Grid */}
            <View className="flex-row gap-2">
              <View className="flex-1 bg-white/70 p-2 rounded-lg">
                <Text className="text-xs text-gray-600">Product Name</Text>
                <Text className="text-sm font-bold text-gray-900">{productName}</Text>
              </View>
              <View className="flex-1 bg-white/70 p-2 rounded-lg">
                <Text className="text-xs text-gray-600">Quantity</Text>
                <Text className="text-sm font-bold text-gray-900">{quantity}</Text>
              </View>
              <View className="flex-1 bg-white/70 p-2 rounded-lg">
                <Text className="text-xs text-gray-600">Member Name</Text>
                <Text className="text-sm font-bold text-gray-900">{memberName}</Text>
              </View>
            </View>
          </View>

          {/* QR Code Display */}
          <View 
            ref={qrRef}
            className="py-8 bg-white items-center justify-center border-2 border-dashed border-purple-300 mx-6 my-4 rounded-lg"
          >
            {qrData ? (
              <QRCode
                value={qrData}
                size={250}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            ) : (
              <ActivityIndicator size="large" color="#9333EA" />
            )}
            
            <Text className="mt-4 text-sm text-center text-gray-600 max-w-xs px-4">
              Present this QR code at the event booth to receive your item
            </Text>
          </View>
          {/* Info Notice */}
          <View className="px-6 pb-6">
            <View className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Text className="text-xs text-blue-800">
                <Text className="font-bold">Note:</Text> This QR code contains your order information. 
                The staff at the event booth will scan it to process your redemption.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
