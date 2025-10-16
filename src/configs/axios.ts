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
        console.log('🌐 Making PUBLIC API request to:', `${config.baseURL || ''}${config.url || ''}`);
        console.log('📋 Request method:', config.method?.toUpperCase());
        console.log('📦 Request headers:', config.headers);
        // NO TOKEN - this is for login, register, forgot password
        return config;
    },
    (error) => {
        console.error('❌ Public request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Request interceptor for axiosClient to add JWT token (for authenticated requests)
axiosClient.interceptors.request.use(
    async (config) => {
        console.log('� Making AUTHENTICATED API request to:', `${config.baseURL || ''}${config.url || ''}`);
        console.log('📋 Request method:', config.method?.toUpperCase());
        console.log('📦 Request headers:', config.headers);
        
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('❌ Authenticated request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for axiosPublic
axiosPublic.interceptors.response.use(
    (response) => {
        console.log('✅ Public API Response success:', response.status);
        return response;
    },
    (error) => {
        console.error('❌ Public API Response error:', error.response?.status, error.message);
        console.error('❌ Error details:', error.response?.data);
        return Promise.reject(error);
    }
);

// Response interceptor for axiosClient  
axiosClient.interceptors.response.use(
    (response) => {
        console.log('✅ Authenticated API Response success:', response.status);
        return response;
    },
    (error) => {
        console.error('❌ Authenticated API Response error:', error.response?.status, error.message);
        console.error('❌ Error details:', error.response?.data);
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

// Xử lý lỗi toàn cục
const handleError = (error: AxiosError) => {
    if (error.response) {
        console.error('Server Error:', error.response.data);
    } else if (error.request) {
        console.error('No Response:', error.request);
    } else {
        console.error('Error:', error.message);
    }
    return Promise.reject(error);
};

axiosClient.interceptors.response.use((response) => response, handleError);
axiosPrivate.interceptors.response.use((response) => response, handleError);
axiosPublic.interceptors.response.use((response) => response, handleError);

export { axiosClient, axiosPrivate, axiosPublic };

