import React, { useState } from 'react';
import { useAuth, useUI } from '../hooks';
import { githubService } from '../services/github';
import type { AuthError } from '../types';
import { HelpIcon } from './Tooltip';

interface GitHubAuthProps {
  onAuthSuccess?: () => void;
}

export const GitHubAuth: React.FC<GitHubAuthProps> = ({ onAuthSuccess }) => {
  const [token, setToken] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const auth = useAuth();
  const ui = useUI();

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setAuthError('Please enter a GitHub token');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Authenticate with GitHub service
      await githubService.authenticate(token);
      
      // Get user information
      const user = githubService.getUser();
      
      if (user) {
        // Update app state
        auth.authenticate(token, user);
        
        // Clear form
        setToken('');
        
        // Call success callback
        onAuthSuccess?.();
        
        // Navigate to repositories view
        ui.setCurrentView('repos');
      } else {
        throw new Error('Failed to get user information');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      
      let errorMessage = 'Authentication failed';
      
      if (error && typeof error === 'object' && 'type' in error) {
        const authError = error as AuthError;
        switch (authError.reason) {
          case 'invalid_token':
            errorMessage = 'Invalid GitHub token. Please check your token and try again.';
            break;
          case 'insufficient_permissions':
            errorMessage = 'Token lacks required permissions. Please ensure your token has repo access.';
            break;
          case 'network_error':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          default:
            errorMessage = authError.message || 'Authentication failed';
        }
      }
      
      setAuthError(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    // Clear error when user starts typing
    if (authError) {
      setAuthError(null);
    }
  };

  if (auth.isAuthenticated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Successfully authenticated
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Welcome, {auth.user?.login}!</p>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={auth.logout}
              className="text-sm text-green-800 hover:text-green-900 underline"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Connect to GitHub
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your GitHub Personal Access Token to get started
        </p>
      </div>

      <form onSubmit={handleTokenSubmit} className="space-y-4">
        <div>
          <div className="flex items-center mb-2">
            <label htmlFor="github-token" className="block text-sm font-medium text-gray-700">
              GitHub Personal Access Token
            </label>
            <HelpIcon 
              content={
                <div className="text-left">
                  <p className="mb-2">A Personal Access Token (PAT) allows secure access to your GitHub repositories.</p>
                  <p className="mb-2 font-semibold">Required scopes:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>repo</strong> - Access to repositories and pull requests</li>
                    <li><strong>read:user</strong> - Read user profile information</li>
                  </ul>
                  <p className="mt-2 text-xs">Tokens are stored securely in your browser and never sent to our servers.</p>
                </div>
              }
              className="ml-2"
              position="bottom"
            />
          </div>
          <input
            id="github-token"
            type="password"
            value={token}
            onChange={handleTokenChange}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isAuthenticating}
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-gray-500">
            Your token needs 'repo' scope to access repositories and pull requests
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{authError}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isAuthenticating || !token.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAuthenticating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating...
            </>
          ) : (
            'Connect to GitHub'
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <div className="text-sm text-gray-600">
          <h3 className="font-medium mb-2">How to create a Personal Access Token:</h3>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
            <li>Click "Generate new token (classic)"</li>
            <li>Select the "repo" scope for full repository access</li>
            <li>Copy the generated token and paste it above</li>
          </ol>
          <p className="mt-2 text-xs">
            <a 
              href="https://github.com/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Create token on GitHub →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};