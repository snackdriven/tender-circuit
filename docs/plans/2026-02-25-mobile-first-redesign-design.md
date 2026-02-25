# Mobile-First Frontend Redesign

**Date:** 2026-02-25
**Direction:** "Solid Terminal" — dark layered surfaces, monospace accents, mobile-native interaction patterns
**Constraints:** Zero dependencies, single file (index.html), Catppuccin Mocha palette

---

## Layout & Structure

**Body background:** `--ctp-crust` (#11111b) — deepest layer. Everything floats on top.

**Three-tier depth system (no transparency/blur):**
- `--ctp-crust` — body background
- `--ctp-mantle` — header bar, input bar (structural chrome)
- `--ctp-surface0` — todo cards, dialogs (elevated content)
- `--ctp-surface1`/`--ctp-surface2` — interactive states (hover, active)

**Vertical stacking (mobile, top to bottom):**
1. Sticky header (title + task count)
2. Compact toolbar (filters + sort + category toggle)
3. Scrollable todo list (fills remaining viewport)
4. Fixed bottom input bar (above safe area)

**Desktop (>=640px):**
- App centers at max-width 520px
- Header is not sticky (short scroll distance)
- Input relocates to top of app (traditional position, inline)
- Category chips always visible below toolbar
- Todo actions show on hover instead of three-dot menu

---

## Input Bar

### Mobile (bottom-fixed)
- **Collapsed:** Single row with borderless text input (`--ctp-surface0` bg) + 44px round mauve "+" button
- **Expanded (on focus):** Second row slides up (150ms ease-out) with category dropdown + date picker as compact pills
- **Dismiss:** Enter/"+"/tap-outside/Escape collapses back
- Background: `--ctp-mantle`, top border 1px `--ctp-surface0`
- Positioned above `env(safe-area-inset-bottom)`

### Desktop (static top)
- Traditional inline input at top of app
- Options row (category + date) always visible below input
- Standard "Add" text button instead of "+" icon

---

## Todo Items

**Card style:**
- Background: `--ctp-surface0`
- Border-radius: 12px
- Padding: 12px vertical, 14px horizontal
- No border, depth from color contrast against crust body
- Gap between items: 8px

**Content:**
- Left: 22px checkbox with 44px hit area (green fill + checkmark on complete)
- Center: todo text at 1rem, meta row below at 0.7rem DM Mono (category badge + countdown)
- Right: action area

**Actions:**
- **Mobile:** Three-dot "..." button. Tapping toggles inline Edit/Delete strip. Tap again or elsewhere to dismiss.
- **Desktop:** Edit/Delete buttons appear on hover. Three-dot menu hidden.
- Same HTML for both; CSS controls visibility via viewport width and hover.

**Completed state:**
- Opacity 0.5
- Line-through text
- Scale 0.98 (subtle visual "deflation")

**New item animation:** Slide in from below with fade (matches bottom-input origin on mobile).

---

## Toolbar

Single compact row replacing the current three separate rows.

**Three zones, left to right:**
1. **Filter tabs** (All / Active / Done) — segmented control pills, `--ctp-mantle` bg, active tab `--ctp-surface1`
2. **Sort** — icon-only button (up/down arrows) on mobile, text label on desktop. Opens native `<select>`.
3. **Category toggle** — tag icon button. Tapping slides category chip strip in/out below the toolbar (150ms).

**Category chip strip:**
- Horizontally scrollable
- Contains All + each category as a pill chip
- Manage-categories gear icon at the end
- On desktop: always visible (no toggle needed)

---

## Header

**Mobile:**
- Sticky top, `--ctp-mantle` background
- 1px `--ctp-surface0` bottom border
- Left: "Todo" in Inter 700, `--ctp-mauve`, clamp(1.4rem, 1.2rem + 0.8vw, 1.75rem)
- Right: task count pill in DM Mono
- Height: ~52px

**Desktop:**
- Not sticky, part of page flow
- Same visual treatment

---

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| App title | Inter | clamp(1.4rem-1.75rem) | 700 |
| Todo text | Inter | 1rem | 400 |
| Input text | Inter | 0.95rem | 400 |
| Meta (badges, countdown) | DM Mono | 0.7rem | 500 |
| Filter/sort labels | Inter | 0.8rem | 500 |
| Task count | DM Mono | 0.8rem | 500 |

---

## Spacing

- Body horizontal padding (mobile): 1.25rem
- Gap between toolbar and list: 1.25rem
- Gap between todo items: 0.5rem
- App max-width (desktop): 520px

---

## Empty State

- Larger checkbox icon
- Subtitle in `--ctp-overlay1`
- Subtle pulsing dot on the input bar to hint "start here"

---

## Dialogs

Same visual treatment as current (surface0 background, surface2 border, dialog-in animation). No changes needed — they work fine.

---

## Animations

- New todo: slide up + fade in (250ms ease-out)
- Input expand/collapse: 150ms ease-out
- Category strip show/hide: 150ms ease-out
- Checkbox completion: brief scale pulse (150ms)
- Toast: same slide-up pattern as current
- All gated by `prefers-reduced-motion: reduce`

---

## Accessibility

- All current ARIA attributes preserved
- 44px touch targets maintained
- `prefers-reduced-motion` and `prefers-contrast: more` overrides kept
- Focus-visible outlines unchanged
- Semantic HTML unchanged
- Three-dot menu is keyboard-accessible (Enter/Space to toggle, Escape to dismiss)

---

## What Doesn't Change

- JavaScript architecture (same functions, same state management, same event delegation)
- localStorage persistence
- Undo system
- Category management dialog
- Delete confirmation dialog
- Security (escapeHtml/escapeAttr)
- Zero-dependency philosophy
