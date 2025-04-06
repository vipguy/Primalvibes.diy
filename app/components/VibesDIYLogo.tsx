import React from 'react';

interface VibesDIYLogoProps extends React.HTMLAttributes<HTMLSpanElement> {}

const VibesDIYLogo: React.FC<VibesDIYLogoProps> = ({ className, ...props }) => {
  return (
    <span className={`inline-block ${className || ''}`} {...props}>
      Vibes{' '}
      <sub style={{ display: 'inline-block', transform: 'rotate(-8deg)' }}>
        <strong>DIY</strong>
      </sub>
    </span>
  );
};

export default VibesDIYLogo;
