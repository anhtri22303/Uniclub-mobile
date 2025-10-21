import { axiosClient } from '@configs/axios';

export interface Policy {
  id: number;
  policyName: string;
  description: string;
  majorId?: number;
  majorName?: string;
  name?: string;
  maxClubJoin?: number;
  rewardMultiplier?: number;
  active: boolean;
}

export interface PolicyResponse {
  success: boolean;
  message?: string;
  data?: Policy;
  status?: number;
}

export class PolicyService {
  /**
   * Fetch all policies
   */
  static async fetchPolicies(): Promise<Policy[]> {
    try {
      console.log('fetchPolicies: GET /api/university/policies');
      const response = await axiosClient.get('/api/university/policies');
      const body = response.data;
      console.log('fetchPolicies response:', body);

      // If backend returns { content: [...] }
      if (body && typeof body === 'object' && 'content' in body && Array.isArray(body.content)) {
        return body.content;
      }

      // If backend returns array directly
      if (Array.isArray(body)) {
        return body;
      }

      // If backend wraps in { data: [...] }
      if (body && typeof body === 'object' && 'data' in body && Array.isArray(body.data)) {
        return body.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching policies:', error);
      throw error;
    }
  }

  /**
   * Fetch policy by ID
   */
  static async fetchPolicyById(id: number): Promise<Policy> {
    try {
      console.log(`fetchPolicyById: GET /api/university/policies/${id}`);
      const response = await axiosClient.get(`/api/university/policies/${id}`);
      const body = response.data;
      console.log('fetchPolicyById response:', body);

      // If backend wraps in { data: ... }
      if (body && typeof body === 'object' && 'data' in body) {
        return body.data;
      }

      return body;
    } catch (error) {
      console.error(`Error fetching policy ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new policy
   */
  static async createPolicy(payload: Partial<Policy>): Promise<PolicyResponse> {
    try {
      console.log('createPolicy: POST /api/university/policies', payload);
      const response = await axiosClient.post('/api/university/policies', payload);
      console.log('createPolicy response:', response.data);

      return {
        success: true,
        status: response.status,
        data: response.data,
        message: 'Policy created successfully',
      };
    } catch (error: any) {
      console.error('Error creating policy:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create policy',
      };
    }
  }

  /**
   * Update policy by ID
   */
  static async updatePolicyById(id: number, payload: Partial<Policy>): Promise<PolicyResponse> {
    try {
      console.log(`updatePolicyById: PUT /api/university/policies/${id}`, payload);
      const response = await axiosClient.put(`/api/university/policies/${id}`, payload);
      console.log(`updatePolicyById response for ${id}:`, response.data);

      const raw = response.data;
      
      return {
        status: response.status,
        data: raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw,
        message: raw && typeof raw === 'object' ? raw.message : 'Policy updated successfully',
        success: raw && typeof raw === 'object' && 'success' in raw 
          ? !!raw.success 
          : (response.status >= 200 && response.status < 300),
      };
    } catch (error: any) {
      console.error(`Error updating policy ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update policy',
      };
    }
  }

  /**
   * Delete policy by ID
   */
  static async deletePolicyById(id: number): Promise<PolicyResponse> {
    try {
      console.log(`deletePolicyById: DELETE /api/university/policies/${id}`);
      const response = await axiosClient.delete(`/api/university/policies/${id}`);
      console.log(`deletePolicyById response for ${id}:`, response.data);

      return {
        success: true,
        status: response.status,
        message: 'Policy deleted successfully',
      };
    } catch (error: any) {
      console.error(`Error deleting policy ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete policy',
      };
    }
  }
}

export default PolicyService;
