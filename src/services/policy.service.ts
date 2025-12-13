import { axiosClient } from '@configs/axios';

export interface Policy {
  id: number;
  policyName: string;
  description: string;
  majorId?: number;
  majorName?: string;
  maxClubJoin?: number;
  active: boolean;
}

export interface PolicyResponse {
  success: boolean;
  message?: string;
  data?: Policy;
  status?: number;
}

const API_PATH = '/api/university/major-policies';

export class PolicyService {
  /**
   * Fetch all policies
   * GET /api/university/major-policies
   * Returns: Policy[]
   */
  static async fetchPolicies(): Promise<Policy[]> {
    try {
      const response = await axiosClient.get(API_PATH);
      
      // Response is Policy[] directly according to Swagger
      return response.data as Policy[];
    } catch (error) {
      console.error('Error fetching policies:', error);
      throw error;
    }
  }

  /**
   * Fetch policy by ID
   * GET /api/university/major-policies/{id}
   * Returns: Policy
   */
  static async fetchPolicyById(id: number): Promise<Policy> {
    try {
      const response = await axiosClient.get(`${API_PATH}/${id}`);

      // Response is Policy object directly according to Swagger
      return response.data as Policy;
    } catch (error) {
      console.error(`Error fetching policy ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new policy
   * POST /api/university/major-policies
   * Returns: Policy
   */
  static async createPolicy(payload: Partial<Policy>): Promise<Policy> {
    try {
      const response = await axiosClient.post(API_PATH, payload);

      // Response is the created Policy object
      return response.data as Policy;
    } catch (error: any) {
      console.error('Error creating policy:', error);
      throw error;
    }
  }

  /**
   * Update policy by ID
   * PUT /api/university/major-policies/{id}
   * Returns: Policy
   */
  static async updatePolicyById(id: number, payload: Partial<Policy>): Promise<Policy> {
    try {
      const response = await axiosClient.put(`${API_PATH}/${id}`, payload);

      // Response is the updated Policy object
      return response.data as Policy;
    } catch (error: any) {
      console.error(`Error updating policy ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete policy by ID
   * DELETE /api/university/major-policies/{id}
   * Returns: 200 OK with no body
   */
  static async deletePolicyById(id: number): Promise<void> {
    try {
      await axiosClient.delete(`${API_PATH}/${id}`);
      
      // No response body according to Swagger
    } catch (error: any) {
      console.error(`Error deleting policy ${id}:`, error);
      throw error;
    }
  }
}

export default PolicyService;
