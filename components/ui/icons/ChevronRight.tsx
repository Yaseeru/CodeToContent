import React from 'react';
import { Icon, IconProps } from './Icon';

export const ChevronRight = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <polyline points="9 18 15 12 9 6" />
               </Icon>
          );
     }
);

ChevronRight.displayName = 'ChevronRight';
