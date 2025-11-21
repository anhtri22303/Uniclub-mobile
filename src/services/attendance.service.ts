import { axiosClient } from '@configs/axios';

// --- Interfaces ---

export interface TimeObject {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

export interface CreateSessionBody {
  date: string; // "YYYY-MM-DD"
  startTime: string; // Changed from TimeObject to string (e.g., "14:30:00")
  endTime: string;   // Changed from TimeObject to string (e.g., "16:30:00")
  note: string;
}

export type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";

export interface MarkBulkRecord {
  membershipId: number;
  status: AttendanceStatus;
  note: string;
}

export interface MarkBulkBody {
  records: MarkBulkRecord[];
}

export interface MarkClubAttendanceParams {
  sessionId: number;
  membershipId: number;
  status: AttendanceStatus;
  note?: string;
}

export interface MarkAllClubAttendanceParams {
  sessionId: number;
  status: AttendanceStatus;
}

export interface FetchClubAttendanceHistoryParams {
  clubId: number;
  date: string; // "YYYY-MM-DD"
}

// --- API Functions ---

export const fetchAttendanceByDate = async (date: string) => {
  const response = await axiosClient.get(`/api/attendance?date=${date}`);
  return response.data;
};

export const saveAttendanceRecords = async (records: any[]) => {
  const response = await axiosClient.post(`/api/attendance`, records);
  return response.data;
};

export const createClubAttendanceSession = async (
  clubId: number,
  sessionData: CreateSessionBody
) => {
  const response = await axiosClient.post(
    `/api/club-attendance/${clubId}/create-session`,
    sessionData
  );
  return response.data;
};

export const fetchTodayClubAttendance = async (clubId: number) => {
  const response = await axiosClient.get(
    `/api/club-attendance/${clubId}/today`
  );
  return response.data;
};

export const markClubAttendance = async (params: MarkClubAttendanceParams) => {
  const { sessionId, ...queryParams } = params;
  const response = await axiosClient.put(
    `/api/club-attendance/${sessionId}/mark`,
    null,
    { params: queryParams }
  );
  return response.data;
};

export const markAllClubAttendance = async (
  params: MarkAllClubAttendanceParams
) => {
  const { sessionId, status } = params;
  const response = await axiosClient.put(
    `/api/club-attendance/${sessionId}/mark-all`,
    null,
    { params: { status } }
  );
  return response.data;
};

export const fetchClubAttendanceHistory = async (
  params: FetchClubAttendanceHistoryParams
) => {
  const { clubId, date } = params;
  const response = await axiosClient.get(
    `/api/club-attendance/${clubId}/history`,
    { params: { date } }
  );
  console.log(response.data);
  return response.data;
};

export const markAttendanceBulk = async (sessionId: number, data: MarkBulkBody) => {
  const response = await axiosClient.put(
    `/api/club-attendance/${sessionId}/mark-bulk`,
    data
  );
  return response.data;
};

export const fetchMemberAttendanceHistory = async (clubId: number) => {
  const response = await axiosClient.get(
    `/api/club-attendance/clubs/${clubId}/member/history`
  );
  return response.data;
};

