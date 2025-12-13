import { axiosClient } from '@configs/axios';

/**
 * Standard API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Pageable response structure
 */
export interface PageableResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * Product Media interface
 */
export interface ProductMedia {
  mediaId: number;
  url: string;
  type: string;
  displayOrder: number;
  thumbnail: boolean;
}

/**
 * Full Product interface
 */
export interface Product {
  id: number;
  productCode: string;
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  type: string;
  status: string;
  clubId: number;
  clubName: string;
  eventId: number;
  createdAt: string;
  redeemCount: number;
  media: ProductMedia[];
  tags: string[];
}

/**
 * Stock History interface
 */
export interface StockHistory {
  id: number;
  oldStock: number;
  newStock: number;
  note: string;
  changedAt: string;
  changedBy: number;
}

/**
 * Filter payload for getAllProductsPaginated
 */
export interface ProductFilterPayload {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
  type?: string;
  tag?: string;
  keyword?: string;
}

/**
 * Add Product payload
 */
export interface AddProductPayload {
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  type: string;
  eventId: number;
  tagIds: number[];
}

/**
 * Update Product payload
 */
export interface UpdateProductPayload {
  name: string;
  description: string;
  pointCost: number;
  stockQuantity: number;
  type: string;
  eventId: number;
  status: string;
  tagIds: number[];
}

export class ProductService {
  /**
   * Get products for a club
   * GET /api/clubs/{clubId}/products
   */
  static async getProducts(
    clubId: number,
    options: { includeInactive?: boolean; includeArchived?: boolean } = {}
  ): Promise<Product[]> {
    try {
      const response = await axiosClient.get<ApiResponse<Product[]>>(
        `/api/clubs/${clubId}/products`,
        { params: options }
      );
      const data = response.data.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get EVENT_ITEM products that are currently active (ONGOING events)
   * GET /api/events/clubs/{clubId}/event-items/active
   */
  static async getEventProductsOnTime(clubId: number | string): Promise<Product[]> {
    try {
      const response = await axiosClient.get<ApiResponse<Product[]>>(
        `/api/events/clubs/${clubId}/event-items/active`
      );
      const data = response.data.data;
      console.log('Event products on time:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching active event products:', error);
      throw error;
    }
  }

  /**
   * Get EVENT_ITEM products from completed events
   * GET /api/events/clubs/{clubId}/event-items/completed
   */
  static async getEventProductsCompleted(clubId: number | string): Promise<Product[]> {
    try {
      const response = await axiosClient.get<ApiResponse<Product[]>>(
        `/api/events/clubs/${clubId}/event-items/completed`
      );
      const data = response.data.data;
      console.log('Event products completed:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching completed event products:', error);
      throw error;
    }
  }

  /**
   * Check if EVENT_ITEM product is still valid (event hasn't expired)
   * GET /api/clubs/{clubId}/products/{productId}/is-event-valid
   */
  static async checkEventProductValid(
    clubId: number | string,
    productId: number | string
  ): Promise<{
    productId: number;
    eventId: number;
    eventStatus: string;
    expired: boolean;
    expiredAt: string;
    message: string;
  }> {
    try {
      const response = await axiosClient.get(
        `/api/clubs/${clubId}/products/${productId}/is-event-valid`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error checking event product validity:', error);
      throw error;
    }
  }

  /**
   * Get all products with pagination and filters
   * GET /api/clubs/{clubId}/products/_all
   */
  static async getAllProductsPaginated(
    clubId: number | string,
    filters: ProductFilterPayload
  ): Promise<PageableResponse<Product>> {
    try {
      const response = await axiosClient.get<ApiResponse<PageableResponse<Product>>>(
        `/api/clubs/${clubId}/products/_all`,
        { params: filters }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching paginated products:', error);
      throw error;
    }
  }

  /**
   * Search products by tags
   * GET /api/clubs/{clubId}/products/search
   */
  static async searchProductsByTags(
    clubId: number | string,
    tags: string[]
  ): Promise<Product[]> {
    try {
      const response = await axiosClient.get<ApiResponse<Product[]>>(
        `/api/clubs/${clubId}/products/search`,
        { params: { tags } }
      );
      const data = response.data.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error searching products by tags:', error);
      throw error;
    }
  }

  /**
   * Add a new product
   * POST /api/clubs/{clubId}/products
   */
  static async addProduct(clubId: number, productData: AddProductPayload): Promise<Product> {
    try {
      const response = await axiosClient.post<ApiResponse<Product>>(
        `/api/clubs/${clubId}/products`,
        productData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   * GET /api/clubs/{clubId}/products/{id}
   */
  static async getProductById(clubId: number | string, productId: number | string): Promise<Product> {
    try {
      const response = await axiosClient.get<ApiResponse<Product>>(
        `/api/clubs/${clubId}/products/${productId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Update product (Full update)
   * PUT /api/clubs/{clubId}/products/{id}
   */
  static async updateProduct(
    clubId: number,
    productId: number | string,
    productData: UpdateProductPayload
  ): Promise<Product> {
    try {
      const response = await axiosClient.put<ApiResponse<Product>>(
        `/api/clubs/${clubId}/products/${productId}`,
        productData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Update product (Partial update)
   * PATCH /api/clubs/{clubId}/products/{productId}
   */
  static async patchProduct(
    clubId: number | string,
    productId: number | string,
    productData: Partial<UpdateProductPayload>
  ): Promise<Product> {
    try {
      const response = await axiosClient.patch<ApiResponse<Product>>(
        `/api/clubs/${clubId}/products/${productId}`,
        productData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error patching product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Delete product (Soft delete)
   * DELETE /api/clubs/{clubId}/products/{id}
   */
  static async deleteProduct(clubId: number | string, productId: number | string): Promise<string> {
    try {
      const response = await axiosClient.delete<ApiResponse<string>>(
        `/api/clubs/${clubId}/products/${productId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Update stock
   * PATCH /api/clubs/{clubId}/products/{id}/stock
   */
  static async updateStock(
    clubId: number | string,
    productId: number | string,
    delta: number,
    note: string = ''
  ): Promise<Product> {
    try {
      const response = await axiosClient.patch<ApiResponse<Product>>(
        `/api/clubs/${clubId}/products/${productId}/stock`,
        null,
        { params: { delta, note } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Get stock history
   * GET /api/clubs/{clubId}/products/{id}/stock-history
   */
  static async getStockHistory(
    clubId: number | string,
    productId: number | string
  ): Promise<StockHistory[]> {
    try {
      const response = await axiosClient.get<ApiResponse<StockHistory[]>>(
        `/api/clubs/${clubId}/products/${productId}/stock-history`
      );
      const data = response.data.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching stock history:', error);
      throw error;
    }
  }

  /**
   * Get media for product
   * GET /api/clubs/{clubId}/products/{productId}/media
   */
  static async getMediaForProduct(
    clubId: number | string,
    productId: number | string
  ): Promise<ProductMedia[]> {
    try {
      const response = await axiosClient.get<ApiResponse<ProductMedia[]>>(
        `/api/clubs/${clubId}/products/${productId}/media`
      );
      const data = response.data.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  }

  /**
   * Add media to product
   * POST /api/clubs/{clubId}/products/{productId}/media
   */
  static async addMediaToProduct(
    clubId: number | string,
    productId: number | string,
    fileOrFormData: File | Blob | FormData,
    fileName?: string
  ): Promise<ProductMedia> {
    try {
      let formData: FormData;
      
      // Check if it's already FormData (React Native)
      if (fileOrFormData instanceof FormData) {
        formData = fileOrFormData;
      } else {
        // Create FormData for web/File/Blob
        formData = new FormData();
        formData.append('file', fileOrFormData as any, fileName);
      }


      const response = await axiosClient.post<ApiResponse<ProductMedia>>(
        `/api/clubs/${clubId}/products/${productId}/media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 seconds for file upload
        }
      );
      
      console.log('  Media uploaded successfully:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('  Error adding media:', error);
      console.error('  Error response:', error.response?.data);
      console.error('  Error message:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout - please try again with a smaller image');
      }
      if (error.message === 'Network Error') {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
  }

  /**
   * Delete media from product
   * DELETE /api/clubs/{clubId}/products/{productId}/media/{mediaId}
   */
  static async deleteMediaFromProduct(
    clubId: number,
    productId: number | string,
    mediaId: number | string
  ): Promise<string> {
    try {
      const response = await axiosClient.delete<ApiResponse<string>>(
        `/api/clubs/${clubId}/products/${productId}/media/${mediaId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }

  /**
   * Set media as thumbnail
   * PUT /api/clubs/{clubId}/products/{productId}/media/{mediaId}/thumbnail
   */
  static async setMediaThumbnail(
    clubId: number | string,
    productId: number | string,
    mediaId: number | string
  ): Promise<string> {
    try {
      const response = await axiosClient.put<ApiResponse<string>>(
        `/api/clubs/${clubId}/products/${productId}/media/${mediaId}/thumbnail`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      throw error;
    }
  }
}
