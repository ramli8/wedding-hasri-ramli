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
    name: 'tamu',
    url: '/admin/tamu',
    icon: 'people',
  },
];

const menuItemMaster: Array<MenuItem> = [
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
];

const menuItemInsights: Array<MenuItem> = [
  {
    name: 'personalisasi',
    url: '/personalisasi',
    icon: 'settings',
  },
];

export { menuItem, menuItemMaster, menuItemInsights };
