# Check-in Flow Documentation

## 📋 Luồng Check-in hoàn chỉnh

### 1. Club Leader Generate QR Code

**API:** `GET /api/attendance/qr-token/{eventId}`

```typescript
const { token, qrUrl } = await generateCode(eventId);

// Response:
{
  token: "abc123xyz456...",      // ← Token để check-in
  qrUrl: "https://api.../checkin?token=abc123xyz456"
}
```

**Sử dụng:**
- `token`: Dùng để tạo deep link cho mobile app
- `qrUrl`: URL từ backend (production mode)

---

### 2. Student Scan QR Code

**Có 2 modes trong QRModal:**

#### Production Mode (Web QR)
```
QR Code chứa: https://api.example.com/checkin?token=abc123xyz456
                                                        ↓
                                              Student scan bằng web
```

#### Development Mode (Mobile Deep Link)
```
QR Code chứa: exp://192.168.1.50:8081/--/student/checkin/abc123xyz456
                                                                  ↓
                                                          Student scan QR
                                                                  ↓
                                        App tự động mở: /student/checkin/[token]
```

---

### 3. Navigate to Check-in Page

**Route:** `/student/checkin/[code]`

- `[code]` parameter = `token` từ generateCode API
- Token được truyền qua URL params

```typescript
// URL: /student/checkin/abc123xyz456
const params = useLocalSearchParams();
const token = params?.code as string;  // ← "abc123xyz456"
```

**Lưu ý:** 
- Tên file là `[code].tsx` nhưng value chính là `token`
- Đây là convention của expo-router (dynamic route)

---

### 4. Call Check-in API

**API:** `POST /api/attendance/checkin?token={token}`

```typescript
const response = await checkin(token);

// API expects:
// POST /api/attendance/checkin?token=abc123xyz456

// Response:
"Checked-in successfully"  // hoặc error message
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ CLUB LEADER (Web)                                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Click "Generate QR Code" on event                        │
│ 2. API: GET /api/attendance/qr-token/123                    │
│    Response: { token: "abc123...", qrUrl: "..." }           │
│ 3. Display QR Code:                                         │
│    - Production tab: QR chứa qrUrl từ backend               │
│    - Development tab: QR chứa exp://IP/--/student/checkin/token │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓ Student scan QR
                         │
┌────────────────────────┴────────────────────────────────────┐
│ STUDENT (Mobile App)                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Scan QR Code (camera scan)                               │
│ 2. App auto navigate: /student/checkin/[token]             │
│ 3. Page receives token from URL params                      │
│ 4. Student clicks "Check In Now" button                     │
│ 5. API: POST /api/attendance/checkin?token=abc123...       │
│ 6. Success → Alert → Redirect to /student/events           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Files & Responsibilities

### `checkin.service.ts`
```typescript
// Generate QR token for event
generateCode(eventId: number): Promise<{ token, qrUrl }>

// Check-in with token
checkin(token: string): Promise<string>
```

### `QRModal.tsx` (Club Leader)
```typescript
// Fetch token from API
const { token, qrUrl } = await generateCode(eventId);

// Display QR based on mode:
// - Production: QR = qrUrl
// - Development: QR = exp://IP/--/student/checkin/${token}
```

### `scan-qr.tsx` (Student)
```typescript
// Scan QR code from camera
// Extract token from URL/QR data
// Navigate to: /student/checkin/${token}
```

### `checkin/[code].tsx` (Student)
```typescript
// Receive token from URL params
const token = params?.code;

// Call check-in API
await checkin(token);
```

---

## ✅ Key Points

1. **Token từ generateCode API** là key để check-in
2. **qrUrl** là URL từ backend cho production
3. **Development mode** tạo deep link với token để test local
4. **[code] parameter** trong URL chính là **token**
5. **checkin API** expects token as query parameter

---

## 🧪 Testing

### Test Development Mode:

1. **Generate QR (Web):**
   ```
   Club Leader → Events → Generate QR → Development tab
   QR contains: exp://192.168.1.50:8081/--/student/checkin/TOKEN_HERE
   ```

2. **Scan QR (Mobile):**
   ```
   Student → Check-in → Scan QR Code
   Camera scan QR → Auto navigate to /student/checkin/TOKEN_HERE
   ```

3. **Check-in:**
   ```
   Click "Check In Now" → API call with token
   Success → Alert → Redirect to events
   ```

### Test Production Mode:

1. **Generate QR (Web):**
   ```
   Production tab
   QR contains: https://api.example.com/checkin?token=TOKEN_HERE
   ```

2. **Web handles the token** (not mobile deep link)

---

## 🐛 Common Issues

### Token not found:
- Check QR code contains token
- Verify URL params parsing
- Console log token value

### Check-in fails:
- Token might be expired
- Token might be invalid
- Check API endpoint and params format

### QR scan doesn't navigate:
- Verify deep link format
- Check expo URL is correct
- Test with console.log in scan handler

---

## 📝 Summary

```
generateCode() returns token
         ↓
QR Code displays (qrUrl or deep link with token)
         ↓
Student scans QR
         ↓
Navigate to /student/checkin/[token]
         ↓
checkin(token) API call
         ↓
✅ Success!
```

**The token is the bridge between QR generation and check-in!** 🔑
