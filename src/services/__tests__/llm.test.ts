import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { LLMService } from '../llm';
import type { ReviewTemplate, LLMError } from '../../types';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('LLMService', () => {
  let llmService: LLMService;
  let mockTemplate: ReviewTemplate;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      post: vi.fn(),
      defaults: {
        headers: {},
        baseURL: '',
        timeout: 0,
      },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockedAxios.isAxiosError.mockImplementation((error) => {
      return error && typeof error === 'object' && 'isAxiosError' in error;
    });

    llmService = new LLMService({
      apiKey: 'test-api-key',
      model: 'gpt-4',
    });

    mockTemplate = {
      name: 'Test Template',
      description: 'Test template for unit tests',
      content: 'Test content',
      prompts: {
        codeQuality: 'Check for code quality issues',
        security: 'Look for security vulnerabilities',
        performance: 'Identify performance bottlenecks',
        maintainability: 'Assess code maintainability',
        testing: 'Evaluate test coverage and quality',
      },
      rules: {
        maxComplexity: 10,
        requireTests: true,
        securityChecks: ['sql-injection', 'xss', 'csrf'],
      },
      criteria: ['Clean code', 'Best practices', 'Documentation'],
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const service = new LLMService();
      expect(service.isConfigured()).toBe(false);
    });

    it('should create instance with custom config', () => {
      const config = {
        apiKey: 'custom-key',
        model: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.5,
      };
      const service = new LLMService(config);
      
      const serviceConfig = service.getConfig();
      expect(serviceConfig.model).toBe('gpt-3.5-turbo');
      expect(serviceConfig.maxTokens).toBe(2000);
      expect(serviceConfig.temperature).toBe(0.5);
    });

    it('should setup axios client with correct headers', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.openai.com/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
      });
    });
  });

  describe('configure', () => {
    it('should update API key and model', () => {
      const mockInstance = llmService['client'];
      llmService.configure('new-api-key', 'gpt-3.5-turbo');
      
      expect(mockInstance.defaults.headers['Authorization']).toBe('Bearer new-api-key');
      expect(llmService.getConfig().model).toBe('gpt-3.5-turbo');
    });
  });

  describe('analyzeCode', () => {
    const mockDiff = `
diff --git a/src/example.js b/src/example.js
index 1234567..abcdefg 100644
--- a/src/example.js
+++ b/src/example.js
@@ -1,3 +1,6 @@
 function example() {
+  // TODO: Add validation
   console.log('Hello World');
+  var x = 1;
 }
`;

    it('should throw error if API key not configured', async () => {
      const unconfiguredService = new LLMService();
      
      await expect(unconfiguredService.analyzeCode(mockDiff, mockTemplate))
        .rejects.toThrow('API key not configured');
    });

    it('should successfully analyze code and return comments', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              comments: [
                {
                  file: 'src/example.js',
                  line: 2,
                  content: 'Consider adding input validation',
                  severity: 'warning',
                  category: 'code_quality'
                },
                {
                  file: 'src/example.js',
                  line: 4,
                  content: 'Use const or let instead of var',
                  severity: 'info',
                  category: 'maintainability'
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        }
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await llmService.analyzeCode(mockDiff, mockTemplate);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        file: 'src/example.js',
        line: 2,
        content: 'Consider adding input validation',
        severity: 'warning',
        status: 'pending',
        category: 'code_quality'
      });
      expect(result[0].id).toBeDefined();
      expect(result[0].createdAt).toBeDefined();
    });

    it('should handle response wrapped in markdown code blocks', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '```json\n' + JSON.stringify({
              comments: [{
                file: 'src/example.js',
                line: 2,
                content: 'Test comment',
                severity: 'info'
              }]
            }) + '\n```'
          }
        }]
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await llmService.analyzeCode(mockDiff, mockTemplate);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test comment');
    });

    it('should throw error for invalid JSON response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockResolvedValue({ data: mockResponse });

      await expect(llmService.analyzeCode(mockDiff, mockTemplate))
        .rejects.toThrow('Failed to parse LLM response as JSON');
    });

    it('should throw error for missing comments array', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({ invalid: 'structure' })
          }
        }]
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockResolvedValue({ data: mockResponse });

      await expect(llmService.analyzeCode(mockDiff, mockTemplate))
        .rejects.toThrow('Response does not contain valid comments array');
    });

    it('should throw error for invalid comment structure', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              comments: [
                { file: 'test.js' } // Missing required fields
              ]
            })
          }
        }]
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockResolvedValue({ data: mockResponse });

      await expect(llmService.analyzeCode(mockDiff, mockTemplate))
        .rejects.toThrow('Invalid comment structure at index 0');
    });

    it('should handle API timeout error', async () => {
      const timeoutError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded'
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockRejectedValue(timeoutError);

      await expect(llmService.analyzeCode(mockDiff, mockTemplate))
        .rejects.toMatchObject({
          type: 'llm',
          reason: 'timeout',
          message: 'Request timed out'
        });
    });

    it('should handle 401 unauthorized error', async () => {
      const unauthorizedError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } }
        }
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockRejectedValue(unauthorizedError);

      await expect(llmService.analyzeCode(mockDiff, mockTemplate))
        .rejects.toMatchObject({
          type: 'llm',
          reason: 'configuration_error',
          message: 'Invalid API key'
        });
    });

    it('should handle 429 rate limit error', async () => {
      const rateLimitError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } }
        }
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockRejectedValue(rateLimitError);

      await expect(llmService.analyzeCode(mockDiff, mockTemplate))
        .rejects.toMatchObject({
          type: 'llm',
          reason: 'quota_exceeded',
          message: 'Rate limit exceeded'
        });
    });

    it('should handle server errors (5xx)', async () => {
      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: { message: 'Internal server error' } }
        }
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockRejectedValue(serverError);

      await expect(llmService.analyzeCode(mockDiff, mockTemplate))
        .rejects.toMatchObject({
          type: 'llm',
          reason: 'api_failure',
          message: 'Server error: 500'
        });
    });

    it('should handle network errors', async () => {
      const networkError = {
        isAxiosError: true,
        message: 'Network Error'
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockRejectedValue(networkError);

      await expect(llmService.analyzeCode(mockDiff, mockTemplate))
        .rejects.toMatchObject({
          type: 'llm',
          reason: 'api_failure',
          message: 'Network error'
        });
    });
  });

  describe('isConfigured', () => {
    it('should return true when API key and model are set', () => {
      expect(llmService.isConfigured()).toBe(true);
    });

    it('should return false when API key is missing', () => {
      const service = new LLMService({ model: 'gpt-4' });
      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when model is missing', () => {
      const service = new LLMService({ apiKey: 'test-key', model: '' });
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return config without API key', () => {
      const config = llmService.getConfig();
      
      expect(config).toHaveProperty('model', 'gpt-4');
      expect(config).toHaveProperty('baseURL', 'https://api.openai.com/v1');
      expect(config).toHaveProperty('maxTokens', 4000);
      expect(config).toHaveProperty('temperature', 0.1);
      expect(config).not.toHaveProperty('apiKey');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration partially', () => {
      llmService.updateConfig({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 2000
      });

      const config = llmService.getConfig();
      expect(config.model).toBe('gpt-3.5-turbo');
      expect(config.temperature).toBe(0.5);
      expect(config.maxTokens).toBe(2000);
    });

    it('should update axios headers when API key is updated', () => {
      const mockInstance = llmService['client'];
      
      llmService.updateConfig({ apiKey: 'new-api-key' });
      
      expect(mockInstance.defaults.headers['Authorization']).toBe('Bearer new-api-key');
    });

    it('should update axios baseURL when baseURL is updated', () => {
      const mockInstance = llmService['client'];
      
      llmService.updateConfig({ baseURL: 'https://custom-api.com/v1' });
      
      expect(mockInstance.defaults.baseURL).toBe('https://custom-api.com/v1');
    });

    it('should update axios timeout when timeout is updated', () => {
      const mockInstance = llmService['client'];
      
      llmService.updateConfig({ timeout: 60000 });
      
      expect(mockInstance.defaults.timeout).toBe(60000);
    });
  });

  describe('prompt construction', () => {
    it('should construct proper prompt with template data', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({ comments: [] })
          }
        }]
      };

      const mockInstance = llmService['client'];
      mockInstance.post.mockResolvedValue({ data: mockResponse });

      await llmService.analyzeCode('test diff', mockTemplate);

      expect(mockInstance.post).toHaveBeenCalledWith('/chat/completions', 
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Code Quality: Check for code quality issues')
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('test diff')
            })
          ]),
          max_tokens: 4000,
          temperature: 0.1
        })
      );
    });
  });

  describe('error creation', () => {
    it('should create properly formatted LLM errors', () => {
      const error = llmService['createLLMError']('api_failure', 'Test error message');
      
      expect(error).toMatchObject({
        type: 'llm',
        code: 'LLM_API_FAILURE',
        message: 'Test error message',
        reason: 'api_failure'
      });
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('comment validation', () => {
    it('should validate correct comment structure', () => {
      const validComment = {
        file: 'test.js',
        line: 10,
        content: 'Test comment'
      };
      
      expect(llmService['isValidComment'](validComment)).toBe(true);
    });

    it('should reject invalid comment structures', () => {
      const invalidComments = [
        { file: '', line: 10, content: 'Test' }, // empty file
        { file: 'test.js', line: 0, content: 'Test' }, // invalid line
        { file: 'test.js', line: 10, content: '' }, // empty content
        { file: 'test.js', line: 10 }, // missing content
        { file: 'test.js', content: 'Test' }, // missing line
        { line: 10, content: 'Test' }, // missing file
        null, // null
        'string', // not object
      ];

      invalidComments.forEach(comment => {
        expect(llmService['isValidComment'](comment)).toBe(false);
      });
    });
  });

  describe('comment ID generation', () => {
    it('should generate unique comment IDs', () => {
      const id1 = llmService['generateCommentId']();
      const id2 = llmService['generateCommentId']();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^llm-comment-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^llm-comment-\d+-[a-z0-9]+$/);
    });
  });
});