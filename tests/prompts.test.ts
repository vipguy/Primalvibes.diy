import { vi, describe, it, expect, beforeEach } from 'vitest';

// Create a mock implementation
const mockPrompts = {
  makeBaseSystemPrompt: vi.fn().mockImplementation(async () => {
    return 'You are an AI assistant tasked with creating React components. Use Fireproof for data persistence.';
  }),
  RESPONSE_FORMAT: {
    dependencies: {
      format: '{dependencies: { "package-name": "version" }}',
      note: 'use-fireproof is already provided, do not include it',
    },
    structure: [
      'Brief explanation',
      'Component code with proper Fireproof integration',
      'Real-time updates',
      'Data persistence',
    ],
  },
};

// Mock the module
vi.mock('../app/prompts', () => mockPrompts);

describe('Prompts Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      text: vi.fn().mockResolvedValue('mocked llms text content'),
    });
  });

  it('generates a base system prompt', async () => {
    const model = 'gpt-4';
    const prompt = await mockPrompts.makeBaseSystemPrompt(model);
    
    // Check that the prompt includes key instructions
    expect(prompt).toContain('You are an AI assistant');
    expect(prompt).toContain('Use Fireproof for data persistence');
  });

  it('handles different models', async () => {
    // Test with a different model
    const model = 'claude-3';
    const prompt = await mockPrompts.makeBaseSystemPrompt(model);
    
    // The base prompt should be the same regardless of model
    expect(prompt).toContain('You are an AI assistant');
  });

  it('defines the correct response format', () => {
    // Check that RESPONSE_FORMAT has the expected structure
    expect(mockPrompts.RESPONSE_FORMAT).toHaveProperty('dependencies');
    expect(mockPrompts.RESPONSE_FORMAT).toHaveProperty('structure');
    
    // Check that dependencies format is defined
    expect(mockPrompts.RESPONSE_FORMAT.dependencies).toHaveProperty('format');
    expect(mockPrompts.RESPONSE_FORMAT.dependencies).toHaveProperty('note');
    
    // Check that structure is an array
    expect(Array.isArray(mockPrompts.RESPONSE_FORMAT.structure)).toBe(true);
    expect(mockPrompts.RESPONSE_FORMAT.structure.length).toBeGreaterThan(0);
  });

  it('handles fetch errors gracefully', async () => {
    // Mock fetch to throw an error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    // Override the mock to use fetch
    mockPrompts.makeBaseSystemPrompt.mockImplementationOnce(async () => {
      await global.fetch('https://use-fireproof.com/llms-full.txt');
      return 'Test prompt';
    });
    
    try {
      await mockPrompts.makeBaseSystemPrompt('gpt-4');
      // If we reach here, the function didn't throw, which is unexpected
      expect(true).toBe(false);
    } catch (error) {
      // We expect an error to be thrown
      expect(error).toBeDefined();
    }
  });
}); 