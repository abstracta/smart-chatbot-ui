
import { useTranslation } from 'next-i18next';
import { ReactElement } from 'react';
import AdminLayout from '@/pages/admin/adminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import { User, UserRole } from '@/types/user';
import useUsers from '@/hooks/useUsers';
import UserTable from '@/components/UserTable';
import { DEFAULT_USER_LIMIT_USD_MONTHLY, CAN_UPDATE_USER_QUOTAS } from '@/utils/app/const';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { UsersInitialState, initialState } from './users.state';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import UsersContext from './users.context';


interface Props {
  defaultUserLimitUSD: number | undefined;
  canUpdateUserQuotas: boolean;
}

const Users: NextPageWithLayout<Props> = ({
  defaultUserLimitUSD,
  canUpdateUserQuotas,
}: Props) => {
  const { t } = useTranslation('admin');

  const contextValue = useCreateReducer<UsersInitialState>({
    initialState: {
      ...initialState,
      defaultUserLimitUSD,
      canUpdateUserQuotas,
    } as UsersInitialState,
  });

  const [users, userActions] = useUsers();

  const handleUpdateUser = async (updatedUser: User) => {
    await userActions.update(updatedUser);
  }

  return (
    <UsersContext.Provider
      value={{
        ...contextValue
      }}>
      <div className="w-full mt-[70px] px-6">
        <h1 className="text-xl text-gray-800 dark:text-white mb-3">{t('Users')}</h1>
        <div className="">
          <UserTable data={users} updateUser={handleUpdateUser} />
        </div>
      </div>
    </UsersContext.Provider>
  );
};

Users.getLayout = function getLayout(page: ReactElement) {
  return (
    <AdminLayout>
      {page}
    </AdminLayout>
  )
}

export default Users;


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


