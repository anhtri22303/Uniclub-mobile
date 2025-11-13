# 🔐 Google OAuth Login Setup Guide

## ✅ Đã Hoàn Thành

Tôi đã triển khai thành công Google OAuth login cho UniClub mobile app theo hướng dẫn từ `GOOGLE_OAUTH_MOBILE_GUIDE.md`. Dưới đây là tổng kết những gì đã được thực hiện:

### 1. ✅ Cài Đặt Package
```bash
npx expo install @react-native-google-signin/google-signin
```

### 2. ✅ Cấu Hình Environment (`src/configs/environment.ts`)
- Đã thêm `GOOGLE_WEB_CLIENT_ID`: `772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com`

### 3. ✅ Types (`src/models/auth/auth.types.ts`)
- Đã thêm `GoogleLoginResponse` interface với đầy đủ fields từ backend

### 4. ✅ Auth Service (`src/services/auth.service.ts`)
- Đã cập nhật method `loginWithGoogleToken` để gọi API `POST /auth/google`
- Response format đúng theo tài liệu: `{ success, message, data }`

### 5. ✅ Google Auth Service (`src/services/googleAuth.service.ts`)
File mới tạo để quản lý Google Sign-In flow:
- `configure()`: Khởi tạo Google Sign-In
- `signInWithGoogle()`: Xử lý toàn bộ flow từ Google Sign-In → Backend verification → Lưu JWT token
- `signOut()`: Đăng xuất
- `isSignedIn()`: Kiểm tra trạng thái đăng nhập

### 6. ✅ Login Screen (`src/components/auth/LoginScreen.tsx`)
- Import `GoogleAuthService`
- Thêm state `isGoogleLoading`
- Khởi tạo Google Sign-In trong `useEffect`
- Thêm handler `handleGoogleSignIn`
- Cập nhật Google Sign-In button với handler và loading state

### 7. ✅ App Configuration (`app.json`)
- Thêm plugin `@react-native-google-signin/google-signin`
- Cấu hình `bundleIdentifier` (iOS): `com.anhtri.uniclub`
- Cấu hình `package` (Android): `com.anhtri.uniclub`

---

## 📋 Các Bước Tiếp Theo (Cần Thực Hiện)

### Bước 1: Tạo Google OAuth Credentials

#### **Cho Android:**

1. **Lấy SHA-1 Fingerprint:**
   ```bash
   # Debug keystore (development)
   cd android
   ./gradlew signingReport
   
   # Hoặc dùng keytool
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

2. **Tạo Android Client ID** tại [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Chọn "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Android**
   - Package name: `com.anhtri.uniclub`
   - SHA-1 certificate fingerprint: (paste SHA-1 từ bước 1)
   - Lưu Client ID mới tạo

3. **Download `google-services.json`:**
   - Download từ Firebase Console hoặc Google Cloud Console
   - Đặt file vào thư mục gốc project: `./google-services.json`

#### **Cho iOS:**

1. **Tạo iOS Client ID** tại [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Chọn "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **iOS**
   - Bundle ID: `com.anhtri.uniclub`
   - Lưu Client ID mới tạo

2. **Download `GoogleService-Info.plist`:**
   - Download từ Firebase Console
   - Đặt file vào thư mục gốc project: `./GoogleService-Info.plist`

#### **Web Client ID (Đã Có):**
- Sử dụng Client ID hiện tại: `772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com`
- Client ID này đã được cấu hình trong backend để verify Google ID Token

---

### Bước 2: Rebuild App

Sau khi có đầy đủ credentials và config files:

```bash
# Clear cache and rebuild
npx expo prebuild --clean

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

---

## 🔄 Luồng Hoạt Động

```
1. User clicks "Đăng nhập bằng Google"
   ↓
2. GoogleAuthService.signInWithGoogle() được gọi
   ↓
3. Google Sign-In dialog xuất hiện
   ↓
4. User chọn tài khoản Google
   ↓
5. Nhận Google ID Token (JWT)
   ↓
6. Gửi ID Token đến backend: POST /auth/google
   ↓
7. Backend verify token với Google
   ↓
8. Backend trả về JWT token + user info
   ↓
9. Lưu JWT token vào SecureStore
   ↓
10. Login vào auth store
   ↓
11. Redirect đến trang tương ứng với role
```

---

## 🧪 Testing Checklist

Sau khi setup xong, test các tình huống sau:

- [ ] Click nút Google Sign-In mở Google dialog
- [ ] Chọn tài khoản Google thành công
- [ ] Backend nhận được Google ID Token
- [ ] Backend trả về JWT token + user info
- [ ] JWT token được lưu vào SecureStore
- [ ] User được redirect đúng trang theo role
- [ ] Logout thành công
- [ ] Lỗi network được xử lý đúng
- [ ] User cancel sign-in được xử lý đúng
- [ ] Google Play Services không có được xử lý (Android)

---

## 🐛 Troubleshooting

### **Lỗi: DEVELOPER_ERROR (Android)**
**Nguyên nhân:** SHA-1 fingerprint không đúng hoặc chưa được thêm vào Google Cloud Console

**Giải pháp:**
1. Kiểm tra lại SHA-1 fingerprint
2. Đảm bảo package name là `com.anhtri.uniclub`
3. Rebuild app sau khi cập nhật credentials

### **Lỗi: SIGN_IN_FAILED**
**Nguyên nhân:** Web Client ID không đúng

**Giải pháp:**
1. Kiểm tra `GOOGLE_WEB_CLIENT_ID` trong `environment.ts`
2. Đảm bảo sử dụng Web Client ID (không phải Android/iOS Client ID)

### **Lỗi: 401 Unauthorized từ Backend**
**Nguyên nhân:** Google ID Token không valid hoặc đã hết hạn

**Giải pháp:**
1. Kiểm tra token có được gửi đúng format không: `{ token: "<id_token>" }`
2. Kiểm tra backend có verify token với đúng Web Client ID không

### **Lỗi: Backend không trả về response đúng**
**Nguyên nhân:** Response format không đúng

**Giải pháp:**
1. Kiểm tra backend API endpoint: `POST /auth/google`
2. Đảm bảo response có format: `{ success: boolean, message: string, data: {...} }`

---

## 📝 Files Đã Chỉnh Sửa

1. ✅ `package.json` - Thêm `@react-native-google-signin/google-signin`
2. ✅ `src/configs/environment.ts` - Thêm `GOOGLE_WEB_CLIENT_ID`
3. ✅ `src/models/auth/auth.types.ts` - Thêm `GoogleLoginResponse`
4. ✅ `src/services/auth.service.ts` - Cập nhật `loginWithGoogleToken`
5. ✅ `src/services/googleAuth.service.ts` - **File mới tạo**
6. ✅ `src/components/auth/LoginScreen.tsx` - Thêm Google Sign-In logic
7. ✅ `app.json` - Thêm plugin và config

---

## 🔗 Resources

- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [Firebase Console](https://console.firebase.google.com/)
- [Expo Google Sign-In Guide](https://docs.expo.dev/guides/google-authentication/)

---

## 🎯 Backend API

**Endpoint:** `POST https://uniclub-qyn9a.ondigitalocean.app/auth/google`

**Request:**
```json
{
  "token": "<google_id_token>"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "token": "<jwt_token>",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "avatar": "https://...",
    "userId": 12345,
    "role": "student",
    "staff": false,
    "clubIds": [1, 2, 3]
  }
}
```

---

**✨ Implementation completed by:** GitHub Copilot  
**📅 Date:** November 13, 2025  
**📱 Platform:** React Native / Expo  
**🔐 Web Client ID:** `772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com`
