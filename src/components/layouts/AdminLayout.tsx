import React, { ReactNode } from 'react';
import { Flex, Box, useColorMode } from '@chakra-ui/react';
import Sidebar from '@/components/organisms/Sidebar';
import AppSettingContext from '@/providers/AppSettingProvider';
import { useContext } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { colorMode } = useColorMode();
  const { isNavbarOpen } = useContext(AppSettingContext);

  return (
    <Flex minH="100vh" bg={colorMode === 'light' ? 'white' : 'black'}>
      <Sidebar />
      <Box
        flex="1"
        ml={{ 
          base: '0', 
          m: isNavbarOpen ? '300px' : '108px', 
          d: '280px' 
        }}
        transition="margin-left 0.3s ease"
        minH="100vh"
        w="100%"
      >
        {children}
      </Box>
    </Flex>
  );
};

export default AdminLayout;
