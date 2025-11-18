/**
 * @file Menu.tsx
 * @description This is the menu data. You can set the menu list here.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { MenuItem } from "@/types/menu-item";

const menuItem: Array<MenuItem> = [
  {
    name: "beranda",
    url: "/",
    icon: "home",
  },
  {
    name: "alert",
    url: "/alert",
    icon: "warning",
  },
  {
    name: "badge",
    url: "/badge",
    icon: "voting_chip",
  },
  {
    name: "button",
    url: "/button",
    icon: "buttons_alt",
  },
  {
    name: "card",
    url: "/card",
    icon: "crop_landscape",
  },
  {
    name: "menu",
    url: "/menu",
    icon: "table_rows",
  },
  {
    name: "tab",
    url: "/tab",
    icon: "tab",
  },
  {
    name: "toast",
    url: "/toast",
    icon: "notifications",
  },
  {
    name: "checkbox",
    url: "/checkbox",
    icon: "check_box",
  },
  {
    name: "input",
    url: "/input",
    icon: "edit_square",
  },
  {
    name: "radio",
    url: "/radio",
    icon: "radio_button_checked",
  },
  {
    name: "select",
    url: "/select",
    icon: "expand_circle_down",
  },
  {
    name: "switch",
    url: "/switch",
    icon: "toggle_on",
  },
  {
    name: "textarea",
    url: "/textarea",
    icon: "article",
  },
  {
    name: "upload_file",
    url: "/upload_file",
    icon: "upload_file",
  },
];

const menuItemInsights: Array<MenuItem> = [
  {
    name: "personalisasi",
    url: "/personalisasi",
    icon: "settings",
  },
];

export { menuItem, menuItemInsights };
