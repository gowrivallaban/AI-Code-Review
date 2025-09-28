import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../notification';
import type { Notification } from '../notification';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockListener: vi.Mock;

  beforeEach(() => {
    notificationService = new NotificationService();
    mockListener = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('add', () => {
    it('should add a notification and notify listeners', () => {
      const unsubscribe = notificationService.subscribe(mockListener);

      const id = notificationService.add({
        type: 'success',
        title: 'Test Success',
        message: 'Test message',
      });

      expect(id).toMatch(/^notification-\d+$/);
      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          id,
          type: 'success',
          title: 'Test Success',
          message: 'Test message',
          duration: 5000,
        }),
      ]);

      unsubscribe();
    });

    it('should auto-remove notification after duration', () => {
      const unsubscribe = notificationService.subscribe(mockListener);

      const id = notificationService.add({
        type: 'info',
        title: 'Test Info',
        message: 'Test message',
        duration: 1000,
      });

      expect(notificationService.getAll()).toHaveLength(1);

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      expect(notificationService.getAll()).toHaveLength(0);
      expect(mockListener).toHaveBeenCalledTimes(2); // Once for add, once for remove

      unsubscribe();
    });

    it('should not auto-remove persistent notifications', () => {
      const unsubscribe = notificationService.subscribe(mockListener);

      notificationService.add({
        type: 'error',
        title: 'Test Error',
        message: 'Test message',
        duration: 0, // Persistent
      });

      expect(notificationService.getAll()).toHaveLength(1);

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      expect(notificationService.getAll()).toHaveLength(1);

      unsubscribe();
    });
  });

  describe('remove', () => {
    it('should remove notification by ID', () => {
      const unsubscribe = notificationService.subscribe(mockListener);

      const id = notificationService.add({
        type: 'warning',
        title: 'Test Warning',
        message: 'Test message',
      });

      expect(notificationService.getAll()).toHaveLength(1);

      notificationService.remove(id);

      expect(notificationService.getAll()).toHaveLength(0);
      expect(mockListener).toHaveBeenCalledTimes(2); // Once for add, once for remove

      unsubscribe();
    });

    it('should handle removing non-existent notification', () => {
      const unsubscribe = notificationService.subscribe(mockListener);

      notificationService.remove('non-existent-id');

      expect(notificationService.getAll()).toHaveLength(0);
      expect(mockListener).toHaveBeenCalledWith([]);

      unsubscribe();
    });
  });

  describe('clear', () => {
    it('should remove all notifications', () => {
      const unsubscribe = notificationService.subscribe(mockListener);

      notificationService.add({
        type: 'success',
        title: 'Test 1',
        message: 'Message 1',
      });

      notificationService.add({
        type: 'error',
        title: 'Test 2',
        message: 'Message 2',
      });

      expect(notificationService.getAll()).toHaveLength(2);

      notificationService.clear();

      expect(notificationService.getAll()).toHaveLength(0);
      expect(mockListener).toHaveBeenLastCalledWith([]);

      unsubscribe();
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should subscribe and unsubscribe listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = notificationService.subscribe(listener1);
      const unsubscribe2 = notificationService.subscribe(listener2);

      notificationService.add({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      unsubscribe1();

      notificationService.add({
        type: 'info',
        title: 'Test 2',
        message: 'Test message 2',
      });

      expect(listener1).toHaveBeenCalledTimes(1); // Not called again
      expect(listener2).toHaveBeenCalledTimes(2); // Called again

      unsubscribe2();
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      notificationService.subscribe(mockListener);
    });

    it('should create success notification', () => {
      const id = notificationService.success('Success Title', 'Success message');

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          id,
          type: 'success',
          title: 'Success Title',
          message: 'Success message',
          duration: 5000,
        }),
      ]);
    });

    it('should create error notification (persistent)', () => {
      const id = notificationService.error('Error Title', 'Error message');

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          id,
          type: 'error',
          title: 'Error Title',
          message: 'Error message',
          duration: 0, // Persistent
        }),
      ]);
    });

    it('should create warning notification (longer duration)', () => {
      const id = notificationService.warning('Warning Title', 'Warning message');

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          id,
          type: 'warning',
          title: 'Warning Title',
          message: 'Warning message',
          duration: 8000, // Longer duration
        }),
      ]);
    });

    it('should create info notification', () => {
      const id = notificationService.info('Info Title', 'Info message');

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          id,
          type: 'info',
          title: 'Info Title',
          message: 'Info message',
          duration: 5000,
        }),
      ]);
    });
  });

  describe('specialized notifications', () => {
    beforeEach(() => {
      notificationService.subscribe(mockListener);
    });

    it('should create export success notification', () => {
      const id = notificationService.exportSuccess('markdown', 'review.md');

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'success',
          title: 'Export Successful',
          message: 'Review exported as MARKDOWN format: review.md',
        }),
      ]);
    });

    it('should create export error notification with retry action', () => {
      const id = notificationService.exportError('json', 'Network error');

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'error',
          title: 'Export Failed',
          message: 'Failed to export review as JSON: Network error',
          actions: [
            expect.objectContaining({
              label: 'Retry',
              style: 'primary',
            }),
          ],
        }),
      ]);
    });

    it('should create submission success notification', () => {
      const id = notificationService.submissionSuccess(5, 123);

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'success',
          title: 'Review Submitted',
          message: 'Successfully submitted 5 comments to PR #123',
        }),
      ]);
    });

    it('should create submission error notification with fallback', () => {
      const id = notificationService.submissionError('API rate limit exceeded', true);

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'error',
          title: 'Submission Failed',
          message: 'Failed to submit review to GitHub: API rate limit exceeded',
          actions: [
            expect.objectContaining({
              label: 'Export Instead',
              style: 'secondary',
            }),
            expect.objectContaining({
              label: 'Retry',
              style: 'primary',
            }),
          ],
        }),
      ]);
    });

    it('should create submission error notification without fallback', () => {
      const id = notificationService.submissionError('Authentication failed', false);

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'error',
          title: 'Submission Failed',
          message: 'Failed to submit review to GitHub: Authentication failed',
          actions: [
            expect.objectContaining({
              label: 'Retry',
              style: 'primary',
            }),
          ],
        }),
      ]);
    });

    it('should create copy success notification', () => {
      const id = notificationService.copySuccess();

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'success',
          title: 'Copied to Clipboard',
          message: 'Review content has been copied to your clipboard',
        }),
      ]);
    });

    it('should create copy error notification', () => {
      const id = notificationService.copyError();

      expect(mockListener).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'error',
          title: 'Copy Failed',
          message: 'Failed to copy content to clipboard. Please try selecting and copying manually.',
        }),
      ]);
    });
  });
});