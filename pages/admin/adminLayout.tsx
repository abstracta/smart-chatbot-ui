import Head from "next/head";
import { AdminSideNav } from "../../components/AdminSidebar/AdminSideNav";
import { PropsWithChildren, useEffect } from "react";
import useSettings from "@/hooks/useSettings";
import { AdminInitialState, initialState } from "./admin.state";
import { useCreateReducer } from "@/hooks/useCreateReducer";
import AdminContext from "./admin.context";
import Spinner from "@/components/Spinner";


const AdminLayout = ({
  children
}: PropsWithChildren) => {
  const contextValue = useCreateReducer<AdminInitialState>({
    initialState: {
      ...initialState,
    } as AdminInitialState,
  });
  const { state: { }, dispatch } = contextValue;
  const [settingsQuery, settingsActions] = useSettings();

  useEffect(() => {
    const showNavBar = localStorage.getItem('showNavBar');
    if (showNavBar != null) dispatch({ field: 'showNavBar', value: showNavBar === 'true' });
  }, [dispatch]);

  return (
    <AdminContext.Provider
      value={{
        ...contextValue
      }}
    >
      <Head>
        <title>Chatbot UI - Admin</title>
        <meta name="description" content="Chatbot UI - Admin page" />
        <meta
          name="viewport"
          content="height=device-height, width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {settingsQuery.isFetched ?
        <main className={`flex h-screen w-screen flex-col text-sm ${settingsQuery.data.theme}`} >
          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            <div className="text-white dark:text-white">
              <AdminSideNav />
            </div>
            <div className="flex flex-1 bg-white dark:bg-[#343541] text-dark dark:text-white overflow-y-scroll">
              {children}
            </div>
          </div>
        </main>
        : <main className="flex h-screen w-screen">
          <Spinner size="25px" className="m-auto text-white" />
        </main>}
    </AdminContext.Provider>
  )
}

export default AdminLayout;