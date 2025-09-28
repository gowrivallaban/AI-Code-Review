import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationContainer } from '../NotificationContainer';
import { notificationService } from '../../services';
import type { Notification } from '../../services/notification';

// Mock the notification service
vi.mock('../../services', () => ({
  notificationService: {
    subscribe: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('NotificationContainer', () => {
  let mockUnsubscribe: vi.Mock;
  let mockSubscribeCallback: (notifications: Notification[]) => void;

  beforeEach(() => {
    mockUnsubscribe = vi.fn();
    vi.mocked(notificationService.subscribe).mockImplementation((callback) => {
      mockSubscribeCallback = callback;
      return mockUnsubscribe;
    });
    vi.clearAllMocks();
  });

  it('should render nothing when no notifications', () => {
    render(<NotificationContainer />);
    
    // Simulate empty notifications
    mockSubscribeCallback([]);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should subscribe to notification service on mount', () => {
    render(<NotificationContainer />);
    
    expect(notificationService.subscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = render(<NotificationContainer />);
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should render success notification', () => {
    render(<NotificationContainer />);
    
    const notification: Notification = {
      id: '1',
      type: 'success',
      title: 'Success Title',
      message: 'Success message',
      duration: 5000,
    };
    
    mockSubscribeCallback([notification]);
    
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('should render error notification', () => {
    render(<NotificationContainer />);
    
    const notification: Notification = {
      id: '2',
      type: 'error',
      title: 'Error Title',
      message: 'Error message',
      duration: 0,
    };
    
    mockSubscribeCallback([notification]);
    
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should render warning notification', () => {
    render(<NotificationContainer />);
    
    const notification: Notification = {
      id: '3',
      type: 'warning',
      title: 'Warning Title',
      message: 'Warning message',
      duration: 8000,
    };
    
    mockSubscribeCallback([notification]);
    
    expect(screen.getByText('Warning Title')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should render info notification', () => {
    render(<NotificationContainer />);
    
    const notification: Notification = {
      id: '4',
      type: 'info',
      title: 'Info Title',
      message: 'Info message',
      duration: 5000,
    };
    
    mockSubscribeCallback([notification]);
    
    expect(screen.getByText('Info Title')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should render notification with actions', () => {
    render(<NotificationContainer />);
    
    const mockAction = vi.fn();
    const notification: Notification = {
      id: '5',
      type: 'error',
      title: 'Error with Actions',
      message: 'Error message',
      duration: 0,
      actions: [
        {
          label: 'Retry',
          action: mockAction,
          style: 'primary',
        },
        {
          label: 'Cancel',
          action: vi.fn(),
          style: 'secondary',
        },
      ],
    };
    
    mockSubscribeCallback([notification]);
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    
    // Click retry action
    fireEvent.click(screen.getByText('Retry'));
    
    expect(mockAction).toHaveBeenCalled();
    expect(notificationService.remove).toHaveBeenCalledWith('5');
  });

  it('should remove notification when close button is clicked', () => {
    render(<NotificationContainer />);
    
    const notification: Notification = {
      id: '6',
      type: 'info',
      title: 'Info Title',
      message: 'Info message',
      duration: 5000,
    };
    
    mockSubscribeCallback([notification]);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(notificationService.remove).toHaveBeenCalledWith('6');
  });

  it('should render multiple notifications', () => {
    render(<NotificationContainer />);
    
    const notifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Success',
        message: 'Success message',
        duration: 5000,
      },
      {
        id: '2',
        type: 'error',
        title: 'Error',
        message: 'Error message',
        duration: 0,
      },
      {
        id: '3',
        type: 'warning',
        title: 'Warning',
        message: 'Warning message',
        duration: 8000,
      },
    ];
    
    mockSubscribeCallback(notifications);
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('should update when notifications change', () => {
    render(<NotificationContainer />);
    
    // Initial notification
    const notification1: Notification = {
      id: '1',
      type: 'info',
      title: 'First Notification',
      message: 'First message',
      duration: 5000,
    };
    
    mockSubscribeCallback([notification1]);
    expect(screen.getByText('First Notification')).toBeInTheDocument();
    
    // Add second notification
    const notification2: Notification = {
      id: '2',
      type: 'success',
      title: 'Second Notification',
      message: 'Second message',
      duration: 5000,
    };
    
    mockSubscribeCallback([notification1, notification2]);
    expect(screen.getByText('First Notification')).toBeInTheDocument();
    expect(screen.getByText('Second Notification')).toBeInTheDocument();
    
    // Remove first notification
    mockSubscribeCallback([notification2]);
    expect(screen.queryByText('First Notification')).not.toBeInTheDocument();
    expect(screen.getByText('Second Notification')).toBeInTheDocument();
  });

  it('should apply correct styling for different notification types', () => {
    render(<NotificationContainer />);
    
    const successNotification: Notification = {
      id: '1',
      type: 'success',
      title: 'Success',
      message: 'Success message',
      duration: 5000,
    };
    
    mockSubscribeCallback([successNotification]);
    
    const notificationElement = screen.getByText('Success').closest('div');
    expect(notificationElement).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('should apply correct button styling for different action styles', () => {
    render(<NotificationContainer />);
    
    const notification: Notification = {
      id: '1',
      type: 'error',
      title: 'Error',
      message: 'Error message',
      duration: 0,
      actions: [
        {
          label: 'Primary Action',
          action: vi.fn(),
          style: 'primary',
        },
        {
          label: 'Danger Action',
          action: vi.fn(),
          style: 'danger',
        },
        {
          label: 'Secondary Action',
          action: vi.fn(),
          style: 'secondary',
        },
      ],
    };
    
    mockSubscribeCallback([notification]);
    
    const primaryButton = screen.getByText('Primary Action');
    const dangerButton = screen.getByText('Danger Action');
    const secondaryButton = screen.getByText('Secondary Action');
    
    expect(primaryButton).toHaveClass('bg-blue-600', 'text-white');
    expect(dangerButton).toHaveClass('bg-red-600', 'text-white');
    expect(secondaryButton).toHaveClass('bg-gray-100', 'text-gray-700');
  });
});