import * as React from 'react'

import {
  createColumnHelper,
} from '@tanstack/react-table'
import { User, UserRole } from '@/types/user'
import { FC, useContext, useMemo } from 'react'
import { IconX } from '@tabler/icons-react'
import UsersContext from '@/pages/admin/users/users.context'
import { useTranslation } from 'react-i18next'
import Table from '../Table'
import { InputNumber } from '../Table/components/InputNumber'
import { Select } from '../Table/components/Select'


interface Props {
  data: User[];
  updateUser(updatedUser: User): Promise<void>;
}

export const UserTable: FC<Props> = ({ data, updateUser }) => {
  const { t } = useTranslation('admin');

  const { state: {
    defaultUserLimitUSD, canUpdateUserQuotas
  } } = useContext(UsersContext);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<User>()
    return [
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
            <div title={t(value as string) as string}>
              <Select
                onSelect={(role: UserRole) => {
                  table.options.meta?.updateRow(row.index, column.id, { ...row.original, role })
                }}
                value={value}
                options={Object.values(UserRole).map((role) => {
                  return {
                    label: t(role) as string,
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
            <div className="flex items-center" title={value && value >= 0 ? value.toString() : `${t('Default')} ${defaultUserLimitUSD ? ` (${defaultUserLimitUSD})` : ''}`}>
              <InputNumber
                initialValue={value && value >= 0 ? value : undefined}
                placeholder={`${t('Default')}${defaultUserLimitUSD ? ` (${defaultUserLimitUSD})` : ''}`}
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
  }, [t, defaultUserLimitUSD, canUpdateUserQuotas]);

  const initialSorting = useMemo(
    () => [{
      "id": "name",
      "desc": false
    }], []
  );

  return (
    <div className="min-w-[600px] w-full max-w-[1400px] py-2">
      <Table columns={columns} data={data}
        initialSorting={initialSorting}
        updateRow={updateUser} />
    </div>
  )
}

export default UserTable;
