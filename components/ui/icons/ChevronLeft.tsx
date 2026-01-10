import React from 'react';
import { Icon, IconProps } from './Icon';

export const ChevronLeft = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <polyline points="15 18 9 12 15 6" />
               </Icon>
          );
     }
);

ChevronLeft.displayName = 'ChevronLeft';
