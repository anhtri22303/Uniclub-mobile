import { axiosClient } from '@configs/axios';

/**
 * Penalty level definitions
 */
export type PenaltyLevel = "MINOR" | "MEDIUM" | "MAJOR" | "CRITICAL";

/**
 * Staff performance level definitions
 */
export type StaffPerformanceLevel = "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT";

/**
 * Penalty Rule interface
 */
export interface PenaltyRule {
  id: number;
  name: string;
  description: string;
  level: PenaltyLevel | string;
  penaltyPoints: number;
}

/**
 * Create Penalty Body
 */
export interface CreatePenaltyBody {
  membershipId: number;
  ruleId: number;
  reason: string;
}

/**
 * Create Staff Performance Body
 */
export interface CreateStaffPerformanceBody {
  membershipId: number;
  eventId: number;
  performance: StaffPerformanceLevel | string;
  note: string;
}

// API Response interfaces
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface StandardApiResponse {
  success: boolean;
  message: string;
  data: Record<string, never> | null;
}

export class DisciplineService {
  /**
   * Get penalty rules for a club
   * GET /api/clubs/{clubId}/discipline/penalty-rules
   */
  static async getClubPenaltyRules(clubId: number): Promise<PenaltyRule[]> {
    try {
      const response = await axiosClient.get<ApiResponse<PenaltyRule[]>>(
        `/api/clubs/${clubId}/discipline/penalty-rules`
      );

      console.log(`Fetched club ${clubId} penalty rules:`, response.data);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching club ${clubId} penalty rules:`, error);
      throw error;
    }
  }

  /**
   * Create penalty for a member
   * POST /api/clubs/{clubId}/discipline/penalties
   */
  static async createClubPenalty(
    clubId: number,
    body: CreatePenaltyBody
  ): Promise<void> {
    try {
      const response = await axiosClient.post<StandardApiResponse>(
        `/api/clubs/${clubId}/discipline/penalties`,
        body
      );

      console.log(`Created penalty for club ${clubId}:`, response.data);

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.message || `Failed to create penalty for club ${clubId}`
        );
      }
    } catch (error) {
      console.error(`Error creating penalty for club ${clubId}:`, error);
      throw error;
    }
  }

  /**
   * Create staff performance evaluation
   * POST /api/clubs/{clubId}/discipline/staff-performances
   */
  static async createStaffPerformance(
    clubId: number,
    body: CreateStaffPerformanceBody
  ): Promise<void> {
    try {
      const response = await axiosClient.post<StandardApiResponse>(
        `/api/clubs/${clubId}/discipline/staff-performances`,
        body
      );

      console.log(`Created staff performance for club ${clubId}:`, response.data);

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.message || `Failed to create staff performance for club ${clubId}`
        );
      }
    } catch (error) {
      console.error(`Error creating staff performance for club ${clubId}:`, error);
      throw error;
    }
  }

  /**
   * Get all penalty rules (UniStaff/Admin)
   * GET /api/penalty-rules
   */
  static async getAllPenaltyRules(): Promise<PenaltyRule[]> {
    try {
      const response = await axiosClient.get<ApiResponse<PenaltyRule[]>>(
        '/api/penalty-rules'
      );

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching all penalty rules:', error);
      throw error;
    }
  }
}

export default DisciplineService;
