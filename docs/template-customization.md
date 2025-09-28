# Template Customization Guide

## Overview

The GitHub PR Review UI allows you to customize code review templates to match your team's specific needs and coding standards. Templates define the criteria, prompts, and rules that guide the AI-powered code review process.

## Template Structure

A review template consists of several key components:

### 1. Basic Information
- **Name**: Unique identifier for the template
- **Description**: Brief explanation of the template's purpose

### 2. Review Criteria
A list of areas the review will focus on, such as:
- Code Quality & Best Practices
- Security Vulnerabilities
- Performance Optimization
- Maintainability & Documentation
- Test Coverage & Quality

### 3. Review Prompts
Detailed instructions for each review area:
- **Code Quality**: Guidelines for readability, best practices, and code smells
- **Security**: Security vulnerability checks and secure coding practices
- **Performance**: Performance optimization and efficiency considerations
- **Maintainability**: Code organization, documentation, and error handling
- **Testing**: Test coverage, quality, and testing best practices

### 4. Review Rules
Configurable thresholds and requirements:
- **maxComplexity**: Maximum cyclomatic complexity allowed (default: 10)
- **requireTests**: Whether tests are required for new code (default: true)
- **securityChecks**: List of security checks to perform

## Creating Custom Templates

### Using the Template Editor

1. **Access the Template Editor**
   - Navigate to the Templates section in the application
   - Click "Create New Template" or "Edit" on an existing template

2. **Template Information**
   - Enter a unique name for your template
   - Provide a clear description of its purpose

3. **Define Review Criteria**
   - List the main areas your review will cover
   - Use bullet points for clarity
   - Focus on your team's priorities

4. **Write Review Prompts**
   - Provide detailed instructions for each review area
   - Be specific about what to look for
   - Include examples of good and bad practices
   - Tailor prompts to your technology stack

5. **Configure Rules**
   - Set appropriate complexity thresholds
   - Define testing requirements
   - Specify security checks relevant to your application

### Markdown Format

Templates are stored in markdown format. Here's the basic structure:

```markdown
# Template Name

## Description
Brief description of the template's purpose and scope.

## Review Criteria
- Criterion 1
- Criterion 2
- Criterion 3

## Review Prompts

### Code Quality
Detailed instructions for code quality review...

### Security
Security-specific review guidelines...

### Performance
Performance review instructions...

### Maintainability
Maintainability and documentation guidelines...

### Testing
Testing requirements and best practices...

## Review Rules
- maxComplexity: 10
- requireTests: true
- Security Checks:
  - input_validation
  - sql_injection
  - xss_prevention
```

## Template Examples

### Minimal Template
For small projects or quick reviews:

```markdown
# Quick Review Template

## Description
Lightweight template for rapid code reviews focusing on critical issues.

## Review Criteria
- Critical Bugs
- Security Issues
- Basic Code Quality

## Review Prompts

### Code Quality
Look for obvious bugs, code smells, and readability issues.

### Security
Check for common security vulnerabilities like SQL injection and XSS.

### Performance
Identify obvious performance bottlenecks.

## Review Rules
- maxComplexity: 15
- requireTests: false
```

### Comprehensive Enterprise Template
For large-scale applications with strict requirements:

```markdown
# Enterprise Security Template

## Description
Comprehensive template for enterprise applications with strict security and compliance requirements.

## Review Criteria
- Security Compliance
- Performance Standards
- Code Quality Standards
- Documentation Requirements
- Test Coverage
- Accessibility Compliance

## Review Prompts

### Security
Perform thorough security analysis including:
- OWASP Top 10 vulnerabilities
- Data protection compliance (GDPR, HIPAA)
- Authentication and authorization
- Input validation and sanitization
- Secure communication protocols

### Performance
Ensure code meets performance standards:
- Response times under 200ms
- Memory usage optimization
- Database query efficiency
- Caching strategies

## Review Rules
- maxComplexity: 8
- requireTests: true
- Security Checks:
  - input_validation
  - sql_injection
  - xss_prevention
  - csrf_protection
  - authentication
  - authorization
  - data_encryption
  - secure_headers
```

## Best Practices for Template Creation

### 1. Know Your Audience
- **Team Experience**: Adjust complexity based on team skill level
- **Project Type**: Different templates for different project types
- **Technology Stack**: Include stack-specific guidelines

### 2. Be Specific and Actionable
- Provide clear, actionable instructions
- Include examples of what to look for
- Avoid vague or subjective criteria

### 3. Balance Thoroughness with Practicality
- Don't make templates so comprehensive they become overwhelming
- Focus on the most important issues for your context
- Consider review time constraints

### 4. Regular Updates
- Update templates based on team feedback
- Incorporate lessons learned from past reviews
- Keep up with new security threats and best practices

### 5. Template Validation
- Test templates with sample code
- Get team feedback on template effectiveness
- Measure review quality improvements

## Technology-Specific Guidelines

### React/TypeScript Projects
```markdown
### Code Quality
- Use TypeScript strict mode
- Implement proper component composition
- Follow React hooks best practices
- Use proper state management patterns
- Implement error boundaries

### Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Avoid unnecessary re-renders
- Use lazy loading for routes and components
```

### Node.js/Express Projects
```markdown
### Security
- Validate all input parameters
- Use helmet.js for security headers
- Implement rate limiting
- Use HTTPS in production
- Sanitize database queries

### Performance
- Use connection pooling for databases
- Implement proper caching strategies
- Use compression middleware
- Monitor memory usage
```

### Python/Django Projects
```markdown
### Code Quality
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Implement proper exception handling
- Use Django's built-in security features

### Security
- Use Django's CSRF protection
- Implement proper user authentication
- Validate and sanitize all inputs
- Use Django's ORM to prevent SQL injection
```

## Managing Multiple Templates

### Template Organization
- Use descriptive names that indicate purpose
- Create templates for different project phases (development, pre-production, production)
- Maintain separate templates for different technology stacks

### Template Versioning
- Keep track of template changes
- Document why changes were made
- Consider maintaining multiple versions for different project requirements

### Team Collaboration
- Share templates across team members
- Get consensus on template changes
- Regular template review meetings

## Troubleshooting Common Issues

### Template Not Loading
- Check template syntax and formatting
- Ensure all required sections are present
- Verify template name is unique

### Poor Review Quality
- Review and refine prompts for clarity
- Adjust complexity thresholds
- Add more specific examples and guidelines

### Reviews Taking Too Long
- Simplify overly complex templates
- Focus on most critical issues
- Consider creating multiple focused templates instead of one comprehensive template

## Advanced Customization

### Custom Security Checks
You can define custom security checks in the template rules:

```markdown
## Review Rules
- maxComplexity: 10
- requireTests: true
- Security Checks:
  - custom_auth_check
  - api_rate_limiting
  - data_validation
  - secure_headers
  - dependency_scanning
```

### Integration with CI/CD
Templates can be integrated into your CI/CD pipeline:
- Export templates for use in automated reviews
- Set up quality gates based on template rules
- Generate reports based on template criteria

## Getting Help

If you need assistance with template customization:
1. Check the built-in help tooltips in the template editor
2. Review the default template for examples
3. Consult your team's coding standards documentation
4. Test templates with sample code before deploying

Remember: The best template is one that helps your team catch important issues while being practical to use in your development workflow.