import React from 'react';
import { Icon, IconProps } from './Icon';

export const User = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
               </Icon>
          );
     }
);

User.displayName = 'User';
