# Warm Ink Visual Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the "Warm Ink" visual refresh to the planner app — cool-tone accents, editorial typography, generous card spacing, rounder corners, bottom-border tab indicators.

**Architecture:** CSS-only changes in `styles.css`. No HTML or JS modifications. All changes within existing `@layer` structure. Design doc at `docs/plans/2026-02-25-mobile-first-redesign-design.md`.

**Tech Stack:** Vanilla CSS (layers, nesting, logical properties, color-mix, clamp)

---

### Task 1: Token Updates

**Files:**
- Modify: `styles.css:56-76` (tokens layer)

**Step 1: Update radius-lg and add text-section token**

In `@layer tokens`, change `--radius-lg` from `16px` to `20px`, and add `--text-section` after the type scale:

```css
    /* Radii */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 20px;
    --radius-full: 999px;
```

And after line 73 (`--text-xl`), add:

```css
    --text-section: 0.75rem;                          /* section headings — DM Mono uppercase */
```

**Step 2: Verify in browser**

Open in browser at 1920x1080. Globally, all elements using `--radius-lg` should now be rounder (cards, forms, tab nav, week strip, dialogs, toasts). Visually check a few cards and the dialog.

**Step 3: Commit**

```bash
git add styles.css
git commit -m "feat: update radius-lg to 20px, add text-section token"
```

---

### Task 2: Spacing — Cards & List

**Files:**
- Modify: `styles.css:100-110` (app shell), `styles.css:718-739` (item list), `styles.css:752-779` (item card)

**Step 1: Update app section gap**

Change `main.app` gap from `--space-2xl` to `--space-xl`:

```css
  main.app {
    inline-size: 100%;
    max-inline-size: 32rem;
    padding: var(--space-2xl) var(--space-md) env(safe-area-inset-bottom, var(--space-2xl));
    overscroll-behavior-y: contain;
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }
```

**Step 2: Update item list gap**

Change `.item-list` gap from `--space-md` to `--space-sm`:

```css
  .item-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
```

**Step 3: Update item card padding**

Change `.item-card` padding from `var(--space-md) var(--space-lg)` to `var(--space-lg) var(--space-xl)`:

```css
  .item-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
    padding: var(--space-lg) var(--space-xl);
    background: var(--ctp-surface0);
    border-radius: var(--radius-lg);
```

**Step 4: Verify in browser**

Cards should feel more spacious internally. The list should be tighter between items. Overall vertical rhythm should feel better.

**Step 5: Commit**

```bash
git add styles.css
git commit -m "feat: generous card padding, tighter list gaps, reduced app gap"
```

---

### Task 3: Item Card Accent Colors

**Files:**
- Modify: `styles.css:781-796` (event-card, task-card, overdue, waiting)

**Step 1: Update card accent stripes and remove overdue bg tint**

Replace the event-card, task-card, overdue, and waiting rules:

```css
  .event-card {
    box-shadow: inset 3px 0 0 0 var(--ctp-sapphire);
  }

  .task-card {
    box-shadow: inset 3px 0 0 0 var(--ctp-overlay1);
  }

  .task-card.overdue {
    box-shadow: inset 3px 0 0 0 var(--ctp-red);
  }

  .task-card.waiting {
    opacity: 0.65;
    box-shadow: inset 3px 0 0 0 var(--ctp-yellow);
  }
```

**Step 2: Update completed card state**

In `.item-card` (line ~752), update the `&.completed` block:

```css
    &.completed {
      opacity: 0.5;
      transform: scale(0.99);

      & .item-title {
        text-decoration: line-through;
        color: var(--ctp-overlay0);
      }
    }
```

**Step 3: Update hover state**

In `.item-card`, change the `:active` pseudo-class background from `color-mix` to `--ctp-surface1`:

```css
    &:active {
      background: var(--ctp-surface1);
      transform: scale(0.995);
    }
```

**Step 4: Verify in browser**

- Events should have a sapphire (blue) left stripe
- Regular tasks should have a slightly brighter gray stripe (overlay1 vs overlay0)
- Overdue tasks should have red stripe but NO red background tint
- Waiting tasks should have yellow stripe + reduced opacity
- Completed tasks should be slightly smaller (0.99 scale) and more transparent (0.5)

**Step 5: Commit**

```bash
git add styles.css
git commit -m "feat: sapphire event stripe, remove overdue bg tint, refine completed state"
```

---

### Task 4: Tab Navigation — Bottom Border Indicator

**Files:**
- Modify: `styles.css:142-186` (view-nav, view-tab)

**Step 1: Update view-tab styles**

Replace the `.view-tab` rule:

```css
  .view-tab {
    flex: 0 0 auto;
    padding-block: var(--space-sm);
    padding-inline: var(--space-lg);
    border: none;
    border-block-end: 2px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--ctp-overlay1);
    font-family: inherit;
    font-size: var(--text-tab);
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, transform 0.1s;
    min-block-size: var(--touch-min);
    white-space: nowrap;
    display: flex;
    align-items: center;

    &.active {
      border-block-end-color: var(--ctp-mauve);
      color: var(--ctp-text);
      font-weight: 600;
    }

    &:hover:not(.active) {
      color: var(--ctp-subtext0);
    }

    &:active:not(.active) { transform: scale(0.96); }
  }
```

Key changes: removed background fill on active, added `border-block-end: 2px solid transparent` as base, active gets `border-block-end-color: var(--ctp-mauve)`, weight bumped to 600 on active, inline padding increased to `--space-lg`.

**Step 2: Update tab count badge color**

Change `.tab-count-badge` (line ~1297) background from mauve to lavender:

```css
  .tab-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 18px;
    padding-inline: var(--space-xs);
    block-size: 18px;
    border-radius: var(--radius-full);
    background: color-mix(in oklch, var(--ctp-lavender) 20%, transparent);
    color: var(--ctp-lavender);
    font-size: var(--text-2xs);
    font-weight: 600;
    margin-inline-start: var(--space-xs);
    line-height: 1;
  }

  .view-tab.active .tab-count-badge {
    background: color-mix(in oklch, var(--ctp-lavender) 25%, transparent);
  }
```

**Step 3: Verify in browser**

Active tab should have a mauve underline instead of a background fill. Count badges should be lavender-tinted.

**Step 4: Commit**

```bash
git add styles.css
git commit -m "feat: bottom-border tab indicators, lavender count badges"
```

---

### Task 5: Calendar Mode Toggle & Other Pill Controls

**Files:**
- Modify: `styles.css:1209-1244` (calendar-mode-toggle, calendar-mode-btn)

**Step 1: Update calendar mode toggle to match tab nav pattern**

Replace `.calendar-mode-btn`:

```css
  .calendar-mode-btn {
    padding-block: var(--space-sm);
    padding-inline: var(--space-lg);
    border: none;
    border-block-end: 2px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--ctp-overlay1);
    font-family: inherit;
    font-size: var(--text-tab);
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, transform 0.1s;
    min-block-size: var(--touch-min);

    &.active {
      border-block-end-color: var(--ctp-mauve);
      color: var(--ctp-text);
      font-weight: 600;
    }

    &:hover:not(.active) {
      color: var(--ctp-subtext0);
    }

    &:active:not(.active) { transform: scale(0.96); }
  }
```

Note: The browse sort toggle, all sort toggle, and active window toggle are rendered as `.label-chip` elements, not as calendar-mode-btn. Those keep their current pill style (they're selection chips, not navigation tabs).

**Step 2: Verify in browser**

Navigate to Calendar view. Day/Agenda toggle should use bottom-border indicator, matching the main view tabs.

**Step 3: Commit**

```bash
git add styles.css
git commit -m "feat: apply bottom-border indicator to calendar mode toggle"
```

---

### Task 6: Section Headings — DM Mono Uppercase

**Files:**
- Modify: `styles.css:1012-1040` (section-heading, overdue-heading, today-heading)

**Step 1: Update section heading styles**

Replace the section heading rules:

```css
  /* Section headings */
  .section-heading {
    font-family: var(--font-mono);
    font-size: var(--text-section);
    font-weight: 500;
    color: var(--ctp-overlay2);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding-block: var(--space-sm) var(--space-md);
    position: sticky;
    top: env(safe-area-inset-top, 0px);
    z-index: 1;
    background: color-mix(in oklch, var(--ctp-base) 92%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .overdue-heading {
    color: var(--ctp-red);
  }

  .today-heading {
    color: var(--ctp-sky);
  }
```

Key changes: font switches to DM Mono, size shrinks to `--text-section` (0.75rem), uppercase, letter-spacing 0.08em, color to overlay2, today heading changes from peach to sky.

**Step 2: Update agenda date heading to match**

Also update `.agenda-date-heading` (line ~1259):

```css
  .agenda-date-heading {
    font-family: var(--font-mono);
    font-size: var(--text-section);
    font-weight: 500;
    color: var(--ctp-overlay2);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding-inline-start: var(--space-xs);

    &.today {
      color: var(--ctp-sky);
    }
  }
```

Changed from: peach today → sky today, and font now DM Mono.

**Step 3: Verify in browser**

Navigate to Active view (which has Overdue/Today/Upcoming sections). Headings should be small, uppercase, DM Mono, letter-spaced. Overdue in red, Today in sky blue.

**Step 4: Commit**

```bash
git add styles.css
git commit -m "feat: DM Mono uppercase section headings"
```

---

### Task 7: Week Strip — Sky Today & Mauve Selected

**Files:**
- Modify: `styles.css:610-688` (week-day, week-today-btn, week-day-dot)

**Step 1: Update week-day states**

Replace the `.week-day` state variants (starting at `&.today`):

```css
    &.today {
      & .week-day-num {
        background: var(--ctp-sky);
        color: var(--ctp-crust);
        border-radius: var(--radius-full);
        inline-size: 28px;
        block-size: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &.selected {
      border-block-end: 2px solid var(--ctp-mauve);
      color: var(--ctp-text);
    }

    &.today.selected {
      border-block-end: 2px solid var(--ctp-mauve);

      & .week-day-num {
        background: var(--ctp-sky);
        color: var(--ctp-crust);
      }
    }
```

Remove `background: var(--ctp-surface0)` from selected states. Today gets a sky circle behind the number instead.

**Step 2: Update Today button hover**

Change `.week-today-btn` hover color from peach to sky:

```css
  .week-today-btn {
    flex: 0 0 auto;
    padding-inline: var(--space-sm);
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--ctp-overlay1);
    font-family: inherit;
    font-size: var(--text-xs);
    font-weight: 500;
    cursor: pointer;
    min-block-size: var(--touch-min);
    transition: color 0.2s, background 0.2s, transform 0.1s;
    white-space: nowrap;

    &:hover {
      color: var(--ctp-sky);
      background: var(--ctp-surface0);
    }

    &:active { transform: scale(0.94); }
  }
```

**Step 3: Verify in browser**

Navigate to Calendar view. Today's date should have a bright sky-blue circle. Selected day gets a mauve underline. The "Today" button hover should be sky-colored.

**Step 4: Commit**

```bash
git add styles.css
git commit -m "feat: sky circle for today, mauve underline for selected in week strip"
```

---

### Task 8: Create Toggle — Pink Accent

**Files:**
- Modify: `styles.css:194-222` (create-btn)

**Step 1: Update create button styles**

Replace `.create-btn`:

```css
  .create-btn {
    flex: 1;
    padding: var(--space-md) var(--space-lg);
    border: 2px solid var(--ctp-surface2);
    border-radius: var(--radius-lg);
    background: transparent;
    color: var(--ctp-subtext0);
    font-family: inherit;
    font-size: var(--text-md);
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.1s;
    min-block-size: var(--touch-min);

    &:hover {
      border-color: var(--ctp-pink);
      color: var(--ctp-text);
    }

    &.active {
      border-color: var(--ctp-pink);
      background: color-mix(in oklch, var(--ctp-pink) 15%, transparent);
      color: var(--ctp-pink);
    }

    &:active {
      transform: scale(0.97);
    }
  }
```

Changes: border from surface1 → surface2, hover accent mauve → pink, active accent mauve → pink with 15% tint (was 20%).

**Step 2: Verify in browser**

Click "New Event" or "New Task". Active state should be pink-tinted, not mauve. Hover should show pink border.

**Step 3: Commit**

```bash
git add styles.css
git commit -m "feat: pink accent for create toggle buttons"
```

---

### Task 9: Event Time & Countdown Colors

**Files:**
- Modify: `styles.css:821-877` (event-time, countdown badges)

**Step 1: Update event time color**

Change `.event-time` color from peach to sapphire:

```css
  .event-time {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--ctp-sapphire);
  }
```

**Step 2: Update due-today countdown badge**

Change `.countdown.due-today` from peach to sapphire:

```css
  .countdown.due-today {
    background: var(--ctp-sapphire);
    color: var(--ctp-crust);
    font-weight: 700;
  }
```

And change `.countdown.due-soon` from peach tint to sapphire tint:

```css
  .countdown.due-soon {
    background: color-mix(in oklch, var(--ctp-sapphire) 15%, transparent);
    color: var(--ctp-sapphire);
  }
```

**Step 3: Verify in browser**

Event times should be sapphire blue. "Due today" badges should be solid sapphire. "Due soon" badges should be sapphire-tinted.

**Step 4: Commit**

```bash
git add styles.css
git commit -m "feat: sapphire event times and due-soon/today countdown badges"
```

---

### Task 10: Item Title Size & Standardize Meta to DM Mono

**Files:**
- Modify: `styles.css:807-813` (item-title)

**Step 1: Bump item title size**

Change `.item-title` font-size from `--text-base` (1rem) to `1.05rem`:

```css
  .item-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--ctp-text);
    overflow-wrap: break-word;
  }
```

**Step 2: Verify in browser**

Item titles should be very slightly larger. Barely noticeable in isolation but improves the visual hierarchy gap between title and meta.

**Step 3: Commit**

```bash
git add styles.css
git commit -m "feat: slightly larger item titles for better type hierarchy"
```

---

### Task 11: Accessibility Layer Update

**Files:**
- Modify: `styles.css:1484-1512` (a11y layer)

**Step 1: Update high-contrast override for active tab**

Since active tabs now use a bottom border instead of a fill, update the high-contrast override:

```css
  @media (prefers-contrast: more) {
    .item-card {
      border: 1px solid var(--ctp-overlay0);
    }

    .view-tab.active {
      border-block-end: 3px solid var(--ctp-text);
    }

    .item-card.completed {
      opacity: 0.7;
    }
  }
```

Changed from `border: 2px solid` (all sides) to `border-block-end: 3px solid` (bottom only, thicker for visibility).

**Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: update high-contrast override for bottom-border tabs"
```

---

### Task 12: Visual Verification

**Files:**
- No file changes. Browser testing only.

**Step 1: Test at 1920x1080 (desktop)**

Open browser at 1920x1080. Check all views:

1. **Calendar** — week strip (sky today circle, mauve selected underline), Day/Agenda toggle (bottom border indicator), event cards (sapphire stripe), task cards
2. **Active** — section headings (DM Mono uppercase, overlay2 color), overdue heading (red), today heading (sky), overdue cards (red stripe, no bg tint)
3. **Anytime** — card padding, task stripes
4. **Recurring** — same card treatment
5. **Done** — completed cards (opacity 0.5, scale 0.99)
6. **All** — search bar, reveal-on-interact cards

Also check:
- Create toggle (pink accent on active)
- Create form (20px border-radius)
- Delete dialog (20px border-radius)
- Tab count badges (lavender)
- Toast (20px border-radius)

**Step 2: Test at 412x915 (mobile)**

Use browser dev tools responsive mode at 412x915. Same checks. Also verify:
- Touch targets still 44px minimum
- Week strip still scrollable and usable
- Tab nav doesn't overflow awkwardly
- Cards have enough padding on narrow screens

**Step 3: Fix any issues found**

If anything looks off, make targeted CSS fixes and commit with descriptive messages.

**Step 4: Final commit if needed**

```bash
git add styles.css
git commit -m "fix: visual polish from verification pass"
```

---

### Task 13: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update CSS architecture notes**

In the CSS Architecture section, add a note about the Warm Ink visual refresh:
- `--radius-lg` is now 20px
- Section headings use DM Mono uppercase
- Tab indicators use bottom borders, not background fills
- Event accent color is sapphire (not peach)
- Create toggle uses pink accent

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Warm Ink visual refresh"
```
