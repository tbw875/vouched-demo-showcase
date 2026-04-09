# Engineering Feedback: Epic MyChart & IAL-2 Workflows

**Reviewer:** Engineering Manager
**Date:** 2026-04-08
**Scope:** Recent commits to the Epic MyChart IDV and IAL-2 workflows

---

## Critical

### 1. Vouched SDK escapes the phone card layout during verification

**File:** `src/app/epic/verification/page.tsx`

The SDK wrapper uses `position: fixed; width: 100%; height: 100%; z-index: 10`, which breaks the element out of the `rounded-3xl max-w-[430px]` phone card defined in `src/app/epic/layout.tsx`. The most important visual moment in the demo — the actual ID capture — loses the mobile simulation entirely.

**Action:** Scope the SDK container to fill the card using `position: absolute` within a `position: relative` parent, rather than `fixed`. The card itself is already the visual boundary — keep the SDK inside it.

---

## Integrity Issues (Data & Logic)

### 2. `nowSec` recalculates on every re-render, causing token timestamps to drift

**File:** `src/app/epic/complete/page.tsx`, line 80

```ts
// Current — recalculates on every render
const nowSec = Math.floor(Date.now() / 1000);
```

The component re-renders during phase transitions (`'1' → '2a' → '2b'`), causing `iat` and `exp` in the token claims table to change mid-demo.

**Action:** Wrap in `useState` so it's computed once at mount:

```ts
const [nowSec] = useState(() => Math.floor(Date.now() / 1000));
```

---

### 3. `EPT ID`, `WPR ID`, and `Match Result: None` look broken in the results table

**File:** `src/app/epic/complete/page.tsx`, lines 212–215

These fields render as empty strings or `"None"`. A prospect will read this as an incomplete or failed integration, not a demo placeholder.

**Action:** Either populate these with representative mock values that reflect what Epic returns in a real integration, or add a short italicized note (e.g., `"Populated by Epic after account match"`) so the intent is clear to an observer.

---

### 4. Stale localStorage data between demo runs

**Files:** `src/app/epic/form/page.tsx`, `src/app/epic/complete/page.tsx`

`epicFormData` and `epicJobData` are never cleared when a new demo session starts. If the demo is run twice in the same browser session, the previous run's job data can surface on the complete page — wrong name, stale job ID, or prior token claims.

**Action:** Clear both keys at the top of the `form/page.tsx` mount effect:

```ts
useEffect(() => {
  localStorage.removeItem('epicFormData');
  localStorage.removeItem('epicJobData');
}, []);
```

---

## Design & Polish

### 5. URL bar disappears during the verification step

**File:** `src/app/epic/verification/page.tsx`

The simulated browser chrome is present on every other page:

| Page | URL bar |
|------|---------|
| `form` | `epic.stage.vouched.id` ✓ |
| `verify-phone` | `epic.stage.vouched.id` ✓ |
| `verification` | **missing** ✗ |
| `complete` (phase 1) | `epic.stage.vouched.id` ✓ |
| `complete` (phase 2) | `vendorservices.epic.com` ✓ |

The URL bar disappears exactly when the most interesting step happens. The phone frame illusion breaks at a bad moment.

**Action:** Render the simulated URL bar above the Vouched SDK container on the verification page. The SDK should fill the remaining space below it.

---

### 6. Language selector is positioned against the wrong ancestor

**File:** `src/app/epic/complete/page.tsx`, line 147

```tsx
<div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
  <div className="absolute top-10 right-5 ...">Language: English ▾</div>
```

The parent div is not `relative`, so `absolute` positions against the nearest positioned ancestor up the tree, which may not land where intended — especially on different screen sizes.

**Action:** Add `relative` to the parent container so the language selector anchors correctly within the phase-1 screen.

---

### 7. OTP countdown is 28 seconds — non-standard

**File:** `src/app/epic/verify-phone/page.tsx`, line 18

Standard SMS OTP timers are 30 or 60 seconds. 28 is an odd number that can invite questions from prospects during a demo walkthrough.

**Action:** Change the initial `countdown` value from `28` to `30`.

---

### 8. No phone number length validation

**File:** `src/app/epic/form/page.tsx`

The phone field strips non-digits but never validates that the result is 10 digits. A user can enter `123` and advance through the flow, eventually producing malformed data in the token claims.

**Action:** Add a length check in the `validate()` function:

```ts
if (form.phone.replace(/\D/g, '').length !== 10) {
  newErrors.phone = 'Enter a valid 10-digit US number';
}
```

---

## IAL-2 Specific

### 9. `console.log` statements left in the crosscheck page

**File:** `src/app/ial2/crosscheck-page/page.tsx`, lines 105 and 122

```ts
console.log('IAL2: Starting CrossCheck verification...');
console.log('IAL2: CrossCheck verification completed:', result);
```

These print full API payloads to the browser console. Anyone with DevTools open during a demo — including a prospect's technical team — will see internal implementation details and full response bodies.

**Action:** Remove both `console.log` calls.

---

### 10. Phone masking format is inconsistent between IAL-2 pages

**Files:** `src/app/ial2/idv-page/page.tsx`, `src/app/ial2/crosscheck-page/page.tsx`

| Page | Format shown |
|------|-------------|
| `idv-page` | `(***) ***-1234` |
| `crosscheck-page` request panel | `***1234` |

**Action:** Standardize to one format across both pages. The `idv-page` format `(***) ***-1234` is more readable and should be the standard.

---

*10 items total — 1 critical, 3 integrity, 6 polish/IAL-2*
