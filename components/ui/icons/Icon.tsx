import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
     size?: 'sm' | 'md' | 'lg' | number;
     className?: string;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
     ({ size = 'md', className = '', ...props }, ref) => {
          const sizeMap = {
               sm: 16,
               md: 24,
               lg: 32,
          };

          const pixelSize = typeof size === 'number' ? size : sizeMap[size];

          return (
               <svg
                    ref={ref}
                    width={pixelSize}
                    height={pixelSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                    {...props}
               />
          );
     }
);

Icon.displayName = 'Icon';
