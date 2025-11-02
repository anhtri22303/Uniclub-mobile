import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ArrowLeft, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScanQRPage() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    console.log('QR Code scanned:', data);

    // Check if scanned data contains a token or URL
    try {
      // Case 1: Direct token (just the token string) - legacy format
      if (data && !data.includes('://') && !data.includes('/')) {
        console.log('Direct token detected (legacy):', data);
        router.push(`/student/checkin/NONE/${data}` as any);
        return;
      }

      // Case 2: URL format (e.g., exp://host/--/student/checkin/START/token)
      const url = new URL(data);
      console.log('Parsed URL:', url.href);
      console.log('URL pathname:', url.pathname);
      
      // Handle Expo URL format with "--" separator
      // Path could be: /--/student/checkin/START/token or /student/checkin/START/token
      let pathParts = url.pathname.split('/').filter(Boolean);
      console.log('Path parts:', pathParts);
      
      // Remove "--" if present (Expo deep link format)
      if (pathParts[0] === '--') {
        pathParts = pathParts.slice(1);
      }
      
      // Find "checkin" in path
      const checkinIndex = pathParts.findIndex(part => 
        part.toLowerCase() === 'checkin'
      );
      
      if (checkinIndex !== -1) {
        // New format: /student/checkin/TIME/TOKEN
        const time = pathParts[checkinIndex + 1];
        const token = pathParts[checkinIndex + 2];
        
        if (time && token) {
          console.log('Extracted time:', time, 'token:', token.substring(0, 20) + '...');
          router.push(`/student/checkin/${time}/${token}` as any);
          return;
        }
        
        // Legacy format: /student/checkin/TOKEN (no time)
        if (time && !token) {
          console.log('Legacy format detected, token:', time.substring(0, 20) + '...');
          router.push(`/student/checkin/NONE/${time}` as any);
          return;
        }
      }

      // Check for token in query params (fallback)
      const tokenParam = url.searchParams.get('token');
      const phaseParam = url.searchParams.get('phase') || url.searchParams.get('time');
      if (tokenParam) {
        const phase = phaseParam || 'NONE';
        console.log('Token from query param:', tokenParam.substring(0, 20) + '...', 'phase:', phase);
        router.push(`/student/checkin/${phase}/${tokenParam}` as any);
        return;
      }

      // If we get here, couldn't find token
      Alert.alert(
        'Invalid QR Code',
        'Could not find check-in information in QR code. Please try again or contact support.',
        [{ text: 'Scan Again', onPress: () => setScanned(false) }]
      );
    } catch (error) {
      // Not a valid URL, might be just a token string (legacy)
      console.log('Not a URL, treating as token (legacy):', data.substring(0, 20) + '...');
      router.push(`/student/checkin/NONE/${data}` as any);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-white text-lg">Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center px-6">
        <Text className="text-white text-xl font-bold mb-4">No Camera Access</Text>
        <Text className="text-gray-400 text-center mb-6">
          Camera permission is required to scan QR codes. Please enable it in your device settings.
        </Text>
        <TouchableOpacity
          className="bg-teal-600 px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        enableTorch={torch}
      >
        {/* Header */}
        <SafeAreaView className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-black/50 p-3 rounded-full"
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTorch(!torch)}
              className={`p-3 rounded-full ${torch ? 'bg-yellow-500' : 'bg-black/50'}`}
            >
              <Zap size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Scanning Frame */}
          <View className="flex-1 justify-center items-center">
            <View className="relative">
              {/* Corner borders */}
              <View className="w-64 h-64 relative">
                {/* Top Left */}
                <View className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-teal-500 rounded-tl-2xl" />
                {/* Top Right */}
                <View className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-teal-500 rounded-tr-2xl" />
                {/* Bottom Left */}
                <View className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-teal-500 rounded-bl-2xl" />
                {/* Bottom Right */}
                <View className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-teal-500 rounded-br-2xl" />
              </View>

              {/* Scanning line animation (optional - you can add animation later) */}
              {!scanned && (
                <View className="absolute top-1/2 left-0 right-0 h-0.5 bg-teal-500 opacity-70" />
              )}
            </View>
          </View>

          {/* Instructions */}
          <View className="pb-12 px-6">
            <View className="bg-black/70 rounded-2xl p-6 items-center">
              <Text className="text-white text-xl font-bold mb-2">
                {scanned ? 'QR Code Scanned!' : 'Scan QR Code'}
              </Text>
              <Text className="text-gray-300 text-center text-sm">
                {scanned
                  ? 'Processing check-in...'
                  : 'Position the QR code within the frame to scan'}
              </Text>
              {scanned && (
                <TouchableOpacity
                  className="mt-4 bg-teal-600 px-6 py-2 rounded-lg"
                  onPress={() => setScanned(false)}
                >
                  <Text className="text-white font-medium">Scan Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
