import { axiosClient } from '@configs/axios';

// Club type
export interface ApiClub {
  id: number;
  name: string;
}

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
  avatarUrl?: string;
  major?: string;
}

export class MembershipsService {
  /**
   * Get current user's club members (my club members)
   * This is used by club leaders to see their club's members
   */
  static async getMyClubMembers(): Promise<ApiMembership[]> {
    try {
      const response = await axiosClient.get('/api/memberships/my-club');
      const body: any = response.data;
      
      console.log('Fetched my club members:', body);

      // Backend returns { success, message, data }
      return body?.data || [];
    } catch (error) {
      console.error('Error fetching my club members:', error);
      throw error;
    }
  }

  /**
   * Get members by club ID
   * This is used to fetch members of a specific club
   */
  static async getMembersByClubId(clubId: number): Promise<ApiMembership[]> {
    try {
      const response = await axiosClient.get(`/api/clubs/${clubId}/members`);
      const body: any = response.data;
      
      console.log('Fetched all club members:', body);

      if (!body?.success) {
        throw new Error(body?.message || 'Failed to fetch club members');
      }

      return body.data || [];
    } catch (error) {
      console.error('Error fetching club members:', error);
      throw error;
    }
  }

  /**
   * Get current user's club memberships (clubs that user is a member of)
   */
  static async getMyMemberships(): Promise<ApiMembership[]> {
    try {
      const response = await axiosClient.get('/api/memberships/my-memberships');
      const body: any = response.data;
      
      console.log('Fetched my memberships:', body);

      // Handle different response formats
      if (body?.success && body?.data) {
        return body.data;
      }

      // If response is direct array
      if (Array.isArray(body)) {
        return body;
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
      const response = await axiosClient.post(
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

// Default export for convenience
export default {
  getMyClubMembers: MembershipsService.getMyClubMembers,
  getMembersByClubId: MembershipsService.getMembersByClubId,
  getMyMemberships: MembershipsService.getMyMemberships,
  applyToClub: MembershipsService.applyToClub,
};
