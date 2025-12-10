import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  useToast,
  Container,
  Button,
  Flex,
  Heading,
  Spinner,
  Icon,
  useColorMode,
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaCamera } from 'react-icons/fa';
import Head from 'next/head';
import QRScanner from '@/components/QRScanner';
import TamuAPI from '@/modules/admin/tamu/services/TamuAPI';
import { Tamu } from '@/modules/admin/tamu/types/Tamu.types';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';

const CheckInPage = () => {
  const [data, setData] = useState<string | null>(null);
  const [scannedGuest, setScannedGuest] = useState<Tamu | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const toast = useToast();
  const { colorMode } = useColorMode();

  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSecure(window.isSecureContext);
    }
  }, []);

  const handleScan = async (decodedText: string) => {
    if (isScanning && decodedText !== data) {
      setData(decodedText);
      setIsScanning(false); // Stop scanning immediately
      await processCheckIn(decodedText);
    }
  };

  const handleScanError = (error: string) => {
    if (error.includes('Permission') || error.includes('camera')) {
      setError('Izin kamera ditolak. Mohon izinkan akses kamera.');
    }
  };

  const processCheckIn = async (qrCode: string) => {
    setLoading(true);
    setError(null);
    console.log('Processing QR:', qrCode);

    try {
      const api = new TamuAPI();

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error('Request timeout. Periksa koneksi internet Anda.')
            ),
          15000
        );
      });

      // OPTIMIZED: Use directCheckIn for faster processing (1 DB call instead of 2)
      console.log('Processing check-in...');
      const result = (await Promise.race([
        api.directCheckIn(qrCode),
        timeoutPromise,
      ])) as { success: boolean; guest: Tamu | null; error?: string };

      console.log('Check-in result:', result);

      if (!result.guest) {
        throw new Error(
          result.error || 'QR Code tidak valid atau tamu tidak ditemukan.'
        );
      }

      setScannedGuest(result.guest);

      if (!result.success) {
        // Already checked in or other validation error
        setError(result.error || 'Terjadi kesalahan');
        return;
      }

      // Success!
      toast({
        title: 'Check-in Berhasil',
        description: `Selamat datang, ${result.guest.nama}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
        size: 'lg',
      });
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses check-in.');
      toast({
        title: 'Gagal',
        description: err.message || 'Terjadi kesalahan',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
        size: 'lg',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setData(null);
    setScannedGuest(null);
    setError(null);
    setIsScanning(true);
  };

  const borderColor = colorMode === 'light' ? 'gray.200' : 'gray.700';
  const bg = colorMode === 'light' ? 'white' : 'black';
  const buttonBg = colorMode === 'light' ? 'black' : 'white';
  const buttonColor = colorMode === 'light' ? 'white' : 'black';
  const buttonHoverBg = colorMode === 'light' ? 'gray.800' : 'gray.200';

  return (
    <AdminLayout>
      <Head>
        <title>Scan QR Check-in - Admin</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>
      <Box minH="calc(100vh - 80px)" bg={bg} position="relative" w="100%">
        {/* Header */}
        <Flex
          p={6}
          bg="transparent"
          align="center"
          justify="center"
          position="sticky"
          top={0}
          zIndex={10}
          backdropFilter="blur(8px)"
          borderBottom="1px solid"
          borderColor={borderColor}
        >
          <Heading size="md" fontWeight="800" letterSpacing="tight">
            Scan Check-in
          </Heading>
        </Flex>

        <Container maxW="md" py={8} px={6}>
          {!isSecure && (
            <Box
              bg="transparent"
              p={4}
              borderRadius="md"
              mb={6}
              border="1px solid"
              borderColor="black"
            >
              <Heading size="sm" mb={2}>
                Koneksi Tidak Aman
              </Heading>
              <Text fontSize="sm">
                Browser memblokir akses kamera karena Anda tidak menggunakan
                HTTPS.
              </Text>
              <Text fontSize="sm" mt={2} fontWeight="bold">
                Solusi (Chrome Android):
              </Text>
              <VStack align="start" pl={4} mt={1} spacing={0} fontSize="xs">
                <Text>
                  1. Buka
                  chrome://flags/#unsafely-treat-insecure-origin-as-secure
                </Text>
                <Text>2. Aktifkan (Enabled)</Text>
                <Text>
                  3. Masukkan URL ini:{' '}
                  {typeof window !== 'undefined' ? window.location.origin : ''}
                </Text>
                <Text>4. Klik Relaunch</Text>
              </VStack>
            </Box>
          )}

          {isScanning ? (
            <VStack spacing={8}>
              <Box
                w="100%"
                maxW="600px"
                aspectRatio={1}
                borderRadius="lg"
                overflow="hidden"
                bg="black"
                position="relative"
                mx="auto"
                border="1px solid"
                borderColor={borderColor}
              >
                <QRScanner
                  onScanSuccess={handleScan}
                  onScanError={handleScanError}
                  fps={30}
                  qrbox={300}
                />
                {/* Overlay Guidelines */}
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="280px"
                  h="280px"
                  border="2px solid"
                  borderColor="white"
                  borderRadius="md"
                  boxShadow="0 0 0 9999px rgba(0,0,0,0.7)"
                  pointerEvents="none"
                  zIndex={2}
                />
                <Text
                  position="absolute"
                  bottom="30px"
                  left="0"
                  right="0"
                  textAlign="center"
                  color="white"
                  fontWeight="600"
                  fontSize="sm"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  zIndex={3}
                  px={4}
                >
                  Arahkan kamera ke QR Code
                </Text>
              </Box>
              <Text
                color="gray.500"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="widest"
              >
                Pastikan QR Code terlihat jelas
              </Text>
            </VStack>
          ) : (
            <VStack spacing={8} align="stretch">
              {loading ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  py={12}
                >
                  <Spinner
                    size="xl"
                    color={colorMode === 'light' ? 'black' : 'white'}
                    thickness="2px"
                    mb={6}
                  />
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    letterSpacing="wide"
                    textTransform="uppercase"
                  >
                    Memproses data...
                  </Text>
                </Flex>
              ) : scannedGuest ? (
                <Box
                  bg="transparent"
                  p={8}
                  borderRadius="lg"
                  textAlign="center"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Icon
                    as={error ? FaTimesCircle : FaCheckCircle}
                    w={12}
                    h={12}
                    color={colorMode === 'light' ? 'black' : 'white'}
                    mb={6}
                  />

                  <Heading
                    size="lg"
                    mb={2}
                    fontWeight="800"
                    letterSpacing="tight"
                  >
                    {error ? 'Gagal Check-in' : 'Check-in Berhasil'}
                  </Heading>

                  {error && (
                    <Text
                      color="gray.500"
                      fontWeight="500"
                      mb={6}
                      fontSize="sm"
                    >
                      {error}
                    </Text>
                  )}

                  <VStack
                    spacing={4}
                    p={6}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    mb={8}
                  >
                    <Box>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        textTransform="uppercase"
                        letterSpacing="widest"
                        mb={1}
                      >
                        Nama Tamu
                      </Text>
                      <Text fontSize="2xl" fontWeight="800">
                        {scannedGuest.nama}
                      </Text>
                    </Box>

                    <Flex w="100%" justify="space-between" gap={4}>
                      <Box
                        textAlign="center"
                        flex={1}
                        p={2}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="sm"
                      >
                        <Text
                          fontSize="10px"
                          color="gray.500"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          mb={1}
                        >
                          Kategori
                        </Text>
                        <Text fontSize="sm" fontWeight="600">
                          {scannedGuest.kategori}
                        </Text>
                      </Box>
                      <Box
                        textAlign="center"
                        flex={1}
                        p={2}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="sm"
                      >
                        <Text
                          fontSize="10px"
                          color="gray.500"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          mb={1}
                        >
                          Hubungan
                        </Text>
                        <Text fontSize="sm" fontWeight="600">
                          {scannedGuest.hubungan}
                        </Text>
                      </Box>
                    </Flex>
                  </VStack>

                  <Button
                    bg={buttonBg}
                    color={buttonColor}
                    size="lg"
                    w="full"
                    onClick={resetScan}
                    leftIcon={<FaCamera />}
                    h="50px"
                    fontSize="sm"
                    fontWeight="600"
                    borderRadius="md"
                    _hover={{ bg: buttonHoverBg }}
                    _active={{ bg: buttonHoverBg }}
                  >
                    Scan Tamu Berikutnya
                  </Button>
                </Box>
              ) : (
                <Box textAlign="center" py={12}>
                  <Icon
                    as={FaTimesCircle}
                    w={12}
                    h={12}
                    color={colorMode === 'light' ? 'black' : 'white'}
                    mb={6}
                  />
                  <Heading size="md" mb={2} fontWeight="800">
                    Gagal Membaca QR
                  </Heading>
                  <Text color="gray.500" mb={8} fontSize="sm">
                    {error}
                  </Text>
                  <Button
                    bg={buttonBg}
                    color={buttonColor}
                    onClick={resetScan}
                    size="lg"
                    fontSize="sm"
                    fontWeight="600"
                    borderRadius="md"
                    _hover={{ bg: buttonHoverBg }}
                  >
                    Coba Lagi
                  </Button>
                </Box>
              )}
            </VStack>
          )}
        </Container>
      </Box>
    </AdminLayout>
  );
};

(CheckInPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default withAuth(CheckInPage);
