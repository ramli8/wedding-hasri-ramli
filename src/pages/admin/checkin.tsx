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
  Badge,
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
        setTimeout(() => reject(new Error('Request timeout. Periksa koneksi internet Anda.')), 15000);
      });

      // OPTIMIZED: Use directCheckIn for faster processing (1 DB call instead of 2)
      console.log('Processing check-in...');
      const result = await Promise.race([
        api.directCheckIn(qrCode),
        timeoutPromise
      ]) as { success: boolean; guest: Tamu | null; error?: string };
      
      console.log('Check-in result:', result);

      if (!result.guest) {
        throw new Error(result.error || 'QR Code tidak valid atau tamu tidak ditemukan.');
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

  return (
    <>
      <Head>
        <title>Scan QR Check-in - Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'} position="relative">
        {/* Header */}
        <Flex 
          p={4} 
          bg={colorMode === 'light' ? 'white' : 'gray.800'} 
          boxShadow="sm" 
          align="center" 
          justify="center"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Heading size="md">Scan Check-in</Heading>
        </Flex>

        <Container maxW="md" py={6} px={4}>
          {!isSecure && (
            <Box bg="orange.100" p={4} borderRadius="md" mb={6} borderLeft="4px solid" borderColor="orange.500">
              <Heading size="sm" color="orange.800" mb={2}>Koneksi Tidak Aman</Heading>
              <Text fontSize="sm" color="orange.800">
                Browser memblokir akses kamera karena Anda tidak menggunakan HTTPS.
              </Text>
              <Text fontSize="sm" color="orange.800" mt={2} fontWeight="bold">
                Solusi (Chrome Android):
              </Text>
              <VStack align="start" pl={4} mt={1} spacing={0} fontSize="xs" color="orange.800">
                <Text>1. Buka chrome://flags/#unsafely-treat-insecure-origin-as-secure</Text>
                <Text>2. Aktifkan (Enabled)</Text>
                <Text>3. Masukkan URL ini: {typeof window !== 'undefined' ? window.location.origin : ''}</Text>
                <Text>4. Klik Relaunch</Text>
              </VStack>
            </Box>
          )}

          {isScanning ? (
            <VStack spacing={6}>
              <Box 
                w="100%" 
                maxW="600px"
                aspectRatio={1}
                borderRadius="xl" 
                overflow="hidden" 
                boxShadow="xl" 
                bg="black" 
                position="relative"
                mx="auto"
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
                  w="300px" 
                  h="300px" 
                  border="3px solid" 
                  borderColor="white"
                  borderRadius="lg"
                  boxShadow="0 0 0 9999px rgba(0,0,0,0.5)"
                  pointerEvents="none"
                  zIndex={2}
                />
                <Text 
                  position="absolute" 
                  bottom="20px" 
                  left="0" 
                  right="0" 
                  textAlign="center" 
                  color="white" 
                  fontWeight="bold"
                  fontSize="md"
                  textShadow="0 2px 4px rgba(0,0,0,0.8)"
                  zIndex={3}
                  px={4}
                >
                  Arahkan kamera ke QR Code
                </Text>
              </Box>
              <Text color="gray.500" fontSize="sm">Pastikan QR Code terlihat jelas dan cukup cahaya</Text>
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              {loading ? (
                <Flex direction="column" align="center" justify="center" py={10}>
                  <Spinner size="xl" color="teal.500" thickness="4px" mb={4} />
                  <Text>Memproses data...</Text>
                </Flex>
              ) : scannedGuest ? (
                <Box 
                  bg={colorMode === 'light' ? 'white' : 'gray.800'} 
                  p={6} 
                  borderRadius="2xl" 
                  boxShadow="lg" 
                  textAlign="center"
                  borderTop="8px solid"
                  borderColor={error ? 'orange.400' : 'green.400'}
                >
                  <Icon 
                    as={error ? FaCheckCircle : FaCheckCircle} 
                    w={16} 
                    h={16} 
                    color={error ? 'orange.400' : 'green.400'} 
                    mb={4} 
                  />
                  
                  <Heading size="lg" mb={2}>
                    {error ? 'Sudah Check-in' : 'Check-in Berhasil!'}
                  </Heading>
                  
                  {error && (
                    <Text color="orange.500" fontWeight="bold" mb={4}>
                      {error}
                    </Text>
                  )}

                  <VStack spacing={3} bg={colorMode === 'light' ? 'gray.50' : 'gray.700'} p={4} borderRadius="xl" mb={6}>
                    <Box>
                      <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">Nama Tamu</Text>
                      <Text fontSize="xl" fontWeight="bold">{scannedGuest.nama}</Text>
                    </Box>
                    
                    <Flex w="100%" justify="space-between">
                      <Box textAlign="center" flex={1}>
                        <Text fontSize="xs" color="gray.500" textTransform="uppercase">Kategori</Text>
                        <Badge colorScheme="blue" mt={1}>{scannedGuest.kategori}</Badge>
                      </Box>
                      <Box textAlign="center" flex={1}>
                        <Text fontSize="xs" color="gray.500" textTransform="uppercase">Hubungan</Text>
                        <Badge colorScheme="purple" mt={1}>{scannedGuest.hubungan}</Badge>
                      </Box>
                    </Flex>
                  </VStack>

                  <Button 
                    variant="outline"
                    colorScheme="gray"
                    size="lg" 
                    w="full" 
                    onClick={resetScan}
                    leftIcon={<FaCamera />}
                    h="50px"
                    fontSize="md"
                    _hover={{ bg: 'gray.100' }}
                  >
                    Scan Tamu Berikutnya
                  </Button>
                </Box>
              ) : (
                <Box textAlign="center" py={10}>
                  <Icon as={FaTimesCircle} w={16} h={16} color="red.500" mb={4} />
                  <Heading size="md" mb={2}>Gagal Membaca QR</Heading>
                  <Text color="gray.500" mb={6}>{error}</Text>
                  <Button colorScheme="blue" onClick={resetScan}>Coba Lagi</Button>
                </Box>
              )}
            </VStack>
          )}
        </Container>
      </Box>
    </>
  );
};

export default withAuth(CheckInPage);
