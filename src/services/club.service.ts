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
      console.log('fetchClubs response:', JSON.stringify(body, null, 2));

      // Check if response has nested data structure { success, message, data: { content: [] } }
      if (body && typeof body === 'object' && 'data' in body && typeof body.data === 'object') {
        const data = body.data as any;
        if ('content' in data && Array.isArray(data.content)) {
          // Transform API response to Club format
          return data.content.map((club: ClubApiResponse) => ({
            id: club.id,
            name: club.name,
            category: club.majorName || '-',
            leaderName: club.leaderName || 'No Leader',
            members: club.memberCount ?? 0,
            policy: club.majorPolicyName || '-',
            events: club.eventCount ?? 0,
            description: club.description,
            status: club.status,
          }));
        }
      }

      // Check if response has content directly { content: [] }
      if (body && typeof body === 'object' && 'content' in body && Array.isArray(body.content)) {
        // Transform API response to Club format
        return body.content.map((club) => ({
          id: club.id,
          name: club.name,
          category: club.majorName || '-',
          leaderName: club.leaderName || 'No Leader',
          members: club.memberCount ?? 0,
          policy: club.majorPolicyName || '-',
          events: club.eventCount ?? 0,
          description: club.description,
          status: club.status,
        }));
      }

      if (Array.isArray(body)) {
        return body.map((club) => ({
          id: club.id,
          name: club.name,
          category: club.majorName || '-',
          leaderName: club.leaderName || 'No Leader',
          members: club.memberCount ?? 0,
          policy: club.majorPolicyName || '-',
          events: club.eventCount ?? 0,
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
   * Get club by ID with full response structure (with success wrapper)
   */
  static async getClubByIdFull(clubId: number): Promise<{ success: boolean; message: string; data: ClubApiResponse }> {
    try {
      const response = await axiosClient.get(`/api/clubs/${clubId}`);
      const body: any = response.data;
      
      console.log('getClubByIdFull response:', body);
      
      // If backend returns wrapped response { success, message, data }
      if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
        return body as { success: boolean; message: string; data: ClubApiResponse };
      }
      
      // If backend returns club data directly, wrap it
      return {
        success: true,
        message: 'Club fetched successfully',
        data: body as ClubApiResponse,
      };
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
  static async getClubMemberCount(clubId: number): Promise<{ activeMemberCount: number; approvedEvents: number }> {
    try {
      const response = await axiosClient.get<{
        success: boolean;
        message: string;
        data: { clubId: number; activeMemberCount: number; approvedEvents: number };
      }>(`/api/clubs/${clubId}/member-count`);
      
      return {
        activeMemberCount: response.data?.data?.activeMemberCount ?? 0,
        approvedEvents: response.data?.data?.approvedEvents ?? 0,
      };
    } catch (error) {
      console.error(`Error fetching member count for club ${clubId}:`, error);
      return { activeMemberCount: 0, approvedEvents: 0 };
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

  /**
   * Get all clubs without pagination (for simple listing)
   */
  static async getAllClubs(): Promise<Club[]> {
    try {
      const response = await axiosClient.get<ClubPageableResponse>('/api/clubs', {
        params: {
          page: 0,
          size: 1000, // Large size to get all clubs
          sort: 'name',
        },
      });

      const body = response.data;
      console.log('getAllClubs response:', JSON.stringify(body, null, 2));

      // Check if response has nested data structure { success, message, data: { content: [] } }
      if (body && typeof body === 'object' && 'data' in body && typeof body.data === 'object') {
        const data = body.data as any;
        if ('content' in data && Array.isArray(data.content)) {
          return data.content.map((club: ClubApiResponse) => ({
            id: club.id,
            name: club.name,
            category: club.majorName || '-',
            leaderName: club.leaderName || 'No Leader',
            members: club.memberCount ?? 0, // Use nullish coalescing for null values
            policy: club.majorPolicyName || '-',
            events: club.eventCount ?? 0, // Use nullish coalescing for null values
            description: club.description,
            status: club.status,
          }));
        }
      }

      // Check if response has content directly { content: [] }
      if (body && typeof body === 'object' && 'content' in body && Array.isArray(body.content)) {
        return body.content.map((club) => ({
          id: club.id,
          name: club.name,
          category: club.majorName || '-',
          leaderName: club.leaderName || 'No Leader',
          members: club.memberCount ?? 0, // Use nullish coalescing for null values
          policy: club.majorPolicyName || '-',
          events: club.eventCount ?? 0, // Use nullish coalescing for null values
          description: club.description,
          status: club.status,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching all clubs:', error);
      throw error;
    }
  }

  /**
   * Get clubId from stored auth token
   */
  static getClubIdFromToken(): number | null {
    try {
      const authStore = require('@stores/auth.store');
      const token = authStore.useAuthStore.getState()?.token;
      
      if (!token) {
        console.warn('No token found in auth store');
        return null;
      }

      // Simple JWT decode - split token and decode payload
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format');
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      return payload.clubId ?? null;
    } catch (error) {
      console.error('Error getting clubId from token:', error);
      return null;
    }
  }
}
