import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  createCustomTemplate, 
  getTemplateList, 
  validateTemplateContent,
  createTemplateFromMarkdown,
  exportTemplateToMarkdown,
  duplicateTemplate
} from '../templateUtils';
import { templateService } from '../../services';
import { ReviewTemplate } from '../../types';

// Mock the template service
vi.mock('../../services', () => ({
  templateService: {
    getDefaultTemplate: vi.fn(),
    saveTemplate: vi.fn(),
    loadTemplate: vi.fn(),
    listTemplates: vi.fn(),
    parseMarkdownTemplate: vi.fn()
  }
}));

const mockTemplateService = templateService as any;

describe('templateUtils', () => {
  const mockDefaultTemplate: ReviewTemplate = {
    name: 'default',
    description: 'Default template',
    content: 'Default content',
    prompts: {
      codeQuality: 'Default quality prompt',
      security: 'Default security prompt',
      performance: 'Default performance prompt',
      maintainability: 'Default maintainability prompt',
      testing: 'Default testing prompt'
    },
    rules: {
      maxComplexity: 10,
      requireTests: true,
      securityChecks: ['default_check']
    },
    criteria: ['Default criteria']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTemplateService.getDefaultTemplate.mockReturnValue(mockDefaultTemplate);
  });

  describe('createCustomTemplate', () => {
    it('should create custom template with default values', async () => {
      await createCustomTemplate('custom', 'Custom template');

      expect(mockTemplateService.saveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'custom',
          description: 'Custom template',
          prompts: mockDefaultTemplate.prompts,
          rules: mockDefaultTemplate.rules,
          criteria: mockDefaultTemplate.criteria
        })
      );
    });

    it('should create custom template with custom prompts', async () => {
      const customPrompts = {
        codeQuality: 'Custom quality prompt',
        security: 'Custom security prompt'
      };

      await createCustomTemplate('custom', 'Custom template', customPrompts);

      expect(mockTemplateService.saveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'custom',
          description: 'Custom template',
          prompts: {
            ...mockDefaultTemplate.prompts,
            ...customPrompts
          }
        })
      );
    });
  });

  describe('getTemplateList', () => {
    it('should return list of templates with descriptions', async () => {
      const mockTemplates = ['default', 'custom1', 'custom2'];
      mockTemplateService.listTemplates.mockResolvedValue(mockTemplates);
      
      mockTemplateService.loadTemplate
        .mockResolvedValueOnce({ name: 'default', description: 'Default template' })
        .mockResolvedValueOnce({ name: 'custom1', description: 'Custom template 1' })
        .mockResolvedValueOnce({ name: 'custom2', description: 'Custom template 2' });

      const result = await getTemplateList();

      expect(result).toEqual([
        { name: 'default', description: 'Default template' },
        { name: 'custom1', description: 'Custom template 1' },
        { name: 'custom2', description: 'Custom template 2' }
      ]);
    });

    it('should handle template loading errors gracefully', async () => {
      const mockTemplates = ['default', 'broken'];
      mockTemplateService.listTemplates.mockResolvedValue(mockTemplates);
      
      mockTemplateService.loadTemplate
        .mockResolvedValueOnce({ name: 'default', description: 'Default template' })
        .mockRejectedValueOnce(new Error('Template not found'));

      const result = await getTemplateList();

      expect(result).toEqual([
        { name: 'default', description: 'Default template' },
        { name: 'broken', description: 'Failed to load template' }
      ]);
    });
  });

  describe('validateTemplateContent', () => {
    it('should return no errors for valid template', () => {
      const validTemplate = {
        name: 'test',
        description: 'Test template',
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
          securityChecks: []
        }
      };

      const errors = validateTemplateContent(validTemplate);
      expect(errors).toEqual([]);
    });

    it('should return errors for missing required fields', () => {
      const invalidTemplate = {
        name: '',
        description: '',
        prompts: {
          codeQuality: '',
          security: 'Security prompt',
          performance: 'Performance prompt',
          maintainability: 'Maintainability prompt',
          testing: 'Testing prompt'
        },
        rules: {
          maxComplexity: -1,
          requireTests: true,
          securityChecks: []
        }
      };

      const errors = validateTemplateContent(invalidTemplate);
      expect(errors).toContain('Template name is required');
      expect(errors).toContain('Template description is required');
      expect(errors).toContain('codeQuality prompt is required');
      expect(errors).toContain('maxComplexity must be a positive number');
    });
  });

  describe('createTemplateFromMarkdown', () => {
    it('should create template from markdown content', async () => {
      const markdownContent = '# Test Template\n\nTest content';
      const parsedTemplate = {
        prompts: {
          codeQuality: 'Parsed quality',
          security: 'Parsed security',
          performance: 'Parsed performance',
          maintainability: 'Parsed maintainability',
          testing: 'Parsed testing'
        },
        rules: {
          maxComplexity: 15,
          requireTests: false,
          securityChecks: ['parsed_check']
        },
        criteria: ['Parsed criteria']
      };

      mockTemplateService.parseMarkdownTemplate.mockReturnValue(parsedTemplate);

      await createTemplateFromMarkdown('test', 'Test template', markdownContent);

      expect(mockTemplateService.parseMarkdownTemplate).toHaveBeenCalledWith(markdownContent);
      expect(mockTemplateService.saveTemplate).toHaveBeenCalledWith({
        name: 'test',
        description: 'Test template',
        content: markdownContent,
        prompts: parsedTemplate.prompts,
        rules: parsedTemplate.rules,
        criteria: parsedTemplate.criteria
      });
    });
  });

  describe('exportTemplateToMarkdown', () => {
    it('should export template content as markdown', async () => {
      const mockTemplate = {
        ...mockDefaultTemplate,
        content: '# Exported Template\n\nExported content'
      };

      mockTemplateService.loadTemplate.mockResolvedValue(mockTemplate);

      const result = await exportTemplateToMarkdown('test');

      expect(result).toBe('# Exported Template\n\nExported content');
      expect(mockTemplateService.loadTemplate).toHaveBeenCalledWith('test');
    });
  });

  describe('duplicateTemplate', () => {
    it('should duplicate template with new name', async () => {
      mockTemplateService.loadTemplate.mockResolvedValue(mockDefaultTemplate);

      await duplicateTemplate('default', 'duplicated');

      expect(mockTemplateService.loadTemplate).toHaveBeenCalledWith('default');
      expect(mockTemplateService.saveTemplate).toHaveBeenCalledWith({
        ...mockDefaultTemplate,
        name: 'duplicated',
        description: 'Copy of Default template'
      });
    });

    it('should duplicate template with custom description', async () => {
      mockTemplateService.loadTemplate.mockResolvedValue(mockDefaultTemplate);

      await duplicateTemplate('default', 'duplicated', 'Custom description');

      expect(mockTemplateService.saveTemplate).toHaveBeenCalledWith({
        ...mockDefaultTemplate,
        name: 'duplicated',
        description: 'Custom description'
      });
    });
  });
});