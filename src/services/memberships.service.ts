import { axiosClient } from '@configs/axios';

// Member types
export interface ApiMembership {
  membershipId: number;
  userId: number;
  clubId: number;
  clubRole: 'LEADER' | 'MEMBER' | string;
  state: 'ACTIVE' | 'PENDING' | 'REJECTED' | string;
  staff: boolean;
  joinedDate?: string;
  endDate?: string;
  fullName: string;
  studentCode: string;
  clubName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  major?: string;
}

export class MembershipsService {
  /**
   * Get members by club ID
   */
  static async getMembersByClubId(clubId: number): Promise<ApiMembership[]> {
    try {
      const response = await axiosClient.get<{ success: boolean; message: string; data: ApiMembership[] }>(
        `/api/clubs/${clubId}/members`
      );
      
      console.log('Fetched club members:', response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch club members');
      }

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching club members:', error);
      throw error;
    }
  }

  /**
   * Get current user's club members (my club members)
   */
  static async getMyClubMembers(): Promise<ApiMembership[]> {
    try {
      const response = await axiosClient.get<{ success: boolean; message: string; data: ApiMembership[] }>(
        '/api/memberships/my-club'
      );
      
      console.log('Fetched my club members:', response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch my club members');
      }

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching my club members:', error);
      throw error;
    }
  }

  /**
   * Get current user's club memberships (clubs that user is a member of)
   */
  static async getMyMemberships(): Promise<ApiMembership[]> {
    try {
      const response = await axiosClient.get<{ success: boolean; message: string; data: ApiMembership[] }>(
        '/api/memberships/my-memberships'
      );
      
      console.log('Fetched my memberships:', response.data);

      // Handle different response formats
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      // If response is direct array
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching my memberships:', error);
      // Return empty array instead of throwing to handle gracefully
      return [];
    }
  }

  /**
   * Apply to join a club (create membership application)
   */
  static async applyToClub(clubId: number, message: string): Promise<any> {
    try {
      const response = await axiosClient.post<any>(
        '/api/membership-applications',
        {
          clubId: clubId,
          message: message.trim(),
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('Membership application response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error submitting membership application:', error);
      throw error;
    }
  }
}
