import { ReviewTemplate, TemplateError, TemplateServiceInterface } from '../types';

/**
 * Service for managing code review templates
 * Handles loading, saving, validation, and parsing of review templates
 */
export class TemplateService implements TemplateServiceInterface {
  private readonly STORAGE_KEY = 'github-pr-review-templates';
  private readonly DEFAULT_TEMPLATE_NAME = 'default';

  /**
   * Get the default review template
   */
  getDefaultTemplate(): ReviewTemplate {
    return {
      name: this.DEFAULT_TEMPLATE_NAME,
      description: 'Comprehensive code review template covering quality, security, performance, and maintainability',
      content: this.getDefaultTemplateContent(),
      prompts: {
        codeQuality: 'Review the code for clarity, readability, and adherence to best practices. Look for code smells, proper naming conventions, and appropriate abstractions.',
        security: 'Identify potential security vulnerabilities including input validation, authentication issues, data exposure, and injection attacks.',
        performance: 'Analyze the code for performance bottlenecks, inefficient algorithms, memory leaks, and optimization opportunities.',
        maintainability: 'Evaluate code maintainability including modularity, documentation, error handling, and ease of future modifications.',
        testing: 'Assess test coverage, test quality, and identify areas that need additional testing or better test structure.'
      },
      rules: {
        maxComplexity: 10,
        requireTests: true,
        securityChecks: [
          'input_validation',
          'sql_injection',
          'xss_prevention',
          'authentication',
          'authorization',
          'data_exposure'
        ]
      },
      criteria: [
        'Code Quality and Best Practices',
        'Security Vulnerabilities',
        'Performance Optimization',
        'Maintainability and Documentation',
        'Test Coverage and Quality'
      ]
    };
  }

  /**
   * Load a template by name
   */
  async loadTemplate(name: string): Promise<ReviewTemplate> {
    try {
      if (name === this.DEFAULT_TEMPLATE_NAME) {
        return this.getDefaultTemplate();
      }

      const templates = await this.getStoredTemplates();
      const template = templates.find(t => t.name === name);
      
      if (!template) {
        throw this.createTemplateError(
          'missing_file',
          `Template '${name}' not found`,
          `No template with name '${name}' exists in storage`
        );
      }

      return this.validateTemplate(template);
    } catch (error) {
      // If it's already a TemplateError, re-throw it as-is
      if (error && typeof error === 'object' && 'type' in error && error.type === 'template') {
        throw error;
      }
      throw this.createTemplateError(
        'parsing_error',
        `Failed to load template '${name}'`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Save a template to storage
   */
  async saveTemplate(template: ReviewTemplate): Promise<void> {
    try {
      const validatedTemplate = this.validateTemplate(template);
      const templates = await this.getStoredTemplates();
      
      // Remove existing template with same name
      const filteredTemplates = templates.filter(t => t.name !== validatedTemplate.name);
      
      // Add the new/updated template
      filteredTemplates.push(validatedTemplate);
      
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTemplates));
    } catch (error) {
      if (error instanceof Error && error.message.includes('Template')) {
        throw error;
      }
      throw this.createTemplateError(
        'validation_error',
        `Failed to save template '${template.name}'`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * List all available template names
   */
  async listTemplates(): Promise<string[]> {
    try {
      const templates = await this.getStoredTemplates();
      const templateNames = templates.map(t => t.name);
      
      // Always include default template
      if (!templateNames.includes(this.DEFAULT_TEMPLATE_NAME)) {
        templateNames.unshift(this.DEFAULT_TEMPLATE_NAME);
      }
      
      return templateNames;
    } catch (error) {
      // If there's an error loading templates, at least return default
      return [this.DEFAULT_TEMPLATE_NAME];
    }
  }

  /**
   * Delete a template by name
   */
  async deleteTemplate(name: string): Promise<void> {
    if (name === this.DEFAULT_TEMPLATE_NAME) {
      throw this.createTemplateError(
        'validation_error',
        'Cannot delete default template',
        'The default template cannot be deleted'
      );
    }

    try {
      const templates = await this.getStoredTemplates();
      const filteredTemplates = templates.filter(t => t.name !== name);
      
      if (filteredTemplates.length === templates.length) {
        throw this.createTemplateError(
          'missing_file',
          `Template '${name}' not found`,
          `No template with name '${name}' exists to delete`
        );
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTemplates));
    } catch (error) {
      if (error instanceof Error && error.message.includes('Template')) {
        throw error;
      }
      throw this.createTemplateError(
        'parsing_error',
        `Failed to delete template '${name}'`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Parse markdown content to extract template structure
   */
  parseMarkdownTemplate(content: string): Partial<ReviewTemplate> {
    try {
      const lines = content.split('\n');
      const template: Partial<ReviewTemplate> = {
        content,
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
      };

      let currentSection = '';
      let currentPrompt = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Parse headers
        if (trimmedLine.startsWith('# ')) {
          currentSection = 'title';
        } else if (trimmedLine.startsWith('## ')) {
          currentSection = trimmedLine.substring(3).toLowerCase();
        } else if (trimmedLine.startsWith('### ')) {
          currentPrompt = trimmedLine.substring(4).toLowerCase();
        }
        
        // Parse content based on current section
        if (currentSection === 'criteria' && trimmedLine.startsWith('- ')) {
          template.criteria!.push(trimmedLine.substring(2));
        } else if (currentSection === 'prompts' && currentPrompt) {
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const promptKey = this.mapPromptKey(currentPrompt);
            if (promptKey && template.prompts) {
              template.prompts[promptKey] += (template.prompts[promptKey] ? ' ' : '') + trimmedLine;
            }
          }
        } else if (currentSection === 'rules') {
          if (trimmedLine.includes('maxComplexity:')) {
            const match = trimmedLine.match(/maxComplexity:\s*(\d+)/);
            if (match && template.rules) {
              template.rules.maxComplexity = parseInt(match[1], 10);
            }
          } else if (trimmedLine.includes('requireTests:')) {
            const match = trimmedLine.match(/requireTests:\s*(true|false)/);
            if (match && template.rules) {
              template.rules.requireTests = match[1] === 'true';
            }
          } else if (trimmedLine.startsWith('- ') && currentSection === 'rules') {
            template.rules!.securityChecks.push(trimmedLine.substring(2));
          }
        }
      }
      
      return template;
    } catch (error) {
      throw this.createTemplateError(
        'parsing_error',
        'Failed to parse markdown template',
        error instanceof Error ? error.message : 'Unknown parsing error'
      );
    }
  }

  /**
   * Validate template structure and content
   */
  private validateTemplate(template: ReviewTemplate): ReviewTemplate {
    const errors: string[] = [];

    // Validate required fields
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.description || template.description.trim().length === 0) {
      errors.push('Template description is required');
    }

    if (!template.content || template.content.trim().length === 0) {
      errors.push('Template content is required');
    }

    // Validate prompts
    if (!template.prompts) {
      errors.push('Template prompts are required');
    } else {
      const requiredPrompts = ['codeQuality', 'security', 'performance', 'maintainability', 'testing'];
      for (const prompt of requiredPrompts) {
        if (!template.prompts[prompt as keyof typeof template.prompts] || 
            template.prompts[prompt as keyof typeof template.prompts].trim().length === 0) {
          errors.push(`Prompt '${prompt}' is required`);
        }
      }
    }

    // Validate rules
    if (!template.rules) {
      errors.push('Template rules are required');
    } else {
      if (typeof template.rules.maxComplexity !== 'number' || template.rules.maxComplexity < 1) {
        errors.push('maxComplexity must be a positive number');
      }
      
      if (typeof template.rules.requireTests !== 'boolean') {
        errors.push('requireTests must be a boolean');
      }
      
      if (!Array.isArray(template.rules.securityChecks)) {
        errors.push('securityChecks must be an array');
      }
    }

    // Validate criteria
    if (!Array.isArray(template.criteria) || template.criteria.length === 0) {
      errors.push('Template criteria must be a non-empty array');
    }

    if (errors.length > 0) {
      throw this.createTemplateError(
        'validation_error',
        'Template validation failed',
        errors.join('; ')
      );
    }

    return template;
  }

  /**
   * Get templates from localStorage
   */
  private async getStoredTemplates(): Promise<ReviewTemplate[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }
      
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }
      
      return parsed;
    } catch (error) {
      throw this.createTemplateError(
        'parsing_error',
        'Failed to load stored templates',
        error instanceof Error ? error.message : 'Invalid JSON in storage'
      );
    }
  }

  /**
   * Map prompt section names to prompt keys
   */
  private mapPromptKey(sectionName: string): keyof ReviewTemplate['prompts'] | null {
    const mapping: Record<string, keyof ReviewTemplate['prompts']> = {
      'code quality': 'codeQuality',
      'quality': 'codeQuality',
      'security': 'security',
      'performance': 'performance',
      'maintainability': 'maintainability',
      'testing': 'testing',
      'tests': 'testing'
    };
    
    return mapping[sectionName.toLowerCase()] || null;
  }

  /**
   * Create a standardized template error
   */
  private createTemplateError(
    reason: TemplateError['reason'],
    message: string,
    details?: string
  ): TemplateError {
    return {
      type: 'template',
      message,
      code: `TEMPLATE_${reason.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      reason,
      details
    };
  }

  /**
   * Get the default template content in markdown format
   */
  private getDefaultTemplateContent(): string {
    return `# Comprehensive Code Review Template

## Description
A thorough code review template designed to catch common issues and ensure high-quality, secure, and maintainable code. This template covers code quality, security vulnerabilities, performance optimization, maintainability concerns, and testing practices.

## Review Criteria
- **Code Quality & Best Practices**: Clean, readable, and well-structured code
- **Security Vulnerabilities**: Protection against common security threats
- **Performance Optimization**: Efficient algorithms and resource usage
- **Maintainability & Documentation**: Easy to understand and modify
- **Test Coverage & Quality**: Comprehensive and meaningful tests
- **Error Handling**: Robust error management and edge case handling
- **API Design**: Well-designed interfaces and contracts
- **Code Organization**: Proper separation of concerns and modularity

## Review Prompts

### Code Quality
Analyze the code for:
- **Readability**: Clear variable names, consistent formatting, logical structure
- **Best Practices**: Following language-specific conventions and patterns
- **Code Smells**: Duplicated code, long methods, complex conditionals
- **SOLID Principles**: Single responsibility, open/closed, dependency inversion
- **Design Patterns**: Appropriate use of established patterns
- **Comments**: Meaningful documentation where necessary, avoiding obvious comments

Focus on: naming conventions, method length, class responsibilities, abstraction levels, and overall code organization.

### Security
Examine the code for potential security vulnerabilities:
- **Input Validation**: Proper sanitization and validation of user inputs
- **Authentication & Authorization**: Secure user verification and access control
- **Data Protection**: Encryption of sensitive data, secure storage practices
- **Injection Attacks**: SQL injection, XSS, command injection prevention
- **Error Information**: Avoiding information disclosure in error messages
- **Dependencies**: Known vulnerabilities in third-party libraries
- **Configuration**: Secure default settings, proper secret management

Pay special attention to: user input handling, database queries, API endpoints, file operations, and external service integrations.

### Performance
Evaluate the code for performance implications:
- **Algorithm Efficiency**: Time and space complexity analysis
- **Database Operations**: Query optimization, N+1 problems, indexing
- **Memory Management**: Memory leaks, unnecessary object creation
- **Caching Strategies**: Appropriate use of caching mechanisms
- **Async Operations**: Proper handling of asynchronous code
- **Resource Usage**: File handles, network connections, CPU usage
- **Scalability**: Code that performs well under load

Consider: loop efficiency, data structure choices, lazy loading, batch operations, and resource cleanup.

### Maintainability
Assess how easy the code is to maintain and extend:
- **Modularity**: Well-defined modules with clear boundaries
- **Coupling & Cohesion**: Loose coupling between components, high cohesion within
- **Documentation**: Clear README, API docs, inline comments where needed
- **Error Handling**: Comprehensive error management and logging
- **Configuration**: Externalized configuration, environment-specific settings
- **Refactoring Safety**: Code structure that supports safe modifications
- **Debugging Support**: Adequate logging and debugging capabilities

Look for: separation of concerns, dependency injection, configuration management, and code that tells a story.

### Testing
Review the testing approach and coverage:
- **Test Coverage**: Adequate coverage of critical paths and edge cases
- **Test Quality**: Meaningful tests that verify behavior, not implementation
- **Test Organization**: Clear test structure, good naming, proper setup/teardown
- **Unit Tests**: Isolated testing of individual components
- **Integration Tests**: Testing of component interactions
- **Edge Cases**: Handling of boundary conditions and error scenarios
- **Test Maintainability**: Tests that are easy to understand and modify

Ensure: tests are readable, fast, reliable, and provide good feedback when they fail.

## Review Rules & Guidelines

### Complexity Thresholds
- **Maximum Cyclomatic Complexity**: 10 per method/function
- **Maximum Method Length**: 50 lines (excluding comments)
- **Maximum Class Size**: 500 lines
- **Maximum Parameter Count**: 5 parameters per method

### Security Requirements
- **Input Validation**: All user inputs must be validated and sanitized
- **Authentication**: Secure authentication mechanisms required for protected resources
- **Authorization**: Proper access control checks before sensitive operations
- **Data Encryption**: Sensitive data must be encrypted at rest and in transit
- **Error Handling**: No sensitive information in error messages
- **Dependency Scanning**: Regular security audits of third-party dependencies

### Testing Requirements
- **Minimum Test Coverage**: 80% line coverage for new code
- **Critical Path Coverage**: 100% coverage for security-critical and business-critical paths
- **Test Types Required**: Unit tests for all public methods, integration tests for workflows
- **Test Documentation**: Clear test names that describe the scenario being tested

### Performance Standards
- **Response Time**: API endpoints should respond within 200ms for 95% of requests
- **Memory Usage**: No memory leaks, proper resource cleanup
- **Database Queries**: Avoid N+1 queries, use appropriate indexing
- **Caching**: Implement caching for expensive operations where appropriate

### Documentation Standards
- **Public APIs**: All public methods and classes must have documentation
- **Complex Logic**: Non-obvious code should include explanatory comments
- **Setup Instructions**: Clear instructions for local development setup
- **Architecture Decisions**: Document significant architectural choices and trade-offs

## Security Checklist
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] Cross-site scripting (XSS) prevention
- [ ] Cross-site request forgery (CSRF) protection
- [ ] Authentication and session management
- [ ] Authorization and access control
- [ ] Data encryption and protection
- [ ] Secure error handling
- [ ] Dependency vulnerability scanning
- [ ] Secure configuration management

## Review Focus Areas by File Type

### Frontend Code (React/TypeScript)
- Component reusability and composition
- State management patterns
- Performance optimizations (memoization, lazy loading)
- Accessibility compliance
- Error boundaries and error handling
- Type safety and TypeScript best practices

### Backend Code (APIs/Services)
- RESTful API design principles
- Input validation and sanitization
- Database query optimization
- Authentication and authorization
- Rate limiting and security headers
- Proper HTTP status codes and error responses

### Database Code
- Query performance and indexing
- Data integrity constraints
- Migration safety and rollback procedures
- Proper use of transactions
- Security considerations (SQL injection prevention)

### Configuration Files
- Security of configuration values
- Environment-specific settings
- Secret management
- Proper use of environment variables
- Documentation of configuration options

## Common Issues to Watch For

### Code Quality Issues
- Magic numbers and strings without constants
- Deeply nested conditional statements
- Large methods that do too many things
- Inconsistent naming conventions
- Missing error handling
- Unused imports or variables

### Security Issues
- Hardcoded secrets or credentials
- Unvalidated user input
- Insecure direct object references
- Missing authentication checks
- Verbose error messages revealing system information
- Outdated dependencies with known vulnerabilities

### Performance Issues
- Inefficient database queries
- Unnecessary API calls in loops
- Large objects being passed by value
- Missing pagination for large datasets
- Synchronous operations that could be asynchronous
- Memory leaks from unclosed resources

### Maintainability Issues
- Tight coupling between components
- Missing or outdated documentation
- Inconsistent code style
- Complex conditional logic without comments
- Hardcoded values that should be configurable
- Missing logging for debugging purposes
`;
  }
}

// Create and export a singleton instance
export const templateService = new TemplateService();