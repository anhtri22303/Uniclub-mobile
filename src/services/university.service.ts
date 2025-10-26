import { axiosClient } from '@configs/axios';

// Interface for club ranking
export interface ClubRanking {
  rank: number;
  clubId: number;
  clubName: string;
  totalPoints: number;
}

// Interface for university points response
export interface UniversityPointsResponse {
  totalUniversityPoints: number;
  clubRankings: ClubRanking[];
}

// Interface for monthly attendance summary
export interface MonthlySummary {
  month: string;
  participantCount: number;
}

// Interface for attendance summary response
export interface AttendanceSummaryResponse {
  year: number;
  monthlySummary: MonthlySummary[];
  clubId: number | null;
  eventId: number | null;
}

// Interface for club attendance ranking
export interface ClubAttendanceRanking {
  rank: number;
  clubId: number;
  clubName: string;
  attendanceCount: number;
}

// Interface for attendance ranking response
export interface AttendanceRankingResponse {
  totalAttendances: number;
  clubRankings: ClubAttendanceRanking[];
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class UniversityService {
  /**
   * Fetch university points and club rankings
   * GET /api/university/points
   */
  static async fetchUniversityPoints(): Promise<UniversityPointsResponse> {
    try {
      console.log('fetchUniversityPoints: GET /api/university/points');
      const response = await axiosClient.get('/api/university/points');
      const body = response.data;
      console.log('fetchUniversityPoints response:', body);

      // If backend wraps the response with { success, message, data }
      if (body && typeof body === 'object' && 'data' in body) {
        return body.data as UniversityPointsResponse;
      }

      // If the endpoint returns the data directly
      return body as UniversityPointsResponse;
    } catch (error) {
      console.error('Error fetching university points:', error);
      throw error;
    }
  }

  /**
   * Fetch university attendance summary
   * GET /api/university/attendance-summary
   */
  static async fetchAttendanceSummary(year: number): Promise<AttendanceSummaryResponse> {
    try {
      console.log(`fetchAttendanceSummary: GET /api/university/attendance-summary?year=${year}`);
      const response = await axiosClient.get('/api/university/attendance-summary', {
        params: { year },
      });
      const body = response.data;
      console.log('fetchAttendanceSummary response:', body);

      // If backend wraps the response with { success, message, data }
      if (body && typeof body === 'object' && 'data' in body) {
        return body.data as AttendanceSummaryResponse;
      }

      // If the endpoint returns the data directly
      return body as AttendanceSummaryResponse;
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }
  }

  /**
   * Fetch university attendance ranking (top clubs by attendance)
   * GET /api/university/attendance-ranking
   */
  static async fetchAttendanceRanking(): Promise<AttendanceRankingResponse> {
    try {
      console.log('fetchAttendanceRanking: GET /api/university/attendance-ranking');
      const response = await axiosClient.get('/api/university/attendance-ranking');
      const body = response.data;
      console.log('fetchAttendanceRanking response:', body);

      // If backend wraps the response with { success, message, data }
      if (body && typeof body === 'object' && 'data' in body) {
        return body.data as AttendanceRankingResponse;
      }

      // If the endpoint returns the data directly
      return body as AttendanceRankingResponse;
    } catch (error) {
      console.error('Error fetching attendance ranking:', error);
      throw error;
    }
  }
}

export default UniversityService;

