# tender-circuit

A task and event planner with zero dependencies and a whole lot of [Catppuccin Mocha](https://github.com/catppuccin/catppuccin).

**[Try it live](https://snackdriven.github.io/tender-circuit/)**

![Dark mode planner with Catppuccin Mocha colors](https://img.shields.io/badge/theme-catppuccin%20mocha-cba6f7?style=for-the-badge) ![No dependencies](https://img.shields.io/badge/dependencies-0-a6e3a1?style=for-the-badge)

## What's inside

Three files (`index.html`, `styles.css`, `app.js`). No build step. No node_modules. No nonsense. Just open it.

- Inter for the UI, DM Mono for the numbers
- Catppuccin Mocha's 26-color palette (dark mode only, no apologies)
- Mobile-first with 44px touch targets and safe-area support
- Persists to `localStorage` with a versioned envelope and a backup copy

### Tasks

Tasks have three time states. "Due by" tasks surface 10 days before their deadline and show a countdown. "Open" tasks have no deadline but get a stale badge after 14 days without an update. "Recurring" tasks complete and immediately create the next instance.

Status goes `active → waiting → done`. "Blocked" isn't a status — it's derived from unfinished dependencies. The only labels are `15min` and `browse`, both meant as execution hints, not categories.

### Events

Events have a date (all-day or timed), an optional location, and notes. The calendar view shows events and tasks together on a weekly strip.

### Views

| View | What's in it |
|------|--------------|
| Calendar | Items on the selected day, week strip for navigation |
| Active | Due-by tasks in the 10-day window |
| Browse | Open tasks plus anything labeled `browse` or `15min` |
| Recurring | Recurring tasks due today or earlier |
| Done | Last 50 completed items (reopenable) |
| All | Everything, with title search |

### Other stuff

- Ctrl+Z / Cmd+Z undoes the last action, up to 20 levels
- Done items are automatically deleted after 90 days
- Stale dependency references are cleaned up on load

## Run locally

```sh
open index.html
```

Or if you want hot reload:

```sh
npx serve .
```

## License

MIT
