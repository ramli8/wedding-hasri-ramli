import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useColorMode,
  useToast,
  InputGroup,
  InputLeftElement,
  Icon,
  Flex,
  Image,
} from '@chakra-ui/react';
import { FiUser, FiLock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import AuthAPI from '../services/AuthAPI';

const LoginPage = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }
    
    const authAPI = new AuthAPI();
    // Redirect if already logged in
    if (authAPI.isAuthenticated()) {
      router.push('/admin/tamu');
    } else {
      setIsChecking(false);
    }
  }, []); // Empty dependency - run only once on mount

  // Don't render form while checking auth
  if (isChecking) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const authAPI = new AuthAPI();
    try {
      await authAPI.login({ username, password });
      toast({
        title: 'Login berhasil',
        description: 'Selamat datang!',
        status: 'success',
        duration: 2000,
      });
      router.push('/admin/tamu');
    } catch (error: any) {
      toast({
        title: 'Login gagal',
        description: error.message || 'Terjadi kesalahan',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const borderColor = colorMode === 'light' ? 'gray.200' : 'gray.700';
  const focusBorderColor = colorMode === 'light' ? 'black' : 'white';
  const buttonBg = colorMode === 'light' ? 'black' : 'white';
  const buttonColor = colorMode === 'light' ? 'white' : 'black';
  const buttonHoverBg = colorMode === 'light' ? 'gray.800' : 'gray.200';

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={colorMode === 'light' ? 'white' : 'black'}
    >
      <Container maxW="sm">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" mb={2} fontWeight="800" letterSpacing="tight">
              Admin Panel
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Masuk untuk melanjutkan
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.500">Username</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  bg="transparent"
                  border="1px solid"
                  borderColor={borderColor}
                  _hover={{ borderColor: 'gray.400' }}
                  _focus={{ borderColor: focusBorderColor, boxShadow: 'none' }}
                  borderRadius="md"
                  height="48px"
                  fontSize="sm"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="500" color="gray.500">Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="transparent"
                  border="1px solid"
                  borderColor={borderColor}
                  _hover={{ borderColor: 'gray.400' }}
                  _focus={{ borderColor: focusBorderColor, boxShadow: 'none' }}
                  borderRadius="md"
                  height="48px"
                  fontSize="sm"
                />
              </FormControl>

              <Button
                type="submit"
                width="full"
                height="48px"
                bg={buttonBg}
                color={buttonColor}
                _hover={{ bg: buttonHoverBg }}
                _active={{ bg: buttonHoverBg }}
                isLoading={loading}
                borderRadius="md"
                fontSize="sm"
                fontWeight="600"
                mt={4}
              >
                Masuk
              </Button>
            </VStack>
          </form>
        </VStack>
      </Container>
    </Flex>
  );
};

export default LoginPage;
