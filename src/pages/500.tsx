/**
 * @file 500.tsx
 * @description This is the 500 page. It is used to display a 500 error page.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { RefreshOutlineIconMade } from '@/components/atoms/IconsMade'
import ErrorPage from '@/components/pages/ErrorPage'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/router'
import { NextPageWithLayout } from './_app'

type Props = {
	resetError?: () => void
}

const Custom500: NextPageWithLayout<Props> = ({ resetError }) => {
	const t = useTranslations('ErrorPage')
	const { reload } = useRouter()

	return (
		<ErrorPage
			statusCode={500}
			title={t('kesalahan_internal_server')}
			action={{
				icon: <RefreshOutlineIconMade fontSize={'1.125rem'} />,
				onClick: () => {
					reload()
					resetError && resetError()
				},
				text: t('muat_ulang'),
			}}
		/>
	)
}

Custom500.getLayout = ErrorPage.getLayout

export default Custom500
