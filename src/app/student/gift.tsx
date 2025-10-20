import NavigationBar from '@components/navigation/NavigationBar';
import Sidebar from '@components/navigation/Sidebar';
import { Product, ProductService } from '@services/product.service';
import { useAuthStore } from '@stores/auth.store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentGiftPage() {
  const { user } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getProducts(0, 100, 'name');
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);

  // Search filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Handle redeem
  const handleRedeemPress = (product: Product) => {
    setSelectedProduct(product);
    setRedeemModalVisible(true);
  };

  const handleRedeemConfirm = async () => {
    // TODO: Implement redeem API call
    console.log('Redeeming product:', selectedProduct?.id);
    setRedeemModalVisible(false);
    setSelectedProduct(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Sidebar role={user?.role} />

      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-gray-900">Gift Products</Text>
          <Text className="text-sm text-gray-600 mt-1">
            Browse and redeem available gift products
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <View className="flex-row items-center bg-white rounded-lg px-4 py-3 shadow-sm">
            <Text className="text-gray-400 mr-2">🔍</Text>
            <TextInput
              placeholder="Search products..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="flex-1 text-base"
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Text className="text-gray-400 text-lg">✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Products List */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 mt-4">Loading products...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-6xl mb-4">📦</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No products found
              </Text>
              <Text className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'No products available'}
              </Text>
            </View>
          ) : (
            <View className="pb-4">
              {filteredProducts.map((product) => (
                <View
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden"
                >
                  {/* Product Image */}
                  <View className="h-40 bg-gray-100 relative">
                    <Image
                      source={{ uri: 'https://via.placeholder.com/400x200' }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {product.stockQuantity === 0 && (
                      <View className="absolute inset-0 bg-black/50 items-center justify-center">
                        <Text className="text-white font-bold text-lg">
                          Out of Stock
                        </Text>
                      </View>
                    )}
                    {/* Club Badge */}
                    <View className="absolute top-2 right-2 bg-blue-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-medium">
                        Club ID: {product.clubId}
                      </Text>
                    </View>
                  </View>

                  {/* Product Info */}
                  <View className="p-4">
                    <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                      {product.description}
                    </Text>

                    {/* Price and Stock */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <Text className="text-xl font-bold text-blue-600">
                          {product.pricePoints}
                        </Text>
                        <Text className="text-sm text-gray-600 ml-1">points</Text>
                      </View>
                      <Text className="text-sm text-gray-500">
                        Stock: {product.stockQuantity}
                      </Text>
                    </View>

                    {/* Redeem Button */}
                    <TouchableOpacity
                      onPress={() => handleRedeemPress(product)}
                      disabled={product.stockQuantity === 0}
                      className={`py-3 rounded-lg items-center ${
                        product.stockQuantity === 0
                          ? 'bg-gray-300'
                          : 'bg-blue-500'
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          product.stockQuantity === 0
                            ? 'text-gray-500'
                            : 'text-white'
                        }`}
                      >
                        {product.stockQuantity === 0 ? 'Out of Stock' : '🎁 Redeem'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Redeem Confirmation Modal */}
      <Modal
        visible={redeemModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Confirm Redemption
            </Text>
            
            {selectedProduct && (
              <>
                <Text className="text-gray-600 mb-4">
                  Do you want to redeem "{selectedProduct.name}" for{' '}
                  <Text className="font-bold text-blue-600">
                    {selectedProduct.pricePoints} points
                  </Text>?
                </Text>

                <View className="bg-gray-50 p-3 rounded-lg mb-6">
                  <Text className="text-sm text-gray-600">
                    {selectedProduct.description}
                  </Text>
                </View>
              </>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setRedeemModalVisible(false)}
                className="flex-1 py-3 rounded-lg bg-gray-200"
              >
                <Text className="text-center font-semibold text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRedeemConfirm}
                className="flex-1 py-3 rounded-lg bg-blue-500"
              >
                <Text className="text-center font-semibold text-white">
                  Redeem
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavigationBar role={user?.role} user={user || undefined} />
    </SafeAreaView>
  );
}

