import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBar from '../../components/NotificationBar';

describe('NotificationBar', () => {
  // Basic functionality tests
  it('renders message and handles close', () => {
    const onClose = jest.fn();
    render(<NotificationBar message="Low stock warning!" onClose={onClose} />);

    expect(screen.getByText(/low stock warning/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/dismiss/i));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows correct color for type', () => {
    const { rerender, container } = render(<NotificationBar message="Test" type="error" />);
    expect(container.firstChild).toHaveStyle('background: #e63946');

    rerender(<NotificationBar message="Success!" type="success" />);
    expect(container.firstChild).toHaveStyle('background: #27ae60');

    rerender(<NotificationBar message="Warning!" type="warning" />);
    expect(container.firstChild).toHaveStyle('background: #f7b500');

    rerender(<NotificationBar message="Info!" type="info" />);
    expect(container.firstChild).toHaveStyle('background: #2d87f0');
  });

  it('auto-dismisses after duration', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    render(<NotificationBar message="Will disappear" duration={1000} onClose={onClose} />);

    act(() => { jest.advanceTimersByTime(1000); });
    expect(onClose).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('does not render if message is empty', () => {
    render(<NotificationBar message="" />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  // Accessibility tests
  it('uses correct role based on notification type', () => {
    const { rerender } = render(<NotificationBar message="Error message" type="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<NotificationBar message="Warning message" type="warning" />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    rerender(<NotificationBar message="Info message" type="info" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<NotificationBar message="Success message" type="success" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses correct aria-live based on notification type', () => {
    const { rerender } = render(<NotificationBar message="Error message" type="error" />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');

    rerender(<NotificationBar message="Info message" type="info" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('includes screen reader text for notification type', () => {
    const { rerender } = render(<NotificationBar message="Error message" type="error" />);
    expect(screen.getByText('Error:')).toBeInTheDocument();

    rerender(<NotificationBar message="Warning message" type="warning" />);
    expect(screen.getByText('Warning:')).toBeInTheDocument();

    rerender(<NotificationBar message="Success message" type="success" />);
    expect(screen.getByText('Success:')).toBeInTheDocument();

    rerender(<NotificationBar message="Info message" type="info" />);
    expect(screen.getByText('Information:')).toBeInTheDocument();
  });

  it('has descriptive dismiss button label', () => {
    const { rerender } = render(<NotificationBar message="Error message" type="error" onClose={() => {}} />);
    expect(screen.getByLabelText('Dismiss error notification')).toBeInTheDocument();

    rerender(<NotificationBar message="Warning message" type="warning" onClose={() => {}} />);
    expect(screen.getByLabelText('Dismiss warning notification')).toBeInTheDocument();
  });

  // Keyboard navigation tests
  it('supports keyboard navigation to close notification', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<NotificationBar message="Test message" onClose={onClose} />);

    // Tab to the notification
    await user.tab();

    // Press Escape to close
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('can be closed by pressing Enter on the close button', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<NotificationBar message="Test message" onClose={onClose} />);

    // Tab to the close button
    await user.tab();
    await user.tab();

    // Press Enter to activate
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalled();
  });

  // Style and appearance tests
  it('applies correct CSS classes based on type', () => {
    const { rerender } = render(<NotificationBar message="Test" type="error" />);
    expect(screen.getByRole('alert')).toHaveClass('notification-bar');
    expect(screen.getByRole('alert')).toHaveClass('notification-error');

    rerender(<NotificationBar message="Test" type="success" />);
    expect(screen.getByRole('status')).toHaveClass('notification-success');
  });

  it('renders close button with accessible styling', () => {
    render(<NotificationBar message="Test" onClose={() => {}} />);

    const closeButton = screen.getByLabelText(/dismiss/i);
    expect(closeButton).toHaveClass('notification-dismiss');
    expect(closeButton).toHaveStyle('background: transparent');
    expect(closeButton).toHaveStyle('cursor: pointer');
  });
});
