import { vi, afterAll } from 'vitest';

// Mock the makeBaseSystemPrompt function
vi.mock('../app/prompts', () => ({
  makeBaseSystemPrompt: vi.fn().mockReturnValue('mocked system prompt'),
}));

// Mock React Router
vi.mock('react-router', () => ({
  useNavigate: vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
}));

// Mock console.debug to avoid cluttering test output
const originalConsoleDebug = console.debug;
console.debug = vi.fn();

// Restore console.debug after tests
afterAll(() => {
  console.debug = originalConsoleDebug;
});

// Mock TextEncoder if not available in the test environment
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(text: string): Uint8Array {
      return new Uint8Array(Buffer.from(text));
    }
  } as any;
} 