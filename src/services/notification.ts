export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 for persistent
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export type NotificationListener = (notifications: Notification[]) => void;

export class NotificationService {
  private notifications: Notification[] = [];
  private listeners: NotificationListener[] = [];
  private nextId = 1;

  /**
   * Add a new notification
   */
  add(notification: Omit<Notification, 'id'>): string {
    const id = `notification-${this.nextId++}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    this.notifications.push(newNotification);
    this.notifyListeners();

    // Auto-remove after duration (if not persistent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newNotification.duration);
    }

    return id;
  }

  /**
   * Remove a notification by ID
   */
  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  /**
   * Get all current notifications
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Convenience methods for common notification types
   */
  success(title: string, message: string, actions?: NotificationAction[]): string {
    return this.add({
      type: 'success',
      title,
      message,
      actions,
    });
  }

  error(title: string, message: string, actions?: NotificationAction[]): string {
    return this.add({
      type: 'error',
      title,
      message,
      duration: 0, // Persistent for errors
      actions,
    });
  }

  warning(title: string, message: string, actions?: NotificationAction[]): string {
    return this.add({
      type: 'warning',
      title,
      message,
      duration: 8000, // Longer duration for warnings
      actions,
    });
  }

  info(title: string, message: string, actions?: NotificationAction[]): string {
    return this.add({
      type: 'info',
      title,
      message,
      actions,
    });
  }

  /**
   * Specialized notifications for export/submission scenarios
   */
  exportSuccess(format: string, filename: string): string {
    return this.success(
      'Export Successful',
      `Review exported as ${format.toUpperCase()} format: ${filename}`
    );
  }

  exportError(format: string, error: string): string {
    return this.error(
      'Export Failed',
      `Failed to export review as ${format.toUpperCase()}: ${error}`,
      [{
        label: 'Retry',
        action: () => {
          // This will be handled by the component
        },
        style: 'primary',
      }]
    );
  }

  submissionSuccess(commentCount: number, prNumber: number): string {
    return this.success(
      'Review Submitted',
      `Successfully submitted ${commentCount} comments to PR #${prNumber}`
    );
  }

  submissionError(error: string, fallbackAvailable: boolean = true): string {
    const actions: NotificationAction[] = [];
    
    if (fallbackAvailable) {
      actions.push({
        label: 'Export Instead',
        action: () => {
          // This will be handled by the component
        },
        style: 'secondary',
      });
    }
    
    actions.push({
      label: 'Retry',
      action: () => {
        // This will be handled by the component
      },
      style: 'primary',
    });

    return this.error(
      'Submission Failed',
      `Failed to submit review to GitHub: ${error}`,
      actions
    );
  }

  copySuccess(): string {
    return this.success(
      'Copied to Clipboard',
      'Review content has been copied to your clipboard'
    );
  }

  copyError(): string {
    return this.error(
      'Copy Failed',
      'Failed to copy content to clipboard. Please try selecting and copying manually.'
    );
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener([...this.notifications]);
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();