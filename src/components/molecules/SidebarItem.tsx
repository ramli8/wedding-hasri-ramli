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
        h="44px"
        my="3px"
        px="14px"
        borderRadius="10px"
        fontSize="15px"
        color={
          isActive
            ? colorMode === 'light'
              ? `${colorPref}.600`
              : `${colorPref}.300`
            : colorMode === 'light'
            ? 'gray.600'
            : 'gray.400'
        }
        bg={
          isActive
            ? colorMode === 'light'
              ? `${colorPref}.50`
              : `whiteAlpha.100`
            : 'transparent'
        }
        fontWeight={isActive ? '600' : '500'}
        transition="all 0.15s ease"
        cursor="pointer"
        _hover={{
          bg: isActive
            ? colorMode === 'light'
              ? `${colorPref}.100`
              : 'whiteAlpha.150'
            : colorMode === 'light'
            ? 'gray.50'
            : 'whiteAlpha.50',
          color: isActive
            ? colorMode === 'light'
              ? `${colorPref}.700`
              : `${colorPref}.200`
            : colorMode === 'light'
            ? 'gray.900'
            : 'white',
        }}
      >
        {/* Icon */}
        <Flex
          justifyContent="center"
          alignItems="center"
          w="22px"
          h="22px"
          mr="14px"
          flexShrink={0}
          color="inherit"
        >
          <MaterialIcon
            name={menuItem.icon}
            fill={isActive ? 1 : 0}
            weight={isActive ? 500 : 400}
            variant="rounded"
            size={22}
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

        {/* Active Indicator */}
        {isActive && (
          <Box
            w="4px"
            h="4px"
            borderRadius="full"
            bg={colorMode === 'light' ? `${colorPref}.500` : `${colorPref}.400`}
            ml="auto"
          />
        )}
      </Flex>
    </Link>
  );
};

export default SidebarItem;
