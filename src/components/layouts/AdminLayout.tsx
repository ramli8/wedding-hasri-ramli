import React, { ReactNode } from 'react';
import { Flex, Box, useColorMode, IconButton } from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from '@/components/organisms/Sidebar';
import AppSettingContext from '@/providers/AppSettingProvider';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import { useContext } from 'react';
import UserProfileActions from '../molecules/UserProfileActions';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { colorMode } = useColorMode();
  const { isNavbarOpen, navbarToggler } = useContext(AppSettingContext);

  return (
    <Flex minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      <Sidebar />
      <Box
        flex="1"
        ml={{
          base: '0',
          m: isNavbarOpen ? '300px' : '108px',
          d: '280px',
        }}
        transition="margin-left 0.3s ease"
        minH="100vh"
        w="100%"
      >
        <Box
          display={{ base: 'block', m: 'none' }}
          position="sticky"
          top="0"
          zIndex="100" // Increased zIndex to ensure it stays on top
          bg={
            colorMode === 'light'
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(26, 32, 44, 0.8)'
          }
          backdropFilter="blur(10px)"
          borderBottom="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
          px={4}
          py={2} // Reduced padding vertically
          mb={0} // Removed margin bottom to minimize spacing
        >
          <Flex align="center" justify="space-between">
            <IconButton
              icon={<FiMenu fontSize="1.25rem" />}
              aria-label="Open Sidebar"
              onClick={navbarToggler}
              variant="ghost"
              size="md"
              _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.700' }}
            />
            <Box mr={{ base: -3, md: 0 }}>
              <UserProfileActions />
            </Box>
          </Flex>
        </Box>
        {children}
      </Box>
    </Flex>
  );
};

export default AdminLayout;
