/**
 * @file Menu.tsx
 * @description This is the menu data. You can set the menu list here.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { MenuItem } from '@/types/menu-item';

// Transaksi Section - Main operational menus
const menuItem: Array<MenuItem> = [
  {
    name: 'dashboard',
    url: '/admin/dashboard',
    icon: 'space_dashboard', // Modern dashboard icon
  },
  {
    name: 'checkin',
    url: '/admin/checkin',
    icon: 'login', // Clean login/checkin icon
  },
  {
    name: 'checkout',
    url: '/admin/checkout',
    icon: 'logout', // Clean logout/checkout icon
  },
  {
    name: 'tamu',
    url: '/admin/tamu',
    icon: 'group', // Clean people icon
  },
  {
    name: 'ucapan',
    url: '/admin/ucapan',
    icon: 'chat_bubble', // Clean message icon
  },
];

// Master Section - Data management menus
const menuItemMaster: Array<MenuItem> = [
  {
    name: 'kategori_tamu',
    url: '/admin/kategori_tamu',
    icon: 'category', // Category icon
  },
  {
    name: 'hubungan_tamu',
    url: '/admin/hubungan_tamu',
    icon: 'hub', // Connection/hub icon
  },
  {
    name: 'users',
    url: '/admin/users',
    icon: 'person', // Clean user icon
  },
  {
    name: 'permissions',
    url: '/admin/role_permissions',
    icon: 'key', // Permission/key icon
  },
  {
    name: 'roles',
    url: '/admin/roles',
    icon: 'shield', // Role/shield icon
  },
  {
    name: 'personalisasi',
    url: '/admin/personalisasi',
    icon: 'tune', // Settings/tune icon
  },
];

// Empty insights section (merged into master)
const menuItemInsights: Array<MenuItem> = [];

export { menuItem, menuItemMaster, menuItemInsights };
