import { axiosClient } from '@configs/axios';

export type PolicyTargetType = 'CLUB' | 'MEMBER';
export type ConditionType = 'PERCENTAGE' | 'ABSOLUTE';

/**
 * Multiplier Policy interface
 */
export interface MultiplierPolicy {
  id: number;
  targetType: PolicyTargetType;
  activityType: string;
  ruleName: string;
  conditionType: ConditionType;
  minThreshold: number;
  maxThreshold: number;
  policyDescription?: string | null;
  multiplier: number;
  active: boolean;
  updatedBy: string;
}

/**
 * API response wrapper for multiplier policies
 */
export interface MultiplierPoliciesApiResponse {
  success?: boolean;
  message?: string;
  data?: MultiplierPolicy[];
  content?: MultiplierPolicy[];
}

/**
 * Delete API response
 */
export interface DeleteMultiplierPolicyApiResponse {
  success: boolean;
  message: string;
  data: string;
}

export class MultiplierPolicyService {
  /**
   * Get all multiplier policies
   * GET /api/university/multiplier-policies
   */
  static async getMultiplierPolicies(): Promise<MultiplierPolicy[]> {
    try {
      const response = await axiosClient.get<MultiplierPolicy[]>(
        '/api/university/multiplier-policies'
      );
      console.log('Fetched multiplier policies:', response.data);

      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching multiplier policies:', error);
      throw error;
    }
  }

  /**
   * Get multiplier policy by ID
   * GET /api/university/multiplier-policies/{id}
   */
  static async getMultiplierPolicyById(id: number): Promise<MultiplierPolicy> {
    try {
      const response = await axiosClient.get<MultiplierPolicy>(
        `/api/university/multiplier-policies/${id}`
      );
      console.log('Fetched multiplier policy by ID:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching multiplier policy by ID:', error);
      throw error;
    }
  }

  /**
   * Get multiplier policies by target type
   * GET /api/university/multiplier-policies/target/{type}
   */
  static async getMultiplierPolicyByType(
    type: PolicyTargetType
  ): Promise<MultiplierPolicy[]> {
    try {
      const response = await axiosClient.get<MultiplierPolicy[]>(
        `/api/university/multiplier-policies/target/${type}`
      );
      console.log('Fetched multiplier policies by type:', response.data);

      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching multiplier policies by type:', error);
      throw error;
    }
  }

  /**
   * Create a new multiplier policy
   * POST /api/university/multiplier-policies
   */
  static async createMultiplierPolicy(
    payload: Omit<MultiplierPolicy, 'id'>
  ): Promise<MultiplierPolicy> {
    try {
      const response = await axiosClient.post<MultiplierPolicy>(
        '/api/university/multiplier-policies',
        payload
      );
      console.log('Created multiplier policy:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating multiplier policy:', error);
      throw error;
    }
  }

  /**
   * Update a multiplier policy
   * PUT /api/university/multiplier-policies/{id}
   */
  static async updateMultiplierPolicy(
    id: number,
    payload: Partial<MultiplierPolicy>
  ): Promise<MultiplierPolicy> {
    try {
      const response = await axiosClient.put<MultiplierPolicy>(
        `/api/university/multiplier-policies/${id}`,
        payload
      );
      console.log('Updated multiplier policy:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating multiplier policy:', error);
      throw error;
    }
  }

  /**
   * Delete a multiplier policy
   * DELETE /api/university/multiplier-policies/{id}
   */
  static async deleteMultiplierPolicy(id: number): Promise<string> {
    try {
      const response = await axiosClient.delete<DeleteMultiplierPolicyApiResponse>(
        `/api/university/multiplier-policies/${id}`
      );
      console.log('Deleted multiplier policy:', response.data);

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to delete multiplier policy');
    } catch (error) {
      console.error('Error deleting multiplier policy:', error);
      throw error;
    }
  }
}

export default MultiplierPolicyService;
