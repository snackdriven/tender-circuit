# tender-circuit

A task and event planner with zero dependencies and a whole lot of [Catppuccin Mocha](https://github.com/catppuccin/catppuccin).

**[Try it live](https://snackdriven.github.io/tender-circuit/)**

![Dark mode planner with Catppuccin Mocha colors](https://img.shields.io/badge/theme-catppuccin%20mocha-cba6f7?style=for-the-badge) ![No dependencies](https://img.shields.io/badge/dependencies-0-a6e3a1?style=for-the-badge)

## What's inside

Three files (`index.html`, `styles.css`, `app.js`). No build step. No node_modules. No nonsense. Just open it.

- **Inter** for the UI, **DM Mono** for the numbers
- Catppuccin Mocha — 26 hand-picked colors so your eyes can relax
- Mobile-first with 44px touch targets and safe-area support
- Survives a refresh — versioned `localStorage` with a backup copy

### Tasks

Tasks have three time states:

- **Due by** — surfaces 10 days before the due date, shows a countdown badge
- **Open** — no deadline; gets a stale badge if untouched for 14 days
- **Recurring** — completes and spawns the next instance atomically

Status flows through `active → waiting → done`. Blocked is derived from dependencies, not stored. Labels are `15min` and `browse` — execution hints, not categories.

### Events

Events have a date (all-day or timed), location, and notes. The calendar view shows events and tasks together on a weekly strip.

### Views

| View | What's in it |
|------|--------------|
| Calendar | Items on the selected day, week strip for navigation |
| Active | Due-by tasks in the 10-day window |
| Browse | Open tasks and anything labeled `browse` or `15min` |
| Recurring | Recurring tasks due today or earlier |
| Done | Last 50 completed items — reopenable |
| All | Everything, with title search |

### Other stuff

- Ctrl+Z / Cmd+Z undoes the last action (up to 20 levels)
- Done items auto-purge after 90 days
- Orphan dependency refs cleaned on load

## Run locally

```sh
open index.html
```

That's it. Or if you want hot reload:

```sh
npx serve .
```

## License

MIT
