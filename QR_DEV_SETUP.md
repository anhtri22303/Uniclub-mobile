# QR Code Development Setup

## Cấu hình IP Local cho Development Mode

### Bước 1: Tìm địa chỉ IP của máy bạn

**Windows:**
```powershell
ipconfig
```
Tìm dòng `IPv4 Address` trong phần `Wireless LAN adapter Wi-Fi` hoặc `Ethernet adapter`

**macOS/Linux:**
```bash
ifconfig
```
Tìm `inet` address (thường là 192.168.x.x hoặc 10.x.x.x)

### Bước 2: Cập nhật IP trong code

Mở file `src/utils/getLocalUrl.ts` và thay đổi:

```typescript
const LOCAL_IP = '192.168.1.100'; // Change this to your IP
```

Thay `192.168.1.100` bằng IP address thực tế của bạn, ví dụ:
```typescript
const LOCAL_IP = '192.168.1.50';
```

### Bước 3: Đảm bảo Expo đang chạy

```bash
npx expo start
```

Kiểm tra port (thường là 8081). Nếu khác, cập nhật trong `getLocalUrl.ts`:
```typescript
const PORT = '8081'; // Update if different
```

## Sử dụng QR Modal

### Production Mode
- QR code chứa URL từ backend API
- Dùng cho production environment
- Students scan để check-in thông qua web/production app

### Development Mode  
- QR code chứa deep link local: `exp://YOUR_IP:8081/--/student/checkin/[token]`
- Dùng khi test trên thiết bị thật trong cùng mạng WiFi
- Students scan sẽ mở app trực tiếp đến trang check-in với token

## Lưu ý
- Thiết bị cần cùng mạng WiFi với máy dev
- Expo app cần được cài đặt trên thiết bị test
- Deep link chỉ hoạt động trong development mode với Expo Go

## Troubleshooting

**QR không hoạt động:**
1. Kiểm tra IP address có đúng không
2. Kiểm tra máy và thiết bị cùng WiFi
3. Kiểm tra Expo đang chạy và port đúng
4. Thử restart Expo: `npx expo start --clear`

**Deep link không mở app:**
1. Đảm bảo Expo Go đã được cài đặt
2. Kiểm tra app.json có cấu hình scheme chưa
3. Thử scan QR từ camera thay vì QR scanner app
