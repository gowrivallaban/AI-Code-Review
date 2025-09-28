import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import type { ReviewTemplate, TemplateError } from '../types';
import { templateService } from '../services';
import { HelpIcon } from './Tooltip';

interface TemplateEditorProps {
  template?: ReviewTemplate;
  onSave: (template: ReviewTemplate) => void;
  onCancel: () => void;
  onDelete?: (templateName: string) => void;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  content?: string;
  general?: string;
}

export function TemplateEditor({ 
  template, 
  onSave, 
  onCancel, 
  onDelete 
}: TemplateEditorProps) {
  const [editingTemplate, setEditingTemplate] = useState<ReviewTemplate>(() => 
    template || {
      name: '',
      description: '',
      content: '',
      prompts: {
        codeQuality: '',
        security: '',
        performance: '',
        maintainability: '',
        testing: ''
      },
      rules: {
        maxComplexity: 10,
        requireTests: true,
        securityChecks: []
      },
      criteria: []
    }
  );

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset form when template prop changes
  useEffect(() => {
    if (template) {
      setEditingTemplate(template);
      setValidationErrors({});
    }
  }, [template]);

  // Parse markdown content to update template structure
  const parseMarkdownContent = useCallback((content: string) => {
    try {
      const parsed = templateService.parseMarkdownTemplate(content);
      setEditingTemplate(prev => ({
        ...prev,
        content,
        prompts: parsed.prompts || prev.prompts,
        rules: parsed.rules || prev.rules,
        criteria: parsed.criteria || prev.criteria
      }));
    } catch {
      // Don't update structure if parsing fails, just update content
      setEditingTemplate(prev => ({ ...prev, content }));
    }
  }, []);

  // Validate template fields
  const validateTemplate = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!editingTemplate.name.trim()) {
      errors.name = 'Template name is required';
    } else if (editingTemplate.name.length < 3) {
      errors.name = 'Template name must be at least 3 characters';
    }

    if (!editingTemplate.description.trim()) {
      errors.description = 'Template description is required';
    } else if (editingTemplate.description.length < 10) {
      errors.description = 'Template description must be at least 10 characters';
    }

    if (!editingTemplate.content.trim()) {
      errors.content = 'Template content is required';
    } else if (editingTemplate.content.length < 50) {
      errors.content = 'Template content must be at least 50 characters';
    }

    return errors;
  }, [editingTemplate]);

  // Handle form field changes
  const handleFieldChange = (field: keyof ReviewTemplate, value: string) => {
    setEditingTemplate(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle content change with markdown parsing
  const handleContentChange = (content: string) => {
    parseMarkdownContent(content);
    
    // Clear content validation error
    if (validationErrors.content) {
      setValidationErrors(prev => ({ ...prev, content: undefined }));
    }
  };

  // Handle save action
  const handleSave = async () => {
    const errors = validateTemplate();
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    setValidationErrors({});

    try {
      await templateService.saveTemplate(editingTemplate);
      onSave(editingTemplate);
    } catch (error) {
      const templateError = error as TemplateError;
      setValidationErrors({
        general: templateError.message || 'Failed to save template'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!template || !onDelete) return;

    try {
      await templateService.deleteTemplate(template.name);
      onDelete(template.name);
      setShowDeleteConfirm(false);
    } catch (error) {
      const templateError = error as TemplateError;
      setValidationErrors({
        general: templateError.message || 'Failed to delete template'
      });
    }
  };

  // Generate markdown content from template structure
  const generateMarkdownFromTemplate = () => {
    const { name, description, criteria, prompts, rules } = editingTemplate;
    
    let markdown = `# ${name}\n\n`;
    markdown += `## Description\n${description}\n\n`;
    
    if (criteria.length > 0) {
      markdown += `## Criteria\n`;
      criteria.forEach(criterion => {
        markdown += `- ${criterion}\n`;
      });
      markdown += '\n';
    }
    
    markdown += `## Prompts\n\n`;
    Object.entries(prompts).forEach(([key, value]) => {
      const title = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      markdown += `### ${title}\n${value}\n\n`;
    });
    
    markdown += `## Rules\n`;
    markdown += `- maxComplexity: ${rules.maxComplexity}\n`;
    markdown += `- requireTests: ${rules.requireTests}\n`;
    
    if (rules.securityChecks.length > 0) {
      markdown += `- Security Checks:\n`;
      rules.securityChecks.forEach(check => {
        markdown += `  - ${check}\n`;
      });
    }
    
    return markdown;
  };

  const isNewTemplate = !template;
  const canDelete = template && template.name !== 'default' && onDelete;

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNewTemplate ? 'Create New Template' : `Edit Template: ${template.name}`}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-1 text-sm rounded-md ${
                isPreviewMode
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isPreviewMode ? 'Edit' : 'Preview'}
            </button>
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {validationErrors.general && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {validationErrors.general}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center mb-2">
              <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">
                Template Name *
              </label>
              <HelpIcon 
                content="A unique identifier for your template. Use descriptive names like 'security-focused' or 'frontend-react'."
                className="ml-2"
              />
            </div>
            <input
              id="template-name"
              type="text"
              value={editingTemplate.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter template name"
              disabled={!isNewTemplate} // Don't allow editing name of existing templates
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label htmlFor="template-description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <HelpIcon 
                content="A brief explanation of what this template is designed for and when to use it."
                className="ml-2"
              />
            </div>
            <input
              id="template-description"
              type="text"
              value={editingTemplate.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Brief description of the template"
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
          </div>
        </div>

        {/* Content Editor/Preview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <label htmlFor="template-content" className="block text-sm font-medium text-gray-700">
                Template Content *
              </label>
              <HelpIcon 
                content={
                  <div className="text-left">
                    <p className="mb-2">Write your template in markdown format. Include:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>## Criteria - List of review areas</li>
                      <li>## Prompts - Detailed instructions for each area</li>
                      <li>## Rules - Configuration settings</li>
                    </ul>
                    <p className="mt-2 text-xs">Use the Preview mode to see how it will look.</p>
                  </div>
                }
                className="ml-2"
                position="bottom"
              />
            </div>
            <button
              onClick={() => handleContentChange(generateMarkdownFromTemplate())}
              className="text-sm text-blue-600 hover:text-blue-800"
              title="Generate markdown content from the current template structure"
            >
              Generate from fields
            </button>
          </div>

          {isPreviewMode ? (
            <div className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-96 max-h-96 overflow-y-auto">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <SyntaxHighlighter
                        language={match[1]}
                        PreTag="div"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {editingTemplate.content || '*No content to preview*'}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              id="template-content"
              value={editingTemplate.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm min-h-96 max-h-96 resize-none ${
                validationErrors.content ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter template content in markdown format..."
            />
          )}
          
          {validationErrors.content && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.content}</p>
          )}
          
          <p className="mt-1 text-sm text-gray-500">
            Use markdown format. The content will be parsed to extract prompts, rules, and criteria.
          </p>
        </div>

        {/* Parsed Template Information */}
        {editingTemplate.content && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Criteria ({editingTemplate.criteria.length})</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {editingTemplate.criteria.slice(0, 3).map((criterion, index) => (
                  <li key={index} className="truncate">• {criterion}</li>
                ))}
                {editingTemplate.criteria.length > 3 && (
                  <li className="text-gray-500">... and {editingTemplate.criteria.length - 3} more</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Prompts</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(editingTemplate.prompts).map(([key, value]) => (
                  <li key={key} className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    {key}: {value ? '✓' : '✗'}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rules</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Max Complexity: {editingTemplate.rules.maxComplexity}</li>
                <li>Require Tests: {editingTemplate.rules.requireTests ? 'Yes' : 'No'}</li>
                <li>Security Checks: {editingTemplate.rules.securityChecks.length}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Template
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete the template "{template?.name}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}