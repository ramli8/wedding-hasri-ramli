import React, { useState, useEffect, useContext } from 'react';
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
  InputGroup,
  InputLeftElement,
  Icon,
  Flex,
  keyframes,
} from '@chakra-ui/react';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';
import { useRouter } from 'next/router';
import AuthAPI from '../services/AuthAPI';
import AppSettingContext from '@/providers/AppSettingProvider';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const LoginPage = () => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
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
      router.push('/admin/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]); // Run once on mount and when router changes (though router shouldn't change here)

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
      showSuccessAlert('Login berhasil', colorMode);
      router.push('/admin/dashboard');
    } catch (error: any) {
      showErrorAlert(
        'Login gagal',
        error.message || 'Terjadi kesalahan',
        colorMode
      );
    } finally {
      setLoading(false);
    }
  };

  const isDark = colorMode === 'dark';
  const bg = isDark ? 'gray.900' : 'gray.50';
  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  // Dynamic brand colors
  const brandColor = isDark ? `${colorPref}.200` : `${colorPref}.500`;
  const brandHoverColor = isDark ? `${colorPref}.300` : `${colorPref}.600`;
  const iconColor = isDark ? `${colorPref}.200` : `${colorPref}.500`;

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={bg}
      px={{ base: 4, md: 8 }}
    >
      <Container
        maxW={{ base: 'full', sm: '400px', md: '440px' }}
        animation={`${fadeIn} 0.6s ease-out`}
      >
        <Box
          bg={cardBg}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="sm"
          p={{ base: 6, sm: 8, md: 10 }}
        >
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            {/* Header */}
            <Box textAlign="center">
              <Box
                display="inline-flex"
                p={3}
                borderRadius="xl"
                bg={isDark ? `${colorPref}.900` : `${colorPref}.50`}
                mb={4}
              >
                <Icon
                  as={FiLogIn}
                  boxSize={{ base: 6, md: 7 }}
                  color={iconColor}
                />
              </Box>
              <Heading
                size={{ base: 'lg', md: 'xl' }}
                mb={2}
                fontWeight="800"
                letterSpacing="tight"
                color={isDark ? 'white' : 'gray.900'}
              >
                Admin Panel
              </Heading>
              <Text
                color={isDark ? 'gray.400' : 'gray.500'}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight="500"
              >
                Masuk untuk melanjutkan
              </Text>
            </Box>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <VStack spacing={5}>
                {/* Username Field */}
                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="600"
                    color={isDark ? 'gray.300' : 'gray.700'}
                    mb={2}
                  >
                    Username
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement height="full" pointerEvents="none">
                      <Icon
                        as={FiUser}
                        color={isDark ? 'gray.500' : 'gray.400'}
                        boxSize={5}
                      />
                    </InputLeftElement>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username"
                      bg={isDark ? 'gray.900' : 'white'}
                      border="1px solid"
                      borderColor={borderColor}
                      _hover={{
                        borderColor: isDark ? 'gray.500' : 'gray.400',
                      }}
                      _focus={{
                        borderColor: brandColor,
                        boxShadow: `0 0 0 1px var(--chakra-colors-${colorPref}-${
                          isDark ? '200' : '500'
                        })`,
                      }}
                      borderRadius="lg"
                      height={{ base: '48px', md: '50px' }}
                      fontSize={{ base: 'sm', md: 'md' }}
                      pl="45px"
                      transition="all 0.2s"
                    />
                  </InputGroup>
                </FormControl>

                {/* Password Field */}
                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="600"
                    color={isDark ? 'gray.300' : 'gray.700'}
                    mb={2}
                  >
                    Password
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement height="full" pointerEvents="none">
                      <Icon
                        as={FiLock}
                        color={isDark ? 'gray.500' : 'gray.400'}
                        boxSize={5}
                      />
                    </InputLeftElement>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      bg={isDark ? 'gray.900' : 'white'}
                      border="1px solid"
                      borderColor={borderColor}
                      _hover={{
                        borderColor: isDark ? 'gray.500' : 'gray.400',
                      }}
                      _focus={{
                        borderColor: brandColor,
                        boxShadow: `0 0 0 1px var(--chakra-colors-${colorPref}-${
                          isDark ? '200' : '500'
                        })`,
                      }}
                      borderRadius="lg"
                      height={{ base: '48px', md: '50px' }}
                      fontSize={{ base: 'sm', md: 'md' }}
                      pl="45px"
                      transition="all 0.2s"
                    />
                  </InputGroup>
                </FormControl>

                {/* Submit Button */}
                <Button
                  type="submit"
                  width="full"
                  height={{ base: '48px', md: '52px' }}
                  bg={brandColor}
                  color={isDark ? 'gray.900' : 'white'}
                  _hover={{
                    bg: brandHoverColor,
                    transform: 'translateY(-1px)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  isLoading={loading}
                  loadingText="Memproses..."
                  borderRadius="lg"
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontWeight="600"
                  mt={2}
                  transition="all 0.2s"
                >
                  Masuk
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>

        {/* Footer Text */}
        <Text
          textAlign="center"
          fontSize={{ base: 'xs', md: 'sm' }}
          color={isDark ? 'gray.500' : 'gray.500'}
          mt={8}
          fontWeight="500"
        >
          Wedding Management System
        </Text>
      </Container>
    </Flex>
  );
};

export default LoginPage;
