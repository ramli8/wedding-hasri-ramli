import { AccountInfoType } from "./auth"

interface MenuItem {
	name: string,
	url: string,
	icon: string,
	submenu?: Array<MenuItem>
	notif?: number,

	// Apakah menu ini ditampilkan pada user?
	// Default akan ditampilkan
	isShown?: (accountInfo: AccountInfoType) => boolean
}

export { MenuItem }
