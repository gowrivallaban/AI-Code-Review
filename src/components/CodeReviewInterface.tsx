import React, { useState, useCallback } from 'react';
import type { CodeReviewInterfaceProps } from '../types';
import { useUI, useReviewComments, useTemplates } from '../hooks';
import { githubService, llmService, templateService } from '../services';
import { CommentSidebar } from './CommentSidebar';
import { ReviewExportSubmission } from './ReviewExportSubmission';

interface ReviewProgress {
  stage: 'idle' | 'fetching-diff' | 'analyzing' | 'parsing' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}

export const CodeReviewInterface: React.FC<CodeReviewInterfaceProps> = ({
  pullRequest,
  repository,
}) => {
  const ui = useUI();
  const { comments, setComments, acceptComment, editComment, deleteComment } = useReviewComments();
  
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress>({
    stage: 'idle',
    message: '',
    progress: 0,
  });
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const updateProgress = useCallback((stage: ReviewProgress['stage'], message: string, progress: number) => {
    setReviewProgress({ stage, message, progress });
  }, []);

  const runCodeReview = useCallback(async () => {
    try {
      setLastError(null);
      ui.setReviewRunning(true);
      ui.setError(null);

      // Stage 1: Fetch PR diff
      updateProgress('fetching-diff', 'Fetching pull request diff...', 10);
      
      const diff = await githubService.getPullRequestDiff(
        repository.full_name,
        pullRequest.number
      );

      if (!diff || diff.trim().length === 0) {
        throw new Error('No changes found in this pull request');
      }

      // Stage 2: Get template
      updateProgress('fetching-diff', 'Loading review template...', 25);
      
      // Use default template for now - in future this could be user-selectable
      const template = templateService.getDefaultTemplate();

      // Stage 3: Analyze with LLM
      updateProgress('analyzing', 'Analyzing code with AI...', 40);
      
      const comments = await llmService.analyzeCode(diff, template);

      // Stage 4: Parse and validate results
      updateProgress('parsing', 'Processing review results...', 80);
      
      if (!comments || comments.length === 0) {
        updateProgress('complete', 'No issues found in this pull request', 100);
        setComments([]);
      } else {
        updateProgress('complete', `Found ${comments.length} review comments`, 100);
        setComments(comments);
      }

      // Reset retry count on success
      setRetryCount(0);
      
    } catch (error) {
      console.error('Code review failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      updateProgress('error', errorMessage, 0);
      ui.setError(`Code review failed: ${errorMessage}`);
      
    } finally {
      ui.setReviewRunning(false);
    }
  }, [repository, pullRequest, ui, setComments, updateProgress]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    runCodeReview();
  }, [runCodeReview]);

  const resetReview = useCallback(() => {
    setReviewProgress({
      stage: 'idle',
      message: '',
      progress: 0,
    });
    setLastError(null);
    setRetryCount(0);
    ui.setReviewRunning(false);
    ui.setError(null);
  }, [ui]);

  const handleCommentClick = useCallback((commentId: string) => {
    // TODO: Implement highlighting of relevant code section
    console.log('Comment clicked:', commentId);
  }, []);

  const isRunning = ui.isReviewRunning;
  const canRetry = reviewProgress.stage === 'error' && retryCount < 3;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Review Interface */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Code Review</h2>
          <p className="text-sm text-gray-600 mt-1">
            PR #{pullRequest.number}: {pullRequest.title}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {reviewProgress.stage === 'complete' && (
            <button
              onClick={resetReview}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset
            </button>
          )}
          
          {canRetry && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Retry ({3 - retryCount} left)
            </button>
          )}
          
          <button
            onClick={runCodeReview}
            disabled={isRunning}
            className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRunning ? 'Running Review...' : 'Run Code Review'}
          </button>
        </div>
      </div>

      {/* Progress Section */}
      {(isRunning || reviewProgress.stage !== 'idle') && (
        <div className="mb-6">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{reviewProgress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  reviewProgress.stage === 'error'
                    ? 'bg-red-500'
                    : reviewProgress.stage === 'complete'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${reviewProgress.progress}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          <div className="flex items-center space-x-2">
            {isRunning && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
            )}
            
            {reviewProgress.stage === 'error' && (
              <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            
            {reviewProgress.stage === 'complete' && (
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            
            <span className={`text-sm ${
              reviewProgress.stage === 'error'
                ? 'text-red-600'
                : reviewProgress.stage === 'complete'
                ? 'text-green-600'
                : 'text-gray-600'
            }`}>
              {reviewProgress.message}
            </span>
          </div>
        </div>
      )}

      {/* Error Details */}
      {reviewProgress.stage === 'error' && lastError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Review Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                {lastError}
              </div>
              {retryCount > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  Retry attempt: {retryCount}/3
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {reviewProgress.stage === 'complete' && !lastError && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Review Complete</h3>
              <div className="mt-2 text-sm text-green-700">
                {reviewProgress.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {reviewProgress.stage === 'idle' && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ready to Review</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click "Run Code Review" to analyze the pull request changes with AI
          </p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Repository: {repository.full_name}</p>
            <p>Branch: {pullRequest.head.ref} → {pullRequest.base.ref}</p>
          </div>
        </div>
      )}
        </div>
        
        {/* Export and Submission Interface */}
        {reviewProgress.stage === 'complete' && !lastError && (
          <ReviewExportSubmission
            comments={comments}
            pullRequest={pullRequest}
            repository={repository}
            onSubmissionSuccess={() => {
              // Reset review state after successful submission
              resetReview();
            }}
            onExportSuccess={() => {
              // Could add analytics or other tracking here
            }}
          />
        )}
      </div>

      {/* Comment Sidebar */}
      <div className="lg:col-span-1">
        <CommentSidebar
          comments={comments}
          onCommentAccept={acceptComment}
          onCommentEdit={editComment}
          onCommentDelete={deleteComment}
          onCommentClick={handleCommentClick}
        />
      </div>
    </div>
  );
};