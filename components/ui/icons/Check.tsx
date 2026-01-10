import React from 'react';
import { Icon, IconProps } from './Icon';

export const Check = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <polyline points="20 6 9 17 4 12" />
               </Icon>
          );
     }
);

Check.displayName = 'Check';
