import { axiosClient } from '@configs/axios';

export interface MajorPolicy {
  id: number;
  policyName: string;
  description: string;
  maxClubJoin: number;
  majorName: string;
  active: boolean;
  major: string;
}

export interface Major {
  id: number;
  name: string;
  majorCode?: string;
  description: string;
  active: boolean;
  colorHex: string;
  policies?: MajorPolicy[];
  policyName?: string;
  policyId?: number;
}

/**
 * Payload for creating major
 */
export interface CreateMajorPayload {
  name: string;
  description: string;
  majorCode: string;
  colorHex: string;
}

/**
 * Payload for updating major
 */
export interface UpdateMajorPayload {
  name: string;
  description: string;
  majorCode: string;
  active: boolean;
  colorHex: string;
}

/**
 * Payload for updating major color
 */
export interface UpdateMajorColorPayload {
  colorHex: string;
}

export class MajorService {
  /**
   * Fetch all majors
   * GET /api/university/majors
   */
  static async fetchMajors(): Promise<Major[]> {
    try {
      console.log('fetchMajors: GET /api/university/majors');
      const response = await axiosClient.get<Major[]>('/api/university/majors');
      // console.log('fetchMajors response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching majors:', error);
      throw error;
    }
  }

  /**
   * Fetch major by ID
   * GET /api/university/majors/{id}
   */
  static async fetchMajorById(id: number): Promise<Major> {
    try {
      console.log(`fetchMajorById: GET /api/university/majors/${id}`);
      const response = await axiosClient.get<Major>(`/api/university/majors/${id}`);
      console.log('fetchMajorById response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching major ${id}:`, error);
      throw error;
    }
  }

  /**
   * Fetch major by code
   * GET /api/university/majors/code/{code}
   */
  static async fetchMajorByCode(code: string): Promise<Major> {
    try {
      const response = await axiosClient.get<Major>(`/api/university/majors/code/${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching major by code ${code}:`, error);
      throw error;
    }
  }

  /**
   * Create a new major
   * POST /api/university/majors
   */
  static async createMajor(payload: CreateMajorPayload): Promise<Major> {
    try {
      const response = await axiosClient.post<Major>('/api/university/majors', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating major:', error);
      throw error;
    }
  }

  /**
   * Update a major
   * PUT /api/university/majors/{id}
   */
  static async updateMajorById(id: number, payload: UpdateMajorPayload): Promise<Major> {
    try {
      const response = await axiosClient.put<Major>(
        `/api/university/majors/${id}`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating major ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update major color
   * PATCH /api/university/majors/{id}/color
   */
  static async updateMajorColor(
    id: number,
    payload: UpdateMajorColorPayload
  ): Promise<Major> {
    try {
      const response = await axiosClient.patch<Major>(
        `/api/university/majors/${id}/color`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating major color ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a major
   * DELETE /api/university/majors/{id}
   */
  static async deleteMajorById(id: number): Promise<void> {
    try {
      await axiosClient.delete(`/api/university/majors/${id}`);
    } catch (error) {
      console.error(`Error deleting major ${id}:`, error);
      throw error;
    }
  }
}

export default MajorService;
