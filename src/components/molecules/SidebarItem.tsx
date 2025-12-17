'use client';

import AppSettingContext from '@/providers/AppSettingProvider';
import { MenuItem } from '@/types/menu-item';
import { Box, Flex, Link, Text, useColorMode } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { useTranslations } from 'next-intl';
import { MaterialIcon } from '../atoms/MaterialIcon';

const SidebarItem = ({
  menuItem,
}: {
  menuItem: MenuItem;
  menuIndex: number;
}) => {
  const { pathname } = useRouter();
  const router = pathname || '';
  const { colorMode } = useColorMode();
  const { isNavbarOpen, navbarToggler } = useContext(AppSettingContext);
  const t = useTranslations('Common.modules');
  const { colorPref } = useContext(AppSettingContext);

  // Check if this menu item is active
  const isActive =
    router === menuItem.url ||
    (router.startsWith(menuItem.url) &&
      router.charAt(menuItem.url.length) === '/');

  return (
    <Link
      as={NextLink}
      href={menuItem.url}
      onClick={isNavbarOpen ? navbarToggler : undefined}
      _hover={{ textDecoration: 'none' }}
    >
      <Flex
        alignItems="center"
        h="42px" // Slightly reduced height for tighter look
        my="4px" // Slightly more vertical spacing between items
        px="12px"
        mx="8px" // Add horizontal margin for "floating" feel
        borderRadius="12px" // Softer border radius
        fontSize="14px"
        color={
          isActive
            ? colorMode === 'light'
              ? `${colorPref}.700` // Use theme darken color
              : `${colorPref}Dim.300` // Dark mode active text (Light Pastel)
            : colorMode === 'light'
            ? 'gray.700'
            : 'gray.400'
        }
        bg={
          isActive
            ? colorMode === 'light'
              ? `${colorPref}.50` // Use theme pastel background
              : `${colorPref}Dim.900` // Dark mode active background (Dark Tint)
            : 'transparent'
        }
        fontWeight={isActive ? '600' : '500'}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        cursor="pointer"
        _hover={{
          bg: isActive
            ? colorMode === 'light'
              ? `${colorPref}.100`
              : `${colorPref}Dim.800`
            : colorMode === 'light'
            ? 'gray.50'
            : 'whiteAlpha.50',
          color: isActive
            ? colorMode === 'light'
              ? `${colorPref}.800`
              : `${colorPref}Dim.200`
            : colorMode === 'light'
            ? 'gray.900'
            : 'white',
          transform: 'translateX(2px)', // Subtle movement on hover
        }}
      >
        {/* Icon */}
        <Flex
          justifyContent="center"
          alignItems="center"
          w="20px"
          h="20px"
          mr="12px"
          flexShrink={0}
          color="inherit"
        >
          <Box
            as={menuItem.icon}
            size="20px"
            strokeWidth={isActive ? 2.5 : 2}
          />
        </Flex>

        {/* Label */}
        <Text
          noOfLines={1}
          title={t(`${menuItem.name}.title`)}
          letterSpacing="-0.01em"
        >
          {t(`${menuItem.name}.title`)}
        </Text>
      </Flex>
    </Link>
  );
};

export default SidebarItem;
