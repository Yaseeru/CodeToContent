import React from 'react';
import { Icon, IconProps } from './Icon';

export const Settings = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" />
               </Icon>
          );
     }
);

Settings.displayName = 'Settings';
