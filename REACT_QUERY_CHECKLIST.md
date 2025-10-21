# ✅ React Query - Implementation Checklist

## 📦 Phase 1: Setup (COMPLETED ✅)

- [x] Install `@tanstack/react-query` package
- [x] Create `QueryProvider` wrapper component
- [x] Wrap app with QueryProvider in `_layout.tsx`
- [x] Create `useQueryHooks.ts` with all hooks
- [x] Create example implementation
- [x] Write comprehensive documentation

**Status:** ✅ **COMPLETE** - Infrastructure ready to use!

---

## 🔄 Phase 2: Migration (IN PROGRESS ⏳)

### **Page 1: admin/users.tsx** (Priority: HIGH 🔴)
- [ ] Backup original file
- [ ] Import `useUsers`, `useUpdateUser`, `useDeleteUser`
- [ ] Replace `useState` with `useUsers()` hook
- [ ] Remove manual `fetchUsers()` function
- [ ] Remove `useEffect` for initial fetch
- [ ] Add `useMemo` for filtering/sorting
- [ ] Replace update logic with mutation
- [ ] Replace delete logic with mutation
- [ ] Update pull-to-refresh: `onRefresh={refetch}`
- [ ] Update loading states: use `isLoading`, `isRefetching`
- [ ] Test: Navigation caching
- [ ] Test: Mutation auto-refresh
- [ ] Test: Pull-to-refresh

**Time Estimate:** 20-30 minutes

---

### **Page 2: admin/clubs.tsx** (Priority: MEDIUM 🟡)
- [ ] Backup original file
- [ ] Import `useClubs` hook
- [ ] Replace state management
- [ ] Add filtering với useMemo
- [ ] Update CRUD operations
- [ ] Test caching behavior

**Time Estimate:** 20 minutes

---

### **Page 3: admin/events.tsx** (Priority: MEDIUM 🟡)
- [ ] Backup original file
- [ ] Import `useEvents` hook
- [ ] Replace state management
- [ ] Add filtering với useMemo
- [ ] Update CRUD operations
- [ ] Test caching behavior

**Time Estimate:** 20 minutes

---

### **Page 4: uni-staff/policies.tsx** (Priority: LOW 🟢)
- [ ] Already uses Toast ✅
- [ ] Import `usePolicies` hook
- [ ] Replace manual fetch
- [ ] Use mutation for create/update/delete
- [ ] Test auto-refetch

**Time Estimate:** 15 minutes

---

### **Page 5: uni-staff/points.tsx** (Priority: LOW 🟢)
- [ ] Import `useClubs` for clubs list
- [ ] Replace club fetching logic
- [ ] Keep existing distribution logic
- [ ] Test club selection with cached data

**Time Estimate:** 10 minutes

---

### **Page 6: student/clubs.tsx** (Priority: HIGH 🔴)
- [ ] Import `useClubs` hook
- [ ] Replace state management
- [ ] Add filtering với useMemo
- [ ] Update pull-to-refresh
- [ ] Test caching when navigating

**Time Estimate:** 15 minutes

---

### **Page 7: student/events.tsx** (Priority: HIGH 🔴)
- [ ] Import `useEvents` hook
- [ ] Replace state management
- [ ] Add filtering với useMemo
- [ ] Test event list caching

**Time Estimate:** 15 minutes

---

### **Page 8: profile.tsx** (Priority: MEDIUM 🟡)
- [ ] Import `useProfile` hook
- [ ] Replace profile fetching
- [ ] Use mutation for profile update
- [ ] Test profile cache

**Time Estimate:** 15 minutes

---

### **Page 9: club-leader/members.tsx** (Priority: MEDIUM 🟡)
- [ ] Create `useClubMembers(clubId)` hook first
- [ ] Import and use hook
- [ ] Replace member fetching
- [ ] Test conditional query

**Time Estimate:** 20 minutes (includes hook creation)

---

### **Page 10: club-leader/events.tsx** (Priority: LOW 🟢)
- [ ] Import `useEvents` or create `useClubEvents(clubId)`
- [ ] Replace event fetching
- [ ] Add filtering by club
- [ ] Test caching

**Time Estimate:** 15 minutes

---

## 🧪 Phase 3: Testing & Validation (TODO ⏳)

### **Cache Behavior Testing**
- [ ] Navigate to page → verify API called (first time)
- [ ] Navigate away and back → verify instant load (from cache)
- [ ] Wait 5 minutes → verify background refetch
- [ ] Check network tab → verify reduced API calls

### **Mutation Testing**
- [ ] Create record → verify auto-refetch
- [ ] Update record → verify list updates automatically
- [ ] Delete record → verify list updates automatically
- [ ] Check: No manual refetch needed

### **Pull-to-Refresh Testing**
- [ ] Pull down on list
- [ ] Verify `isRefetching` indicator shows
- [ ] Verify data updates after API returns
- [ ] Check network: Correct endpoint called

### **Error Handling Testing**
- [ ] Simulate network error
- [ ] Verify error state shows
- [ ] Verify retry mechanism works
- [ ] Test recovery after error

---

## 🎯 Phase 4: Optimization (TODO ⏳)

### **Performance Tuning**
- [ ] Review `staleTime` for each hook
- [ ] Adjust cache times based on data freshness needs
- [ ] Add prefetch hooks where beneficial
- [ ] Monitor API call reduction

### **Code Quality**
- [ ] Remove all old fetch functions
- [ ] Remove all manual loading states
- [ ] Consolidate duplicate query logic
- [ ] Add TypeScript types if missing

### **Documentation**
- [ ] Update inline comments
- [ ] Document custom hooks
- [ ] Add JSDoc to query functions
- [ ] Update README if needed

---

## 📊 Success Metrics

Track these after migration:

### **Performance Metrics**
- [ ] Measure API calls before/after (expect ~70% reduction)
- [ ] Measure page load time (expect 2-3x faster on subsequent loads)
- [ ] Check bundle size impact (minimal increase expected)

### **Code Quality Metrics**
- [ ] Lines of code reduced (expect ~40-50% reduction)
- [ ] Number of useEffect removed
- [ ] Number of useState removed
- [ ] TypeScript errors resolved

### **User Experience Metrics**
- [ ] Navigation speed (subjective: should feel instant)
- [ ] Pull-to-refresh smoothness
- [ ] Loading indicator behavior
- [ ] Error recovery experience

---

## 🐛 Common Issues Checklist

After migration, verify these are NOT happening:

- [ ] ❌ Data showing as undefined → Use default values
- [ ] ❌ UI not updating after mutation → Check invalidateQueries
- [ ] ❌ Too many API calls → Check staleTime settings
- [ ] ❌ Stale data showing → Check cache invalidation logic
- [ ] ❌ Memory leaks → Queries auto-cleanup, should be fine
- [ ] ❌ Network errors → Add proper error boundaries

---

## 🎓 Learning Checkpoints

Verify understanding:

- [ ] Can explain what query keys are
- [ ] Understand staleTime vs gcTime
- [ ] Know when to use queries vs mutations
- [ ] Can implement useMemo for optimization
- [ ] Understand invalidateQueries pattern
- [ ] Can debug using React Query DevTools (optional)

---

## 📈 Progress Tracking

### **Overall Progress:** 10% Complete (1/10 pages)

**Completed:**
- ✅ Infrastructure setup

**In Progress:**
- ⏳ None

**Not Started:**
- ❌ admin/users.tsx
- ❌ admin/clubs.tsx
- ❌ admin/events.tsx
- ❌ uni-staff/policies.tsx
- ❌ uni-staff/points.tsx
- ❌ student/clubs.tsx
- ❌ student/events.tsx
- ❌ profile.tsx
- ❌ club-leader/members.tsx
- ❌ club-leader/events.tsx

---

## 🚀 Quick Start Today

**First migration (admin/users.tsx):**

1. ✅ Read `REACT_QUERY_QUICK_START.md` (5 mins)
2. ✅ Open `admin/users.example.tsx` for reference
3. ✅ Backup current `admin/users.tsx`
4. ⏳ Start migration (follow checklist above)
5. ⏳ Test thoroughly
6. ⏳ Mark as complete ✅

**Time needed:** 30-45 minutes for first page (including learning)  
**Subsequent pages:** 15-20 minutes each

---

## 📞 Resources

- **Quick Start:** `REACT_QUERY_QUICK_START.md`
- **Migration Guide:** `REACT_QUERY_MIGRATION_GUIDE.md`
- **Example Code:** `src/app/admin/users.example.tsx`
- **Hooks Reference:** `src/hooks/useQueryHooks.ts`
- **This Checklist:** `REACT_QUERY_CHECKLIST.md`

---

**Last Updated:** Now  
**Status:** Infrastructure Complete ✅ | Ready for Migration ⏳
