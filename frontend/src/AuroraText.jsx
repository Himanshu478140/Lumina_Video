import React from 'react';

export function AuroraText({ children, className = '' }) {
  return (
    <span className={`aurora-text ${className}`}>
      {children}
    </span>
  );
}
