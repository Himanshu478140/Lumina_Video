import React, { useMemo } from 'react';

export function Particles({ className = '', quantity = 25, color = '#5b5bd6' }) {
  // Generate random particles once on mount
  const particles = useMemo(() => {
    return Array.from({ length: quantity }).map((_, i) => {
      const size = Math.random() * 3 + 2; // 2px to 5px
      const left = Math.random() * 100; // 0% to 100%
      const top = Math.random() * 100;
      
      // Randomize animation timings
      const duration = Math.random() * 20 + 15; // 15s to 35s
      const delay = Math.random() * 10; // Start mid-animation
      
      // Randomize drift distance
      const tx = (Math.random() - 0.5) * 200; // Drift horizontally by +/- 100px
      const ty = (Math.random() - 0.5) * 200; // Drift vertically by +/- 100px

      return {
        id: i,
        size,
        left: `${left}%`,
        top: `${top}%`,
        animationDuration: `${duration}s`,
        animationDelay: `-${delay}s`,
        tx: `${tx}px`,
        ty: `${ty}px`,
      };
    });
  }, [quantity]);

  return (
    <div 
      className={`css-particles-container ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      {particles.map(p => (
        <div
          key={p.id}
          className="css-particle"
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            backgroundColor: color,
            borderRadius: '50%',
            opacity: 0.6,
            animation: `float-particle ${p.animationDuration} linear infinite alternate`,
            animationDelay: p.animationDelay,
            '--tx': p.tx,
            '--ty': p.ty,
            willChange: 'transform' // Tell the GPU to hardware-accelerate this element
          }}
        />
      ))}
    </div>
  );
}
