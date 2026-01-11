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
                    viewBox="0 0 32 32"
                    fill="none"
                    className={className}
                    {...props}
               >
                    {/* Minimal line-based logo design: C2C (CodeToContent) */}
                    {/* Left C */}
                    <path
                         d="M 10 8 A 6 6 0 0 0 10 24"
                         stroke="currentColor"
                         strokeWidth="2"
                         strokeLinecap="round"
                    />
                    {/* Center 2 */}
                    <path
                         d="M 14 20 L 18 20 A 4 4 0 0 0 18 12 L 14 12"
                         stroke="currentColor"
                         strokeWidth="2"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                    />
                    {/* Right C */}
                    <path
                         d="M 28 8 A 6 6 0 0 0 28 24"
                         stroke="currentColor"
                         strokeWidth="2"
                         strokeLinecap="round"
                    />
               </svg>
          );
     }
);

Logo.displayName = 'Logo';
