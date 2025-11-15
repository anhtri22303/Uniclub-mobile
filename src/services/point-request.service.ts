import { axiosClient } from '@configs/axios';

// --- Generic API Response Wrapper ---
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// --- Data Types (For responses) ---

// Represents a point request
export interface PointRequest {
  id: number;
  clubName: string;
  requestedPoints: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  staffNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

// --- Payload Types (For Create/Update) ---

// Payload to CREATE a point request
export interface CreatePointRequestPayload {
  clubId: number;
  requestedPoints: number;
  reason: string;
}

// Payload (as query params) to REVIEW a point request
export interface ReviewPointRequestPayload {
  approve: boolean;
  note?: string;
}

// --- API Functions ---

/**
 * 1. Create a new point request
 * POST /api/point-requests
 */
export const createPointRequest = async (
  payload: CreatePointRequestPayload
): Promise<ApiResponse<PointRequest>> => {
  try {
    const response = await axiosClient.post<ApiResponse<PointRequest>>(
      '/api/point-requests',
      payload
    );
    console.log('createPointRequest response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating point request:', error);
    throw error;
  }
};

/**
 * 2. Get all pending point requests
 * GET /api/point-requests/pending
 */
export const fetchPendingPointRequests = async (): Promise<
  ApiResponse<PointRequest[]>
> => {
  try {
    const response = await axiosClient.get<ApiResponse<PointRequest[]>>(
      '/api/point-requests/pending'
    );
    console.log('fetchPendingPointRequests response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching pending point requests:', error);
    throw error;
  }
};

/**
 * 3. Review (approve/reject) a point request
 * PUT /api/point-requests/{id}/review
 */
export const reviewPointRequest = async (
  id: number,
  payload: ReviewPointRequestPayload
): Promise<ApiResponse<string>> => {
  try {
    // Data (approve, note) is sent as query parameters, not body
    const response = await axiosClient.put<ApiResponse<string>>(
      `/api/point-requests/${id}/review`,
      null,
      {
        params: {
          approve: payload.approve,
          note: payload.note,
        },
      }
    );
    console.log('reviewPointRequest response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error reviewing point request ${id}:`, error);
    throw error;
  }
};

/**
 * 4. Get ALL point requests (all statuses)
 * GET /api/point-requests/all
 */
export const fetchAllPointRequests = async (): Promise<
  ApiResponse<PointRequest[]>
> => {
  try {
    const response = await axiosClient.get<ApiResponse<PointRequest[]>>(
      '/api/point-requests/all'
    );
    console.log('fetchAllPointRequests response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching all point requests:', error);
    throw error;
  }
};

/**
 * 5. Get a point request by ID
 * GET /api/point-requests/{id}
 */
export const fetchPointRequestById = async (
  id: number | string
): Promise<ApiResponse<PointRequest>> => {
  try {
    const response = await axiosClient.get<ApiResponse<PointRequest>>(
      `/api/point-requests/${id}`
    );
    console.log('fetchPointRequestById response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching point request by id ${id}:`, error);
    throw error;
  }
};

// Default export for convenience
const PointRequestService = {
  createPointRequest,
  fetchPendingPointRequests,
  reviewPointRequest,
  fetchAllPointRequests,
  fetchPointRequestById,
};

export default PointRequestService;

