import { AccountInfoType } from './account';
import { IconType } from 'react-icons';

interface MenuItem {
  name: string;
  url: string;
  icon: IconType;
  submenu?: Array<MenuItem>;
  notif?: number;

  // Apakah menu ini ditampilkan pada user?
  // Default akan ditampilkan
  isShown?: (accountInfo: AccountInfoType) => boolean;
}

export { MenuItem };
