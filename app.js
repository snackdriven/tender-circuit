// === Constants ===
const STORAGE_KEY = 'tc-items';
const BACKUP_KEY = 'tc-items-backup';
const SCHEMA_VERSION = 1;
const LABELS = ['15min', 'browse'];
const STATUSES = ['active', 'waiting', 'done'];
const TIME_STATES = ['due-by', 'open', 'recurring'];
const RECURRENCE_RULES = ['daily', 'weekly', 'monthly'];
const ACTIVE_WINDOW_DAYS = 10;
const STALE_DAYS = 14;
const DAY_MS = 86400000;
const MAX_UNDO = 20;
const PURGE_DAYS = 90;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

// === Date Utilities ===
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function getWeekStart(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // Mon=0
  return addDays(dateStr, -diff);
}

function dayName(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en', { weekday: 'short' });
}

function dayNum(dateStr) {
  return parseInt(dateStr.split('-')[2], 10);
}

function computeNextDue(dueDate, rule) {
  if (!DATE_RE.test(dueDate)) return addDays(todayStr(), 1);
  const [y, m, d] = dueDate.split('-').map(Number);
  const validRule = RECURRENCE_RULES.includes(rule) ? rule : 'daily';

  let nextY = y, nextM = m, nextD = d;

  if (validRule === 'daily') {
    return addDays(dueDate, 1);
  } else if (validRule === 'weekly') {
    return addDays(dueDate, 7);
  } else if (validRule === 'monthly') {
    nextM += 1;
    if (nextM > 12) { nextM = 1; nextY += 1; }
    const lastDay = new Date(nextY, nextM, 0).getDate();
    nextD = Math.min(d, lastDay);
    return `${nextY}-${String(nextM).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;
  }
  return addDays(dueDate, 1);
}

function formatCountdown(dueDate) {
  if (!dueDate) return null;
  const today = todayStr();
  // Lexicographic comparison for YYYY-MM-DD
  if (dueDate < today) {
    const [ty, tm, td] = today.split('-').map(Number);
    const [dy, dm, dd] = dueDate.split('-').map(Number);
    const todayMs = new Date(ty, tm - 1, td).getTime();
    const dueMs = new Date(dy, dm - 1, dd).getTime();
    const days = Math.round((todayMs - dueMs) / DAY_MS);
    return { text: days === 1 ? '1d overdue' : `${days}d overdue`, cls: 'overdue' };
  } else if (dueDate === today) {
    return { text: 'Due today', cls: 'due-soon' };
  } else {
    const [ty, tm, td] = today.split('-').map(Number);
    const [dy, dm, dd] = dueDate.split('-').map(Number);
    const todayMs = new Date(ty, tm - 1, td).getTime();
    const dueMs = new Date(dy, dm - 1, dd).getTime();
    const days = Math.round((dueMs - todayMs) / DAY_MS);
    if (days === 1) return { text: 'Due tomorrow', cls: 'due-soon' };
    if (days <= 3) return { text: `${days}d left`, cls: 'due-soon' };
    return { text: `${days}d left`, cls: 'due-later' };
  }
}

function formatDateTime(dateTime) {
  if (!dateTime) return '';
  try {
    const dt = new Date(dateTime);
    if (isNaN(dt.getTime())) return dateTime;
    return dt.toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return dateTime; }
}

// === DOM Helper ===
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.dataset) Object.assign(node.dataset, props.dataset);
  if (props.text) node.textContent = props.text;
  if (props.htmlFor) node.htmlFor = props.htmlFor;
  if (props.type) node.type = props.type;
  if (props.ariaLabel) node.setAttribute('aria-label', props.ariaLabel);
  if (props.role) node.setAttribute('role', props.role);
  if (props.id) node.id = props.id;
  if (props.style) node.style.cssText = props.style;
  if (props.disabled) node.disabled = true;
  if (props.checked) node.checked = true;
  if (props.value !== undefined) node.value = props.value;
  if (props.placeholder) node.placeholder = props.placeholder;
  if (props.maxlength) node.maxLength = props.maxlength;
  if (props.autocomplete) node.autocomplete = props.autocomplete;
  if (props.required) node.required = true;
  if (props.selected) node.selected = true;
  for (const c of children) {
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

// legacy/rare — for data-* IDs/enums only, never user-typed text
function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// === Pure Utility Functions ===
function isBlocked(task) {
  if (!task.dependsOn || task.dependsOn.length === 0) return false;
  return task.dependsOn.some(depId => {
    const dep = items.find(i => i.id === depId);
    return dep && dep.status !== 'done';
  });
}

function canComplete(task) {
  if (isBlocked(task)) return false;
  if (task.subtasks && task.subtasks.some(s => !s.done)) return false;
  return true;
}

function isStale(task) {
  return task.type === 'task' &&
    task.timeState === 'open' &&
    task.status === 'active' &&
    (Date.now() - task.updatedAt) > STALE_DAYS * DAY_MS;
}

function isRecurringTask(task) {
  return task.type === 'task' && task.timeState === 'recurring';
}

// === Status Transition Gatekeeper ===
function transitionStatus(task, nextStatus) {
  if (!STATUSES.includes(nextStatus)) return false;
  if (nextStatus === 'done' && !canComplete(task)) return false;
  task.status = nextStatus;
  task.updatedAt = Date.now();
  return true;
}

// === Validation ===
function validateItem(item) {
  if (!item || typeof item !== 'object') return null;

  const now = Date.now();

  // Events
  if (item.type === 'event') {
    if (typeof item.title !== 'string' || !item.title.trim()) return null;
    if (typeof item.dateTime !== 'string' || !DATETIME_RE.test(item.dateTime) || isNaN(Date.parse(item.dateTime))) return null;
    return {
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      type: 'event',
      title: item.title.trim().slice(0, 500),
      dateTime: item.dateTime,
      location: typeof item.location === 'string' ? item.location.trim().slice(0, 500) : '',
      notes: typeof item.notes === 'string' ? item.notes.trim().slice(0, 2000) : '',
      createdAt: typeof item.createdAt === 'number' && item.createdAt > 0 ? item.createdAt : now,
    };
  }

  // Tasks
  if (item.type === 'task') {
    if (typeof item.title !== 'string' || !item.title.trim()) return null;

    const timeState = TIME_STATES.includes(item.timeState) ? item.timeState : 'open';
    const status = STATUSES.includes(item.status) ? item.status : 'active';
    const createdAt = typeof item.createdAt === 'number' && item.createdAt > 0 ? item.createdAt : now;
    const updatedAt = typeof item.updatedAt === 'number' && item.updatedAt > 0 ? item.updatedAt : createdAt;

    // Date validation: strict format only
    let dueDate = (typeof item.dueDate === 'string' && DATE_RE.test(item.dueDate)) ? item.dueDate : null;
    let activationDate = (typeof item.activationDate === 'string' && DATE_RE.test(item.activationDate)) ? item.activationDate : null;

    // Recurring tasks require dueDate
    if (timeState === 'recurring' && !dueDate) {
      dueDate = todayStr();
    }

    // Due-by tasks: auto-set activationDate if missing
    if (timeState === 'due-by' && dueDate && !activationDate) {
      activationDate = addDays(dueDate, -ACTIVE_WINDOW_DAYS);
      const today = todayStr();
      if (activationDate < today) activationDate = today;
    }

    // Clamp: activationDate must not exceed dueDate
    if (activationDate && dueDate && activationDate > dueDate) {
      activationDate = dueDate;
    }

    const recurrenceRule = RECURRENCE_RULES.includes(item.recurrenceRule) ? item.recurrenceRule : null;
    const labels = Array.isArray(item.labels) ? item.labels.filter(l => LABELS.includes(l)) : [];
    const subtasks = Array.isArray(item.subtasks) ? item.subtasks
      .filter(s => s && typeof s.text === 'string' && s.text.trim())
      .map(s => ({
        id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
        text: s.text.trim().slice(0, 500),
        done: !!s.done,
      })) : [];
    const dependsOn = Array.isArray(item.dependsOn) ? item.dependsOn.filter(d => typeof d === 'string') : [];
    const linkedEvent = typeof item.linkedEvent === 'string' ? item.linkedEvent : null;

    return {
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      type: 'task',
      title: item.title.trim().slice(0, 500),
      timeState,
      status,
      dueDate,
      activationDate,
      recurrenceRule,
      subtasks,
      dependsOn,
      linkedEvent,
      labels,
      createdAt,
      updatedAt,
    };
  }

  return null; // Unknown type
}

// === Persistence ===
function isValidEnvelope(parsed) {
  return parsed && typeof parsed === 'object' && typeof parsed.version === 'number' && Array.isArray(parsed.items);
}

function loadItems() {
  let loadedItems = [];
  let needsToast = null;

  // 1. Try primary
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidEnvelope(parsed)) {
        loadedItems = parsed.items.map(validateItem).filter(Boolean);
        return { items: loadedItems, toast: needsToast };
      }
    }
  } catch { /* fall through */ }

  // 2. Try backup
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidEnvelope(parsed)) {
        loadedItems = parsed.items.map(validateItem).filter(Boolean);
        needsToast = 'Recovered from backup';
        return { items: loadedItems, toast: needsToast };
      }
    }
  } catch { /* fall through */ }

  // 3. Try legacy migration
  try {
    const raw = localStorage.getItem('catppuccin-todos');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        loadedItems = migrateFromV0(parsed);
        // Clean up old keys
        try { localStorage.removeItem('catppuccin-todos'); } catch { /* ok */ }
        try { localStorage.removeItem('catppuccin-categories'); } catch { /* ok */ }
        needsToast = 'Migrated your tasks to the new format';
        return { items: loadedItems, toast: needsToast };
      }
    }
  } catch { /* fall through */ }

  // 4. Check if primary key existed but was corrupted
  if (localStorage.getItem(STORAGE_KEY) !== null || localStorage.getItem(BACKUP_KEY) !== null) {
    needsToast = 'Data was corrupted — starting fresh';
  }

  return { items: [], toast: needsToast };
}

function migrateFromV0(oldTodos) {
  const today = todayStr();
  const cutoff = addDays(today, -30);

  return oldTodos
    .filter(item => item && typeof item.text === 'string' && item.text.trim())
    .map(item => {
      // Try to parse legacy date
      let dueDate = null;
      if (item.dueDate && typeof item.dueDate === 'string') {
        // Try parsing to canonical YYYY-MM-DD
        if (DATE_RE.test(item.dueDate)) {
          dueDate = item.dueDate;
        } else {
          try {
            const d = new Date(item.dueDate);
            if (!isNaN(d.getTime())) {
              dueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
          } catch { /* treat as dateless */ }
        }
      }

      const hasDueDate = dueDate !== null;
      const timeState = hasDueDate ? 'due-by' : 'open';
      let status = item.completed ? 'done' : 'active';

      // Ancient overdue due-by tasks: mark done
      if (hasDueDate && status === 'active' && dueDate < cutoff) {
        status = 'done';
      }

      let activationDate = null;
      if (hasDueDate && status !== 'done') {
        activationDate = addDays(dueDate, -ACTIVE_WINDOW_DAYS);
        if (activationDate < today) activationDate = today;
      }

      const now = Date.now();
      const createdAt = typeof item.createdAt === 'number' ? item.createdAt : now;

      const migrated = {
        id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
        type: 'task',
        title: item.text.trim().slice(0, 500),
        timeState,
        status,
        dueDate,
        activationDate,
        recurrenceRule: null,
        subtasks: [],
        dependsOn: [],
        linkedEvent: null,
        labels: [],
        createdAt,
        updatedAt: createdAt,
      };

      return validateItem(migrated);
    })
    .filter(Boolean);
}

function saveItems() {
  // Auto-purge: drop done items older than PURGE_DAYS
  const now = Date.now();
  items = items.filter(item =>
    item.status !== 'done' || (now - item.updatedAt) <= PURGE_DAYS * DAY_MS
  );

  const envelope = JSON.stringify({ version: SCHEMA_VERSION, items });
  try {
    const previous = localStorage.getItem(STORAGE_KEY);
    if (previous) {
      try { localStorage.setItem(BACKUP_KEY, previous); } catch { /* skip */ }
    }
    localStorage.setItem(STORAGE_KEY, envelope);
  } catch {
    showToast("Couldn't save — storage full. Edits may be lost after reload.");
  }
}

function cleanOrphanDependencies() {
  const ids = new Set(items.map(i => i.id));
  for (const item of items) {
    if (item.dependsOn && item.dependsOn.length > 0) {
      item.dependsOn = item.dependsOn.filter(id => ids.has(id));
    }
  }
}

// === State ===
let items = [];
let currentView = 'calendar';
let selectedDate = todayStr();
let weekStart = getWeekStart(todayStr());
let editingId = null;
let createFormType = null; // null, 'event', 'task'
let undoStack = [];
let toastTimer = null;
let pendingDeleteId = null;
let searchQuery = '';

// === Composable Filter Predicates ===
const allPreds = (...preds) => (item) => preds.every(p => p(item));
const anyPred = (...preds) => (item) => preds.some(p => p(item));

const isTask      = (item) => item.type === 'task';
const isEvent     = (item) => item.type === 'event';
const isDone      = (item) => item.status === 'done';
const notDone     = (item) => item.status !== 'done';
const isActiveish = (item) => item.status === 'active' || item.status === 'waiting';
const isDueBy     = (item) => item.timeState === 'due-by';
const isOpen      = (item) => item.timeState === 'open';
const isRecurring = (item) => item.timeState === 'recurring';
const hasLabel    = (l) => (item) => (item.labels || []).includes(l);
const onDate      = (d) => (item) => item.dueDate === d || (item.dateTime || '').startsWith(d);
const inWindow    = (today, windowEnd) => (item) =>
  item.activationDate <= today && item.dueDate >= today && item.dueDate <= windowEnd;
const isOverdue   = (today) => (item) => item.dueDate && item.dueDate < today;
const recurringDue = (today) => (item) => item.dueDate && item.dueDate <= today;

function getViewItems(viewName) {
  const today = todayStr();
  const windowEnd = addDays(today, ACTIVE_WINDOW_DAYS);

  const VIEWS = {
    calendar:  onDate(selectedDate),
    active:    allPreds(isTask, isDueBy, isActiveish, inWindow(today, windowEnd)),
    overdue:   allPreds(isTask, isDueBy, isActiveish, isOverdue(today)),
    browse:    allPreds(isTask, isActiveish, anyPred(isOpen, hasLabel('browse'), hasLabel('15min'))),
    recurring: allPreds(isTask, isRecurring, recurringDue(today), notDone),
    done:      isDone,
    all:       () => true,
  };

  const filter = VIEWS[viewName];
  if (!filter) return [];
  let result = items.filter(filter);

  // Apply search for All view
  if (viewName === 'all' && searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(item => item.title.toLowerCase().includes(q));
  }

  // Sort per view
  result = sortForView(result, viewName, today);

  // Cap Done at 50
  if (viewName === 'done') {
    result = result.slice(0, 50);
  }

  return result;
}

function sortForView(arr, viewName, today) {
  const sorted = [...arr];
  switch (viewName) {
    case 'calendar':
      sorted.sort((a, b) => {
        if (a.type === 'event' && b.type !== 'event') return -1;
        if (a.type !== 'event' && b.type === 'event') return 1;
        if (a.type === 'event' && b.type === 'event') return (a.dateTime || '').localeCompare(b.dateTime || '');
        return a.createdAt - b.createdAt;
      });
      break;
    case 'active':
      sorted.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '') || (a.activationDate || '').localeCompare(b.activationDate || '') || a.createdAt - b.createdAt);
      break;
    case 'overdue':
      sorted.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
      break;
    case 'browse':
      sorted.sort((a, b) => {
        const a15 = (a.labels || []).includes('15min') ? 0 : 1;
        const b15 = (b.labels || []).includes('15min') ? 0 : 1;
        if (a15 !== b15) return a15 - b15;
        const ad = a.dueDate || '\uffff';
        const bd = b.dueDate || '\uffff';
        if (ad !== bd) return ad.localeCompare(bd);
        return a.createdAt - b.createdAt;
      });
      break;
    case 'recurring':
      sorted.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '') || a.title.localeCompare(b.title));
      break;
    case 'done':
      sorted.sort((a, b) => b.updatedAt - a.updatedAt);
      break;
    case 'all':
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
  }
  return sorted;
}

// === Mutation ===
function mutate(label, fn) {
  const before = JSON.stringify(items);
  const changed = fn();
  if (!changed) return;
  undoStack.push({ label, snapshot: before });
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  saveItems();
  render();
}

function undo() {
  const last = undoStack.pop();
  if (!last) return;
  items = JSON.parse(last.snapshot);
  saveItems();
  render();
  showToast(`Undid: ${last.label}`);
}

// === Toast ===
function showToast(message, showUndoBtn = false) {
  dismissToast();
  const container = document.getElementById('toast-container');
  const toast = el('div', { className: 'toast' }, [
    el('span', { className: 'toast-message', text: message }),
  ]);
  if (showUndoBtn) {
    const undoBtn = el('button', { className: 'toast-undo-btn', text: 'Undo' });
    undoBtn.addEventListener('click', undo);
    toast.appendChild(undoBtn);
  }
  container.innerHTML = '';
  container.appendChild(toast);
  toastTimer = setTimeout(() => dismissToast(), 5000);
}

function dismissToast() {
  clearTimeout(toastTimer);
  const container = document.getElementById('toast-container');
  const toast = container.querySelector('.toast');
  if (toast) {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => {
      container.innerHTML = '';
    }, { once: true });
  }
}

// === CRUD: Create ===
function createEvent(formData) {
  mutate('Event created', () => {
    items.push({
      id: crypto.randomUUID(),
      type: 'event',
      title: formData.title.trim().slice(0, 500),
      dateTime: formData.dateTime,
      location: (formData.location || '').trim().slice(0, 500),
      notes: (formData.notes || '').trim().slice(0, 2000),
      createdAt: Date.now(),
    });
    return true;
  });
  showToast('Event created', true);
}

function createTask(formData) {
  const today = todayStr();
  let dueDate = formData.dueDate || null;
  let activationDate = formData.activationDate || null;
  const timeState = TIME_STATES.includes(formData.timeState) ? formData.timeState : 'open';

  if (timeState === 'recurring' && !dueDate) {
    dueDate = today;
  }

  if (timeState === 'due-by' && dueDate && !activationDate) {
    activationDate = addDays(dueDate, -ACTIVE_WINDOW_DAYS);
    if (activationDate < today) activationDate = today;
  }

  if (activationDate && dueDate && activationDate > dueDate) {
    activationDate = dueDate;
  }

  const recurrenceRule = timeState === 'recurring' && RECURRENCE_RULES.includes(formData.recurrenceRule)
    ? formData.recurrenceRule : null;
  const labels = Array.isArray(formData.labels) ? formData.labels.filter(l => LABELS.includes(l)) : [];
  const subtasks = Array.isArray(formData.subtasks) ? formData.subtasks
    .filter(s => s && s.text && s.text.trim())
    .map(s => ({ id: crypto.randomUUID(), text: s.text.trim().slice(0, 500), done: false })) : [];

  const now = Date.now();
  mutate('Task created', () => {
    items.push({
      id: crypto.randomUUID(),
      type: 'task',
      title: formData.title.trim().slice(0, 500),
      timeState,
      status: 'active',
      dueDate,
      activationDate,
      recurrenceRule,
      subtasks,
      dependsOn: [],
      linkedEvent: null,
      labels,
      createdAt: now,
      updatedAt: now,
    });
    return true;
  });
  showToast('Task created', true);
}

// === CRUD: Toggle / Complete ===
function toggleItem(id) {
  const item = items.find(i => i.id === id);
  if (!item || item.type !== 'task') return;

  // Done tasks use reopenItem() via the Reopen button, not checkboxes
  if (item.status === 'done') return;

  if (isRecurringTask(item)) {
    completeRecurringInstance(item);
    return;
  }

  if (!canComplete(item)) {
    if (isBlocked(item)) {
      showToast('Can\'t complete — blocked by dependencies');
    } else {
      showToast('Can\'t complete — finish subtasks first');
    }
    return;
  }

  mutate('Task completed', () => transitionStatus(item, 'done'));
  showToast('Task completed', true);
}

function completeRecurringInstance(task) {
  mutate('Complete recurring task', () => {
    if (!transitionStatus(task, 'done')) return false;
    createNextRecurringInstance(task);
    return true;
  });
  if (task.status === 'done') {
    showToast('Recurring task completed — next occurrence created', true);
  }
}

function createNextRecurringInstance(task) {
  const nextDue = computeNextDue(task.dueDate, task.recurrenceRule);
  const now = Date.now();
  items.push({
    id: crypto.randomUUID(),
    type: 'task',
    title: task.title,
    timeState: 'recurring',
    status: 'active',
    dueDate: nextDue,
    activationDate: null,
    recurrenceRule: task.recurrenceRule,
    subtasks: (task.subtasks || []).map(s => ({ id: crypto.randomUUID(), text: s.text, done: false })),
    dependsOn: [],
    linkedEvent: null,
    labels: [...(task.labels || [])],
    createdAt: now,
    updatedAt: now,
  });
}

// === CRUD: Delete ===
function requestDelete(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  pendingDeleteId = id;
  const dialog = document.getElementById('delete-dialog');
  const text = document.getElementById('delete-dialog-text');
  const preview = item.title.length > 60 ? item.title.slice(0, 60) + '...' : item.title;
  text.textContent = `"${preview}"`;
  dialog.showModal();
}

function confirmDelete() {
  const id = pendingDeleteId;
  pendingDeleteId = null;
  document.getElementById('delete-dialog').close();

  const item = items.find(i => i.id === id);
  if (!item) {
    showToast('Item already deleted');
    return;
  }

  const title = item.title;
  mutate('Item deleted', () => {
    items = items.filter(i => i.id !== id);
    // If event: clear linkedEvent on tasks
    if (item.type === 'event') {
      items.forEach(i => { if (i.linkedEvent === id) i.linkedEvent = null; });
    }
    // If task: remove from dependsOn
    if (item.type === 'task') {
      items.forEach(i => {
        if (i.dependsOn) i.dependsOn = i.dependsOn.filter(d => d !== id);
      });
    }
    return true;
  });
  const preview = title.length > 30 ? title.slice(0, 30) + '...' : title;
  showToast(`Deleted "${preview}"`, true);
}

function cancelDelete() {
  pendingDeleteId = null;
  document.getElementById('delete-dialog').close();
}

// === CRUD: Edit (Save) ===
function focusEditButton(id) {
  // After render, return focus to the item's edit button
  setTimeout(() => {
    const btn = document.querySelector(`[data-id="${escapeAttr(id)}"] .edit-btn`);
    if (btn) btn.focus();
  }, 0);
}

function saveTaskEdit(id, formData) {
  const task = items.find(i => i.id === id);
  if (!task || task.type !== 'task') return;

  mutate('Task updated', () => {
    task.title = formData.title.trim().slice(0, 500);
    task.timeState = TIME_STATES.includes(formData.timeState) ? formData.timeState : task.timeState;

    // Dates
    task.dueDate = (formData.dueDate && DATE_RE.test(formData.dueDate)) ? formData.dueDate : null;
    task.activationDate = (formData.activationDate && DATE_RE.test(formData.activationDate)) ? formData.activationDate : null;

    if (task.timeState === 'recurring' && !task.dueDate) task.dueDate = todayStr();
    if (task.timeState === 'due-by' && task.dueDate && !task.activationDate) {
      task.activationDate = addDays(task.dueDate, -ACTIVE_WINDOW_DAYS);
      const today = todayStr();
      if (task.activationDate < today) task.activationDate = today;
    }
    if (task.activationDate && task.dueDate && task.activationDate > task.dueDate) {
      task.activationDate = task.dueDate;
    }

    task.recurrenceRule = (task.timeState === 'recurring' && RECURRENCE_RULES.includes(formData.recurrenceRule))
      ? formData.recurrenceRule : null;
    task.labels = Array.isArray(formData.labels) ? formData.labels.filter(l => LABELS.includes(l)) : [];

    // Subtasks
    if (Array.isArray(formData.subtasks)) {
      task.subtasks = formData.subtasks
        .filter(s => s && s.text && s.text.trim())
        .map(s => ({
          id: s.id || crypto.randomUUID(),
          text: s.text.trim().slice(0, 500),
          done: !!s.done,
        }));
    }

    task.updatedAt = Date.now();

    // Status transition (transitionStatus also sets updatedAt on success)
    if (formData.status && formData.status !== task.status) {
      if (!transitionStatus(task, formData.status)) {
        showToast('Status kept as ' + task.status + ' — other changes saved');
      }
    }

    return true;
  });
  editingId = null;
  render();
  focusEditButton(id);
}

function saveEventEdit(id, formData) {
  const event = items.find(i => i.id === id);
  if (!event || event.type !== 'event') return;

  mutate('Event updated', () => {
    event.title = formData.title.trim().slice(0, 500);
    event.dateTime = formData.dateTime || event.dateTime;
    event.location = (formData.location || '').trim().slice(0, 500);
    event.notes = (formData.notes || '').trim().slice(0, 2000);
    return true;
  });
  editingId = null;
  render();
  focusEditButton(id);
}

// === Reopen (Done view) ===
function reopenItem(id) {
  const item = items.find(i => i.id === id);
  if (!item || item.type !== 'task') return;

  if (isRecurringTask(item)) {
    showToast("Can't reopen recurring tasks — create a new one instead");
    return;
  }

  mutate('Task reopened', () => {
    if (item.timeState === 'due-by') {
      item.activationDate = todayStr();
    }
    return transitionStatus(item, 'active');
  });
  showToast('Task reopened', true);
}

// === Rendering ===
function render() {
  renderViewNav();
  renderCreateToggle();

  const content = document.getElementById('content');
  content.innerHTML = '';
  content.setAttribute('role', 'tabpanel');

  if (currentView === 'calendar') {
    content.appendChild(renderWeekStrip());
  }

  if (currentView === 'all') {
    content.appendChild(renderSearchBar());
  }

  // For Active view, render both Overdue and Active sections
  if (currentView === 'active') {
    const overdueItems = getViewItems('overdue');
    if (overdueItems.length > 0) {
      const section = el('section', { className: 'overdue-section' }, [
        el('h2', { className: 'section-heading overdue-heading', text: 'Overdue' }),
      ]);
      const list = el('ul', { className: 'item-list' });
      overdueItems.forEach(item => list.appendChild(renderItemCard(item)));
      section.appendChild(list);
      content.appendChild(section);
    }

    const activeItems = getViewItems('active');
    const heading = el('h2', { className: 'section-heading', text: overdueItems.length > 0 ? 'Active Window' : '' });
    if (heading.textContent) content.appendChild(heading);

    if (activeItems.length === 0 && overdueItems.length === 0) {
      content.appendChild(renderEmptyState());
    } else {
      const list = el('ul', { className: 'item-list' });
      activeItems.forEach(item => list.appendChild(renderItemCard(item)));
      content.appendChild(list);
    }
  } else {
    const viewItems = getViewItems(currentView);
    if (viewItems.length === 0) {
      content.appendChild(renderEmptyState());
    } else {
      const readOnly = currentView === 'done' || currentView === 'all';
      const list = el('ul', { className: 'item-list' });
      viewItems.forEach(item => list.appendChild(renderItemCard(item, { readOnly })));
      content.appendChild(list);
    }
  }

  // Only re-render the create form when the form type changes, not on every render().
  // This preserves user input (title, dates, selects) during renders triggered by
  // other actions like timeState select changes or unrelated state updates.
  const formContainer = document.getElementById('create-form-container');
  const currentFormType = formContainer.dataset.formType || null;
  if (createFormType && createFormType !== currentFormType) {
    formContainer.dataset.formType = createFormType;
    renderCreateForm();
  } else if (!createFormType) {
    formContainer.innerHTML = '';
    delete formContainer.dataset.formType;
  }

  // Item count in header
  const taskCount = document.getElementById('task-count');
  const activeCount = items.filter(i => i.type === 'task' && i.status !== 'done').length;
  taskCount.textContent = `${activeCount} active`;
}

function renderViewNav() {
  const nav = document.getElementById('view-nav');
  nav.innerHTML = '';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Views');

  const views = [
    { key: 'calendar', label: 'Calendar' },
    { key: 'active', label: 'Active' },
    { key: 'browse', label: 'Browse' },
    { key: 'recurring', label: 'Recurring' },
    { key: 'done', label: 'Done' },
    { key: 'all', label: 'All' },
  ];

  views.forEach(v => {
    const btn = el('button', {
      className: `view-tab${v.key === currentView ? ' active' : ''}`,
      text: v.label,
      role: 'tab',
      ariaLabel: v.label,
    });
    btn.setAttribute('aria-selected', v.key === currentView ? 'true' : 'false');
    btn.dataset.view = v.key;
    btn.addEventListener('click', () => {
      currentView = v.key;
      editingId = null;
      render();
    });
    nav.appendChild(btn);
  });
}

function renderCreateToggle() {
  const container = document.getElementById('create-toggle');
  container.innerHTML = '';

  const eventBtn = el('button', { className: 'create-btn', text: 'New Event' });
  eventBtn.addEventListener('click', () => {
    createFormType = createFormType === 'event' ? null : 'event';
    render();
  });

  const taskBtn = el('button', { className: 'create-btn', text: 'New Task' });
  taskBtn.addEventListener('click', () => {
    createFormType = createFormType === 'task' ? null : 'task';
    render();
  });

  container.appendChild(eventBtn);
  container.appendChild(taskBtn);
}

function renderCreateForm() {
  const existing = document.getElementById('create-form-container');
  existing.innerHTML = '';

  if (createFormType === 'event') {
    existing.appendChild(buildEventForm());
  } else if (createFormType === 'task') {
    existing.appendChild(buildTaskForm());
  }
}

function buildEventForm() {
  const form = el('div', { className: 'create-form' });

  const titleInput = el('input', { type: 'text', placeholder: 'Event title', maxlength: 500, required: true, autocomplete: 'off' });
  titleInput.setAttribute('aria-label', 'Event title');

  const dateTimeInput = el('input', { type: 'datetime-local' });
  dateTimeInput.setAttribute('aria-label', 'Event date and time');

  const locationInput = el('input', { type: 'text', placeholder: 'Location (optional)', maxlength: 500, autocomplete: 'off' });
  locationInput.setAttribute('aria-label', 'Event location');

  const notesInput = el('textarea', { placeholder: 'Notes (optional)', maxlength: 2000 });
  notesInput.setAttribute('aria-label', 'Event notes');
  notesInput.rows = 2;

  const actions = el('div', { className: 'form-actions' });
  const cancelBtn = el('button', { className: 'btn-cancel', text: 'Cancel' });
  cancelBtn.addEventListener('click', () => { createFormType = null; render(); });
  const submitBtn = el('button', { className: 'btn-primary', text: 'Create Event' });
  submitBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    if (!title) { titleInput.focus(); return; }
    const dateTime = dateTimeInput.value;
    if (!dateTime) { dateTimeInput.focus(); return; }
    createEvent({ title, dateTime, location: locationInput.value, notes: notesInput.value });
    createFormType = null;
    render();
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);
  form.append(titleInput, dateTimeInput, locationInput, notesInput, actions);

  setTimeout(() => titleInput.focus(), 0);
  return form;
}

function buildTaskForm() {
  const form = el('div', { className: 'create-form' });

  const titleInput = el('input', { type: 'text', placeholder: 'Task title', maxlength: 500, required: true, autocomplete: 'off' });
  titleInput.setAttribute('aria-label', 'Task title');

  const timeStateSelect = el('select');
  timeStateSelect.setAttribute('aria-label', 'Time state');
  TIME_STATES.forEach(ts => {
    const opt = el('option', { value: ts, text: ts === 'due-by' ? 'Due by' : ts === 'open' ? 'Open' : 'Recurring' });
    timeStateSelect.appendChild(opt);
  });
  timeStateSelect.value = 'open';

  const dueDateInput = el('input', { type: 'date' });
  dueDateInput.setAttribute('aria-label', 'Due date');
  const dueDateRow = el('div', { className: 'form-row conditional', id: 'due-date-row' }, [
    el('label', { text: 'Due date' }),
    dueDateInput,
  ]);

  const activationDateInput = el('input', { type: 'date' });
  activationDateInput.setAttribute('aria-label', 'Activation date');
  const activationDateRow = el('div', { className: 'form-row conditional', id: 'activation-date-row' }, [
    el('label', { text: 'Starts surfacing' }),
    activationDateInput,
  ]);

  const recurrenceSelect = el('select');
  recurrenceSelect.setAttribute('aria-label', 'Recurrence rule');
  RECURRENCE_RULES.forEach(r => {
    recurrenceSelect.appendChild(el('option', { value: r, text: r.charAt(0).toUpperCase() + r.slice(1) }));
  });
  const recurrenceRow = el('div', { className: 'form-row conditional', id: 'recurrence-row' }, [
    el('label', { text: 'Repeats' }),
    recurrenceSelect,
  ]);

  // Labels
  const labelsRow = el('div', { className: 'form-row label-row' });
  const selectedLabels = new Set();
  LABELS.forEach(l => {
    const chip = el('button', { className: 'label-chip', text: l, type: 'button' });
    chip.addEventListener('click', () => {
      if (selectedLabels.has(l)) { selectedLabels.delete(l); chip.classList.remove('active'); }
      else { selectedLabels.add(l); chip.classList.add('active'); }
    });
    labelsRow.appendChild(chip);
  });

  // Subtasks
  const subtaskList = el('div', { className: 'subtask-list', id: 'create-subtask-list' });
  const subtaskInput = el('input', { type: 'text', placeholder: 'Add subtask...', maxlength: 500, autocomplete: 'off' });
  subtaskInput.setAttribute('aria-label', 'Add subtask');
  subtaskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = subtaskInput.value.trim();
      if (!text) return;
      const item = el('div', { className: 'subtask-entry' }, [
        el('span', { text, className: 'subtask-text' }),
        (() => {
          const btn = el('button', { className: 'subtask-remove', text: '\u00d7', type: 'button', ariaLabel: 'Remove subtask' });
          btn.addEventListener('click', () => item.remove());
          return btn;
        })(),
      ]);
      subtaskList.appendChild(item);
      subtaskInput.value = '';
    }
  });

  // Conditional field visibility
  function updateConditionalFields() {
    const ts = timeStateSelect.value;
    dueDateRow.style.display = ts === 'open' ? 'none' : '';
    activationDateRow.style.display = ts === 'due-by' ? '' : 'none';
    recurrenceRow.style.display = ts === 'recurring' ? '' : 'none';
  }
  timeStateSelect.addEventListener('change', updateConditionalFields);
  updateConditionalFields();

  const actions = el('div', { className: 'form-actions' });
  const cancelBtn = el('button', { className: 'btn-cancel', text: 'Cancel' });
  cancelBtn.addEventListener('click', () => { createFormType = null; render(); });
  const submitBtn = el('button', { className: 'btn-primary', text: 'Create Task' });
  submitBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    if (!title) { titleInput.focus(); return; }

    const subtasks = [...subtaskList.querySelectorAll('.subtask-entry')].map(entry => ({
      text: entry.querySelector('.subtask-text').textContent,
    }));

    createTask({
      title,
      timeState: timeStateSelect.value,
      dueDate: dueDateInput.value || null,
      activationDate: activationDateInput.value || null,
      recurrenceRule: recurrenceSelect.value,
      labels: [...selectedLabels],
      subtasks,
    });
    createFormType = null;
    render();
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);
  form.append(titleInput, timeStateSelect, dueDateRow, activationDateRow, recurrenceRow, labelsRow,
    el('div', { className: 'subtask-section' }, [subtaskList, subtaskInput]),
    actions);

  setTimeout(() => titleInput.focus(), 0);
  return form;
}

// === Week Strip (Calendar) ===
function renderWeekStrip() {
  const strip = el('div', { className: 'week-strip' });
  const today = todayStr();

  const prevBtn = el('button', { className: 'week-nav', text: '\u2039', ariaLabel: 'Previous week' });
  prevBtn.addEventListener('click', () => { weekStart = addDays(weekStart, -7); render(); });

  const nextBtn = el('button', { className: 'week-nav', text: '\u203a', ariaLabel: 'Next week' });
  nextBtn.addEventListener('click', () => { weekStart = addDays(weekStart, 7); render(); });

  const days = el('div', { className: 'week-days' });
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const isToday = d === today;
    const isSelected = d === selectedDate;
    const hasItems = items.some(onDate(d));

    const dayCell = el('button', {
      className: `week-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`,
      ariaLabel: `${dayName(d)} ${dayNum(d)}${isToday ? ' (today)' : ''}`,
    }, [
      el('span', { className: 'week-day-name', text: dayName(d) }),
      el('span', { className: 'week-day-num', text: String(dayNum(d)) }),
      hasItems ? el('span', { className: 'week-day-dot' }) : document.createTextNode(''),
    ]);

    dayCell.addEventListener('click', () => { selectedDate = d; render(); });
    days.appendChild(dayCell);
  }

  strip.append(prevBtn, days, nextBtn);
  return strip;
}

// === Search Bar (All view) ===
function renderSearchBar() {
  const bar = el('div', { className: 'search-bar' });
  const input = el('input', { type: 'text', placeholder: 'Search by title...', autocomplete: 'off', value: searchQuery });
  input.setAttribute('aria-label', 'Search items');
  input.addEventListener('input', () => {
    searchQuery = input.value;
    // Re-render just the list, not the search bar itself
    const content = document.getElementById('content');
    const existingList = content.querySelector('.item-list');
    if (existingList) existingList.remove();
    const emptyState = content.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const viewItems = getViewItems('all');
    if (viewItems.length === 0) {
      content.appendChild(renderEmptyState());
    } else {
      const list = el('ul', { className: 'item-list' });
      viewItems.forEach(item => list.appendChild(renderItemCard(item, { readOnly: true })));
      content.appendChild(list);
    }
  });
  bar.appendChild(input);
  return bar;
}

// === Item Cards ===
function renderItemCard(item, opts = {}) {
  if (editingId === item.id && !opts.readOnly) {
    return item.type === 'event' ? renderEventEditForm(item) : renderTaskEditForm(item);
  }
  return item.type === 'event' ? renderEventCard(item, opts) : renderTaskCard(item, opts);
}

function renderEventCard(event, opts = {}) {
  const card = el('li', { className: 'item-card event-card', dataset: { id: event.id, type: 'event' } });

  const content = el('div', { className: 'item-content' }, [
    el('span', { className: 'item-title', text: event.title }),
  ]);

  const meta = el('div', { className: 'item-meta' });
  if (event.dateTime) {
    meta.appendChild(el('span', { className: 'event-time', text: formatDateTime(event.dateTime) }));
  }
  if (event.location) {
    meta.appendChild(el('span', { className: 'event-location', text: event.location }));
  }
  if (event.notes) {
    meta.appendChild(el('span', { className: 'event-notes', text: event.notes }));
  }
  if (meta.childNodes.length > 0) content.appendChild(meta);

  card.appendChild(content);

  if (!opts.readOnly) {
    const actions = el('div', { className: 'item-actions' });
    const editBtn = el('button', { className: 'edit-btn', ariaLabel: `Edit ${event.title}` });
    editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
    editBtn.addEventListener('click', () => { editingId = event.id; render(); });

    const deleteBtn = el('button', { className: 'delete-btn', ariaLabel: `Delete ${event.title}` });
    deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    deleteBtn.addEventListener('click', () => requestDelete(event.id));

    actions.append(editBtn, deleteBtn);
    card.appendChild(actions);
  }

  return card;
}

function renderTaskCard(task, opts = {}) {
  const card = el('li', { className: `item-card task-card${task.status === 'done' ? ' completed' : ''}`, dataset: { id: task.id, type: 'task' } });

  const blocked = isBlocked(task);
  const completable = canComplete(task);
  const isDoneView = currentView === 'done';

  // Checkbox (not for Done/All read-only views showing reopen instead)
  if (!isDoneView && !opts.readOnly) {
    const checkLabel = el('label', { className: 'checkbox' });
    const checkInput = el('input', { type: 'checkbox', checked: task.status === 'done' });
    checkInput.setAttribute('aria-label', `Mark ${task.title} as ${task.status === 'done' ? 'active' : 'done'}`);
    if (!completable && task.status !== 'done') checkInput.disabled = true;
    checkInput.addEventListener('change', () => toggleItem(task.id));
    const checkmark = el('span', { className: 'checkmark' });
    checkmark.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
    checkLabel.append(checkInput, checkmark);
    card.appendChild(checkLabel);
  }

  const content = el('div', { className: 'item-content' }, [
    el('span', { className: 'item-title', text: task.title }),
  ]);

  // Meta: labels, countdown, badges
  const meta = el('div', { className: 'item-meta' });

  (task.labels || []).forEach(l => {
    meta.appendChild(el('span', { className: 'label-chip label-badge', text: l, ariaLabel: `Label: ${l}` }));
  });

  if (task.dueDate && task.status !== 'done') {
    const countdown = formatCountdown(task.dueDate);
    if (countdown) {
      meta.appendChild(el('span', { className: `countdown ${countdown.cls}`, text: countdown.text }));
    }
  }

  if (task.subtasks && task.subtasks.length > 0) {
    const done = task.subtasks.filter(s => s.done).length;
    meta.appendChild(el('span', { className: 'subtask-progress', text: `${done}/${task.subtasks.length} subtasks`, ariaLabel: `${done} of ${task.subtasks.length} subtasks complete` }));
  }

  if (task.status === 'waiting') {
    meta.appendChild(el('span', { className: 'badge waiting-badge', text: 'waiting', ariaLabel: 'Status: waiting' }));
  }

  if (blocked) {
    meta.appendChild(el('span', { className: 'badge blocked-badge', text: 'blocked', ariaLabel: 'Blocked by dependencies' }));
  }

  if (isStale(task)) {
    meta.appendChild(el('span', { className: 'badge stale-badge', text: 'stale', ariaLabel: 'Stale: not updated in 14+ days' }));
  }

  if (meta.childNodes.length > 0) content.appendChild(meta);
  card.appendChild(content);

  // Actions
  if (!opts.readOnly && !isDoneView) {
    const actions = el('div', { className: 'item-actions' });
    const editBtn = el('button', { className: 'edit-btn', ariaLabel: `Edit ${task.title}` });
    editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
    editBtn.addEventListener('click', () => { editingId = task.id; render(); });

    const deleteBtn = el('button', { className: 'delete-btn', ariaLabel: `Delete ${task.title}` });
    deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    deleteBtn.addEventListener('click', () => requestDelete(task.id));

    actions.append(editBtn, deleteBtn);
    card.appendChild(actions);
  }

  // Reopen button for Done view
  if (isDoneView && task.type === 'task') {
    const reopenBtn = el('button', { className: 'btn-reopen', text: 'Reopen', ariaLabel: `Reopen ${task.title}` });
    reopenBtn.addEventListener('click', () => reopenItem(task.id));
    card.appendChild(reopenBtn);
  }

  return card;
}

// === Edit Forms ===
function renderTaskEditForm(task) {
  const card = el('li', { className: 'item-card editing', dataset: { id: task.id } });
  const form = el('div', { className: 'edit-form' });

  const titleInput = el('input', { type: 'text', value: task.title, maxlength: 500 });
  titleInput.setAttribute('aria-label', 'Edit task title');

  // Status
  const statusSelect = el('select');
  statusSelect.setAttribute('aria-label', 'Status');
  STATUSES.forEach(s => {
    const opt = el('option', { value: s, text: s.charAt(0).toUpperCase() + s.slice(1) });
    if (s === task.status) opt.selected = true;
    statusSelect.appendChild(opt);
  });

  // Time state
  const timeStateSelect = el('select');
  timeStateSelect.setAttribute('aria-label', 'Time state');
  TIME_STATES.forEach(ts => {
    const opt = el('option', { value: ts, text: ts === 'due-by' ? 'Due by' : ts === 'open' ? 'Open' : 'Recurring' });
    if (ts === task.timeState) opt.selected = true;
    timeStateSelect.appendChild(opt);
  });

  const dueDateInput = el('input', { type: 'date', value: task.dueDate || '' });
  dueDateInput.setAttribute('aria-label', 'Due date');
  const dueDateRow = el('div', { className: 'form-row conditional' }, [
    el('label', { text: 'Due date' }),
    dueDateInput,
  ]);

  const activationDateInput = el('input', { type: 'date', value: task.activationDate || '' });
  activationDateInput.setAttribute('aria-label', 'Activation date');
  const activationDateRow = el('div', { className: 'form-row conditional' }, [
    el('label', { text: 'Starts surfacing' }),
    activationDateInput,
  ]);

  const recurrenceSelect = el('select');
  recurrenceSelect.setAttribute('aria-label', 'Recurrence rule');
  RECURRENCE_RULES.forEach(r => {
    const opt = el('option', { value: r, text: r.charAt(0).toUpperCase() + r.slice(1) });
    if (r === task.recurrenceRule) opt.selected = true;
    recurrenceSelect.appendChild(opt);
  });
  const recurrenceRow = el('div', { className: 'form-row conditional' }, [
    el('label', { text: 'Repeats' }),
    recurrenceSelect,
  ]);

  // Labels
  const labelsRow = el('div', { className: 'form-row label-row' });
  const selectedLabels = new Set(task.labels || []);
  LABELS.forEach(l => {
    const chip = el('button', { className: `label-chip${selectedLabels.has(l) ? ' active' : ''}`, text: l, type: 'button' });
    chip.addEventListener('click', () => {
      if (selectedLabels.has(l)) { selectedLabels.delete(l); chip.classList.remove('active'); }
      else { selectedLabels.add(l); chip.classList.add('active'); }
    });
    labelsRow.appendChild(chip);
  });

  // Subtasks
  const subtaskSection = el('div', { className: 'subtask-section' });
  const subtaskListEl = el('div', { className: 'subtask-list' });

  function renderSubtaskEntry(s) {
    const entry = el('div', { className: `subtask-entry${s.done ? ' done' : ''}`, dataset: { subtaskId: s.id } });
    const toggle = el('input', { type: 'checkbox', checked: s.done });
    toggle.setAttribute('aria-label', `Toggle subtask: ${s.text}`);
    toggle.addEventListener('change', () => {
      s.done = toggle.checked;
      entry.classList.toggle('done', s.done);
    });
    const text = el('span', { className: 'subtask-text', text: s.text });
    const removeBtn = el('button', { className: 'subtask-remove', text: '\u00d7', type: 'button', ariaLabel: `Remove subtask: ${s.text}` });
    removeBtn.addEventListener('click', () => entry.remove());
    entry.append(toggle, text, removeBtn);
    return entry;
  }

  (task.subtasks || []).forEach(s => subtaskListEl.appendChild(renderSubtaskEntry({ ...s })));

  const subtaskInput = el('input', { type: 'text', placeholder: 'Add subtask...', maxlength: 500, autocomplete: 'off' });
  subtaskInput.setAttribute('aria-label', 'Add subtask');
  subtaskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = subtaskInput.value.trim();
      if (!text) return;
      subtaskListEl.appendChild(renderSubtaskEntry({ id: crypto.randomUUID(), text, done: false }));
      subtaskInput.value = '';
    }
  });

  subtaskSection.append(subtaskListEl, subtaskInput);

  // Conditional fields
  function updateConditionalFields() {
    const ts = timeStateSelect.value;
    dueDateRow.style.display = ts === 'open' ? 'none' : '';
    activationDateRow.style.display = ts === 'due-by' ? '' : 'none';
    recurrenceRow.style.display = ts === 'recurring' ? '' : 'none';
  }
  timeStateSelect.addEventListener('change', updateConditionalFields);
  updateConditionalFields();

  // Actions
  const actions = el('div', { className: 'form-actions' });
  const cancelBtn = el('button', { className: 'btn-cancel', text: 'Cancel' });
  cancelBtn.addEventListener('click', () => { const eid = task.id; editingId = null; render(); focusEditButton(eid); });
  const saveBtn = el('button', { className: 'btn-primary', text: 'Save' });
  saveBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    if (!title) { titleInput.focus(); return; }

    const subtasks = [...subtaskListEl.querySelectorAll('.subtask-entry')].map(entry => ({
      id: entry.dataset.subtaskId,
      text: entry.querySelector('.subtask-text').textContent,
      done: entry.querySelector('input[type="checkbox"]').checked,
    }));

    saveTaskEdit(task.id, {
      title,
      status: statusSelect.value,
      timeState: timeStateSelect.value,
      dueDate: dueDateInput.value || null,
      activationDate: activationDateInput.value || null,
      recurrenceRule: recurrenceSelect.value,
      labels: [...selectedLabels],
      subtasks,
    });
  });

  actions.append(cancelBtn, saveBtn);

  form.append(titleInput, el('div', { className: 'form-row' }, [statusSelect, timeStateSelect]),
    dueDateRow, activationDateRow, recurrenceRow, labelsRow, subtaskSection, actions);
  card.appendChild(form);

  // Focus + keyboard
  setTimeout(() => titleInput.focus(), 0);
  card.addEventListener('keydown', e => {
    if (e.key === 'Escape') { const eid = task.id; editingId = null; render(); focusEditButton(eid); }
    if (e.key === 'Enter' && e.target === titleInput) { e.preventDefault(); saveBtn.click(); }
  });

  return card;
}

function renderEventEditForm(event) {
  const card = el('li', { className: 'item-card editing', dataset: { id: event.id } });
  const form = el('div', { className: 'edit-form' });

  const titleInput = el('input', { type: 'text', value: event.title, maxlength: 500 });
  titleInput.setAttribute('aria-label', 'Edit event title');

  const dateTimeInput = el('input', { type: 'datetime-local', value: event.dateTime || '' });
  dateTimeInput.setAttribute('aria-label', 'Event date and time');

  const locationInput = el('input', { type: 'text', value: event.location || '', placeholder: 'Location', maxlength: 500 });
  locationInput.setAttribute('aria-label', 'Event location');

  const notesInput = el('textarea', { placeholder: 'Notes', maxlength: 2000 });
  notesInput.setAttribute('aria-label', 'Event notes');
  notesInput.value = event.notes || '';
  notesInput.rows = 2;

  const actions = el('div', { className: 'form-actions' });
  const cancelBtn = el('button', { className: 'btn-cancel', text: 'Cancel' });
  cancelBtn.addEventListener('click', () => { const eid = event.id; editingId = null; render(); focusEditButton(eid); });
  const saveBtn = el('button', { className: 'btn-primary', text: 'Save' });
  saveBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    if (!title) { titleInput.focus(); return; }
    saveEventEdit(event.id, {
      title,
      dateTime: dateTimeInput.value,
      location: locationInput.value,
      notes: notesInput.value,
    });
  });

  actions.append(cancelBtn, saveBtn);
  form.append(titleInput, dateTimeInput, locationInput, notesInput, actions);
  card.appendChild(form);

  setTimeout(() => titleInput.focus(), 0);
  card.addEventListener('keydown', e => {
    if (e.key === 'Escape') { const eid = event.id; editingId = null; render(); focusEditButton(eid); }
  });

  return card;
}

// === Empty State ===
function renderEmptyState() {
  const messages = {
    calendar: 'Nothing on this day',
    active: 'No tasks in your active window',
    browse: 'No open tasks to browse',
    recurring: 'No recurring tasks due',
    done: 'No completed tasks',
    all: searchQuery ? 'No items match your search' : 'No items yet',
  };
  return el('div', { className: 'empty-state' }, [
    el('p', { text: messages[currentView] || 'Nothing here' }),
  ]);
}

// === Init ===
function init() {
  const { items: loadedItems, toast } = loadItems();
  items = loadedItems;
  cleanOrphanDependencies();

  // Wire up delete dialog
  document.getElementById('delete-dialog-confirm').addEventListener('click', confirmDelete);
  document.getElementById('delete-dialog-cancel').addEventListener('click', cancelDelete);
  document.getElementById('delete-dialog').addEventListener('cancel', () => { pendingDeleteId = null; });

  // Ctrl+Z / Cmd+Z for undo
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      if (e.target.matches('input, textarea, select')) return;
      e.preventDefault();
      undo();
    }
  });

  // Update countdowns every minute
  setInterval(() => {
    if (!editingId) render();
  }, 60_000);

  render();

  if (toast) {
    setTimeout(() => showToast(toast), 100);
  }
}

init();
