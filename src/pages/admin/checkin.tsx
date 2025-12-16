import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Text,
  VStack,
  useToast,
  Button,
  Flex,
  useColorMode,
  HStack,
  Portal,
  Icon,
  Circle,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { useCallback } from 'react';
import {
  FaCamera,
  FaCheckCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaUser,
} from 'react-icons/fa';
import Head from 'next/head';
import QRScanner from '@/components/QRScanner';
import TamuAPI from '@/modules/admin/tamu/services/TamuAPI';
import { Tamu } from '@/modules/admin/tamu/types/Tamu.types';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import PageRow from '@/components/atoms/PageRow';
import AppSettingContext from '@/providers/AppSettingProvider';
// PageRow, ContainerQuery, UserProfileActions removed as they are unused in the new overlay layout

const CheckInPage = () => {
  const [data, setData] = useState<string | null>(null);
  const [scannedGuest, setScannedGuest] = useState<Tamu | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultType, setResultType] = useState<
    'success' | 'info' | 'error' | null
  >(null);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [isScanning, setIsScanning] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment'
  );
  const toast = useToast();
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSecure(window.isSecureContext);
    }
  }, []);

  // Disable scroll when scanning
  useEffect(() => {
    if (isScanning) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isScanning]);

  const processCheckIn = useCallback(
    async (qrCode: string) => {
      console.log('Processing check-in for:', qrCode);
      setLoading(true);
      setResultType(null);
      setResultMessage('');
      setScannedGuest(null);

      try {
        if (!isSecure) {
          setResultType('error');
          setResultMessage('Koneksi tidak aman (HTTPS diperlukan)');
          setLoading(false);
          return;
        }

        const tamuAPI = new TamuAPI();
        const response = await tamuAPI.directCheckIn(qrCode);
        console.log('Response:', response);

        setScannedGuest(response.guest);
        setLoading(false);

        if (response.success && response.guest) {
          // Check-in berhasil
          setResultType('success');
          setResultMessage('Selamat datang!');
        } else if (!response.success && response.guest) {
          // Tamu sudah check-in
          setResultType('info');
          setResultMessage(
            response.error || 'Tamu ini sudah melakukan check-in'
          );
        } else {
          // Error - QR tidak valid
          setResultType('error');
          setResultMessage(response.error || 'QR Code tidak valid');
        }
      } catch (err: any) {
        console.error('Check-in error:', err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan sistem';

        setResultType('error');
        setResultMessage(msg);
        setScannedGuest(null);
        setLoading(false);
      }
    },
    [isSecure]
  );

  const handleScan = useCallback(
    async (decodedText: string) => {
      // Prevent multiple triggers
      if (loading) {
        console.log('Already processing, ignoring scan');
        return;
      }

      if (decodedText && decodedText !== data) {
        console.log('Decoded text:', decodedText);
        setData(decodedText);
        setIsScanning(false); // Stop scanning while processing
        await processCheckIn(decodedText);
      }
    },
    [loading, data, processCheckIn]
  );

  const handleScanError = useCallback((err: string) => {
    console.error('Camera error:', err);
    // Silent error handling, no toast needed
  }, []);

  const resetScan = () => {
    setData(null);
    setScannedGuest(null);
    setResultType(null);
    setResultMessage('');
    setLoading(false);
    setIsScanning(true); // Restart scanning
  };

  const borderColor = colorMode === 'light' ? 'gray.200' : 'gray.700';
  const bg = colorMode === 'light' ? 'white' : 'black';

  // Theme colors using colorPref (pink, blue, etc.)
  const activeButtonBg =
    colorMode === 'light' ? `${colorPref}.500` : `${colorPref}Dim.400`;
  const activeButtonColor = colorMode === 'light' ? 'white' : 'gray.900';
  const activeButtonHoverBg =
    colorMode === 'light' ? `${colorPref}.600` : `${colorPref}Dim.500`;
  const inactiveButtonColor = colorMode === 'light' ? 'gray.600' : 'gray.400';
  const inactiveButtonHoverBg = colorMode === 'light' ? 'gray.100' : 'gray.700';

  return (
    <AdminLayout>
      <Head>
        <title>Scan QR Check-in - Admin</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      {/* Main Container with PageRow style from checkout */}
      <Box position="relative" minH="100vh">
        <ContainerQuery>
          <PageRow>
            <Box w="100%" position="relative" pt={{ base: 4, md: 6 }}>
              {/* Header - No Border */}
              <Box mb={6} px={{ base: 2, md: 0 }}>
                <VStack spacing={1} align="start">
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color={colorMode === 'light' ? 'gray.800' : 'white'}
                  >
                    Scanner QR Check-in
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Arahkan kamera ke QR Code tamu untuk melakukan check-in
                  </Text>
                  {!isSecure && (
                    <Text color="red.500" fontSize="xs" fontWeight="600">
                      ⚠️ Koneksi tidak aman - Kamera mungkin diblokir
                    </Text>
                  )}
                </VStack>
              </Box>

              {/* Camera Scanner Card */}
              <Box
                bg={bg}
                borderRadius="xl"
                overflow="hidden"
                boxShadow="lg"
                borderWidth="1px"
                borderColor={borderColor}
                mb={8}
              >
                {/* Scanner View */}
                <Box
                  w="100%"
                  h={{ base: '400px', md: '500px' }}
                  position="relative"
                  bg={bg}
                  overflow="hidden"
                >
                  {isScanning && (
                    <QRScanner
                      onScanSuccess={handleScan}
                      onScanError={handleScanError}
                      fps={30}
                      qrbox={250}
                      facingMode={facingMode}
                    />
                  )}
                </Box>
              </Box>

              {/* Switch Button Below Scanner */}
              {!scannedGuest && !loading && (
                <Flex justify="center" mb={{ base: 24, md: 12 }}>
                  <HStack
                    spacing={2}
                    bg={colorMode === 'light' ? 'white' : 'gray.800'}
                    borderRadius="full"
                    p={1.5}
                    boxShadow="lg"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <Button
                      size="md"
                      bg={
                        facingMode === 'environment'
                          ? activeButtonBg
                          : 'transparent'
                      }
                      color={
                        facingMode === 'environment'
                          ? activeButtonColor
                          : inactiveButtonColor
                      }
                      variant="ghost"
                      borderRadius="full"
                      onClick={() => setFacingMode('environment')}
                      fontSize="sm"
                      fontWeight="600"
                      h="40px"
                      px={5}
                      leftIcon={<FaCamera size={14} />}
                      _hover={{
                        bg:
                          facingMode === 'environment'
                            ? activeButtonHoverBg
                            : inactiveButtonHoverBg,
                        transform: 'scale(1.02)',
                      }}
                      transition="all 0.2s"
                    >
                      Belakang
                    </Button>
                    <Button
                      size="md"
                      bg={
                        facingMode === 'user' ? activeButtonBg : 'transparent'
                      }
                      color={
                        facingMode === 'user'
                          ? activeButtonColor
                          : inactiveButtonColor
                      }
                      variant="ghost"
                      borderRadius="full"
                      onClick={() => setFacingMode('user')}
                      fontSize="sm"
                      fontWeight="600"
                      h="40px"
                      px={5}
                      leftIcon={<FaCamera size={14} />}
                      _hover={{
                        bg:
                          facingMode === 'user'
                            ? activeButtonHoverBg
                            : inactiveButtonHoverBg,
                        transform: 'scale(1.02)',
                      }}
                      transition="all 0.2s"
                    >
                      Depan
                    </Button>
                  </HStack>
                </Flex>
              )}
            </Box>
          </PageRow>
        </ContainerQuery>

        {/* Modern Result Overlay */}
        {(scannedGuest || loading || resultType) && (
          <Portal>
            <Flex
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={2000}
              bg="blackAlpha.700"
              backdropFilter="blur(10px)"
              justify="center"
              align="center"
              onClick={(e) => {
                if (e.target === e.currentTarget && !loading) resetScan();
              }}
            >
              <Box
                bg={colorMode === 'light' ? 'white' : 'gray.800'}
                w={{ base: '90%', md: '480px' }}
                borderRadius="2xl"
                overflow="hidden"
                boxShadow="2xl"
                transform="scale(1)"
                transition="all 0.3s"
              >
                {loading ? (
                  <VStack spacing={6} p={10}>
                    <Circle
                      size="80px"
                      bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
                    >
                      <Box
                        as="span"
                        display="inline-block"
                        w="40px"
                        h="40px"
                        border="4px solid"
                        borderColor="blue.500"
                        borderTopColor="transparent"
                        borderRadius="full"
                        animation="spin 0.8s linear infinite"
                      />
                    </Circle>
                    <Text
                      fontSize="lg"
                      fontWeight="600"
                      color={colorMode === 'light' ? 'gray.600' : 'gray.300'}
                    >
                      Memproses...
                    </Text>
                  </VStack>
                ) : (
                  <VStack spacing={0}>
                    {/* Icon & Status Header */}
                    <Box
                      w="100%"
                      bg={
                        colorMode === 'light'
                          ? resultType === 'success'
                            ? 'green.50'
                            : resultType === 'info'
                            ? 'blue.50'
                            : 'red.50'
                          : resultType === 'success'
                          ? 'green.900'
                          : resultType === 'info'
                          ? 'blue.900'
                          : 'red.900'
                      }
                      pt={8}
                      pb={6}
                    >
                      <VStack spacing={3}>
                        <Circle
                          size="64px"
                          bg={
                            resultType === 'success'
                              ? 'green.500'
                              : resultType === 'info'
                              ? 'blue.500'
                              : 'red.500'
                          }
                        >
                          <Icon
                            as={
                              resultType === 'success'
                                ? FaCheckCircle
                                : resultType === 'info'
                                ? FaInfoCircle
                                : FaTimesCircle
                            }
                            w={8}
                            h={8}
                            color="white"
                          />
                        </Circle>
                        <Text
                          fontSize="2xl"
                          fontWeight="700"
                          color={
                            colorMode === 'light'
                              ? resultType === 'success'
                                ? 'green.700'
                                : resultType === 'info'
                                ? 'blue.700'
                                : 'red.700'
                              : resultType === 'success'
                              ? 'green.200'
                              : resultType === 'info'
                              ? 'blue.200'
                              : 'red.200'
                          }
                        >
                          {resultType === 'success'
                            ? 'Check-in Berhasil'
                            : resultType === 'info'
                            ? 'Informasi'
                            : 'Gagal'}
                        </Text>
                      </VStack>
                    </Box>

                    {/* Content */}
                    <VStack spacing={6} p={6} w="100%">
                      {scannedGuest ? (
                        <>
                          <VStack spacing={2} w="100%">
                            <Icon as={FaUser} w={5} h={5} color="gray.400" />
                            <Text
                              fontSize="2xl"
                              fontWeight="700"
                              textAlign="center"
                              color={
                                colorMode === 'light' ? 'gray.800' : 'white'
                              }
                            >
                              {scannedGuest.nama}
                            </Text>
                            <Text
                              fontSize="sm"
                              color="gray.500"
                              textAlign="center"
                            >
                              {resultMessage}
                            </Text>
                          </VStack>

                          <Divider />

                          <HStack w="100%" justify="space-around">
                            <VStack spacing={1}>
                              <Text
                                fontSize="xs"
                                color="gray.500"
                                fontWeight="600"
                              >
                                KATEGORI
                              </Text>
                              <Badge
                                colorScheme="purple"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="md"
                              >
                                {scannedGuest.kategori}
                              </Badge>
                            </VStack>
                            <Divider orientation="vertical" h="40px" />
                            <VStack spacing={1}>
                              <Text
                                fontSize="xs"
                                color="gray.500"
                                fontWeight="600"
                              >
                                HUBUNGAN
                              </Text>
                              <Badge
                                colorScheme="cyan"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="md"
                              >
                                {scannedGuest.hubungan}
                              </Badge>
                            </VStack>
                          </HStack>
                        </>
                      ) : (
                        <Text
                          fontSize="md"
                          color={
                            colorMode === 'light' ? 'gray.600' : 'gray.400'
                          }
                          textAlign="center"
                        >
                          {resultMessage}
                        </Text>
                      )}

                      <Button
                        w="100%"
                        size="lg"
                        colorScheme={
                          resultType === 'success'
                            ? 'green'
                            : resultType === 'info'
                            ? 'blue'
                            : 'red'
                        }
                        onClick={resetScan}
                        borderRadius="xl"
                        fontWeight="600"
                      >
                        Scan Berikutnya
                      </Button>
                    </VStack>
                  </VStack>
                )}
              </Box>
            </Flex>
          </Portal>
        )}
      </Box>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
};

(CheckInPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default withAuth(CheckInPage);
