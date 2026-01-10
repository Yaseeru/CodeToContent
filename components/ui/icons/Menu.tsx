import React from 'react';
import { Icon, IconProps } from './Icon';

export const Menu = React.forwardRef<SVGSVGElement, IconProps>(
     (props, ref) => {
          return (
               <Icon ref={ref} {...props}>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
               </Icon>
          );
     }
);

Menu.displayName = 'Menu';
