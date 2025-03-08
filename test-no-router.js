#!/usr/bin/env node

// Custom test runner that disables React Router for tests
process.env.DISABLE_REACT_ROUTER = 'true';
process.env.NODE_ENV = 'test';

// Run Vitest with the test environment
require('vitest/vitest.mjs').run(['run']); 