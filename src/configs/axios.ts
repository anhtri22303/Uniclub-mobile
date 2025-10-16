import { decodeToken } from '@utils/decode';
import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ENV } from './environment';

const axiosClient = axios.create({
    baseURL: ENV.API_URL,
    timeout: ENV.REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

const axiosPrivate = axios.create({
    baseURL: ENV.API_URL,
    timeout: ENV.REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor for axiosClient to add JWT token
axiosClient.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
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

export { axiosClient, axiosPrivate };

