import { Ionicons } from '@expo/vector-icons';
import { redeemEventProduct, RedeemPayload } from '@services/redeem.service';
import { useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

interface ScannedData {
  productId: number;
  quantity: number;
  membershipId: number;
  eventId: number;
  productName?: string;
  eventName?: string;
  memberName?: string;
}

// Query key
export const queryKeys = {
  eventOrders: (clubId: number) => ['eventOrders', clubId] as const,
};

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = width * 0.7;

export default function EventOrderScannerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Request camera permission on mount
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Handle barcode scan
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      const parsedData = JSON.parse(data);

      if (
        typeof parsedData.productId === 'number' &&
        typeof parsedData.quantity === 'number' &&
        typeof parsedData.membershipId === 'number' &&
        typeof parsedData.eventId === 'number'
      ) {
        setScannedData(parsedData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'QR Code scanned successfully!',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invalid QR code format',
        });
        setScanned(false);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not parse QR code data',
      });
      setScanned(false);
    }
  };

  // Handle accept redemption
  const handleAccept = async () => {
    if (!scannedData) return;

    setIsProcessing(true);

    try {
      const payload: RedeemPayload = {
        productId: scannedData.productId,
        quantity: scannedData.quantity,
        membershipId: scannedData.membershipId,
      };

      await redeemEventProduct(scannedData.eventId, payload);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Redemption successful!',
      });

      // Invalidate cache to refresh order list
      queryClient.invalidateQueries({ queryKey: ['eventOrders'] });

      // Navigate back
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to process redemption',
      });
      setScannedData(null);
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle rescan
  const handleRescan = () => {
    setScannedData(null);
    setScanned(false);
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  // Permission not granted
  if (!permission || !permission.granted) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <View className="bg-white rounded-2xl p-8 items-center shadow-lg">
          <View className="bg-red-100 rounded-full p-4 mb-4">
            <Ionicons name="camera" size={48} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Camera Permission Required
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Please grant camera access to scan QR codes
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-teal-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCancel} className="mt-4">
            <Text className="text-gray-600">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent pt-12 pb-6 px-6">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleCancel}
            className="bg-white/20 rounded-full p-2"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          {/* <Text className="text-white text-lg font-bold">Scan Event Order QR</Text> */}
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Camera View */}
      {!scannedData && (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Scan Box Overlay */}
          <View className="flex-1 items-center justify-center">
            {/* Top Dark Overlay */}
            <View className="absolute top-0 left-0 right-0 bg-black/50" style={{ height: (Dimensions.get('window').height - SCAN_BOX_SIZE) / 2 }} />
            
            {/* Bottom Dark Overlay */}
            <View className="absolute bottom-0 left-0 right-0 bg-black/50" style={{ height: (Dimensions.get('window').height - SCAN_BOX_SIZE) / 2 }} />
            
            {/* Left Dark Overlay */}
            <View className="absolute bg-black/50" style={{ 
              top: (Dimensions.get('window').height - SCAN_BOX_SIZE) / 2,
              left: 0,
              width: (width - SCAN_BOX_SIZE) / 2,
              height: SCAN_BOX_SIZE 
            }} />
            
            {/* Right Dark Overlay */}
            <View className="absolute bg-black/50" style={{ 
              top: (Dimensions.get('window').height - SCAN_BOX_SIZE) / 2,
              right: 0,
              width: (width - SCAN_BOX_SIZE) / 2,
              height: SCAN_BOX_SIZE 
            }} />

            {/* Scan Box */}
            <View
              style={{ width: SCAN_BOX_SIZE, height: SCAN_BOX_SIZE }}
              className="border-2 border-teal-500 rounded-2xl"
            >
              {/* Corner Decorations */}
              <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
              <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
              <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
              <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
            </View>

            {/* Instruction */}
            <View className="absolute bottom-0 left-0 right-0 pb-20 items-center">
              <View className="bg-black/70 rounded-2xl px-6 py-4">
                <Text className="text-white text-center font-semibold">
                  Position the QR code within the frame
                </Text>
                <Text className="text-white/70 text-sm text-center mt-1">
                  The code will be scanned automatically
                </Text>
              </View>
            </View>
          </View>
        </CameraView>
      )}

      {/* Scanned Data Modal */}
      {scannedData && (
        <View className="flex-1 bg-gray-50 p-6">
          {/* Success Header */}
          <View className="bg-green-100 rounded-2xl p-6 mb-6 border-2 border-green-300">
            <View className="flex-row items-center">
              <View className="bg-green-600 rounded-full p-3">
                <Ionicons name="checkmark-circle" size={32} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#065F46' }}>
                  QR Code Scanned
                </Text>
                <Text style={{ fontSize: 14, color: '#047857', marginTop: 4 }}>
                  Review the order details below
                </Text>
              </View>
            </View>
          </View>

          {/* Order Information */}
          <View className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <View className="bg-indigo-600 p-4">
              <View className="flex-row items-center">
                <Ionicons name="qr-code" size={24} color="white" />
                <Text className="text-white text-lg font-bold ml-3">
                  Order Information
                </Text>
              </View>
            </View>

            <View className="p-4 space-y-3">
              {/* Product Name */}
              <View className="bg-purple-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="cube" size={16} color="#9333EA" />
                  <Text className="text-xs font-semibold text-purple-700 uppercase ml-2">
                    Product Name
                  </Text>
                </View>
                <Text className="text-base font-bold text-gray-900">
                  {scannedData.productName || `#${scannedData.productId}`}
                </Text>
              </View>

              {/* Quantity */}
              <View className="bg-blue-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="layers" size={16} color="#3B82F6" />
                  <Text className="text-xs font-semibold text-blue-700 uppercase ml-2">
                    Quantity
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900">
                  {scannedData.quantity}
                </Text>
              </View>

              {/* Member Name */}
              <View className="bg-green-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="person" size={16} color="#10B981" />
                  <Text className="text-xs font-semibold text-green-700 uppercase ml-2">
                    Member Name
                  </Text>
                </View>
                <Text className="text-base font-bold text-gray-900">
                  {scannedData.memberName || `#${scannedData.membershipId}`}
                </Text>
              </View>

              {/* Event Name */}
              <View className="bg-orange-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="calendar" size={16} color="#F97316" />
                  <Text className="text-xs font-semibold text-orange-700 uppercase ml-2">
                    Event Name
                  </Text>
                </View>
                <Text className="text-base font-bold text-gray-900">
                  {scannedData.eventName || `#${scannedData.eventId}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleRescan}
              disabled={isProcessing}
              className="flex-1 bg-gray-300 rounded-xl py-4 items-center"
            >
              <View className="flex-row items-center">
                <Ionicons name="camera" size={20} color="#1F2937" />
                <Text className="text-gray-900 font-semibold ml-2">Scan Again</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAccept}
              disabled={isProcessing}
              className="flex-1 bg-green-600 rounded-xl py-4 items-center shadow-lg"
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Accept & Redeem</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
