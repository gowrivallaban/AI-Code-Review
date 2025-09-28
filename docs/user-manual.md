# User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Repository Selection](#repository-selection)
4. [Pull Request Management](#pull-request-management)
5. [Running Code Reviews](#running-code-reviews)
6. [Managing Review Comments](#managing-review-comments)
7. [Template Management](#template-management)
8. [Exporting and Submitting Reviews](#exporting-and-submitting-reviews)
9. [Troubleshooting](#troubleshooting)
10. [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### System Requirements

- **Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Internet Connection**: Required for GitHub API access
- **GitHub Account**: With access to repositories you want to review
- **Screen Resolution**: Minimum 1024x768 (responsive design supports mobile devices)

### First Launch

1. **Open the Application**
   - Navigate to the application URL in your web browser
   - The application will load and display the authentication screen

2. **Initial Setup**
   - You'll be prompted to connect to GitHub
   - Follow the authentication steps outlined below

## Authentication

### Creating a GitHub Personal Access Token

1. **Navigate to GitHub Settings**
   - Go to [GitHub.com](https://github.com) and sign in
   - Click your profile picture → Settings
   - Scroll down to "Developer settings" → "Personal access tokens" → "Tokens (classic)"

2. **Generate New Token**
   - Click "Generate new token (classic)"
   - Add a descriptive note (e.g., "PR Review UI")
   - Set expiration (90 days recommended for security)

3. **Select Scopes**
   - ✅ **repo** - Full control of private repositories (required)
   - ✅ **read:user** - Read user profile information (recommended)
   - ✅ **user:email** - Access user email addresses (optional)

4. **Generate and Copy Token**
   - Click "Generate token"
   - **Important**: Copy the token immediately - GitHub only shows it once
   - Store it securely (treat it like a password)

### Connecting to GitHub

1. **Enter Your Token**
   - Paste your Personal Access Token in the authentication form
   - The token should start with `ghp_`

2. **Authenticate**
   - Click "Connect to GitHub"
   - The application will verify your credentials
   - Upon success, you'll see your GitHub username displayed

3. **Authentication Status**
   - Green checkmark: Successfully authenticated
   - Red error: Check token validity and permissions
   - Loading spinner: Authentication in progress

### Managing Authentication

- **Logout**: Click the "Logout" button to disconnect
- **Token Expiry**: You'll be prompted to re-authenticate when tokens expire
- **Security**: Tokens are stored securely in your browser and never sent to external servers

## Repository Selection

### Viewing Available Repositories

1. **Repository List**
   - After authentication, you'll see a list of your accessible repositories
   - Both public and private repositories are displayed
   - Repositories are sorted alphabetically by default

2. **Repository Information**
   - **Name**: Repository name and owner
   - **Description**: Brief description if available
   - **Visibility**: Public or private indicator
   - **Last Updated**: When the repository was last modified

### Selecting a Repository

1. **Browse Repositories**
   - Scroll through the list or use the search function
   - Click on any repository card to select it

2. **Search and Filter**
   - Use the search box to find specific repositories
   - Filter by public/private visibility
   - Sort by name, last updated, or creation date

3. **Repository Details**
   - View repository statistics (stars, forks, issues)
   - See the default branch and primary language
   - Access direct links to GitHub

## Pull Request Management

### Viewing Pull Requests

1. **PR List Display**
   - After selecting a repository, you'll see all open pull requests
   - PRs are displayed with key information and metadata

2. **PR Information Shown**
   - **Title**: Pull request title and number
   - **Author**: Who created the PR with avatar
   - **Status**: Open, draft, or ready for review
   - **Created**: When the PR was opened
   - **Updated**: Last modification time
   - **Branch Info**: Source and target branches

### PR List Features

1. **Sorting Options**
   - Sort by creation date (newest/oldest)
   - Sort by last update
   - Sort by PR number

2. **Filtering**
   - Filter by author
   - Filter by draft status
   - Search by title or description

3. **Quick Actions**
   - Click any PR to select it for review
   - View PR details and metadata
   - Access direct GitHub links

### Selecting a Pull Request

1. **Choose PR for Review**
   - Click on the pull request you want to review
   - The application will load PR details and prepare for review

2. **PR Context Loading**
   - The system fetches the PR diff and metadata
   - File changes and modifications are analyzed
   - Review interface becomes available

## Running Code Reviews

### Starting a Review

1. **Review Button**
   - Click "Run Code Review" to begin analysis
   - The system will fetch the PR diff and send it to the LLM

2. **Progress Indicators**
   - Loading spinner shows review is in progress
   - Progress messages indicate current step
   - Estimated completion time may be displayed

3. **Review Process**
   - **Fetching Diff**: Getting code changes from GitHub
   - **Analyzing Code**: LLM processes the changes
   - **Generating Comments**: Creating review feedback
   - **Processing Results**: Organizing and formatting comments

### Review Configuration

1. **Template Selection**
   - Choose which review template to use
   - Default template covers comprehensive review criteria
   - Custom templates can be selected if available

2. **Review Scope**
   - All changed files are included by default
   - Large PRs may be processed in chunks
   - Binary files and generated code are typically excluded

### Understanding Review Results

1. **Comment Generation**
   - Comments are organized by file and line number
   - Each comment includes severity level (info, warning, error)
   - Comments are categorized by review criteria

2. **Review Summary**
   - Total number of comments generated
   - Breakdown by severity and category
   - Overall assessment of code quality

## Managing Review Comments

### Comment Display

1. **Comment Sidebar**
   - All generated comments appear in the sidebar
   - Comments are grouped by file for easy navigation
   - Click any comment to highlight the relevant code

2. **Comment Information**
   - **File Path**: Which file the comment relates to
   - **Line Number**: Specific line in the code
   - **Severity**: Info (blue), Warning (yellow), Error (red)
   - **Category**: Security, Performance, Quality, etc.
   - **Content**: The actual review feedback

### Comment Actions

1. **Accept Comment**
   - Click the checkmark to accept a comment
   - Accepted comments will be included in the final review
   - Accepted comments are highlighted in green

2. **Edit Comment**
   - Click the edit button to modify comment text
   - Make changes to improve clarity or accuracy
   - Save changes or cancel to revert

3. **Delete Comment**
   - Click the trash icon to remove a comment
   - Deleted comments won't appear in the final review
   - Confirm deletion to prevent accidental removal

### Comment Editing

1. **Inline Editing**
   - Double-click comment text to edit inline
   - Use markdown formatting for rich text
   - Preview changes before saving

2. **Edit Mode Features**
   - **Save**: Confirm changes
   - **Cancel**: Revert to original text
   - **Preview**: See formatted output
   - **Validation**: Check for formatting errors

3. **Editing Best Practices**
   - Keep comments constructive and specific
   - Include code examples when helpful
   - Reference documentation or standards
   - Maintain professional tone

### Comment Organization

1. **Filtering Comments**
   - Filter by severity level
   - Filter by category (security, performance, etc.)
   - Filter by status (pending, accepted, rejected)

2. **Sorting Options**
   - Sort by file path
   - Sort by line number
   - Sort by severity
   - Sort by category

3. **Bulk Actions**
   - Accept all comments in a category
   - Delete all info-level comments
   - Export specific comment types

## Template Management

### Understanding Templates

1. **Template Purpose**
   - Templates define what the AI looks for during reviews
   - They contain prompts, criteria, and rules
   - Different templates suit different project types

2. **Template Components**
   - **Criteria**: Areas of focus (security, performance, etc.)
   - **Prompts**: Detailed instructions for each area
   - **Rules**: Configuration settings and thresholds

### Using the Default Template

1. **Comprehensive Coverage**
   - The default template covers all major review areas
   - Suitable for most projects and programming languages
   - Regularly updated with best practices

2. **Review Areas Covered**
   - Code quality and best practices
   - Security vulnerabilities
   - Performance optimization
   - Maintainability and documentation
   - Test coverage and quality

### Creating Custom Templates

1. **Access Template Editor**
   - Navigate to Templates section
   - Click "Create New Template"
   - Choose a descriptive name

2. **Template Structure**
   - **Name**: Unique identifier for the template
   - **Description**: Purpose and use case
   - **Content**: Markdown-formatted template body

3. **Writing Template Content**
   - Use markdown formatting
   - Include clear section headers
   - Provide specific, actionable guidance
   - Set appropriate complexity thresholds

### Template Editor Features

1. **Live Preview**
   - Switch between edit and preview modes
   - See how your template will be formatted
   - Validate markdown syntax

2. **Auto-Generation**
   - Generate markdown from form fields
   - Structured template creation
   - Consistent formatting

3. **Validation**
   - Automatic template validation
   - Error highlighting and suggestions
   - Required field checking

### Managing Templates

1. **Template Library**
   - View all available templates
   - See template descriptions and usage
   - Access creation and modification dates

2. **Template Actions**
   - **Edit**: Modify existing templates
   - **Duplicate**: Create copies for customization
   - **Delete**: Remove unused templates
   - **Export**: Share templates with team members

## Exporting and Submitting Reviews

### Export Options

1. **Markdown Export**
   - Generate formatted markdown file
   - Includes all accepted comments
   - Organized by file and category
   - Ready for copying to GitHub or documentation

2. **Text Export**
   - Plain text format for simple sharing
   - Suitable for email or chat messages
   - Maintains comment organization

3. **JSON Export**
   - Structured data format
   - Includes all comment metadata
   - Suitable for integration with other tools

### Direct GitHub Submission

1. **Submit to GitHub**
   - Post comments directly to the PR
   - Comments appear as review feedback
   - Maintains line-by-line associations

2. **Submission Options**
   - **Individual Comments**: Post each comment separately
   - **Batch Submission**: Submit all comments at once
   - **Review Summary**: Include overall assessment

3. **GitHub Integration**
   - Comments appear in GitHub's review interface
   - Maintains formatting and links
   - Supports GitHub markdown features

### Review Finalization

1. **Final Review Check**
   - Review all accepted comments
   - Ensure comments are constructive and helpful
   - Check for any formatting issues

2. **Submission Confirmation**
   - Confirm submission details
   - Review GitHub permissions
   - Verify target PR and repository

3. **Post-Submission**
   - Confirmation of successful submission
   - Links to view comments on GitHub
   - Option to make additional changes

## Troubleshooting

### Common Issues

#### Authentication Problems

**Issue**: "Invalid token" error
- **Solution**: Verify token format (should start with `ghp_`)
- **Check**: Token hasn't expired
- **Action**: Generate new token if needed

**Issue**: "Insufficient permissions" error
- **Solution**: Ensure token has `repo` scope
- **Check**: Repository access permissions
- **Action**: Update token scopes or contact repository admin

#### Repository Access Issues

**Issue**: Repository not appearing in list
- **Solution**: Check repository permissions
- **Verify**: Token has access to the repository
- **Consider**: Organization restrictions on personal access tokens

**Issue**: Pull requests not loading
- **Solution**: Verify repository has open pull requests
- **Check**: Network connectivity
- **Try**: Refreshing the page or re-selecting repository

#### Review Generation Problems

**Issue**: Review takes too long or fails
- **Solution**: Check internet connection
- **Consider**: Large PR size may require more time
- **Try**: Breaking large PRs into smaller chunks

**Issue**: No comments generated
- **Solution**: Verify template configuration
- **Check**: PR has actual code changes
- **Consider**: Template may be too restrictive

#### Comment Management Issues

**Issue**: Comments not saving
- **Solution**: Check browser local storage
- **Try**: Refreshing page and trying again
- **Consider**: Browser compatibility issues

### Getting Help

1. **In-App Help**
   - Hover over help icons for tooltips
   - Check inline documentation
   - Use the help section in navigation

2. **Documentation**
   - Refer to this user manual
   - Check the GitHub setup guide
   - Review template customization docs

3. **Support Channels**
   - Report issues on GitHub
   - Check existing issues for solutions
   - Contact maintainers for urgent problems

## Tips and Best Practices

### Effective Code Reviews

1. **Review Preparation**
   - Choose appropriate templates for your project type
   - Customize templates for team standards
   - Set up consistent review criteria

2. **Comment Management**
   - Review all generated comments carefully
   - Edit comments for clarity and helpfulness
   - Remove irrelevant or duplicate comments
   - Add context-specific guidance

3. **Team Collaboration**
   - Share custom templates with team members
   - Establish consistent review standards
   - Document team-specific guidelines

### Template Optimization

1. **Template Design**
   - Focus on most important issues for your project
   - Balance thoroughness with practicality
   - Include specific examples and guidance
   - Regular update templates based on experience

2. **Performance Considerations**
   - Avoid overly complex templates for large PRs
   - Consider creating focused templates for specific scenarios
   - Test templates with sample code before deployment

### Workflow Integration

1. **Development Process**
   - Integrate reviews into your development workflow
   - Use consistent review criteria across projects
   - Document review processes for team members

2. **Quality Assurance**
   - Use reviews as learning opportunities
   - Track common issues to improve coding standards
   - Combine AI reviews with human oversight

### Security and Privacy

1. **Token Management**
   - Regularly rotate access tokens
   - Use minimal required permissions
   - Monitor token usage in GitHub settings

2. **Data Handling**
   - Understand that code is sent to LLM services
   - Consider privacy implications for sensitive code
   - Use appropriate templates for different security levels

### Performance Optimization

1. **Large Repositories**
   - Focus reviews on specific file types or directories
   - Use targeted templates for better performance
   - Consider breaking large PRs into smaller chunks

2. **Browser Performance**
   - Close unused browser tabs
   - Clear browser cache if experiencing issues
   - Use modern browsers for best performance

Remember: This tool is designed to enhance, not replace, human code review. Always apply critical thinking and domain expertise when evaluating AI-generated feedback.