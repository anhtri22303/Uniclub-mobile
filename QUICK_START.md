# ✅ Google Sign-In - Quick Start Guide

## 🎉 Đã Hoàn Thành

Google OAuth login đã được triển khai thành công! Code đã sẵn sàng và chỉ cần thêm Google credentials để chạy.

---

## 🚀 Các Bước Setup (5-10 phút)

### 1️⃣ Lấy SHA-1 Fingerprint (Android)

```bash
cd android
./gradlew signingReport
```

hoặc trên Windows:
```bash
cd android
.\gradlew.bat signingReport
```

Tìm dòng **SHA1** trong phần **Variant: debug** và copy fingerprint.

👉 **Chi tiết:** Xem [SHA1_FINGERPRINT_GUIDE.md](./SHA1_FINGERPRINT_GUIDE.md)

---

### 2️⃣ Tạo Google OAuth Credentials

Truy cập [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

#### **Android Client ID:**
- Application type: **Android**
- Package name: `com.anhtri.uniclub`
- SHA-1: *paste fingerprint từ bước 1*

#### **iOS Client ID:** (nếu build iOS)
- Application type: **iOS**
- Bundle ID: `com.anhtri.uniclub`

#### **Web Client ID:** (Đã có sẵn)
- `772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com`

---

### 3️⃣ Download Config Files

#### **Android:**
Download `google-services.json` và đặt vào thư mục gốc project:
```
Uniclub-mobile/
  ├── google-services.json  ← Đặt ở đây
  ├── app.json
  └── ...
```

#### **iOS:** (nếu build iOS)
Download `GoogleService-Info.plist` và đặt vào thư mục gốc project:
```
Uniclub-mobile/
  ├── GoogleService-Info.plist  ← Đặt ở đây
  ├── app.json
  └── ...
```

---

### 4️⃣ Rebuild App

```bash
# Clean và rebuild
npx expo prebuild --clean

# Run Android
npx expo run:android

# Run iOS (nếu có Mac)
npx expo run:ios
```

---

### 5️⃣ Test Google Sign-In

1. Mở app
2. Nhấn nút **"Đăng nhập bằng Google"**
3. Chọn tài khoản Google
4. ✅ Đăng nhập thành công!

---

## 📂 Files Đã Được Tạo/Chỉnh Sửa

### **Mới Tạo:**
- ✅ `src/services/googleAuth.service.ts` - Google Sign-In service
- ✅ `GOOGLE_SIGNIN_IMPLEMENTATION.md` - Hướng dẫn chi tiết
- ✅ `SHA1_FINGERPRINT_GUIDE.md` - Hướng dẫn lấy SHA-1
- ✅ `QUICK_START.md` - File này

### **Đã Chỉnh Sửa:**
- ✅ `package.json` - Thêm `@react-native-google-signin/google-signin`
- ✅ `app.json` - Thêm plugin và config
- ✅ `src/configs/environment.ts` - Thêm Google Client ID
- ✅ `src/models/auth/auth.types.ts` - Thêm GoogleLoginResponse
- ✅ `src/services/auth.service.ts` - Cập nhật loginWithGoogleToken
- ✅ `src/components/auth/LoginScreen.tsx` - Thêm Google Sign-In button
- ✅ `.gitignore` - Ignore google-services files
- ✅ `.env.example` - Thêm hướng dẫn config

---

## 🔄 Luồng Hoạt Động

```
User clicks "Đăng nhập bằng Google"
  ↓
Google Sign-In dialog hiển thị
  ↓
User chọn tài khoản Google
  ↓
Nhận Google ID Token
  ↓
Gửi đến backend: POST /auth/google
  ↓
Backend verify với Google
  ↓
Backend trả về JWT token + user info
  ↓
Lưu JWT token vào SecureStore
  ↓
Redirect theo role (student/club-leader/admin...)
```

---

## 🐛 Troubleshooting

### **Lỗi: DEVELOPER_ERROR**
➡️ SHA-1 fingerprint không đúng hoặc chưa được thêm vào Google Cloud Console

**Giải pháp:**
1. Kiểm tra lại SHA-1
2. Rebuild app: `npx expo prebuild --clean && npx expo run:android`

### **Lỗi: SIGN_IN_FAILED**
➡️ Web Client ID không đúng

**Giải pháp:**
Kiểm tra `GOOGLE_WEB_CLIENT_ID` trong `src/configs/environment.ts`

### **Lỗi: 401 Unauthorized từ Backend**
➡️ Google token không valid

**Giải pháp:**
- Kiểm tra backend API endpoint hoạt động
- Verify Web Client ID match với backend

---

## 📚 Tài Liệu Chi Tiết

- [GOOGLE_SIGNIN_IMPLEMENTATION.md](./GOOGLE_SIGNIN_IMPLEMENTATION.md) - Implementation chi tiết
- [SHA1_FINGERPRINT_GUIDE.md](./SHA1_FINGERPRINT_GUIDE.md) - Hướng dẫn lấy SHA-1
- [GOOGLE_OAUTH_MOBILE_GUIDE.md](../uni-club/GOOGLE_OAUTH_MOBILE_GUIDE.md) - Tài liệu gốc từ web

---

## ℹ️ Thông Tin Hệ Thống

**Backend API:** `https://uniclub-qyn9a.ondigitalocean.app`  
**Endpoint:** `POST /auth/google`  
**Web Client ID:** `772231604776-mrl2ick1aess5a4f2npfm7qctvksprd7.apps.googleusercontent.com`  
**Package Name:** `com.anhtri.uniclub`  
**Bundle ID:** `com.anhtri.uniclub`

---

**🎯 Nếu bạn đã có `google-services.json` và `GoogleService-Info.plist`, chỉ cần rebuild app là xong!**

```bash
npx expo prebuild --clean && npx expo run:android
```

**Happy coding! 🚀**
