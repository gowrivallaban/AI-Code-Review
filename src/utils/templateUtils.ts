import { templateService } from '../services';
import { ReviewTemplate } from '../types';

/**
 * Utility functions for working with review templates
 */

/**
 * Create a custom template with basic validation
 */
export async function createCustomTemplate(
  name: string,
  description: string,
  customPrompts?: Partial<ReviewTemplate['prompts']>
): Promise<void> {
  const defaultTemplate = templateService.getDefaultTemplate();
  
  const customTemplate: ReviewTemplate = {
    name,
    description,
    content: `# ${name}\n\n## Description\n${description}\n\n${defaultTemplate.content}`,
    prompts: {
      ...defaultTemplate.prompts,
      ...customPrompts
    },
    rules: defaultTemplate.rules,
    criteria: defaultTemplate.criteria
  };

  await templateService.saveTemplate(customTemplate);
}

/**
 * Get all available templates with their basic info
 */
export async function getTemplateList(): Promise<Array<{ name: string; description: string }>> {
  const templateNames = await templateService.listTemplates();
  const templates = await Promise.all(
    templateNames.map(async (name) => {
      try {
        const template = await templateService.loadTemplate(name);
        return { name: template.name, description: template.description };
      } catch (error) {
        return { name, description: 'Failed to load template' };
      }
    })
  );
  
  return templates;
}

/**
 * Validate template content before saving
 */
export function validateTemplateContent(template: Partial<ReviewTemplate>): string[] {
  const errors: string[] = [];

  if (!template.name?.trim()) {
    errors.push('Template name is required');
  }

  if (!template.description?.trim()) {
    errors.push('Template description is required');
  }

  if (template.prompts) {
    const requiredPrompts = ['codeQuality', 'security', 'performance', 'maintainability', 'testing'];
    for (const prompt of requiredPrompts) {
      if (!template.prompts[prompt as keyof typeof template.prompts]?.trim()) {
        errors.push(`${prompt} prompt is required`);
      }
    }
  }

  if (template.rules) {
    if (typeof template.rules.maxComplexity !== 'number' || template.rules.maxComplexity < 1) {
      errors.push('maxComplexity must be a positive number');
    }
  }

  return errors;
}

/**
 * Create a template from markdown content
 */
export async function createTemplateFromMarkdown(
  name: string,
  description: string,
  markdownContent: string
): Promise<void> {
  const parsedTemplate = templateService.parseMarkdownTemplate(markdownContent);
  
  const template: ReviewTemplate = {
    name,
    description,
    content: markdownContent,
    prompts: parsedTemplate.prompts || {
      codeQuality: '',
      security: '',
      performance: '',
      maintainability: '',
      testing: ''
    },
    rules: parsedTemplate.rules || {
      maxComplexity: 10,
      requireTests: true,
      securityChecks: []
    },
    criteria: parsedTemplate.criteria || []
  };

  await templateService.saveTemplate(template);
}

/**
 * Export template to markdown format
 */
export async function exportTemplateToMarkdown(templateName: string): Promise<string> {
  const template = await templateService.loadTemplate(templateName);
  return template.content;
}

/**
 * Duplicate an existing template with a new name
 */
export async function duplicateTemplate(
  sourceTemplateName: string,
  newName: string,
  newDescription?: string
): Promise<void> {
  const sourceTemplate = await templateService.loadTemplate(sourceTemplateName);
  
  const duplicatedTemplate: ReviewTemplate = {
    ...sourceTemplate,
    name: newName,
    description: newDescription || `Copy of ${sourceTemplate.description}`
  };

  await templateService.saveTemplate(duplicatedTemplate);
}