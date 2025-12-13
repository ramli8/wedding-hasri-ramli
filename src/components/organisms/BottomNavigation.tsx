import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  useColorMode,
  HStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Avatar,
  Button,
  Divider,
  useDisclosure,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { menuItem, menuItemMaster, menuItemInsights } from '@/data/menu';
import { MenuItem } from '@/types/menu-item';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import AppSettingContext from '@/providers/AppSettingProvider';
import PermissionAPI from '@/modules/admin/permissions/services/PermissionAPI';
import AuthAPI from '@/modules/auth/services/AuthAPI';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const BottomNavigation = () => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const router = useRouter();
  const accountInfo = useContext(AccountInfoContext);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRole, setSelectedRole] = useState(accountInfo?.activeRole || '');

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
    ...menuItem.filter(({ isShown }) => !isShown || isShown(accountInfo)).filter((item) => hasAccess(item.url)),
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
    toast({ title: 'Role berhasil diganti', status: 'success', duration: 2000 });
    onClose();
    window.location.href = '/admin/dashboard';
  };

  const handleLogout = () => {
    onClose();
    MySwal.fire({
      title: 'Logout?',
      text: "Apakah Anda yakin ingin keluar?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      background: colorMode === 'light' ? '#fff' : '#1A202C',
      color: colorMode === 'light' ? '#1A202C' : '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        const authAPI = new AuthAPI();
        authAPI.logout();
        router.push('/admin/login');
      }
    });
  };

  const activeRoleName = accountInfo?.role?.find(r => r.id === accountInfo?.activeRole)?.name || 'Role';

  const NavItem = ({ item }: { item: MenuItem }) => {
    const active = isActive(item.url);
    
    // Dynamic colors based on theme
    const activeColor = colorMode === 'light' 
      ? `var(--chakra-colors-${colorPref}-700)`
      : `var(--chakra-colors-${colorPref}Dim-200)`;
    
    const inactiveColor = colorMode === 'light' ? '#808191' : '#808191';
    
    return (
      <VStack
        spacing={0.5}
        onClick={() => handleNavClick(item.url)}
        cursor="pointer"
        minW="70px"
        py={2}
        px={1}
        position="relative"
        flexShrink={0}
      >
        <Box position="relative">
          <MaterialIcon
            name={item.icon}
            size={24}
            color={active ? activeColor : inactiveColor}
          />
          {active && (
            <Box
              position="absolute"
              top="-4px"
              left="50%"
              transform="translateX(-50%)"
              w="4px"
              h="4px"
              borderRadius="full"
              bg={activeColor}
            />
          )}
        </Box>
        <Text
          fontSize="10px"
          fontWeight={active ? '600' : '500'}
          color={active ? activeColor : inactiveColor}
          textTransform="capitalize"
          textAlign="center"
          noOfLines={1}
        >
          {item.name.replace('_', ' ')}
        </Text>
      </VStack>
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
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderTop="1px solid"
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
        boxShadow="0 -2px 10px rgba(0, 0, 0, 0.05)"
      >
        <Box
          overflowX="auto"
          overflowY="hidden"
          sx={{
            '&::-webkit-scrollbar': {
              height: '0px',
            },
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <HStack spacing={0} h="64px" px={2} w="fit-content" minW="100%">
            {allMenuItems.map((item, index) => (
              <NavItem key={index} item={item} />
            ))}
            
            {/* Profile Menu Item - Opens Modal */}
            <VStack
              spacing={0.5}
              onClick={handleOpenModal}
              cursor="pointer"
              minW="70px"
              py={2}
              px={1}
              position="relative"
              flexShrink={0}
            >
              <Box position="relative">
                <MaterialIcon
                  name="account_circle"
                  size={24}
                  color={colorMode === 'light' ? '#808191' : '#808191'}
                />
              </Box>
              <Text
                fontSize="10px"
                fontWeight="500"
                color={colorMode === 'light' ? '#808191' : '#808191'}
                textTransform="capitalize"
                textAlign="center"
                noOfLines={1}
              >
                Profile
              </Text>
            </VStack>
          </HStack>
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
                icon={<MaterialIcon name="person" size={40} />}
              />
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="bold" color={colorMode === 'light' ? 'gray.800' : 'white'}>
                  {accountInfo?.name || 'User'}
                </Text>
                <Text fontSize="sm" color={colorMode === 'light' ? 'gray.500' : 'gray.400'}>
                  {activeRoleName}
                </Text>
              </VStack>
            </VStack>

            <Divider mb={4} />

            {/* Role Selector */}
            {accountInfo?.role && accountInfo.role.length > 1 && (
              <Box mb={4}>
                <Text fontSize="sm" fontWeight="600" mb={2} color={colorMode === 'light' ? 'gray.700' : 'gray.300'}>
                  Ganti Role:
                </Text>
                <VStack spacing={2} align="stretch">
                  {accountInfo.role.map((role) => {
                    const isActive = role.id === selectedRole;
                    const activeColor = colorMode === 'light'
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
                        bg={isActive
                          ? (colorMode === 'light' ? `${colorPref}.50` : `${colorPref}Dim.900`)
                          : 'transparent'
                        }
                        border="1px solid"
                        borderColor={isActive
                          ? activeColor
                          : (colorMode === 'light' ? 'gray.300' : 'gray.600')
                        }
                        transition="all 0.2s"
                        _hover={{
                          borderColor: activeColor,
                          bg: isActive
                            ? (colorMode === 'light' ? `${colorPref}.50` : `${colorPref}Dim.900`)
                            : (colorMode === 'light' ? 'gray.100' : 'gray.700'),
                        }}
                      >
                        <Flex align="center" justify="space-between">
                          <Text
                            fontSize="sm"
                            fontWeight={isActive ? '600' : '500'}
                            color={isActive
                              ? activeColor
                              : (colorMode === 'light' ? 'gray.700' : 'gray.300')
                            }
                          >
                            {role.name}
                          </Text>
                          {isActive && (
                            <MaterialIcon name="check_circle" size={20} color={activeColor} />
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
                  leftIcon={<MaterialIcon name="swap_horiz" size={18} />}
                >
                  Ganti Role
                </Button>
              )}
              <Button
                width="100%"
                variant="ghost"
                color="red.500"
                onClick={handleLogout}
                leftIcon={<MaterialIcon name="logout" size={18} />}
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
