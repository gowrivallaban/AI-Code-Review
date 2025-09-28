import { useState, useEffect } from 'react';
import { TemplateEditor } from './TemplateEditor';
import { templateService } from '../services';
import type { ReviewTemplate, TemplateError } from '../types';

interface TemplateManagerProps {
  onClose?: () => void;
}

export function TemplateManager({ onClose }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ReviewTemplate[]>([]);
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReviewTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get list of template names
      const names = await templateService.listTemplates();
      setTemplateNames(names);
      
      // Load all templates
      const loadedTemplates: ReviewTemplate[] = [];
      for (const name of names) {
        try {
          const template = await templateService.loadTemplate(name);
          loadedTemplates.push(template);
        } catch (error) {
          console.warn(`Failed to load template ${name}:`, error);
        }
      }
      
      setTemplates(loadedTemplates);
    } catch (error) {
      const templateError = error as TemplateError;
      setError(templateError.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (templateName: string) => {
    try {
      setError(null);
      const template = await templateService.loadTemplate(templateName);
      setSelectedTemplate(template);
      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      const templateError = error as TemplateError;
      setError(templateError.message || `Failed to load template ${templateName}`);
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsEditing(true);
    setIsCreating(true);
  };

  const handleEdit = (template: ReviewTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSave = async (template: ReviewTemplate) => {
    try {
      setError(null);
      await templateService.saveTemplate(template);
      
      // Reload templates to reflect changes
      await loadTemplates();
      
      // Select the saved template
      setSelectedTemplate(template);
      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      // Error is handled by TemplateEditor component
      throw error;
    }
  };

  const handleDelete = async (templateName: string) => {
    try {
      setError(null);
      await templateService.deleteTemplate(templateName);
      
      // Reload templates
      await loadTemplates();
      
      // Clear selection if deleted template was selected
      if (selectedTemplate?.name === templateName) {
        setSelectedTemplate(null);
      }
      
      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      const templateError = error as TemplateError;
      setError(templateError.message || `Failed to delete template ${templateName}`);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    
    // If we were creating a new template, clear selection
    if (isCreating) {
      setSelectedTemplate(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">Loading templates...</span>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <TemplateEditor
          template={isCreating ? undefined : selectedTemplate || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={!isCreating ? handleDelete : undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Template Manager
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create New Template
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-sm bg-red-100 text-red-800 rounded-md px-2 py-1 hover:bg-red-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Templates ({templates.length})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {templates.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <p>No templates found</p>
                    <button
                      onClick={handleCreateNew}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Create your first template
                    </button>
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.name}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                        selectedTemplate?.name === template.name ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                      onClick={() => handleTemplateSelect(template.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {template.name}
                            {template.name === 'default' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Default
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {template.description}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-400">
                            <span>{template.criteria.length} criteria</span>
                            <span>{template.rules.securityChecks.length} security checks</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Template Details */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedTemplate.name}
                        {selectedTemplate.name === 'default' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Default
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedTemplate.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEdit(selectedTemplate)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Edit Template
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Template Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Criteria</h4>
                      <p className="text-2xl font-bold text-blue-600">{selectedTemplate.criteria.length}</p>
                      <p className="text-xs text-gray-500">Review criteria</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Security Checks</h4>
                      <p className="text-2xl font-bold text-green-600">{selectedTemplate.rules.securityChecks.length}</p>
                      <p className="text-xs text-gray-500">Security validations</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Max Complexity</h4>
                      <p className="text-2xl font-bold text-orange-600">{selectedTemplate.rules.maxComplexity}</p>
                      <p className="text-xs text-gray-500">Complexity threshold</p>
                    </div>
                  </div>

                  {/* Criteria List */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Review Criteria</h3>
                    <div className="space-y-2">
                      {selectedTemplate.criteria.map((criterion, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-sm text-gray-700">{criterion}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prompts */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Review Prompts</h3>
                    <div className="space-y-4">
                      {Object.entries(selectedTemplate.prompts).map(([key, value]) => {
                        const title = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                        return (
                          <div key={key} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">{title}</h4>
                            <p className="text-sm text-gray-600">{value || 'No prompt defined'}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rules */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Template Rules</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">General Rules</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>Maximum Complexity: {selectedTemplate.rules.maxComplexity}</li>
                            <li>Require Tests: {selectedTemplate.rules.requireTests ? 'Yes' : 'No'}</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Security Checks</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {selectedTemplate.rules.securityChecks.length > 0 ? (
                              selectedTemplate.rules.securityChecks.map((check, index) => (
                                <li key={index}>• {check.replace(/_/g, ' ')}</li>
                              ))
                            ) : (
                              <li className="text-gray-400">No security checks defined</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h3>
                <p className="text-gray-600 mb-4">
                  Select a template from the list to view its details, or create a new template.
                </p>
                <button
                  onClick={handleCreateNew}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Create New Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}