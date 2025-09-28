import React, { useState, useCallback, useMemo } from 'react';
import type { ReviewComment, PullRequest, Repository } from '../types';
import type { ExportOptions } from '../services/export';
import { exportService, githubService, notificationService } from '../services';

interface ReviewExportSubmissionProps {
  comments: ReviewComment[];
  pullRequest: PullRequest;
  repository: Repository;
  onSubmissionSuccess?: () => void;
  onExportSuccess?: () => void;
}

export const ReviewExportSubmission: React.FC<ReviewExportSubmissionProps> = ({
  comments,
  pullRequest,
  repository,
  onSubmissionSuccess,
  onExportSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'markdown',
    includeMetadata: true,
    includeRejected: false,
    groupByFile: true,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const accepted = comments.filter(c => c.status === 'accepted');
    const rejected = comments.filter(c => c.status === 'rejected');
    const pending = comments.filter(c => c.status === 'pending');
    
    return {
      total: comments.length,
      accepted: accepted.length,
      rejected: rejected.length,
      pending: pending.length,
      hasAccepted: accepted.length > 0,
      hasPending: pending.length > 0,
    };
  }, [comments]);

  const handleSubmitToGitHub = useCallback(async () => {
    if (!stats.hasAccepted) {
      notificationService.warning(
        'No Comments to Submit',
        'Please accept at least one comment before submitting to GitHub.'
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      await githubService.postReviewComments(
        repository.full_name,
        pullRequest.number,
        comments
      );

      notificationService.submissionSuccess(stats.accepted, pullRequest.number);
      onSubmissionSuccess?.();
      
    } catch (error) {
      console.error('Submission failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notificationService.submissionError(errorMessage, true);
      
    } finally {
      setIsSubmitting(false);
    }
  }, [comments, repository, pullRequest, stats.accepted, stats.hasAccepted, onSubmissionSuccess]);

  const handleExport = useCallback(async (format: ExportOptions['format'] = exportOptions.format) => {
    if (comments.length === 0) {
      notificationService.warning(
        'No Comments to Export',
        'There are no review comments to export.'
      );
      return;
    }

    setIsExporting(true);
    
    try {
      const options = { ...exportOptions, format };
      const result = exportService.exportReview(comments, pullRequest, repository, options);
      
      exportService.downloadFile(result);
      notificationService.exportSuccess(format, result.filename);
      onExportSuccess?.();
      
    } catch (error) {
      console.error('Export failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      notificationService.exportError(format, errorMessage);
      
    } finally {
      setIsExporting(false);
    }
  }, [comments, pullRequest, repository, exportOptions, onExportSuccess]);

  const handleCopyToClipboard = useCallback(async () => {
    if (comments.length === 0) {
      notificationService.warning(
        'No Comments to Copy',
        'There are no review comments to copy.'
      );
      return;
    }

    try {
      const result = exportService.exportReview(
        comments,
        pullRequest,
        repository,
        { ...exportOptions, format: 'markdown' }
      );
      
      await exportService.copyToClipboard(result.content);
      notificationService.copySuccess();
      
    } catch (error) {
      console.error('Copy failed:', error);
      notificationService.copyError();
    }
  }, [comments, pullRequest, repository, exportOptions]);

  const handleQuickExport = useCallback((format: ExportOptions['format']) => {
    handleExport(format);
  }, [handleExport]);

  if (comments.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Review Comments</h3>
        <p className="mt-1 text-sm text-gray-500">
          Run a code review to generate comments that can be exported or submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Export & Submit Review</h3>
        <button
          onClick={() => setShowExportOptions(!showExportOptions)}
          className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {showExportOptions ? 'Hide Options' : 'Show Options'}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          <div className="text-xs text-gray-500">Accepted</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-xs text-gray-500">Rejected</div>
        </div>
      </div>

      {/* Export Options */}
      {showExportOptions && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Export Options</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                value={exportOptions.format}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  format: e.target.value as ExportOptions['format'] 
                }))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="text">Plain Text (.txt)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeMetadata: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include metadata</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeRejected}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeRejected: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include rejected comments</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.groupByFile}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    groupByFile: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Group by file</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Warning for pending comments */}
      {stats.hasPending && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Pending Comments
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                You have {stats.pending} pending comments. Only accepted comments will be submitted to GitHub.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSubmitToGitHub}
            disabled={isSubmitting || !stats.hasAccepted}
            className={`flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSubmitting || !stats.hasAccepted
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Submit to GitHub ({stats.accepted})
              </>
            )}
          </button>

          <button
            onClick={() => handleExport()}
            disabled={isExporting}
            className={`flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export as {exportOptions.format.toUpperCase()}
              </>
            )}
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickExport('markdown')}
            disabled={isExporting}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Quick Export MD
          </button>
          
          <button
            onClick={() => handleQuickExport('text')}
            disabled={isExporting}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Quick Export TXT
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};