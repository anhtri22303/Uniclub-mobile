// Authentication types based on your backend API

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  role: string;
  // Optional fields from backend response
  fullName?: string;
  staff?: boolean;
  clubId?: number; // Club ID for club leaders (single club)
  clubIds?: number[]; // Array of club IDs (for users with multiple clubs)
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  roleName: string;
  studentCode: string;
  majorName: string;
}

export interface SignUpResponse {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data: null;
}

export interface GoogleLoginRequest {
  token: string;
}
