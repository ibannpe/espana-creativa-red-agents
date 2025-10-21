# Context Session: Logout Redirect Fix (Issue #1)

## Issue Summary
**Title**: [Bug] Logout no redirige a /auth - Usuario permanece en dashboard
**Number**: #1
**Status**: In Progress

## Problem
When user clicks logout, the session is closed correctly in Supabase and a toast shows "Sesión cerrada", but the application doesn't redirect to `/auth`. User stays on dashboard creating an inconsistent UI state.

## Root Cause
During the auth system refactor (commit e8c12d4), the navigation code that existed in commit 28917dd was accidentally removed and not restored in commit cde8da2.

## Technical Solution
Add navigation logic to the `SIGNED_OUT` event handler in `src/hooks/useAuth.ts`:

1. Import `useNavigate` from react-router-dom
2. Initialize navigate hook
3. Call `navigate('/auth', { replace: true })` in SIGNED_OUT event
4. Update useEffect dependencies to include navigate

## Implementation Plan

### Phase 1: Setup ✅
- [x] Created worktree `.trees/feature-issue-1`
- [x] Created context session file

### Phase 2: Testing (TDD Approach) ✅
- [x] Read current useAuth.ts implementation
- [x] Create unit tests for logout redirect (8 comprehensive tests)
  - [x] Test navigate called with '/auth' and replace: true
  - [x] Test SIGNED_OUT event triggers redirect
  - [x] Test edge cases (already logged out, token expiration, cleanup)
- [x] Verify tests fail (red phase) - 5 tests failed as expected

### Phase 3: Implementation ✅
- [x] Add useNavigate import
- [x] Initialize navigate hook
- [x] Add redirect in SIGNED_OUT event handler with replace: true
- [x] Update useEffect dependencies to include navigate
- [x] Run tests to verify (green phase) - All 8 tests passing

### Phase 4: Integration ✅
- [x] Run full test suite - 188 tests passing
- [x] Verify build passes - Built successfully
- [ ] Create PR
- [ ] Monitor CI/CD validations

## Files Affected
- `src/hooks/useAuth.ts` - Main implementation
- `src/hooks/__tests__/useAuth.test.ts` - Unit tests (to be created)

## Definition of Done
- [x] Unit tests written with >80% coverage (8 comprehensive tests)
- [x] Tests passing (188 tests passing - no regressions)
- [x] Navigate called with correct parameters ('/auth', replace: true)
- [x] Edge cases handled (token expiration, already logged out, cleanup)
- [x] Build passing
- [ ] PR created and validations passing
- [ ] Manual testing checklist completed

## Implementation Summary

### Changes Made
1. **src/hooks/useAuth.ts:2** - Added `useNavigate` import from react-router-dom
2. **src/hooks/useAuth.ts:25** - Initialized `navigate` hook
3. **src/hooks/useAuth.ts:127** - Added navigation to /auth on SIGNED_OUT event with replace: true
4. **src/hooks/useAuth.ts:146** - Updated useEffect dependencies to include navigate
5. **src/hooks/useAuth.test.tsx** - Created comprehensive test file with 8 tests

### Test Results
- **Unit Tests**: 8/8 passing
- **Full Test Suite**: 188/188 passing
- **Build**: ✅ Success
- **Coverage**: Logout redirect functionality fully tested

### Why This Solution Works
- `replace: true` prevents user from going back to dashboard after logout
- SIGNED_OUT event covers both manual logout AND automatic token expiration
- useNavigate is safe within BrowserRouter context
- All edge cases tested and handled

## Notes
- Using `replace: true` prevents user from going back to dashboard
- SIGNED_OUT event is the right place - handles both manual logout and token expiration
- useNavigate is safe to use in useAuth since it's within BrowserRouter context
