import React from 'react';
import { useUI, useCurrentSelection } from '../hooks';

export const Breadcrumbs: React.FC = () => {
  const ui = useUI();
  const selection = useCurrentSelection();

  const getBreadcrumbs = () => {
    const breadcrumbs: Array<{
      name: string;
      view: 'repos' | 'prs' | 'review' | 'templates';
      current: boolean;
      available: boolean;
    }> = [
      {
        name: 'Home',
        view: 'repos' as const,
        current: false,
        available: true,
      },
    ];

    if (selection.repository) {
      breadcrumbs.push({
        name: selection.repository.name,
        view: 'prs' as const,
        current: ui.currentView === 'prs' && !selection.pullRequest,
        available: true,
      });
    }

    if (selection.pullRequest) {
      breadcrumbs.push({
        name: `PR #${selection.pullRequest.number}: ${selection.pullRequest.title}`,
        view: 'review' as const,
        current: ui.currentView === 'review',
        available: true,
      });
    }

    if (ui.currentView === 'templates') {
      breadcrumbs.push({
        name: 'Templates',
        view: 'templates' as const,
        current: true,
        available: true,
      });
    }

    // Mark the last item as current if no specific current item is set
    if (breadcrumbs.length > 1 && !breadcrumbs.some(b => b.current)) {
      breadcrumbs[breadcrumbs.length - 1].current = true;
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex py-3" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            
            {breadcrumb.current ? (
              <span
                className="text-gray-500 font-medium truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
                aria-current="page"
                title={breadcrumb.name}
              >
                {breadcrumb.name}
              </span>
            ) : (
              <button
                onClick={() => breadcrumb.available && ui.setCurrentView(breadcrumb.view)}
                disabled={!breadcrumb.available}
                className={`
                  truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg transition-colors duration-200
                  ${breadcrumb.available
                    ? 'text-blue-600 hover:text-blue-800 hover:underline'
                    : 'text-gray-400 cursor-not-allowed'
                  }
                `}
                title={breadcrumb.name}
              >
                {breadcrumb.name}
              </button>
            )}
          </li>
        ))}
      </ol>
      
      {/* Current View Indicator */}
      <div className="ml-auto flex items-center text-xs text-gray-500">
        <span className="hidden sm:inline">Current: </span>
        <span className="capitalize font-medium ml-1">
          {ui.currentView === 'repos' ? 'Repositories' : 
           ui.currentView === 'prs' ? 'Pull Requests' :
           ui.currentView === 'review' ? 'Code Review' :
           ui.currentView === 'templates' ? 'Templates' : ui.currentView}
        </span>
        
        {ui.isReviewRunning && (
          <div className="ml-2 flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
            <span className="ml-1 text-blue-600">Reviewing...</span>
          </div>
        )}
      </div>
    </nav>
  );
};