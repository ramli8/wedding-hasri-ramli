/**
 * @file _app.tsx
 * @description This is the main app component. It is used to wrap the app with the providers.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { ErrorBoundary } from '@/components/pages/ErrorBoundary';
import { AppSettingProvider } from '@/providers/AppSettingProvider';
import LanguageProvider from '@/providers/LanguageProvider';
import '@/styles/globals.css';
import "@/styles/styles.css"; // Import style file
import "react-datepicker/dist/react-datepicker.css"; // Import react-datepicker css
import theme from '@/theme/theme';
import { ChakraProvider } from '@chakra-ui/react';
import {
	Hydrate,
	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query';
import { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactElement, ReactNode, useState } from 'react';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
	getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
	const router = useRouter()

	const [queryClient] = useState(() => new QueryClient())

	if (router.pathname === '/404' || router.pathname === '/500') {
		const getLayout = Component.getLayout ?? ((page) => page)
		return getLayout(<Component {...pageProps} />)
	}

	return (
		<ErrorBoundary>
			<Head>
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/favicon-16x16.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
				<title>{process.env.NEXT_PUBLIC_APP_NAME_FULL}</title>
			</Head>
			<AppSettingProvider>
				<LanguageProvider>
					<QueryClientProvider client={queryClient}>
						<ChakraProvider theme={theme}>
							<Hydrate state={pageProps.dehydratedState}>
								<Component key={router.route} {...pageProps} />
							</Hydrate>
						</ChakraProvider>
					</QueryClientProvider>
				</LanguageProvider>
			</AppSettingProvider>
		</ErrorBoundary>
	)
}

export { getServerSideProps } from '@/Chakra';