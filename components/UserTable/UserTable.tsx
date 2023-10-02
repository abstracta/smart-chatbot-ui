import * as React from 'react'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { User, UserRole } from '@/types/user'
import { Select } from './components/Select'
import { FC, useContext } from 'react'
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconDots, IconGripVertical, IconSortAscending, IconSortDescending, IconX } from '@tabler/icons-react'
import { InputNumber } from './components/InputNumber'
import UsersContext from '@/pages/admin/users/users.context'
import { PagingControls } from './components/PagingControls'
import { useTranslation } from 'react-i18next'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateRow: (rowIndex: number, columnId: string, value: User) => void
  }
}

function useSkipper() {
  const shouldSkipRef = React.useRef(true)
  const shouldSkip = shouldSkipRef.current

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = React.useCallback(() => {
    shouldSkipRef.current = false
  }, [])

  React.useEffect(() => {
    shouldSkipRef.current = true
  })

  return [shouldSkip, skip] as const
}

interface Props {
  data: User[];
  updateUser(updatedUser: User): Promise<void>;
}

export const UserTable: FC<Props> = ({ data, updateUser }) => {
  const { t } = useTranslation('admin');

  const { state: {
    defaultUserLimitUSD, canUpdateUserQuotas
  } } = useContext(UsersContext);

  const columnHelper = createColumnHelper<User>()
  const columns = [
    columnHelper.accessor('name', {
      header: t('Name') as string,
    }),
    columnHelper.accessor('email', {
      header: t('Email') as string,
    }),
    columnHelper.accessor('role', {
      header: t('Role') as string,
      cell: ({ getValue, row, column, table }) => {
        const value = getValue();
        return (
          <div title={value && value.charAt(0).toUpperCase() + value.slice(1)}>
            <Select
              onSelect={(role: UserRole) => {
                table.options.meta?.updateRow(row.index, column.id, { ...row.original, role })
              }}
              value={value}
              options={Object.values(UserRole).map((role) => {
                return {
                  label: t(role.charAt(0).toUpperCase() + role.slice(1)) as string,
                  value: role
                }
              })}
            />
          </div>
        )
      }
    }),
    ...(canUpdateUserQuotas ? [columnHelper.accessor('monthlyUSDConsumptionLimit', {
      header: t('Monthly budget (USD)') as string,
      cell: ({ getValue, row, column, table }) => {
        const value = getValue();
        return (
          <div className="flex items-center" title={value && value >= 0 ? value.toString() : `Default${defaultUserLimitUSD ? ` (${defaultUserLimitUSD})` : ''}`}>
            <InputNumber
              initialValue={value && value >= 0 ? value : undefined}
              placeholder={`Default${defaultUserLimitUSD ? ` (${defaultUserLimitUSD})` : ''}`}
              onChange={(value) => table.options.meta?.updateRow(row.index, column.id, { ...row.original, monthlyUSDConsumptionLimit: value })}
            />
            {(value && value >= 0) ? <IconX
              className='text-red-400 cursor-pointer'
              size="18"
              onClick={() => table.options.meta?.updateRow(row.index, column.id, { ...row.original, monthlyUSDConsumptionLimit: -1 })}
            /> : ''}
          </div>
        )
      },
      sortingFn: (rowA, rowB, columnId) => {
        const rowAValue: number | undefined = rowA.getValue(columnId);
        const rowBValue: number | undefined = rowB.getValue(columnId);
        const valueA = rowAValue && rowAValue >= 0 ? rowAValue : defaultUserLimitUSD;
        const valueB = rowBValue && rowBValue >= 0 ? rowBValue : defaultUserLimitUSD;
        if (valueA == undefined || valueB == undefined)
          return valueA == undefined ? -1 : 1;
        else if (valueA == valueB) return 0
        else return valueA > valueB ? 1 : -1;
      },
      sortUndefined: false
    })] : [])
  ]

  const [sorting, setSorting] = React.useState<SortingState>([
    {
      "id": "name",
      "desc": false
    }
  ])
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper()

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    meta: {
      updateRow: async (rowIndex, columnId, value) => {
        // Skip page index reset until after next rerender
        skipAutoResetPageIndex()
        await updateUser(value);
      },
    },
    debugTable: true,
  })

  return (
    <div className='w-full overflow-x-auto'>
      <div className="min-w-[600px] w-full max-w-[1400px] py-2">
        <div className="h-2" />
        <div className="border rounded-lg overflow-hidden dark:border-gray-400">
          <table className="table-fixed border-collapse w-full divide-y divide-gray-200 dark:divide-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-700">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <th className="group text-left" key={header.id} colSpan={header.colSpan}
                        style={{ position: 'relative', width: header.getSize() }}>
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              className: `${header.column.getCanSort()
                                ? 'cursor-pointer select-none'
                                : ''} flex items-stretch`,
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            <span className="flex gap-2 items-center px-4 py-2">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: <IconSortAscending size={18} />,
                                desc: <IconSortDescending size={18} />,
                              }[header.column.getIsSorted() as string] ?? null}
                            </span>
                            {header.column.getCanResize() && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={`flex items-center w-[15px] rounded bg-gray-200 dark:bg-gray-800 self-stretch ml-auto mr-0 cursor-col-resize opacity-0 group-hover:opacity-100 transition
                              ${header.column.getIsResizing() ? 'opacity-100 bg-gray-300 dark:bg-gray-600' : ''}`}
                              >
                                <IconGripVertical size={16} />
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-400">
              {table
                .getRowModel()
                .rows
                .map(row => {
                  return (
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-50/10" key={row.id}>
                      {row.getVisibleCells().map(cell => {
                        return (
                          <td className="px-4 py-2 overflow-hidden text-ellipsis" key={cell.id}
                            style={{ width: cell.column.getSize() }}
                            title={cell.getValue()?.toString()}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        <div className="h-4" />
        <div className="flex justify-center items-center gap-2 w-full">
          <PagingControls table={table} />
        </div>
      </div>
    </div>
  )
}

export default UserTable;
