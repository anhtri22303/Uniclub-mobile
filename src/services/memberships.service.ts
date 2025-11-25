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
   * Get current user's clubs (all clubs the user is a member of)
   * Uses the dedicated API endpoint /api/users/me/clubs
   */
  static async getMyClubs(): Promise<ApiMembership[]> {
    try {
      const response = await axiosClient.get('/api/users/me/clubs');
      const body: any = response.data;
      
      console.log('Fetched my clubs:', body);

      // Backend returns { success, message, data }
      return body?.data || [];
    } catch (error) {
      console.error('Error fetching my clubs:', error);
      throw error;
    }
  }

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

  /**
   * Delete a membership (leader removes member)
   */
  static async deleteMember(membershipId: number): Promise<{ message: string }> {
    try {
      const response = await axiosClient.delete(`/api/memberships/${membershipId}`);
      const body: any = response.data;

      if (!body?.success) {
        throw new Error(body?.message || 'Failed to remove member');
      }
      return body.data || { message: 'Member removed successfully' };
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  /**
   * Submit leave request (student leaves club)
   * POST /api/clubs/{clubId}/leave-request
   */
  static async postLeaveRequest(clubId: number, reason: string): Promise<string> {
    try {
      const response = await axiosClient.post(
        `/api/clubs/${clubId}/leave-request`,
        { reason }
      );
      const body: any = response.data;

      if (!body?.success) {
        throw new Error(body?.message || 'Failed to submit leave request');
      }

      return body.data || body.message || 'Leave request submitted successfully';
    } catch (error) {
      console.error('Error submitting leave request:', error);
      throw error;
    }
  }

  /**
   * Get leave requests for a club (leader only)
   * GET /api/clubs/{clubId}/leave-requests
   */
  static async getLeaveRequests(clubId: number): Promise<LeaveRequest[]> {
    try {
      const response = await axiosClient.get(`/api/clubs/${clubId}/leave-requests`);
      const body: any = response.data;
      
      console.log('Fetched leave requests:', body);

      if (!body?.success) {
        throw new Error(body?.message || 'Failed to fetch leave requests');
      }

      return body.data || [];
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      throw error;
    }
  }

  /**
   * Process leave request (approve/reject)
   * PUT /api/clubs/leave-request/{requestId}?action={APPROVED|REJECTED}
   */
  static async processLeaveRequest(
    requestId: number,
    action: 'APPROVED' | 'REJECTED'
  ): Promise<string> {
    try {
      const response = await axiosClient.put(
        `/api/clubs/leave-request/${requestId}`,
        null,
        {
          params: { action },
        }
      );
      const body: any = response.data;

      if (!body?.success) {
        throw new Error(body?.message || 'Failed to process leave request');
      }

      return body.data || body.message || 'Leave request processed successfully';
    } catch (error) {
      console.error('Error processing leave request:', error);
      throw error;
    }
  }
}

// Leave request interface
export interface LeaveRequest {
  requestId: number;
  membershipId: number;
  memberName: string;
  memberEmail: string;
  memberRole: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  processedAt: string | null;
}

// Default export for convenience
export default {
  getMyClubs: MembershipsService.getMyClubs,
  getMyClubMembers: MembershipsService.getMyClubMembers,
  getMembersByClubId: MembershipsService.getMembersByClubId,
  getMyMemberships: MembershipsService.getMyMemberships,
  applyToClub: MembershipsService.applyToClub,
  deleteMember: MembershipsService.deleteMember,
  postLeaveRequest: MembershipsService.postLeaveRequest,
  getLeaveRequests: MembershipsService.getLeaveRequests,
  processLeaveRequest: MembershipsService.processLeaveRequest,
};
