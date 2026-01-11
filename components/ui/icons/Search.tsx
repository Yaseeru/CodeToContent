import { Icon, IconProps } from './Icon';

export function Search(props: Omit<IconProps, 'children'>) {
     return (
          <Icon {...props}>
               <circle cx="11" cy="11" r="8" />
               <path d="m21 21-4.35-4.35" />
          </Icon>
     );
}
