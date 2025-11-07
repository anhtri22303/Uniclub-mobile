# Club Leader Dashboard Architecture

## Component Hierarchy

```
club-leader.tsx (Main Dashboard Page)
│
├── Header
│   └── Title: "Club Leader Dashboard"
│
├── ScrollView (with Pull-to-Refresh)
│   │
│   ├── ClubInfoCard
│   │   ├── Club Name (featured)
│   │   ├── Major & Policy (grid)
│   │   ├── Description
│   │   └── Leader Info
│   │
│   ├── Stats Section 1: Core Metrics
│   │   ├── StatsCard: Members
│   │   │   ├── Total: X members
│   │   │   ├── Leaders: Y
│   │   │   ├── Regular: Z
│   │   │   ├── Staff: A
│   │   │   └── Recent: +B (30 days)
│   │   │
│   │   ├── StatsCard: Applications
│   │   │   ├── Total: X applications
│   │   │   ├── Approved: Y
│   │   │   ├── Pending: Z
│   │   │   ├── Rejected: A
│   │   │   └── Approval Rate: B%
│   │   │
│   │   └── StatsCard: Events
│   │       ├── Total: X events
│   │       ├── Approved: Y
│   │       ├── Active: Z
│   │       ├── Pending: A
│   │       └── Approval Rate: B%
│   │
│   ├── Stats Section 2: Operations
│   │   ├── StatsCard: Products/Gifts
│   │   │   ├── Total: X products
│   │   │   ├── Active: Y
│   │   │   ├── Inactive: Z
│   │   │   ├── Stock: A items
│   │   │   └── Value: B pts
│   │   │
│   │   ├── StatsCard: Orders
│   │   │   ├── Total: X orders
│   │   │   ├── Completed: Y
│   │   │   ├── Pending: Z
│   │   │   ├── Cancelled: A
│   │   │   └── Redeemed: B pts
│   │   │
│   │   └── StatsCard: Wallet
│   │       ├── Balance: X pts
│   │       ├── Transactions: Y
│   │       ├── Given: Z pts
│   │       ├── Avg: A pts
│   │       └── Attendance: B records
│   │
│   ├── Management Section
│   │   ├── RecentApplicationsList
│   │   │   ├── Application Cards (top 5)
│   │   │   │   ├── Applicant Name
│   │   │   │   ├── Email
│   │   │   │   ├── Date
│   │   │   │   └── Status Badge
│   │   │   │
│   │   │   └── "Manage All" Button
│   │   │
│   │   └── MembersByMajorChart
│   │       ├── Major Cards (top 10)
│   │       │   ├── Major Name
│   │       │   ├── Progress Bar
│   │       │   └── Count Badge
│   │       │
│   │       └── "Showing X of Y" indicator
│   │
│   └── Events Section
│       └── CoHostEventsList
│           ├── Co-Host Event Cards
│           │   ├── Event Name
│           │   ├── Co-Host Status Badge
│           │   ├── Description
│           │   ├── Event Details
│           │   │   ├── Host Club
│           │   │   ├── Date
│           │   │   ├── Time
│           │   │   └── Location
│           │   ├── Co-Hosts List
│           │   └── Check-in Stats
│           │
│           └── "View All Events" Button
│
└── NavigationBar (Bottom Fixed)
    ├── Home
    ├── Events
    ├── Members
    └── Profile
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     club-leader.tsx                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ useEffect (on clubId change)                           │ │
│  │   └─> loadData()                                       │ │
│  │       ├─> ClubService.getClubByIdFull()               │ │
│  │       ├─> MembershipsService.getMembersByClubId()     │ │
│  │       ├─> MemberApplicationService.get...()           │ │
│  │       ├─> getEventByClubId()                          │ │
│  │       ├─> getEventCoHostByClubId()                    │ │
│  │       ├─> ProductService.getProducts()                │ │
│  │       ├─> getClubRedeemOrders()                       │ │
│  │       ├─> WalletService.getClubWallet()               │ │
│  │       ├─> WalletService.getClubToMemberTransactions() │ │
│  │       └─> fetchClubAttendanceHistory()                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ State Management                                        │ │
│  │   ├─ managedClub                                       │ │
│  │   ├─ members[]                                         │ │
│  │   ├─ applications[]                                    │ │
│  │   ├─ events[]                                          │ │
│  │   ├─ coHostEvents[]                                    │ │
│  │   ├─ products[]                                        │ │
│  │   ├─ orders[]                                          │ │
│  │   ├─ walletData                                        │ │
│  │   ├─ transactions[]                                    │ │
│  │   ├─ attendanceHistory[]                               │ │
│  │   ├─ loading                                           │ │
│  │   └─ refreshing                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ useMemo (stats calculation)                            │ │
│  │   ├─ Member stats (total, leaders, staff, etc.)       │ │
│  │   ├─ Application stats (pending, approved, rate)      │ │
│  │   ├─ Event stats (total, active, approval rate)       │ │
│  │   ├─ Product stats (active, stock, value)             │ │
│  │   ├─ Order stats (completed, redeemed points)         │ │
│  │   ├─ Wallet stats (balance, transactions, avg)        │ │
│  │   ├─ membersByMajor (distribution object)             │ │
│  │   ├─ activeCoHostEvents (filtered list)               │ │
│  │   └─ recentApplications (top 5)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Render Components                                       │ │
│  │   ├─> ClubInfoCard (club, isLoading)                  │ │
│  │   ├─> StatsCard x6 (stats data)                       │ │
│  │   ├─> RecentApplicationsList (applications, loading)  │ │
│  │   ├─> MembersByMajorChart (distribution, total)       │ │
│  │   └─> CoHostEventsList (events, clubId, loading)      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Layer

```
┌──────────────────────────────────────────────────────────┐
│                   Service Layer                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ClubService                                             │
│    └─ getClubByIdFull(clubId) -> Club                   │
│                                                           │
│  MembershipsService                                      │
│    └─ getMembersByClubId(clubId) -> Member[]            │
│                                                           │
│  MemberApplicationService                                │
│    └─ getMemberApplicationsByClubId(clubId) -> App[]    │
│                                                           │
│  EventService                                            │
│    ├─ getEventByClubId(clubId) -> Event[]               │
│    └─ getEventCoHostByClubId(clubId) -> Event[]         │
│                                                           │
│  ProductService                                          │
│    └─ getProducts(clubId, options) -> Product[]         │
│                                                           │
│  RedeemService                                           │
│    └─ getClubRedeemOrders(clubId) -> Order[]            │
│                                                           │
│  WalletService                                           │
│    ├─ getClubWallet(clubId) -> Wallet                   │
│    └─ getClubToMemberTransactions() -> Transaction[]    │
│                                                           │
│  AttendanceService                                       │
│    └─ fetchClubAttendanceHistory(params) -> Record[]    │
│                                                           │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                   Network Layer                           │
│                  (axiosClient)                            │
└──────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────┐
│                   Backend API                             │
│              (Spring Boot Backend)                        │
└──────────────────────────────────────────────────────────┘
```

---

## State Updates Flow

```
User Action
    │
    ├─ Pull to Refresh
    │   └─> onRefresh()
    │       ├─ setRefreshing(true)
    │       ├─ loadData()
    │       └─ setRefreshing(false)
    │
    ├─ Navigate to Application
    │   └─> router.push('/club-leader/applications')
    │
    ├─ Navigate to Event
    │   └─> router.push(`/club-leader/events/${eventId}`)
    │
    └─ Component Mount
        └─> useEffect([clubId])
            └─> loadData()
                ├─ API Calls (parallel)
                ├─ Update State
                └─ Trigger useMemo recalculation
                    └─> Stats updated
                        └─> Components re-render
```

---

## Component Props Flow

```
club-leader.tsx
    │
    ├─> ClubInfoCard
    │     props: { club, isLoading }
    │
    ├─> StatsCard (Members)
    │     props: { title, mainValue, description, icon, 
    │              iconColor, borderColor, bgColor, 
    │              stats[], isLoading }
    │
    ├─> StatsCard (Applications)
    │     props: { ... similar to above ... }
    │
    ├─> ... (4 more StatsCards)
    │
    ├─> RecentApplicationsList
    │     props: { applications[], isLoading }
    │
    ├─> MembersByMajorChart
    │     props: { membersByMajor{}, totalMembers, isLoading }
    │
    └─> CoHostEventsList
          props: { events[], clubId, isLoading }
```

---

## Performance Optimizations

1. **Parallel Data Loading**
   - All API calls execute simultaneously with `Promise.all()`
   - Reduces total loading time significantly

2. **Memoized Calculations**
   - `useMemo` prevents unnecessary stat recalculations
   - Only recalculates when dependencies change

3. **Component Isolation**
   - Each component manages its own loading state
   - Independent rendering reduces re-render scope

4. **Lazy Evaluation**
   - Stats calculated only when needed
   - Filtered lists created on-demand

5. **Optimistic Updates**
   - Pull-to-refresh doesn't block UI
   - Loading indicators provide feedback

---

## Error Handling Strategy

```
API Call
    │
    ├─ Success
    │   └─> Update State
    │
    └─ Error
        └─> .catch(() => [])
            └─> Return empty array/null
                └─> Component shows empty state
                    (No crashes, graceful degradation)
```

---

## Mobile Responsiveness

1. **Vertical Stack Layout**
   - All cards stack vertically for easy scrolling
   - No horizontal scrolling required

2. **Touch-Friendly Spacing**
   - 16px (4 Tailwind units) between major sections
   - Adequate padding inside cards

3. **Safe Area Handling**
   - `SafeAreaView` respects device notches/rounded corners
   - Bottom navigation above gesture indicators

4. **Pull-to-Refresh**
   - Native iOS/Android pull gesture
   - Visual feedback during refresh

5. **Adaptive Typography**
   - Sizes adjust based on content importance
   - Truncation for long text with ellipsis

---

## Testing Scenarios

| Scenario | Expected Behavior |
|----------|------------------|
| **No Data** | Empty state messages |
| **Loading** | Skeleton screens |
| **API Error** | Graceful fallback to empty |
| **Large Dataset** | Proper pagination/truncation |
| **Pull-to-Refresh** | All data reloads |
| **Navigation** | Proper routing |
| **Low Bandwidth** | Loading indicators |
| **Offline** | Error messages (future: cached data) |

---

## Future Architecture Considerations

1. **React Query Integration**
   - Automatic caching
   - Background refetching
   - Optimistic updates

2. **Redux/Zustand State**
   - Global state management
   - Persistent cache

3. **Virtual Scrolling**
   - For very long lists
   - Better performance

4. **Code Splitting**
   - Lazy load components
   - Reduce initial bundle

5. **Analytics Integration**
   - Track user interactions
   - Performance monitoring

---

**Architecture Version**: 1.0.0  
**Last Updated**: November 7, 2025  
**Status**: Production Ready ✅

