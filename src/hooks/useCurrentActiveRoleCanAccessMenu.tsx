import { menuItem } from '@/data/menu'
import AccountInfoContext from '@/providers/AccountInfoProvider'
import { useContext } from 'react'

const useCurrentActiveRoleCanAccessMenu = (menuSlug: string) => {
	const accountInfo = useContext(AccountInfoContext)
	const menu = menuItem.find(({ name }) => name === menuSlug)
	let isCurrentActiveRoleCanAccess = true

	if (
		menu === undefined ||
		(menu.isShown !== undefined && !menu.isShown(accountInfo))
	)
		isCurrentActiveRoleCanAccess = false

	return { isCurrentActiveRoleCanAccess }
}

export default useCurrentActiveRoleCanAccessMenu
