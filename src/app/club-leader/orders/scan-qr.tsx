import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Services
import { RedeemOrder } from '@services/redeem.service';

// Components
import Sidebar from '@components/navigation/Sidebar';
import { useAuthStore } from '@stores/auth.store';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function ScanOrderQRPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isValidOrder, setIsValidOrder] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<RedeemOrder | null>(null);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isProcessingRef.current = false;
    };
  }, []);

  // Handle barcode scanned
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Prevent multiple scans
    if (isProcessingRef.current) {
      return;
    }
    
    // Find pattern UC-number (case insensitive)
    const trimmedText = data.trim();
    const orderCodeMatch = trimmedText.match(/(?:Order Code:\s*)?(UC-\d+)/i);
    
    if (orderCodeMatch) {
      const orderCode = orderCodeMatch[1].toUpperCase(); // e.g., "UC-5"
      
      // Check first 2 characters are "UC"
      if (orderCode.substring(0, 2).toUpperCase() === 'UC') {
        // Set processing flag
        isProcessingRef.current = true;
        
        setScannedCode(orderCode);
        setIsValidOrder(true);
        setScanning(false);
        
        // Cleanup state trước khi navigate
        setLoading(false);
        setScanning(false);
        
        // Navigate to new qr/[orderCode].tsx route
        setTimeout(() => {
          const targetRoute = `/club-leader/orders/qr/${orderCode}`;
          router.replace(targetRoute as any);
        }, 100);
      } else {
        // Invalid prefix, tiếp tục scan
        isProcessingRef.current = false;
      }
    } else {
      // Không tìm thấy pattern UC, tiếp tục scan
      isProcessingRef.current = false;
    }
  };

  const resetScan = () => {
    setScannedCode(null);
    setIsValidOrder(null);
    setOrderData(null);
    isProcessingRef.current = false;
    setScanning(true);
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        console.log(' Camera permission denied');
        return;
      }
    }
    resetScan();
  };

  // Handle permission not granted
  if (!permission) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <Sidebar role={user?.role} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Sidebar role={user?.role} />
        
        <LinearGradient
          colors={['#8B5CF6', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pt-12 pb-6"
        >
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white">Scan QR Code</Text>
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="camera-outline" size={80} color="#8B5CF6" />
          <Text className="text-xl font-bold text-gray-800 mt-6 text-center">
            Camera Permission Required
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            We need access to your camera to scan QR codes
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="mt-6 bg-purple-600 px-8 py-4 rounded-xl"
          >
            <Text className="text-white font-bold text-base">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#E2E2EF' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <Sidebar role={user?.role} />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-12 pb-6"
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">Scan Order QR</Text>
            <Text className="text-white/90 text-sm mt-1">
              Scan member's QR code to verify order
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-1 px-4 py-6">
        {/* Camera View */}
        {scanning ? (
          <View className="flex-1 bg-black rounded-2xl overflow-hidden" style={{ maxHeight: 500 }}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            >
              <View style={styles.overlay}>
                {/* Top overlay */}
                <View style={styles.overlayTop} />
                
                {/* Middle row with scan area */}
                <View style={styles.overlayMiddle}>
                  <View style={styles.overlaySide} />
                  
                  {/* Scan area */}
                  <View style={styles.scanArea}>
                    {/* Corner indicators */}
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                    
                    {/* Scanning line animation */}
                    <View style={styles.scanLineContainer}>
                      <View style={styles.scanLine} />
                    </View>
                  </View>
                  
                  <View style={styles.overlaySide} />
                </View>
                
                {/* Bottom overlay with instructions */}
                <View style={styles.overlayBottom}>
                  <View className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mx-4">
                    <Text className="text-white text-center font-semibold text-base">
                      Position the QR code within the frame
                    </Text>
                  </View>
                </View>
              </View>
            </CameraView>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center bg-white rounded-2xl shadow-lg p-8">
            {loading ? (
              <View className="items-center">
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text className="text-gray-600 mt-4 text-base">Loading order...</Text>
              </View>
            ) : scannedCode ? (
              <View className="items-center w-full">
                {/* Result Icon */}
                <View
                  className={`p-6 rounded-full mb-6 ${
                    isValidOrder ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <Ionicons
                    name={isValidOrder ? 'checkmark-circle' : 'close-circle'}
                    size={64}
                    color={isValidOrder ? '#10B981' : '#EF4444'}
                  />
                </View>

                {/* Result Message */}
                <Text
                  className={`text-xl font-bold mb-2 ${
                    isValidOrder ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {isValidOrder ? '  Valid Order Code!' : '  Invalid QR Code'}
                </Text>
                
                <Text className="font-mono text-2xl font-bold text-gray-900 mb-4">
                  {scannedCode}
                </Text>

                {/* Order Details */}
                {orderData && isValidOrder && (
                  <View className="w-full bg-green-50 rounded-xl p-4 mb-6 border-2 border-green-200">
                    <Text className="text-sm text-gray-600 mb-1">Product</Text>
                    <Text className="font-semibold text-base mb-3">{orderData.productName}</Text>
                    
                    <Text className="text-sm text-gray-600 mb-1">Member</Text>
                    <Text className="font-semibold text-base mb-3">{orderData.memberName}</Text>
                    
                    <View className="flex-row justify-between items-center bg-white rounded-lg p-3">
                      <Text className="text-gray-600">Status</Text>
                      <View
                        className={`px-3 py-1.5 rounded-lg ${
                          orderData.status === 'PENDING'
                            ? 'bg-yellow-100'
                            : orderData.status === 'COMPLETED'
                            ? 'bg-green-100'
                            : 'bg-blue-100'
                        }`}
                      >
                        <Text
                          className={`font-semibold text-sm ${
                            orderData.status === 'PENDING'
                              ? 'text-yellow-700'
                              : orderData.status === 'COMPLETED'
                              ? 'text-green-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {orderData.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="w-full space-y-3">
                  {isValidOrder && scannedCode && (
                    <TouchableOpacity
                      onPress={() => {
                        router.push(`/club-leader/orders/qr/${scannedCode}` as any);
                      }}
                      className="bg-green-600 rounded-xl py-4 items-center"
                    >
                      <Text className="text-white font-bold text-base">View Order Details</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    onPress={startScanning}
                    className="bg-purple-600 rounded-xl py-4 items-center"
                  >
                    <Text className="text-white font-bold text-base">Scan Another QR Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="items-center">
                <Ionicons name="qr-code-outline" size={80} color="#D1D5DB" />
                <Text className="text-gray-600 text-lg font-semibold mt-4 text-center">
                  Ready to scan
                </Text>
                <Text className="text-gray-500 mt-2 text-center">
                  Tap the button below to start scanning
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Control Button */}
        {!loading && (
          <View className="mt-6">
            {scanning ? (
              <TouchableOpacity
                onPress={() => setScanning(false)}
                className="bg-red-500 rounded-xl py-4 flex-row items-center justify-center"
              >
                <Ionicons name="stop" size={24} color="white" />
                <Text className="text-white font-bold text-base ml-2">Stop Scanning</Text>
              </TouchableOpacity>
            ) : (
              !scannedCode && (
                <TouchableOpacity
                  onPress={startScanning}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl py-4 flex-row items-center justify-center"
                  style={{
                    backgroundColor: '#8B5CF6',
                  }}
                >
                  <Ionicons name="scan" size={24} color="white" />
                  <Text className="text-white font-bold text-base ml-2">Start Scanning</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLineContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
  },
  scanLine: {
    height: 2,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
});
