import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  useColorMode,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Avatar,
  Button,
  Divider,
  useDisclosure,
  Icon,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiUser, FiLogOut, FiRepeat, FiCheckCircle } from 'react-icons/fi';
import { menuItem, menuItemMaster, menuItemInsights } from '@/data/menu';
import { MenuItem } from '@/types/menu-item';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import AppSettingContext from '@/providers/AppSettingProvider';
import PermissionAPI from '@/modules/admin/permissions/services/PermissionAPI';
import AuthAPI from '@/modules/auth/services/AuthAPI';
import { showLogoutAlert } from '@/utils/sweetalert';

const BottomNavigation = () => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const router = useRouter();
  const accountInfo = useContext(AccountInfoContext);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRole, setSelectedRole] = useState(
    accountInfo?.activeRole || ''
  );

  // Update selectedRole when modal opens to reflect current active role
  const handleOpenModal = () => {
    setSelectedRole(accountInfo?.activeRole || '');
    onOpen();
  };

  // Permission logic
  const [allowedUrls, setAllowedUrls] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  useEffect(() => {
    const permissionAPI = new PermissionAPI();

    // Try to load from cache first
    const cached = localStorage.getItem('cached_permissions');
    if (cached) {
      try {
        setAllowedUrls(JSON.parse(cached));
        setIsLoadingPermissions(false);
      } catch (e) {
        console.error('Failed to parse cached permissions', e);
      }
    }

    const fetchPermissions = async () => {
      try {
        let urls: string[] = [];

        if (accountInfo?.activeRole) {
          const perms = await permissionAPI.getRolePermissions(
            accountInfo.activeRole
          );
          urls = perms.map((p) => p.url_pattern);
        }

        if (urls.length === 0) {
          const RoleAPI = (
            await import('@/modules/admin/roles/services/RoleAPI')
          ).default;
          const roleAPI = new RoleAPI();
          const defaultRole = await roleAPI.getDefaultRole();

          if (defaultRole) {
            const perms = await permissionAPI.getRolePermissions(
              defaultRole.id
            );
            urls = perms.map((p) => p.url_pattern);
          }
        }

        setAllowedUrls(urls);
        setIsLoadingPermissions(false);
        if (urls.length > 0) {
          localStorage.setItem('cached_permissions', JSON.stringify(urls));
        }
      } catch (e) {
        console.error('Failed to fetch permissions', e);
        setIsLoadingPermissions(false);
      }
    };
    fetchPermissions();
  }, [accountInfo?.activeRole]);

  const hasAccess = (url: string) => {
    if (isLoadingPermissions) return true;
    if (allowedUrls.length === 0) return false;
    if (allowedUrls.includes('*')) return true;

    return allowedUrls.some((pattern) => {
      if (pattern === url) return true;
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return url.startsWith(prefix);
      }
      return false;
    });
  };

  // All menu items combined
  const allMenuItems = [
    ...menuItem
      .filter(({ isShown }) => !isShown || isShown(accountInfo))
      .filter((item) => hasAccess(item.url)),
    ...menuItemMaster.filter((item) => hasAccess(item.url)),
    ...menuItemInsights.filter((item) => hasAccess(item.url)),
  ];

  const isActive = (url: string) => {
    return router.pathname === url || router.pathname.startsWith(url + '/');
  };

  const handleNavClick = (url: string) => {
    router.push(url);
  };

  const handleSwitchRole = () => {
    if (!selectedRole) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_role_id', selectedRole);
    }
    toast({
      title: 'Role berhasil diganti',
      status: 'success',
      duration: 2000,
    });
    onClose();
    window.location.href = '/admin/dashboard';
  };

  const handleLogout = async () => {
    onClose();
    const result = await showLogoutAlert(colorMode);
    if (result.isConfirmed) {
      const authAPI = new AuthAPI();
      authAPI.logout();
      router.push('/admin/login');
    }
  };

  const activeRoleName =
    accountInfo?.role?.find((r) => r.id === accountInfo?.activeRole)?.name ||
    'Role';

  const NavItem = ({ item }: { item: MenuItem }) => {
    const active = isActive(item.url);

    // Dynamic colors based on theme - Subtle background
    const activeBg =
      colorMode === 'light' ? `${colorPref}.50` : `${colorPref}Dim.900`;

    const activeIconColor =
      colorMode === 'light' ? `${colorPref}.600` : `${colorPref}Dim.300`;

    const activeTextColor =
      colorMode === 'light' ? `${colorPref}.700` : `${colorPref}Dim.200`;

    const inactiveColor = colorMode === 'light' ? 'gray.500' : 'gray.400';

    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap={1.5}
        onClick={() => handleNavClick(item.url)}
        cursor="pointer"
        minW="72px"
        h="100%"
        position="relative"
        transition="all 0.3s ease"
        flexShrink={0}
      >
        <Box
          position="relative"
          w="48px"
          h="48px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="16px"
          bg={active ? activeBg : 'transparent'}
          transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          transform={active ? 'scale(1)' : 'scale(0.92)'}
          boxShadow={
            active
              ? colorMode === 'light'
                ? `0 2px 8px var(--chakra-colors-${colorPref}-100)`
                : `0 2px 8px rgba(0, 0, 0, 0.3)`
              : 'none'
          }
          _hover={{
            transform: active ? 'scale(1.05)' : 'scale(0.98)',
          }}
        >
          {/* Use Chakra Icon component passing the icon component from item.icon */}
          <Icon
            as={item.icon}
            boxSize={6}
            color={active ? activeIconColor : inactiveColor}
          />
        </Box>

        <Text
          fontSize="10px"
          fontWeight={active ? '700' : '500'}
          color={active ? activeTextColor : inactiveColor}
          textAlign="center"
          noOfLines={1}
          maxW="68px"
          textTransform="capitalize"
        >
          {item.name.replace('_', ' ')}
        </Text>
      </Flex>
    );
  };

  return (
    <>
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={1000}
        display={{ base: 'block', xl: 'none' }}
        bg={colorMode === 'light' ? 'gray.50' : '#222222'}
        borderTopRadius="24px"
        borderTop="1px solid"
        borderColor={
          colorMode === 'light'
            ? 'rgba(229, 231, 235, 0.6)'
            : 'rgba(55, 65, 81, 0.4)'
        }
        boxShadow={
          colorMode === 'light'
            ? '0 -1px 2px rgba(0, 0, 0, 0.03), 0 -4px 16px rgba(0, 0, 0, 0.04)'
            : '0 -1px 2px rgba(0, 0, 0, 0.2), 0 -4px 16px rgba(0, 0, 0, 0.3)'
        }
        pb="env(safe-area-inset-bottom)"
      >
        <Box
          overflowX="auto"
          overflowY="hidden"
          sx={{
            '&::-webkit-scrollbar': {
              height: '0px',
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <Flex
            h="76px"
            align="center"
            gap={1}
            px={3}
            py={2}
            w="fit-content"
            minW="100%"
            justify="center"
          >
            {allMenuItems.map((item, index) => (
              <NavItem key={index} item={item} />
            ))}

            {/* Profile Menu Item - Pill Design */}
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap={1.5}
              onClick={handleOpenModal}
              cursor="pointer"
              minW="72px"
              h="100%"
              position="relative"
              transition="all 0.3s ease"
              flexShrink={0}
            >
              <Box
                position="relative"
                w="48px"
                h="48px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="16px"
                bg="transparent"
                transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                transform="scale(0.92)"
                _hover={{
                  transform: 'scale(0.98)',
                }}
              >
                <Icon
                  as={FiUser}
                  boxSize={6}
                  color={colorMode === 'light' ? '#6B7280' : '#9CA3AF'}
                />
              </Box>

              <Text
                fontSize="10px"
                fontWeight="500"
                color={colorMode === 'light' ? '#6B7280' : '#9CA3AF'}
                textAlign="center"
                noOfLines={1}
                maxW="68px"
                textTransform="capitalize"
              >
                Profile
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Box>

      {/* Profile Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent bg={colorMode === 'light' ? 'white' : 'gray.800'} mx={4}>
          <ModalHeader>Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {/* User Info */}
            <VStack spacing={4} align="center" mb={6}>
              <Avatar
                size="xl"
                name={accountInfo?.name}
                bgGradient="linear(to-r, blue.400, purple.500)"
                color="white"
                icon={<Icon as={FiUser} boxSize={10} />}
              />
              <VStack spacing={0}>
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color={colorMode === 'light' ? 'gray.800' : 'white'}
                >
                  {accountInfo?.name || 'User'}
                </Text>
                <Text
                  fontSize="sm"
                  color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                >
                  {activeRoleName}
                </Text>
              </VStack>
            </VStack>

            <Divider mb={4} />

            {/* Role Selector */}
            {accountInfo?.role && accountInfo.role.length > 1 && (
              <Box mb={4}>
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  mb={2}
                  color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                >
                  Ganti Role:
                </Text>
                <VStack spacing={2} align="stretch">
                  {accountInfo.role.map((role) => {
                    const isActive = role.id === selectedRole;
                    const activeColor =
                      colorMode === 'light'
                        ? `var(--chakra-colors-${colorPref}-600)`
                        : `var(--chakra-colors-${colorPref}Dim-200)`;

                    return (
                      <Box
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        cursor="pointer"
                        px={4}
                        py={3}
                        borderRadius="md"
                        bg={
                          isActive
                            ? colorMode === 'light'
                              ? `${colorPref}.50`
                              : `${colorPref}Dim.900`
                            : 'transparent'
                        }
                        border="1px solid"
                        borderColor={
                          isActive
                            ? activeColor
                            : colorMode === 'light'
                            ? 'gray.300'
                            : 'gray.600'
                        }
                        transition="all 0.2s"
                        _hover={{
                          borderColor: activeColor,
                          bg: isActive
                            ? colorMode === 'light'
                              ? `${colorPref}.50`
                              : `${colorPref}Dim.900`
                            : colorMode === 'light'
                            ? 'gray.100'
                            : 'gray.700',
                        }}
                      >
                        <Flex align="center" justify="space-between">
                          <Text
                            fontSize="sm"
                            fontWeight={isActive ? '600' : '500'}
                            color={
                              isActive
                                ? activeColor
                                : colorMode === 'light'
                                ? 'gray.700'
                                : 'gray.300'
                            }
                          >
                            {role.name}
                          </Text>
                          {isActive && (
                            <Icon
                              as={FiCheckCircle}
                              boxSize={5}
                              color={activeColor}
                            />
                          )}
                        </Flex>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            )}

            {/* Action Buttons */}
            <VStack spacing={2} mt={6}>
              {selectedRole !== accountInfo?.activeRole && (
                <Button
                  width="100%"
                  colorScheme={colorPref}
                  onClick={handleSwitchRole}
                  leftIcon={<Icon as={FiRepeat} boxSize={4} />}
                >
                  Ganti Role
                </Button>
              )}
              <Button
                width="100%"
                variant="ghost"
                color="red.500"
                onClick={handleLogout}
                leftIcon={<Icon as={FiLogOut} boxSize={4} />}
                _hover={{
                  bg: 'red.50',
                  color: 'red.600',
                }}
                _active={{
                  bg: 'red.100',
                }}
              >
                Logout
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default BottomNavigation;
