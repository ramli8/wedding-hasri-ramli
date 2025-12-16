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
  InputGroup,
  InputRightElement,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const isDark = colorMode === 'dark';

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
  }, [router]);

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

  // Dynamic brand colors
  const brandColor = isDark ? `${colorPref}.400` : `${colorPref}.500`;
  const brandHoverColor = isDark ? `${colorPref}.500` : `${colorPref}.600`;

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={isDark ? 'gray.900' : 'gray.50'}
      px={4}
      pos="relative"
      overflow="hidden"
    >
      {/* Background Decor - Optional (Subtle) */}
      <Box
        pos="absolute"
        top="-20%"
        left="-10%"
        w="500px"
        h="500px"
        bg={`${colorPref}.500`}
        opacity={isDark ? 0.05 : 0.03}
        filter="blur(120px)"
        borderRadius="full"
        zIndex={0}
      />

      <Container
        maxW="420px"
        position="relative"
        zIndex={1}
        animation={`${fadeIn} 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)`}
      >
        <VStack spacing={8}>
          {/* Header Section */}
          <VStack spacing={1}>
            <Heading
              size="lg"
              fontWeight="800"
              letterSpacing="-0.02em"
              color={isDark ? 'white' : 'gray.800'}
              textAlign="center"
            >
              Selamat Datang
            </Heading>
            <Text
              color={isDark ? 'whiteAlpha.600' : 'gray.500'}
              fontSize="md"
              fontWeight="400"
              textAlign="center"
            >
              Admin Portal Wedding
            </Text>
          </VStack>

          {/* Login Card with Glass Blur Shadow */}
          <Box
            as="form"
            onSubmit={handleSubmit}
            pos="relative"
            w="full"
            bg={isDark ? 'whiteAlpha.50' : 'white'}
            borderRadius="32px"
            border="1px solid"
            borderColor={isDark ? 'whiteAlpha.100' : 'gray.100'}
            p={{ base: 6, md: 8 }}
            _before={{
              content: '""',
              pos: 'absolute',
              top: '25px',
              left: '25px',
              right: '25px',
              bottom: '-25px',
              zIndex: '-1',
              background: isDark ? '#000' : '#e3e6ec',
              opacity: isDark ? 0.6 : 1,
              filter: 'blur(30px)',
              borderRadius: '32px',
              transform: 'scale(1)',
            }}
          >
            <VStack spacing={6}>
              {/* Login Form */}
              <VStack spacing={5} w="full">
                {/* Username Field */}
                <FormControl isRequired>
                  <FormLabel
                    fontSize="xs"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    color={isDark ? 'gray.400' : 'gray.500'}
                    mb={3}
                  >
                    Username
                  </FormLabel>
                  <InputGroup>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username anda"
                      bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                      border="1px solid"
                      borderColor={isDark ? 'transparent' : 'gray.200'}
                      _hover={{
                        bg: isDark ? 'whiteAlpha.100' : 'gray.100',
                        borderColor: isDark ? 'whiteAlpha.300' : 'gray.300',
                      }}
                      _focus={{
                        bg: isDark ? 'whiteAlpha.100' : 'white',
                        borderColor: brandColor,
                        boxShadow: `0 0 0 1px ${brandColor}`,
                      }}
                      borderRadius="2xl"
                      height="50px"
                      fontSize="sm"
                      fontWeight="500"
                      pl={4}
                      _placeholder={{
                        color: isDark ? 'whiteAlpha.300' : 'gray.400',
                      }}
                    />
                  </InputGroup>
                </FormControl>

                {/* Password Field */}
                <FormControl isRequired>
                  <FormLabel
                    fontSize="xs"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    color={isDark ? 'gray.400' : 'gray.500'}
                    mb={3}
                  >
                    Password
                  </FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password anda"
                      bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                      border="1px solid"
                      borderColor={isDark ? 'transparent' : 'gray.200'}
                      _hover={{
                        bg: isDark ? 'whiteAlpha.100' : 'gray.100',
                        borderColor: isDark ? 'whiteAlpha.300' : 'gray.300',
                      }}
                      _focus={{
                        bg: isDark ? 'whiteAlpha.100' : 'white',
                        borderColor: brandColor,
                        boxShadow: `0 0 0 1px ${brandColor}`,
                      }}
                      borderRadius="2xl"
                      height="50px"
                      fontSize="sm"
                      fontWeight="500"
                      pl={4}
                      _placeholder={{
                        color: isDark ? 'whiteAlpha.300' : 'gray.400',
                      }}
                    />
                    <InputRightElement h="50px" mr={1}>
                      <IconButton
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        icon={showPassword ? <FiEyeOff /> : <FiEye />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="sm"
                        color={isDark ? 'gray.400' : 'gray.500'}
                        borderRadius="full"
                        _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.200' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </VStack>

              {/* Submit Button */}
              <Button
                type="submit"
                width="full"
                height="54px"
                bg={brandColor}
                color="white"
                _hover={{
                  bg: brandHoverColor,
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
                _active={{
                  transform: 'translateY(0)',
                  bg: brandHoverColor,
                }}
                isLoading={loading}
                loadingText="Masuk..."
                borderRadius="full"
                fontSize="sm"
                fontWeight="700"
                letterSpacing="0.02em"
                mt={4}
                boxShadow="xl"
                transition="all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)"
              >
                MASUK SEKARANG
              </Button>
            </VStack>
          </Box>

          {/* Copyright */}
          <Text
            textAlign="center"
            fontSize="11px"
            color={isDark ? 'whiteAlpha.400' : 'gray.400'}
            fontWeight="500"
            letterSpacing="wide"
          >
            © 2024 WEDDING MANAGEMENT SYSTEM
          </Text>
        </VStack>
      </Container>
    </Flex>
  );
};

export default LoginPage;
