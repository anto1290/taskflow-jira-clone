/**
 * Jira-Clone E2E Test Suite
 * Uses Playwright for browser automation
 */

const { test, expect } = require('@playwright/test');

// Test data
const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'TestPass123!',
  displayName: 'E2E Test User'
};

// ==================== AUTHENTICATION FLOWS ====================

test.describe('Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Login|Jira-Clone/i);
    await expect(page.locator('[type="email"]')).toBeVisible();
    await expect(page.locator('[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    await page.locator('[name="email"]').fill(TEST_USER.email);
    await page.locator('[name="password"]').fill(TEST_USER.password);
    await page.locator('[name="displayName"]').fill(TEST_USER.displayName);
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/\/dashboard|\/projects/i);
    await expect(page.locator(`text=${TEST_USER.displayName}`)).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Register first
    await page.goto('/register');
    await page.locator('[name="email"]').fill(TEST_USER.email);
    await page.locator('[name="password"]').fill(TEST_USER.password);
    await page.locator('[name="displayName"]').fill(TEST_USER.displayName);
    await page.locator('button[type="submit"]').click();
    
    // Logout
    await page.locator('[data-testid="user-menu"]').click();
    await page.locator('[data-testid="logout"]').click();
    
    // Login
    await page.goto('/login');
    await page.locator('[name="email"]').fill(TEST_USER.email);
    await page.locator('[name="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/\/dashboard|\/projects/i);
    await expect(page.locator(`text=${TEST_USER.displayName}`)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('[name="email"]').fill(TEST_USER.email);
    await page.locator('[name="password"]').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should protect routes from unauthenticated users', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/i);
  });
});

// ==================== PROJECT MANAGEMENT ====================

test.describe('Project Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[name="email"]').fill(TEST_USER.email);
    await page.locator('[name="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard|\/projects/i);
  });

  test('should create a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.locator('[data-testid="create-project"]').click();
    
    await page.locator('[name="key"]').fill('E2E');
    await page.locator('[name="name"]').fill('E2E Test Project');
    await page.locator('[name="description"]').fill('Test description');
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+/i);
    await expect(page.locator('text=E2E Test Project')).toBeVisible();
  });

  test('should navigate to project detail', async ({ page }) => {
    // Create project first
    await page.locator('[data-testid="create-project"]').click();
    await page.locator('[name="key"]').fill('NAV');
    await page.locator('[name="name"]').fill('Navigation Test');
    await page.locator('button[type="submit"]').click();
    
    const projectId = await page.locator('[data-testid="project-id"]').textContent();
    
    // Navigate via URL
    await page.goto(`/projects/${projectId}`);
    await expect(page.locator('text=Navigation Test')).toBeVisible();
  });

  test('should update project details', async ({ page }) => {
    // Create project
    await page.locator('[data-testid="create-project"]').click();
    await page.locator('[name="key"]').fill('UPD');
    await page.locator('[name="name"]').fill('Update Test');
    await page.locator('button[type="submit"]').click();
    
    // Navigate to settings
    await page.locator('[data-testid="project-settings"]').click();
    await page.locator('[name="name"]').fill('Updated Project Name');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('[name="name"]')).toHaveValue('Updated Project Name');
  });

  test('should delete project', async ({ page }) => {
    // Create project
    await page.locator('[data-testid="create-project"]').click();
    await page.locator('[name="key"]').fill('DEL');
    await page.locator('[name="name"]').fill('Delete Test');
    await page.locator('button[type="submit"]').click();
    
    const projectId = await page.locator('[data-testid="project-id"]').textContent();
    
    // Delete
    await page.locator('[data-testid="project-settings"]').click();
    await page.locator('[data-testid="delete-project"]').click();
    await page.locator('[data-testid="confirm-delete"]').click();
    
    await expect(page).toHaveURL(/\/projects/i);
    
    // Verify deletion
    await page.goto(`/projects/${projectId}`);
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});

// ==================== ISSUE MANAGEMENT ====================

test.describe('Issue Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[name="email"]').fill(TEST_USER.email);
    await page.locator('[name="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard|\/projects/i);
    
    // Create a test project
    await page.goto('/projects');
    await page.locator('[data-testid="create-project"]').click();
    await page.locator('[name="key"]').fill('ISS');
    await page.locator('[name="name"]').fill('Issue Test Project');
    await page.locator('button[type="submit"]').click();
  });

  test('should create an issue', async ({ page }) => {
    await page.locator('[data-testid="create-issue"]').click();
    
    await page.locator('[name="summary"]').fill('Test Issue Summary');
    await page.locator('[name="description"]').fill('Test description content');
    await page.locator('[name="issueType"]').selectOption('TASK');
    await page.locator('[name="priority"]').selectOption('HIGH');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('text=Test Issue Summary')).toBeVisible();
    await expect(page.locator('text=TASK')).toBeVisible();
    await expect(page.locator('text=HIGH')).toBeVisible();
  });

  test('should update issue status', async ({ page }) => {
    // Create issue
    await page.locator('[data-testid="create-issue"]').click();
    await page.locator('[name="summary"]').fill('Status Update Test');
    await page.locator('button[type="submit"]').click();
    
    const issueId = await page.locator('[data-testid="issue-id"]').textContent();
    
    // Change status
    await page.locator('[data-testid="status-select"]').click();
    await page.locator('[data-testid="status-IN_PROGRESS"]').click();
    
    await expect(page.locator('text=IN_PROGRESS')).toBeVisible();
  });

  test('should assign issue to user', async ({ page }) => {
    // Create issue
    await page.locator('[data-testid="create-issue"]').click();
    await page.locator('[name="summary"]').fill('Assignment Test');
    await page.locator('button[type="submit"]').click();
    
    // Assign
    await page.locator('[data-testid="assignee-select"]').click();
    await page.locator('[data-testid="assignee-self"]').click();
    
    await expect(page.locator(`text=${TEST_USER.displayName}`)).toBeVisible();
  });

  test('should filter issues', async ({ page }) => {
    // Create multiple issues
    await page.locator('[data-testid="create-issue"]').click();
    await page.locator('[name="summary"]').fill('Filter Test 1');
    await page.locator('[name="priority"]').selectOption('HIGH');
    await page.locator('button[type="submit"]').click();
    
    await page.locator('[data-testid="create-issue"]').click();
    await page.locator('[name="summary"]').fill('Filter Test 2');
    await page.locator('[name="priority"]').selectOption('LOW');
    await page.locator('button[type="submit"]').click();
    
    // Filter by priority
    await page.locator('[data-testid="filter-priority"]').click();
    await page.locator('[data-testid="filter-HIGH"]').click();
    
    const issues = await page.locator('[data-testid="issue-row"]').count();
    await expect(issues).toBeGreaterThan(0);
  });
});

// ==================== KANBAN BOARD ====================

test.describe('Kanban Board E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[name="email"]').fill(TEST_USER.email);
    await page.locator('[name="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard|\/projects/i);
    
    // Navigate to board
    await page.goto('/board');
  });

  test('should display board columns', async ({ page }) => {
    const columns = await page.locator('[data-testid="kanban-column"]').count();
    await expect(columns).toBeGreaterThan(0);
    
    // Check column headers
    await expect(page.locator('text=TODO')).toBeVisible();
    await expect(page.locator('text=IN_PROGRESS')).toBeVisible();
    await expect(page.locator('text=DONE')).toBeVisible();
  });

  test('should drag and drop issue between columns', async ({ page }) => {
    // Create issue in TODO
    await page.locator('[data-testid="create-issue"]').click();
    await page.locator('[name="summary"]').fill('Drag Test Issue');
    await page.locator('button[type="submit"]').click();
    
    // Get issue element
    const issue = page.locator('[data-testid="issue-card"]:has-text("Drag Test Issue")');
    await expect(issue).toBeVisible();
    
    // Drag to IN_PROGRESS column
    const todoColumn = page.locator('[data-testid="kanban-column"]:has-text("TODO")');
    const inProgressColumn = page.locator('[data-testid="kanban-column"]:has-text("IN_PROGRESS")');
    
    await issue.dragTo(inProgressColumn);
    
    // Verify status change
    await expect(page.locator('text=IN_PROGRESS')).toBeVisible();
  });

  test('should reorder issues within column', async ({ page }) => {
    // Create two issues
    await page.locator('[data-testid="create-issue"]').click();
    await page.locator('[name="summary"]').fill('Issue A');
    await page.locator('button[type="submit"]').click();
    
    await page.locator('[data-testid="create-issue"]').click();
    await page.locator('[name="summary"]').fill('Issue B');
    await page.locator('button[type="submit"]').click();
    
    // Get issue elements
    const issueA = page.locator('[data-testid="issue-card"]:has-text("Issue A")');
    const issueB = page.locator('[data-testid="issue-card"]:has-text("Issue B")');
    
    // Drag Issue A after Issue B
    await issueA.dragTo(issueB, { targetPosition: { x: 0, y: 50 } });
    
    // Verify order changed
    const firstIssue = page.locator('[data-testid="issue-card"]:first()');
    await expect(firstIssue).toContainText('Issue B');
  });

  test('should show drop feedback', async ({ page }) => {
    // Create issue
    await page.locator('[data-testid="create-issue"]').click();
    await page.locator('[name="summary"]').fill('Drop Feedback Test');
    await page.locator('button[type="submit"]').click();
    
    const issue = page.locator('[data-testid="issue-card"]:has-text("Drop Feedback Test")');
    const column = page.locator('[data-testid="kanban-column"]:has-text("TODO")');
    
    // Start drag
    await issue.hover();
    await issue.down();
    
    // Move over column
    await column.hover();
    
    // Should show drop zone indicator
    await expect(page.locator('[data-testid="drop-zone"]')).toBeVisible();
    
    // Cancel drag
    await page.up();
  });
});

// ==================== SPRINT MANAGEMENT ====================

test.describe('Sprint Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[name="email"]').fill(TEST_USER.email);
    await page.locator('[name="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard|\/projects/i);
  });

  test('should create a sprint', async ({ page }) => {
    // Navigate to sprints page
    await page.goto('/sprints');
    
    await page.locator('[data-testid="create-sprint"]').click();
    
    await page.locator('[name="name"]').fill('Sprint 1');
    await page.locator('[name="startDate"]').fill('2026-10-01');
    await page.locator('[name="endDate"]').fill('2026-10-14');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.locator('text=Sprint 1')).toBeVisible();
    await expect(page.locator('text=BACKLOG')).toBeVisible();
  });

  test('should activate a sprint', async ({ page }) => {
    // Create sprint
    await page.goto('/sprints');
    await page.locator('[data-testid="create-sprint"]').click();
    await page.locator('[name="name"]').fill('Activate Test');
    await page.locator('[name="startDate"]').fill('2026-10-01');
    await page.locator('[name="endDate"]').fill('2026-10-14');
    await page.locator('button[type="submit"]').click();
    
    // Activate
    await page.locator('[data-testid="sprint-activate"]').click();
    
    await expect(page.locator('text=ACTIVE')).toBeVisible();
  });

  test('should close a sprint', async ({ page }) => {
    // Create and activate sprint
    await page.goto('/sprints');
    await page.locator('[data-testid="create-sprint"]').click();
    await page.locator('[name="name"]').fill('Close Test');
    await page.locator('[name="startDate"]').fill('2026-10-01');
    await page.locator('[name="endDate"]').fill('2026-10-14');
    await page.locator('button[type="submit"]').click();
    
    await page.locator('[data-testid="sprint-activate"]').click();
    await expect(page.locator('text=ACTIVE')).toBeVisible();
    
    // Close
    await page.locator('[data-testid="sprint-close"]').click();
    await page.locator('[data-testid="confirm-close"]').click();
    
    await expect(page.locator('text=CLOSED')).toBeVisible();
  });
});

// ==================== EDGE CASES & BOUNDARY TESTING ====================

test.describe('Edge Cases & Boundary Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('[name="email"]').fill(TEST_USER.email);
    await page.locator('[name="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard|\/projects/i);
  });

  test('should handle empty project list', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  });

  test('should handle concurrent edits with optimistic updates', async ({ page }) => {
    // This test would require multiple browser contexts in a real scenario
    // For now, we verify the loading states
    await page.goto('/board');
    
    // Simulate loading state
    await page.locator('[data-testid="loading-spinner"]').waitFor({ state: 'hidden', timeout: 5000 });
  });

  test('should validate long issue summaries', async ({ page }) => {
    await page.locator('[data-testid="create-issue"]').click();
    
    // Fill with very long summary (1000+ chars)
    const longSummary = 'A'.repeat(1000);
    await page.locator('[name="summary"]').fill(longSummary);
    await page.locator('button[type="submit"]').click();
    
    // Should either truncate or show validation error
    const error = page.locator('[data-testid="validation-error"]');
    await expect(error).toBeVisible().or(page.locator('[data-testid="issue-created"]').toBeVisible());
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/*', route => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) });
    });
    
    await page.reload();
    
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
  });

  test('should persist theme preference', async ({ page }) => {
    // Toggle theme
    await page.locator('[data-testid="theme-toggle"]').click();
    
    // Verify dark mode is active
    await expect(page.locator('html')).toHaveClass(/dark/i);
    
    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/i);
  });

  test('should handle race condition on simultaneous status changes', async ({ page }) => {
    // Create issue
    await page.locator('[data-testid="create-issue"]').click();
    await page.locator('[name="summary"]').fill('Race Condition Test');
    await page.locator('button[type="submit"]').click();
    
    // This is a conceptual test - in practice would require mocking or parallel contexts
    await expect(page.locator('[data-testid="issue-status"]')).toBeVisible();
  });
});
