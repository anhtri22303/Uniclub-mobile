import { axiosClient } from '@configs/axios';

export interface Event {
  id: number;
  clubId: number;
  name: string;
  description: string;
  type: string;
  category?: string;
  date: string;
  time?: string;
  locationId: number;
  status: string;
  expectedAttendees?: number;
  venue?: string;
  eventDate?: string;
  eventName?: string;
  eventType?: string;
  requestedBy?: string;
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
export const createEvent = async (payload: any): Promise<Event> => {
  try {
    const response = await axiosClient.post("api/events", payload);
    return response.data;
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
 * Update event status.
 */
export const putEventStatus = async (id: string | number, status: string): Promise<Event> => {
  try {
    const response = await axiosClient.put(`api/events/${id}/status`, { status });
    const data: any = response.data;
    
    if (data && data.data) return data.data;
    return data;
  } catch (error) {
    console.error(`Error updating event ${id} status:`, error);
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

export default {
  fetchEvent,
  createEvent,
  getEventById,
  putEventStatus,
  getEventByCode,
  getEventByClubId,
  fetchLocation,
  fetchClub
};
