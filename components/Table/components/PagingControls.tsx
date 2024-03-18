import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';
import { Table } from '@tanstack/react-table';
import { Select } from './Select';
import { MouseEventHandler, ReactNode } from 'react';
import { useTranslation } from 'next-i18next';

interface Props<T> {
  table: Table<T>;
}

const PaginationButton = ({ onClick,
  disabled,
  icon }:
  {
    onClick: () => void,
    disabled: boolean,
    icon: ReactNode
  }) => {
  return (<button
    className="border rounded p-1 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300 
      dark:disabled:bg-gray-500 dark:disabled:text-gray-600 dark:disabled:border-gray-500"
    onClick={onClick}
    disabled={disabled}
  >
    {icon}
  </button>)
}

export const PagingControls = <T extends unknown>({
  table,
}: Props<T>) => {
  const { t } = useTranslation('admin');
  
  return (
    <>
      <PaginationButton
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
        icon={<IconChevronsLeft />}
      />
      <PaginationButton
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        icon={<IconChevronLeft />}
      />

      <span className="flex items-center gap-1">
        <strong>
          {table.getState().pagination.pageIndex + 1}
          /
          {table.getPageCount()}
        </strong>
      </span>

      <PaginationButton
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        icon={<IconChevronRight />}
      />

      <PaginationButton
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
        icon={<IconChevronsRight />}
      />

      | <Select
        value={table.getState().pagination.pageSize.toString()}
        onSelect={value => {
          table.setPageSize(Number(value))
        }}
        options={[10, 20, 30, 40, 50].map(pageSize => {
          return { value: pageSize.toString(), label: `${t('Show')} ${pageSize}` }
        })}
      />
    </>
  )
}