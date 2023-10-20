import { IconFolderPlus, IconMistOff, IconPlus } from '@tabler/icons-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Search from '../Search';
import SidebarBase from '../Sidebar';

interface Props<T> {
  isOpen: boolean;
  addItemButtonTitle: string;
  side: 'left' | 'right';
  items: T[];
  itemComponent: ReactNode;
  folderComponent: ReactNode;
  footerComponent?: ReactNode;
  searchTerm: string;
  searchPlaceholder: string;
  noItemsPlaceholder: string;
  showSearch: boolean;
  handleSearchTerm: (searchTerm: string) => void;
  toggleOpen: () => void;
  handleCreateItem: () => void;
  handleCreateFolder: () => void;
  handleDrop: (e: any) => void;
}

const Sidebar = <T,>({
  isOpen,
  addItemButtonTitle,
  side,
  items,
  itemComponent,
  folderComponent,
  footerComponent,
  searchTerm,
  searchPlaceholder,
  noItemsPlaceholder,
  showSearch,
  handleSearchTerm,
  toggleOpen,
  handleCreateItem,
  handleCreateFolder,
  handleDrop,
}: Props<T>) => {
  const { t } = useTranslation('sidebar');

  const allowDrop = (e: any) => {
    e.preventDefault();
  };

  const highlightDrop = (e: any) => {
    e.target.style.background = '#343541';
  };

  const removeHighlight = (e: any) => {
    e.target.style.background = 'none';
  };

  return (<SidebarBase
    isOpen={isOpen}
    side={side}
    toggleOpen={toggleOpen}
  >
    <div className="flex items-center">
      <button
        className="text-sidebar flex w-[190px] flex-shrink-0 cursor-pointer select-none items-center gap-3 rounded-md border border-white/20 p-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
        onClick={() => {
          handleCreateItem();
          handleSearchTerm('');
        }}
      >
        <IconPlus size={16} />
        {addItemButtonTitle}
      </button>

      <button
        className="ml-2 flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-md border border-white/20 p-3 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10"
        onClick={handleCreateFolder}
      >
        <IconFolderPlus size={16} />
      </button>
    </div>
    {
      showSearch && (
        <Search
          placeholder={searchPlaceholder || ''}
          searchTerm={searchTerm}
          onSearch={handleSearchTerm}
        />
      )
    }
    <div className="flex-grow overflow-auto">
      <div className="flex border-b border-white/20 pb-2">
        {folderComponent}
      </div>

      {items?.length > 0 ? (
        <div
          className="pt-2"
          onDrop={handleDrop}
          onDragOver={allowDrop}
          onDragEnter={highlightDrop}
          onDragLeave={removeHighlight}
        >
          {itemComponent}
        </div>
      ) : (
        <div className="mt-8 select-none text-center text-white opacity-50">
          <IconMistOff className="mx-auto mb-3" />
          <span className="text-[14px] leading-normal">
            {noItemsPlaceholder}
          </span>
        </div>
      )}
    </div>
    {footerComponent}
  </SidebarBase>)
};

export default Sidebar;
