/**
 * @file 404.tsx
 * @description This is the 404 page. It is used to display a 404 error page.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { HomeOutlineIconMade } from '@/components/atoms/IconsMade'
import ErrorPage from '@/components/pages/ErrorPage'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/router'
import { NextPageWithLayout } from './_app'

type Props = {
	resetError?: () => void
}

const Custom404: NextPageWithLayout<Props> = ({ resetError }) => {
	const t = useTranslations('ErrorPage')
	const { push } = useRouter()

	return (
		<ErrorPage
			statusCode={404}
			title={t('halaman_tidak_ditemukan')}
			action={{
				icon: <HomeOutlineIconMade fontSize={'1.125rem'} />,
				onClick: () => {
					push('/').then(() => {
						resetError && resetError()
					})
				},
				text: t('kembali_ke_beranda'),
			}}
		/>
	)
}

Custom404.getLayout = ErrorPage.getLayout

export default Custom404
