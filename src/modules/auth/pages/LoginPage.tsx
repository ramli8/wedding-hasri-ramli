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
  Flex,
  keyframes,
} from '@chakra-ui/react';
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
  const bg = isDark 
    ? 'linear-gradient(135deg, #1A202C 0%, #2D3748 100%)'
    : 'linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%)';
  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  // Dynamic brand colors
  const brandColor = isDark ? `${colorPref}.400` : `${colorPref}.500`;
  const brandHoverColor = isDark ? `${colorPref}.500` : `${colorPref}.600`;
  const accentColor = isDark ? `${colorPref}.300` : `${colorPref}.600`;

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={isDark ? 'gray.900' : 'gray.50'}
      px={4}
    >
      <Container
        maxW="420px"
        animation={`${fadeIn} 0.6s ease-out`}
      >
        <VStack spacing={6}>
          {/* Branding Section */}
          <VStack spacing={2}>
            <Heading
              size="xl"
              fontWeight="800"
              letterSpacing="tight"
              color={isDark ? 'white' : 'gray.900'}
              textAlign="center"
            >
              Admin Portal
            </Heading>
            <Text
              color={isDark ? 'gray.400' : 'gray.600'}
              fontSize="sm"
              fontWeight="500"
              textAlign="center"
            >
              Wedding Management System
            </Text>
          </VStack>

          {/* Login Card */}
          <Box
            w="full"
            bg={cardBg}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="lg"
            p={8}
          >
            <VStack spacing={6} align="stretch">

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
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username"
                      variant="filled"
                      bg={isDark ? 'gray.900' : 'gray.50'}
                      border="2px solid transparent"
                      _hover={{
                        bg: isDark ? 'gray.900' : 'gray.100',
                        borderColor: isDark ? 'gray.600' : 'gray.300',
                      }}
                      _focus={{
                        bg: isDark ? 'gray.900' : 'white',
                        borderColor: brandColor,
                        boxShadow: `0 0 0 1px ${brandColor}`,
                      }}
                      borderRadius="xl"
                      height="52px"
                      fontSize="md"
                      fontWeight="500"
                      transition="all 0.2s"
                    />
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
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      variant="filled"
                      bg={isDark ? 'gray.900' : 'gray.50'}
                      border="2px solid transparent"
                      _hover={{
                        bg: isDark ? 'gray.900' : 'gray.100',
                        borderColor: isDark ? 'gray.600' : 'gray.300',
                      }}
                      _focus={{
                        bg: isDark ? 'gray.900' : 'white',
                        borderColor: brandColor,
                        boxShadow: `0 0 0 1px ${brandColor}`,
                      }}
                      borderRadius="xl"
                      height="52px"
                      fontSize="md"
                      fontWeight="500"
                      transition="all 0.2s"
                    />
                  </FormControl>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    width="full"
                    height="52px"
                    bg={brandColor}
                    color="white"
                    _hover={{
                      bg: brandHoverColor,
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    isLoading={loading}
                    loadingText="Memproses..."
                    borderRadius="xl"
                    fontSize="md"
                    fontWeight="600"
                    mt={3}
                    boxShadow="md"
                    transition="all 0.2s"
                  >
                    Masuk ke Dashboard
                  </Button>
                </VStack>
              </form>

            </VStack>
          </Box>
        </VStack>

        {/* Footer */}
        <Text
          textAlign="center"
          fontSize="xs"
          color={isDark ? 'gray.600' : 'gray.500'}
          mt={6}
          fontWeight="500"
        >
          © 2024 Wedding Management System. All rights reserved.
        </Text>
      </Container>
    </Flex>
  );
};

export default LoginPage;
