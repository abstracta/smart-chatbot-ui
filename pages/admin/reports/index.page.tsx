
import { useTranslation } from 'next-i18next';
import { ReactElement, useEffect, useMemo, useState } from 'react';
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
import { APP_NAME } from '@/utils/app/const';
import { Llm, LlmID, LlmList } from '@/types/llm';
import { ModelsDropdown } from '@/components/ModelsDropdown/ModelsDropdown';


interface Props {
  appName: string;
}

const modelNames: Record<string, string> = {
  [LlmID.GPT_3_5]: LlmList[LlmID.GPT_3_5].name + " (OAI)",
  [LlmID.GPT_3_5_16K]: LlmList[LlmID.GPT_3_5_16K].name + " (OAI)",
  [LlmID.GPT_3_5_AZ]: LlmList[LlmID.GPT_3_5_AZ].name + " (AZ)",
  [LlmID.GPT_3_5_16K_AZ]: LlmList[LlmID.GPT_3_5_16K_AZ].name + " (AZ)",
}

const Reports: NextPageWithLayout<typeof getServerSideProps> = ({
}) => {
  const { t } = useTranslation('admin');
  const contextValue = useCreateReducer<ReportsInitialState>({
    initialState: {
      ...initialState,
    } as ReportsInitialState,
  });

  const models = useMemo(() => {
    return Object.values(LlmList)
      .map(m => { return { ...m, name: modelNames[m.id] || m.name } })
  }, []);
  const currentDate = () => new Date()
  const date = currentDate();
  let startOfMonth = () => new Date(date.getFullYear(), date.getMonth(), 1);

  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState<Date>(date);
  const [selectedModels, setSelectedModels] = useState<Llm[]>(models)
  const [disabledModels, setDisabledModels] = useState<Llm[]>()

  const queryEndDate = useMemo(() => {
    const date = new Date(endDate.getTime());
    date.setHours(endDate.getHours() + 24);
    return date;
  }, [endDate]);

  const modelIdsQuery = trpc.llmUsage.getLlmUsageIds.useQuery({
    start: startDate,
    end: queryEndDate,
  }, { refetchOnWindowFocus: false });

  const usageQuery = trpc.llmUsage.getLlmUsageStatsPerUser.useQuery({
    start: startDate,
    end: queryEndDate,
    modelIds: selectedModels.map(m => m.id)
  });

  const handleReset = () => {
    setStartDate(startOfMonth());
    setEndDate(currentDate());
  }

  useEffect(() => {
    if (modelIdsQuery.data) {
      const modelsWithData = modelIdsQuery.data;
      setDisabledModels(models.filter(m => !modelsWithData.includes(m.id)));
      const selected = (modelsWithData
        .map(id => models.find(m => m.id == id))
        .filter((m) => m != undefined) as Llm[])
        .sort((a, b) => a.id.localeCompare(b.id));
      setSelectedModels(selected);
    }
  }, [modelIdsQuery.data, models])

  const exportCSV = () => {
    const headers = [
      "Name",
      ...(selectedModels.reduce((prev, curr) => {
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
          ...(selectedModels.reduce((prev, curr) => {
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

    downloadFile(new Blob([rows.map(e => e.join(",")).join("\n")], { type: "text/csv" }),
      `chatbot-user-usage_${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}`);
  }

  return (
    <ReportsContext.Provider
      value={{
        ...contextValue
      }}>
      <div className="mt-[70px] px-6 w-full">
        <div className='flex flex-1 flex-col md:flex-row gap-2'>
          <div>
            <h1 className="text-xl text-gray-800 dark:text-white mb-3">{t('Usage report')}</h1>
          </div>
          <div className='flex flex-wrap gap-2 ml-auto mr-0 items-end'>
            <div className='flex flex-col'>
              <ModelsDropdown models={models}
                selectedModels={selectedModels}
                disabledModels={disabledModels}
                disabledText={t("No data") as string}
                onChange={(models) => setSelectedModels(models.sort((a, b) => a.id.localeCompare(b.id)))}
              />
            </div>
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
                className="flex items-center gap-2 p-2 leading-[22px] rounded border hover:bg-black/10 dark:hover:bg-white/10 transition
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
              <Dropdown buttonContent={<IconDotsVertical size={22} />}
                items={[
                  <DropdownItem onClick={exportCSV} key="export-csv">{t('Export CSV')}</DropdownItem>
                ]}
                align='left'
                disabled={usageQuery.isLoading || usageQuery.isError || !usageQuery.data} />
            </div>
          </div>
        </div>
        <div className="flex min-h-[300px] relative">
          <UserUsageTable data={usageQuery.data || []} models={selectedModels} />
          {usageQuery.isLoading && (<div className="absolute w-full h-full flex flex-1 self-stretch items-center justify-center bg-white dark:bg-[#343541]" >
            <Spinner size="25px" className="m-auto" />
          </div>)}
          {usageQuery.isError && (<div className="absolute w-full h-full flex flex-1 self-stretch items-center justify-center bg-white dark:bg-[#343541]" >
            <div className='flex flex-col items-center gap-2 text-red-600 dark:text-red-400'>
              <IconAlertCircle size={35} />
              <span className="text-lg">{t("An error occurred")}.</span>
            </div>
          </div>)}
        </div>
      </div>
    </ReportsContext.Provider>
  );
};

Reports.getLayout = function getLayout(page: ReactElement, { appName }: Props) {
  return (
    <AdminLayout pageName="Usage report" appName={appName}>
      {page}
    </AdminLayout>
  )
}

export default Reports;


export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req, res }) => {
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
      appName: APP_NAME,
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
