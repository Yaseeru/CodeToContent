import React from 'react';
import { Icon, IconProps } from './Icon';

export const Moon = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
               </Icon>
          );
     }
);

Moon.displayName = 'Moon';
