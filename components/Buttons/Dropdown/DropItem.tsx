import { FC, ReactNode } from 'react';


type Props = {
    children?: ReactNode;
    onClick?: () => void;
};

export const DropdownItem: FC<Props> = ({
    children,
    onClick
}) => {
    return (
        <li className='flex px-4 py-2 hover:bg-gray-100 dark:hover:bg-black/10 dark:hover:text-white'
            onClick={onClick}
        >
            {children}
        </li>
    );
};
