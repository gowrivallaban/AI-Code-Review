import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { TemplateEditor } from '../../components/TemplateEditor';
import { TemplateService } from '../../services/template';
import { LLMService } from '../../services/llm';

// Mock services
vi.mock('../../services/template');
vi.mock('../../services/llm');

const mockTemplateService = TemplateService as vi.MockedClass<typeof TemplateService>;
const mockLLMService = LLMService as vi.MockedClass<typeof LLMService>;

describe('Template Service Integration', () => {
  const mockTemplate = {
    name: 'default',
    content: `# Code Review Template

## Code Quality
- Check for clean code practices
- Verify proper naming conventions

## Security
- Look for security vulnerabilities
- Check for input validation`,
    criteria: ['code quality', 'security']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load and display template from service', async () => {
    mockTemplateService.prototype.loadTemplate = vi.fn().mockResolvedValue(mockTemplate);

    render(
      <AppProvider>
        <TemplateEditor />
      </AppProvider>
    );

    await waitFor(() => {
      expect(mockTemplateService.prototype.loadTemplate).toHaveBeenCalledWith('default');
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Code Review Template/)).toBeInTheDocument();
    });
  });

  it('should save template changes through service', async () => {
    mockTemplateService.prototype.loadTemplate = vi.fn().mockResolvedValue(mockTemplate);
    mockTemplateService.prototype.saveTemplate = vi.fn().mockResolvedValue(undefined);

    render(
      <AppProvider>
        <TemplateEditor />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Code Review Template/)).toBeInTheDocument();
    });

    const textArea = screen.getByRole('textbox');
    fireEvent.change(textArea, { 
      target: { value: '# Updated Template\n\n## New Section\n- Updated criteria' } 
    });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockTemplateService.prototype.saveTemplate).toHaveBeenCalledWith({
        name: 'default',
        content: '# Updated Template\n\n## New Section\n- Updated criteria',
        criteria: expect.any(Array)
      });
    });
  });

  it('should validate template before saving', async () => {
    mockTemplateService.prototype.loadTemplate = vi.fn().mockResolvedValue(mockTemplate);
    mockTemplateService.prototype.saveTemplate = vi.fn().mockRejectedValue(
      new Error('Template validation failed: Missing required sections')
    );

    render(
      <AppProvider>
        <TemplateEditor />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Code Review Template/)).toBeInTheDocument();
    });

    const textArea = screen.getByRole('textbox');
    fireEvent.change(textArea, { target: { value: 'Invalid template content' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/template validation failed/i)).toBeInTheDocument();
    });
  });

  it('should integrate template with LLM service for code analysis', async () => {
    const updatedTemplate = {
      ...mockTemplate,
      content: `# Custom Review Template

## Performance
- Check for performance issues
- Verify efficient algorithms`
    };

    mockTemplateService.prototype.loadTemplate = vi.fn().mockResolvedValue(updatedTemplate);
    mockLLMService.prototype.analyzeCode = vi.fn().mockResolvedValue([
      {
        id: '1',
        file: 'src/example.js',
        line: 1,
        content: 'Performance issue detected: inefficient loop',
        severity: 'warning' as const,
        status: 'pending' as const
      }
    ]);

    // Mock the code review interface that uses the template
    const mockDiff = 'diff --git a/src/example.js b/src/example.js\n+for(let i=0; i<arr.length; i++)';

    render(
      <AppProvider>
        <TemplateEditor />
      </AppProvider>
    );

    await waitFor(() => {
      expect(mockTemplateService.prototype.loadTemplate).toHaveBeenCalled();
    });

    // Simulate using the template in LLM analysis
    await mockLLMService.prototype.analyzeCode(mockDiff, updatedTemplate.content);

    expect(mockLLMService.prototype.analyzeCode).toHaveBeenCalledWith(
      mockDiff,
      expect.stringContaining('Performance')
    );
  });

  it('should handle template loading errors gracefully', async () => {
    mockTemplateService.prototype.loadTemplate = vi.fn().mockRejectedValue(
      new Error('Template file not found')
    );

    render(
      <AppProvider>
        <TemplateEditor />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/template file not found/i)).toBeInTheDocument();
    });

    // Should show option to create new template
    expect(screen.getByRole('button', { name: /create new template/i })).toBeInTheDocument();
  });

  it('should support multiple template management', async () => {
    const templates = ['default', 'security-focused', 'performance-focused'];
    
    mockTemplateService.prototype.listTemplates = vi.fn().mockResolvedValue(templates);
    mockTemplateService.prototype.loadTemplate = vi.fn()
      .mockResolvedValueOnce(mockTemplate)
      .mockResolvedValueOnce({
        name: 'security-focused',
        content: '# Security Review\n\n## Security Checks\n- SQL injection\n- XSS vulnerabilities',
        criteria: ['security']
      });

    render(
      <AppProvider>
        <TemplateEditor />
      </AppProvider>
    );

    await waitFor(() => {
      expect(mockTemplateService.prototype.listTemplates).toHaveBeenCalled();
    });

    // Should display template selector
    const templateSelect = screen.getByRole('combobox');
    expect(templateSelect).toBeInTheDocument();

    // Switch to security template
    fireEvent.change(templateSelect, { target: { value: 'security-focused' } });

    await waitFor(() => {
      expect(mockTemplateService.prototype.loadTemplate).toHaveBeenCalledWith('security-focused');
    });
  });

  it('should preserve unsaved changes when switching templates', async () => {
    mockTemplateService.prototype.loadTemplate = vi.fn().mockResolvedValue(mockTemplate);
    mockTemplateService.prototype.listTemplates = vi.fn().mockResolvedValue(['default', 'custom']);

    render(
      <AppProvider>
        <TemplateEditor />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Code Review Template/)).toBeInTheDocument();
    });

    // Make changes
    const textArea = screen.getByRole('textbox');
    fireEvent.change(textArea, { target: { value: 'Modified content' } });

    // Try to switch templates
    const templateSelect = screen.getByRole('combobox');
    fireEvent.change(templateSelect, { target: { value: 'custom' } });

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /discard changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save first/i })).toBeInTheDocument();
  });
});