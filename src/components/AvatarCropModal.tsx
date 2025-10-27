import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AvatarCropModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string;
  onCropComplete: (croppedBlob: { uri: string; base64?: string }) => void | Promise<void>;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_SIZE = SCREEN_WIDTH - 80; // Leave some margin

export function AvatarCropModal({
  visible,
  onClose,
  imageUri,
  onCropComplete,
}: AvatarCropModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCrop = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'No image selected');
      return;
    }

    try {
      setIsProcessing(true);

      // Get image dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      // Calculate crop dimensions to make it square (centered)
      const size = Math.min(imageInfo.width, imageInfo.height);
      const originX = (imageInfo.width - size) / 2;
      const originY = (imageInfo.height - size) / 2;

      // Crop and resize to 400x400 for avatar
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX,
              originY,
              width: size,
              height: size,
            },
          },
          {
            resize: {
              width: 400,
              height: 400,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      await onCropComplete(manipulatedImage);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
      Alert.alert('Error', 'Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="crop" size={20} color="#0D9488" />
              <Text style={styles.headerTitle}>Crop Avatar</Text>
            </View>
          </View>

          {/* Image Preview */}
          <View style={styles.imageContainer}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : null}
            
            {/* Crop guide overlay */}
            <View style={styles.cropGuide}>
              <View style={styles.cropBox} />
            </View>
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            The image will be automatically cropped to a square and resized for the avatar.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cropButton, isProcessing && styles.cropButtonDisabled]}
              onPress={handleCrop}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="checkmark" size={20} color="white" />
              )}
              <Text style={styles.cropButtonText}>
                {isProcessing ? 'Uploading...' : 'Crop & Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  imageContainer: {
    position: 'relative',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CROP_SIZE,
  },
  image: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: 12,
  },
  cropGuide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  cropBox: {
    width: CROP_SIZE * 0.8,
    height: CROP_SIZE * 0.8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: (CROP_SIZE * 0.8) / 2,
    borderStyle: 'dashed',
  },
  instructions: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  cropButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    gap: 6,
  },
  cropButtonDisabled: {
    opacity: 0.6,
  },
  cropButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
  },
});

