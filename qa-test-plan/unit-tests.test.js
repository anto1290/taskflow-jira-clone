/**
 * Jest Unit Tests for Jira-Clone Utilities
 */

describe('Authentication Utils', () => {
  describe('password validation', () => {
    it('should accept strong passwords', () => {
      expect(validatePassword('StrongPass123')).toBe(true);
      expect(validatePassword('Test1234!')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('nouppercase1')).toBe(false);
      expect(validatePassword('NOLOWER1')).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(validatePassword('NoNumberHere!')).toBe(false);
    });
  });

  describe('email validation', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user.name@example.com')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });
});

describe('Issue Key Generation', () => {
  it('should generate sequential keys', () => {
    const key1 = generateIssueKey('PROJ', 1);
    const key2 = generateIssueKey('PROJ', 2);
    
    expect(key1).toBe('PROJ-1');
    expect(key2).toBe('PROJ-2');
  });

  it('should handle zero count', () => {
    const key = generateIssueKey('TEST', 0);
    expect(key).toBe('TEST-0');
  });
});

describe('Sprint Date Validation', () => {
  it('should accept valid date ranges', () => {
    const start = '2026-10-01T00:00:00Z';
    const end = '2026-10-14T23:59:59Z';
    
    expect(validateSprintDates(start, end)).toBe(true);
  });

  it('should reject end date before start date', () => {
    const start = '2026-10-14T00:00:00Z';
    const end = '2026-10-01T00:00:00Z';
    
    expect(validateSprintDates(start, end)).toBe(false);
  });

  it('should reject empty dates', () => {
    expect(validateSprintDates('', '2026-10-14T00:00:00Z')).toBe(false);
    expect(validateSprintDates('2026-10-01T00:00:00Z', '')).toBe(false);
  });
});

describe('Status Transition Validation', () => {
  it('should allow valid transitions', () => {
    expect(canTransition('TODO', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'IN_REVIEW')).toBe(true);
    expect(canTransition('IN_REVIEW', 'DONE')).toBe(true);
    expect(canTransition('TODO', 'CANCELLED')).toBe(true);
  });

  it('should block invalid transitions', () => {
    expect(canTransition('DONE', 'TODO')).toBe(false);
    expect(canTransition('CANCELLED', 'IN_PROGRESS')).toBe(false);
    expect(canTransition('IN_PROGRESS', 'TODO')).toBe(false);
  });

  it('should handle same status', () => {
    expect(canTransition('TODO', 'TODO')).toBe(true);
  });
});

describe('Pagination Helper', () => {
  it('should calculate total pages correctly', () => {
    expect(calculateTotalPages(25, 10)).toBe(3);
    expect(calculateTotalPages(20, 10)).toBe(2);
    expect(calculateTotalPages(5, 10)).toBe(1);
    expect(calculateTotalPages(0, 10)).toBe(0);
  });

  it('should clamp page number', () => {
    expect(clampPage(0, 100)).toBe(1);
    expect(clampPage(5, 100)).toBe(5);
    expect(clampPage(10, 100)).toBe(10);
  });
});

// ==================== HELPER FUNCTIONS ====================

function validatePassword(password) {
  // Ponytail: Simple validation for tests; upgrade to zod schema when adding complex rules
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

function validateEmail(email) {
  // Ponytail: Basic regex; upgrade to email-validator library when handling edge cases
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateIssueKey(projectKey, count) {
  return `${projectKey}-${count}`;
}

function validateSprintDates(startDate, endDate) {
  if (!startDate || !endDate) return false;
  return new Date(endDate) > new Date(startDate);
}

function canTransition(fromStatus, toStatus) {
  const validTransitions = {
    'TODO': ['TODO', 'IN_PROGRESS', 'CANCELLED'],
    'IN_PROGRESS': ['IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'],
    'IN_REVIEW': ['IN_REVIEW', 'DONE', 'CANCELLED'],
    'DONE': ['DONE'],
    'CANCELLED': ['CANCELLED']
  };
  
  return validTransitions[fromStatus]?.includes(toStatus) ?? false;
}

function calculateTotalPages(total, limit) {
  return Math.ceil(total / limit);
}

function clampPage(page, total) {
  return Math.max(1, Math.min(page, total || 1));
}
