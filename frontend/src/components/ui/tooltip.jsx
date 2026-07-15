import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

// Tooltip Provider – wraps the whole app for tooltip portal
export const TooltipProvider = TooltipPrimitive.Provider;

// Tooltip – wrapper for each tooltip instance
export const Tooltip = ({ children }) => (
  <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>
);

// TooltipTrigger – the element that triggers the tooltip
export const TooltipTrigger = ({ asChild = false, children }) => (
  <TooltipPrimitive.Trigger asChild={asChild}>{children}</TooltipPrimitive.Trigger>
);

// TooltipContent – the popup content
export const TooltipContent = ({ children, sideOffset = 4, className = '' }) => (
  <TooltipPrimitive.Content
    sideOffset={sideOffset}
    className={`rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white shadow-md ${className}`}
  >
    {children}
    <TooltipPrimitive.Arrow className="fill-gray-800" />
  </TooltipPrimitive.Content>
);

// Re-export for convenience
export default Tooltip;
