import React from 'react';
import { useAuth, useUI } from '../hooks';
import { GitHubAuth } from './GitHubAuth';
import { RepositorySelector } from './RepositorySelector';
import type { Repository } from '../types';

interface AuthAndRepoLayoutProps {
  onRepoSelect?: (repo: Repository) => void;
}

export const AuthAndRepoLayout: React.FC<AuthAndRepoLayoutProps> = ({ onRepoSelect }) => {
  const auth = useAuth();
  const ui = useUI();

  const handleAuthSuccess = () => {
    // Authentication successful, UI will automatically show repository selector
    // due to the auth state change
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GitHub PR Review UI</h1>
          <p className="mt-2 text-lg text-gray-600">
            Automated code review for your GitHub pull requests
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-5">
              {/* Step 1: Authentication */}
              <li className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  auth.isAuthenticated 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'border-gray-300'
                }`}>
                  {auth.isAuthenticated ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium text-gray-500">1</span>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  auth.isAuthenticated ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  Authenticate
                </span>
              </li>

              {/* Connector */}
              <div className={`w-5 h-0.5 ${
                auth.isAuthenticated ? 'bg-blue-600' : 'bg-gray-300'
              }`} />

              {/* Step 2: Repository Selection */}
              <li className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  auth.isAuthenticated 
                    ? 'border-blue-600 bg-white' 
                    : 'border-gray-300'
                }`}>
                  <span className={`text-sm font-medium ${
                    auth.isAuthenticated ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    2
                  </span>
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  auth.isAuthenticated ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  Select Repository
                </span>
              </li>

              {/* Connector */}
              <div className="w-5 h-0.5 bg-gray-300" />

              {/* Step 3: Review PRs */}
              <li className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300">
                  <span className="text-sm font-medium text-gray-500">3</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">
                  Review PRs
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {!auth.isAuthenticated ? (
            /* Authentication Step */
            <GitHubAuth onAuthSuccess={handleAuthSuccess} />
          ) : (
            /* Repository Selection Step */
            <RepositorySelector onRepoSelect={onRepoSelect} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-500">
              Secure authentication with GitHub Personal Access Tokens
            </p>
            <div className="mt-2 flex justify-center space-x-6 text-xs text-gray-400">
              <span>✓ No data stored permanently</span>
              <span>✓ Read-only repository access</span>
              <span>✓ Encrypted token storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};