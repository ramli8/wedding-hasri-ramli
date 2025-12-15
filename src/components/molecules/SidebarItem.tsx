'use client';

import AppSettingContext from '@/providers/AppSettingProvider';
import { MenuItem } from '@/types/menu-item';
import {
  Box,
  Button,
  Collapse,
  Flex,
  Icon,
  Link,
  Text,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react';
import { easeIn, easeInOut, motion } from 'framer-motion';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect } from 'react';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { useTranslations } from 'next-intl';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import { MaterialIcon } from '../atoms/MaterialIcon';

const SidebarItem = ({
  menuItem,
  menuIndex,
}: {
  menuItem: MenuItem;
  menuIndex: number;
}) => {
  const accountInfo = useContext(AccountInfoContext);
  const { pathname } = useRouter();
  const router = pathname || '';
  const menuTitles = router.split('/')[1];
  const { colorMode } = useColorMode();
  const { isOpen, onToggle, onOpen, onClose } = useDisclosure();
  const {
    isNavbarOpen,
    markerActive,
    setMarkerActive,
    setMarkerTemp,
    navbarToggler,
    parentActive,
    setParentActive,
    setParentTemp,
  } = useContext(AppSettingContext);

  useEffect(() => {
    if (router == menuItem.url) {
      setParentTemp(parentActive);
      setParentActive(menuIndex);
      if (menuIndex > parentActive) {
        setMarkerTemp(99);
        setMarkerActive(99);
      } else if (menuIndex) {
        setMarkerTemp(-1);
        setMarkerActive(-1);
      }
    }
  }, [router, markerActive]);

  useEffect(() => {
    if ('/' + menuTitles == menuItem.url) {
      onOpen();
    } else {
      // onClose();
    }
  }, [router]);
  const t = useTranslations('Common.modules');
  const { colorPref } = useContext(AppSettingContext);

  // Check if this menu item is active
  const isActive =
    router === menuItem.url ||
    (router.startsWith(menuItem.url) &&
      router.charAt(menuItem.url.length) === '/');

  return (
    <>
      <Link
        as={NextLink}
        href={menuItem.url}
        onClick={isNavbarOpen ? navbarToggler : undefined}
      >
        <Flex
          as={motion.div}
          className="sidebar__item"
          data-group="sidebar--item"
          _hover={{
            bg: isActive 
              ? colorMode == 'light'
                ? `${colorPref}.100`
                : `${colorPref}.900`
              : colorMode == 'light'
              ? 'gray.50'
              : 'whiteAlpha.50',
          }}
          alignItems="center"
          h="44px"
          my="4px"
          pos="relative"
          px="14px"
          borderRadius="10px"
          fontSize="15px"
          color={
            isActive
              ? colorMode == 'light'
                ? `${colorPref}.700`
                : `${colorPref}.300`
              : colorMode == 'light'
              ? 'gray.700'
              : 'gray.300'
          }
          bg={
            isActive
              ? colorMode == 'light'
                ? `${colorPref}.50`
                : `${colorPref}.900`
              : 'transparent'
          }
          fontWeight={isActive ? '600' : '500'}
          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          cursor="pointer"
        >
          <Flex
            className="sidebar__icon"
            justifyContent="center"
            alignItems="center"
            w="22px"
            h="22px"
            mr="14px"
            flexShrink={0}
            color="inherit"
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <MaterialIcon
              name={menuItem.icon}
              fill={isActive ? 1 : 0}
              weight={isActive ? 500 : 400}
              variant="rounded"
              size={22}
            />
          </Flex>
          <Box
            display={{ base: 'block', m: 'none', d: 'block' }}
            mr="auto"
            w="full"
          >
            <Text noOfLines={2} title={t(`${menuItem.name}.title`)}>
              {t(`${menuItem.name}.title`)}
            </Text>
          </Box>
          {menuItem?.submenu && menuItem?.submenu.length > 0 ? (
            <Flex whiteSpace="nowrap" ml="auto">
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  onToggle();
                }}
                p="2px !important"
                size="sm"
                overflow="hidden"
                whiteSpace="nowrap"
                mr="-8px"
                bg="none"
                marginLeft="auto"
                color="inherit"
                transition="color 0s"
                _hover={{
                  backgroundColor: 'none',
                }}
                _active={{
                  backgroundColor: 'none',
                }}
              >
                {isOpen ? <IoChevronUp fontWeight="bold" /> : <IoChevronDown />}
              </Button>
            </Flex>
          ) : null}
        </Flex>
      </Link>
      {menuItem?.submenu && menuItem?.submenu.length > 0 ? (
        <>
          <Collapse dir="up" in={isOpen}>
            {menuItem.submenu
              ?.filter(({ isShown }) => !isShown || isShown(accountInfo))
              .map((submenu, index) => (
                <SubmenuItem
                  key={`menu-item-${submenu}-${index}`}
                  submenu={submenu}
                  submenuIndex={index}
                  parentIndex={menuIndex}
                />
              ))}
          </Collapse>
        </>
      ) : null}
    </>
  );
};

export default SidebarItem;

const SubmenuItem = ({
  submenu,
  submenuIndex,
  parentIndex,
}: {
  submenu: MenuItem;
  submenuIndex: number;
  parentIndex: number;
}) => {
  const { pathname } = useRouter();
  const router = pathname || '';
  const { colorMode } = useColorMode();
  const {
    isNavbarOpen,
    markerActive,
    markerTemp,
    setMarkerActive,
    setMarkerTemp,
    navbarToggler,
    parentActive,
    setParentActive,
    setParentTemp,
  } = useContext(AppSettingContext);

  useEffect(() => {
    if (router == submenu.url) {
      setMarkerTemp(markerActive);
      setMarkerActive(submenuIndex);
      setParentTemp(parentActive);
      setParentActive(parentIndex);
    } else if (router == '/' + submenu.url.split('/')[1]) {
      setParentTemp(parentActive);
      setParentActive(parentIndex);
      if (parentIndex > parentActive) {
        setMarkerTemp(10);
        setMarkerActive(10);
      } else if (parentIndex) {
        setMarkerTemp(-1);
        setMarkerActive(-1);
      }
    }
  }, [router, markerActive]);

  const markerVariants = {
    in: {
      height: '12px',
      width: '12px',
      opacity: 1,
      transition: {
        duration: 0.26,
        delay: 0.215,
        ease: 'easeOut',
        opacity: { duration: 0 },
      },
      top: '14px',
    },
    out: {
      height: '12px',
      width: '12px',
      opacity: 0,
      transition: {
        duration: 0,
      },
      top: '14px',
    },
    outTop: {
      height: '22px',
      width: '12px',
      opacity: 0,
      top: '-34px',
      transition: {
        duration: 0.26,
        ease: [0.755, 0.08, 0.325, 0.96],
        opacity: { delay: 0.23, duration: 0 },
      },
    },
    outBot: {
      height: '22px',
      width: '12px',
      opacity: 0,
      top: '34px',
      transition: {
        duration: 0.26,
        ease: [0.755, 0.08, 0.325, 0.96],
        opacity: { delay: 0.23, duration: 0 },
      },
    },
    offTop: {
      height: '22px',
      width: '12px',
      opacity: 0,
      transition: { duration: 0.2, ease: easeIn },
      top: '64px',
    },

    offBot: {
      height: '22px',
      width: '12px',
      opacity: 0,
      transition: { duration: 0.2, ease: easeIn },
      top: '-34px',
    },
  };
  const t = useTranslations('Common.modules');
  const { colorPref } = useContext(AppSettingContext);
  const isActive =
    submenu.url === router ||
    (router.startsWith(submenu.url) &&
      router.charAt(submenu.url.length) === '/');

  return (
    <Link
      as={NextLink}
      href={submenu.url}
      onClick={isNavbarOpen ? navbarToggler : undefined}
    >
      <Flex
        as={motion.div}
        className="sidebar__item"
        data-group="sidebar--item"
        _hover={{
          color: isActive
            ? colorMode == 'light'
              ? `${colorPref}.700`
              : `${colorPref}Dim.200`
            : colorMode == 'light'
            ? `${colorPref}.700`
            : `${colorPref}Dim.200`,
          bg: isActive
            ? colorMode == 'light'
              ? `${colorPref}.100`
              : `${colorPref}Dim.800`
            : colorMode == 'light'
            ? `${colorPref}.50`
            : `${colorPref}Dim.900`,
        }}
        pos="relative"
        alignItems="center"
        h="44px"
        my="3px"
        px="14px"
        borderRadius="10px"
        fontSize="15px"
        color={
          isActive
            ? colorMode == 'light'
              ? `${colorPref}.700`
              : `${colorPref}Dim.200`
            : colorMode == 'light'
            ? 'gray.600'
            : 'gray.500'
        }
        bg={
          isActive
            ? colorMode == 'light'
              ? `${colorPref}.100`
              : `${colorPref}Dim.800`
            : 'transparent'
        }
        fontWeight={isActive ? '600' : '500'}
        overflow="hidden"
        transition="all 0.2s"
        cursor="pointer"
      >
        <motion.div
          style={{
            opacity: '0',
            position: 'absolute',
            left: '16px',
            top: '0px',
            height: '12px',
            width: '12px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: `2px solid ${
              colorMode == 'light'
                ? `var(--chakra-colors-${colorPref}-600)`
                : `var(--chakra-colors-${colorPref}Dim-600)`
            }`,
          }}
          variants={markerVariants}
          animate={
            parentActive == parentIndex
              ? markerActive == submenuIndex
                ? 'in'
                : markerTemp == submenuIndex
                ? markerActive > submenuIndex
                  ? 'outTop'
                  : 'outBot'
                : markerActive > submenuIndex
                ? 'offTop'
                : 'offBot'
              : parentActive > parentIndex
              ? 'offTop'
              : 'offBot'
          }
        ></motion.div>
        <Flex
          className="sidebar__icon"
          justifyContent="center"
          alignItems="center"
          w="22px"
          h="22px"
          mr="14px"
          data-group="sidebar--item"
        ></Flex>
        <Box
          display={{ base: 'block', m: 'none', d: 'block' }}
          mr="auto"
          w="full"
        >
          <Text noOfLines={2} title={t(`${submenu.name}.title`)}>
            {t(`${submenu.name}.title`)}
          </Text>
        </Box>
      </Flex>
    </Link>
  );
};
