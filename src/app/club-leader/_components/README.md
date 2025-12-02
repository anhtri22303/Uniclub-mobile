# Club Leader Dashboard Components

This folder contains reusable components for the Club Leader Dashboard, making the main dashboard page cleaner and more maintainable.

## Components

### 1. **ClubInfoCard.tsx**
Displays comprehensive club information including:
- Club name
- Major and policy
- Description
- Club leader name

**Props:**
- `club`: Club data object (nullable)
- `isLoading`: Loading state boolean

---

### 2. **StatsCard.tsx**
A reusable card component for displaying statistics with:
- Main value display
- Icon with custom color
- Multiple sub-statistics
- Custom border and background colors

**Props:**
- `title`: Card title
- `mainValue`: Main statistic value
- `description`: Description text
- `icon`: Ionicons icon name
- `iconColor`: Icon color (hex)
- `borderColor`: Border color className
- `bgColor`: Background color className
- `stats`: Array of sub-statistics with label, value, and color
- `isLoading`: Loading state boolean (optional)

**Usage Example:**
```typescript
<StatsCard
  title="Total Members"
  mainValue={50}
  description="Total Members"
  icon="people"
  iconColor="#8B5CF6"
  borderColor="border-purple-300"
  bgColor="bg-purple-50"
  stats={[
    { label: 'Leaders', value: 5, color: '#8B5CF6' },
    { label: 'Members', value: 45, color: '#22c55e' },
  ]}
/>
```

---

### 3. **RecentApplicationsList.tsx**
Displays a list of recent membership applications with:
- Applicant name and email
- Application status badge
- Creation date
- Link to manage all applications

**Props:**
- `applications`: Array of application objects
- `isLoading`: Loading state boolean

---

### 4. **MembersByMajorChart.tsx**
Visualizes member distribution across majors with:
- Progress bars showing percentage
- Member count badges
- Top 10 majors display

**Props:**
- `membersByMajor`: Object mapping major names to member counts
- `totalMembers`: Total number of members
- `isLoading`: Loading state boolean

---

### 5. **CoHostEventsList.tsx**
Displays active co-host event invitations with:
- Event details (name, date, time, location)
- Co-host status badge
- Host club information
- Check-in statistics
- Link to event details

**Props:**
- `events`: Array of co-host event objects
- `clubId`: Current club ID
- `isLoading`: Loading state boolean

---

## Component Structure

All components follow these principles:

1. **Loading States**: Each component handles its own loading state with skeleton/placeholder UI
2. **Error States**: Components gracefully handle missing/null data
3. **Responsive Design**: Mobile-optimized layouts using Tailwind classes
4. **Reusability**: Props-based configuration for maximum flexibility
5. **Type Safety**: TypeScript interfaces for all props

## Adding New Components

When adding new dashboard components:

1. Create the component file in this folder
2. Export it from `index.ts`
3. Import and use in `club-leader.tsx`
4. Follow the existing patterns for loading states and error handling
5. Document the component in this README

## Maintenance

- Keep components focused on a single responsibility
- Extract common logic into hooks if needed
- Update this README when adding/modifying components
- Test components with different data states (loading, error, empty, populated)

