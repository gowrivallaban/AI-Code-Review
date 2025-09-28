import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '../AppContext';

// Test component that uses the context
const TestComponent = () => {
  const { state, dispatch } = useAppContext();
  
  return (
    <div>
      <div data-testid="auth-status">
        {state.auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="loading-status">
        {state.ui.loading ? 'loading' : 'not-loading'}
      </div>
      <button
        data-testid="set-loading"
        onClick={() => dispatch({ type: 'SET_LOADING', payload: true })}
      >
        Set Loading
      </button>
    </div>
  );
};

// Component that tries to use context outside provider
const ComponentWithoutProvider = () => {
  try {
    useAppContext();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>;
  }
};

describe('AppContext', () => {
  describe('AppProvider', () => {
    it('should provide initial state to children', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('not-loading');
    });

    it('should allow state updates through dispatch', () => {
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      const setLoadingButton = screen.getByTestId('set-loading');
      
      // Initial state
      expect(screen.getByTestId('loading-status')).toHaveTextContent('not-loading');
      
      // Update state
      act(() => {
        setLoadingButton.click();
      });
      
      // Updated state
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
    });

    it('should render children correctly', () => {
      const TestChild = () => <div data-testid="child">Child Component</div>;
      
      render(
        <AppProvider>
          <TestChild />
        </AppProvider>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Child Component');
    });
  });

  describe('useAppContext', () => {
    it('should throw error when used outside AppProvider', () => {
      render(<ComponentWithoutProvider />);
      
      expect(screen.getByTestId('error')).toHaveTextContent(
        'useAppContext must be used within an AppProvider'
      );
    });

    it('should return context value when used within AppProvider', () => {
      let contextValue: any;
      
      const TestComponent = () => {
        contextValue = useAppContext();
        return <div>Test</div>;
      };

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(contextValue).toBeDefined();
      expect(contextValue.state).toBeDefined();
      expect(contextValue.dispatch).toBeDefined();
      expect(typeof contextValue.dispatch).toBe('function');
    });
  });

  describe('Context Integration', () => {
    it('should maintain state consistency across multiple consumers', () => {
      const Consumer1 = () => {
        const { state } = useAppContext();
        return <div data-testid="consumer1">{state.ui.loading ? 'loading' : 'idle'}</div>;
      };

      const Consumer2 = () => {
        const { state, dispatch } = useAppContext();
        return (
          <div>
            <div data-testid="consumer2">{state.ui.loading ? 'loading' : 'idle'}</div>
            <button
              data-testid="toggle-loading"
              onClick={() => dispatch({ type: 'SET_LOADING', payload: !state.ui.loading })}
            >
              Toggle
            </button>
          </div>
        );
      };

      render(
        <AppProvider>
          <Consumer1 />
          <Consumer2 />
        </AppProvider>
      );

      // Initial state should be consistent
      expect(screen.getByTestId('consumer1')).toHaveTextContent('idle');
      expect(screen.getByTestId('consumer2')).toHaveTextContent('idle');

      // Update from one consumer should affect both
      act(() => {
        screen.getByTestId('toggle-loading').click();
      });

      expect(screen.getByTestId('consumer1')).toHaveTextContent('loading');
      expect(screen.getByTestId('consumer2')).toHaveTextContent('loading');
    });
  });
});