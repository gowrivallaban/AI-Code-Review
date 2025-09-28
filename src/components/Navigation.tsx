import React from 'react';
import { useAuth, useUI, useCurrentSelection } from '../hooks';

export const Navigation: React.FC = () => {
  const auth = useAuth();
  const ui = useUI();
  const selection = useCurrentSelection();

  if (!auth.isAuthenticated) {
    return null;
  }

  const navigationItems = [
    {
      name: 'Repositories',
      view: 'repos' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      available: true,
    },
    {
      name: 'Pull Requests',
      view: 'prs' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      available: !!selection.repository,
    },
    {
      name: 'Code Review',
      view: 'review' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      available: !!selection.pullRequest,
    },
    {
      name: 'Templates',
      view: 'templates' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      available: true,
    },
  ];

  return (
    <div className="flex items-center space-x-1">
      {/* Navigation Items */}
      <nav className="flex space-x-1">
        {navigationItems.map((item) => (
          <button
            key={item.name}
            onClick={() => item.available && ui.setCurrentView(item.view)}
            disabled={!item.available}
            className={`
              inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
              ${ui.currentView === item.view
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : item.available
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
              }
            `}
            title={!item.available ? `${item.name} not available` : undefined}
          >
            {item.icon}
            <span className="ml-2 hidden sm:inline">{item.name}</span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300 mx-2" />

      {/* User Menu */}
      <div className="flex items-center space-x-2">
        {auth.user && (
          <div className="flex items-center space-x-2">
            <img
              src={auth.user.avatar_url}
              alt={auth.user.login}
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm text-gray-700 hidden lg:inline">
              {auth.user.login}
            </span>
          </div>
        )}
        
        <button
          onClick={auth.logout}
          className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="ml-2 hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
};