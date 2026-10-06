/**
 * Jira-Clone API Test Suite
 * Tests authentication, projects, issues, and sprints
 */

const { describe, it, before, after } = require('jest');
const request = require('supertest');
const app = require('../src/app');

// Test constants
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPass123!',
  displayName: 'Test User'
};

let authToken;
let refreshToken;
let projectId;
let issueId;
let sprintId;

// ==================== AUTHENTICATION TESTS ====================

describe('Authentication API', () => {
  beforeAll(async () => {
    // Clean up any existing test user
    await request(BASE_URL).delete('/api/auth/test-cleanup');
  });

  afterAll(async () => {
    // Cleanup after tests
    await request(BASE_URL).delete('/api/auth/test-cleanup');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/register')
        .send(TEST_USER);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(TEST_USER.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 409 for duplicate email', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/register')
        .send(TEST_USER);
      
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
    });

    it('should return 400 for weak password', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/register')
        .send({ ...TEST_USER, password: 'weak' });
      
      expect(res.status).toBe(400);
      expect(res.body.fields).toBeDefined();
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/register')
        .send({ email: TEST_USER.email });
      
      expect(res.status).toBe(400);
      expect(res.body.fields.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      authToken = res.body.token;
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'WrongPassword123!'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123!'
        });
      
      expect(res.status).toBe(401);
    });

    it('should return 400 for missing credentials', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/login')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // First login to get refresh token
      const loginRes = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });
      
      refreshToken = loginRes.body.refreshToken;
      
      const res = await request(BASE_URL)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.token).not.toBe(authToken);
    });

    it('should return 401 for expired refresh token', async () => {
      const res = await request(BASE_URL)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });
      
      expect(res.status).toBe(401);
    });
  });
});

// ==================== PROJECT TESTS ====================

describe('Projects API', () => {
  beforeEach(async () => {
    // Login before each test
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password
      });
    authToken = res.body.token;
  });

  describe('GET /api/projects', () => {
    it('should list projects for authenticated user', async () => {
      const res = await request(BASE_URL)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });

    it('should return 401 without token', async () => {
      const res = await request(BASE_URL).get('/api/projects');
      expect(res.status).toBe(401);
    });

    it('should support pagination', async () => {
      const res = await request(BASE_URL)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 5 });
      
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const res = await request(BASE_URL)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'TEST',
          name: 'Test Project',
          description: 'A test project'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('key', 'TEST');
      projectId = res.body.id;
    });

    it('should return 409 for duplicate key', async () => {
      const res = await request(BASE_URL)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'TEST',
          name: 'Duplicate Project',
          description: 'Should fail'
        });
      
      expect(res.status).toBe(409);
    });

    it('should return 400 for invalid key format', async () => {
      const res = await request(BASE_URL)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'invalid key!',
          name: 'Bad Key Project'
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should get project details', async () => {
      const res = await request(BASE_URL)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', projectId);
      expect(res.body).toHaveProperty('members');
      expect(res.body).toHaveProperty('stats');
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(BASE_URL)
        .get('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project', async () => {
      const res = await request(BASE_URL)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Project',
          description: 'Updated description'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Test Project');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project', async () => {
      const res = await request(BASE_URL)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(204);
    });
  });
});

// ==================== ISSUES TESTS ====================

describe('Issues API', () => {
  let testProjectId;

  beforeEach(async () => {
    // Login
    const loginRes = await request(BASE_URL)
      .post('/api/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password
      });
    authToken = loginRes.body.token;

    // Create a project for issue tests
    const projRes = await request(BASE_URL)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        key: 'ISS',
        name: 'Issues Test Project',
        description: 'For issue testing'
      });
    testProjectId = projRes.body.id;
  });

  afterEach(async () => {
    // Cleanup project
    await request(BASE_URL)
      .delete(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);
  });

  describe('POST /api/issues', () => {
    it('should create an issue', async () => {
      const res = await request(BASE_URL)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          summary: 'Test Issue',
          description: 'Test description',
          issueType: 'TASK',
          priority: 'MEDIUM'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('key');
      issueId = res.body.id;
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(BASE_URL)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          summary: 'Missing projectId'
        });
      
      expect(res.status).toBe(400);
    });

    it('should return 403 for unauthorized project access', async () => {
      const res = await request(BASE_URL)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: '00000000-0000-0000-0000-000000000000',
          summary: 'Unauthorized issue'
        });
      
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/issues', () => {
    it('should list issues with filters', async () => {
      // Create issues first
      await request(BASE_URL)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          summary: 'Issue One',
          issueType: 'TASK',
          status: 'TODO'
        });

      const res = await request(BASE_URL)
        .get('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ projectId: testProjectId, status: 'TODO' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should support search', async () => {
      const res = await request(BASE_URL)
        .get('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ projectId: testProjectId, search: 'One' });
      
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/issues/:id', () => {
    it('should update issue status', async () => {
      // Create issue first
      const createRes = await request(BASE_URL)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          summary: 'Status Update Test',
          issueType: 'TASK'
        });
      
      const res = await request(BASE_URL)
        .put(`/api/issues/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PROGRESS' });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('should return 400 for invalid status', async () => {
      const createRes = await request(BASE_URL)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          summary: 'Invalid Status Test',
          issueType: 'TASK'
        });
      
      const res = await request(BASE_URL)
        .put(`/api/issues/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' });
      
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/issues/:id', () => {
    it('should delete an issue', async () => {
      const createRes = await request(BASE_URL)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          summary: 'Delete Test',
          issueType: 'TASK'
        });
      
      const res = await request(BASE_URL)
        .delete(`/api/issues/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(204);
    });
  });
});

// ==================== SPRINT TESTS ====================

describe('Sprints API', () => {
  let testProjectId;
  let authToken;

  beforeEach(async () => {
    // Login
    const loginRes = await request(BASE_URL)
      .post('/api/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password
      });
    authToken = loginRes.body.token;

    // Create project
    const projRes = await request(BASE_URL)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        key: 'SPR',
        name: 'Sprint Test Project',
        description: 'For sprint testing'
      });
    testProjectId = projRes.body.id;
  });

  afterEach(async () => {
    await request(BASE_URL)
      .delete(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${authToken}`);
  });

  describe('POST /api/sprints', () => {
    it('should create a sprint', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      
      const res = await request(BASE_URL)
        .post('/api/sprints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Sprint 1',
          startDate,
          endDate
        });
      
      expect(res.status).toBe(201);
      expect(res.body.state).toBe('BACKLOG');
      sprintId = res.body.id;
    });

    it('should return 400 for invalid dates', async () => {
      const res = await request(BASE_URL)
        .post('/api/sprints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Bad Dates Sprint',
          startDate: '2026-12-31T00:00:00Z',
          endDate: '2026-01-01T00:00:00Z'
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/sprints/:id', () => {
    it('should activate a sprint', async () => {
      // Create sprint first
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      
      const createRes = await request(BASE_URL)
        .post('/api/sprints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Activate Test Sprint',
          startDate,
          endDate
        });
      
      const res = await request(BASE_URL)
        .put(`/api/sprints/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ state: 'ACTIVE' });
      
      expect(res.status).toBe(200);
      expect(res.body.state).toBe('ACTIVE');
    });

    it('should close a sprint', async () => {
      // Create and activate sprint
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      
      const createRes = await request(BASE_URL)
        .post('/api/sprints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Close Test Sprint',
          startDate,
          endDate
        });
      
      await request(BASE_URL)
        .put(`/api/sprints/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ state: 'ACTIVE' });
      
      const res = await request(BASE_URL)
        .put(`/api/sprints/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ state: 'CLOSED' });
      
      expect(res.status).toBe(200);
      expect(res.body.state).toBe('CLOSED');
      expect(res.body.closed).toBe(true);
    });
  });
});
