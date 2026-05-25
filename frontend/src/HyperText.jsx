import React from 'react';

/**
 * HyperText - Pass-through wrapper (Animation Removed)
 */
export function HyperText({ children, text }) {
  return <>{text || children}</>;
}

export function HyperTextDemo() {
  return <HyperText>Hover Me!</HyperText>;
}
