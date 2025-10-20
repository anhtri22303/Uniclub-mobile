import { axiosClient } from '@configs/axios';

// Response from API (flat structure)
export interface UserApiResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  avatarUrl: string | null;
  roleName: string;
  studentCode: string | null;
  majorName: string | null;
  bio: string | null;
}

// Our internal type (nested structure for profile endpoint)
export interface UserProfile {
  userId: number;
  email: string;
  fullName: string;
  phone: string;
  status: string;
  avatarUrl: string | null;
  role: {
    roleId: number;
    roleName: string;
    description: string;
  } | null;
  wallet: {
    balancePoints: number;
  } | null;
  studentCode: string | null;
  majorName: string | null;
  bio: string | null;
  memberships: any[];
}

export interface ProfileResponse {
  success: boolean;
  message: string | null;
  data: UserProfile;
}

export interface EditProfileRequest {
  fullName?: string;
  phone?: string;
  majorName?: string;
  bio?: string;
  email?: string;
}

export class UserService {
  /**
   * Fetch current user's profile
   */
  static async fetchProfile(): Promise<UserProfile> {
    try {
      const response = await axiosClient.get<ProfileResponse>('/api/users/profile');
      const body = response.data;
      
      console.log('Fetched profile response:', body);

      if (body && body.success && body.data) {
        return body.data;
      }

      throw new Error('Invalid profile response format');
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  /**
   * Edit current user's profile
   */
  static async editProfile(data: EditProfileRequest): Promise<any> {
    try {
      console.log('Editing profile with data:', data);
      const response = await axiosClient.put('/api/users/profile', data);
      const body = response.data;
      console.log('Edit profile response:', body);
      
      return body;
    } catch (error) {
      console.error('Error editing profile:', error);
      throw error;
    }
  }

  /**
   * Upload avatar image
   */
  static async uploadAvatar(file: any): Promise<any> {
    try {
      console.log('Uploading avatar file:', file.name || 'file');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosClient.post('/api/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const body = response.data;
      console.log('Upload avatar response:', body);
      
      return body;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Fetch all users (Admin only)
   * Transform API response to match UserProfile interface
   */
  static async fetchUsers(): Promise<UserProfile[]> {
    try {
      const response = await axiosClient.get<{ content: UserApiResponse[] }>('/api/users');
      const body = response.data;
      console.log('Fetched users response:', body);

      // If backend returns a paginated wrapper, return the `content` array.
      if (body && typeof body === 'object' && 'content' in body && Array.isArray(body.content)) {
        console.log('fetchUsers returning body.content (array)');
        
        // Transform API response to UserProfile format
        return body.content.map((user) => ({
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone || '',
          status: user.status,
          avatarUrl: user.avatarUrl,
          role: {
            roleId: 0, // API doesn't provide roleId
            roleName: user.roleName,
            description: '',
          },
          wallet: null,
          studentCode: user.studentCode,
          majorName: user.majorName,
          bio: user.bio,
          memberships: [],
        }));
      }

      // If the API already returns an array of users, return it directly.
      if (Array.isArray(body)) {
        return body;
      }

      // Fallback: return empty array to simplify caller logic
      return [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Fetch user by ID
   */
  static async fetchUserById(id: string | number): Promise<any> {
    try {
      const response = await axiosClient.get(`/api/users/${id}`);
      const body = response.data;
      console.log('fetchUserById:', body);
      
      if (body && typeof body === 'object' && 'data' in body) {
        return body.data;
      }
      
      return body;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update user by ID
   */
  static async updateUserById(id: string | number, data: Record<string, any>): Promise<any> {
    try {
      const response = await axiosClient.put(`/api/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete user by ID
   */
  static async deleteUserById(id: string | number): Promise<any> {
    try {
      const response = await axiosClient.delete(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}

export default UserService;
