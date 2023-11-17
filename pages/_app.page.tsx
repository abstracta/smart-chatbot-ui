import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';

import { Session } from 'next-auth';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

import '@/styles/globals.css';
import { trpc } from '../utils/trpc';
import { ReactElement, ReactNode } from 'react';
import { InferGetServerSidePropsType, NextPage } from 'next';
import nextI18NextConfig from '../next-i18next.config'

const inter = Inter({ subsets: ['latin'] });

export type NextPageWithLayout<Props extends (args: any) => any> = NextPage<InferGetServerSidePropsType<Props>> & {
  getLayout?: (page: ReactElement, props: InferGetServerSidePropsType<Props>) => ReactNode
}

type AppPropsWithLayout<P> = AppProps<P> & {
  Component: NextPageWithLayout<any>
}

function App({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout<{ session: Session }>) {
  const queryClient = new QueryClient();
  const getLayout = Component.getLayout ?? ((page) => page)

  return (
    <SessionProvider session={session}>
      <div className={inter.className}>
        <Toaster />
        <QueryClientProvider client={queryClient}>
          {getLayout(<Component {...pageProps} />, pageProps)}
        </QueryClientProvider>
      </div>
    </SessionProvider>
  );
}

export default trpc.withTRPC(appWithTranslation(App, nextI18NextConfig));
