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
  duty: string;
  state: "ACTIVE" | "INACTIVE" | "REMOVED";
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
 * Delete staff from event
 * DELETE /api/events/{id}/staffs/{staffId}
 */
export async function deleteEventStaff(
  eventId: number | string,
  staffId: number | string
): Promise<string> {
  const res = await axiosClient.delete<ApiResponse<string>>(
    `/api/events/${eventId}/staffs/${staffId}`
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

/**
 * My Staff Event - Events where current user is staff
 */
export interface MyStaffEvent {
  eventId: number;
  eventName: string;
  clubId: number;
  clubName: string;
  duty: string;
  state: "ACTIVE" | "INACTIVE" | "REMOVED";
}

/**
 * Staff History Order - Staff's order approval history
 */
export interface StaffHistoryOrder {
  orderId: number;
  orderCode: string;
  productName: string;
  quantity: number;
  totalPoints: number;
  status: string;
  createdAt: string;
  completedAt: string;
  productType: string;
  clubId: number;
  eventId: number;
  clubName: string;
  memberName: string;
  reasonRefund: string;
  errorImages: string[];
}

/**
 * Get events where current user is staff
 * GET /api/events/my/staff
 */
export async function getMyStaff(): Promise<MyStaffEvent[]> {
  const res = await axiosClient.get<ApiResponse<MyStaffEvent[]>>(
    '/api/events/my/staff'
  );
  return res.data.data;
}

/**
 * Get staff's order approval history
 * GET /api/redeem/my-approvals
 */
export async function getStaffHistory(): Promise<StaffHistoryOrder[]> {
  const res = await axiosClient.get<ApiResponse<{ content: StaffHistoryOrder[] }>>(
    '/api/redeem/my-approvals'
  );
  return res.data.data.content;
}

export default {
  getEventStaff,
  getEventStaffCompleted,
  postEventStaff,
  deleteEventStaff,
  evaluateEventStaff,
  getEvaluateEventStaff,
  getTopEvaluatedStaff,
  getMyStaff,
  getStaffHistory,
};
