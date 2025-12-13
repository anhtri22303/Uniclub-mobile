import { decodeToken } from '@utils/decode';
import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ENV } from './environment';

// For authenticated requests (with JWT token)
const axiosClient = axios.create({
    baseURL: ENV.API_URL,
    timeout: ENV.REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// For public/auth requests (NO JWT token - login, register, forgot password)
const axiosPublic = axios.create({
    baseURL: ENV.API_URL,
    timeout: ENV.REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

const axiosPrivate = axios.create({
    baseURL: ENV.API_URL,
    timeout: ENV.REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // Remove withCredentials for mobile compatibility
    // withCredentials: true,
});

// Request interceptor for axiosPublic (NO JWT token for auth endpoints)
axiosPublic.interceptors.request.use(
    (config) => {

        // NO TOKEN - this is for login, register, forgot password
        return config;
    },
    (error) => {
        console.log('Public request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Request interceptor for axiosClient to add JWT token (for authenticated requests)
axiosClient.interceptors.request.use(
    async (config) => {
        // Only log in development mode
        if (__DEV__) {
            console.log(' API:', config.method?.toUpperCase(), config.url);
        }
        
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        if (__DEV__) console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for axiosPublic
axiosPublic.interceptors.response.use(
    (response) => {
        console.log(' Public API Response success:', response.status);
        return response;
    },
    (error) => {
        console.log('Public API Response error:', error.response?.status, error.message);
        console.log('Error details:', error.response?.data);
        return Promise.reject(error);
    }
);

// Response interceptor for axiosClient  
axiosClient.interceptors.response.use(
    (response) => {
        if (__DEV__) console.log(' ', response.config.url, response.status);
        return response;
    },
    (error) => {
        // Không dùng console.error để tránh hiển thị error overlay màu đỏ
        if (__DEV__) console.log(' ', error.config?.url, error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

// Interceptors cho axiosPrivate
axiosPrivate.interceptors.request.use(
    async (config) => {

        const token = await SecureStore.getItemAsync('token');
        const decodedToken = await decodeToken();
        const userRole = decodedToken?.role;

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        if (userRole) {
            config.headers['X-User-Role'] = userRole; // Gửi role trong header (tuỳ backend có cần hay không)
        }
        // if (userRole) {
        //     config.headers['X-User-Role'] = userRole;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

axiosPrivate.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Xử lý khi bị unauthorized
            console.error('Unauthorized! Redirecting to login...');
        }
        return Promise.reject(error);
    },
);

// Xử lý lỗi toàn cục - chỉ log trong dev mode, không hiển thị error overlay
const handleError = (error: AxiosError) => {
    // Chỉ log thông tin cần thiết, không log error object trực tiếp để tránh error overlay
    if (__DEV__) {
        if (error.response) {
            console.log('Server Error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.log('No Response from server');
        } else {
            console.log('Request Error:', error.message);
        }
    }
    return Promise.reject(error);
};

export { axiosClient, axiosPrivate, axiosPublic };

