# Mobile-First Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the todo app with a "Solid Terminal" aesthetic: dark layered surfaces, bottom input bar on mobile, consolidated toolbar, three-dot action menus, responsive desktop adaptation.

**Architecture:** All changes in `index.html`. CSS restructuring across `@layer tokens`, `@layer base`, and `@layer components`. HTML restructuring of the body. Minor JS additions for three-dot menu toggle, input expand/collapse, and category chip toggle. No new files, no dependencies.

**Tech Stack:** Vanilla HTML, CSS (`@layer`, nesting, logical properties, `color-mix`), vanilla JS

**Design doc:** `docs/plans/2026-02-25-mobile-first-redesign-design.md`

---

### Task 1: Foundation — Body & Token Updates

**Files:**
- Modify: `index.html` (CSS `@layer tokens` ~line 23, `@layer base` ~line 78)

**Step 1: Update body background and base styles**

In `@layer base`, change `background-color` from `--ctp-base` to `--ctp-crust`:

```css
@layer base {
  body {
    font-family: var(--font-sans);
    font-optical-sizing: auto;
    background-color: var(--ctp-crust);
    color: var(--ctp-text);
    line-height: 1.5;
    letter-spacing: -0.011em;
    min-block-size: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    -webkit-tap-highlight-color: transparent;
    overflow-x: hidden;
  }
}
```

**Step 2: Verify in browser**

Open `index.html` in browser. Body background should be noticeably darker (#11111b instead of #1e1e2e). Todo cards should now "float" more visibly against the darker background.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: update body background to crust for depth layering"
```

---

### Task 2: HTML Restructure — Layout Skeleton

**Files:**
- Modify: `index.html` (HTML body ~line 1117-1189)

This is the biggest structural change. We need to:
- Wrap the scrollable content area
- Move the input area to a separate bottom bar container
- Restructure the toolbar into a single row with category toggle
- Add three-dot menu button to the render function

**Step 1: Restructure the HTML body**

Replace the current `<body>` content (lines 1117-1189) with this new structure:

```html
<body>
  <main class="app">
    <header>
      <h1>Todo</h1>
      <span class="task-count" id="task-count" role="status" aria-live="polite"></span>
    </header>

    <div class="toolbar">
      <div class="filters" role="tablist" aria-label="Filter todos">
        <button class="active" role="tab" aria-selected="true" data-filter="all">All</button>
        <button role="tab" aria-selected="false" data-filter="active">Active</button>
        <button role="tab" aria-selected="false" data-filter="completed">Done</button>
      </div>
      <div class="toolbar-actions">
        <select class="sort-select" id="sort-select" aria-label="Sort todos">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="alpha-az">A &rarr; Z</option>
          <option value="alpha-za">Z &rarr; A</option>
          <option value="category">Category</option>
          <option value="due-date">Due date</option>
        </select>
        <button class="category-toggle-btn" id="category-toggle-btn" aria-label="Toggle category filter" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="category-bar" id="category-bar">
      <div class="category-filters" id="category-filters" aria-label="Filter by category"></div>
      <button class="manage-categories-btn" id="manage-categories-btn" aria-label="Manage categories">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
        </svg>
      </button>
    </div>

    <ul class="todo-list" id="todo-list" aria-live="polite"></ul>

    <button class="clear-completed" id="clear-completed" style="display:none;">Clear completed</button>
  </main>

  <div class="input-bar" id="input-bar">
    <div class="input-bar-inner">
      <div class="input-row">
        <input type="text" id="todo-input" placeholder="What needs to be done?" autocomplete="off" maxlength="500">
        <button id="add-btn" class="add-btn-mobile" aria-label="Add task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div class="options-row" id="options-row">
        <select id="category-select" aria-label="Category"></select>
        <input type="date" id="due-date-input" aria-label="Due date (optional)">
      </div>
    </div>
  </div>

  <div class="toast-container" id="toast-container"></div>

  <dialog class="confirm-dialog" id="delete-dialog">
    <p class="confirm-dialog-title">Delete task</p>
    <p class="confirm-dialog-text" id="delete-dialog-text"></p>
    <div class="confirm-dialog-actions">
      <button class="confirm-cancel-btn" id="delete-dialog-cancel">Cancel</button>
      <button class="confirm-delete-btn" id="delete-dialog-confirm">Delete</button>
    </div>
  </dialog>

  <dialog class="category-dialog" id="category-dialog">
    <p class="category-dialog-title">Manage Categories</p>
    <ul class="category-dialog-list" id="category-dialog-list"></ul>
    <div class="add-category-form" id="add-category-form">
      <p class="add-category-form-title">New category</p>
      <input type="text" id="new-category-name" placeholder="Category name" maxlength="30">
      <div class="color-picker" id="new-category-color-picker"></div>
      <div class="add-category-actions">
        <button class="add-category-btn" id="add-category-btn">Add</button>
      </div>
    </div>
    <div class="category-dialog-footer">
      <button class="category-dialog-done-btn" id="category-dialog-done">Done</button>
    </div>
  </dialog>
```

Key changes:
- Input area moved outside `<main>` into its own `.input-bar` container
- Add button uses a "+" SVG icon on mobile (CSS will show text on desktop)
- Toolbar restructured: filters + sort + category-toggle in one row
- Category bar is separate, togglable via JS
- Toast container stays at bottom as a fixed overlay

**Step 2: Verify the page loads without JS errors**

Open browser console, confirm no errors about missing DOM elements.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: restructure HTML for mobile-first layout"
```

---

### Task 3: Header CSS

**Files:**
- Modify: `index.html` (CSS `@layer components`, replace header styles ~line 110-134)

**Step 1: Replace header and app shell CSS**

Replace the `main.app` and header CSS blocks with:

```css
/* App shell */
main.app {
  inline-size: 100%;
  max-inline-size: 520px;
  padding: 0 var(--space-xl);
  padding-block-end: 100px; /* space for fixed input bar */
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Header */
header {
  position: sticky;
  inset-block-start: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: var(--space-md);
  background: var(--ctp-mantle);
  margin-inline: calc(-1 * var(--space-xl));
  padding-inline: var(--space-xl);
  border-block-end: 1px solid var(--ctp-surface0);

  & h1 {
    font-size: clamp(1.4rem, 1.2rem + 0.8vw, 1.75rem);
    font-weight: 700;
    color: var(--ctp-mauve);
    letter-spacing: -0.025em;
  }
}

.task-count {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--ctp-overlay1);
  background: var(--ctp-surface0);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  letter-spacing: 0;
}
```

**Step 2: Verify in browser**

Header should be sticky on scroll, mantle-colored, with a subtle bottom border. Title smaller than before.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: redesign header with sticky mobile positioning"
```

---

### Task 4: Input Bar CSS

**Files:**
- Modify: `index.html` (CSS `@layer components`, replace input area styles)

**Step 1: Replace input area CSS**

Remove the old `.input-row` and `.options-row` CSS blocks. Add:

```css
/* Input bar — fixed bottom on mobile */
.input-bar {
  position: fixed;
  inset-block-end: 0;
  inset-inline: 0;
  z-index: 20;
  background: var(--ctp-mantle);
  border-block-start: 1px solid var(--ctp-surface0);
  padding: var(--space-md) var(--space-xl);
  padding-block-end: max(var(--space-md), env(safe-area-inset-bottom));
}

.input-bar-inner {
  max-inline-size: 520px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.input-row {
  display: flex;
  gap: var(--space-sm);
  align-items: center;

  & input[type="text"] {
    flex: 1;
    padding: var(--space-md) var(--space-lg);
    border: none;
    border-radius: var(--radius-lg);
    background: var(--ctp-surface0);
    color: var(--ctp-text);
    font-family: inherit;
    font-size: 0.95rem;
    line-height: 1.5;
    outline: none;
    transition: background 0.15s;

    &:focus {
      background: var(--ctp-surface1);
      outline: 2px solid var(--ctp-mauve);
      outline-offset: 2px;
    }

    &::placeholder {
      color: var(--ctp-overlay0);
    }
  }
}

/* Round "+" button for mobile */
.add-btn-mobile {
  inline-size: var(--touch-min);
  block-size: var(--touch-min);
  border: none;
  border-radius: 50%;
  background: var(--ctp-mauve);
  color: var(--ctp-crust);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, transform 0.1s;

  & svg {
    inline-size: 20px;
    block-size: 20px;
  }

  &:hover {
    background: color-mix(in oklch, var(--ctp-mauve), var(--ctp-lavender) 50%);
  }

  &:active {
    transform: scale(0.92);
  }
}

/* Options row — hidden by default, shown on input focus */
.options-row {
  display: flex;
  gap: var(--space-sm);
  max-block-size: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-block-size 0.15s ease-out, opacity 0.15s ease-out;
}

.options-row.expanded {
  max-block-size: 60px;
  opacity: 1;
}

.options-row select,
.options-row input[type="date"] {
  flex: 1;
  min-inline-size: 0;
  padding: var(--space-sm) var(--space-md);
  border: 1.5px solid var(--ctp-surface1);
  border-radius: var(--radius-full);
  background: var(--ctp-surface0);
  color: var(--ctp-text);
  font-family: inherit;
  font-size: 0.8rem;
  outline: none;
  min-block-size: 36px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--ctp-mauve);
    outline: 2px solid var(--ctp-mauve);
    outline-offset: 2px;
  }
}

.options-row input[type="date"] {
  color-scheme: dark;

  &::-webkit-calendar-picker-indicator {
    filter: invert(0.7);
    cursor: pointer;
  }
}
```

**Step 2: Add JS for input expand/collapse**

In the `<script>` block, after the DOM element references, add:

```javascript
const inputBar = document.getElementById('input-bar');
const optionsRow = document.getElementById('options-row');

// Expand options row on input focus
input.addEventListener('focus', () => {
  optionsRow.classList.add('expanded');
});

// Collapse on click outside input bar
document.addEventListener('click', (e) => {
  if (!inputBar.contains(e.target)) {
    optionsRow.classList.remove('expanded');
  }
});

// Collapse after adding a todo
// (modify addTodo to also collapse)
```

Also modify the `addTodo` function to collapse the options row after adding:

```javascript
function addTodo(text) {
  text = text.trim();
  if (!text) return;
  pushUndo('Task added');
  const id = crypto.randomUUID();
  lastAddedId = id;
  const category = categorySelect.value;
  const dueDate = dueDateInput.value || null;
  todos.unshift({ id, text, completed: false, category, createdAt: Date.now(), dueDate });
  save();
  render();
  showToast('Task added');
  input.value = '';
  dueDateInput.value = '';
  optionsRow.classList.remove('expanded');
  input.focus();
}
```

**Step 3: Verify in browser**

- Input bar should be fixed at bottom
- Tapping input should slide the options row up
- Adding a todo should collapse the options
- Clicking outside should collapse

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add bottom-fixed input bar with expandable options"
```

---

### Task 5: Toolbar CSS & Category Toggle JS

**Files:**
- Modify: `index.html` (CSS + JS)

**Step 1: Replace toolbar and category bar CSS**

Remove old `.toolbar`, `.filters`, `.sort-select`, `.category-bar`, `.category-filters`, and `.manage-categories-btn` CSS. Add:

```css
/* Toolbar — single compact row */
.toolbar {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.filters {
  display: flex;
  gap: 2px;
  background: var(--ctp-mantle);
  padding: 3px;
  border-radius: var(--radius-lg);
  flex: 1;

  & button {
    flex: 1;
    padding-block: 0.5rem;
    padding-inline: var(--space-sm);
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--ctp-overlay1);
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    min-block-size: 36px;

    &.active {
      background: var(--ctp-surface1);
      color: var(--ctp-text);
    }

    &:hover:not(.active) {
      color: var(--ctp-subtext0);
    }
  }
}

.toolbar-actions {
  display: flex;
  gap: 2px;
  align-items: center;
}

.sort-select {
  padding: var(--space-sm);
  border: none;
  border-radius: var(--radius-md);
  background: var(--ctp-mantle);
  color: var(--ctp-overlay1);
  font-family: inherit;
  font-size: 0;   /* hide text on mobile — icon-only feel via appearance */
  font-weight: 500;
  cursor: pointer;
  outline: none;
  min-block-size: 36px;
  min-inline-size: 36px;
  transition: color 0.15s;

  &:focus {
    outline: 2px solid var(--ctp-mauve);
    outline-offset: 2px;
  }

  &:hover {
    color: var(--ctp-subtext0);
  }
}

.category-toggle-btn {
  background: var(--ctp-mantle);
  border: none;
  border-radius: var(--radius-md);
  color: var(--ctp-overlay1);
  cursor: pointer;
  padding: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 36px;
  min-block-size: 36px;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: var(--ctp-subtext0);
  }

  &[aria-expanded="true"] {
    color: var(--ctp-text);
    background: var(--ctp-surface0);
  }

  & svg {
    inline-size: 16px;
    block-size: 16px;
  }
}

/* Category bar — collapsible on mobile */
.category-bar {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  max-block-size: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-block-size 0.15s ease-out, opacity 0.15s ease-out, margin 0.15s ease-out;
  margin-block-start: calc(-1 * var(--space-lg));
}

.category-bar.expanded {
  max-block-size: 50px;
  opacity: 1;
  margin-block-start: 0;
}

.category-filters {
  display: flex;
  gap: var(--space-xs);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding-block: 2px;
  flex: 1;
  min-inline-size: 0;

  &::-webkit-scrollbar {
    display: none;
  }

  & button {
    padding: var(--space-xs) var(--space-md);
    border: 1.5px solid var(--ctp-surface2);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--ctp-overlay1);
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    white-space: nowrap;
    min-block-size: 32px;

    &.active {
      background: var(--ctp-surface0);
      color: var(--ctp-text);
      border-color: var(--ctp-surface0);
    }

    &:hover:not(.active) {
      color: var(--ctp-subtext0);
      border-color: var(--ctp-overlay0);
    }
  }
}

.manage-categories-btn {
  background: none;
  border: 1.5px solid var(--ctp-surface2);
  border-radius: var(--radius-full);
  color: var(--ctp-overlay1);
  cursor: pointer;
  padding: var(--space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 32px;
  min-block-size: 32px;
  flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s, background 0.15s;

  &:hover {
    color: var(--ctp-subtext0);
    border-color: var(--ctp-overlay0);
    background: var(--ctp-surface0);
  }

  & svg {
    inline-size: 14px;
    block-size: 14px;
  }
}
```

**Step 2: Add JS for category toggle**

```javascript
const categoryBar = document.getElementById('category-bar');
const categoryToggleBtn = document.getElementById('category-toggle-btn');

categoryToggleBtn.addEventListener('click', () => {
  const isExpanded = categoryBar.classList.toggle('expanded');
  categoryToggleBtn.setAttribute('aria-expanded', isExpanded);
});
```

**Step 3: Verify in browser**

- Toolbar should be one compact row with filter tabs, sort dropdown, and tag icon
- Tapping the tag icon should slide the category chip strip in/out
- Sort dropdown should still work (though text may be hidden on narrow screens — this is fine, the native select will still open)

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: consolidate toolbar into single row with category toggle"
```

---

### Task 6: Todo Items — Cards & Three-Dot Menu

**Files:**
- Modify: `index.html` (CSS + JS render function)

**Step 1: Update todo item CSS**

Replace the `.todo-item`, `.todo-actions`, `.edit-btn`, `.delete-btn` CSS blocks:

```css
/* Todo list */
.todo-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.todo-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 0.75rem var(--space-lg);
  background: var(--ctp-surface0);
  border-radius: var(--radius-lg);
  transition: background 0.15s, opacity 0.2s, transform 0.2s;
  position: relative;

  &.new-item {
    animation: slide-in 0.25s ease-out;
  }

  &.completed {
    opacity: 0.5;
    transform: scale(0.98);

    & .todo-text {
      text-decoration: line-through;
      color: var(--ctp-overlay0);
    }
  }
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.todo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.todo-text {
  font-size: 1rem;
  color: var(--ctp-text);
  overflow-wrap: break-word;
}

/* Three-dot menu button (mobile) */
.todo-more-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  color: var(--ctp-overlay0);
  transition: color 0.15s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-inline-size: var(--touch-min);
  min-block-size: var(--touch-min);
  justify-content: center;

  & svg {
    inline-size: 18px;
    block-size: 18px;
  }

  &:hover {
    color: var(--ctp-subtext0);
  }
}

/* Inline action strip — shown when three-dot is toggled */
.todo-action-strip {
  display: none;
  gap: 2px;
  align-items: center;

  &.open {
    display: flex;
  }
}

/* Desktop: show action buttons on hover, hide three-dot */
.todo-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.edit-btn,
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  color: var(--ctp-overlay0);
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
  display: none; /* hidden on mobile by default */
  align-items: center;
  min-inline-size: var(--touch-min);
  min-block-size: var(--touch-min);
  justify-content: center;

  & svg {
    inline-size: 18px;
    block-size: 18px;
  }
}

.edit-btn:hover {
  color: var(--ctp-blue);
  background: var(--ctp-surface1);
}

.delete-btn:hover {
  color: var(--ctp-red);
  background: var(--ctp-surface1);
}
```

**Step 2: Update the `render()` function to include three-dot menu**

In the `render()` function, replace the todo actions HTML. Each todo item's actions section becomes:

```javascript
<div class="todo-actions">
  <button class="todo-more-btn" data-action="toggle-menu" aria-label="More actions for ${escapeAttr(todo.text)}">
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
    </svg>
  </button>
  <div class="todo-action-strip">
    <button class="edit-btn" aria-label="Edit ${escapeAttr(todo.text)}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
      </svg>
    </button>
    <button class="delete-btn" aria-label="Delete ${escapeAttr(todo.text)}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
</div>
```

**Step 3: Add JS for three-dot menu toggle**

Add to the list event listener:

```javascript
if (e.target.closest('.todo-more-btn')) {
  const strip = item.querySelector('.todo-action-strip');
  // Close any other open strips first
  document.querySelectorAll('.todo-action-strip.open').forEach(s => {
    if (s !== strip) s.classList.remove('open');
  });
  strip.classList.toggle('open');
  return;
}
```

Also add a document click handler to close open strips when clicking elsewhere:

```javascript
document.addEventListener('click', (e) => {
  if (!e.target.closest('.todo-actions')) {
    document.querySelectorAll('.todo-action-strip.open').forEach(s => s.classList.remove('open'));
  }
});
```

**Step 4: Verify in browser**

- Todo items should show only the three-dot button on the right
- Tapping three-dot should reveal Edit and Delete buttons inline
- Tapping again or clicking elsewhere should close them

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add three-dot action menu for todo items"
```

---

### Task 7: Desktop Responsive Breakpoint

**Files:**
- Modify: `index.html` (CSS `@layer components`)

**Step 1: Add desktop overrides at end of `@layer components`**

```css
/* Desktop overrides */
@media (min-width: 640px) {
  header {
    position: static;
    background: transparent;
    border-block-end: none;
    margin-inline: 0;
    padding-inline: 0;
  }

  main.app {
    padding-block-start: var(--space-3xl);
    padding-block-end: var(--space-3xl);
  }

  /* Input bar moves to top, static position */
  .input-bar {
    position: static;
    background: transparent;
    border-block-start: none;
    padding: 0;
    order: -1;
  }

  /* Show the input bar inside main on desktop via flexbox order trick.
     Actually, since the input bar is outside main, we need a different approach.
     We'll use CSS to visually reposition it. */

  /* Options row always visible on desktop */
  .options-row {
    max-block-size: 60px;
    opacity: 1;
  }

  /* Add button shows text on desktop */
  .add-btn-mobile {
    border-radius: var(--radius-lg);
    inline-size: auto;
    padding: var(--space-md) var(--space-xl);
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;

    & svg {
      display: none;
    }

    &::after {
      content: 'Add';
    }
  }

  /* Sort select shows text on desktop */
  .sort-select {
    font-size: 0.8rem;
    padding-inline: var(--space-md);
  }

  /* Category bar always visible on desktop */
  .category-bar {
    max-block-size: 50px;
    opacity: 1;
    margin-block-start: 0;
  }

  .category-toggle-btn {
    display: none;
  }

  /* Todo actions: hide three-dot, show edit/delete on hover */
  .todo-more-btn {
    display: none;
  }

  .edit-btn,
  .delete-btn {
    display: flex;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .todo-item:hover .edit-btn,
  .todo-item:hover .delete-btn {
    opacity: 1;
  }

  .todo-action-strip {
    display: flex !important; /* always show the strip on desktop */
  }
}
```

Note: The input bar being outside `<main>` on desktop is a problem. Since it's fixed at the bottom on mobile, it needs to be outside the scrollable main. On desktop, we want it at the top.

**Alternative approach for desktop input placement:** On desktop, make `.input-bar` absolute/relative positioned at the top of `<main>` using CSS grid or by giving `<main>` a different padding-top and using negative margins. OR we can duplicate the input and show/hide with CSS. The cleanest approach: use CSS `order` with a flex wrapper around both `<main>` and `.input-bar`.

Revised approach: Wrap `<main>` and `.input-bar` in a flex container in the HTML:

```html
<div class="app-wrapper">
  <main class="app">...</main>
  <div class="input-bar">...</div>
</div>
```

Then on desktop:
```css
@media (min-width: 640px) {
  .app-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .input-bar {
    order: -1;
    /* positions it above main */
  }
}
```

On mobile, `.app-wrapper` is just `display: contents` so the fixed positioning of `.input-bar` still works.

This task will need careful implementation. The implementer should test both mobile and desktop at 1920x1080.

**Step 2: Verify at 1920x1080**

Open browser at 1920x1080. Input should appear at the top. Category chips visible. Todo actions visible on hover only.

**Step 3: Verify at mobile width (375px)**

Use browser dev tools responsive mode at 375x812 (iPhone). Input at bottom. Category chips hidden behind toggle. Three-dot menu visible.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add desktop responsive breakpoint"
```

---

### Task 8: Animations & Empty State

**Files:**
- Modify: `index.html` (CSS + JS)

**Step 1: Update slide-in animation direction**

Already done in Task 6 — animation slides up from below (`translateY(8px)` to `translateY(0)`).

**Step 2: Add checkbox pulse animation**

```css
@keyframes check-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.checkbox input:checked + .checkmark {
  animation: check-pulse 0.2s ease-out;
}
```

**Step 3: Update empty state CSS**

```css
.empty-state {
  text-align: center;
  padding: var(--space-4xl) var(--space-lg);
  color: var(--ctp-overlay1);

  & .icon {
    font-size: 3rem;
    margin-block-end: var(--space-lg);
    opacity: 0.4;
  }

  & p {
    font-size: 0.95rem;
    text-wrap: balance;
  }
}
```

**Step 4: Add pulsing dot animation for input bar hint**

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.input-bar-hint {
  inline-size: 6px;
  block-size: 6px;
  border-radius: 50%;
  background: var(--ctp-mauve);
  animation: pulse-dot 2s ease-in-out infinite;
  position: absolute;
  inset-block-start: -3px;
  inset-inline-end: 10px;
}
```

Add the pulsing dot to the add button in HTML when the list is empty (conditionally via JS in render function).

**Step 5: Verify in browser**

- Empty state should have larger icon and better spacing
- Completing a todo should show a brief checkbox pulse
- When list is empty, the "+" button should have a pulsing mauve dot

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add animations and improved empty state"
```

---

### Task 9: Edit Form & Dialog Updates

**Files:**
- Modify: `index.html` (CSS)

**Step 1: Update edit form styles**

The inline edit form CSS needs updating to match the new card padding and pill-style inputs. Keep the existing edit form structure but update to match the new visual language (pill borders, mantle backgrounds on inputs, etc.).

Edit form inputs should use `--ctp-mantle` background, `--ctp-surface1` border, and `--radius-full` for selects/dates to match the pill style.

**Step 2: Verify editing a todo works on both mobile and desktop**

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: update edit form styles to match new design"
```

---

### Task 10: Accessibility & Reduced Motion Updates

**Files:**
- Modify: `index.html` (CSS `@layer a11y`)

**Step 1: Update a11y layer**

```css
@layer a11y {
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  @media (prefers-contrast: more) {
    .todo-item {
      border: 1px solid var(--ctp-overlay0);
    }

    .filters button.active {
      border: 2px solid var(--ctp-text);
    }

    .todo-item.completed {
      opacity: 0.7;
    }

    .input-bar {
      border-block-start: 2px solid var(--ctp-overlay0);
    }

    header {
      border-block-end: 2px solid var(--ctp-overlay0);
    }
  }
}
```

**Step 2: Verify keyboard navigation works**

- Tab through all interactive elements
- Enter/Space on filter buttons
- Escape to cancel edit
- Ctrl+Z to undo
- Three-dot menu opens with Enter/Space, closes with Escape

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: update accessibility layer for new layout"
```

---

### Task 11: Final Polish & Integration Testing

**Files:**
- Modify: `index.html` (any remaining fixes)

**Step 1: Test full flow at mobile (375x812)**

1. Add a todo with category and due date
2. Toggle category filter
3. Switch filter tabs
4. Edit a todo
5. Delete a todo with confirmation
6. Complete a todo
7. Clear completed
8. Undo
9. Manage categories

**Step 2: Test full flow at desktop (1920x1080)**

Same flow as above. Verify:
- Input is at top
- Hover actions work
- Category chips always visible
- No horizontal overflow

**Step 3: Fix any visual issues found**

Likely candidates:
- Toast positioning (needs to be above input bar on mobile)
- Dialog positioning (centered correctly)
- Scroll behavior with fixed header + fixed input bar
- Category chip strip horizontal scroll on mobile

**Step 4: Final commit**

```bash
git add index.html
git commit -m "feat: polish and fix integration issues"
```

---

### Task 12: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update line counts and architecture notes**

The HTML structure has changed. Update the architecture section to reflect:
- New `.app-wrapper` container
- Input bar at bottom (mobile) / top (desktop)
- Three-dot menu pattern
- Category toggle behavior
- New JS event handlers added

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for mobile-first redesign"
```
