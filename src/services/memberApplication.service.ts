import { axiosClient } from '@configs/axios';

export interface MemberApplication {
  applicationId: number;
  clubId: number;
  clubName: string;
  applicantId: number;
  applicantName: string;
  applicantEmail: string;
  status: string;
  message: string;
  reason: string;
  handledById?: number;
  handledByName?: string;
  createdAt: string;
  updatedAt: string;
  studentCode: string;
}

export class MemberApplicationService {
  /**
   * Create a new member application
   * POST /api/member-applications
   */
  static async createMemberApplication(payload: {
    clubId: number | string;
    message: string;
  }): Promise<MemberApplication> {
    try {
      const response = await axiosClient.post<MemberApplication>(
        '/api/member-applications',
        {
          clubId: Number(payload.clubId),
          message: payload.message,
        }
      );

      console.log('✅ Posted member application:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        'Error posting member application:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Get all member applications
   * GET /api/member-applications
   */
  static async getAllMemberApplications(): Promise<MemberApplication[]> {
    try {
      const response = await axiosClient.get('/api/member-applications');
      console.log('✅ Fetched all member applications:', response.data);

      const data: any = response.data;

      // Handle different response formats
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (data?.content && Array.isArray(data.content)) return data.content;

      return [];
    } catch (error: any) {
      console.error(
        '❌ Error fetching member applications:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Get current user's member applications
   * GET /api/member-applications/my
   */
  static async getMyMemberApplications(): Promise<MemberApplication[]> {
    try {
      const response = await axiosClient.get<{
        success: boolean;
        message: string;
        data: MemberApplication[];
      }>('/api/member-applications/my');

      // console.log('✅ My member applications:', response.data);

      // Response structure: { success, message, data }
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      // Fallback to direct data if no wrapper
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error(
        '❌ Error fetching my member applications:',
        error.response?.data || error.message
      );
      // Return empty array instead of throwing to handle gracefully
      return [];
    }
  }

  /**
   * Get member applications by club ID
   * GET /api/member-applications/club/{clubId}
   */
  static async getMemberApplicationsByClubId(
    clubId: string | number
  ): Promise<MemberApplication[]> {
    try {
      const response = await axiosClient.get(
        `/api/member-applications/club/${clubId}`
      );
      const resData: any = response.data;

      console.log(
        `✅ Fetched member applications for club ${clubId}:`,
        resData
      );

      // Handle different response formats
      if (Array.isArray(resData)) return resData;
      if (resData?.data && Array.isArray(resData.data)) return resData.data;
      if (resData?.content && Array.isArray(resData.content))
        return resData.content;

      return [];
    } catch (error: any) {
      console.error(
        `❌ Error fetching member applications for club ${clubId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Update member application status (approve/reject)
   * PUT /api/member-applications/{applicationId}/status
   */
  static async updateApplicationStatus(
    applicationId: number | string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string
  ): Promise<MemberApplication> {
    try {
      const response = await axiosClient.put<MemberApplication>(
        `/api/member-applications/${applicationId}/status`,
        {
          status,
          reason: reason || (status === 'APPROVED' ? 'Approved' : 'Rejected'),
        }
      );

      console.log(
        `✅ Updated application status to ${status}:`,
        response.data
      );
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Error updating application status:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Approve member application
   * PUT /api/member-applications/{applicationId}/status
   */
  static async approveMemberApplication(
    applicationId: number | string
  ): Promise<MemberApplication> {
    return this.updateApplicationStatus(
      applicationId,
      'APPROVED',
      'Approved by club leader'
    );
  }

  /**
   * Reject member application
   * PUT /api/member-applications/{applicationId}/status
   */
  static async rejectMemberApplication(
    applicationId: number | string,
    reason: string
  ): Promise<MemberApplication> {
    return this.updateApplicationStatus(applicationId, 'REJECTED', reason);
  }

  /**
   * Delete member application
   * DELETE /api/member-applications/{applicationId}
   */
  static async deleteMemberApplication(
    applicationId: number | string
  ): Promise<any> {
    try {
      const response = await axiosClient.delete(
        `/api/member-applications/${applicationId}`
      );

      console.log('✅ Deleted membership application:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Error deleting application:',
        error.response?.data || error.message
      );
      throw error;
    }
  }
}
