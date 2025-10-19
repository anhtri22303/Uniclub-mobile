import { ENV } from '@configs/environment';

/**
 * Test API connectivity
 */
export const testApiConnection = async () => {
  try {
    console.log('🔍 Testing API connection to:', ENV.API_URL);
    
    // Test with simple fetch first
    const response = await fetch(`${ENV.API_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 API Health Check Response:', response.status);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ API is accessible:', data);
      return true;
    } else {
      console.log('❌ API returned status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ API connection failed:', error);
    return false;
  }
};

/**
 * Test login endpoint specifically
 */
export const testLoginEndpoint = async () => {
  try {
    console.log('🔍 Testing login endpoint...');
    
    const response = await fetch(`${ENV.API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test001@gmail.com',
        password: '123'
      }),
    });
    
    console.log('📡 Login endpoint response status:', response.status);
    
    if (response.status === 401 || response.status === 400) {
      console.log('✅ Login endpoint is accessible (returned expected error)');
      return true;
    } else if (response.status === 404) {
      console.log('❌ Login endpoint not found (404)');
      return false;
    } else {
      const data = await response.text();
      console.log('📋 Login endpoint response:', data);
      return true;
    }
  } catch (error) {
    console.error('❌ Login endpoint test failed:', error);
    return false;
  }
};