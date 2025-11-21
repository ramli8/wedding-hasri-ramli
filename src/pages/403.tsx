import React from 'react';
import { Box, Heading, Text, Button, VStack, Icon, useColorMode } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const ForbiddenPage = () => {
  const router = useRouter();
  const { colorMode } = useColorMode();

  return (
    <>
      <Head>
        <title>403 - Akses Ditolak • {process.env.NEXT_PUBLIC_APP_NAME_FULL}</title>
      </Head>

      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}
        p={4}
      >
        <VStack spacing={6} textAlign="center" maxW="md">
          <Icon viewBox="0 0 24 24" boxSize="120px" color="red.500">
            <path
              fill="currentColor"
              d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.1 14.8,9.5V11C15.4,11 16,11.6 16,12.3V15.8C16,16.4 15.4,17 14.7,17H9.2C8.6,17 8,16.4 8,15.7V12.2C8,11.6 8.6,11 9.2,11V9.5C9.2,8.1 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z"
            />
          </Icon>

          <Heading
            fontSize="6xl"
            fontWeight="bold"
            color={colorMode === 'light' ? 'gray.800' : 'white'}
          >
            403
          </Heading>

          <VStack spacing={2}>
            <Heading
              fontSize="2xl"
              fontWeight="600"
              color={colorMode === 'light' ? 'gray.800' : 'white'}
            >
              Akses Ditolak
            </Heading>
            <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
              Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
            </Text>
            <Text fontSize="sm" color={colorMode === 'light' ? 'gray.500' : 'gray.500'}>
              Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
            </Text>
          </VStack>

          <VStack spacing={3} w="full">
            <Button
              colorScheme="teal"
              size="lg"
              w="full"
              onClick={() => router.back()}
            >
              Kembali
            </Button>
            <Button
              variant="ghost"
              size="lg"
              w="full"
              onClick={() => router.push('/admin/login')}
            >
              Ke Halaman Login
            </Button>
          </VStack>
        </VStack>
      </Box>
    </>
  );
};

export default ForbiddenPage;
