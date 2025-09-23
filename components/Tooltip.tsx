import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tooltipClassName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className, tooltipClassName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const leaveTimeoutRef = useRef<number | null>(null);

  if (!content) {
    return <>{children}</>;
  }
  
  const clearTimeouts = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearTimeouts();
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, 300); // 300ms delay to show
  };

  const handleMouseLeave = () => {
    clearTimeouts();
    leaveTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 200); // 200ms delay to hide, allows moving to modal
  };
  
  return (
    <div
      className={`relative flex items-center justify-center ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[60] p-4 pointer-events-none animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col pointer-events-auto animate-fade-in-scale-up ${tooltipClassName || ''}`}
            onMouseEnter={handleMouseEnter} // Keep it open when mouse is over the modal
            onMouseLeave={handleMouseLeave}
          >
            <div className="p-6 overflow-y-auto custom-tooltip-scrollbar">
                {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;