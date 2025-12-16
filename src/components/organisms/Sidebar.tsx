import { menuItem, menuItemMaster, menuItemInsights } from '@/data/menu';
import AppSettingContext from '@/providers/AppSettingProvider';
import { Box, Flex, Text, useColorMode } from '@chakra-ui/react';
import { useContext } from 'react';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import { MyITSLogo } from '../atoms/IconsMade';
import SidebarItem from '../molecules/SidebarItem';
import PermissionAPI from '@/modules/admin/permissions/services/PermissionAPI';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const { isNavbarOpen, navbarToggler } = useContext(AppSettingContext);
  const { colorMode } = useColorMode();
  const accountInfo = useContext(AccountInfoContext);

  // Permission logic
  const [allowedUrls, setAllowedUrls] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  useEffect(() => {
    const permissionAPI = new PermissionAPI();

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

  const SectionLabel = ({ children }: { children: string }) => (
    <Text
      fontSize="11px"
      fontWeight="600"
      lineHeight="1"
      mb="10px"
      mt="24px"
      px="16px"
      color={colorMode === 'light' ? 'gray.400' : 'gray.500'}
      textTransform="uppercase"
      letterSpacing="0.08em"
    >
      {children}
    </Text>
  );

  return (
    <Box pos="fixed" top="16px" left="24px" bottom="16px" zIndex="999">
      <Flex
        className="sidebar"
        w="320px"
        h="100%"
        flexDir="column"
        bg={colorMode === 'light' ? 'white' : 'whiteAlpha.50'}
        borderRadius="20px"
        border="1px solid"
        borderColor={colorMode === 'light' ? 'transparent' : 'whiteAlpha.100'}
        boxShadow={
          colorMode === 'light'
            ? '0 4px 24px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)'
            : '0 4px 24px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)'
        }
        overflow="hidden"
      >
        {/* Logo Header */}
        <Flex px="24px" py="24px" alignItems="center" gap={3}>
          <Box
            p={2.5}
            borderRadius="14px"
            bg={colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100'}
          >
            <MyITSLogo
              w="28px"
              h="28px"
              color={colorMode === 'light' ? 'gray.800' : 'white'}
            />
          </Box>
          <Box flex={1} minW={0}>
            <Text
              fontSize="16px"
              fontWeight="700"
              color={colorMode === 'light' ? 'gray.900' : 'white'}
              letterSpacing="-0.02em"
              lineHeight={1.2}
              noOfLines={1}
            >
              {process.env.NEXT_PUBLIC_APP_NAME || 'Dashboard'}
            </Text>
            <Text
              fontSize="12px"
              fontWeight="500"
              color={colorMode === 'light' ? 'gray.400' : 'gray.500'}
            >
              Admin Panel
            </Text>
          </Box>
        </Flex>

        {/* Menu Content */}
        <Box
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          px="24px"
          pb="24px"
          sx={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: colorMode === 'light' ? 'gray.200' : 'whiteAlpha.200',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: colorMode === 'light' ? 'gray.300' : 'whiteAlpha.300',
            },
          }}
        >
          {/* Transaksi Section */}
          {(() => {
            const filteredMenuItems = menuItem
              .filter(({ isShown }) => !isShown || isShown(accountInfo))
              .filter((item) => hasAccess(item.url));

            if (filteredMenuItems.length === 0) return null;

            return (
              <Box>
                <SectionLabel>Transaksi</SectionLabel>
                {filteredMenuItems.map((item, index) => (
                  <SidebarItem
                    menuItem={item}
                    menuIndex={index}
                    key={'main-menu-item-' + index}
                  />
                ))}
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
              <Box>
                <SectionLabel>Master</SectionLabel>
                {filteredMasterItems.map((item, index) => (
                  <SidebarItem
                    menuItem={item}
                    menuIndex={index}
                    key={'master-menu-item-' + index}
                  />
                ))}
              </Box>
            );
          })()}

          {/* Insights Section (if any) */}
          {(() => {
            const filteredInsightsItems = menuItemInsights.filter((item) =>
              hasAccess(item.url)
            );

            if (filteredInsightsItems.length === 0) return null;

            return (
              <Box>
                <SectionLabel>Insights</SectionLabel>
                {filteredInsightsItems.map((item, index) => (
                  <SidebarItem
                    menuItem={item}
                    menuIndex={index}
                    key={'insights-menu-item-' + index}
                  />
                ))}
              </Box>
            );
          })()}
        </Box>
      </Flex>
    </Box>
  );
};

export default Sidebar;
