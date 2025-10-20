import { axiosClient } from '@configs/axios';

export interface ClubApplication {
  applicationId: number;
  clubName: string;
  description: string;
  category: string | null;
  submittedBy: {
    fullName: string;
    email: string;
  } | null;
  reviewedBy: {
    fullName: string;
    email: string;
  } | null;
  status: string;
  sourceType: string | null;
  rejectReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  attachmentUrl: string | null;
  internalNote: string | null;
}

/**
 * Fetches club applications from the backend.
 * Returns the data array from the API response structure: { success, message, data }
 */
export async function getClubApplications(): Promise<ClubApplication[]> {
  try {
    const response = await axiosClient.get<{ success: boolean; message: string; data: ClubApplication[] }>("/api/club-applications/all");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching club applications:", error);
    throw error;
  }
}

/**
 * Create a new club application.
 * The backend expects a JSON body with clubName, description, category, proposerReason
 */
export async function postClubApplication(body: { 
  clubName: string; 
  description: string;
  category: string | number;
  proposerReason: string;
}): Promise<ClubApplication> {
  try {
    const response = await axiosClient.post<ClubApplication>(
      "/api/club-applications",
      {
        clubName: body.clubName,
        description: body.description,
        category: body.category,
        proposerReason: body.proposerReason,
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating club application:", error);
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

export default {
  getClubApplications,
  postClubApplication,
  putClubApplicationStatus,
  getMyClubApplications
};
