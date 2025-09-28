import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TemplateService } from '../template';
import type { ReviewTemplate, TemplateError } from '../../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('TemplateService', () => {
  let templateService: TemplateService;
  const STORAGE_KEY = 'github-pr-review-templates';

  beforeEach(() => {
    templateService = new TemplateService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getDefaultTemplate', () => {
    it('should return a valid default template', () => {
      const defaultTemplate = templateService.getDefaultTemplate();

      expect(defaultTemplate.name).toBe('default');
      expect(defaultTemplate.description).toBeTruthy();
      expect(defaultTemplate.content).toBeTruthy();
      expect(defaultTemplate.prompts).toBeDefined();
      expect(defaultTemplate.rules).toBeDefined();
      expect(defaultTemplate.criteria).toBeDefined();
      expect(Array.isArray(defaultTemplate.criteria)).toBe(true);
    });

    it('should have all required prompts', () => {
      const defaultTemplate = templateService.getDefaultTemplate();
      const requiredPrompts = ['codeQuality', 'security', 'performance', 'maintainability', 'testing'];

      requiredPrompts.forEach(prompt => {
        expect(defaultTemplate.prompts[prompt as keyof typeof defaultTemplate.prompts]).toBeTruthy();
      });
    });

    it('should have valid rules configuration', () => {
      const defaultTemplate = templateService.getDefaultTemplate();

      expect(typeof defaultTemplate.rules.maxComplexity).toBe('number');
      expect(defaultTemplate.rules.maxComplexity).toBeGreaterThan(0);
      expect(typeof defaultTemplate.rules.requireTests).toBe('boolean');
      expect(Array.isArray(defaultTemplate.rules.securityChecks)).toBe(true);
      expect(defaultTemplate.rules.securityChecks.length).toBeGreaterThan(0);
    });
  });

  describe('loadTemplate', () => {
    it('should return default template when name is "default"', async () => {
      const template = await templateService.loadTemplate('default');
      
      expect(template.name).toBe('default');
      expect(template.description).toBeTruthy();
    });

    it('should load custom template from storage', async () => {
      const customTemplate: ReviewTemplate = {
        name: 'custom',
        description: 'Custom template',
        content: 'Custom content',
        prompts: {
          codeQuality: 'Custom quality prompt',
          security: 'Custom security prompt',
          performance: 'Custom performance prompt',
          maintainability: 'Custom maintainability prompt',
          testing: 'Custom testing prompt'
        },
        rules: {
          maxComplexity: 15,
          requireTests: false,
          securityChecks: ['custom_check']
        },
        criteria: ['Custom criteria']
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify([customTemplate]));

      const loadedTemplate = await templateService.loadTemplate('custom');
      
      expect(loadedTemplate).toEqual(customTemplate);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should throw error when template not found', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      await expect(templateService.loadTemplate('nonexistent')).rejects.toThrow();
    });

    it('should throw error when localStorage contains invalid JSON', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      await expect(templateService.loadTemplate('custom')).rejects.toThrow();
    });
  });

  describe('saveTemplate', () => {
    const validTemplate: ReviewTemplate = {
      name: 'test',
      description: 'Test template',
      content: 'Test content',
      prompts: {
        codeQuality: 'Quality prompt',
        security: 'Security prompt',
        performance: 'Performance prompt',
        maintainability: 'Maintainability prompt',
        testing: 'Testing prompt'
      },
      rules: {
        maxComplexity: 10,
        requireTests: true,
        securityChecks: ['test_check']
      },
      criteria: ['Test criteria']
    };

    it('should save valid template to localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      await templateService.saveTemplate(validTemplate);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify([validTemplate])
      );
    });

    it('should replace existing template with same name', async () => {
      const existingTemplate = { ...validTemplate, description: 'Old description' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingTemplate]));

      await templateService.saveTemplate(validTemplate);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify([validTemplate])
      );
    });

    it('should throw validation error for invalid template', async () => {
      const invalidTemplate = { ...validTemplate, name: '' };

      await expect(templateService.saveTemplate(invalidTemplate)).rejects.toThrow();
    });

    it('should throw validation error for missing prompts', async () => {
      const invalidTemplate = { 
        ...validTemplate, 
        prompts: { ...validTemplate.prompts, codeQuality: '' }
      };

      await expect(templateService.saveTemplate(invalidTemplate)).rejects.toThrow();
    });

    it('should throw validation error for invalid rules', async () => {
      const invalidTemplate = { 
        ...validTemplate, 
        rules: { ...validTemplate.rules, maxComplexity: -1 }
      };

      await expect(templateService.saveTemplate(invalidTemplate)).rejects.toThrow();
    });
  });

  describe('listTemplates', () => {
    it('should return default template when no custom templates exist', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const templates = await templateService.listTemplates();

      expect(templates).toContain('default');
      expect(templates.length).toBe(1);
    });

    it('should return all templates including default', async () => {
      const customTemplates = [
        { name: 'custom1', description: 'Custom 1' },
        { name: 'custom2', description: 'Custom 2' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(customTemplates));

      const templates = await templateService.listTemplates();

      expect(templates).toContain('default');
      expect(templates).toContain('custom1');
      expect(templates).toContain('custom2');
      expect(templates.length).toBe(3);
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const templates = await templateService.listTemplates();

      expect(templates).toEqual(['default']);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete custom template from storage', async () => {
      const templates = [
        { name: 'custom1', description: 'Custom 1' },
        { name: 'custom2', description: 'Custom 2' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(templates));

      await templateService.deleteTemplate('custom1');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify([{ name: 'custom2', description: 'Custom 2' }])
      );
    });

    it('should throw error when trying to delete default template', async () => {
      await expect(templateService.deleteTemplate('default')).rejects.toThrow();
    });

    it('should throw error when template not found', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      await expect(templateService.deleteTemplate('nonexistent')).rejects.toThrow();
    });
  });

  describe('parseMarkdownTemplate', () => {
    it('should parse basic markdown template structure', () => {
      const markdown = `# Test Template

## Description
Test description

## Criteria
- Code Quality
- Security

## Prompts

### Code Quality
Review code quality aspects

### Security
Check for security issues

## Rules
- maxComplexity: 15
- requireTests: false
- input_validation
- sql_injection`;

      const parsed = templateService.parseMarkdownTemplate(markdown);

      expect(parsed.content).toBe(markdown);
      expect(parsed.criteria).toContain('Code Quality');
      expect(parsed.criteria).toContain('Security');
      expect(parsed.prompts?.codeQuality).toContain('Review code quality aspects');
      expect(parsed.prompts?.security).toContain('Check for security issues');
    });

    it('should handle empty markdown content', () => {
      const parsed = templateService.parseMarkdownTemplate('');

      expect(parsed.content).toBe('');
      expect(parsed.criteria).toEqual([]);
      expect(parsed.prompts?.codeQuality).toBe('');
    });

    it('should throw error for invalid markdown structure', () => {
      expect(() => {
        templateService.parseMarkdownTemplate(null as any);
      }).toThrow();
    });
  });

  describe('error handling', () => {
    it('should create proper TemplateError objects', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      try {
        await templateService.loadTemplate('nonexistent');
        expect.fail('Should have thrown an error');
      } catch (error) {
        const templateError = error as TemplateError;
        expect(templateError.type).toBe('template');
        expect(templateError.reason).toBe('missing_file');
        expect(templateError.message).toBeTruthy();
        expect(templateError.code).toBeTruthy();
        expect(templateError.timestamp).toBeTruthy();
      }
    });

    it('should handle validation errors properly', async () => {
      const invalidTemplate = {
        name: '',
        description: '',
        content: '',
        prompts: {},
        rules: {},
        criteria: []
      } as ReviewTemplate;

      try {
        await templateService.saveTemplate(invalidTemplate);
      } catch (error) {
        const templateError = error as TemplateError;
        expect(templateError.type).toBe('template');
        expect(templateError.reason).toBe('validation_error');
        expect(templateError.details).toBeTruthy();
      }
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete template lifecycle', async () => {
      // Start with empty storage
      localStorageMock.getItem.mockReturnValue(null);

      // List templates (should only have default)
      let templates = await templateService.listTemplates();
      expect(templates).toEqual(['default']);

      // Create and save a custom template
      const customTemplate: ReviewTemplate = {
        name: 'integration-test',
        description: 'Integration test template',
        content: 'Test content',
        prompts: {
          codeQuality: 'Quality prompt',
          security: 'Security prompt',
          performance: 'Performance prompt',
          maintainability: 'Maintainability prompt',
          testing: 'Testing prompt'
        },
        rules: {
          maxComplexity: 12,
          requireTests: true,
          securityChecks: ['integration_check']
        },
        criteria: ['Integration criteria']
      };

      // Mock storage to return our template after saving
      localStorageMock.getItem.mockReturnValue(JSON.stringify([customTemplate]));
      
      await templateService.saveTemplate(customTemplate);

      // List templates (should now include custom)
      templates = await templateService.listTemplates();
      expect(templates).toContain('default');
      expect(templates).toContain('integration-test');

      // Load the custom template
      const loadedTemplate = await templateService.loadTemplate('integration-test');
      expect(loadedTemplate).toEqual(customTemplate);

      // Delete the custom template
      // Mock that template exists before deletion
      localStorageMock.getItem.mockReturnValue(JSON.stringify([customTemplate]));
      await templateService.deleteTemplate('integration-test');
      
      // Mock empty storage after deletion
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      // Verify deletion
      templates = await templateService.listTemplates();
      expect(templates).toEqual(['default']);
    });
  });
});