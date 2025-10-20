import { axiosClient } from '@configs/axios';

export interface Major {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export class MajorService {
  /**
   * Fetch all majors
   */
  static async fetchMajors(): Promise<Major[]> {
    try {
      console.log('fetchMajors: GET /api/university/majors');
      const response = await axiosClient.get<any>('/api/university/majors');
      const body = response.data;
      console.log('fetchMajors response:', body);

      // If backend returns { content: [...] }
      if (body && typeof body === 'object' && 'content' in body && Array.isArray(body.content)) {
        return body.content;
      }

      // If backend returns array directly
      if (Array.isArray(body)) {
        return body;
      }

      // If backend returns { data: [...] }
      if (body && typeof body === 'object' && 'data' in body && Array.isArray(body.data)) {
        return body.data;
      }

      // If backend returns { success, message, data }
      if (body && typeof body === 'object' && 'success' in body && body.success && 'data' in body) {
        return Array.isArray(body.data) ? body.data : [];
      }

      return [];
    } catch (error) {
      console.error('Error fetching majors:', error);
      throw error;
    }
  }

  /**
   * Fetch major by ID
   */
  static async fetchMajorById(id: number): Promise<Major> {
    try {
      console.log(`fetchMajorById: GET /api/university/majors/${id}`);
      const response = await axiosClient.get<any>(`/api/university/majors/${id}`);
      const body = response.data;
      console.log('fetchMajorById response:', body);

      if (body && typeof body === 'object' && 'data' in body) {
        return body.data;
      }

      return body;
    } catch (error) {
      console.error(`Error fetching major ${id}:`, error);
      throw error;
    }
  }
}
