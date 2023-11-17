export {}

declare global {
  interface Array<T> {
    findLastIndex(
      predicate: (value: T, index: number, obj: T[]) => unknown,
      thisArg?: any
    ): number
  }
}

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateRow: (rowIndex: number, columnId: string, value: TData) => void
  }
}

declare module '@tanstack/table-core' {
  interface SortingFns {
    numberIgnoreUndefined: SortingFn<unknown>
  }
}

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends RowData, TValue> {
    minWidth: string
  }
}
