import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateEditor } from '../TemplateEditor';
import { templateService } from '../../services';
import type { ReviewTemplate } from '../../types';

// Mock the template service
vi.mock('../../services', () => ({
  templateService: {
    parseMarkdownTemplate: vi.fn(),
    saveTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  }
}));

const mockTemplateService = templateService as any;

const mockTemplate: ReviewTemplate = {
  name: 'test-template',
  description: 'Test template description',
  content: '# Test Template\n\n## Description\nTest description\n\n## Criteria\n- Code Quality\n- Security',
  prompts: {
    codeQuality: 'Review code quality',
    security: 'Check for security issues',
    performance: 'Analyze performance',
    maintainability: 'Evaluate maintainability',
    testing: 'Assess test coverage'
  },
  rules: {
    maxComplexity: 10,
    requireTests: true,
    securityChecks: ['input_validation', 'sql_injection']
  },
  criteria: ['Code Quality', 'Security', 'Performance']
};

describe('TemplateEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTemplateService.parseMarkdownTemplate.mockReturnValue({
      prompts: mockTemplate.prompts,
      rules: mockTemplate.rules,
      criteria: mockTemplate.criteria
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('New Template Creation', () => {
    it('renders create new template form', () => {
      render(
        <TemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Create New Template')).toBeInTheDocument();
      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/template content/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save template/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('allows entering template information', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/template name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const contentTextarea = screen.getByLabelText(/template content/i);

      await user.type(nameInput, 'new-template');
      await user.type(descriptionInput, 'New template description');
      await user.type(contentTextarea, '# New Template\n\nContent here');

      expect(nameInput).toHaveValue('new-template');
      expect(descriptionInput).toHaveValue('New template description');
      expect(contentTextarea).toHaveValue('# New Template\n\nContent here');
    });

    it('validates required fields on save', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      expect(screen.getByText('Template name is required')).toBeInTheDocument();
      expect(screen.getByText('Template description is required')).toBeInTheDocument();
      expect(screen.getByText('Template content is required')).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('validates minimum field lengths', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/template name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const contentTextarea = screen.getByLabelText(/template content/i);

      await user.type(nameInput, 'ab'); // Too short
      await user.type(descriptionInput, 'short'); // Too short
      await user.type(contentTextarea, 'short content'); // Too short

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      expect(screen.getByText('Template name must be at least 3 characters')).toBeInTheDocument();
      expect(screen.getByText('Template description must be at least 10 characters')).toBeInTheDocument();
      expect(screen.getByText('Template content must be at least 50 characters')).toBeInTheDocument();
    });

    it('saves valid template', async () => {
      const user = userEvent.setup();
      mockTemplateService.saveTemplate.mockResolvedValue(undefined);
      
      render(
        <TemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/template name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const contentTextarea = screen.getByLabelText(/template content/i);

      await user.type(nameInput, 'valid-template');
      await user.type(descriptionInput, 'Valid template description that is long enough');
      await user.type(contentTextarea, 'This is a valid template content that is definitely long enough to pass validation');

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockTemplateService.saveTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'valid-template',
            description: 'Valid template description that is long enough',
            content: 'This is a valid template content that is definitely long enough to pass validation'
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Existing Template Editing', () => {
    it('renders edit template form with existing data', () => {
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(`Edit Template: ${mockTemplate.name}`)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockTemplate.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockTemplate.description)).toBeInTheDocument();
      expect(screen.getByLabelText(/template content/i)).toHaveValue(mockTemplate.content);
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('disables name editing for existing templates', () => {
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue(mockTemplate.name);
      expect(nameInput).toBeDisabled();
    });

    it('updates template on save', async () => {
      const user = userEvent.setup();
      mockTemplateService.saveTemplate.mockResolvedValue(undefined);
      
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const descriptionInput = screen.getByDisplayValue(mockTemplate.description);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockTemplateService.saveTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Updated description'
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Preview Mode', () => {
    it('toggles between edit and preview modes', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/template content/i)).not.toBeInTheDocument();

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/template content/i)).toBeInTheDocument();
    });
  });

  describe('Markdown Parsing', () => {
    it('parses markdown content when content changes', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const contentTextarea = screen.getByLabelText(/template content/i);
      await user.type(contentTextarea, '# Test\n\n## Criteria\n- Quality\n- Security');

      expect(mockTemplateService.parseMarkdownTemplate).toHaveBeenCalledWith('# Test\n\n## Criteria\n- Quality\n- Security');
    });

    it('generates markdown from template structure', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generate from fields/i });
      await user.click(generateButton);

      const contentTextarea = screen.getByLabelText(/template content/i);
      const textareaValue = (contentTextarea as HTMLTextAreaElement).value;
      expect(textareaValue).toContain('# test-template');
      expect(textareaValue).toContain('## Description');
      expect(textareaValue).toContain('Test template description');
    });
  });

  describe('Template Deletion', () => {
    it('shows delete confirmation dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText('Delete Template')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });

    it('cancels deletion', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      const modalCancelButton = cancelButtons.find(button => 
        button.closest('.fixed') !== null
      );
      await user.click(modalCancelButton!);

      expect(screen.queryByText('Delete Template')).not.toBeInTheDocument();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it('confirms deletion', async () => {
      const user = userEvent.setup();
      mockTemplateService.deleteTemplate.mockResolvedValue(undefined);
      
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getAllByRole('button', { name: /delete/i })[1]; // Second delete button in modal
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(mockTemplate.name);
        expect(mockOnDelete).toHaveBeenCalledWith(mockTemplate.name);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays save error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to save template';
      mockTemplateService.saveTemplate.mockRejectedValue(new Error(errorMessage));
      
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('displays delete error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to delete template';
      mockTemplateService.deleteTemplate.mockRejectedValue(new Error(errorMessage));
      
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getAllByRole('button', { name: /delete/i })[1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Template Information Display', () => {
    it('displays parsed template information', () => {
      render(
        <TemplateEditor
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(`Criteria (${mockTemplate.criteria.length})`)).toBeInTheDocument();
      expect(screen.getByText('Prompts')).toBeInTheDocument();
      expect(screen.getByText('Rules')).toBeInTheDocument();
      expect(screen.getByText(`Max Complexity: ${mockTemplate.rules.maxComplexity}`)).toBeInTheDocument();
      expect(screen.getByText(`Security Checks: ${mockTemplate.rules.securityChecks.length}`)).toBeInTheDocument();
    });
  });
});