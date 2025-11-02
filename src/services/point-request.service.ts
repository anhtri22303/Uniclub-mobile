import { axiosClient } from '@configs/axios';

export interface PointRequest {
  id: number;
  clubId: number;
  requestedPoints: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  reviewNote?: string;
}

export interface CreatePointRequestPayload {
  clubId: number;
  requestedPoints: number;
  reason: string;
}

export interface PointRequestResponse {
  success: boolean;
  message: string;
  data?: PointRequest;
}

export class PointRequestService {
  /**
   * Create a new point request
   */
  static async createPointRequest(
    payload: CreatePointRequestPayload
  ): Promise<PointRequestResponse> {
    try {
      const response = await axiosClient.post<PointRequestResponse>(
        '/api/point-requests',
        payload
      );
      console.log('createPointRequest:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create point request:', error);
      throw error;
    }
  }

  /**
   * Get point requests for a specific club
   */
  static async getClubPointRequests(clubId: number): Promise<PointRequest[]> {
    try {
      const response = await axiosClient.get(`/api/point-requests/club/${clubId}`);
      console.log('getClubPointRequests:', response.data);
      
      // Handle nested data structure
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching club point requests:', error);
      return [];
    }
  }

  /**
   * Get all point requests (admin only)
   */
  static async getAllPointRequests(): Promise<PointRequest[]> {
    try {
      const response = await axiosClient.get('/api/point-requests');
      console.log('getAllPointRequests:', response.data);
      
      // Handle nested data structure
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching all point requests:', error);
      return [];
    }
  }
}

export default PointRequestService;

