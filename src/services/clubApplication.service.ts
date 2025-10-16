import { axiosClient } from '@configs/axios';

export interface ClubApplication {
  applicationId: number;
  clubName: string;
  description: string;
  submittedBy: {
    fullName: string;
    email: string;
  };
  reviewedBy?: any;
  status: string;
  submittedAt: string;
  reviewedAt?: string | null;
}

/**
 * Fetches club applications from the backend.
 */
export async function getClubApplications(): Promise<ClubApplication[]> {
  try {
    const response = await axiosClient.get<ClubApplication[]>("/api/club-applications");
    return response.data;
  } catch (error) {
    console.error("Error fetching club applications:", error);
    throw error;
  }
}

/**
 * Create a new club application.
 */
export async function postClubApplication(body: { clubName: string; description: string }): Promise<ClubApplication> {
  try {
    const response = await axiosClient.post<ClubApplication>(
      "/api/club-applications",
      null,
      {
        params: {
          clubName: body.clubName,
          description: body.description,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating club application:", error);
    throw error;
  }
}

/**
 * Update application status.
 */
export async function putClubApplicationStatus(applicationId: number, status: string): Promise<ClubApplication> {
  try {
    const response = await axiosClient.put<ClubApplication>(
      `/api/club-applications/${applicationId}/status`,
      null,
      { params: { status } }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating club application status:", error);
    throw error;
  }
}

export default {
  getClubApplications,
  postClubApplication,
  putClubApplicationStatus
};
