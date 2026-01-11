import React from 'react';

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
     size?: 'sm' | 'md' | 'lg' | number;
     className?: string;
}

export const Logo = React.forwardRef<SVGSVGElement, LogoProps>(
     ({ size = 'md', className = '', ...props }, ref) => {
          const sizeMap = {
               sm: 24,
               md: 32,
               lg: 48,
          };

          const pixelSize = typeof size === 'number' ? size : sizeMap[size];

          return (
               <svg
                    ref={ref}
                    width={pixelSize}
                    height={pixelSize}
                    viewBox="0 0 200 200"
                    fill="none"
                    className={className}
                    {...props}
               >
                    {/* Chevron/Arrow logo design - flat color, no gradients */}
                    {/* Left chevron */}
                    <path
                         d="M 40 50 L 90 100 L 40 150 L 40 120 L 65 100 L 40 80 Z"
                         fill="currentColor"
                         className="text-text-primary"
                    />

                    {/* Right rounded shape */}
                    <path
                         d="M 100 50 L 160 50 Q 180 50 180 70 L 180 130 Q 180 150 160 150 L 100 150 L 100 120 L 150 120 Q 155 120 155 115 L 155 85 Q 155 80 150 80 L 100 80 Z"
                         fill="currentColor"
                         className="text-text-primary"
                    />
               </svg>
          );
     }
);

Logo.displayName = 'Logo';
