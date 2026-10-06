# Jira-Clone QA Test Plan

## Executive Summary

This document provides a comprehensive QA test strategy and automated test suite for the Jira-Clone application. The testing framework covers authentication, project management, issue tracking, Kanban board interactions, and sprint management.

---

## Table of Contents

1. [Test Strategy](#1-test-strategy)
2. [Test Case Matrix](#2-test-case-matrix)
3. [API Test Scripts](#3-api-test-scripts)
4. [E2E Test Scenarios](#4-e2e-test-scenarios)
5. [Edge Cases & Boundary Testing](#5-edge-cases--boundary-testing)
6. [Test Execution](#6-test-execution)

---

## 1. Test Strategy

### 1.1 Overview

This document defines the quality assurance strategy for the Jira-Clone application, a project management system built with Next.js 14 (frontend) and a Node.js/PostgreSQL backend. The strategy covers authentication, project CRUD, issue management, Kanban board interactions, and sprint management.

### 1.2 Testing Layers

| Layer | Type | Tool | Scope |
|-------|------|------|-------|
| L1 | Unit | Jest | Utility functions, reducers, form validators |
| L2 | API | Jest + Supertest | REST endpoints, auth middleware, business logic |
| L3 | Integration | Jest + Supertest | Multi-endpoint flows (create issue → assign → status change) |
| L4 | E2E | Playwright | Full user journeys across authenticated sessions |
| L5 | UI | Playwright | Component rendering, drag-drop interactions, responsive layout |

### 1.3 Test Environment

- **Backend**: `http://localhost:3000` (Next.js API routes)
- **Database**: PostgreSQL (test schema with isolation per suite)
- **Auth**: JWT tokens stored in-memory during tests
- **Fixtures**: Pre-seeded users, projects, issues, sprints

### 1.4 Quality Gates

- All API tests must pass before E2E execution
- E2E smoke tests must pass on every PR
- Drag-drop interactions require visual regression checks (pending)
- Coverage threshold: ≥80% for API layer, ≥60% for integration

### 1.5 Risk-Based Prioritization

| Priority | Area | Rationale |
|----------|------|-----------|
| P0 | Authentication | Security-critical; blocks all other flows |
| P0 | Issue CRUD | Core value proposition |
| P1 | Kanban drag-drop | High user visibility |
| P1 | Sprint state transitions | Data integrity risk |
| P2 | Project management | Admin-only, lower frequency |
| P2 | Search/filter | Validation edge cases |

---

## 2. Test Case Matrix

### 2.1 Authentication (AUTH)

| TC-ID | Feature | Description | Method | Endpoint | Input | Expected | Priority |
|-------|---------|-------------|--------|----------|-------|----------|----------|
| AUTH-001 | Register | Valid registration | POST | /api/auth/register | {email, password, displayName} | 201, user object, no token | P0 |
| AUTH-002 | Register | Duplicate email | POST | /api/auth/register | existing email | 409, conflict error | P0 |
| AUTH-003 | Register | Weak password | POST | /api/auth/register | short password | 400, validation error | P1 |
| AUTH-004 | Register | Missing fields | POST | /api/auth/register | empty body | 400, missing field errors | P0 |
| AUTH-005 | Login | Valid credentials | POST | /api/auth/login | correct email/password | 200, token + user object | P0 |
| AUTH-006 | Login | Wrong password | POST | /api/auth/login | wrong password | 401, invalid credentials | P0 |
| AUTH-007 | Login | Non-existent user | POST | /api/auth/login | unknown email | 401, invalid credentials | P1 |
| AUTH-008 | Login | Deactivated account | POST | /api/auth/login | deactivated user | 403, account deactivated | P1 |
| AUTH-009 | Token refresh | Valid refresh | POST | /api/auth/refresh | valid refresh token | 200, new access token | P1 |
| AUTH-010 | Token refresh | Expired refresh | POST | /api/auth/refresh | expired token | 401, token expired | P1 |
| AUTH-011 | Logout | Valid logout | POST | /api/auth/logout | valid token | 204 | P2 |
| AUTH-012 | Protected route | Unauthenticated | GET | /api/projects | no token | 401 | P0 |
| AUTH-013 | Protected route | Invalid token | GET | /api/projects | bad token | 401 | P1 |
| AUTH-014 | Login | SQL injection attempt | POST | /api/auth/login | email: "admin' OR '1'='1" | 401 or 400, safe handling | P1 |
| AUTH-015 | Register | XSS in displayName | POST | /api/auth/register | displayName: "<script>alert(1)</script>" | 201, input sanitized | P1 |
| AUTH-016 | Token refresh | Missing refresh token | POST | /api/auth/refresh | empty body | 400 | P2 |
| AUTH-017 | Login | Rate limiting | POST | /api/auth/login | multiple failed attempts | 429 after threshold | P2 |
| AUTH-018 | Register | Email with special chars | POST | /api/auth/register | email with + sign | 201 or 400 based on validation | P2 |
| AUTH-019 | Login | Unicode email | POST | /api/auth/login | unicode characters | 200 or 401 appropriately | P2 |
| AUTH-020 | Logout | Already logged out | POST | /api/auth/logout | no token | 401 | P2 |

### 2.2 Project CRUD (PROJ)

| TC-ID | Feature | Description | Method | Endpoint | Input | Expected | Priority |
|-------|---------|-------------|--------|----------|-------|----------|----------|
| PROJ-001 | List projects | Authenticated user | GET | /api/projects | valid token | 200, paginated list | P0 |
| PROJ-002 | List projects | Empty result | GET | /api/projects | no projects | 200, empty array | P2 |
| PROJ-003 | Create project | Valid data | POST | /api/projects | {key, name, description} | 201, project with owner role | P0 |
| PROJ-004 | Create project | Duplicate key | POST | /api/projects | existing key | 409, key exists | P1 |
| PROJ-005 | Create project | Invalid key format | POST | /api/projects | lowercase key | 400, invalid format | P1 |
| PROJ-006 | Create project | Key too long | POST | /api/projects | key > 10 chars | 400, validation error | P2 |
| PROJ-007 | Get project | Existing project | GET | /api/projects/:id | valid UUID | 200, full project object | P0 |
| PROJ-008 | Get project | Non-existent | GET | /api/projects/:id | invalid UUID | 404, not found | P1 |
| PROJ-009 | Update project | Valid update | PUT | /api/projects/:id | {name, description} | 200, updated fields | P0 |
| PROJ-010 | Update project | No permission | PUT | /api/projects/:id | member role | 403, forbidden | P1 |
| PROJ-011 | Delete project | Owner delete | DELETE | /api/projects/:id | owner token | 204 | P0 |
| PROJ-012 | Delete project | Member delete | DELETE | /api/projects/:id | member token | 403 | P1 |
| PROJ-013 | Delete project | Non-existent | DELETE | /api/projects/:id | invalid UUID | 404 | P2 |
| PROJ-014 | Soft delete | Verify inactive | GET | /api/projects | deleted project | 404 or excluded | P2 |
| PROJ-015 | List projects | Pagination | GET | /api/projects?page=2&limit=5 | valid params | 200, correct page | P2 |
| PROJ-016 | List projects | Sort by name | GET | /api/projects?sort=name&order=desc | valid params | 200, sorted results | P2 |
| PROJ-017 | Create project | Empty name | POST | /api/projects | {key: "TEST", name: ""} | 400 | P1 |
| PROJ-018 | Update project | Concurrent update | PUT | /api/projects/:id | simultaneous updates | Last write wins or conflict | P2 |

### 2.3 Issue Management (ISS)

| TC-ID | Feature | Description | Method | Endpoint | Input | Expected | Priority |
|-------|---------|-------------|--------|----------|-------|----------|----------|
| ISS-001 | List issues | Filter by project | GET | /api/issues?projectId= | valid project UUID | 200, filtered results | P0 |
| ISS-002 | List issues | Search | GET | /api/issues?search= | keyword | 200, matching issues | P1 |
| ISS-003 | List issues | Filter by status | GET | /api/issues?status=TODO | valid status | 200, only TODO issues | P1 |
| ISS-004 | List issues | Pagination | GET | /api/issues?page=2&limit=5 | valid params | 200, correct page | P2 |
| ISS-005 | List issues | Multiple filters | GET | /api/issues?projectId=&status=&assigneeId= | valid params | 200, combined filters | P1 |
| ISS-006 | Create issue | Valid creation | POST | /api/issues | {projectId, summary, type} | 201, issue with key | P0 |
| ISS-007 | Create issue | Missing required | POST | /api/issues | no projectId | 400, validation error | P0 |
| ISS-008 | Create issue | No access | POST | /api/issues | unauthorized project | 403 | P1 |
| ISS-009 | Create issue | Invalid sprint | POST | /api/issues | sprint from other project | 400 | P1 |
| ISS-010 | Create issue | Long summary | POST | /api/issues | summary > 500 chars | 400, validation error | P2 |
| ISS-011 | Create issue | Invalid issue type | POST | /api/issues | {issueType: "INVALID"} | 400 | P1 |
| ISS-012 | Get issue | Existing issue | GET | /api/issues/:id | valid UUID | 200, full issue object | P0 |
| ISS-013 | Get issue | Not found | GET | /api/issues/:id | invalid UUID | 404 | P2 |
| ISS-014 | Get issue | No access | GET | /api/issues/:id | unauthorized | 403 | P1 |
| ISS-015 | Update issue | Status change | PUT | /api/issues/:id | {status: "IN_PROGRESS"} | 200, updated status | P0 |
| ISS-016 | Update issue | Assign issue | PUT | /api/issues/:id | {assigneeId} | 200, assignee set | P1 |
| ISS-017 | Update issue | Invalid status | PUT | /api/issues/:id | {status: "INVALID"} | 400, enum validation | P1 |
| ISS-018 | Update issue | Partial update | PUT | /api/issues/:id | {priority: "HIGH"} | 200, only priority changed | P1 |
| ISS-019 | Update issue | No permission | PUT | /api/issues/:id | non-member | 403 | P1 |
| ISS-020 | Delete issue | Owner delete | DELETE | /api/issues/:id | owner token | 204 | P0 |
| ISS-021 | Delete issue | Member delete | DELETE | /api/issues/:id | member token | 403 | P1 |
| ISS-022 | Delete issue | Not found | DELETE | /api/issues/:id | invalid UUID | 404 | P2 |
| ISS-023 | Status transition | Valid flow | PUT | /api/issues/:id | TODO→IN_PROGRESS→DONE | 200 at each step | P0 |
| ISS-024 | Status transition | Invalid transition | PUT | /api/issues/:id | DONE→TODO (if restricted) | 400 or 200 | P2 |
| ISS-025 | Create issue | With labels | POST | /api/issues | {labels: ["label-id-1"]} | 201, labels attached | P1 |
| ISS-026 | Create issue | With sprint | POST | /api/issues | {sprintId: "uuid"} | 201, sprint assigned | P1 |
| ISS-027 | Create issue | With estimate | POST | /api/issues | {estimate: 8} | 201, estimate set | P2 |
| ISS-028 | Update issue | Remove assignee | PUT | /api/issues/:id | {assigneeId: null} | 200, assignee cleared | P2 |
| ISS-029 | Create issue | XSS in summary | POST | /api/issues | summary: "<script>alert(1)</script>" | 201, input sanitized | P1 |
| ISS-030 | List issues | Sort by rank | GET | /api/issues?sort=rank&order=asc | valid params | 200, ordered by rank | P2 |

### 2.4 Kanban Board Interactions (KANB)

| TC-ID | Feature | Description | Test Type | Input | Expected | Priority |
|-------|---------|-------------|-----------|-------|----------|----------|
| KANB-001 | Drag start | Initiate drag | E2E | issue element | draggable state active | P1 |
| KANB-002 | Drop on column | Change status | E2E | drop on IN_PROGRESS column | 200, status updated | P0 |
| KANB-003 | Drop same column | No change | E2E | drop on same column | 200, no status change | P2 |
| KANB-004 | Reorder within column | Rank update | E2E | drop after different issue | 200, rank updated | P1 |
| KANB-005 | Drag to invalid column | Revert | E2E | drop on non-existent column | 200, status unchanged | P2 |
| KANB-006 | Concurrent drag | Race condition | E2E | two users drag same issue | 200, last write wins | P2 |
| KANB-007 | Responsive layout | Mobile view | E2E | viewport < 768px | columns stack vertically | P2 |
| KANB-008 | Column count | Min columns | E2E | all statuses | all status columns rendered | P1 |
| KANB-009 | Drag outside board | Cancel | E2E | drag off canvas | issue returns to original position | P2 |
| KANB-010 | Drop with loading | Network delay | E2E | slow network | spinner shown, revert on fail | P2 |
| KANB-011 | Drag disabled | View-only user | E2E | viewer role | cannot drag issues | P1 |
| KANB-012 | Column width | Resize | E2E | resize column | issues fit, no overflow | P2 |

### 2.5 Sprint Management (SPRINT)

| TC-ID | Feature | Description | Method | Endpoint | Input | Expected | Priority |
|-------|---------|-------------|--------|----------|-------|----------|----------|
| SPRINT-001 | List sprints | By project | GET | /api/sprints?projectId= | valid project ID | 200, sprint list | P0 |
| SPRINT-002 | Create sprint | Valid creation | POST | /api/sprints | {projectId, name, startDate, endDate} | 201, BACKLOG state | P0 |
| SPRINT-003 | Create sprint | Invalid dates | POST | /api/sprints | endDate < startDate | 400, date validation | P1 |
| SPRINT-004 | Create sprint | No permission | POST | /api/sprints | member role | 403 | P1 |
| SPRINT-005 | Activate sprint | BACKLOG→ACTIVE | PUT | /api/sprints/:id | {state: "ACTIVE"} | 200, ACTIVE state | P0 |
| SPRINT-006 | Activate sprint | Past start date | PUT | /api/sprints/:id | startDate in future | 400, date constraint | P1 |
| SPRINT-007 | Close sprint | ACTIVE→CLOSED | PUT | /api/sprints/:id | {state: "CLOSED"} | 200, CLOSED state | P0 |
| SPRINT-008 | Close sprint | Already closed | PUT | /api/sprints/:id | {state: "CLOSED"} | 400, already closed | P2 |
| SPRINT-009 | Update sprint | Rename | PUT | /api/sprints/:id | {name} | 200, updated name | P1 |
| SPRINT-010 | Sprint issues | Filter by sprint | GET | /api/issues?sprintId= | valid sprint UUID | 200, filtered issues | P1 |
| SPRINT-011 | Move to sprint | Active sprint | PUT | /api/issues/:id | {sprintId: active_sprint} | 200, sprint assigned | P1 |
| SPRINT-012 | Move to sprint | Closed sprint | PUT | /api/issues/:id | {sprintId: closed_sprint} | 400, sprint closed | P1 |
| SPRINT-013 | Create sprint | Name too long | POST | /api/sprints | name > 200 chars | 400 | P2 |
| SPRINT-014 | FUTURE→ACTIVE | Valid transition | PUT | /api/sprints/:id | {state: "ACTIVE"} | 200, ACTIVE state | P1 |
| SPRINT-015 | List sprints | Filter by state | GET | /api/sprints?state=ACTIVE | valid state | 200, only ACTIVE sprints | P2 |

### 2.6 Edge Cases & Boundary Testing

| TC-ID | Category | Description | Expected | Priority |
|-------|----------|-------------|----------|----------|
| EDGE-001 | Auth | Concurrent login attempts | Both succeed independently | P2 |
| EDGE-002 | Auth | Token expiry during request | 401, redirect to login | P1 |
| EDGE-003 | Project | Project with 0 issues | Display empty state gracefully | P2 |
| EDGE-004 | Project | Project with 1000+ issues | Pagination works correctly | P2 |
| EDGE-005 | Issue | Issue with 0 estimate | Display as "—" or blank | P2 |
| EDGE-006 | Issue | All issues assigned | Assignment dropdown shows all members | P1 |
| EDGE-007 | Issue | Deleting issue with comments | Comments also deleted (cascade) | P1 |
| EDGE-008 | Sprint | Sprint with issues across statuses | Close shows completion summary | P2 |
| EDGE-009 | Sprint | Activate sprint with past start date | Reject with error | P1 |
| EDGE-010 | General | API returns 500 error | User sees error boundary, not crash | P1 |
| EDGE-011 | General | Network disconnect during edit | Optimistic update reverts on failure | P2 |
| EDGE-012 | General | Very large file attachment | Upload fails with appropriate error | P2 |
| EDGE-013 | Search | Empty search query | Returns all issues (or no filter) | P2 |
| EDGE-014 | Search | Search with special characters | Escaped properly, no SQL injection | P1 |
| EDGE-015 | Validation | UUID format validation | Invalid UUIDs rejected at API level | P1 |
| EDGE-016 | Timezone | Cross-timezone users | Dates display correctly per user TZ | P2 |
| EDGE-017 | Concurrency | Two users update same issue | Last write wins or conflict resolved | P2 |
| EDGE-018 | Role | Viewer tries to create issue | 403 Forbidden | P1 |
| EDGE-019 | Role | Admin removes themselves | Cannot remove own last admin role | P2 |
| EDGE-020 | Performance | Load 100 issues on board | Render within 2 seconds | P2 |

---

## 3. API Test Scripts

### 3.1 Jest API Tests

See `api-tests.test.js` for complete Jest-based API tests covering:
- Authentication flows (register, login, refresh, logout)
- Project CRUD operations
- Issue management (create, read, update, delete)
- Sprint lifecycle (create, activate, close)

### 3.2 Postman Collection

See `jira-clone-tests.postman_collection.json` for Postman collection that can be:
- Imported into Postman Desktop App
- Run with Newman CLI: `newman run jira-clone-tests.postman_collection.json`

### 3.3 Newman Run Command

```bash
newman run jira-clone-tests.postman_collection.json \
  --environment '{"variables": [{"key": "baseUrl", "value": "http://localhost:3000"}]}' \
  --reporters cli,html \
  --reporter-html-export ./reports/newman-report.html
```

---

## 4. E2E Test Scenarios

### 4.1 Playwright Configuration

See `playwright.config.js` for Playwright configuration with:
- Multi-browser support (Chromium, Firefox, WebKit)
- HTML reporter for detailed test results
- Automatic web server startup

### 4.2 Running E2E Tests

```bash
# Install dependencies
npm install -D @playwright/test

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e-tests.spec.js

# Run with headed browser (visible UI)
npx playwright test --headed

# Run for specific browser
npx playwright test --project=chromium
```

### 4.3 E2E Test Coverage

See `e2e-tests.spec.js` for Playwright E2E tests covering:
- Authentication flows (login, register, protected routes)
- Project management (create, update, delete)
- Issue management (create, update status, assign, filter)
- Kanban board interactions (drag-drop, reorder)
- Sprint management (create, activate, close)
- Edge cases (empty states, network errors, theme persistence)

---

## 5. Edge Cases & Boundary Testing

### 5.1 Security Edge Cases

| Scenario | Test | Expected Result |
|----------|------|-----------------|
| SQL Injection in login | `email: "admin' OR '1'='1"` | 401 or 400, no data leak |
| XSS in displayName | `"<script>alert(1)</script>"` | 201, input sanitized on output |
| JWT tampering | Modify token payload | 401 Unauthorized |
| Concurrent edits | Two users update same issue | Last write wins or conflict handled |
| Permission escalation | Member tries admin action | 403 Forbidden |

### 5.2 Boundary Testing

| Area | Boundary | Test Input | Expected |
|------|----------|------------|----------|
| Project key | Max length (10 chars) | `"ABCDEFGHIJ"` | Accept |
| Project key | Min length (2 chars) | `"AB"` | Accept |
| Project key | Too short | `"A"` | 400 |
| Issue summary | Max length (500 chars) | 500 chars | Accept |
| Issue summary | Over max | 501 chars | 400 |
| Password | Min length (8 chars) | 8 chars with requirements | Accept |
| Password | Weak | `"weak"` | 400 |
| Sprint name | Max length (200 chars) | 200 chars | Accept |
| Sprint name | Over max | 201 chars | 400 |
| Estimate | Negative value | `-1` | 400 |
| Estimate | Zero | `0` | Accept |
| Page limit | Max (100) | `limit=100` | Accept |
| Page limit | Over max | `limit=101` | 400 or clamp to 100 |

### 5.3 Concurrency Testing

| Scenario | Test | Expected |
|----------|------|----------|
| Simultaneous login | Two logins for same user | Both succeed |
| Concurrent issue update | Two users update same issue | Last write wins |
| Concurrent sprint close | Two users close same sprint | One succeeds, one gets error |
| Drag-drop race | Two users drag same issue | Appropriate conflict handling |

### 5.4 Performance Testing

| Metric | Threshold | Test |
|--------|-----------|------|
| API response time | < 500ms (p95) | Load test with 100 concurrent requests |
| Board render time | < 2s for 100 issues | Load board with 100 issues |
| Search response | < 1s | Full-text search with 1000 issues |
| Page load time | < 3s | First contentful paint on dashboard |

---

## 6. Test Execution

### 6.1 Quick Start

```bash
# 1. Navigate to test directory
cd /opt/data/jira-clone/qa-test-plan

# 2. Install test dependencies
npm install --save-dev jest supertest @playwright/test

# 3. Run unit tests
npm test -- unit-tests.test.js

# 4. Run API tests (requires running server)
npm test -- api-tests.test.js

# 5. Run E2E tests
npx playwright test
```

### 6.2 CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: QA Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: jira_clone_test
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm test -- api-tests.test.js
      - run: npx playwright test --project=chromium
```

### 6.3 Test Reports

| Report Type | Location | Generated By |
|-------------|----------|--------------|
| Jest HTML | `reports/jest-report.html` | `jest --coverage` |
| Playwright HTML | `playwright-report/index.html` | `playwright test` |
| Newman HTML | `reports/newman-report.html` | `newman run` |

### 6.4 Environment Variables

```bash
# Required for tests
BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/jira_clone_test
JWT_SECRET=test-secret-key
```

---

## Appendix A: Test File Index

| File | Description |
|------|-------------|
| `QA_TEST_STRATEGY.md` | This document - test strategy and approach |
| `TEST_CASE_MATRIX.md` | Complete test case matrix with IDs and descriptions |
| `unit-tests.test.js` | Jest unit tests for utility functions |
| `api-tests.test.js` | Jest + Supertest API integration tests |
| `e2e-tests.spec.js` | Playwright end-to-end browser tests |
| `jira-clone-tests.postman_collection.json` | Postman collection for manual/API testing |
| `playwright.config.js` | Playwright configuration |

---

## Appendix B: Coverage Goals

| Layer | Target Coverage | Rationale |
|-------|-----------------|-----------|
| Unit Tests | ≥90% | Core logic, validation, helpers |
| API Tests | ≥80% | Business logic, error handling |
| E2E Tests | ≥60% | Critical user journeys |
| **Overall** | **≥75%** | Combined coverage target |

---

*Document Version: 1.0*
*Last Updated: 2026-10-05*
