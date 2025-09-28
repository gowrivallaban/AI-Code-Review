# GitHub Setup Guide

## Overview

This guide will help you set up GitHub authentication for the PR Review UI application. You'll need to create a Personal Access Token (PAT) to securely connect the application to your GitHub repositories.

## Prerequisites

- A GitHub account with access to repositories you want to review
- Administrative access to repositories if you plan to submit review comments directly

## Step-by-Step Setup

### 1. Navigate to GitHub Token Settings

1. **Log in to GitHub** at [github.com](https://github.com)
2. **Click your profile picture** in the top-right corner
3. **Select "Settings"** from the dropdown menu
4. **Navigate to "Developer settings"** in the left sidebar (at the bottom)
5. **Click "Personal access tokens"**
6. **Select "Tokens (classic)"** for compatibility

### 2. Generate a New Token

1. **Click "Generate new token"**
2. **Select "Generate new token (classic)"**
3. **Add a descriptive note** for the token (e.g., "PR Review UI - [Your Name]")
4. **Set expiration** (recommended: 90 days for security, or "No expiration" for convenience)

### 3. Configure Token Permissions

Select the following scopes for full functionality:

#### Required Scopes
- ✅ **`repo`** - Full control of private repositories
  - This includes access to code, issues, pull requests, and repository metadata
  - Required for reading PR diffs and posting review comments

#### Optional but Recommended Scopes
- ✅ **`read:user`** - Read user profile information
  - Allows the app to display your username and avatar
- ✅ **`user:email`** - Access user email addresses
  - Helpful for attribution in review comments

#### Scope Details

| Scope | Purpose | Required |
|-------|---------|----------|
| `repo` | Access repositories and pull requests | ✅ Yes |
| `repo:status` | Access commit status | ✅ Yes (included in `repo`) |
| `repo_deployment` | Access deployment status | ❌ No |
| `public_repo` | Access public repositories only | ⚠️ Alternative to `repo` for public repos only |
| `read:user` | Read user profile | ✅ Recommended |
| `user:email` | Read user email | ✅ Recommended |

### 4. Generate and Copy Token

1. **Click "Generate token"** at the bottom of the page
2. **Copy the token immediately** - GitHub will only show it once
3. **Store the token securely** - treat it like a password

⚠️ **Important**: The token will look like `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5. Configure the Application

1. **Open the PR Review UI application**
2. **Paste your token** in the "GitHub Personal Access Token" field
3. **Click "Connect to GitHub"**
4. **Verify successful authentication** - you should see your username displayed

## Security Best Practices

### Token Security
- **Never share your token** with others
- **Don't commit tokens to code repositories**
- **Use environment variables** for tokens in production environments
- **Regenerate tokens regularly** (every 90 days recommended)
- **Delete unused tokens** from your GitHub settings

### Scope Minimization
- **Use minimal scopes** required for your use case
- **Consider `public_repo`** instead of `repo` if you only need access to public repositories
- **Review token usage** periodically in GitHub settings

### Access Control
- **Limit token access** to specific repositories if possible (organization settings)
- **Monitor token usage** in GitHub's audit logs
- **Revoke tokens immediately** if compromised

## Troubleshooting

### Common Issues

#### "Invalid token" Error
**Symptoms**: Authentication fails with "Invalid GitHub token" message

**Solutions**:
1. **Verify token format** - should start with `ghp_`
2. **Check for extra spaces** when copying/pasting
3. **Ensure token hasn't expired** - check GitHub settings
4. **Regenerate token** if necessary

#### "Insufficient permissions" Error
**Symptoms**: Authentication succeeds but can't access repositories

**Solutions**:
1. **Verify `repo` scope** is selected
2. **Check repository access** - ensure you have read access
3. **For organization repos** - check if organization allows personal access tokens
4. **Contact repository admin** if access is restricted

#### "Rate limit exceeded" Error
**Symptoms**: API calls fail after working initially

**Solutions**:
1. **Wait for rate limit reset** (usually 1 hour)
2. **Reduce API usage** - avoid rapid successive requests
3. **Check for other applications** using the same token
4. **Consider GitHub Apps** for higher rate limits in production

#### Network/Connection Issues
**Symptoms**: "Network error" or timeout messages

**Solutions**:
1. **Check internet connection**
2. **Verify GitHub status** at [githubstatus.com](https://githubstatus.com)
3. **Check firewall/proxy settings**
4. **Try different network** if behind corporate firewall

### Token Management

#### Viewing Active Tokens
1. Go to **GitHub Settings → Developer settings → Personal access tokens**
2. **Review active tokens** and their last usage
3. **Delete unused tokens** for security

#### Updating Token Permissions
1. **Edit existing token** (if within expiration period)
2. **Or generate new token** with updated scopes
3. **Update application** with new token
4. **Delete old token** after successful update

#### Token Rotation
1. **Generate new token** before current expires
2. **Test new token** in application
3. **Update production systems** with new token
4. **Delete old token** after successful deployment

## Organization-Specific Setup

### GitHub Enterprise
- **Contact your admin** for enterprise-specific token policies
- **Check SAML/SSO requirements** - may need additional authorization
- **Verify API endpoint** - may use custom GitHub Enterprise URL

### Organization Restrictions
Some organizations restrict personal access tokens:

1. **Check organization settings** for token policies
2. **Request access** from organization admins if needed
3. **Consider GitHub Apps** as alternative for organization use
4. **Use organization-owned tokens** if available

## Advanced Configuration

### Environment Variables
For production deployments, use environment variables:

```bash
# .env file
GITHUB_TOKEN=ghp_your_token_here
GITHUB_API_URL=https://api.github.com
```

### Multiple Tokens
For different environments or purposes:

```bash
# Development
GITHUB_TOKEN_DEV=ghp_dev_token_here

# Production  
GITHUB_TOKEN_PROD=ghp_prod_token_here

# Testing
GITHUB_TOKEN_TEST=ghp_test_token_here
```

### Token Validation
Test your token with curl:

```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

Should return your user information if token is valid.

## Getting Help

### GitHub Documentation
- [Personal Access Tokens Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub API Authentication](https://docs.github.com/en/rest/overview/other-authentication-methods)
- [Token Security Best Practices](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation)

### Support Resources
- **GitHub Support**: [support.github.com](https://support.github.com)
- **GitHub Community**: [github.community](https://github.community)
- **API Status**: [githubstatus.com](https://githubstatus.com)

### Application Support
If you continue to experience issues:

1. **Check browser console** for detailed error messages
2. **Verify network connectivity** to GitHub API
3. **Test with minimal token scopes** first
4. **Contact your system administrator** for organization-specific issues

## Security Checklist

Before using your token:

- [ ] Token has minimal required scopes
- [ ] Token expiration is set appropriately
- [ ] Token is stored securely (not in code)
- [ ] You understand what access the token provides
- [ ] You have a plan for token rotation
- [ ] You know how to revoke the token if needed

After setup:

- [ ] Authentication works successfully
- [ ] You can access expected repositories
- [ ] Application functions work as expected
- [ ] Token usage is monitored
- [ ] Backup authentication method is available (if needed)

Remember: Your GitHub token is like a password - keep it secure and never share it with others!