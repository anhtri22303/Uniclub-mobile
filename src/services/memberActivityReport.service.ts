import { axiosClient } from '@configs/axios';

/**
 * Activity level definitions
 */
export type ActivityLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

/**
 * Staff evaluation definitions
 */
export type StaffEvaluation = "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT" | "UNKNOWN";

/**
 * Full score interface - used for live data and detailed views
 */
export interface MemberActivityFullScore {
  membershipId: number;
  userId: number;
  fullName: string;
  studentCode: string;
  clubId: number;
  clubName: string;
  year: number;
  month: number;

  // Event Info
  totalEventRegistered: number;
  totalEventAttended: number;
  eventAttendanceRate: number;
  totalPenaltyPoints: number;

  // Attendance Score Info
  activityLevel: ActivityLevel | string;
  attendanceBaseScore: number;
  attendanceMultiplier: number;
  attendanceTotalScore: number;

  // Staff Score Info
  staffBaseScore: number;
  totalStaffCount: number;
  staffEvaluation: StaffEvaluation | string;
  staffMultiplier: number;
  staffScore: number;
  staffTotalScore: number;

  // Club Session Info
  totalClubSessions: number;
  totalClubPresent: number;
  sessionAttendanceRate: number;

  // Final
  finalScore: number;
}

/**
 * Short summary interface - used for history
 */
export interface MemberActivityShortItem {
  membershipId: number;
  userId: number;
  fullName: string;
  studentCode: string;
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  totalEventRegistered: number;
  totalEventAttended: number;
  totalPenaltyPoints: number;
  totalStaffCount: number;
  totalClubSessions: number;
  totalClubPresent: number;
  finalScore: number;
}

/**
 * Club activity summary
 */
export interface ClubActivitySummary {
  clubId: number;
  clubName: string;
  year: number;
  month: number;
  totalEventsCompleted: number;
  memberCount: number;
  fullMembersCount: number;
  memberOfMonth: MemberActivityFullScore;
  clubMultiplier: number;
}

/**
 * Score calculation result (preview)
 */
export interface ScoreCalculationResult {
  attendanceBaseScore: number;
  attendanceMultiplier: number;
  attendanceTotalScore: number;
  staffBaseScore: number;
  staffMultiplier: number;
  staffTotalScore: number;
  finalScore: number;
}

// API Response interfaces
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Parameters interfaces
export interface GetClubMemberActivityParams {
  clubId: number;
  year: number;
  month: number;
}

export interface GetLiveActivityParams {
  clubId: number;
  attendanceBase?: number;
  staffBase?: number;
}

export class MemberActivityReportService {
  /**
   * Get club member activity history (short summary)
   * GET /api/clubs/{clubId}/members/activity
   */
  static async getClubMemberActivity({
    clubId,
    year,
    month,
  }: GetClubMemberActivityParams): Promise<MemberActivityShortItem[]> {
    try {
      const response = await axiosClient.get<ApiResponse<MemberActivityShortItem[]>>(
        `/api/clubs/${clubId}/members/activity`,
        { params: { year, month } }
      );

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching club member activity:', error);
      throw error;
    }
  }

  /**
   * Get live activity scores (full details)
   * GET /api/clubs/{clubId}/members/activity-live
   */
  static async getClubMemberActivityLive({
    clubId,
    attendanceBase = 100,
    staffBase = 100,
  }: GetLiveActivityParams): Promise<MemberActivityFullScore[]> {
    try {
      const response = await axiosClient.get<ApiResponse<MemberActivityFullScore[]>>(
        `/api/clubs/${clubId}/members/activity-live`,
        {
          params: {
            attendanceBase,
            staffBase,
          },
        }
      );

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching live activity:', error);
      throw error;
    }
  }

  /**
   * Get my member activity
   * GET /api/clubs/{clubId}/members/me/activity
   */
  static async getMyMemberActivity({
    clubId,
    year,
    month,
  }: GetClubMemberActivityParams): Promise<MemberActivityFullScore> {
    try {
      const response = await axiosClient.get<ApiResponse<MemberActivityFullScore>>(
        `/api/clubs/${clubId}/members/me/activity`,
        { params: { year, month } }
      );

      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to fetch my activity');
    } catch (error) {
      console.error('Error fetching my activity:', error);
      throw error;
    }
  }

  /**
   * Get club activity summary
   * GET /api/clubs/{clubId}/activity/summary
   */
  static async getClubActivitySummary({
    clubId,
    year,
    month,
  }: GetClubMemberActivityParams): Promise<ClubActivitySummary> {
    try {
      const response = await axiosClient.get<ApiResponse<ClubActivitySummary>>(
        `/api/clubs/${clubId}/activity/summary`,
        { params: { year, month } }
      );

      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to fetch summary');
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  }

  /**
   * Auto-generate monthly report
   * POST /api/clubs/{clubId}/activity/monthly/auto-generate
   */
  static async autoGenerateMonthlyReport(
    clubId: number,
    year: number,
    month: number
  ): Promise<string> {
    try {
      const response = await axiosClient.post<ApiResponse<string>>(
        `/api/clubs/${clubId}/activity/monthly/auto-generate`,
        null,
        { params: { year, month } }
      );

      if (response.data && response.data.success) {
        return response.data.message;
      }
      throw new Error(response.data?.message || 'Failed to generate report');
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }
}

export default MemberActivityReportService;
