import React from 'react';

/**
 * NotificationBar
 * Displays in-app notifications at the top or bottom of the page.
 *
 * Props:
 * - message: string (required)
 * - type: string ('info' | 'warning' | 'error' | 'success'), optional
 * - onClose: function() (optional, if the bar should be dismissible)
 * - duration: number (optional, ms to auto-dismiss; default: no auto-dismiss)
 */
export default function NotificationBar({ message, type = 'info', onClose, duration }) {
  React.useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  // Determine appropriate color based on notification type
  let color;
  switch (type) {
    case 'warning':
      color = '#f7b500';
      break;
    case 'error':
      color = '#e63946';
      break;
    case 'success':
      color = '#27ae60';
      break;
    default:
      color = '#2d87f0';
  }

  // Determine appropriate ARIA role based on notification type
  const getRole = () => {
    switch (type) {
      case 'error':
        return 'alert'; // For critical information that needs immediate attention
      case 'warning':
        return 'alertdialog'; // For important warnings that need attention
      default:
        return 'status'; // For general status updates
    }
  };

  // Determine appropriate aria-live value based on notification type
  const getAriaLive = () => {
    switch (type) {
      case 'error':
        return 'assertive'; // Interrupt the user for critical information
      default:
        return 'polite'; // Wait for user idle time for non-critical information
    }
  };

  // Get a descriptive label for the notification type
  const getTypeLabel = () => {
    switch (type) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'success':
        return 'Success';
      default:
        return 'Information';
    }
  };

  // Handle keyboard events for accessibility
  const handleKeyDown = (e) => {
    // Close notification on Escape key
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`notification-bar notification-${type}`}
      role={getRole()}
      aria-live={getAriaLive()}
      tabIndex={0} // Make focusable for keyboard navigation
      onKeyDown={handleKeyDown}
      style={{
        background: color,
        color: "#fff",
        padding: "1em",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <span className="notification-content">
        <span className="sr-only">{getTypeLabel()}: </span>
        {message}
      </span>
      {onClose && (
        <button 
          onClick={onClose} 
          aria-label={`Dismiss ${getTypeLabel().toLowerCase()} notification`}
          className="notification-dismiss"
          style={{
            background: 'transparent', 
            border: 0, 
            color: '#fff', 
            marginLeft: 12, 
            cursor: 'pointer', 
            fontSize: '1.5em',
            padding: '0.25em 0.5em',
            borderRadius: '4px'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
