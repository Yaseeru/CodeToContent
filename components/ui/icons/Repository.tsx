import React from 'react';
import { Icon, IconProps } from './Icon';

export const Repository = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    <path d="M8 14h8" />
                    <path d="M8 17h5" />
               </Icon>
          );
     }
);

Repository.displayName = 'Repository';
