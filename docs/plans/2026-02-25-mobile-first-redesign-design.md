# Warm Ink Visual Refresh

**Date:** 2026-02-25
**Direction:** "Warm Ink" — editorial typography, cool-tone accents with a pink highlight, generous card spacing, depth through negative space
**Scope:** Visual refresh only. Same interactions, same JS architecture, same HTML structure.
**Constraints:** Zero dependencies, three files (index.html, styles.css, app.js), Catppuccin Mocha palette

---

## Color System

**Body:** `--ctp-base` (#1e1e2e). No change. Depth comes from spacing and type, not surface stacking.

**Accent palette (cool-dominant with pink warmth):**

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Primary action | `--ctp-mauve` | #cba6f7 | Buttons, focus rings, app title, active tab indicator |
| Warm highlight | `--ctp-pink` | #f5c2e7 | Create toggle active state, section heading accents |
| Secondary | `--ctp-lavender` | #b4befe | Tab count badges, subtle highlights, hover warmth |
| Info/time | `--ctp-sapphire` | #74c7ec | Event card stripe, event time display, non-urgent countdowns |
| Light accent | `--ctp-sky` | #89dceb | Week strip "today" circle, light informational touches |
| Completion | `--ctp-green` | #a6e3a1 | Checkmarks, done states |
| Urgency | `--ctp-red` | #f38ba8 | Overdue badges, overdue card stripe, delete actions |
| Waiting | `--ctp-yellow` | #f9e2af | Waiting badge, waiting card stripe |

**Surface usage (unchanged):**
- `--ctp-surface0` — cards, forms, dialogs
- `--ctp-mantle` — tab nav bg, week strip bg
- `--ctp-surface1` — hover states (solid, replacing color-mix patterns)

---

## Typography

**Changes from current:**

| Element | Current | New |
|---------|---------|-----|
| Item titles | `--text-base` (1rem), weight 600 | **1.05rem**, weight 600 |
| Section headings (Overdue, Today, etc.) | `--text-sm` (0.85rem) Inter, weight 600, subtext0 | **0.75rem uppercase DM Mono**, weight 500, letter-spacing 0.08em, overlay2 |
| Meta (countdown, time, all badges) | Mixed text-xs/text-2xs | Standardize to **`--text-2xs` (0.7rem) DM Mono** |
| View tabs | `--text-tab` (fluid), weight 500 | Same size, weight bumped to **600** |
| Everything else | No change | No change |

**New token:**
```css
--text-section: 0.75rem;  /* section heading size */
```

---

## Spacing

| Element | Current | New |
|---------|---------|-----|
| Card internal padding | `--space-md --space-lg` (0.75rem 1rem) | **`--space-lg --space-xl`** (1rem 1.25rem) |
| Item list gap | `--space-md` (0.75rem) | **`--space-sm`** (0.5rem) |
| App section gap | `--space-2xl` (1.5rem) | **`--space-xl`** (1.25rem) |

**Key principle:** More padding inside cards, tighter gaps between them. Cards feel generous individually, list stays compact.

---

## Border Radius

**Global bump:**

| Element | Current | New |
|---------|---------|-----|
| `--radius-lg` | 16px | **20px** |

Affected: item cards, create forms, edit forms, tab nav container, week strip, dialogs, toasts.

All other radii (`--radius-sm`, `--radius-md`, `--radius-full`) stay the same.

---

## Tab Navigation

| Property | Current | New |
|---------|---------|-----|
| Active indicator | Background fill (`surface0`) | **2px bottom border in mauve**, no fill |
| Active text | `--ctp-text` | `--ctp-text`, weight **600** |
| Inactive text | `--ctp-overlay1` | Same |
| Hover | `color-mix(surface0 50%, transparent)` | `--ctp-subtext0` text only, no bg |
| Count badges | Mauve tint | **Lavender** tint |
| Tab padding | `--space-md` inline | **`--space-lg`** inline |

Same treatment applies to: calendar mode toggle (Day/Agenda), browse sort toggle, all sort toggle, active window toggle.

---

## Item Cards

| Property | Current | New |
|---------|---------|-----|
| Border-radius | 16px | **20px** |
| Padding | `--space-md --space-lg` | **`--space-lg --space-xl`** |
| Event stripe color | Peach | **Sapphire** |
| Task stripe color | overlay0 | **overlay1** |
| Overdue bg tint | `color-mix(red 6%, surface0)` | **Removed** (stripe + badge is enough) |
| Completed opacity | 0.55 | **0.5** |
| Completed scale | None | **scale(0.99)** |
| Hover | `color-mix` | **surface1** solid fill |

---

## Week Strip

| Property | Current | New |
|---------|---------|-----|
| Today indicator | Peach text color | **Sky circle** background behind number |
| Selected day | surface0 fill | **Mauve 2px bottom border**, no fill |
| Today + selected | Peach text, surface0 fill | Sky circle + mauve underline |
| "Today" button hover | overlay1 → peach | overlay1 → **sky** |

---

## Create Toggle

| Property | Current | New |
|---------|---------|-----|
| Border | `surface1` | **`surface2`** (more visible) |
| Active accent | Mauve | **Pink** |
| Active bg | `color-mix(mauve 20%, transparent)` | `color-mix(**pink** 15%, transparent)` |
| Active border | Mauve | **Pink** |
| Border-radius | `--radius-lg` (16px) | **20px** |

---

## Create/Edit Forms

- Border-radius bumped to 20px
- Any section labels inside forms get DM Mono uppercase treatment
- Input fields: no changes
- Button radius: standardize to 12px (`--radius-md` + 2px)

---

## Dialogs

- Border-radius bumped to 20px
- No other changes

---

## What Doesn't Change

- HTML structure (index.html)
- JavaScript (app.js) — no logic changes
- Interaction patterns (same create flow, same edit flow, same navigation)
- Login screen layout
- Toast design
- Animation timing/easing
- Accessibility (ARIA, touch targets, reduced-motion, high-contrast)
- Empty state design
- Checkbox design
- Sync indicator
