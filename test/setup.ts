import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from './test-utils';

// Global test setup
beforeAll(() => {
  setupTestEnvironment();
  console.log('🧪 Test environment initialized');
});

afterAll(() => {
  cleanupTestEnvironment();
  console.log('🧹 Test environment cleaned up');
});

// Per-test setup
beforeEach(() => {
  // Reset any per-test state
});

afterEach(() => {
  // Cleanup after each test
  cleanupTestEnvironment();
});