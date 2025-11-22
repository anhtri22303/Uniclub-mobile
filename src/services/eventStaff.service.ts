import { axiosClient } from '@configs/axios';

/**
 * Standard API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Event Staff type
 */
export interface EventStaff {
  id: number;
  eventId: number;
  eventName: string;
  membershipId: number;
  memberName: string;
  memberEmail?: string;
  duty: string;
  state: "ACTIVE" | "INACTIVE" | "EXPIRED";
  assignedAt: string;
  unassignedAt: string | null;
}

/**
 * Staff Evaluation type
 */
export interface StaffEvaluation {
  id: number;
  eventStaffId: number;
  membershipId: number;
  eventId: number;
  performance: "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT";
  note: string;
  createdAt: string;
}

/**
 * Staff Evaluation Request type
 */
export interface EvaluateStaffRequest {
  membershipId: number;
  eventId: number;
  performance: "POOR" | "AVERAGE" | "GOOD" | "EXCELLENT";
  note: string;
}

/**
 * Get event staff list
 * GET /api/events/{id}/staffs
 */
export async function getEventStaff(
  eventId: number | string
): Promise<EventStaff[]> {
  const res = await axiosClient.get<ApiResponse<EventStaff[]>>(
    `/api/events/${eventId}/staffs`
  );
  return res.data.data;
}

/**
 * Get event staff after completion (EXPIRED state)
 * GET /api/events/{eventId}/staffs/completed
 */
export async function getEventStaffCompleted(
  eventId: number | string
): Promise<EventStaff[]> {
  const res = await axiosClient.get<ApiResponse<EventStaff[]>>(
    `/api/events/${eventId}/staffs/completed`
  );
  return res.data.data;
}

/**
 * Assign staff to event
 * POST /api/events/{id}/staffs?membershipId={membershipId}&duty={duty}
 */
export async function postEventStaff(
  eventId: number | string,
  membershipId: number | string,
  duty: string
): Promise<EventStaff> {
  const res = await axiosClient.post<ApiResponse<EventStaff>>(
    `/api/events/${eventId}/staffs`,
    null,
    {
      params: {
        membershipId,
        duty,
      },
    }
  );
  return res.data.data;
}

/**
 * Evaluate staff performance after event
 * POST /api/events/{id}/staff/evaluate
 */
export async function evaluateEventStaff(
  eventId: number | string,
  request: EvaluateStaffRequest
): Promise<StaffEvaluation> {
  const res = await axiosClient.post<ApiResponse<StaffEvaluation>>(
    `/api/events/${eventId}/staff/evaluate`,
    request
  );
  return res.data.data;
}

/**
 * Get staff evaluations for event
 * GET /api/events/{eventId}/staff/evaluations
 */
export async function getEvaluateEventStaff(
  eventId: number | string
): Promise<StaffEvaluation[]> {
  const res = await axiosClient.get<ApiResponse<StaffEvaluation[]>>(
    `/api/events/${eventId}/staff/evaluations`
  );
  return res.data.data;
}

/**
 * Get top evaluated staff for event
 * GET /api/events/{eventId}/staff/evaluations/top
 */
export async function getTopEvaluatedStaff(
  eventId: number | string
): Promise<StaffEvaluation[]> {
  const res = await axiosClient.get<ApiResponse<StaffEvaluation[]>>(
    `/api/events/${eventId}/staff/evaluations/top`
  );
  return res.data.data;
}

export default {
  getEventStaff,
  getEventStaffCompleted,
  postEventStaff,
  evaluateEventStaff,
  getEvaluateEventStaff,
  getTopEvaluatedStaff,
};
