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

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}
    >
      <Container maxW="md">
        <Box
          bg={colorMode === 'light' ? 'white' : 'gray.800'}
          p={8}
          borderRadius="2xl"
          boxShadow="xl"
        >
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <Heading size="xl" mb={2} fontFamily="heading">
                Admin Panel
              </Heading>
              <Text color="gray.500" fontSize="sm">
                Masuk untuk mengelola undangan
              </Text>
            </Box>

            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Username</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FiUser} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username"
                      bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                      border="none"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FiLock} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                      border="none"
                    />
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="teal"
                  width="full"
                  size="lg"
                  isLoading={loading}
                  borderRadius="full"
                  mt={4}
                >
                  Masuk
                </Button>
              </VStack>
            </form>

            <Text textAlign="center" fontSize="xs" color="gray.500" mt={4}>
              Default: username <b>admin</b>, password <b>admin123</b>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
};

export default LoginPage;
