import React from 'react';
import { Icon, IconProps } from './Icon';

export const Code = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
               </Icon>
          );
     }
);

Code.displayName = 'Code';
