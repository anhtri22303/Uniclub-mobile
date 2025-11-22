import { axiosClient } from '@configs/axios';

/**
 * Feedback interface
 */
export interface Feedback {
  feedbackId: number;
  eventId: number;
  eventName: string;
  clubName: string;
  memberName?: string;
  membershipId: number;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * API response wrapper for feedback
 */
interface FeedbackApiResponse {
  success: boolean;
  message: string;
  data: Feedback[];
}

/**
 * Post feedback request
 */
export interface PostFeedbackRequest {
  rating: number;
  comment: string;
}

/**
 * Single feedback API response
 */
interface PostFeedbackApiResponse {
  success: boolean;
  message: string;
  data: Feedback;
}

export class FeedbackService {
  /**
   * Get feedbacks by membership ID
   * GET /api/events/memberships/{membershipId}/feedbacks
   */
  static async getMyFeedbackByMembershipId(
    membershipId: string | number
  ): Promise<Feedback[]> {
    try {
      const response = await axiosClient.get<FeedbackApiResponse>(
        `/api/events/memberships/${membershipId}/feedbacks`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch feedbacks for membership ${membershipId}:`, error);
      throw error;
    }
  }

  /**
   * Get all feedback for a specific event
   * GET /api/events/{eventId}/feedback
   */
  static async getFeedbackByEventId(eventId: string | number): Promise<Feedback[]> {
    try {
      const response = await axiosClient.get<FeedbackApiResponse>(
        `/api/events/${eventId}/feedback`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch feedback for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get all feedback for a specific club
   * GET /api/events/clubs/{clubId}/feedbacks
   */
  static async getFeedbackByClubId(clubId: string | number): Promise<Feedback[]> {
    try {
      const response = await axiosClient.get<FeedbackApiResponse>(
        `/api/events/clubs/${clubId}/feedbacks`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch feedback for club ${clubId}:`, error);
      throw error;
    }
  }

  /**
   * Post feedback for a specific event
   * POST /api/events/{eventId}/feedback
   */
  static async postFeedback(
    eventId: string | number,
    feedbackData: PostFeedbackRequest
  ): Promise<Feedback> {
    try {
      const response = await axiosClient.post<PostFeedbackApiResponse>(
        `/api/events/${eventId}/feedback`,
        feedbackData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to post feedback for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get all feedbacks for the currently authenticated student
   * GET /api/events/my-feedbacks
   */
  static async getMyFeedbacks(): Promise<Feedback[]> {
    try {
      const response = await axiosClient.get<FeedbackApiResponse>(
        '/api/events/my-feedbacks'
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch my feedbacks:', error);
      throw error;
    }
  }

  /**
   * Update feedback for an event
   * PUT /api/events/feedback/{feedbackId}
   */
  static async updateFeedback(
    feedbackId: string | number,
    feedbackData: PostFeedbackRequest
  ): Promise<Feedback> {
    try {
      const response = await axiosClient.put<PostFeedbackApiResponse>(
        `/api/events/feedback/${feedbackId}`,
        feedbackData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update feedback ${feedbackId}:`, error);
      throw error;
    }
  }

  /**
   * Get feedback summary for an event
   * GET /api/events/{eventId}/feedback/summary
   */
  static async getFeedbackSummary(
    eventId: string | number
  ): Promise<Record<string, number>> {
    try {
      const response = await axiosClient.get<{
        success: boolean;
        message: string;
        data: Record<string, number>;
      }>(`/api/events/${eventId}/feedback/summary`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch feedback summary for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Update feedback for an event
   * PUT /api/events/feedback/{feedbackId}
   */
  static async putFeedback(
    feedbackId: string | number,
    feedbackData: PostFeedbackRequest
  ): Promise<Feedback> {
    try {
      const response = await axiosClient.put<PostFeedbackApiResponse>(
        `/api/events/feedback/${feedbackId}`,
        feedbackData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update feedback ${feedbackId}:`, error);
      throw error;
    }
  }
}

export default FeedbackService;
