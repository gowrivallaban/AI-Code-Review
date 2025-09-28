import React, { useState, useEffect, useMemo } from 'react';
import { useRepositories, useAuth, useUI } from '../hooks';
import { githubService } from '../services/github';
import type { Repository } from '../types';

interface RepositorySelectorProps {
  onRepoSelect?: (repo: Repository) => void;
}

export const RepositorySelector: React.FC<RepositorySelectorProps> = ({ onRepoSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'stars'>('updated');
  const [filterPrivate, setFilterPrivate] = useState<'all' | 'public' | 'private'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { repositories, selectedRepository, setRepositories, selectRepository } = useRepositories();
  const auth = useAuth();
  const ui = useUI();

  // Load repositories on component mount
  useEffect(() => {
    if (auth.isAuthenticated && repositories.length === 0) {
      loadRepositories();
    }
  }, [auth.isAuthenticated]);

  const loadRepositories = async () => {
    if (!auth.isAuthenticated) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const repos = await githubService.getRepositories();
      setRepositories(repos);
    } catch (err) {
      console.error('Failed to load repositories:', err);
      
      let errorMessage = 'Failed to load repositories';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort repositories
  const filteredAndSortedRepos = useMemo(() => {
    let filtered = repositories;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(term) ||
        repo.full_name.toLowerCase().includes(term) ||
        (repo.description && repo.description.toLowerCase().includes(term))
      );
    }

    // Apply privacy filter
    if (filterPrivate !== 'all') {
      filtered = filtered.filter(repo => 
        filterPrivate === 'private' ? repo.private : !repo.private
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          // Note: GitHub API doesn't return updated_at in the basic repo object
          // This would need to be added to the Repository type if needed
          return a.name.localeCompare(b.name); // Fallback to name sorting
        case 'stars':
          // Note: GitHub API doesn't return stargazers_count in the basic repo object
          // This would need to be added to the Repository type if needed
          return a.name.localeCompare(b.name); // Fallback to name sorting
        default:
          return 0;
      }
    });

    return sorted;
  }, [repositories, searchTerm, sortBy, filterPrivate]);

  const handleRepoSelect = (repo: Repository) => {
    selectRepository(repo);
    onRepoSelect?.(repo);
    ui.setCurrentView('prs');
  };

  const handleRefresh = () => {
    loadRepositories();
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-yellow-800">Authentication Required</h3>
          <p className="mt-1 text-sm text-yellow-600">
            Please authenticate with GitHub to view your repositories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Select Repository</h2>
            <p className="mt-1 text-sm text-gray-600">
              Choose a repository to review pull requests
            </p>
          </div>
          <div className="mt-3 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className={`-ml-0.5 mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Search */}
          <div className="sm:col-span-2">
            <label htmlFor="search" className="sr-only">Search repositories</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search repositories..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'updated' | 'stars')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="updated">Sort by Updated</option>
              <option value="stars">Sort by Stars</option>
            </select>
          </div>
        </div>

        {/* Privacy Filter */}
        <div className="mt-4">
          <div className="flex space-x-4">
            <span className="text-sm font-medium text-gray-700">Visibility:</span>
            {(['all', 'public', 'private'] as const).map((filter) => (
              <label key={filter} className="inline-flex items-center">
                <input
                  type="radio"
                  name="privacy-filter"
                  value={filter}
                  checked={filterPrivate === filter}
                  onChange={(e) => setFilterPrivate(e.target.value as 'all' | 'public' | 'private')}
                  className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{filter}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-sm text-red-800 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <svg className="animate-spin mx-auto h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-600">Loading repositories...</p>
          </div>
        ) : filteredAndSortedRepos.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No repositories found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search or filters.' : 'No repositories available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-4">
              Showing {filteredAndSortedRepos.length} of {repositories.length} repositories
            </div>
            
            {filteredAndSortedRepos.map((repo) => (
              <div
                key={repo.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedRepository?.id === repo.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleRepoSelect(repo)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {repo.name}
                      </h3>
                      {repo.private && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{repo.full_name}</p>
                    {repo.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{repo.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <img
                      className="h-8 w-8 rounded-full"
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                    />
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Owner: {repo.owner.login}</span>
                    <span>Branch: {repo.default_branch}</span>
                  </div>
                  
                  {selectedRepository?.id === repo.id && (
                    <div className="flex items-center text-blue-600">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium">Selected</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};