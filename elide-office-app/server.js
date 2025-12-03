/**
 * Elide Office Team Coordination App
 *
 * A simple task coordination app for office teams:
 * - 2 Office Managers + 1 Ops Supervisor
 * - Mobile-responsive UI
 * - Task management with status tracking
 *
 * Run: elide run --serve server.js
 */

const fs = require('fs');
const path = require('path');

const server = Elide.http;
const router = server.getRouter();
const config = server.getConfig();

// ============ DATA STORE ============
// In-memory store (persists to JSON file)
const DATA_FILE = './data/tasks.json';

let store = {
  tasks: [],
  users: [
    { id: 'mgr1', name: 'Office Manager 1', role: 'manager', avatar: '👔' },
    { id: 'mgr2', name: 'Office Manager 2', role: 'manager', avatar: '👩‍💼' },
    { id: 'ops1', name: 'Ops Supervisor', role: 'supervisor', avatar: '🎯' }
  ]
};

// Load persisted data
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      store.tasks = parsed.tasks || [];
      console.log(`📂 Loaded ${store.tasks.length} tasks from storage`);
    }
  } catch (e) {
    console.log('📝 Starting with fresh data store');
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks: store.tasks }, null, 2));
  } catch (e) {
    console.error('❌ Failed to save data:', e.message);
  }
}

// Initialize sample tasks if empty
function initSampleTasks() {
  if (store.tasks.length === 0) {
    store.tasks = [
      { id: '1', title: 'Order office supplies', description: 'Pens, paper, printer ink', status: 'todo', priority: 'medium', assignee: 'mgr1', created: new Date().toISOString() },
      { id: '2', title: 'Schedule team meeting', description: 'Q4 planning session', status: 'in-progress', priority: 'high', assignee: 'mgr2', created: new Date().toISOString() },
      { id: '3', title: 'Review maintenance contracts', description: 'HVAC and cleaning services', status: 'todo', priority: 'low', assignee: 'ops1', created: new Date().toISOString() },
      { id: '4', title: 'Update emergency contacts', description: 'New building manager info', status: 'done', priority: 'medium', assignee: 'mgr1', created: new Date().toISOString() },
    ];
    saveData();
    console.log('✨ Initialized sample tasks');
  }
}

// ============ UTILITIES ============
function sendJSON(response, status, data) {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.send(status, JSON.stringify(data));
}

function sendHTML(response, status, html) {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.send(status, html);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============ HTML TEMPLATE ============
function getIndexHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <title>Office Coordinator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --success: #16a34a;
      --warning: #ea580c;
      --danger: #dc2626;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding-bottom: 80px;
    }

    /* Header */
    .header {
      background: var(--primary);
      color: white;
      padding: 16px 20px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .header-subtitle {
      font-size: 0.75rem;
      opacity: 0.8;
      margin-top: 2px;
    }

    /* User Selector */
    .user-bar {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
      overflow-x: auto;
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 20px;
      border: 2px solid var(--border);
      background: var(--bg);
      cursor: pointer;
      white-space: nowrap;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .user-chip.active {
      border-color: var(--primary);
      background: #eff6ff;
    }

    .user-chip:hover {
      border-color: var(--primary);
    }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      justify-content: space-around;
      padding: 12px 16px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    /* Task List */
    .task-list {
      padding: 16px;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 16px 0 8px;
    }

    .task-card {
      background: var(--card);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border-left: 4px solid var(--border);
      transition: transform 0.2s;
    }

    .task-card:active {
      transform: scale(0.98);
    }

    .task-card.priority-high { border-left-color: var(--danger); }
    .task-card.priority-medium { border-left-color: var(--warning); }
    .task-card.priority-low { border-left-color: var(--success); }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .task-title {
      font-weight: 600;
      font-size: 1rem;
    }

    .task-assignee {
      font-size: 1.25rem;
    }

    .task-description {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 12px;
    }

    .task-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .task-status {
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
    }

    .status-todo { background: #fee2e2; color: #991b1b; }
    .status-in-progress { background: #fef3c7; color: #92400e; }
    .status-done { background: #dcfce7; color: #166534; }

    .task-actions {
      display: flex;
      gap: 8px;
    }

    .btn-action {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-action:hover { opacity: 0.8; }
    .btn-advance { background: var(--success); color: white; }
    .btn-delete { background: var(--danger); color: white; }

    /* FAB */
    .fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      border: none;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      cursor: pointer;
      z-index: 100;
    }

    .fab:active { transform: scale(0.95); }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: none;
      justify-content: center;
      align-items: flex-end;
      z-index: 200;
    }

    .modal-overlay.active { display: flex; }

    .modal {
      background: var(--card);
      width: 100%;
      max-width: 500px;
      border-radius: 16px 16px 0 0;
      padding: 24px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal h2 {
      margin-bottom: 16px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 6px;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-group textarea {
      min-height: 80px;
      resize: vertical;
    }

    .btn-primary {
      width: 100%;
      padding: 14px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-cancel {
      width: 100%;
      padding: 14px;
      background: var(--bg);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      margin-top: 8px;
      cursor: pointer;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    @media (min-width: 768px) {
      .task-list {
        max-width: 600px;
        margin: 0 auto;
      }

      .modal {
        border-radius: 16px;
        margin: auto;
      }

      .modal-overlay {
        align-items: center;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>Office Coordinator</h1>
    <div class="header-subtitle">Team Task Management</div>
  </header>

  <div class="user-bar" id="userBar"></div>

  <div class="stats-bar" id="statsBar"></div>

  <main class="task-list" id="taskList"></main>

  <button class="fab" onclick="openModal()">+</button>

  <div class="modal-overlay" id="modalOverlay" onclick="closeModal(event)">
    <div class="modal" onclick="event.stopPropagation()">
      <h2>New Task</h2>
      <form id="taskForm" onsubmit="createTask(event)">
        <div class="form-group">
          <label>Title</label>
          <input type="text" id="taskTitle" required placeholder="What needs to be done?">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="taskDescription" placeholder="Add details..."></textarea>
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select id="taskPriority">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="form-group">
          <label>Assign To</label>
          <select id="taskAssignee"></select>
        </div>
        <button type="submit" class="btn-primary">Create Task</button>
        <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
      </form>
    </div>
  </div>

  <script>
    let users = [];
    let tasks = [];
    let currentUser = null;

    // Fetch initial data
    async function init() {
      const [usersRes, tasksRes] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json())
      ]);
      users = usersRes;
      tasks = tasksRes;
      currentUser = users[0]?.id;
      render();
    }

    function render() {
      renderUsers();
      renderStats();
      renderTasks();
      renderAssigneeSelect();
    }

    function renderUsers() {
      const container = document.getElementById('userBar');
      container.innerHTML = users.map(u => \`
        <div class="user-chip \${currentUser === u.id ? 'active' : ''}" onclick="selectUser('\${u.id}')">
          <span>\${u.avatar}</span>
          <span>\${u.name}</span>
        </div>
      \`).join('') + \`
        <div class="user-chip \${currentUser === 'all' ? 'active' : ''}" onclick="selectUser('all')">
          <span>👁</span>
          <span>All Tasks</span>
        </div>
      \`;
    }

    function renderStats() {
      const filtered = currentUser === 'all' ? tasks : tasks.filter(t => t.assignee === currentUser);
      const todo = filtered.filter(t => t.status === 'todo').length;
      const inProgress = filtered.filter(t => t.status === 'in-progress').length;
      const done = filtered.filter(t => t.status === 'done').length;

      document.getElementById('statsBar').innerHTML = \`
        <div class="stat">
          <div class="stat-value">\${todo}</div>
          <div class="stat-label">To Do</div>
        </div>
        <div class="stat">
          <div class="stat-value">\${inProgress}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat">
          <div class="stat-value">\${done}</div>
          <div class="stat-label">Done</div>
        </div>
      \`;
    }

    function renderTasks() {
      const container = document.getElementById('taskList');
      const filtered = currentUser === 'all' ? tasks : tasks.filter(t => t.assignee === currentUser);

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <div>No tasks yet</div>
          </div>
        \`;
        return;
      }

      const byStatus = {
        'in-progress': filtered.filter(t => t.status === 'in-progress'),
        'todo': filtered.filter(t => t.status === 'todo'),
        'done': filtered.filter(t => t.status === 'done')
      };

      let html = '';

      if (byStatus['in-progress'].length) {
        html += '<div class="section-title">In Progress</div>';
        html += byStatus['in-progress'].map(renderTaskCard).join('');
      }

      if (byStatus['todo'].length) {
        html += '<div class="section-title">To Do</div>';
        html += byStatus['todo'].map(renderTaskCard).join('');
      }

      if (byStatus['done'].length) {
        html += '<div class="section-title">Completed</div>';
        html += byStatus['done'].map(renderTaskCard).join('');
      }

      container.innerHTML = html;
    }

    function renderTaskCard(task) {
      const user = users.find(u => u.id === task.assignee);
      const nextStatus = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : null;
      const nextLabel = task.status === 'todo' ? 'Start' : task.status === 'in-progress' ? 'Complete' : null;

      return \`
        <div class="task-card priority-\${task.priority}">
          <div class="task-header">
            <div class="task-title">\${task.title}</div>
            <div class="task-assignee" title="\${user?.name || 'Unassigned'}">\${user?.avatar || '❓'}</div>
          </div>
          <div class="task-description">\${task.description || ''}</div>
          <div class="task-footer">
            <span class="task-status status-\${task.status}">\${formatStatus(task.status)}</span>
            <div class="task-actions">
              \${nextStatus ? \`<button class="btn-action btn-advance" onclick="advanceTask('\${task.id}', '\${nextStatus}')">\${nextLabel}</button>\` : ''}
              <button class="btn-action btn-delete" onclick="deleteTask('\${task.id}')">Delete</button>
            </div>
          </div>
        </div>
      \`;
    }

    function formatStatus(status) {
      return status.replace('-', ' ').replace(/\\b\\w/g, c => c.toUpperCase());
    }

    function renderAssigneeSelect() {
      const select = document.getElementById('taskAssignee');
      select.innerHTML = users.map(u => \`
        <option value="\${u.id}">\${u.avatar} \${u.name}</option>
      \`).join('');
      if (currentUser && currentUser !== 'all') {
        select.value = currentUser;
      }
    }

    function selectUser(id) {
      currentUser = id;
      render();
    }

    function openModal() {
      document.getElementById('modalOverlay').classList.add('active');
    }

    function closeModal(e) {
      if (!e || e.target === e.currentTarget) {
        document.getElementById('modalOverlay').classList.remove('active');
        document.getElementById('taskForm').reset();
      }
    }

    async function createTask(e) {
      e.preventDefault();
      const task = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        assignee: document.getElementById('taskAssignee').value
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });

      const newTask = await res.json();
      tasks.unshift(newTask);
      closeModal();
      render();
    }

    async function advanceTask(id, newStatus) {
      await fetch(\`/api/tasks/\${id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const task = tasks.find(t => t.id === id);
      if (task) task.status = newStatus;
      render();
    }

    async function deleteTask(id) {
      if (!confirm('Delete this task?')) return;

      await fetch(\`/api/tasks/\${id}\`, { method: 'DELETE' });
      tasks = tasks.filter(t => t.id !== id);
      render();
    }

    init();
  </script>
</body>
</html>`;
}

// ============ ROUTES ============

// Homepage
router.handle('GET', '/', (request, response) => {
  sendHTML(response, 200, getIndexHTML());
});

// Health check
router.handle('GET', '/health', (request, response) => {
  sendJSON(response, 200, {
    status: 'ok',
    server: 'elide-office-app',
    version: '1.0.0',
    runtime: 'elide',
    tasks: store.tasks.length,
    users: store.users.length
  });
});

// Get users
router.handle('GET', '/api/users', (request, response) => {
  sendJSON(response, 200, store.users);
});

// Get all tasks
router.handle('GET', '/api/tasks', (request, response) => {
  sendJSON(response, 200, store.tasks);
});

// Create task
router.handle('POST', '/api/tasks', (request, response) => {
  try {
    const body = JSON.parse(request.body || '{}');
    const task = {
      id: generateId(),
      title: body.title || 'Untitled Task',
      description: body.description || '',
      status: 'todo',
      priority: body.priority || 'medium',
      assignee: body.assignee || store.users[0].id,
      created: new Date().toISOString()
    };
    store.tasks.unshift(task);
    saveData();
    console.log(`✅ Created task: ${task.title}`);
    sendJSON(response, 201, task);
  } catch (e) {
    sendJSON(response, 400, { error: e.message });
  }
});

// Update task
router.handle('PATCH', '/api/tasks/:id', (request, response) => {
  try {
    const id = request.params?.id || request.url.split('/').pop();
    const task = store.tasks.find(t => t.id === id);

    if (!task) {
      sendJSON(response, 404, { error: 'Task not found' });
      return;
    }

    const body = JSON.parse(request.body || '{}');
    if (body.status) task.status = body.status;
    if (body.title) task.title = body.title;
    if (body.description !== undefined) task.description = body.description;
    if (body.priority) task.priority = body.priority;
    if (body.assignee) task.assignee = body.assignee;
    task.updated = new Date().toISOString();

    saveData();
    console.log(`📝 Updated task: ${task.title} -> ${task.status}`);
    sendJSON(response, 200, task);
  } catch (e) {
    sendJSON(response, 400, { error: e.message });
  }
});

// Delete task
router.handle('DELETE', '/api/tasks/:id', (request, response) => {
  const id = request.params?.id || request.url.split('/').pop();
  const idx = store.tasks.findIndex(t => t.id === id);

  if (idx === -1) {
    sendJSON(response, 404, { error: 'Task not found' });
    return;
  }

  const [deleted] = store.tasks.splice(idx, 1);
  saveData();
  console.log(`🗑️ Deleted task: ${deleted.title}`);
  sendJSON(response, 200, { success: true, deleted: deleted.id });
});

// CORS preflight
router.handle('OPTIONS', '/*', (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.send(204, '');
});

// ============ SERVER START ============
config.port = 3000;

config.onBind(() => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║     🏢 Elide Office Coordinator is running!       ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log('║  🌐 http://localhost:3000                         ║');
  console.log('║  📱 Mobile-ready • Docker-ready                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
});

// Initialize and start
loadData();
initSampleTasks();
server.start();
