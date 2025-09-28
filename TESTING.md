# Testing Documentation

This document describes the comprehensive test suite for the GitHub PR Review UI application.

## Test Structure

The test suite is organized into several categories:

### 1. Unit Tests (`src/components/__tests__/`, `src/services/__tests__/`, etc.)
- Test individual components and services in isolation
- Mock external dependencies
- Focus on component behavior and service functionality
- Located alongside the code they test

### 2. Integration Tests (`src/__tests__/integration/`)
- Test interactions between multiple components/services
- Test data flow and state management
- Test API integrations with mocked responses
- Examples:
  - `github-llm-integration.test.tsx` - Tests GitHub API + LLM service integration
  - `template-service-integration.test.tsx` - Tests template management workflow
  - `error-handling.integration.test.tsx` - Tests error scenarios across components
  - `export-submission.integration.test.tsx` - Tests review export/submission workflow

### 3. End-to-End Tests (`e2e/`)
- Test complete user workflows in a browser environment
- Use Playwright for cross-browser testing
- Test real user interactions and navigation
- Examples:
  - `auth-and-repo-selection.spec.ts` - Authentication and repository selection flow
  - `code-review-workflow.spec.ts` - Complete code review process
  - `template-management.spec.ts` - Template editing and management
  - `responsive-design.spec.ts` - Mobile and responsive behavior

### 4. Performance Tests (`src/__tests__/performance/`)
- Test application performance with large datasets
- Measure render times and memory usage
- Test virtual scrolling and caching effectiveness
- Benchmark critical operations

### 5. Visual Regression Tests (`src/__tests__/visual/`)
- Test UI consistency across different states
- Snapshot testing for component rendering
- Responsive design validation
- Dark mode and theme testing

## Running Tests

### All Tests
```bash
npm run test:all          # Run all test suites
```

### Individual Test Types
```bash
npm run test              # Unit tests only
npm run test:watch        # Unit tests in watch mode
npm run test:coverage     # Unit tests with coverage report
npm run test:integration  # Integration tests only
npm run test:performance  # Performance tests only
npm run test:visual       # Visual regression tests only
npm run test:e2e          # End-to-end tests only
npm run test:e2e:ui       # E2E tests with UI
```

### Development
```bash
npm run test:watch        # Watch mode for development
npm run test:ui           # Vitest UI for interactive testing
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)
- Test environment: jsdom for React components
- Coverage provider: v8
- Coverage thresholds: 80% for all metrics
- Global test utilities and mocks

### Playwright Configuration (`playwright.config.ts`)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Automatic dev server startup
- Test artifacts and traces

### Coverage Requirements
- Minimum 80% coverage for:
  - Branches
  - Functions
  - Lines
  - Statements
- Critical paths require 100% coverage

## Test Patterns and Best Practices

### Unit Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AppProvider } from '../context/AppContext';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(
      <AppProvider>
        <MyComponent />
      </AppProvider>
    );
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { GitHubService } from '../services/github';

// Mock external services
vi.mock('../services/github');

describe('Service Integration', () => {
  it('should integrate services correctly', async () => {
    const mockService = GitHubService as vi.MockedClass<typeof GitHubService>;
    mockService.prototype.getRepositories = vi.fn().mockResolvedValue([]);
    
    // Test integration logic
  });
});
```

### E2E Testing
```typescript
import { test, expect } from '@playwright/test';

test('complete user workflow', async ({ page }) => {
  await page.goto('/');
  
  // Test user interactions
  await page.fill('[placeholder="GitHub token"]', 'test-token');
  await page.click('button[type="submit"]');
  
  await expect(page.getByText('Repositories')).toBeVisible();
});
```

### Performance Testing
```typescript
import { describe, it, expect } from 'vitest';
import { measureRenderPerformance } from './performance.test';

describe('Performance', () => {
  it('should render large lists efficiently', () => {
    const { average } = measureRenderPerformance(() => {
      // Render component with large dataset
    });
    
    expect(average).toBeLessThan(100); // ms
  });
});
```

## Mocking Strategies

### Service Mocking
- Mock external APIs (GitHub, LLM services)
- Use consistent mock data across tests
- Mock network requests with realistic responses

### Component Mocking
- Mock heavy components in integration tests
- Use `vi.mock()` for module-level mocking
- Create reusable mock factories

### Data Mocking
- Create mock data generators for consistent test data
- Use realistic data that matches API responses
- Include edge cases and error scenarios

## Continuous Integration

The test suite runs automatically on:
- Pull requests
- Pushes to main/develop branches
- Scheduled runs for regression testing

### CI Pipeline (`github/workflows/test.yml`)
1. **Unit Tests** - Run on multiple Node.js versions
2. **Integration Tests** - Test service interactions
3. **E2E Tests** - Cross-browser testing with Playwright
4. **Performance Tests** - Benchmark critical operations
5. **Visual Regression** - UI consistency checks
6. **Build Tests** - Verify production builds
7. **Security Scans** - Dependency vulnerability checks

### Coverage Reports
- Uploaded to Codecov for tracking
- Enforced minimum thresholds
- Detailed reports for each test type

## Debugging Tests

### Failed Tests
```bash
npm run test:ui           # Interactive test debugging
npm run test:e2e:ui       # Playwright test debugging
```

### Coverage Issues
```bash
npm run test:coverage     # Generate coverage report
open coverage/index.html  # View detailed coverage
```

### Performance Issues
```bash
npm run test:performance  # Run performance benchmarks
```

## Adding New Tests

### For New Components
1. Create unit test file alongside component
2. Test all props and user interactions
3. Test error states and edge cases
4. Add integration tests if component interacts with services

### For New Features
1. Add E2E test for complete user workflow
2. Add integration tests for service interactions
3. Add performance tests for data-heavy operations
4. Update visual regression tests for UI changes

### Test Checklist
- [ ] Unit tests for all public methods/props
- [ ] Integration tests for service interactions
- [ ] E2E tests for user workflows
- [ ] Performance tests for large datasets
- [ ] Visual tests for UI components
- [ ] Error handling tests
- [ ] Accessibility tests
- [ ] Mobile/responsive tests

## Test Data Management

### Mock Data Location
- `src/__tests__/mocks/` - Shared mock data
- Component-specific mocks in test files
- Realistic data that matches production

### Test Fixtures
- GitHub API responses
- LLM service responses
- User interaction scenarios
- Error conditions

## Maintenance

### Regular Tasks
- Update test data to match API changes
- Review and update performance benchmarks
- Update visual regression baselines
- Clean up obsolete tests

### Monitoring
- Track test execution times
- Monitor coverage trends
- Review flaky test reports
- Update browser versions for E2E tests