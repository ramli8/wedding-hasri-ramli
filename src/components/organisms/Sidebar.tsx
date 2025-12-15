import { menuItem, menuItemMaster, menuItemInsights } from '@/data/menu';
import AppSettingContext from '@/providers/AppSettingProvider';
import {
  Box,
  Button,
  Center,
  Flex,
  Icon,
  Link,
  Text,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react';
import { useContext } from 'react';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import { CloseIconMade, MyITSLogo } from '../atoms/IconsMade';
import SidebarItem from '../molecules/SidebarItem';
import PermissionAPI from '@/modules/admin/permissions/services/PermissionAPI';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const { isNavbarOpen, navbarToggler } = useContext(AppSettingContext);

  const { colorMode } = useColorMode();

  // Get real account info from context
  const accountInfo = useContext(AccountInfoContext);

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

        // Try to get permissions from user's active role
        if (accountInfo?.activeRole) {
          const perms = await permissionAPI.getRolePermissions(
            accountInfo.activeRole
          );
          urls = perms.map((p) => p.url_pattern);
        }

        // If no permissions found, try to get default role permissions
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
        // Cache the permissions
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
    // If still loading permissions, allow access temporarily
    if (isLoadingPermissions) return true;

    // If no permissions after loading, deny access
    if (allowedUrls.length === 0) return false;

    // Check for wildcard (full access)
    if (allowedUrls.includes('*')) return true;

    // Check for exact match or pattern match
    return allowedUrls.some((pattern) => {
      // Exact match
      if (pattern === url) return true;

      // Wildcard pattern (e.g., /admin/*)
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return url.startsWith(prefix);
      }

      return false;
    });
  };

  return (
    <>
      <Flex
        className="sidebar"
        w="320px"
        minW="320px"
        pos="fixed"
        flexShrink="0"
        zIndex="999"
        display="flex"
        h="100vh"
        padding="140px 0 0px"
        bg={colorMode == 'light' ? 'white' : '#1a1a1a'}
        borderRight="1px solid"
        borderColor={colorMode == 'light' ? 'gray.200' : 'rgba(255,255,255,0.08)'}
        transition="transform .25s, width .25s"
      >
        <Box
          className="sidebar__top"
          pos="absolute"
          top="0"
          left="0"
          right="0"
          display="flex"
          justifyContent="center"
          alignContent="center"
          h={{ base: '96px', m: '140px' }}
          borderBottom="none"
        >

          <Flex
            justifyContent="center"
            alignItems="center"
            maxW="280px"
            py="24px"
            px="24px"
          >
            <Box w="full">
              <Flex alignItems="center" gap={3}>
                <Box
                  p={2}
                  borderRadius="12px"
                  bg={colorMode === 'light' ? 'blue.50' : 'whiteAlpha.100'}
                >
                  <MyITSLogo
                    w="36px"
                    h="36px"
                    color={colorMode === 'light' ? '#013880' : '#3b82f6'}
                  />
                </Box>
                <Box flex={1} minW={0}>
                  <Text
                    fontSize="18px"
                    fontWeight="700"
                    color={colorMode === 'light' ? 'gray.900' : 'white'}
                    letterSpacing="tight"
                    lineHeight={1.2}
                    noOfLines={1}
                  >
                    {process.env.NEXT_PUBLIC_APP_NAME || 'Dashboard'}
                  </Text>
                  <Text
                    fontSize="12px"
                    fontWeight="500"
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    letterSpacing="wide"
                    textTransform="uppercase"
                  >
                    Admin Panel
                  </Text>
                </Box>
              </Flex>
            </Box>
          </Flex>
        </Box>
        <Box
          className="sidebar__wrapper"
          maxH="100%"
          padding="0 24px 30px"
          overflowY="auto"
          sx={{
            '::-webkit-scrollbar': {
              width: '16px',
              height: '16px',
              backgroundColor: 'transparent',
            },
            '::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
              margin: '8px',
            },
            '::-webkit-scrollbar-thumb': {
              backgroundColor: colorMode == 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
              borderRadius: '12px',
              border: '4px solid transparent',
              backgroundClip: 'content-box',
            },
            '::-webkit-scrollbar-thumb:hover': {
              backgroundColor: colorMode == 'light' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)',
            },
          }}
          overflowX="hidden"
        >
          <Box
            className="sidebar__inner"
            width="280px"
            overflow="hidden"
            transition="width .25s"
          >
            <Box className="sidebar__list" mb="20px">
              {/* Menu Section */}
              {(() => {
                const filteredMenuItems = menuItem
                  .filter(({ isShown }) => !isShown || isShown(accountInfo))
                  .filter((item) => hasAccess(item.url));

                if (filteredMenuItems.length === 0) return null;

                return (
                  <Box
                    className="sidebar__group"
                    _notLast={{
                      position: 'relative',
                      marginBottom: '32px',
                      paddingBottom: '24px',
                      _before: {
                        content: '""',
                        position: 'absolute',
                        left: '20px',
                        right: '20px',
                        bottom: 0,
                        height: '1px',
                        background:
                          colorMode == 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                      },
                    }}
                  >
                    <Box
                      className="sidebar__caption"
                      fontSize="11px"
                      fontWeight="600"
                      lineHeight="1"
                      mb="12px"
                      pl="20px"
                      color={colorMode === 'light' ? 'gray.500' : 'gray.500'}
                      textTransform="uppercase"
                      letterSpacing="wider"
                      transition=".25s"
                    >
                      Menu
                    </Box>
                    <Box className="sidebar__menu">
                      {filteredMenuItems.map((item, index) => (
                        <SidebarItem
                          menuItem={item}
                          menuIndex={index}
                          key={'main-menu-item-' + index}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })()}
              {/* Master Section */}
              {(() => {
                const filteredMasterItems = menuItemMaster.filter((item) =>
                  hasAccess(item.url)
                );

                if (filteredMasterItems.length === 0) return null;

                return (
                  <Box
                    className="sidebar__group"
                    _notLast={{
                      position: 'relative',
                      marginBottom: '32px',
                      paddingBottom: '24px',
                      _before: {
                        content: '""',
                        position: 'absolute',
                        left: '20px',
                        right: '20px',
                        bottom: 0,
                        height: '1px',
                        background:
                          colorMode == 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                      },
                    }}
                  >
                    <Box
                      className="sidebar__caption"
                      fontSize="11px"
                      fontWeight="600"
                      lineHeight="1"
                      mb="12px"
                      pl="20px"
                      color={colorMode === 'light' ? 'gray.500' : 'gray.500'}
                      textTransform="uppercase"
                      letterSpacing="wider"
                      transition=".25s"
                    >
                      Master
                    </Box>
                    <Box className="sidebar__menu">
                      {filteredMasterItems.map((item, index) => (
                        <SidebarItem
                          menuItem={item}
                          menuIndex={index}
                          key={'master-menu-item-' + index}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })()}
              {/* Insights Section */}
              {(() => {
                const filteredInsightsItems = menuItemInsights.filter((item) =>
                  hasAccess(item.url)
                );

                if (filteredInsightsItems.length === 0) return null;

                return (
                  <Box
                    className="sidebar__group"
                    _notLast={{
                      position: 'relative',
                      marginBottom: '40px',
                      paddingBottom: '30px',
                      _before: {
                        content: '""',
                        position: 'absolute',
                        left: '20px',
                        right: '20px',
                        bottom: 0,
                        height: '1px',
                        background:
                          colorMode == 'light' ? '#e8eaee' : '#2a2a2a',
                      },
                    }}
                  >
                    <Box
                      className="sidebar__caption"
                      fontSize="12px"
                      fontWeight="500"
                      lineHeight="1.33333333"
                      mb="16px"
                      pl="20px"
                      color="#808191"
                      transition=".25s"
                    >
                      Insights
                    </Box>
                    <Box className="sidebar__menu">
                      {filteredInsightsItems.map((item, index) => (
                        <SidebarItem
                          menuItem={item}
                          menuIndex={index}
                          key={'insights-menu-item-' + index}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })()}
            </Box>
          </Box>
        </Box>
      </Flex>
    </>
  );
};

export default Sidebar;
