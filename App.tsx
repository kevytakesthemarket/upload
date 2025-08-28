import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - 48) / 2; // 2 columns with padding

interface UploadedImage {
  id: string;
  uri: string;
  name: string;
  size?: number;
  type?: string;
}

export default function App() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImageLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      addImage(result.assets[0]);
    }
  };

  const openImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      result.assets.forEach(asset => addImage(asset));
    }
  };

  const addImage = (asset: ImagePicker.ImagePickerAsset) => {
    const newImage: UploadedImage = {
      id: Math.random().toString(36).substr(2, 9),
      uri: asset.uri,
      name: asset.fileName || `image_${Date.now()}.jpg`,
      size: asset.fileSize,
      type: asset.type,
    };

    setImages(prev => [...prev, newImage]);
  };

  const removeImage = useCallback((id: string) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setImages(prev => prev.filter(img => img.id !== id));
          },
        },
      ]
    );
  }, []);

  const openLightbox = useCallback((image: UploadedImage) => {
    setSelectedImage(image);
    setLightboxVisible(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxVisible(false);
    setSelectedImage(null);
  }, []);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="images" size={24} color="#ff6b35" />
            <Text style={styles.headerTitle}>ImageVault</Text>
          </View>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upload Area */}
        <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
          <LinearGradient
            colors={['#f8f9fa', '#ffffff']}
            style={styles.uploadAreaGradient}
          >
            <View style={styles.uploadIcon}>
              <Ionicons name="cloud-upload-outline" size={32} color="#6b7280" />
            </View>
            <Text style={styles.uploadTitle}>Tap to upload images</Text>
            <Text style={styles.uploadSubtitle}>
              Take a photo or choose from your library
            </Text>
            <Text style={styles.uploadFormats}>
              Supports JPG, PNG, GIF formats
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Gallery */}
        {images.length > 0 && (
          <View style={styles.gallery}>
            <Text style={styles.galleryTitle}>
              Your Images ({images.length})
            </Text>
            <View style={styles.imageGrid}>
              {images.map((image) => (
                <View key={image.id} style={styles.imageCard}>
                  <TouchableOpacity
                    style={styles.imageContainer}
                    onPress={() => openLightbox(image)}
                  >
                    <Image source={{ uri: image.uri }} style={styles.image} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.3)']}
                      style={styles.imageOverlay}
                    />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeImage(image.id)}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                  <View style={styles.imageInfo}>
                    <Text style={styles.imageName} numberOfLines={1}>
                      {image.name}
                    </Text>
                    <Text style={styles.imageSize}>
                      {formatFileSize(image.size)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="images-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No images uploaded yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the upload button to get started
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Lightbox Modal */}
      <Modal
        visible={lightboxVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeLightbox}
      >
        <View style={styles.lightboxContainer}>
          <TouchableOpacity
            style={styles.lightboxBackground}
            onPress={closeLightbox}
          />
          <View style={styles.lightboxContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeLightbox}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            {selectedImage && (
              <>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
                <View style={styles.lightboxInfo}>
                  <Text style={styles.lightboxName}>{selectedImage.name}</Text>
                  <Text style={styles.lightboxSize}>
                    {formatFileSize(selectedImage.size)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  uploadArea: {
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadAreaGradient: {
    padding: 48,
    alignItems: 'center',
  },
  uploadIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#f3f4f6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadFormats: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  gallery: {
    marginBottom: 24,
  },
  galleryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  imageCard: {
    width: imageSize,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: imageSize,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInfo: {
    padding: 12,
  },
  imageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  imageSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#f3f4f6',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lightboxContent: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  lightboxInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  lightboxName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lightboxSize: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});