import React, { useState, useCallback, useMemo } from 'react';
import { VirtualScrollList } from './VirtualScrollList';
import type { CommentSidebarProps, ReviewComment } from '../types';

interface CommentCardProps {
  comment: ReviewComment;
  onAccept: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  onAccept,
  onEdit,
  onDelete,
  onClick,
  isExpanded,
  onToggleExpand,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Determine if content should be truncated
  const shouldTruncate = comment.content.length > 200;
  const displayContent = shouldTruncate && !isExpanded 
    ? comment.content.substring(0, 200) + '...' 
    : comment.content;

  const handleEditStart = useCallback(() => {
    setEditContent(comment.content);
    setIsEditing(true);
  }, [comment.content]);

  const handleEditSave = useCallback(() => {
    if (editContent.trim() !== comment.content) {
      onEdit(comment.id, editContent.trim());
    }
    setIsEditing(false);
  }, [comment.id, comment.content, editContent, onEdit]);

  const handleEditCancel = useCallback(() => {
    setEditContent(comment.content);
    setIsEditing(false);
  }, [comment.content]);

  const handleDelete = useCallback(() => {
    onDelete(comment.id);
    setShowDeleteConfirm(false);
  }, [comment.id, onDelete]);

  const handleCardClick = useCallback(() => {
    onClick(comment.id);
  }, [comment.id, onClick]);

  const getSeverityColor = (severity: ReviewComment['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: ReviewComment['severity']) => {
    switch (severity) {
      case 'error':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStatusBadge = (status: ReviewComment['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending
          </span>
        );
    }
  };

  return (
    <div 
      className={`border rounded-lg p-4 mb-3 cursor-pointer transition-all duration-200 hover:shadow-md ${getSeverityColor(comment.severity)} ${
        comment.status === 'accepted' ? 'opacity-75' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {getSeverityIcon(comment.severity)}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {comment.file}
            </p>
            <p className="text-xs opacity-75">
              Line {comment.line}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          {getStatusBadge(comment.status)}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCancel();
                }}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditSave();
                }}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
            {shouldTruncate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(comment.id);
                }}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isEditing && comment.status === 'pending' && (
        <div className="flex items-center justify-between pt-2 border-t border-current border-opacity-20">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(comment.id);
              }}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditStart();
              }}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit
            </button>
          </div>
          
          <div className="relative">
            {showDeleteConfirm ? (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-600">Delete?</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Yes
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L8.586 12l-1.293 1.293a1 1 0 101.414 1.414L10 13.414l1.293 1.293a1 1 0 001.414-1.414L11.414 12l1.293-1.293z" clipRule="evenodd" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category and timestamp */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-current border-opacity-10">
        <div className="flex items-center space-x-2 text-xs opacity-75">
          {comment.category && (
            <span className="px-2 py-1 bg-white bg-opacity-50 rounded-full">
              {comment.category}
            </span>
          )}
        </div>
        <span className="text-xs opacity-75">
          {new Date(comment.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export const CommentSidebar: React.FC<CommentSidebarProps> = ({
  comments,
  onCommentAccept,
  onCommentEdit,
  onCommentDelete,
  onCommentClick,
}) => {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'file' | 'severity' | 'line'>('file');

  const handleToggleExpand = useCallback((commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  // Filter and sort comments
  const filteredAndSortedComments = useMemo(() => {
    let filtered = comments;
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(comment => comment.status === filterStatus);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'file':
          if (a.file !== b.file) {
            return a.file.localeCompare(b.file);
          }
          return a.line - b.line;
        case 'severity':
          const severityOrder = { error: 0, warning: 1, info: 2 };
          const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
          if (severityDiff !== 0) return severityDiff;
          return a.file.localeCompare(b.file);
        case 'line':
          if (a.file !== b.file) {
            return a.file.localeCompare(b.file);
          }
          return a.line - b.line;
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [comments, filterStatus, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = comments.length;
    const pending = comments.filter(c => c.status === 'pending').length;
    const accepted = comments.filter(c => c.status === 'accepted').length;
    const rejected = comments.filter(c => c.status === 'rejected').length;
    const errors = comments.filter(c => c.severity === 'error').length;
    const warnings = comments.filter(c => c.severity === 'warning').length;
    const info = comments.filter(c => c.severity === 'info').length;
    
    return { total, pending, accepted, rejected, errors, warnings, info };
  }, [comments]);

  if (comments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review Comments</h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h4 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h4>
          <p className="mt-1 text-sm text-gray-500">
            Run a code review to see AI-generated comments here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Review Comments ({stats.total})
          </h3>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-xs text-gray-500">Accepted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-gray-500">Rejected</div>
          </div>
        </div>

        {/* Severity breakdown */}
        <div className="flex justify-center space-x-4 mb-4 text-xs">
          <span className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
            {stats.errors} Errors
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
            {stats.warnings} Warnings
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
            {stats.info} Info
          </span>
        </div>

        {/* Filters and sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="file">File & Line</option>
              <option value="severity">Severity</option>
              <option value="line">Line Number</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="p-6">
        {filteredAndSortedComments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              No comments match the current filter
            </p>
          </div>
        ) : filteredAndSortedComments.length > 10 ? (
          // Use virtual scrolling for large comment lists
          <VirtualScrollList
            items={filteredAndSortedComments}
            itemHeight={200}
            containerHeight={400}
            className="space-y-0"
            renderItem={(comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onAccept={onCommentAccept}
                onEdit={onCommentEdit}
                onDelete={onCommentDelete}
                onClick={onCommentClick}
                isExpanded={expandedComments.has(comment.id)}
                onToggleExpand={handleToggleExpand}
              />
            )}
          />
        ) : (
          // Use regular rendering for smaller lists
          <div className="space-y-0 max-h-96 overflow-y-auto">
            {filteredAndSortedComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onAccept={onCommentAccept}
                onEdit={onCommentEdit}
                onDelete={onCommentDelete}
                onClick={onCommentClick}
                isExpanded={expandedComments.has(comment.id)}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};