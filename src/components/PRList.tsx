import React, { useState, useEffect, useMemo } from 'react';
import { usePullRequests, useUI } from '../hooks';
import { githubService } from '../services';
import { VirtualScrollList } from './VirtualScrollList';
import type { PullRequest, Repository } from '../types';

interface PRListProps {
  repository: Repository;
  onPRSelect: (pr: PullRequest) => void;
}

type SortOption = 'updated' | 'created' | 'title' | 'number';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  search: string;
  author: string;
}

export const PRList: React.FC<PRListProps> = ({ repository, onPRSelect }) => {
  const { pullRequests, setPullRequests } = usePullRequests();
  const { setError } = useUI();
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    author: '',
  });
  const [isLoadingPRs, setIsLoadingPRs] = useState(false);

  // Load pull requests when repository changes
  useEffect(() => {
    const loadPullRequests = async () => {
      if (!repository) return;

      setIsLoadingPRs(true);
      setError(null);

      try {
        const prs = await githubService.getPullRequests(repository.full_name);
        setPullRequests(prs);
      } catch (error) {
        console.error('Failed to load pull requests:', error);
        setError(error instanceof Error ? error.message : 'Failed to load pull requests');
        setPullRequests([]);
      } finally {
        setIsLoadingPRs(false);
      }
    };

    loadPullRequests();
  }, [repository, setPullRequests, setError]);

  // Get unique authors for filter dropdown
  const authors = useMemo(() => {
    const uniqueAuthors = new Set(pullRequests.map(pr => pr.user.login));
    return Array.from(uniqueAuthors).sort();
  }, [pullRequests]);

  // Filter and sort pull requests
  const filteredAndSortedPRs = useMemo(() => {
    let filtered = pullRequests;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(pr =>
        pr.title.toLowerCase().includes(searchLower) ||
        pr.number.toString().includes(searchLower) ||
        pr.user.login.toLowerCase().includes(searchLower)
      );
    }

    // Apply author filter
    if (filters.author) {
      filtered = filtered.filter(pr => pr.user.login === filters.author);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'updated':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case 'created':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'number':
          aValue = a.number;
          bValue = b.number;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [pullRequests, filters, sortBy, sortDirection]);

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', author: '' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getSortIcon = (column: SortOption) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoadingPRs) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading pull requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pull Requests</h2>
          <p className="text-gray-600">
            {repository.full_name} • {filteredAndSortedPRs.length} of {pullRequests.length} PRs
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by title, number, or author..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Author Filter */}
          <div className="sm:w-48">
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <select
              id="author"
              value={filters.author}
              onChange={(e) => handleFilterChange('author', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All authors</option>
              {authors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(filters.search || filters.author) && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 py-2">Sort by:</span>
          {[
            { key: 'updated' as const, label: 'Last Updated' },
            { key: 'created' as const, label: 'Created' },
            { key: 'title' as const, label: 'Title' },
            { key: 'number' as const, label: 'Number' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSortChange(key)}
              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                sortBy === key
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {label}
              <span className="ml-1">{getSortIcon(key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pull Request List */}
      {filteredAndSortedPRs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          {pullRequests.length === 0 ? (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pull requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                This repository doesn't have any open pull requests.
              </p>
            </>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No matching pull requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </>
          )}
        </div>
      ) : filteredAndSortedPRs.length > 20 ? (
        // Use virtual scrolling for large lists
        <VirtualScrollList
          items={filteredAndSortedPRs}
          itemHeight={120}
          containerHeight={600}
          className="bg-white rounded-lg border border-gray-200"
          renderItem={(pr, index) => (
            <div
              key={pr.id}
              onClick={() => onPRSelect(pr)}
              className="bg-white border-b border-gray-200 last:border-b-0 p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      #{pr.number}
                    </span>
                    <span className="text-xs text-gray-500">
                      opened {formatDate(pr.created_at)}
                    </span>
                    <span className="text-xs text-gray-500">
                      • updated {formatDate(pr.updated_at)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                    {pr.title}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <img
                        src={pr.user.avatar_url}
                        alt={pr.user.login}
                        className="w-5 h-5 rounded-full"
                      />
                      <span>{pr.user.login}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="font-mono text-xs">
                        {pr.head.ref} → {pr.base.ref}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        />
      ) : (
        // Use regular rendering for smaller lists
        <div className="space-y-3">
          {filteredAndSortedPRs.map((pr) => (
            <div
              key={pr.id}
              onClick={() => onPRSelect(pr)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      #{pr.number}
                    </span>
                    <span className="text-xs text-gray-500">
                      opened {formatDate(pr.created_at)}
                    </span>
                    <span className="text-xs text-gray-500">
                      • updated {formatDate(pr.updated_at)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                    {pr.title}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <img
                        src={pr.user.avatar_url}
                        alt={pr.user.login}
                        className="w-5 h-5 rounded-full"
                      />
                      <span>{pr.user.login}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="font-mono text-xs">
                        {pr.head.ref} → {pr.base.ref}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};