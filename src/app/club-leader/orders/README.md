# Club Leader Order Management Pages

This directory contains the mobile pages for managing product redemption orders in the club.

## Pages

### 1. Order List Page (`index.tsx`)
**Route:** `/club-leader/orders`

A comprehensive list view of all redemption orders for the club leader's club.

#### Features:
- **Stats Dashboard**: Quick overview cards showing:
  - Total pending orders
  - Total completed orders
  - Total points redeemed (completed orders only)

- **Search Functionality**: 
  - Search by product name, member name, or order code
  - Real-time filtering as you type

- **Date Range Filter**:
  - Collapsible date filter section
  - Filter orders by creation date (From/To)
  - Easy clear button to reset date filters

- **Tab-Based Filtering**:
  - **Pending Tab**: Orders waiting to be processed
  - **Completed Tab**: Successfully fulfilled orders
  - **Cancelled Tab**: Refunded, cancelled, or partially refunded orders

- **Order Cards**: Each order displays:
  - Product name with visual status indicator
  - Order code
  - Member who placed the order
  - Quantity and points
  - Creation date
  - Status badge (color-coded)

- **Pull-to-Refresh**: Swipe down to reload data

- **Navigation**: Tap any order card to view details

---

### 2. Order Detail Page (`[id].tsx`)
**Route:** `/club-leader/orders/[orderId]`

Detailed view of a single order with management actions.

#### Features:

##### Information Displayed:
- **Product Information**: 
  - Product name and type
  - Visual product icon

- **Member Information**:
  - Member name
  - Club name

- **Order Details**:
  - Order code and status
  - Quantity ordered
  - Total points spent
  - Creation date
  - Completion date (if completed)
  - Refund reason (if refunded)

##### Actions (for PENDING orders only):

1. **Complete Order**:
   - Marks order as completed
   - Member receives their product
   - Confirmation dialog before processing

2. **Full Refund**:
   - Refunds entire order
   - Returns all points to member
   - Requires reason input
   - Shows warning about refund impact

3. **Partial Refund**:
   - Refunds specific quantity
   - Returns proportional points to member
   - Requires quantity and reason input
   - Validates quantity (1 to max ordered)

##### Refund Modal:
- **Type Selection**: Toggle between Full and Partial refund
- **Quantity Input**: For partial refunds (with validation)
- **Reason Input**: Required field for all refunds
- **Warning Message**: Clear explanation of refund consequences
- **Validation**: Client-side validation before submission

##### Status Handling:
- Completed, Refunded, or Cancelled orders show info message
- No actions available for non-pending orders
- Clear visual feedback with status badges

---

## Data Flow

### Services Used:
- `getClubRedeemOrders(clubId)`: Fetch all orders for a club
- `completeRedeemOrder(orderId)`: Mark order as completed
- `refundRedeemOrder(payload)`: Process full refund
- `refundPartialRedeemOrder(payload)`: Process partial refund

### State Management:
- React Query for server state caching and synchronization
- Local state for UI interactions (modals, filters, tabs)
- Auto-refresh with 3-minute stale time

### Club ID Detection:
1. Check user's `clubIds` array from auth store
2. Fallback to JWT token parsing via `ClubService.getClubIdFromToken()`
3. Show error if no club ID found

---

## User Experience

### Mobile-Optimized Design:
- **Touch-Friendly**: Large touch targets (44x44pt minimum)
- **Responsive Layout**: Adapts to different screen sizes
- **Native Feel**: Uses React Native components and patterns
- **Smooth Animations**: Modal transitions and interactions
- **Pull-to-Refresh**: Standard mobile pattern for data reload
- **Color-Coded Status**: Visual feedback for order states
- **Loading States**: Skeletons and spinners during async operations

### Visual Hierarchy:
- Gradient headers with white text
- Card-based layout with shadows
- Color-coded status badges (yellow/green/red/blue)
- Clear action buttons with icons
- Proper spacing and padding

### Error Handling:
- Graceful error messages via Alert dialogs
- Loading states during API calls
- Form validation before submission
- Confirmation dialogs for destructive actions

---

## Navigation

### Entry Points:
1. From Navigation Bar (bottom tab)
2. From Club Leader Dashboard
3. Deep links with order ID

### Navigation Flow:
```
Club Leader Dashboard
    ↓
Orders List (/club-leader/orders)
    ↓ (tap order card)
Order Detail (/club-leader/orders/[id])
    ↓ (complete/refund action)
Back to Orders List (auto-refresh)
```

---

## Status Indicators

### Order Statuses:
- **PENDING** 🟡: Awaiting action (yellow)
- **COMPLETED** 🟢: Successfully fulfilled (green)
- **CANCELLED** 🔴: Cancelled order (red)
- **REFUNDED** 🔵: Fully refunded (blue)
- **PARTIALLY_REFUNDED** 🔵: Partially refunded (blue)

### Visual Indicators:
- Color-coded top border on cards
- Status badge with icon
- Background tint matching status
- Disabled actions for non-pending orders

---

## API Integration

All API calls follow the standard response structure:
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

### RedeemOrder Interface:
```typescript
interface RedeemOrder {
  orderId: number;
  orderCode: string;
  productName: string;
  quantity: number;
  totalPoints: number;
  productType?: string;
  status: string; // PENDING, COMPLETED, REFUNDED, etc.
  createdAt: string;
  completedAt?: string;
  clubName: string;
  memberName: string;
  reasonRefund?: string;
  clubId?: number;
  eventId?: number;
}
```

---

## Future Enhancements

Potential improvements for future versions:

1. **Order Notifications**: Push notifications for new orders
2. **Bulk Actions**: Process multiple orders at once
3. **Order History Export**: Download CSV/PDF reports
4. **Advanced Filters**: Filter by product type, date range presets
5. **Order Analytics**: Charts and statistics dashboard
6. **Scanner Integration**: QR code scanning for quick order lookup
7. **Order Comments**: Add notes to orders for internal tracking
8. **Member Communication**: Send messages to members about their orders

---

## Testing Checklist

When testing these pages, verify:

- [ ] Orders load correctly with proper club ID
- [ ] Search filters work in real-time
- [ ] Date filters apply correctly
- [ ] Tab switching shows correct orders
- [ ] Order cards display all information
- [ ] Navigation to detail page works
- [ ] Complete order action works
- [ ] Full refund with reason works
- [ ] Partial refund with quantity validation works
- [ ] Status badges display correctly
- [ ] Pull-to-refresh updates data
- [ ] Loading states show properly
- [ ] Error messages appear when appropriate
- [ ] Back navigation maintains state
- [ ] Deep links work with order ID
- [ ] Modal dismissal works correctly
- [ ] Form validation prevents invalid submissions

---

## Notes

- All times are displayed in the user's local timezone
- Points calculations are handled server-side
- Refund actions are irreversible (confirm before processing)
- Orders are cached for 3 minutes to reduce API calls
- The UI gracefully handles missing or null data fields

