import Link from 'next/link';
import { FC } from 'react';

interface Props {
  text: string;
  icon: JSX.Element;
  href: string;
}

export const SidebarButtonLink: FC<Props> = ({ text, icon, href }) => {
  return (
    <Link className="flex w-full cursor-pointer select-none items-center gap-3 rounded-md py-3 px-3 text-[14px] leading-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
      href={href}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
};
