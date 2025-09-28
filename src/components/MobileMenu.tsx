import React from 'react';
import { useAuth, useUI, useCurrentSelection } from '../hooks';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const auth = useAuth();
  const ui = useUI();
  const selection = useCurrentSelection();

  if (!auth.isAuthenticated || !isOpen) {
    return null;
  }

  const navigationItems = [
    {
      name: 'Repositories',
      view: 'repos' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      available: true,
      description: 'Select a repository',
    },
    {
      name: 'Pull Requests',
      view: 'prs' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      available: !!selection.repository,
      description: selection.repository ? `View PRs in ${selection.repository.name}` : 'Select a repository first',
    },
    {
      name: 'Code Review',
      view: 'review' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      available: !!selection.pullRequest,
      description: selection.pullRequest ? `Review PR #${selection.pullRequest.number}` : 'Select a pull request first',
    },
    {
      name: 'Templates',
      view: 'templates' as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      available: true,
      description: 'Manage review templates',
    },
  ];

  const handleNavigation = (view: typeof ui.currentView) => {
    ui.setCurrentView(view);
    onClose();
  };

  return (
    <div className="md:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
        {/* Navigation Items */}
        {navigationItems.map((item) => (
          <button
            key={item.name}
            onClick={() => item.available && handleNavigation(item.view)}
            disabled={!item.available}
            className={`
              w-full flex items-start px-3 py-3 rounded-md text-left transition-colors duration-200
              ${ui.currentView === item.view
                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                : item.available
                ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {item.icon}
            </div>
            <div className="ml-3 flex-1">
              <div className="text-sm font-medium">
                {item.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {item.description}
              </div>
            </div>
            {ui.currentView === item.view && (
              <div className="flex-shrink-0 ml-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}

        {/* Divider */}
        <div className="border-t border-gray-200 my-3" />

        {/* User Info */}
        {auth.user && (
          <div className="px-3 py-2">
            <div className="flex items-center">
              <img
                src={auth.user.avatar_url}
                alt={auth.user.login}
                className="h-10 w-10 rounded-full"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-700">
                  {auth.user.name || auth.user.login}
                </div>
                <div className="text-xs text-gray-500">
                  @{auth.user.login}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={() => {
            auth.logout();
            onClose();
          }}
          className="w-full flex items-center px-3 py-3 rounded-md text-left text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="ml-3 text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};