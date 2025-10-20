import { axiosClient } from '@configs/axios';

// API response types
export interface ClubApiResponse {
  id: number;
  name: string;
  majorName: string | null;
  leaderName: string | null;
  description: string | null;
  majorPolicyName: string | null;
  memberCount: number;
  eventCount: number;
  status?: string;
  createdAt?: string;
}

// Internal Club type
export interface Club {
  id: number;
  name: string;
  category: string;
  leaderName: string;
  members: number;
  policy: string;
  events: number;
  description: string | null;
  status?: string;
}

export interface ClubPageableResponse {
  content: ClubApiResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export class ClubService {
  /**
   * Fetch all clubs with pagination (Admin only)
   */
  static async fetchClubs(page = 0, size = 20, sort = ['name']): Promise<Club[]> {
    try {
      const response = await axiosClient.get<ClubPageableResponse>('/api/clubs', {
        params: {
          page,
          size,
          sort: sort.join(','),
        },
      });

      const body = response.data;
      console.log('Fetched clubs response:', body);

      if (body && typeof body === 'object' && 'content' in body && Array.isArray(body.content)) {
        // Transform API response to Club format
        return body.content.map((club) => ({
          id: club.id,
          name: club.name,
          category: club.majorName || '-',
          leaderName: club.leaderName || '-',
          members: club.memberCount || 0,
          policy: club.majorPolicyName || '-',
          events: club.eventCount || 0,
          description: club.description,
          status: club.status,
        }));
      }

      if (Array.isArray(body)) {
        return body.map((club) => ({
          id: club.id,
          name: club.name,
          category: club.majorName || '-',
          leaderName: club.leaderName || '-',
          members: club.memberCount || 0,
          policy: club.majorPolicyName || '-',
          events: club.eventCount || 0,
          description: club.description,
          status: club.status,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching clubs:', error);
      throw error;
    }
  }

  /**
   * Get club by ID
   */
  static async getClubById(id: number): Promise<ClubApiResponse> {
    try {
      const response = await axiosClient.get<ClubApiResponse>(`/api/clubs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching club by ID:', error);
      throw error;
    }
  }

  /**
   * Delete club by ID (Admin only)
   */
  static async deleteClub(id: number): Promise<void> {
    try {
      await axiosClient.delete(`/api/clubs/${id}`);
      console.log(`Club ${id} deleted successfully`);
    } catch (error) {
      console.error('Error deleting club:', error);
      throw error;
    }
  }

  /**
   * Update club information (Admin only)
   */
  static async updateClub(
    id: number,
    data: {
      name?: string;
      description?: string;
      majorName?: string;
      majorPolicyName?: string;
    }
  ): Promise<ClubApiResponse> {
    try {
      const response = await axiosClient.put<ClubApiResponse>(`/api/clubs/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating club:', error);
      throw error;
    }
  }

  /**
   * Create new club (Admin only)
   */
  static async createClub(data: {
    name: string;
    description?: string;
    majorName?: string;
    majorPolicyName?: string;
  }): Promise<ClubApiResponse> {
    try {
      const response = await axiosClient.post<ClubApiResponse>('/api/clubs', data);
      return response.data;
    } catch (error) {
      console.error('Error creating club:', error);
      throw error;
    }
  }

  /**
   * Get club by ID with full response structure
   */
  static async getClubByIdFull(clubId: number): Promise<{ success: boolean; message: string; data: ClubApiResponse }> {
    try {
      const response = await axiosClient.get<{ success: boolean; message: string; data: ClubApiResponse }>(
        `/api/clubs/${clubId}`
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching club ID ${clubId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Could not load club data',
        data: null as any,
      };
    }
  }

  /**
   * Get club member count
   */
  static async getClubMemberCount(clubId: number): Promise<number> {
    try {
      const response = await axiosClient.get<{
        success: boolean;
        message: string;
        data: { clubId: number; activeMemberCount: number };
      }>(`/api/clubs/${clubId}/member-count`);
      
      return response.data?.data?.activeMemberCount ?? 0;
    } catch (error) {
      console.error(`Error fetching member count for club ${clubId}:`, error);
      return 0;
    }
  }

  /**
   * Get club statistics
   */
  static async getClubStats(): Promise<any> {
    try {
      const response = await axiosClient.get<any>('/api/clubs/stats');
      const body = response.data;
      console.log('Fetched club stats response:', body);

      // If backend uses { success, message, data }
      if (body && typeof body === 'object' && 'data' in body && 'success' in body && body.success) {
        return body.data;
      }

      // If the endpoint returns the stats object directly
      if (body && typeof body === 'object') {
        return body;
      }

      return null;
    } catch (error) {
      console.error('Error fetching club stats:', error);
      throw error;
    }
  }
}
