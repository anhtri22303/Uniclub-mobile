# Cấu hình Camera & QR Scanner cho Android Emulator

## 📱 Tổng quan

App giờ có tính năng scan QR code để check-in event. User có thể:
1. **Nhập code thủ công** - Gõ check-in code trực tiếp
2. **Scan QR code** - Dùng camera để quét QR từ web

## 🎯 Luồng hoạt động

```
Club Leader (Web) → Generate QR (Dev tab) 
                  ↓
        QR hiển thị trên màn hình
                  ↓
Student (Mobile) → Click "Scan QR Code" → Mở camera
                  ↓
               Scan QR
                  ↓
    Auto navigate → /student/checkin/[token]
                  ↓
          Click "Check In Now"
                  ↓
              ✅ Success!
```

---

## ⚙️ Bước 1: Cấu hình Camera cho Android Emulator

### Trong Android Studio AVD Manager:

1. Mở **AVD Manager** (Tools → Device Manager)
2. Click biểu tượng **Edit** (✏️) của emulator
3. Click **Show Advanced Settings** ở cuối
4. Scroll xuống phần **Camera**:
   - **Front Camera**: Chọn `Webcam0` hoặc `Emulated`
   - **Back Camera**: Chọn `Webcam0` ⭐ (quan trọng!)
5. Click **Finish**
6. **Cold Boot** emulator (đừng dùng Quick Boot lần đầu)

### Kiểm tra Camera hoạt động:

```bash
# 1. Start emulator
# 2. Mở app Camera trong emulator
# 3. Chuyển sang camera sau (back camera icon)
# 4. Nếu thấy hình ảnh từ webcam máy tính → ✅ Thành công!
```

### Troubleshooting Camera:

**Camera không bật được:**
- Kiểm tra webcam có hoạt động không (thử app khác như Zoom)
- Đóng tất cả app đang dùng webcam
- Restart emulator với Cold Boot
- Thử chọn webcam khác (Webcam1, Webcam2...)

**Màn hình đen:**
- Kiểm tra driver webcam
- Chạy emulator với quyền Admin
- Update Android Emulator trong SDK Manager

---

## 📦 Bước 2: Cài đặt Dependencies

Packages đã được cài:
```bash
npx expo install expo-camera expo-barcode-scanner
```

Files đã được tạo:
- ✅ `src/app/student/scan-qr.tsx` - QR Scanner page
- ✅ `src/app/student/checkin/[code].tsx` - Check-in result page
- ✅ Updated `src/app/student/check-in.tsx` - Added "Scan QR" button
- ✅ `app.json` - Camera permissions configured

---

## 🚀 Bước 3: Sử dụng QR Scanner

### Từ Mobile App:

1. Login với role **STUDENT**
2. Vào trang **Check-In** (từ navigation bar)
3. Click nút **"📷 Scan QR Code"**
4. App sẽ yêu cầu quyền camera → Click **Allow**
5. Hướng camera vào QR code trên web
6. Tự động chuyển đến trang check-in với token

### Từ Web (Club Leader):

1. Login với role **CLUB_LEADER**
2. Vào trang **Events**
3. Click **"Generate QR Code"** trên event
4. Chọn tab **"Development"** ⭐
5. QR code sẽ chứa deep link: `exp://YOUR_IP:8081/--/student/checkin/[token]`
6. Student scan QR này → App mở trực tiếp trang check-in

---

## 🔍 QR Code Formats được hỗ trợ

App có thể scan nhiều format:

### 1. Direct Token (Simple)
```
abc123token456
```

### 2. URL với query param
```
https://example.com/checkin?token=abc123token456
```

### 3. URL với path
```
https://example.com/student/checkin/abc123token456
```

### 4. Expo Deep Link (Dev mode)
```
exp://192.168.1.50:8081/--/student/checkin/abc123token456
```

Tất cả đều sẽ extract được token và navigate đến `/student/checkin/[token]`

---

## 🎨 Features của QR Scanner

### UI/UX:
- ✨ Fullscreen camera view
- 🎯 Animated scanning frame với corners
- 💡 Flashlight toggle (torch)
- 🔙 Back button
- 📱 Instructions at bottom
- ✅ "Scan Again" button sau khi scan

### Smart Token Detection:
- Tự động phát hiện token trong URL
- Hỗ trợ query params và path params
- Fallback cho direct token string
- Error handling với user-friendly messages

### Permissions:
- Tự động request camera permission
- Clear error message nếu bị từ chối
- Link đến settings để enable

---

## 🧪 Testing

### Test với Android Emulator:

1. **Prepare:**
   ```bash
   npx expo start
   ```

2. **Generate QR trên web:**
   - Mở browser → Vào web app
   - Generate QR với Development tab
   - QR sẽ hiển thị trên màn hình máy tính

3. **Scan từ emulator:**
   - Open app → Navigate to Check-In
   - Click "Scan QR Code"
   - Point emulator camera (webcam) vào QR trên màn hình
   - App sẽ tự động detect và navigate

### Alternative: Test trên thiết bị thật

Nếu emulator camera không hoạt động tốt:

```bash
# 1. Enable USB Debugging trên điện thoại
# 2. Connect qua USB
# 3. Run:
adb devices  # Kiểm tra kết nối
npx expo start  # Start metro
# 4. App sẽ tự động install trên điện thoại
# 5. Camera sẽ hoạt động tốt hơn nhiều!
```

---

## 📋 Checklist

Trước khi test, đảm bảo:

- [ ] Webcam máy tính hoạt động
- [ ] Android Emulator camera đã cấu hình (Back camera = Webcam0)
- [ ] App đã cài packages: expo-camera, expo-barcode-scanner
- [ ] Metro bundler đang chạy (`npx expo start`)
- [ ] Đã login với role STUDENT
- [ ] QR code đã được generate từ web (Development tab)
- [ ] Cấp quyền camera cho app khi được yêu cầu

---

## 🐛 Common Issues

### "Camera permission denied"
**Fix:** Vào Settings → Apps → YourApp → Permissions → Camera → Allow

### "No camera detected"
**Fix:** 
- Kiểm tra webcam có hoạt động không
- Restart emulator với Cold Boot
- Thử thiết bị thật nếu emulator không work

### "QR không scan được"
**Fix:**
- Đảm bảo QR đủ lớn trên màn hình
- Lighting tốt (không quá tối/sáng)
- Camera focus đúng (tap màn hình để focus)
- Thử bật flashlight (torch icon)

### "Scan xong không navigate"
**Fix:**
- Check console log xem có token không
- Verify URL format đúng
- Kiểm tra route đã đăng ký trong `_layout.tsx`

---

## 💡 Pro Tips

1. **Test QR trên màn hình khác:** Mở QR trên điện thoại/tablet khác, dễ scan hơn
2. **Adjust brightness:** Tăng độ sáng màn hình hiển thị QR
3. **Use real device:** Camera trên thiết bị thật tốt hơn emulator nhiều
4. **Dev tab only for testing:** Production dùng tab Production với QR từ backend

---

## 📸 Screenshots Flow

```
┌─────────────────┐
│  Check-In Page  │
│                 │
│ [Enter Code]    │
│                 │
│      OR         │
│                 │
│ [📷 Scan QR]    │ ← Click here
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Camera View    │
│                 │
│   ┌─────────┐   │
│   │    QR   │   │ ← Scan QR
│   └─────────┘   │
│                 │
│ Position QR...  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Check-in Page   │
│                 │
│ [Check In Now]  │ ← Auto navigate with token
│                 │
└─────────────────┘
```

Happy Scanning! 📱✨
