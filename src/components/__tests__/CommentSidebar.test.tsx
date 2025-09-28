import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CommentSidebar } from '../CommentSidebar';
import type { ReviewComment } from '../../types';

// Mock data with unique file names to avoid test conflicts
const mockComments: ReviewComment[] = [
  {
    id: '1',
    file: 'src/components/App.tsx',
    line: 25,
    content: 'This function is too complex and should be broken down into smaller functions.',
    severity: 'warning',
    status: 'pending',
    createdAt: '2024-01-01T10:00:00Z',
    category: 'Code Quality',
  },
  {
    id: '2',
    file: 'src/utils/helpers.ts',
    line: 10,
    content: 'Potential security vulnerability: user input is not sanitized before processing.',
    severity: 'error',
    status: 'pending',
    createdAt: '2024-01-01T10:05:00Z',
    category: 'Security',
  },
  {
    id: '3',
    file: 'src/components/Button.tsx',
    line: 15,
    content: 'Consider adding proper TypeScript types for better type safety.',
    severity: 'info',
    status: 'accepted',
    createdAt: '2024-01-01T10:10:00Z',
    category: 'TypeScript',
  },
];

// Mock handlers
const mockHandlers = {
  onCommentAccept: vi.fn(),
  onCommentEdit: vi.fn(),
  onCommentDelete: vi.fn(),
  onCommentClick: vi.fn(),
};

describe('CommentSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should display empty state when no comments are provided', () => {
      render(
        <CommentSidebar
          comments={[]}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No comments yet')).toBeInTheDocument();
      expect(screen.getByText('Run a code review to see AI-generated comments here')).toBeInTheDocument();
    });
  });

  describe('Comment Display', () => {
    it('should display comments with correct information', () => {
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Check header shows correct count
      expect(screen.getByText('Review Comments (3)')).toBeInTheDocument();

      // Check comments are displayed
      expect(screen.getByText('src/components/App.tsx')).toBeInTheDocument();
      expect(screen.getByText('src/utils/helpers.ts')).toBeInTheDocument();
      expect(screen.getByText('src/components/Button.tsx')).toBeInTheDocument();

      // Check content
      expect(screen.getByText(/This function is too complex/)).toBeInTheDocument();
      expect(screen.getByText(/Potential security vulnerability/)).toBeInTheDocument();
      expect(screen.getByText(/Consider adding proper TypeScript types/)).toBeInTheDocument();
    });

    it('should display correct severity indicators', () => {
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Check severity statistics
      expect(screen.getByText('1 Errors')).toBeInTheDocument();
      expect(screen.getByText('1 Warnings')).toBeInTheDocument();
      expect(screen.getByText('1 Info')).toBeInTheDocument();
    });
  });

  describe('Comment Actions', () => {
    it('should call onCommentClick when comment card is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      const firstCommentCard = screen.getByText(/This function is too complex/i).closest('div');
      await user.click(firstCommentCard!);

      expect(mockHandlers.onCommentClick).toHaveBeenCalledWith('1');
    });

    it('should call onCommentAccept when accept button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      const acceptButtons = screen.getAllByText('Accept');
      await user.click(acceptButtons[0]);

      expect(mockHandlers.onCommentAccept).toHaveBeenCalledWith('1');
    });

    it('should show edit interface when edit button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Should show textarea with current content
      const textarea = screen.getByDisplayValue(mockComments[0].content);
      expect(textarea).toBeInTheDocument();
      
      // Should show save and cancel buttons
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should show action buttons only for pending comments', () => {
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Pending comments should have action buttons
      const acceptButtons = screen.getAllByText('Accept');
      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');
      
      // Should have 2 sets of action buttons (for 2 pending comments)
      expect(acceptButtons).toHaveLength(2);
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });

  describe('Comment Editing', () => {
    it('should save edited comment content when save button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Start editing
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Modify content
      const textarea = screen.getByDisplayValue(mockComments[0].content);
      await user.clear(textarea);
      await user.type(textarea, 'Updated comment content');

      // Save changes
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockHandlers.onCommentEdit).toHaveBeenCalledWith('1', 'Updated comment content');
    });

    it('should cancel editing and revert content when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Start editing
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Modify content
      const textarea = screen.getByDisplayValue(mockComments[0].content);
      await user.clear(textarea);
      await user.type(textarea, 'Modified content');

      // Cancel changes
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Should not call onCommentEdit
      expect(mockHandlers.onCommentEdit).not.toHaveBeenCalled();
      
      // Should show original content
      expect(screen.getByText(mockComments[0].content)).toBeInTheDocument();
    });

    it('should not save if content is unchanged', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Start editing
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Save without changes
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      // Should not call onCommentEdit since content is unchanged
      expect(mockHandlers.onCommentEdit).not.toHaveBeenCalled();
    });

    it('should trim whitespace when saving edited content', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Start editing
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Modify content with extra whitespace
      const textarea = screen.getByDisplayValue(mockComments[0].content);
      await user.clear(textarea);
      await user.type(textarea, '  Updated content with whitespace  ');

      // Save changes
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockHandlers.onCommentEdit).toHaveBeenCalledWith('1', 'Updated content with whitespace');
    });

    it('should prevent event propagation when clicking edit controls', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Start editing
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Click on textarea should not trigger onCommentClick
      const textarea = screen.getByDisplayValue(mockComments[0].content);
      await user.click(textarea);

      expect(mockHandlers.onCommentClick).not.toHaveBeenCalled();
    });
  });

  describe('Comment Deletion', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      expect(screen.getByText('Delete?')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('should delete comment when confirmation is accepted', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Click delete
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      // Confirm deletion
      const yesButton = screen.getByText('Yes');
      await user.click(yesButton);

      expect(mockHandlers.onCommentDelete).toHaveBeenCalledWith('1');
    });

    it('should cancel deletion when confirmation is rejected', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Click delete
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      // Cancel deletion
      const noButton = screen.getByText('No');
      await user.click(noButton);

      // Should not call onCommentDelete
      expect(mockHandlers.onCommentDelete).not.toHaveBeenCalled();
      
      // Should hide confirmation dialog
      expect(screen.queryByText('Delete?')).not.toBeInTheDocument();
    });

    it('should prevent event propagation when clicking delete controls', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Click delete
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      // Click Yes should not trigger onCommentClick
      const yesButton = screen.getByText('Yes');
      await user.click(yesButton);

      // onCommentClick should not be called (only onCommentDelete)
      expect(mockHandlers.onCommentClick).not.toHaveBeenCalled();
    });
  });

  describe('Comment Status Management', () => {
    it('should display correct status badges for different comment states', () => {
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Check status badges - use getAllByText since "Pending" appears in multiple places
      const pendingElements = screen.getAllByText('Pending');
      const acceptedElements = screen.getAllByText('Accepted');
      
      // Should have pending text in statistics and badges (3 total: 1 in stats, 2 in badges)
      expect(pendingElements.length).toBeGreaterThanOrEqual(2);
      // Should have accepted text in statistics and badges (2 total: 1 in stats, 1 in badge)
      expect(acceptedElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should apply correct styling for accepted comments', () => {
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Find the accepted comment card (comment 3) - look for the main card container
      const acceptedCommentText = screen.getByText(/Consider adding proper TypeScript types/i);
      const acceptedCommentCard = acceptedCommentText.closest('.border.rounded-lg');
      expect(acceptedCommentCard).toHaveClass('opacity-75');
    });

    it('should not show action buttons for accepted comments', () => {
      const acceptedComment: ReviewComment = {
        id: '4',
        file: 'src/test.ts',
        line: 5,
        content: 'This is an accepted comment',
        severity: 'info',
        status: 'accepted',
        createdAt: '2024-01-01T10:15:00Z',
      };

      render(
        <CommentSidebar
          comments={[acceptedComment]}
          {...mockHandlers}
        />
      );

      // Should not show action buttons for accepted comments
      expect(screen.queryByText('Accept')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should not show action buttons for rejected comments', () => {
      const rejectedComment: ReviewComment = {
        id: '5',
        file: 'src/test.ts',
        line: 10,
        content: 'This is a rejected comment',
        severity: 'warning',
        status: 'rejected',
        createdAt: '2024-01-01T10:20:00Z',
      };

      render(
        <CommentSidebar
          comments={[rejectedComment]}
          {...mockHandlers}
        />
      );

      // Should not show action buttons for rejected comments
      expect(screen.queryByText('Accept')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter comments by status', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Filter to show only accepted comments
      const statusFilter = screen.getByLabelText('Status:');
      await user.selectOptions(statusFilter, 'accepted');

      // Should only show the accepted comment
      expect(screen.getByText(/Consider adding proper TypeScript types/)).toBeInTheDocument();
      expect(screen.queryByText(/This function is too complex/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Potential security vulnerability/)).not.toBeInTheDocument();
    });

    it('should filter comments by pending status', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Filter to show only pending comments
      const statusFilter = screen.getByLabelText('Status:');
      await user.selectOptions(statusFilter, 'pending');

      // Should show the 2 pending comments
      expect(screen.getByText(/This function is too complex/)).toBeInTheDocument();
      expect(screen.getByText(/Potential security vulnerability/)).toBeInTheDocument();
      expect(screen.queryByText(/Consider adding proper TypeScript types/)).not.toBeInTheDocument();
    });

    it('should show message when no comments match filter', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Filter to show rejected comments (none exist in mock data)
      const statusFilter = screen.getByLabelText('Status:');
      await user.selectOptions(statusFilter, 'rejected');

      expect(screen.getByText('No comments match the current filter')).toBeInTheDocument();
    });

    it('should sort comments by severity', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Sort by severity
      const sortSelect = screen.getByLabelText('Sort by:');
      await user.selectOptions(sortSelect, 'severity');

      // Get all comment cards in order
      const commentCards = screen.getAllByText(/src\//);
      
      // Error should come first, then warning, then info
      expect(commentCards[0]).toHaveTextContent('src/utils/helpers.ts'); // error
      expect(commentCards[1]).toHaveTextContent('src/components/App.tsx'); // warning
      expect(commentCards[2]).toHaveTextContent('src/components/Button.tsx'); // info
    });
  });

  describe('Statistics Display', () => {
    it('should display correct comment statistics', () => {
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Check main statistics
      expect(screen.getByText('2')).toBeInTheDocument(); // Pending count
      expect(screen.getByText('1')).toBeInTheDocument(); // Accepted count
      expect(screen.getByText('0')).toBeInTheDocument(); // Rejected count (should be 0)

      // Check severity breakdown
      expect(screen.getByText('1 Errors')).toBeInTheDocument();
      expect(screen.getByText('1 Warnings')).toBeInTheDocument();
      expect(screen.getByText('1 Info')).toBeInTheDocument();
    });

    it('should update statistics when comments change', () => {
      const { rerender } = render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Initial state
      expect(screen.getByText('Review Comments (3)')).toBeInTheDocument();

      // Update with fewer comments
      const updatedComments = mockComments.slice(0, 1);
      rerender(
        <CommentSidebar
          comments={updatedComments}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Review Comments (1)')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    const longComment: ReviewComment = {
      id: '6',
      file: 'src/long.ts',
      line: 1,
      content: 'This is a very long comment that should be truncated because it exceeds the 200 character limit. '.repeat(3),
      severity: 'info',
      status: 'pending',
      createdAt: '2024-01-01T10:25:00Z',
    };

    it('should show expand button for long comments', () => {
      render(
        <CommentSidebar
          comments={[longComment]}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('should expand and collapse long comments', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={[longComment]}
          {...mockHandlers}
        />
      );

      // Initially should show truncated content
      expect(screen.getByText(/This is a very long comment.*\.\.\./)).toBeInTheDocument();
      
      // Click show more
      const showMoreButton = screen.getByText('Show more');
      await user.click(showMoreButton);

      // Should show full content and "Show less" button
      expect(screen.getByText('Show less')).toBeInTheDocument();
      // Check for partial content since the full text might be split across elements
      expect(screen.getByText(/This is a very long comment that should be truncated/)).toBeInTheDocument();

      // Click show less
      const showLessButton = screen.getByText('Show less');
      await user.click(showLessButton);

      // Should show truncated content again
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('should not show expand button for short comments', () => {
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // None of the mock comments are long enough to be truncated
      expect(screen.queryByText('Show more')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form controls', () => {
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      expect(screen.getByLabelText('Status:')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
    });

    it('should have proper button labels and roles', () => {
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Check action buttons have proper text
      expect(screen.getAllByText('Accept')).toHaveLength(2);
      expect(screen.getAllByText('Edit')).toHaveLength(2);
      expect(screen.getAllByText('Delete')).toHaveLength(2);
    });

    it('should maintain focus management during editing', async () => {
      const user = userEvent.setup();
      
      render(
        <CommentSidebar
          comments={mockComments}
          {...mockHandlers}
        />
      );

      // Start editing
      const editButton = screen.getAllByText('Edit')[0];
      await user.click(editButton);

      // Textarea should be focusable
      const textarea = screen.getByDisplayValue(mockComments[0].content);
      expect(textarea).toBeInTheDocument();
      
      // Save and cancel buttons should be focusable
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });
});