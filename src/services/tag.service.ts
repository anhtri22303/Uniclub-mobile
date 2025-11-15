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
 * Tag interface
 */
export interface Tag {
  tagId: number;
  name: string;
  description: string;
  core: boolean;
}

/**
 * Update tag DTO
 */
export interface UpdateTagDto {
  name: string;
  description: string;
  core: boolean;
}

export class TagService {
  /**
   * Get all tags
   * GET /api/tags
   */
  static async getTags(): Promise<Tag[]> {
    try {
      const response = await axiosClient.get<ApiResponse<Tag[]>>('/api/tags');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  /**
   * Add a new tag
   * POST /api/tags
   */
  static async addTag(name: string): Promise<Tag> {
    try {
      const response = await axiosClient.post<ApiResponse<Tag>>(
        '/api/tags',
        null,
        { params: { name } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }

  /**
   * Update a tag
   * PUT /api/tags/{id}
   */
  static async updateTag(tagId: number | string, data: UpdateTagDto): Promise<Tag> {
    try {
      const response = await axiosClient.put<ApiResponse<Tag>>(`/api/tags/${tagId}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating tag ${tagId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a tag
   * DELETE /api/tags/{id}
   */
  static async deleteTag(tagId: number | string): Promise<string> {
    try {
      const response = await axiosClient.delete<ApiResponse<string>>(`/api/tags/${tagId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error deleting tag ${tagId}:`, error);
      throw error;
    }
  }

  /**
   * Alias for getTags (for consistency with other services)
   */
  static async fetchTags(): Promise<Tag[]> {
    return this.getTags();
  }
}

export default TagService;

