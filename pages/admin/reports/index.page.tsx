
import { useTranslation } from 'next-i18next';
import { ReactElement, useMemo, useState } from 'react';
import AdminLayout from '@/pages/admin/adminLayout';
import { NextPageWithLayout } from '@/pages/_app.page';
import { UserRole } from '@/types/user';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth].page';
import { ReportsInitialState, initialState } from './reports.state';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import ReportsContext from './reports.context';
import { trpc } from '@/utils/trpc';
import UserUsageTable from '@/components/UserUsageTable';
import Spinner from '@/components/Spinner';
import { IconAlertCircle, IconDotsVertical, IconReload } from '@tabler/icons-react';
import { InputDate } from '@/components/Input/InputDate';
import Dropdown from '@/components/Buttons/Dropdown/';
import { DropdownItem } from '@/components/Buttons/Dropdown/DropItem';
import { downloadFile } from '@/utils/app/download';
import { LlmID, LlmList } from '@/types/llm';


interface Props {
}

const Reports: NextPageWithLayout<Props> = ({
}: Props) => {
  const { t } = useTranslation('admin');

  const contextValue = useCreateReducer<ReportsInitialState>({
    initialState: {
      ...initialState,
    } as ReportsInitialState,
  });

  const currentDate = () => new Date()
  const date = currentDate();
  let startOfMonth = () => new Date(date.getFullYear(), date.getMonth(), 1);

  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState<Date>(date);

  const queryEndDate = useMemo(() => {
    const date = new Date(endDate.getTime());
    date.setHours(endDate.getHours() + 24);
    return date;
  }, [endDate]);

  const usageQuery = trpc.llmUsage.getLlmUsageStatsPerUser.useQuery({
    start: startDate,
    end: queryEndDate
  });

  const handleReset = () => {
    setStartDate(startOfMonth());
    setEndDate(currentDate());
  }

  const models = useMemo(() => {
    const showModelIds: LlmID[] = [
      LlmID.GPT_3_5_AZ, LlmID.GPT_3_5_16K_AZ,
      LlmID.GPT_4, LlmID.GPT_4_32K, LlmID.TEXT_EMBEDDING_ADA_002
    ]
    return Object.values(LlmList).filter(m => showModelIds.includes(m.id))
  }, []);

  const exportCSV = () => {
    const headers = [
      "Name",
      ...(models.reduce((prev, curr) => {
        prev.push(`${curr.name} tokens`);
        prev.push(`${curr.name} USD`);
        return prev;
      }, [] as string[])),
      "Total tokens",
      "Total USD"
    ]

    const rows = [
      [headers],
      ...(usageQuery.data ? usageQuery.data?.map((data) => {
        return [
          data.userName,
          ...(models.reduce((prev, curr) => {
            const modelUsage = data.usage.find(u => u.modelId == curr.id);
            prev.push(modelUsage?.totalTokens?.toString() || "");
            prev.push(modelUsage?.totalUSD?.toString() || "");
            return prev;
          }, [] as string[])),
          data.totalTokens,
          data.totalUSD
        ];
      }) : []),
    ];

    downloadFile(`data:text/csv;charset=utf-8,${rows.map(e => e.join(",")).join("\n")}`,
      `chatbot-user-usage_${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}`);
  }

  return (
    <ReportsContext.Provider
      value={{
        ...contextValue
      }}>
      <div className="mt-[70px] px-6 w-full">
        <div className='flex flex-1 gap-2'>
          <div>
            <h1 className="text-xl text-gray-800 dark:text-white mb-3">{t('Usage report')}</h1>
          </div>
          <div className='flex gap-2 ml-auto mr-0 items-end'>
            <div className='flex flex-col'>
              <label htmlFor='start-date'>{t('From')}</label>
              <InputDate id="start-date" value={startDate}
                max={endDate}
                onChange={(d) => setStartDate(d)} />
            </div>
            <div className='flex flex-col mr-5'>
              <label htmlFor='end-date'>{t('To')}</label>
              <InputDate id="end-date" value={endDate}
                min={startDate}
                onChange={(date) => setEndDate(date)} />
            </div>
            <div className='mr-5'>
              <button
                className="flex items-center gap-2 p-2 rounded border hover:bg-black/10 dark:hover:bg-white/10 transition
                  disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300 dark:border-white/20
                  dark:disabled:bg-gray-500 dark:disabled:text-gray-600 dark:disabled:border-gray-500"
                onClick={handleReset}
                disabled={usageQuery.isLoading}
              >
                <IconReload size={18} />
                {t('Clear')}
              </button>
            </div>
            <div className='flex items-end'>
              <Dropdown buttonContent={<IconDotsVertical size={20} />}
                items={[
                  <DropdownItem onClick={exportCSV} key="export-csv">{t('Export CSV')}</DropdownItem>
                ]}
                align='left'
                disabled={usageQuery.isLoading || usageQuery.isError || !usageQuery.data} />
            </div>
          </div>
        </div>
        <div className="flex min-h-[300px] relative">
          <UserUsageTable data={usageQuery.data || []} models={models} />
          {usageQuery.isLoading && (<div className="absolute w-full h-full flex flex-1 self-stretch items-center justify-center bg-white dark:bg-[#343541]" >
            <Spinner size="25px" className="m-auto" />
          </div>)}
          {usageQuery.isError && (<div className="absolute w-full h-full flex flex-1 self-stretch items-center justify-center bg-white dark:bg-[#343541]" >
            <div className='flex flex-col items-center gap-2 text-red-600 dark:text-red-400'>
              <IconAlertCircle size={35} />
              <span className="text-lg">An error occurred.</span>
            </div>
          </div>)}
        </div>
      </div>
    </ReportsContext.Provider>
  );
};

Reports.getLayout = function getLayout(page: ReactElement) {
  return (
    <AdminLayout>
      {page}
    </AdminLayout>
  )
}

export default Reports;


export const getServerSideProps: GetServerSideProps = async ({ locale, req, res }) => {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session?.user?.role !== UserRole.ADMIN) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    }
  }
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'sidebar',
        'settings',
        'error',
        'admin',
      ]))
    },
  };
};


