
import { useTranslation } from 'next-i18next';
import { ReactElement } from 'react';
import AdminLayout from '@/pages/admin/adminLayout';
import { NextPageWithLayout } from '@/pages/_app.page';
import { User, UserRole } from '@/types/user';
import useUsers from '@/hooks/useUsers';
import UserTable from '@/components/UserTable';
import { DEFAULT_USER_LIMIT_USD_MONTHLY, CAN_UPDATE_USER_QUOTAS, APP_NAME } from '@/utils/app/const';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth].page';
import { UsersInitialState, initialState } from './users.state';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import UsersContext from './users.context';
import Spinner from '@/components/Spinner';
import { IconAlertCircle, IconDotsVertical } from '@tabler/icons-react';
import Dropdown from '@/components/Buttons/Dropdown';
import { DropdownItem } from '@/components/Buttons/Dropdown/DropItem';
import { downloadFile } from '@/utils/app/download';


interface Props {
  defaultUserLimitUSD: number | undefined;
  canUpdateUserQuotas: boolean;
  appName: string;
}

const Users: NextPageWithLayout<typeof getServerSideProps> = ({
  defaultUserLimitUSD,
  canUpdateUserQuotas,
}) => {
  const { t } = useTranslation('admin');
  const contextValue = useCreateReducer<UsersInitialState>({
    initialState: {
      ...initialState,
      defaultUserLimitUSD,
      canUpdateUserQuotas,
    } as UsersInitialState,
  });
  const [usersQuery, userActions] = useUsers();

  const handleUpdateUser = async (updatedUser: User) => {
    await userActions.update(updatedUser);
  }

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Role",
      ...(canUpdateUserQuotas ? ["Monthly budget (USD)"] : [])
    ]

    const rows = [
      [headers],
      ...(usersQuery.data ? usersQuery.data.map(data => {
        return [
          data.name,
          data.email,
          data.role?.toString(),
          ...(canUpdateUserQuotas ? [data.monthlyUSDConsumptionLimit?.toString()] : [])
        ]
      }) : []),
    ];

    downloadFile(`data:text/csv;charset=utf-8,${rows.map(e => e.join(",")).join("\n")}`,
      `chatbot-users_${new Date().toISOString().slice(0, 10)}`);
  }

  return (
    <UsersContext.Provider
      value={{
        ...contextValue
      }}>
      <div className="mt-[70px] px-6 w-full">
        <div className="flex flex-1 gap-2">
          <div>
            <h1 className="text-xl text-gray-800 dark:text-white mb-3">{t('Users')}</h1>
          </div>
          <div className='flex items-end ml-auto mr-0'>
            <Dropdown buttonContent={<IconDotsVertical size={20} />}
              items={[
                <DropdownItem onClick={exportCSV} key="export-csv">{t('Export CSV')}</DropdownItem>
              ]}
              align='left' />
          </div>
        </div>
        <div className="flex min-h-[300px] relative">
          <UserTable data={usersQuery.data || []} updateUser={handleUpdateUser} />
          {usersQuery.isLoading && (<div className="absolute w-full h-full flex flex-1 self-stretch items-center justify-center bg-white dark:bg-[#343541]" >
            <Spinner size="25px" className="m-auto" />
          </div>)}
          {usersQuery.isError && (<div className="absolute w-full h-full flex flex-1 self-stretch items-center justify-center bg-white dark:bg-[#343541]" >
            <div className='flex flex-col items-center gap-2 text-red-600 dark:text-red-400'>
              <IconAlertCircle size={35} />
              <span className="text-lg">An error occurred.</span>
            </div>
          </div>)}
        </div>
        <div className="">
        </div>
      </div>
    </UsersContext.Provider>
  );
};

Users.getLayout = function getLayout(page: ReactElement, { appName }: Props) {
  return (
    <AdminLayout pageName="Users" appName={appName}>
      {page}
    </AdminLayout>
  )
}

export default Users;


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
      defaultUserLimitUSD: DEFAULT_USER_LIMIT_USD_MONTHLY >= 0
        ? DEFAULT_USER_LIMIT_USD_MONTHLY : undefined,
      canUpdateUserQuotas: CAN_UPDATE_USER_QUOTAS,
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


