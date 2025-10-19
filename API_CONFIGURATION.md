# API Configuration - UniClub Mobile

## ✅ Cấu hình hiện tại (Đã xác thực)

### Backend URL
```
Production: https://uniclub-qyn9a.ondigitalocean.app
Environment: production
```

### Files đã cấu hình
- ✅ `.env` - URL production
- ✅ `src/configs/environment.ts` - Default URL production
- ✅ `src/configs/axios.ts` - Axios instances
- ✅ `src/services/auth.service.ts` - Auth service
- ✅ `src/models/auth/auth.types.ts` - Type definitions

## 📋 API Endpoints

### Authentication

#### 1. Login
- **Endpoint:** `POST /auth/login`
- **Request Body:**
```json
{
  "email": "clubleader@gmail.com",
  "password": "123"
}
```
- **Response (200) - Format 1 (Single Club):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 9,
  "email": "clubleader@gmail.com",
  "role": "CLUB_LEADER",
  "clubId": 2
}
```
- **Response (200) - Format 2 (Multiple Clubs):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 10,
  "email": "multiclub@gmail.com",
  "role": "CLUB_LEADER",
  "clubIds": [1, 2, 3]
}
```
- **Note:** Backend may return either `clubId` (singular) or `clubIds` (plural). The app automatically normalizes both to `clubIds` array format.

#### 2. Register
- **Endpoint:** `POST /auth/register`
- **Uses:** `axiosPublic` (no JWT token required)

#### 3. Forgot Password
- **Endpoint:** `POST /auth/forgot-password`
- **Uses:** `axiosPublic` (no JWT token required)

#### 4. Google Login
- **Endpoint:** `POST /auth/google`
- **Uses:** `axiosPublic` (no JWT token required)

## 🔧 Axios Configuration

### axiosPublic
- **Dùng cho:** Login, Register, Forgot Password, Google Login
- **Headers:** 
  - `Content-Type: application/json`
  - `Accept: application/json`
- **NO JWT Token** - Dành cho các endpoint authentication

### axiosClient
- **Dùng cho:** Các API requests cần authentication
- **Headers:** 
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Authorization: Bearer {token}` (tự động thêm)

## ✅ Test Results

### Connection Test (PowerShell)
```powershell
POST https://uniclub-qyn9a.ondigitalocean.app/auth/login
Status: ✅ 200 OK
Response Time: ~500ms
```

### Sample Credentials
- **Email:** clubleader@gmail.com
- **Password:** 123
- **Role:** CLUB_LEADER

## 📝 Notes

1. **NO /api prefix** - Backend URL không có prefix `/api`
2. **JWT Token** - Được lưu trong `SecureStore` sau khi login
3. **Timeout:** 20000ms (20 seconds)
4. **Environment:** Production mode
5. **Club ID Handling:** 
   - Backend có thể trả về `clubId` (singular) hoặc `clubIds` (plural)
   - App tự động normalize cả 2 format thành `clubIds` (array)
   - Ví dụ: `clubId: 2` → `clubIds: [2]`

## 🎯 Code Flow

```
User Input (email, password)
    ↓
LoginScreen.tsx → handleLogin()
    ↓
AuthService.login(credentials)
    ↓
axiosPublic.post('/auth/login', credentials)
    ↓
Backend: https://uniclub-qyn9a.ondigitalocean.app/auth/login
    ↓
Response: { token, userId, email, role, clubId OR clubIds }
    ↓
useAuthStore.login(loginResponse)
    ↓
Normalize clubId/clubIds → always clubIds array
    ↓
Save to SecureStore + Navigate to role-based screen
```

## 🔄 Club ID Normalization

The app handles both response formats automatically:

```typescript
// Backend Response Format 1 (clubId - singular)
{
  "clubId": 2
}
// ↓ Normalized to ↓
{
  "clubIds": [2]
}

// Backend Response Format 2 (clubIds - plural)
{
  "clubIds": [1, 2, 3]
}
// ↓ Stays as ↓
{
  "clubIds": [1, 2, 3]
}

// Backend Response Format 3 (no club)
{
  // no clubId or clubIds field
}
// ↓ Normalized to ↓
{
  "clubIds": undefined
}
```

### Usage in Components

```typescript
import { useAuthStore } from '@stores/auth.store';

const MyComponent = () => {
  const user = useAuthStore((state) => state.user);

  // Always access as array
  if (user?.clubIds && user.clubIds.length > 0) {
    console.log('User belongs to clubs:', user.clubIds);
    
    // Get first club ID
    const primaryClubId = user.clubIds[0];
    
    // Check if user belongs to a specific club
    const belongsToClub = user.clubIds.includes(5);
    
    // Get all club IDs for API calls
    const allClubIds = user.clubIds.join(',');
  }
};
```

## 🔍 Verification Checklist

- [x] URL backend đúng trong `.env`
- [x] Environment config đúng
- [x] Auth service sử dụng `axiosPublic` cho login
- [x] Request body structure đúng (email, password)
- [x] Response type đầy đủ (token, userId, email, role, clubId)
- [x] Axios interceptors hoạt động
- [x] Test connection thành công

---

**Last Updated:** October 20, 2025
**Status:** ✅ All systems operational
