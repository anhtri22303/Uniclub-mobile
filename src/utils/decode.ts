import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";

/**
 * Decodes a JWT token stored in secure storage.
 * @returns Decoded JWT token or null if no token is found or decoding fails.
 */
export const decodeToken = async () => {
    const token = await SecureStore.getItemAsync('token');

    try {
        if (!token) {
            console.warn("No token found to decode.");
            return null;
        }
        const decoded = jwtDecode<any>(token);
        return decoded;
    } catch (error) {
        console.error("Error when decoding token: ", error);
    }
};  