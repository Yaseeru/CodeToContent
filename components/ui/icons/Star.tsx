import React from 'react';
import { Icon, IconProps } from './Icon';

export const Star = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
               </Icon>
          );
     }
);

Star.displayName = 'Star';
