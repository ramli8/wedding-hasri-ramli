/**
 * @file Menu.tsx
 * @description This is the menu data. You can set the menu list here.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { MenuItem } from '@/types/menu-item';

const menuItem: Array<MenuItem> = [
  {
    name: 'dashboard',
    url: '/admin/dashboard',
    icon: 'dashboard',
  },
  {
    name: 'tamu',
    url: '/admin/tamu',
    icon: 'people',
  },
  {
    name: 'users',
    url: '/admin/users',
    icon: 'manage_accounts',
  },
  {
    name: 'checkin',
    url: '/admin/checkin',
    icon: 'qr_code_scanner',
  },
  {
    name: 'checkout',
    url: '/admin/checkout',
    icon: 'qr_code_scanner',
  },
  {
    name: 'ucapan',
    url: '/admin/ucapan',
    icon: 'forum',
  },
];

const menuItemMaster: Array<MenuItem> = [
  {
    name: 'roles',
    url: '/admin/roles',
    icon: 'shield',
  },
  {
    name: 'kategori_tamu',
    url: '/admin/kategori_tamu',
    icon: 'folder',
  },
  {
    name: 'hubungan_tamu',
    url: '/admin/hubungan_tamu',
    icon: 'link',
  },
  {
    name: 'permissions',
    url: '/admin/role_permissions',
    icon: 'lock',
  },
];

const menuItemInsights: Array<MenuItem> = [
  {
    name: 'personalisasi',
    url: '/admin/personalisasi',
    icon: 'settings',
  },
];

export { menuItem, menuItemMaster, menuItemInsights };
