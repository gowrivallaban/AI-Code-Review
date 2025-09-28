import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useUI, useCurrentSelection, usePullRequests } from '../hooks';
import { Layout } from './Layout';
import type { Repository, PullRequest } from '../types';

// Lazy load components for code splitting
const AuthAndRepoLayout = lazy(() => import('./AuthAndRepoLayout').then(module => ({ default: module.AuthAndRepoLayout })));
const PRList = lazy(() => import('./PRList').then(module => ({ default: module.PRList })));
const CodeReviewInterface = lazy(() => import('./CodeReviewInterface').then(module => ({ default: module.CodeReviewInterface })));
const TemplateManager = lazy(() => import('./TemplateManager').then(module => ({ default: module.TemplateManager })));

// Loading component for suspense fallback
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-600">{message}</span>
  </div>
);

// Route synchronization component
const RouteSynchronizer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const ui = useUI();
  const selection = useCurrentSelection();

  // Sync URL with app state
  useEffect(() => {
    const path = location.pathname;
    
    if (!auth.isAuthenticated && path !== '/') {
      navigate('/', { replace: true });
      return;
    }

    // Update current view based on URL
    if (path === '/' || path === '/repos') {
      if (ui.currentView !== 'repos') {
        ui.setCurrentView('repos');
      }
    } else if (path === '/prs') {
      if (ui.currentView !== 'prs') {
        ui.setCurrentView('prs');
      }
    } else if (path === '/review') {
      if (ui.currentView !== 'review') {
        ui.setCurrentView('review');
      }
    } else if (path === '/templates') {
      if (ui.currentView !== 'templates') {
        ui.setCurrentView('templates');
      }
    }
  }, [location.pathname, auth.isAuthenticated, ui, navigate]);

  // Sync app state with URL
  useEffect(() => {
    const currentPath = location.pathname;
    let targetPath = '/';

    switch (ui.currentView) {
      case 'repos':
        targetPath = '/repos';
        break;
      case 'prs':
        targetPath = '/prs';
        break;
      case 'review':
        targetPath = '/review';
        break;
      case 'templates':
        targetPath = '/templates';
        break;
    }

    if (currentPath !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [ui.currentView, navigate, location.pathname]);

  return null;
};

// Page components with proper guards
const RepositoriesPage: React.FC = () => {
  const auth = useAuth();
  const { selectPullRequest } = usePullRequests();
  
  const handleRepoSelect = (repo: Repository) => {
    console.log('Repository selected:', repo.name);
    // Clear any selected PR when changing repositories
    selectPullRequest(null);
  };

  if (!auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading repositories..." />}>
      <AuthAndRepoLayout onRepoSelect={handleRepoSelect} />
    </Suspense>
  );
};

const PullRequestsPage: React.FC = () => {
  const auth = useAuth();
  const ui = useUI();
  const selection = useCurrentSelection();

  const handlePRSelect = (pr: PullRequest) => {
    console.log('Pull request selected:', pr.title);
    ui.setCurrentView('review');
  };

  if (!auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!selection.repository) {
    return <Navigate to="/repos" replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading pull requests..." />}>
      <PRList repository={selection.repository} onPRSelect={handlePRSelect} />
    </Suspense>
  );
};

const CodeReviewPage: React.FC = () => {
  const auth = useAuth();
  const selection = useCurrentSelection();

  if (!auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!selection.repository) {
    return <Navigate to="/repos" replace />;
  }

  if (!selection.pullRequest) {
    return <Navigate to="/prs" replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading code review interface..." />}>
      <CodeReviewInterface 
        pullRequest={selection.pullRequest} 
        repository={selection.repository} 
      />
    </Suspense>
  );
};

const TemplatesPage: React.FC = () => {
  const auth = useAuth();
  const ui = useUI();

  if (!auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading template manager..." />}>
      <TemplateManager onClose={() => ui.setCurrentView('repos')} />
    </Suspense>
  );
};

const HomePage: React.FC = () => {
  const auth = useAuth();

  if (auth.isAuthenticated) {
    return <Navigate to="/repos" replace />;
  }

  return <RepositoriesPage />;
};

// Main router component
const AppRouter: React.FC = () => {
  return (
    <Layout>
      <RouteSynchronizer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/repos" element={<RepositoriesPage />} />
        <Route path="/prs" element={<PullRequestsPage />} />
        <Route path="/review" element={<CodeReviewPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export const Router: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppRouter />
    </BrowserRouter>
  );
};