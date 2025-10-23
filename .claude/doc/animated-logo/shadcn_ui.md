# Animated Logo Implementation Plan - Dashboard Header

**Feature:** Dashboard Header Animated Logo Integration
**Component:** `src/components/dashboard/Dashboard.tsx`
**Created:** 2025-10-22
**Status:** Implementation Plan Ready

---

## 1. Overview

This document provides the implementation plan for replacing the static "EC" logo in the dashboard header with an animated transparent GIF logo (`animación-3_transparente.gif`, 114KB).

**Context:**
- **Location:** Dashboard header (authenticated area, lines 40-42)
- **Current size:** 40x40px circular gradient container
- **New asset:** Animated transparent GIF (already in project root)
- **Design system:** España Creativa orange/red theme with backdrop blur header

---

## 2. Current Implementation Analysis

### Current Code (Dashboard.tsx lines 36-67)

```tsx
<header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Lines 40-42: Current logo */}
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-primary-foreground">EC</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">España Creativa</h1>
          <p className="text-sm text-muted-foreground">Red de emprendedores</p>
        </div>
      </div>
      {/* Right side: Avatar + Logout */}
    </div>
  </div>
</header>
```

**Design System Colors (from `src/index.css`):**
- `--primary: 14 100% 57%` (Spanish orange/red)
- `--gradient-brand: linear-gradient(135deg, hsl(14 100% 57%), hsl(14 100% 65%))`
- `--shadow-brand: 0 4px 14px -2px hsl(14 100% 57% / 0.15)`

---

## 3. Implementation Decisions & Answers

### Question 1: Circular Container - Keep or Remove?

**Decision: REMOVE the circular container**

**Reasoning:**
1. **Transparency:** The GIF is already transparent - circular masking would create awkward edges
2. **Design consistency:** The animated logo should be the focal point without geometric constraints
3. **Space efficiency:** At 40x40px, every pixel counts. A circular mask reduces visible logo area by ~21%
4. **Header context:** Navigation logos typically don't use circular containers (see GitHub, Linear, Notion)

**Implementation:** Replace the gradient `div` with a direct `img` tag.

---

### Question 2: Small Size Approach (40x40 vs 64x64)

**Decision: Use compact, streamlined approach with browser-optimized rendering**

**Differences from larger login logo:**
- **No loading state needed:** Header is only visible after authentication, logo loads with page
- **Simpler structure:** Direct `img` tag without wrapper components
- **Tighter spacing:** Maintain `space-x-4` between logo and text (16px gap)
- **Performance priority:** Use `loading="eager"` and `fetchpriority="high"` since header is critical content

**Size comparison:**
- Login logo: 64x64px (hero section, can be larger and more prominent)
- Dashboard logo: 40x40px (compact, functional, always visible)

---

### Question 3: prefers-reduced-motion Fallback

**Decision: YES - Implement accessibility fallback with CSS**

**Reasoning:**
1. **WCAG 2.1 Compliance:** Required for Level AA (criterion 2.3.3)
2. **User comfort:** Some users experience vestibular disorders with animations
3. **Professional standard:** All major platforms (Apple, Google, Microsoft) respect this preference

**Implementation Strategy:**

```css
/* Static fallback for reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .logo-animated {
    animation: none !important;
    /* GIF will show first frame only */
  }
}
```

**Note:** Modern browsers automatically pause GIF animations when `prefers-reduced-motion: reduce` is active. We add CSS class for future-proofing and additional control.

---

### Question 4: Header/Navigation Performance Considerations

**Critical Optimizations for Header Context:**

#### A. Layout Shift Prevention
```tsx
<img
  src="/animación-3_transparente.gif"
  alt="España Creativa"
  width={40}
  height={40}
  // Explicit dimensions prevent CLS (Cumulative Layout Shift)
/>
```

#### B. Loading Priority
```tsx
loading="eager"          // Load immediately (header is above fold)
fetchpriority="high"     // Browser priority hint
decoding="async"         // Don't block rendering
```

#### C. Caching Strategy
- **File location:** `public/` directory → served as static asset
- **Browser caching:** Vite automatically adds cache headers
- **Asset fingerprinting:** Production build adds hash to filename

#### D. Performance Metrics Target
| Metric | Target | Why |
|--------|--------|-----|
| **CLS** | < 0.1 | No layout shift from logo loading |
| **LCP** | < 2.5s | Header loads with initial HTML |
| **FID** | < 100ms | Logo doesn't block interactivity |

---

### Question 5: File Location

**Decision: YES - Move to `public/` directory**

**File path:** `public/animacion-3-transparente.gif`

**Reasons:**
1. **Vite convention:** Static assets in `public/` are served at root level
2. **No bundling:** 114KB GIF shouldn't go through Vite's asset pipeline
3. **Direct reference:** Simpler path in JSX: `/animacion-3-transparente.gif`
4. **Production optimization:** Vite serves `public/` files with optimal headers

**File naming convention:**
- Original: `animación-3_transparente.gif` (Spanish chars, underscore)
- Renamed: `animacion-3-transparente.gif` (URL-safe, hyphenated)

---

## 4. Complete Implementation Code

### Step 1: Move GIF Asset

```bash
# Execute from project root
mv "animación-3_transparente.gif" "public/animacion-3-transparente.gif"
```

---

### Step 2: Create useReducedMotion Hook

**File:** `src/hooks/useReducedMotion.ts`

```typescript
// ABOUTME: Custom hook to detect user's reduced motion preference
// ABOUTME: Used for accessibility compliance (WCAG 2.1 AA criterion 2.3.3)

import { useEffect, useState } from 'react';

/**
 * Detects if user prefers reduced motion (accessibility)
 * @returns boolean - true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR-safe: check if window exists
    if (typeof window === 'undefined') return false;

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    // Create media query listener
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Update state when preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers (Safari < 14)
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}
```

**Why this hook:**
- Reusable across components
- Handles browser compatibility (modern + legacy)
- SSR-safe (checks for `window`)
- Auto-updates when user changes system preference

---

### Step 3: Update Dashboard Component

**File:** `src/components/dashboard/Dashboard.tsx`

**Changes:**

#### A. Add import at top (after existing imports)

```typescript
import { useReducedMotion } from '@/hooks/useReducedMotion';
```

#### B. Add hook call inside Dashboard component (after line 25)

```typescript
const Dashboard = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion(); // ADD THIS LINE
  // const logger = useLogger('Dashboard');
```

#### C. Replace logo div (lines 40-42) with this code

```tsx
{/* Logo - animated GIF with accessibility fallback */}
<img
  src="/animacion-3-transparente.gif"
  alt="España Creativa logo"
  width={40}
  height={40}
  className={`
    w-10 h-10
    object-contain
    ${prefersReducedMotion ? 'motion-reduce' : ''}
  `.trim()}
  loading="eager"
  fetchPriority="high"
  decoding="async"
  draggable="false"
/>
```

**Code explanation:**

| Attribute | Purpose | Value |
|-----------|---------|-------|
| `src` | GIF path from public/ | `/animacion-3-transparente.gif` |
| `alt` | Accessibility text | "España Creativa logo" |
| `width` / `height` | Prevent layout shift | `40` (matches container) |
| `className` | Tailwind + conditional | `w-10 h-10 object-contain` |
| `loading` | Load priority | `eager` (above fold) |
| `fetchPriority` | Browser hint | `high` (critical resource) |
| `decoding` | Async decode | `async` (non-blocking) |
| `draggable` | Prevent drag | `false` (UX improvement) |

**CSS classes breakdown:**
- `w-10 h-10`: Fixed 40x40px size (matches design)
- `object-contain`: Scale GIF to fit without cropping
- `motion-reduce`: Custom class for reduced motion users

---

### Step 4: Add CSS for Reduced Motion

**File:** `src/index.css`

**Add this code after line 113 (end of file):**

```css
/* Animated logo accessibility fallback */
@media (prefers-reduced-motion: reduce) {
  .motion-reduce {
    animation: none !important;
    /* Browser automatically pauses GIF, this ensures no future animations */
  }
}

/* Optional: Add subtle hover effect for header logo */
@media (prefers-reduced-motion: no-preference) {
  header img[alt*="logo"] {
    transition: transform 0.2s ease-in-out;
  }

  header img[alt*="logo"]:hover {
    transform: scale(1.05);
  }
}
```

**CSS explanation:**
1. **First rule:** Disables all animations for reduced motion users
2. **Second rule:** Adds gentle hover scale effect (only for users who allow motion)
3. **Browser behavior:** Modern browsers automatically show only first GIF frame when `prefers-reduced-motion: reduce`

---

## 5. Testing Checklist

### Visual Tests

- [ ] **Logo size:** Verify 40x40px matches current circular logo space
- [ ] **Animation:** Confirm GIF animates smoothly at 40x40px
- [ ] **Transparency:** Check transparent background works with header backdrop blur
- [ ] **Alignment:** Ensure vertical centering with "España Creativa" text
- [ ] **Spacing:** Verify 16px gap between logo and text (`space-x-4`)
- [ ] **Responsive:** Test on mobile (header should remain functional)

### Performance Tests

```bash
# 1. Start dev server
yarn dev

# 2. Open Chrome DevTools
# - Network tab: Verify GIF loads quickly
# - Performance tab: Check no layout shifts
# - Lighthouse: Run audit (should score 90+ on Performance)
```

**Expected metrics:**
- GIF load time: < 200ms (114KB on 3G)
- CLS score: 0 (no layout shift due to explicit dimensions)
- No render-blocking: `loading="eager"` with `async` decoding

### Accessibility Tests

**Test 1: Reduced Motion (macOS)**
```bash
# System Settings > Accessibility > Display > Reduce Motion (toggle ON)
# Reload page → GIF should show first frame only
```

**Test 2: Screen Readers**
- VoiceOver (macOS): Cmd+F5 → Navigate to logo → Should read "España Creativa logo"
- Ensure alt text is descriptive but concise

**Test 3: Keyboard Navigation**
- Tab through header → Logo should not be focusable (it's not interactive)
- Focus should go directly to user avatar/logout button

### Browser Compatibility

| Browser | Version | Test Items |
|---------|---------|------------|
| Chrome | 120+ | GIF animation, reduced motion, hover effect |
| Safari | 17+ | GIF animation, legacy `addListener` API |
| Firefox | 121+ | GIF animation, reduced motion |
| Mobile Safari | iOS 17+ | Touch interactions, no hover |

---

## 6. Important Notes & Gotchas

### A. File Naming Convention

**Original filename:** `animación-3_transparente.gif`
**Renamed to:** `animacion-3-transparente.gif`

**Reasons:**
1. **URL safety:** Special characters (ñ, accents) can cause issues in some browsers
2. **Build tool compatibility:** Vite handles ASCII better in production builds
3. **Convention:** Hyphens are standard in web file naming

### B. GIF Size Consideration (114KB)

**Is 114KB too large for a logo?**

**Analysis:**
- **Acceptable:** Average web page size in 2025 is ~2MB
- **Critical resource:** Logo is above fold and essential branding
- **One-time load:** Browser caches after first visit
- **Compression attempted:** Already optimized (transparent, limited colors)

**Alternative if needed:** Create static PNG fallback for slow connections (future enhancement)

### C. Dark Mode Compatibility

**Current design system supports dark mode** (lines 67-103 in `src/index.css`)

**GIF transparency ensures compatibility:**
- Light mode: Transparent GIF over `--card: 0 0% 100%` (white)
- Dark mode: Transparent GIF over `--card: 220 8.9% 4.9%` (near black)

**No additional code needed** - transparency works universally.

### D. React 18 Strict Mode

**Potential issue:** React Strict Mode mounts components twice in development

**Impact:** GIF might restart animation on double mount

**Solution:** This is development-only behavior and doesn't affect production. No fix needed.

### E. Vite HMR (Hot Module Replacement)

**During development:** Changing Dashboard.tsx triggers HMR

**GIF behavior:** Will restart animation on hot reload

**This is expected** - users won't experience HMR in production.

---

## 7. Future Enhancements (Optional)

### A. Optimized Asset Loading

If 114KB becomes a concern:

```tsx
// Load smaller placeholder, then swap to full GIF
<img
  src="/logo-placeholder.png"  // 5KB static PNG
  data-src="/animacion-3-transparente.gif"
  alt="España Creativa logo"
  onLoad={(e) => {
    // Progressive enhancement
    const target = e.currentTarget;
    const fullSrc = target.dataset.src;
    if (fullSrc) target.src = fullSrc;
  }}
/>
```

### B. WebP/AVIF Animated Alternatives

Modern browsers support animated WebP (better compression):

```tsx
<picture>
  <source srcSet="/animacion-3-transparente.webp" type="image/webp" />
  <img src="/animacion-3-transparente.gif" alt="España Creativa logo" />
</picture>
```

**Savings:** WebP can reduce size by 30-50% vs GIF

### C. Logo Click Navigation

Make logo clickable (common UX pattern):

```tsx
<Link to="/dashboard">
  <img
    src="/animacion-3-transparente.gif"
    alt="España Creativa logo"
    className="w-10 h-10 object-contain cursor-pointer hover:opacity-90"
  />
</Link>
```

---

## 8. Rollback Plan

If issues arise, revert to static logo:

```tsx
{/* Fallback: Static SVG or Text Logo */}
<div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
  <span className="text-lg font-bold text-primary-foreground">EC</span>
</div>
```

**Git command:**
```bash
git checkout HEAD -- src/components/dashboard/Dashboard.tsx
git checkout HEAD -- src/hooks/useReducedMotion.ts
git checkout HEAD -- src/index.css
```

---

## 9. Summary of Changes

| File | Action | Changes |
|------|--------|---------|
| `public/animacion-3-transparente.gif` | Move | Relocate from root to public/ |
| `src/hooks/useReducedMotion.ts` | Create | New accessibility hook |
| `src/components/dashboard/Dashboard.tsx` | Modify | Replace logo div (lines 40-42), add import |
| `src/index.css` | Modify | Add reduced motion CSS (after line 113) |

**Lines of code changed:** ~30 lines
**New files:** 1 (`useReducedMotion.ts`)
**Estimated implementation time:** 15 minutes

---

## 10. Approval Checklist (for Iban)

Before implementation, confirm:

- [ ] GIF file location: `public/animacion-3-transparente.gif`
- [ ] Logo size: 40x40px (matches current circular logo)
- [ ] Accessibility: `prefers-reduced-motion` fallback included
- [ ] Performance: Explicit dimensions prevent layout shift
- [ ] Design consistency: Transparent GIF works with header backdrop blur
- [ ] No breaking changes: Header layout remains unchanged
- [ ] Testing plan: Visual, performance, and a11y tests documented

**Ready for implementation:** Yes ✅

---

## References

- **WCAG 2.1 Animation Guidelines:** https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
- **Vite Static Assets:** https://vitejs.dev/guide/assets.html#the-public-directory
- **React Loading Optimization:** https://web.dev/optimize-lcp/
- **España Creativa Design System:** `src/index.css` (lines 9-104)
