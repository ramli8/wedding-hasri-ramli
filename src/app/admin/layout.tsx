'use client';

import { Box, Flex, Container, useColorMode } from '@chakra-ui/react';
import Sidebar from '@/components/organisms/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colorMode } = useColorMode();

  return (
    <Flex minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      <Sidebar />
      <Box
        flex="1"
        ml={{ base: '0', md: '108px', lg: '280px' }}
        transition="margin-left 0.3s ease"
        minH="100vh"
      >
        <Container maxW="container.xl" py={8} px={{ base: 4, md: 6 }}>
          {children}
        </Container>
      </Box>
    </Flex>
  );
}
