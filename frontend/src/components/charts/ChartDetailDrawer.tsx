import React from 'react';

/**
 * ChartDetailDrawer
 *
 * Slide-out drawer for displaying detailed information when chart elements are clicked.
 * Features retro styling and smooth animations.
 *
 * @example
 * <ChartDetailDrawer
 *   isOpen={drawerOpen}
 *   onClose={() => setDrawerOpen(false)}
 *   title="March 2024 Details"
 *   data={selectedMonthData}
 * />
 */

interface ChartDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

const ChartDetailDrawer: React.FC<ChartDetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 400,
}) => {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-backdrop animate-fade-in"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(51, 0, 102, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 'var(--z-overlay, 500)',
          cursor: 'pointer',
        }}
      />

      {/* Drawer */}
      <div
        className="drawer-container animate-slide-in-right"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${width}px`,
          maxWidth: '90vw',
          background: 'white',
          border: '4px ridge var(--primary-color, #9966ff)',
          borderRight: 'none',
          boxShadow: 'var(--shadow-retro-lg), -10px 0 30px rgba(0, 0, 0, 0.3)',
          zIndex: 'var(--z-overlay, 500)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-lg, 1.5rem)',
            background: 'var(--gradient-primary, linear-gradient(135deg, #9966ff 0%, #7744dd 100%))',
            borderBottom: '3px ridge var(--accent-color, #ffcc00)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.5rem',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost press-feedback"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px outset rgba(255, 255, 255, 0.5)',
              color: 'white',
              fontSize: '1.25rem',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md, 8px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast, 150ms)',
            }}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-lg, 1.5rem)',
            background: 'linear-gradient(135deg, #ffffdd 0%, #ffeeee 50%, #eeffff 100%)',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default ChartDetailDrawer;
