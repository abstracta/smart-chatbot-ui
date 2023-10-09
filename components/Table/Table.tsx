import * as React from 'react'
import {
  ColumnDef,
  ColumnSort,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { IconGripVertical, IconSortAscending, IconSortDescending } from '@tabler/icons-react'
import { PagingControls } from './components/PagingControls'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateRow: (rowIndex: number, columnId: string, value: TData) => void
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

interface Props<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  updateRow?(updatedRow: T): Promise<void>;
  initialSorting?: ColumnSort[];
}

export const Table = <T,>({ columns, data, initialSorting, updateRow }: Props<T>) => {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting || [])
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper()

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    autoResetExpanded: false,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    autoResetAll: false,
    meta: {
      updateRow: async (rowIndex, columnId, value) => {
        // Skip page index reset until after next rerender
        skipAutoResetPageIndex()
        if (updateRow) await updateRow(value);
      },
    },
    debugTable: true,
  })

  return (
    <div className='w-full overflow-x-auto'>
      <div className="h-2" />
      <div className="border rounded-lg overflow-hidden dark:border-white/30">
        <table className="table-auto border-collapse w-full divide-y divide-gray-200 dark:divide-white/30 m-[-1px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            {table.getHeaderGroups().map(headerGroup => (
              <tr className="divide-y divide-x divide-gray-200 dark:divide-white/30" key={headerGroup.id}>
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
                          <span className="flex gap-1 items-center px-2 py-2">
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
                        <td className="px-3 py-2 overflow-hidden text-ellipsis" key={cell.id}
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
  )
}

export default Table;
