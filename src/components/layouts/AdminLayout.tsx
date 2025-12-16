import React, { ReactNode, useEffect } from 'react';
import { Flex, Box, useColorMode, IconButton, Text } from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from '@/components/organisms/Sidebar';
import BottomNavigation from '@/components/organisms/BottomNavigation';
import AppSettingContext from '@/providers/AppSettingProvider';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import { useContext } from 'react';
import UserProfileActions from '../molecules/UserProfileActions';
import {
  enterFullscreen,
  shouldAutoFullscreen,
  isMobileOrTablet,
  isFullscreenActive,
} from '@/utils/fullscreen';
import { showFullscreenAlert } from '@/utils/sweetalert';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { colorMode } = useColorMode();
  const { isNavbarOpen, navbarToggler } = useContext(AppSettingContext);

  // Fullscreen will be triggered by autoplay music on homepage (/)
  // No automatic triggers here

  return (
    <Flex minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      {/* Sidebar - Hidden on mobile/tablet, visible on laptop+ */}
      <Box display={{ base: 'none', xl: 'block' }}>
        <Sidebar />
      </Box>

      <Box
        flex="1"
        ml={{
          base: '0',
          xl: '368px',
        }}
        transition="margin-left 0.3s ease"
        minH="100vh"
        w="100%"
        pb={{ base: '80px', xl: '0' }} // Add padding bottom for mobile/tablet to prevent content hidden by bottom nav
      >
        {/* Mobile/Tablet Header - REMOVED for fullscreen experience */}
        {children}
      </Box>

      {/* Bottom Navigation - Mobile & Tablet only */}
      <BottomNavigation />
    </Flex>
  );
};

export default AdminLayout;
