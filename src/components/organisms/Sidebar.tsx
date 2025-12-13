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
        w="280px"
        minW="280px"
        pos="fixed"
        flexShrink="0"
        zIndex="999"
        display="flex"
        h="100vh"
        padding="140px 0 0px"
        bg={colorMode == 'light' ? 'gray.50' : '#222222'}
        borderRight="1px solid"
        borderColor={colorMode == 'light' ? 'gray.100' : 'gray.700'}
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
          borderBottom={{
            base: colorMode == 'light' ? '1px solid' : '1px solid',
            m: 'unset',
          }}
          borderColor={colorMode == 'light' ? 'gray.100' : 'gray.700'}
        >

          <Flex
            justifyContent="center"
            alignItems="center"
            maxW="184px"
            mt="8px"
          >
            <Box>
              <Center>
                <MyITSLogo
                  w={{ base: '68px', d: '86px' }}
                  h="auto"
                  color={colorMode === 'light' ? '#013880' : 'white'}
                />
              </Center>
              <Center>
                <Text
                  fontSize={{ base: '13px', d: '16px' }}
                  fontWeight={600}
                  textAlign="center"
                  lineHeight={1.2}
                  mt="4px"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  maxW={{ base: '96px', d: 'full' }}
                  title={process.env.NEXT_PUBLIC_APP_NAME}
                >
                  {process.env.NEXT_PUBLIC_APP_NAME}
                </Text>
              </Center>
            </Box>
          </Flex>
        </Box>
        <Box
          className="sidebar__wrapper"
          maxH="100%"
          padding="0 20px 30px"
          overflowY="auto"
          sx={{
            '::-webkit-scrollbar': {
              width: '20px',
              height: '20px',
              backgroundColor: 'transparent',
            },
            '::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '::-webkit-scrollbar-thumb': {
              backgroundColor: colorMode == 'light' ? '#dadada' : '#313131',
              borderRadius: '20px',
              border: '6px solid transparent',
              backgroundClip: 'content-box',
            },
            '::-webkit-scrollbar-thumb:hover': {
              backgroundColor: colorMode == 'light' ? '#b3b3b3' : '#393939',
            },
          }}
          overflowX="hidden"
        >
          <Box
            className="sidebar__inner"
            width="240px"
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
