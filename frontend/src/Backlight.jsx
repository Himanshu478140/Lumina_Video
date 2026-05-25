import React from 'react';

export function Backlight({ children, blur = 40, className = '' }) {
  return (
    <div className={`backlight-wrapper ${className}`}>
      <div 
        className="backlight-glow"
        style={{ filter: `blur(${blur}px)` }}
      />
      <div className="backlight-content">
        {children}
      </div>
    </div>
  );
}
