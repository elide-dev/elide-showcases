// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Elide Office Coordinator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('homepage loads with header', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Office Coordinator');
    await expect(page.locator('.header-subtitle')).toHaveText('Team Task Management');
  });

  test('displays user chips', async ({ page }) => {
    const userChips = page.locator('.user-chip');
    await expect(userChips).toHaveCount(4); // 3 users + "All Tasks"

    // Check default user is selected
    await expect(userChips.first()).toHaveClass(/active/);
  });

  test('displays stats bar', async ({ page }) => {
    const stats = page.locator('.stat');
    await expect(stats).toHaveCount(3);

    await expect(page.locator('.stat-label').first()).toHaveText('To Do');
  });

  test('displays task cards', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');

    const taskCards = page.locator('.task-card');
    await expect(taskCards.first()).toBeVisible();
  });

  test('can switch users', async ({ page }) => {
    const allTasksChip = page.locator('.user-chip:has-text("All Tasks")');
    await allTasksChip.click();

    await expect(allTasksChip).toHaveClass(/active/);
  });

  test('can open new task modal', async ({ page }) => {
    const fab = page.locator('.fab');
    await fab.click();

    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    await expect(page.locator('.modal h2')).toHaveText('New Task');
  });

  test('can create a new task', async ({ page }) => {
    // Open modal
    await page.locator('.fab').click();

    // Fill form
    await page.fill('#taskTitle', 'Test Task from Playwright');
    await page.fill('#taskDescription', 'This is an automated test task');
    await page.selectOption('#taskPriority', 'high');

    // Submit
    await page.click('button[type="submit"]');

    // Modal should close
    await expect(page.locator('.modal-overlay')).not.toHaveClass(/active/);

    // New task should appear
    await expect(page.locator('.task-title:has-text("Test Task from Playwright")')).toBeVisible();
  });

  test('can advance task status', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');

    // Find a "todo" task and click Start
    const todoTask = page.locator('.task-card:has(.status-todo)').first();

    if (await todoTask.isVisible()) {
      const startBtn = todoTask.locator('.btn-advance:has-text("Start")');
      await startBtn.click();

      // Status should change
      await expect(todoTask.locator('.task-status')).toHaveClass(/status-in-progress/);
    }
  });

  test('health endpoint returns OK', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.server).toBe('elide-office-app');
  });

  test('API: get users', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/users`);
    expect(response.ok()).toBeTruthy();

    const users = await response.json();
    expect(users.length).toBe(3);
    expect(users[0]).toHaveProperty('name');
    expect(users[0]).toHaveProperty('role');
  });

  test('API: get tasks', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/tasks`);
    expect(response.ok()).toBeTruthy();

    const tasks = await response.json();
    expect(Array.isArray(tasks)).toBeTruthy();
  });

  test('API: create task', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/tasks`, {
      data: {
        title: 'API Test Task',
        description: 'Created via API',
        priority: 'high'
      }
    });
    expect(response.status()).toBe(201);

    const task = await response.json();
    expect(task.title).toBe('API Test Task');
    expect(task.status).toBe('todo');
  });

  test('mobile viewport works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(BASE_URL);

    // Header should be visible
    await expect(page.locator('h1')).toBeVisible();

    // FAB should be visible
    await expect(page.locator('.fab')).toBeVisible();

    // User bar should scroll horizontally
    const userBar = page.locator('.user-bar');
    await expect(userBar).toBeVisible();
  });
});
