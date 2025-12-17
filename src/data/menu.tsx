/**
 * @file Menu.tsx
 * @description This is the menu data. You can set the menu list here.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { MenuItem } from '@/types/menu-item';
import {
  FiHome,
  FiLogIn,
  FiLogOut,
  FiUsers,
  FiMessageSquare,
  FiGrid,
  FiLink,
  FiUser,
  FiKey,
  FiShield,
  FiSettings,
} from 'react-icons/fi';

// Transaksi Section - Main operational menus
const menuItem: Array<MenuItem> = [
  {
    name: 'dashboard',
    url: '/admin/dashboard',
    icon: FiHome,
  },
  {
    name: 'checkin',
    url: '/admin/checkin',
    icon: FiLogIn,
  },
  {
    name: 'checkout',
    url: '/admin/checkout',
    icon: FiLogOut,
  },
  {
    name: 'tamu',
    url: '/admin/tamu',
    icon: FiUsers,
  },
  {
    name: 'ucapan',
    url: '/admin/ucapan',
    icon: FiMessageSquare,
  },
];

// Master Section - Data management menus
const menuItemMaster: Array<MenuItem> = [
  {
    name: 'kategori_tamu',
    url: '/admin/kategori_tamu',
    icon: FiGrid,
  },
  {
    name: 'hubungan_tamu',
    url: '/admin/hubungan_tamu',
    icon: FiLink,
  },
  {
    name: 'users',
    url: '/admin/users',
    icon: FiUser,
  },
  {
    name: 'permissions',
    url: '/admin/role_permissions',
    icon: FiKey,
  },
  {
    name: 'roles',
    url: '/admin/roles',
    icon: FiShield,
  },
  {
    name: 'personalisasi',
    url: '/admin/personalisasi',
    icon: FiSettings,
  },
];

// Empty insights section (merged into master)
const menuItemInsights: Array<MenuItem> = [];

export { menuItem, menuItemMaster, menuItemInsights };
