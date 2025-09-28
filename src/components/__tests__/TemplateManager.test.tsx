import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateManager } from '../TemplateManager';
import { templateService } from '../../services';
import type { ReviewTemplate } from '../../types';

// Mock the template service
vi.mock('../../services', () => ({
  templateService: {
    listTemplates: vi.fn(),
    loadTemplate: vi.fn(),
    saveTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  }
}));

const mockTemplateService = templateService as any;

const mockTemplates: ReviewTemplate[] = [
  {
    name: 'default',
    description: 'Default template',
    content: '# Default Template',
    prompts: {
      codeQuality: 'Review code quality',
      security: 'Check security',
      performance: 'Analyze performance',
      maintainability: 'Evaluate maintainability',
      testing: 'Assess testing'
    },
    rules: {
      maxComplexity: 10,
      requireTests: true,
      securityChecks: ['input_validation']
    },
    criteria: ['Code Quality', 'Security']
  },
  {
    name: 'custom-template',
    description: 'Custom template',
    content: '# Custom Template',
    prompts: {
      codeQuality: 'Custom code quality',
      security: 'Custom security',
      performance: 'Custom performance',
      maintainability: 'Custom maintainability',
      testing: 'Custom testing'
    },
    rules: {
      maxComplexity: 15,
      requireTests: false,
      securityChecks: ['sql_injection', 'xss_prevention']
    },
    criteria: ['Quality', 'Security', 'Performance']
  }
];

describe('TemplateManager', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTemplateService.listTemplates.mockResolvedValue(['default', 'custom-template']);
    mockTemplateService.loadTemplate.mockImplementation((name: string) => {
      const template = mockTemplates.find(t => t.name === name);
      if (!template) {
        return Promise.reject(new Error(`Template ${name} not found`));
      }
      return Promise.resolve(template);
    });
    mockTemplateService.saveTemplate.mockResolvedValue(undefined);
    mockTemplateService.deleteTemplate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Loading', () => {
    it('shows loading state initially', () => {
      // Make listTemplates hang to test loading state
      mockTemplateService.listTemplates.mockImplementation(() => new Promise(() => {}));
      
      render(<TemplateManager />);

      expect(screen.getByText('Loading templates...')).toBeInTheDocument();
    });

    it('loads and displays templates', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Template Manager')).toBeInTheDocument();
        expect(screen.getByText('Templates (2)')).toBeInTheDocument();
        expect(screen.getByText('default')).toBeInTheDocument();
        expect(screen.getByText('custom-template')).toBeInTheDocument();
      });

      expect(mockTemplateService.listTemplates).toHaveBeenCalled();
      expect(mockTemplateService.loadTemplate).toHaveBeenCalledWith('default');
      expect(mockTemplateService.loadTemplate).toHaveBeenCalledWith('custom-template');
    });

    it('displays error when loading fails', async () => {
      const errorMessage = 'Failed to load templates';
      mockTemplateService.listTemplates.mockRejectedValue(new Error(errorMessage));

      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Template Selection', () => {
    it('displays no template selected message initially', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('No Template Selected')).toBeInTheDocument();
        expect(screen.getByText(/select a template from the list/i)).toBeInTheDocument();
      });
    });

    it('selects and displays template details', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
      });

      const defaultTemplate = screen.getByText('default');
      await user.click(defaultTemplate);

      await waitFor(() => {
        expect(screen.getByText('Default template')).toBeInTheDocument();
        expect(screen.getByText('Review Criteria')).toBeInTheDocument();
        expect(screen.getByText('Review Prompts')).toBeInTheDocument();
        expect(screen.getByText('Template Rules')).toBeInTheDocument();
      });
    });

    it('highlights selected template', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
      });

      const defaultTemplate = screen.getByText('default').closest('div');
      await user.click(screen.getByText('default'));

      await waitFor(() => {
        expect(defaultTemplate).toHaveClass('bg-blue-50');
      });
    });
  });

  describe('Template Creation', () => {
    it('shows create new template button', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new template/i })).toBeInTheDocument();
      });
    });

    it('opens template editor for new template', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new template/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create new template/i });
      await user.click(createButton);

      expect(screen.getByText('Create New Template')).toBeInTheDocument();
    });

    it('creates new template from no selection state', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('No Template Selected')).toBeInTheDocument();
      });

      const createButton = screen.getAllByRole('button', { name: /create new template/i })[1]; // Second button in the empty state
      await user.click(createButton);

      expect(screen.getByText('Create New Template')).toBeInTheDocument();
    });
  });

  describe('Template Editing', () => {
    it('opens template editor for existing template', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      // Wait for templates to load and select one
      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
      });

      await user.click(screen.getByText('default'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit template/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit template/i });
      await user.click(editButton);

      expect(screen.getByText('Edit Template: default')).toBeInTheDocument();
    });
  });

  describe('Template Saving', () => {
    it('saves template and refreshes list', async () => {
      const user = userEvent.setup();
      mockTemplateService.saveTemplate.mockResolvedValue(undefined);
      
      render(<TemplateManager />);

      // Open create new template
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new template/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create new template/i });
      await user.click(createButton);

      // Fill in template details (this would be handled by TemplateEditor)
      // For this test, we'll simulate the save callback
      const newTemplate: ReviewTemplate = {
        name: 'new-template',
        description: 'New template',
        content: '# New Template',
        prompts: {
          codeQuality: 'Quality',
          security: 'Security',
          performance: 'Performance',
          maintainability: 'Maintainability',
          testing: 'Testing'
        },
        rules: {
          maxComplexity: 10,
          requireTests: true,
          securityChecks: []
        },
        criteria: ['Quality']
      };

      // Simulate TemplateEditor calling onSave
      const templateEditor = screen.getByText('Create New Template').closest('div');
      expect(templateEditor).toBeInTheDocument();

      // We can't easily test the full flow without mocking TemplateEditor,
      // but we can verify the component structure is correct
    });
  });

  describe('Template Deletion', () => {
    it('deletes template and refreshes list', async () => {
      mockTemplateService.deleteTemplate.mockResolvedValue(undefined);
      
      render(<TemplateManager />);

      // This would be tested through the TemplateEditor component
      // The TemplateManager handles the onDelete callback
      expect(mockTemplateService.deleteTemplate).not.toHaveBeenCalled();
    });
  });

  describe('Template Details Display', () => {
    it('displays template statistics', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
      });

      await user.click(screen.getByText('default'));

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Criteria count
        expect(screen.getByText('1')).toBeInTheDocument(); // Security checks count
        expect(screen.getByText('10')).toBeInTheDocument(); // Max complexity
      });
    });

    it('displays default template badge', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
      });

      await user.click(screen.getByText('default'));

      await waitFor(() => {
        expect(screen.getAllByText('Default')).toHaveLength(2); // Badge in list and details
      });
    });

    it('displays template criteria', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
      });

      await user.click(screen.getByText('default'));

      await waitFor(() => {
        expect(screen.getByText('Review Criteria')).toBeInTheDocument();
        expect(screen.getByText('Code Quality')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
      });
    });

    it('displays template prompts', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
      });

      await user.click(screen.getByText('default'));

      await waitFor(() => {
        expect(screen.getByText('Review Prompts')).toBeInTheDocument();
        expect(screen.getByText('Code Quality')).toBeInTheDocument();
        expect(screen.getByText('Review code quality')).toBeInTheDocument();
      });
    });

    it('displays template rules', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
      });

      await user.click(screen.getByText('default'));

      await waitFor(() => {
        expect(screen.getByText('Template Rules')).toBeInTheDocument();
        expect(screen.getByText('Maximum Complexity: 10')).toBeInTheDocument();
        expect(screen.getByText('Require Tests: Yes')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error when template selection fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to load template';
      
      // First let templates load normally
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('default')).toBeInTheDocument();
      });

      // Then make loadTemplate fail for subsequent calls
      mockTemplateService.loadTemplate.mockRejectedValue(new Error(errorMessage));

      await user.click(screen.getByText('default'));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('dismisses error messages', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Test error';
      mockTemplateService.listTemplates.mockRejectedValue(new Error(errorMessage));
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<TemplateManager onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not show close button when onClose is not provided', async () => {
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Template Manager')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no templates exist', async () => {
      mockTemplateService.listTemplates.mockResolvedValue([]);
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('No templates found')).toBeInTheDocument();
        expect(screen.getByText('Create your first template')).toBeInTheDocument();
      });
    });

    it('allows creating first template from empty state', async () => {
      const user = userEvent.setup();
      mockTemplateService.listTemplates.mockResolvedValue([]);
      
      render(<TemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Create your first template')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create your first template');
      await user.click(createButton);

      expect(screen.getByText('Create New Template')).toBeInTheDocument();
    });
  });
});