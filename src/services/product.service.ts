import { axiosClient } from '@configs/axios';

export interface Product {
  id?: number;
  clubId: number;
  name: string;
  description: string;
  pricePoints: number;
  stockQuantity: number;
}

export class ProductService {
  /**
   * Get products with pagination
   * GET /api/products
   */
  static async getProducts(
    page: number = 0,
    size: number = 10,
    sort: string = 'name'
  ): Promise<Product[]> {
    try {
      const response = await axiosClient.get('/api/products', {
        params: { page, size, sort },
      });

      const body = response.data;

      // Handle multiple response formats
      // Format 1: { content: [...] }
      if (body?.content && Array.isArray(body.content)) {
        return body.content;
      }

      // Format 2: [...] direct array
      if (Array.isArray(body)) {
        return body;
      }

      // Format 3: { data: { content: [...] } }
      if (body?.data?.content && Array.isArray(body.data.content)) {
        return body.data.content;
      }

      // Format 4: { data: [...] }
      if (body?.data && Array.isArray(body.data)) {
        return body.data;
      }

      console.warn('Unexpected products response format:', body);
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   * GET /api/products/{id}
   */
  static async getProductById(id: number): Promise<Product> {
    try {
      const response = await axiosClient.get(`/api/products/${id}`);
      const body = response.data;
      return body?.data || body;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add a new product
   * POST /api/products
   */
  static async addProduct(productData: Product): Promise<any> {
    try {
      const response = await axiosClient.post('/api/products', productData);
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  /**
   * Update a product
   * PUT /api/products/{id}
   */
  static async updateProduct(id: number, productData: Partial<Product>): Promise<any> {
    try {
      const response = await axiosClient.put(`/api/products/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a product
   * DELETE /api/products/{id}
   */
  static async deleteProduct(id: number): Promise<any> {
    try {
      const response = await axiosClient.delete(`/api/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }
}
