import * as React from 'react'

import {
  createColumnHelper,
} from '@tanstack/react-table'
import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Table from '../Table'
import { AggregationLlmUsageStatsPerUser } from '@/types/llmUsage'
import { Llm } from '@/types/llm'


interface Props {
  data: AggregationLlmUsageStatsPerUser[];
  models: Llm[]
}

export const UserUsageTable: FC<Props> = ({
  data,
  models
}) => {
  const { t } = useTranslation('admin');

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<AggregationLlmUsageStatsPerUser>()
    return [
      columnHelper.accessor('userName', {
        header: t('Name') as string,
        minSize: 100,
      }),
      columnHelper.group({
        id: 'models',
        header: t("Models") as string,
        columns: [
          ...(models.map(m => {
            return columnHelper.group({
              id: m.id,
              header: m.name,
              columns: [
                columnHelper.accessor(row => row.usage.find(u => u.modelId == m.id)?.totalTokens, {
                  id: `$totalTokens-${m.id}`,
                  cell: (info) => {
                    const value: number | undefined = info.getValue();
                    if (value) {
                      return (Number(value) / 1000).toFixed(1) + "K";
                    }
                    return value;
                  },
                  header: t('Tokens') as string,
                  size: 50,
                  sortUndefined: false,
                  sortingFn: "numberIgnoreUndefined"
                }),
                columnHelper.accessor(row => row.usage.find(u => u.modelId == m.id)?.totalUSD, {
                  id: `$totalUSD-${m.id}`,
                  cell: (info) => {
                    const value: number | undefined = info.getValue();
                    if (value) {
                      return Number(value).toFixed(2);
                    }
                    return value;
                  },
                  header: t('USD') as string,
                  size: 50,
                  sortUndefined: false,
                  sortingFn: "numberIgnoreUndefined"
                }),
              ]
            })
          })
          )
        ],
      }),
      columnHelper.group({
        id: "total",
        header: t("Total") as string,
        columns: [
          columnHelper.accessor("totalTokens", {
            id: "totalTokens",
            cell: (info) => {
              const value: number | undefined = info.getValue();
              if (value) {
                return (Number(value) / 1000).toFixed(1) + "K";
              }
              return value;
            },
            header: t("Total tokens") as string,
            size: 50,
            sortUndefined: false,
            sortingFn: "numberIgnoreUndefined"
          }),
          columnHelper.accessor("totalUSD", {
            id: "totalUSD",
            cell: (info) => {
              const value: number | undefined = info.getValue();
              if (value) {
                return Number(value).toFixed(2);
              }
              return value;
            },
            header: t("Total USD") as string,
            size: 50,
            sortUndefined: false,
            sortingFn: "numberIgnoreUndefined"
          })
        ]
      })
    ]
  }, [t, models]);

  const initialSorting = useMemo(
    () => [{
      "id": "userName",
      "desc": false
    }], []
  );

  return (
    <div className="min-w-[1000px] w-full py-2">
      <Table columns={columns} data={data}
        initialSorting={initialSorting}
      />
    </div>
  )
}

export default UserUsageTable;
