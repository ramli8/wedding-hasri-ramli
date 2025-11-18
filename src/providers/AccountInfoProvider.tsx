/**
 * @file AccountInfoProvider.tsx
 * @description This is the account info provider. It is used to provide the account info to the app.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { useAuth } from '@/services/useAuth'
import { AccountInfoType } from '@/types/auth'
import { fetcherDateNow } from '@/utils/common/Fetcher'
import { ReactNode, createContext } from 'react'
import useSWRImmutable from 'swr/immutable'

const accountInfoContextDefault: AccountInfoType = {}

const AccountInfoContext = createContext<AccountInfoType>(
	accountInfoContextDefault
)

export function AccountInfoProvider({ children }: { children: ReactNode }) {
	const { data: dateNow } = useSWRImmutable('date_now', fetcherDateNow)
	const {
		data: userInfoData,
		error: userInfoDataError,
		isValidating: userInfoDataValidating,
	} = useSWRImmutable('auth', useAuth, {
		refreshInterval: 60000,
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	})

	const savedActiveRoleId = localStorage.getItem("active_role") ?? ''
	const isSavedActiveRoleExistInRoles = userInfoData?.role?.find(({ id }) => savedActiveRoleId === id) !== undefined
	const defaultRole = userInfoData?.role?.[0]

	return (
		<AccountInfoContext.Provider
			value={{
				name: userInfoData?.name,
				profPicture: userInfoData?.picture
					? userInfoData.picture + '?update=' + dateNow
					: undefined,
				prefUsername: userInfoData?.preferred_username,
				role: userInfoData?.role,
				activeRole: isSavedActiveRoleExistInRoles ? savedActiveRoleId : defaultRole?.id,
				email: userInfoData?.email,
				birthdate: userInfoData?.birthdate,
				nickname: userInfoData?.nickname,
				userInfoError: userInfoDataError,
				userInfoValidating: userInfoDataValidating,
			}}
		>
			{children}
		</AccountInfoContext.Provider>
	)
}

export default AccountInfoContext
