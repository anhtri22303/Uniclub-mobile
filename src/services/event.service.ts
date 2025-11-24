import { axiosClient } from '@configs/axios';

// TimeObject type for handling time data
export interface TimeObject {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

// Helper function to convert TimeObject to string (HH:MM:SS format)
export const timeObjectToString = (time: TimeObject | string | null | undefined): string => {
  if (!time) return '00:00:00';
  if (typeof time === 'string') return time;
  const { hour = 0, minute = 0, second = 0 } = time;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
};

// Helper function to convert string to TimeObject
export const timeStringToObject = (timeStr: string): TimeObject => {
  const [hour = 0, minute = 0, second = 0] = timeStr.split(':').map(Number);
  return { hour, minute, second, nano: 0 };
};

export interface Event {
  id: number;
  name: string;
  description: string;
  type: "PUBLIC" | "PRIVATE" | string;
  date: string;
  startTime: TimeObject | string;
  endTime: TimeObject | string;
  registrationDeadline?: string; // NEW: Registration deadline
  status: "PENDING_COCLUB" | "PENDING_UNISTAFF" | "APPROVED" | "REJECTED" | "CANCELLED" | "WAITING" | "ONGOING" | "COMPLETED" | string;
  checkInCode: string;
  locationName: string;
  maxCheckInCount: number;
  currentCheckInCount: number;
  budgetPoints: number;
  commitPointCost?: number; // NEW: Commit point cost (ticket price)
  hostClub: {
    id: number;
    name: string;
  };
  coHostedClubs?: Array<{
    id: number;
    name: string;
    coHostStatus: string;
  }>;
  points?: number;
  // Legacy fields for backward compatibility
  clubId?: number;
  clubName?: string;
  time?: string;
  locationId?: number;
  category?: string;
  expectedAttendees?: number;
  venue?: string;
  eventDate?: string;
  eventName?: string;
  eventType?: string;
  requestedBy?: string;
}

// Event Wallet interface
export interface EventWallet {
  eventId: number;
  eventName: string;
  hostClubName: string;
  budgetPoints: number;
  balancePoints: number;
  ownerType: string;
  createdAt: string;
  transactions: WalletTransaction[];
}

// Wallet Transaction interface
export interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

// Event Summary interface
export interface EventSummary {
  eventId: number;
  registrationsCount: number;
  refundedCount: number;
  eventName: string;
  eventDate: string;
}

export interface CreateEventPayload {
  hostClubId: number;
  coHostClubIds?: number[];
  name: string;
  description: string;
  type: "PUBLIC" | "PRIVATE" | "SPECIAL";
  date: string; // Format: YYYY-MM-DD
  startTime: string;  // Format: HH:MM (e.g., "09:00")
  endTime: string;    // Format: HH:MM (e.g., "15:00")
  registrationDeadline: string; // Format: YYYY-MM-DD
  locationId: number;
  maxCheckInCount: number;
  commitPointCost: number; // Ticket price in points
}

export interface Location {
  id: number;
  name: string;
  capacity?: number;
  maxCapacity?: number;
  seatingCapacity?: number;
}

export interface Club {
  id: number;
  name: string;
}

/**
 * Fetch all events from the backend.
 */
export const fetchEvent = async (): Promise<Event[]> => {
  try {
    const response = await axiosClient.get("api/events");
    const data: any = response.data;
    
    // Handle different response structures
    if (data && Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    return data || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

/**
 * Create a new event.
 */
export const createEvent = async (payload: CreateEventPayload): Promise<Event> => {
  try {
    const response = await axiosClient.post("api/events", payload);
    const data: any = response.data;
    console.log("Create event response:", data);
    // Response structure: { success: true, message: "success", data: {...event} }
    if (data?.data) return data.data;
    return data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

/**
 * Get event by ID.
 */
export const getEventById = async (id: string | number): Promise<Event> => {
  try {
    const response = await axiosClient.get(`api/events/${id}`);
    const resData: any = response.data;
    
    if (resData && resData.data) return resData.data;
    return resData;
  } catch (error) {
    console.error(`Error fetching event by id ${id}:`, error);
    throw error;
  }
};

/**
 * Update event status - Approve budget (updated to match web API)
 * PUT /api/events/{eventId}/approve-budget
 */
export const putEventStatus = async (id: string | number, approvedBudgetPoints: number): Promise<Event> => {
  try {
    const response = await axiosClient.put(
      `api/events/${id}/approve-budget`,
      { approvedBudgetPoints }
    );
    const data: any = response.data;
    console.log(`Approved budget for event ${id} with points: ${approvedBudgetPoints}:`, data);
    
    if (data && data.data) return data.data;
    return data;
  } catch (error) {
    console.error(`Error approving budget for event ${id}:`, error);
    throw error;
  }
};

/**
 * Get all settled events
 * GET /api/events/settled
 */
export const getEventSettle = async () => {
  try {
    const response = await axiosClient.get(`/api/events/settled`);
    const data: any = response.data;
    console.log(`Fetched settled events:`, data);
    // Response structure: { success: true, message: "success", data: [...] }
    if (data?.data) return data.data;
    return data;
  } catch (error) {
    console.error(`Error fetching settled events:`, error);
    throw error;
  }
};

/**
 * Get event by code.
 */
export const getEventByCode = async (code: string): Promise<Event> => {
  try {
    const response = await axiosClient.get(`/api/events/code/${encodeURIComponent(code)}`);
    const resData: any = response.data;
    
    if (resData?.success && resData?.data) return resData.data;
    if (resData && typeof resData === "object" && (resData.id || resData.name)) return resData;
    throw new Error(resData?.message || "Event not found");
  } catch (error) {
    console.error(`Error fetching event by code ${code}:`, error);
    throw error;
  }
};

/**
 * Get events by club ID.
 */
export const getEventByClubId = async (clubId: string | number): Promise<Event[]> => {
  try {
    const response = await axiosClient.get(`/api/events/club/${clubId}`);
    const resData: any = response.data;
    
    if (Array.isArray(resData)) return resData;
    if (resData?.data && Array.isArray(resData.data)) return resData.data;
    if (resData?.content && Array.isArray(resData.content)) return resData.content;
    
    return [];
  } catch (error) {
    console.error(`Error fetching events for club ${clubId}:`, error);
    throw error;
  }
};

/**
 * Fetch locations from the backend.
 */
export const fetchLocation = async (): Promise<Location[]> => {
  try {
    const response = await axiosClient.get("api/locations");
    const data: any = response.data;
    
    if (data && Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    return data || [];
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
};

/**
 * Fetch clubs from the backend.
 */
export const fetchClub = async (): Promise<Club[]> => {
  try {
    const response = await axiosClient.get("api/clubs");
    const data: any = response.data;
    
    if (data && Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    return data || [];
  } catch (error) {
    console.error("Error fetching clubs:", error);
    throw error;
  }
};

/**
 * Update an existing event.
 */
export const updateEvent = async (id: string | number, payload: Partial<CreateEventPayload>): Promise<Event> => {
  try {
    const response = await axiosClient.put(`api/events/${id}`, payload);
    const data: any = response.data;
    console.log(`Updated event ${id}:`, data);
    // Response structure: { success: true, message: "success", data: {...event} }
    if (data?.data) return data.data;
    return data;
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an event.
 */
export const deleteEvent = async (id: string | number): Promise<void> => {
  try {
    await axiosClient.delete(`api/events/${id}`);
    console.log(`Deleted event ${id}`);
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    throw error;
  }
};

/**
 * Get events co-hosted by a club
 */
export const getEventCoHostByClubId = async (clubId: string | number): Promise<Event[]> => {
  try {
    const response = await axiosClient.get(`/api/events/club/${clubId}/cohost`);
    const resData: any = response.data;
    console.log(`Fetched co-host events for club ${clubId}:`, resData);
    
    // If response is direct array of events
    if (Array.isArray(resData)) return resData;
    
    // If response has wrapper structure like { success, data, message }
    if (resData?.data && Array.isArray(resData.data)) return resData.data;
    
    // If response has content property (pagination)
    if (resData?.content && Array.isArray(resData.content)) return resData.content;
    
    // Fallback to empty array if no events found
    return [];
  } catch (error) {
    console.error(`Error fetching co-host events for club ${clubId}:`, error);
    throw error;
  }
};

/**
 * Submit event to university for approval
 */
export const submitForUniversityApproval = async (eventId: string | number): Promise<void> => {
  try {
    await axiosClient.post(`/api/events/${eventId}/submit-university`);
    console.log(`Event ${eventId} submitted to university for approval`);
  } catch (error) {
    console.error(`Error submitting event ${eventId} to university:`, error);
    throw error;
  }
};

/**
 * Respond to co-host invitation
 */
export const coHostRespond = async (eventId: string | number, accept: boolean): Promise<{ message: string }> => {
  try {
    const response = await axiosClient.post(`/api/events/${eventId}/cohost/respond`, null, {
      params: { accept }
    });
    const data: any = response.data;
    return { message: data.message || (accept ? 'Co-host invitation accepted' : 'Co-host invitation rejected') };
  } catch (error) {
    console.error(`Error responding to co-host invitation for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Get event wallet with transaction history
 */
export const getEventWallet = async (eventId: string | number): Promise<EventWallet> => {
  try {
    const response = await axiosClient.get(`/api/events/${eventId}/wallet/detail`);
    const resData: any = response.data;
    
    // Handle response structure: { success, message, data }
    if (resData?.data) return resData.data;
    
    // Fallback for direct data
    return resData;
  } catch (error) {
    console.error(`Error fetching wallet for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Get event summary (registrations, refunds, etc.)
 */
export const getEventSummary = async (eventId: string | number): Promise<EventSummary> => {
  try {
    const response = await axiosClient.get(`/api/events/${eventId}/summary`);
    const resData: any = response.data;
    
    // Handle response structure: { success, message, data }
    if (resData?.data) return resData.data;
    
    // Fallback for direct data
    return resData;
  } catch (error) {
    console.error(`Error fetching summary for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Complete an event (mark as COMPLETED)
 */
export const completeEvent = async (eventId: string | number): Promise<{ message: string }> => {
  try {
    const response = await axiosClient.post(`/api/events/${eventId}/complete`);
    const data: any = response.data;
    return { message: data.message || 'Event completed successfully' };
  } catch (error) {
    console.error(`Error completing event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Register for an event
 */
export const registerForEvent = async (eventId: string | number): Promise<{ success: boolean; message: string; data: string }> => {
  try {
    const response = await axiosClient.post(`/api/events/register`, { eventId });
    const data: any = response.data;
    console.log(`Registered for event ${eventId}:`, data);
    return data;
  } catch (error) {
    console.error(`Error registering for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Event Registration interface
 */
export interface EventRegistration {
  clubName: string;
  status: string;
  eventId: number;
  eventName: string;
  registeredAt: string;
  attendanceLevel: string;
  date: string;
  committedPoints: number;
}

/**
 * Get my event registrations
 */
export const getMyEventRegistrations = async (): Promise<EventRegistration[]> => {
  try {
    const response = await axiosClient.get(`/api/events/my-registrations`);
    const data: any = response.data;
    console.log(`Fetched my event registrations:`, data);
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.error(`Error fetching my event registrations:`, error);
    throw error;
  }
};

/**
 * Generate QR token for specific phase
 * Updated to match web implementation with new API endpoint
 */
export const eventQR = async (eventId: string | number, phase: string): Promise<{ phase: string; token: string; expiresIn: number }> => {
  try {
    console.log(`[eventQR] Calling API with eventId: ${eventId}, phase: ${phase}`);
    const response = await axiosClient.get(`/api/events/${eventId}/attendance/qr`, {
      params: { phase }
    });
    const data: any = response.data;
    console.log(`[eventQR] API Response for event ${eventId} phase ${phase}:`, JSON.stringify(data, null, 2));
    // Response structure: { success: true, message: "success", data: { phase: "CHECK_IN", token: "string", expiresIn: 120 } }
    if (data?.data) {
      return data.data as { phase: string; token: string; expiresIn: number };
    }
    // Fallback for direct response
    return {
      phase: data.phase || phase,
      token: data.token,
      expiresIn: data.expiresIn || 120
    };
  } catch (error) {
    console.error(`Error generating QR for event ${eventId} phase ${phase}:`, error);
    throw error;
  }
};

// Feedback interfaces
export interface EventFeedback {
  feedbackId: number;
  eventId: number;
  eventName: string;
  clubName: string;
  membershipId: string;
  memberName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get feedbacks by membership (for students to view their own feedbacks)
 */
export const getFeedbacksByMembership = async (membershipId: string | number): Promise<EventFeedback[]> => {
  try {
    const response = await axiosClient.get(`/api/events/memberships/${membershipId}/feedbacks`);
    const data: any = response.data;
    console.log(`Fetched feedbacks for membership ${membershipId}:`, data);
    
    // Handle response structure
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    
    return [];
  } catch (error) {
    console.error(`Error fetching feedbacks for membership ${membershipId}:`, error);
    throw error;
  }
};

/**
 * Get all feedbacks for an event
 */
export const getEventFeedbacks = async (eventId: string | number): Promise<EventFeedback[]> => {
  try {
    const response = await axiosClient.get(`/api/events/${eventId}/feedback`);
    const data: any = response.data;
    console.log(`Fetched feedbacks for event ${eventId}:`, data);
    
    // Handle response structure
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    
    return [];
  } catch (error) {
    console.error(`Error fetching feedbacks for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Get my events (events user has registered for)
 */
export const getMyEvents = async (): Promise<Event[]> => {
  try {
    const response = await axiosClient.get('/api/events/my');
    const data: any = response.data;
    console.log('Fetched my events:', data);
    
    // Handle response structure
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    
    return [];
  } catch (error) {
    console.error('Error fetching my events:', error);
    throw error;
  }
};

/**
 * Cancel event registration
 * PUT /api/events/{eventId}/cancel
 */
export const cancelEventRegistration = async (eventId: string | number): Promise<{ success: boolean; message: string; data: string }> => {
  try {
    const response = await axiosClient.put(`/api/events/${eventId}/cancel`);
    const data: any = response.data;
    console.log(`Cancelled registration for event ${eventId}:`, data);
    return data;
  } catch (error) {
    console.error(`Error cancelling registration for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Extend event time
 * PUT /api/events/{eventId}/extend
 */
export interface EventTimeExtendPayload {
  newDate: string;       // Format: YYYY-MM-DD
  newStartTime: string;  // Format: HH:mm (e.g., 09:00)
  newEndTime: string;    // Format: HH:mm (e.g., 23:59)
  reason: string;        // Reason for extension
}

export const eventTimeExtend = async (eventId: string | number, payload: EventTimeExtendPayload): Promise<Event> => {
  try {
    const response = await axiosClient.put(`/api/events/${eventId}/extend`, payload);
    const data: any = response.data;
    console.log(`Extended time for event ${eventId}:`, data);
    if (data?.data) return data.data;
    return data;
  } catch (error) {
    console.error(`Error extending time for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Reject event (University Staff or Admin)
 * PUT /api/events/{eventId}/reject
 */
export const rejectEvent = async (eventId: string | number, reason: string) => {
  try {
    const response = await axiosClient.put(`/api/events/${eventId}/reject`, null, {
      params: { reason }
    });
    const data: any = response.data;
    console.log(`Rejected event ${eventId} with reason: ${reason}`, data);
    return data;
  } catch (error) {
    console.error(`Error rejecting event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Settle a completed event
 * POST /api/events/{eventId}/settle
 */
export const eventSettle = async (eventId: string | number) => {
  try {
    const response = await axiosClient.post(`/api/events/${eventId}/settle`);
    const data: any = response.data;
    console.log(`Settled event ${eventId}:`, data);
    return data;
  } catch (error) {
    console.error(`Error settling event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Refund event product to a user
 * PUT /api/events/{eventId}/refund-product/{productId}
 */
export const refundEventProduct = async (
  eventId: string | number,
  productId: string | number,
  userId: string | number
) => {
  try {
    const response = await axiosClient.put(
      `/api/events/${eventId}/refund-product/${productId}`,
      null,
      { params: { userId } }
    );
    const data: any = response.data;
    console.log(`Refunded product ${productId} for user ${userId} from event ${eventId}:`, data);
    return data;
  } catch (error) {
    console.error(`Error refunding product for event ${eventId}:`, error);
    throw error;
  }
};

/**
 * Check-in to a public event using check-in code
 * POST /api/events/public/checkin?code={code}
 */
export const eventCheckinPublic = async (code: string): Promise<{ success: boolean; message: string; data: string }> => {
  try {
    const response = await axiosClient.post('/api/events/public/checkin', null, {
      params: { code }
    });
    const data: any = response.data;
    console.log(`Public event check-in response:`, data);
    return data;
  } catch (error) {
    console.error(`Error checking in to public event:`, error);
    throw error;
  }
};

export default {
  fetchEvent,
  createEvent,
  getEventById,
  putEventStatus,
  getEventByCode,
  getEventByClubId,
  fetchLocation,
  fetchClub,
  updateEvent,
  deleteEvent,
  getEventCoHostByClubId,
  submitForUniversityApproval,
  coHostRespond,
  getEventWallet,
  getEventSummary,
  completeEvent,
  registerForEvent,
  getMyEventRegistrations,
  getMyEvents,
  eventQR,
  timeObjectToString,
  timeStringToObject,
  getFeedbacksByMembership,
  getEventFeedbacks,
  cancelEventRegistration,
  eventTimeExtend,
  rejectEvent,
  eventSettle,
  getEventSettle,
  refundEventProduct,
  eventCheckinPublic
};
