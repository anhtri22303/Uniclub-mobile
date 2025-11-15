import { axiosClient } from '@configs/axios';

export interface ClubApplication {
  applicationId: number;
  clubId?: number | null;
  clubName: string;
  description: string;
  majorId?: number;
  majorName?: string;
  vision?: string;
  proposerReason?: string;
  proposer?: {
    fullName: string;
    email: string;
  };
  submittedBy?: {
    fullName: string;
    email: string;
  };
  reviewedBy?: {
    fullName: string;
    email: string;
  } | null;
  status: string;
  rejectReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

export interface ProcessApplicationBody {
  approve: boolean;
  rejectReason?: string;
}

export interface CreateClubAccountBody {
  applicationId: number;
  clubId: number;
  leaderFullName: string;
  leaderEmail: string;
  viceFullName: string;
  viceEmail: string;
  defaultPassword: string;
}

/**
 * Fetches club applications from the backend.
 * Returns the data array from the API response structure: { success, message, data }
 */
export async function getClubApplications(): Promise<ClubApplication[]> {
  try {
    const response = await axiosClient.get<{ success: boolean; message: string; data: ClubApplication[] }>("/api/club-applications/all");
    console.log('✅ Club applications response:', JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching club applications:", error);
    throw error;
  }
}

/**
 * Create a new club application.
 * The backend expects a JSON body with clubName, description, majorId, vision, proposerReason
 */
export async function postClubApplication(body: { 
  clubName: string; 
  description: string;
  majorId?: number | null;
  vision?: string;
  proposerReason?: string;
}): Promise<ClubApplication> {
  try {
    const response = await axiosClient.post<ClubApplication>(
      "/api/club-applications",
      {
        clubName: body.clubName,
        description: body.description,
        majorId: body.majorId,
        vision: body.vision,
        proposerReason: body.proposerReason,
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('✅ Club application created:', response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating club application:", error);
    throw error;
  }
}

/**
 * Decide application status.
 * Endpoint: PUT /api/club-applications/{id}/decide
 * Body: { approve: boolean, rejectReason: string }
 */
export async function putClubApplicationStatus(
  applicationId: number, 
  approve: boolean, 
  rejectReason: string
): Promise<ClubApplication> {
  try {
    const response = await axiosClient.put<ClubApplication>(
      `/api/club-applications/${applicationId}/decide`,
      { approve, rejectReason },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log("ClubApplication response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating club application status:", error);
    throw error;
  }
}

/**
 * Get current user's club applications
 * GET /api/club-applications/my
 */
export async function getMyClubApplications(): Promise<ClubApplication[]> {
  try {
    const response = await axiosClient.get<{
      success: boolean;
      message: string;
      data: ClubApplication[];
    }>('/api/club-applications/my');
    
    console.log('✅ My club applications:', response.data);
    
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
    console.error('❌ Error fetching my club applications:', error.response?.data || error.message);
    // Return empty array instead of throwing to handle gracefully
    return [];
  }
}

/**
 * Process club application (approve/reject)
 * PUT /api/club-applications/{id}/approve
 */
export async function processClubApplication(
  applicationId: number,
  body: ProcessApplicationBody
): Promise<ClubApplication> {
  try {
    const response = await axiosClient.put(
      `/api/club-applications/${applicationId}/approve`,
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // API response structure: { success, message, data }
    const result = response.data as {
      success: boolean;
      message: string;
      data: ClubApplication;
    };

    if (!result.success) {
      throw new Error(result.message || 'Failed to process application');
    }

    console.log('✅ Application processed successfully:', result.data);
    return result.data;
  } catch (error: any) {
    console.error('❌ Error processing club application:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create club account from approved application
 * POST /api/club-applications/create-club-accounts
 */
export async function createClubAccount(body: CreateClubAccountBody): Promise<string> {
  try {
    const response = await axiosClient.post(
      `/api/club-applications/create-club-accounts`,
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // API response: { success, message, data: "string" }
    const result = response.data as {
      success: boolean;
      message: string;
      data: string;
    };

    if (!result.success) {
      throw new Error(result.message || 'Failed to create club account');
    }

    console.log('✅ Club account created successfully:', result.data);
    return result.data;
  } catch (error: any) {
    console.error('❌ Error creating club account:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send OTP to student email for club application
 * POST /api/club-applications/send-otp
 */
export async function sendOtp(email: string): Promise<string> {
  try {
    const response = await axiosClient.post(
      `/api/club-applications/send-otp`,
      { email },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // API response: { success, message, data }
    const result = response.data as {
      success: boolean;
      message: string;
      data?: string;
    };

    if (!result.success) {
      throw new Error(result.message || 'Failed to send OTP');
    }

    console.log('✅ OTP sent successfully to:', email);
    return result.message || result.data || 'OTP sent successfully';
  } catch (error: any) {
    console.error('❌ Error sending OTP:', error.response?.data || error.message);
    throw error;
  }
}

export default {
  getClubApplications,
  postClubApplication,
  putClubApplicationStatus,
  getMyClubApplications,
  processClubApplication,
  createClubAccount,
  sendOtp,
};
