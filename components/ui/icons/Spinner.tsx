import React from 'react';
import { Icon, IconProps } from './Icon';

export const Spinner = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} className={`animate-spin ${props.className || ''}`} {...props}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
               </Icon>
          );
     }
);

Spinner.displayName = 'Spinner';
