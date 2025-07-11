'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

type TooltipState = {
  text: string;
  x: number;
  y: number;
  id: string;
};

type TooltipOptions = {
  delay?: number;
  offset?: number;
};

export function useTooltip(options: TooltipOptions = {}) {
  const { delay = 150, offset = 8 } = options;
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const showTooltip = (text: string, element: HTMLElement, id?: string) => {
    // Clear any existing timeout to prevent hiding the new tooltip
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const rect = element.getBoundingClientRect();
    const tooltipId = id || `tooltip-${Date.now()}`;

    setTooltip({
      text,
      x: rect.right + offset,
      y: rect.top + rect.height / 2,
      id: tooltipId,
    });

    return tooltipId;
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setTooltip(null);
      timeoutRef.current = null;
    }, delay);
  };

  const TooltipPortal =
    tooltip && typeof window !== 'undefined'
      ? createPortal(
          <div
            id={tooltip.id}
            role="tooltip"
            aria-hidden="false"
            className="fixed px-3 py-2 bg-white rounded-lg shadow-2xl z-[9999] whitespace-nowrap pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translateY(-50%)',
            }}
          >
            <div className="text-sm font-medium text-gray-900">{tooltip.text}</div>
          </div>,
          document.body,
        )
      : null;

  return {
    showTooltip,
    hideTooltip,
    TooltipPortal,
    tooltipId: tooltip?.id,
  };
}

// Optional: Tooltip wrapper component for declarative usage
type TooltipProps = {
  content: string;
  children: ReactNode;
  disabled?: boolean;
  delay?: number;
  offset?: number;
};

export function Tooltip({ content, children, disabled = false, delay, offset }: TooltipProps) {
  const { showTooltip, hideTooltip, TooltipPortal } = useTooltip({ delay, offset });

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      showTooltip(content, e.currentTarget);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      hideTooltip();
    }
  };

  return (
    <>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ display: 'contents' }}>
        {children}
      </div>
      {TooltipPortal}
    </>
  );
}
