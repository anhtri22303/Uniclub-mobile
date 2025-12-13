import { axiosClient } from '@configs/axios';

/**
 * Location interface
 */
export interface Location {
  id: number;
  name: string;
  address: string;
  capacity: number;
}

/**
 * Create location request
 */
export interface CreateLocationRequest {
  name: string;
  address: string;
  capacity: number;
}

/**
 * Update location request
 */
export interface UpdateLocationRequest {
  name: string;
  address: string;
  capacity: number;
}

/**
 * API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Pageable interface for pagination
 */
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

/**
 * Locations API response with pagination
 */
export interface LocationsApiResponse {
  content: Location[];
  pageable: Pageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

/**
 * Fetch locations params
 */
export interface FetchLocationsParams {
  page?: number;
  size?: number;
  sort?: string[];
}

export class LocationService {
  /**
   * Get all locations with pagination
   * GET /api/locations
   */
  static async fetchLocations(
    params: FetchLocationsParams = { page: 0, size: 20 }
  ): Promise<LocationsApiResponse> {
    try {
      // Transform sort array to comma-separated string if needed
      const requestParams: any = {
        page: params.page,
        size: params.size,
      };
      
      if (params.sort && params.sort.length > 0) {
        requestParams.sort = params.sort.join(',');
      }
      
      const response = await axiosClient.get<LocationsApiResponse>('/api/locations', {
        params: requestParams,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  /**
   * Get location by ID
   * GET /api/locations/{id}
   */
  static async getLocationById(id: string | number): Promise<Location> {
    try {
      const response = await axiosClient.get<Location>(`/api/locations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching location ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new location
   * POST /api/locations
   */
  static async createLocation(data: CreateLocationRequest): Promise<Location> {
    try {
      const response = await axiosClient.post<Location>('/api/locations', data);
      return response.data;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  /**
   * Update a location
   * PUT /api/locations/{id}
   */
  static async updateLocation(
    id: number | string,
    data: UpdateLocationRequest
  ): Promise<ApiSuccessResponse<Location>> {
    try {
      const response = await axiosClient.put<ApiSuccessResponse<Location>>(
        `/api/locations/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating location ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a location
   * DELETE /api/locations/{id}
   */
  static async deleteLocation(locationId: number): Promise<void> {
    try {
      await axiosClient.delete(`/api/locations/${locationId}`);
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }
}

export default LocationService;
