# 🔐 Hướng Dẫn Lấy SHA-1 Fingerprint cho Android

## Phương Pháp 1: Sử dụng Gradle (Khuyến nghị)

```bash
cd android
./gradlew signingReport
```

Hoặc trên Windows:
```bash
cd android
.\gradlew.bat signingReport
```

Kết quả sẽ hiển thị SHA-1 và SHA-256 fingerprints. Tìm dòng có **SHA1** trong phần **Variant: debug**:

```
Variant: debug
Config: debug
Store: ~/.android/debug.keystore
Alias: androiddebugkey
MD5: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
SHA-256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
Valid until: ...
```

**Copy SHA-1 fingerprint** (ví dụ: `AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD`)

---

## Phương Pháp 2: Sử dụng Keytool

### Debug Keystore (Development)

**MacOS/Linux:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Windows:**
```bash
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

### Release Keystore (Production)

Nếu bạn đã có release keystore:

```bash
keytool -list -v -keystore /path/to/your-release-key.keystore -alias your-alias
```

**Lưu ý:** Bạn sẽ cần nhập password của keystore.

---

## Thêm SHA-1 vào Google Cloud Console

1. Truy cập [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

2. Chọn project **uni-club** (hoặc project tương ứng)

3. **Tạo Android OAuth Client ID mới:**
   - Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
   - Application type: **Android**
   - Package name: `com.anhtri.uniclub`
   - SHA-1 certificate fingerprint: **paste SHA-1 vừa copy**
   - Click **"Create"**

4. **Hoặc cập nhật Client ID hiện có:**
   - Tìm Android OAuth Client ID đã tạo
   - Click vào để chỉnh sửa
   - Thêm SHA-1 fingerprint mới
   - Click **"Save"**

---

## ⚠️ Lưu Ý Quan Trọng

### Debug vs Release Keystore

- **Debug keystore**: Dùng cho development (khi chạy `expo run:android` hoặc `npm run android`)
- **Release keystore**: Dùng cho production (khi build APK/AAB để publish lên Google Play)

**Bạn cần thêm SHA-1 của CẢ HAI keystore** vào Google Cloud Console nếu muốn Google Sign-In hoạt động trong cả môi trường development và production.

### Nếu Gặp Lỗi "DEVELOPER_ERROR"

Điều này thường xảy ra khi:
1. SHA-1 fingerprint không đúng
2. Package name không khớp
3. Chưa rebuild app sau khi thêm SHA-1

**Giải pháp:**
1. Kiểm tra lại SHA-1 fingerprint
2. Đảm bảo package name là `com.anhtri.uniclub` (trong `app.json` và Google Cloud Console)
3. Rebuild app:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

---

## Kiểm Tra Package Name

Xác nhận package name trong `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.anhtri.uniclub"
    }
  }
}
```

---

## 🎯 Next Steps

Sau khi có SHA-1 fingerprint và thêm vào Google Cloud Console:

1. ✅ Download `google-services.json` từ Firebase Console
2. ✅ Đặt `google-services.json` vào thư mục gốc project
3. ✅ Rebuild app: `npx expo prebuild --clean && npx expo run:android`
4. ✅ Test Google Sign-In

---

**Tham khảo thêm:**
- [GOOGLE_SIGNIN_IMPLEMENTATION.md](./GOOGLE_SIGNIN_IMPLEMENTATION.md)
- [React Native Google Sign-In Documentation](https://github.com/react-native-google-signin/google-signin/blob/master/docs/android-guide.md)
