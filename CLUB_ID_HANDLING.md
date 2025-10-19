# Club ID Handling - Developer Guide

## 📋 Overview

Backend API có thể trả về **2 định dạng khác nhau** cho club data trong login response:

1. **`clubId`** (singular) - Một số nguyên đại diện cho 1 club
2. **`clubIds`** (plural) - Một mảng số nguyên đại diện cho nhiều clubs

App được thiết kế để **tự động xử lý cả 2 định dạng** và normalize về cùng một format.

## 🔄 Automatic Normalization

### Input (từ Backend)

```typescript
// Format 1: Single club (clubId)
{
  "token": "...",
  "userId": 9,
  "email": "clubleader@gmail.com",
  "role": "CLUB_LEADER",
  "clubId": 2  // ← singular
}

// Format 2: Multiple clubs (clubIds)
{
  "token": "...",
  "userId": 10,
  "email": "multiclub@gmail.com",
  "role": "CLUB_LEADER",
  "clubIds": [1, 2, 3]  // ← plural (array)
}

// Format 3: No club data
{
  "token": "...",
  "userId": 11,
  "email": "student@gmail.com",
  "role": "STUDENT"
  // No clubId or clubIds
}
```

### Output (trong App)

```typescript
// Tất cả đều được normalize thành clubIds (array hoặc undefined)

// Format 1 → clubIds: [2]
user.clubIds = [2]

// Format 2 → clubIds: [1, 2, 3]
user.clubIds = [1, 2, 3]

// Format 3 → clubIds: undefined
user.clubIds = undefined
```

## 🛠 Implementation

### File: `src/stores/auth.store.ts`

```typescript
// Handle both clubId (singular) and clubIds (plural) from backend
let normalizedClubIds: number[] | undefined;
if (loginResponse.clubIds) {
  // If clubIds exists (array), use it directly
  normalizedClubIds = loginResponse.clubIds;
} else if (loginResponse.clubId !== undefined && loginResponse.clubId !== null) {
  // If clubId exists (single number), convert to array
  normalizedClubIds = [loginResponse.clubId];
}

const user = {
  // ... other fields
  clubIds: normalizedClubIds, // Always array or undefined
};
```

### File: `src/models/auth/auth.types.ts`

```typescript
export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  role: string;
  fullName?: string;
  staff?: boolean;
  clubId?: number;      // ← Backend may return this (singular)
  clubIds?: number[];   // ← OR this (plural)
}
```

## 📖 Usage Examples

### Example 1: Check if user has clubs

```typescript
import { useAuthStore } from '@stores/auth.store';

const MyComponent = () => {
  const user = useAuthStore((state) => state.user);

  if (user?.clubIds && user.clubIds.length > 0) {
    console.log('User has clubs:', user.clubIds);
  } else {
    console.log('User has no clubs');
  }
};
```

### Example 2: Get primary club ID

```typescript
const user = useAuthStore((state) => state.user);

// Get the first (primary) club ID
const primaryClubId = user?.clubIds?.[0];

if (primaryClubId) {
  // Fetch club details
  const clubDetails = await ClubService.getClubById(primaryClubId);
}
```

### Example 3: Check membership in specific club

```typescript
const user = useAuthStore((state) => state.user);
const targetClubId = 5;

const isMember = user?.clubIds?.includes(targetClubId) ?? false;

if (isMember) {
  console.log(`User is member of club ${targetClubId}`);
}
```

### Example 4: Iterate through all clubs

```typescript
const user = useAuthStore((state) => state.user);

user?.clubIds?.forEach(async (clubId) => {
  const club = await ClubService.getClubById(clubId);
  console.log(`Club ${clubId}:`, club.name);
});
```

### Example 5: API call with club IDs

```typescript
const user = useAuthStore((state) => state.user);

// Send comma-separated club IDs to API
if (user?.clubIds) {
  const clubIdsParam = user.clubIds.join(',');
  const events = await EventService.getEventsByClubs(clubIdsParam);
}
```

## ✅ Benefits

1. **Backward Compatible**: Hỗ trợ cả định dạng cũ (clubId) và mới (clubIds)
2. **Consistent Interface**: Developers luôn làm việc với `clubIds` (array)
3. **Type Safe**: TypeScript types đảm bảo type safety
4. **Easy to Use**: Không cần check format, app tự động xử lý

## 🧪 Testing

File test: `src/utils/clubIdNormalization.test.ts`

```bash
# Run tests (if you have test runner configured)
npm test -- clubIdNormalization.test.ts
```

## ⚠️ Important Notes

1. **Always access as array**: Luôn sử dụng `user.clubIds` (plural), không dùng `user.clubId`
2. **Check for undefined**: Luôn check `user?.clubIds` trước khi sử dụng
3. **Array methods**: Có thể dùng `.map()`, `.filter()`, `.includes()`, etc.
4. **Empty check**: Dùng `user.clubIds?.length > 0` để check có clubs hay không

## 🔍 Debugging

Để debug club data:

```typescript
import { useAuthStore } from '@stores/auth.store';

const user = useAuthStore((state) => state.user);

console.log('User club data:', {
  hasClubIds: !!user?.clubIds,
  clubCount: user?.clubIds?.length ?? 0,
  clubIds: user?.clubIds,
  firstClub: user?.clubIds?.[0],
});
```

## 📚 Related Files

- `src/stores/auth.store.ts` - Main normalization logic
- `src/models/auth/auth.types.ts` - Type definitions
- `src/services/auth.service.ts` - Login API service
- `src/utils/clubIdNormalization.test.ts` - Test cases
- `API_CONFIGURATION.md` - API documentation

---

**Last Updated:** October 20, 2025
**Status:** ✅ Production Ready
