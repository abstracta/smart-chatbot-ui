import { FC, ReactNode } from 'react';

import {
  CloseSidebarButton,
  OpenSidebarButton,
} from './components/OpenCloseButton';

interface Props {
  isOpen: boolean;
  side: 'left' | 'right';
  children: ReactNode;
  toggleOpen: () => void;
}

const Sidebar: FC<Props> = ({
  isOpen,
  side,
  children,
  toggleOpen,
}) => {
  return isOpen ? (
    <div className="h-full">
      <div
        className={`fixed top-0 ${side}-0 z-40 flex h-full w-[260px] flex-col space-y-2 bg-[#202123] p-2 text-[14px] transition-all sm:relative sm:top-0`}
      >
          {children}
      </div>
      <CloseSidebarButton onClick={toggleOpen} side={side} />
    </div>
  ) : (
    <OpenSidebarButton onClick={toggleOpen} side={side} />
  );
};

export default Sidebar;
