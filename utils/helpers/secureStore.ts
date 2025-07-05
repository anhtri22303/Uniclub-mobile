import * as SecureStore from 'expo-secure-store';

/**
 * Save token to SecureStore
 * @param token 
 */
export async function saveToken(token: string) {
    await SecureStore.setItemAsync('token', token);
}
//--------------------End--------------------//


/**
 * Get token from SecureStore
 * @returns Token if exists, otherwise null
 */
export async function getToken() {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        return token;
    }
    return null;
}
//--------------------End--------------------//

/**
 * Check if token exists in SecureStore
 * @returns true if token exists, otherwise false
 */
export async function deleteToken() {
    await SecureStore.deleteItemAsync('userToken');
}
//--------------------End--------------------//