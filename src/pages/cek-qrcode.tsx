/**
 * @file cek-qrcode.tsx
 * @description QR Code check page - lookup and download QR code by phone number or direct link
 * @version 3.4.0
 **/

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useColorMode,
  useToast,
  Icon,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
  keyframes,
} from '@chakra-ui/react';
import Head from 'next/head';
import {
  FaQrcode,
  FaDownload,
  FaPhone,
  FaCheckCircle,
  FaInstagram,
} from 'react-icons/fa';
import QRCode from 'qrcode';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface GuestData {
  id: string;
  nama: string;
  qr_code: string;
}

const CekQRCode = () => {
  const router = useRouter();
  const { id } = router.query;
  const { colorMode } = useColorMode();
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);

  const [nomorHp, setNomorHp] = useState('');
  const [usernameInstagram, setUsernameInstagram] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'instagram'>('phone');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [error, setError] = useState('');

  // Auto-load guest data if id is present in URL
  useEffect(() => {
    const fetchGuestById = async () => {
      if (id && typeof id === 'string') {
        setInitialLoading(true);
        setError('');

        try {
          const response = await fetch(
            `/api/check-qrcode?id=${encodeURIComponent(id)}`
          );
          const data = await response.json();

          if (!response.ok) {
            setError(data.message || 'Tamu tidak ditemukan');
            return;
          }

          setGuestData(data);
        } catch (err) {
          setError('Terjadi kesalahan saat memuat data');
          console.error(err);
        } finally {
          setInitialLoading(false);
        }
      }
    };

    if (router.isReady) {
      fetchGuestById();
    }
  }, [id, router.isReady]);

  // Generate QR code when guest data is available
  useEffect(() => {
    if (guestData && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        guestData.qr_code,
        {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) {
            console.error('Error generating QR code:', error);
          }
        }
      );
    }
  }, [guestData]);

  // Generate styled QR code for download
  useEffect(() => {
    if (guestData && downloadCanvasRef.current) {
      const canvas = downloadCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (High Resolution)
      canvas.width = 800;
      canvas.height = 1000;

      // Background - clean white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 800, 1000);

      // Double Border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, 720, 920);

      ctx.lineWidth = 1;
      ctx.strokeRect(50, 50, 700, 900);

      // Title
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';

      ctx.font = '400 48px "Playfair Display", serif';
      ctx.fillText('The Wedding of', 400, 140);

      ctx.font = '400 64px "Playfair Display", serif';
      ctx.fillText('Hasri & Ramli', 400, 220);

      // Divider line
      ctx.beginPath();
      ctx.moveTo(350, 260);
      ctx.lineTo(450, 260);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Guest name
      ctx.fillStyle = '#000000';
      ctx.font = '500 36px sans-serif';
      ctx.fillText('Dear,', 400, 340);

      ctx.font = 'bold 48px sans-serif';
      ctx.fillText(guestData.nama, 400, 400);

      // Generate QR code as data URL
      QRCode.toDataURL(guestData.qr_code, {
        width: 350,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => {
          const img = new Image();
          img.onload = () => {
            // Draw QR code centered
            ctx.drawImage(img, 225, 450, 350, 350);

            // QR Code number
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 32px monospace';
            ctx.fillText(guestData.qr_code, 400, 840);

            // Footer
            ctx.fillStyle = '#666666';
            ctx.font = 'italic 24px serif';
            ctx.fillText('Please show this QR code at the reception', 400, 900);
          };
          img.src = url;
        })
        .catch((error) => {
          console.error('Error generating QR for download:', error);
        });
    }
  }, [guestData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGuestData(null);

    const searchValue =
      searchType === 'phone' ? nomorHp.trim() : usernameInstagram.trim();

    if (!searchValue) {
      setError(
        searchType === 'phone'
          ? 'Nomor HP wajib diisi'
          : 'Username Instagram wajib diisi'
      );
      return;
    }

    setLoading(true);

    try {
      const param =
        searchType === 'phone'
          ? `nomor_hp=${encodeURIComponent(searchValue)}`
          : `username_instagram=${encodeURIComponent(searchValue)}`;

      const response = await fetch(`/api/check-qrcode?${param}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Tamu tidak ditemukan');
        return;
      }

      setGuestData(data);
      toast({
        title: 'Berhasil!',
        description: `QR Code untuk ${data.nama} ditemukan`,
        status: 'success',
        duration: 3000,
        position: 'top',
      });
    } catch (err) {
      setError('Terjadi kesalahan saat mencari data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!downloadCanvasRef.current || !guestData) return;

    downloadCanvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invitation-${guestData.nama.replace(/\s+/g, '-')}.png`;
        link.click();
        URL.revokeObjectURL(url);

        toast({
          title: 'Downloaded!',
          description: 'Kartu undangan digital berhasil disimpan',
          status: 'success',
          duration: 3000,
          position: 'top',
        });
      }
    });
  };

  const handleReset = () => {
    setNomorHp('');
    setUsernameInstagram('');
    setGuestData(null);
    setError('');
  };

  const isDark = colorMode === 'dark';

  const brandColor = isDark ? 'blue.400' : 'blue.600';
  const brandHoverColor = isDark ? 'blue.500' : 'blue.700';

  return (
    <>
      <Head>
        <title>Cek QR Code • Hasri & Ramli</title>
        <meta
          name="description"
          content="Check and download your wedding invitation QR code"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      {/* Hidden canvas for styled download */}
      <canvas ref={downloadCanvasRef} style={{ display: 'none' }} />

      <Flex
        minH="100vh"
        bg={isDark ? 'gray.900' : 'gray.50'}
        position="relative"
        align="center"
        justify="center"
        px={4}
        py={12}
        overflow="hidden"
      >
        {/* Background Decor */}
        <Box
          pos="absolute"
          top="-20%"
          left="-10%"
          w="500px"
          h="500px"
          bg={isDark ? 'blue.900' : 'blue.100'}
          opacity={isDark ? 0.05 : 0.4}
          filter="blur(120px)"
          borderRadius="full"
          zIndex={0}
        />

        <Container
          maxW="480px"
          position="relative"
          zIndex={1}
          animation={`${fadeIn} 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)`}
          p={0}
        >
          {initialLoading ? (
            /* Loading State */
            <Flex
              direction="column"
              align="center"
              justify="center"
              minH="400px"
              gap={4}
            >
              <Box
                w={16}
                h={16}
                borderRadius="full"
                bg={isDark ? 'whiteAlpha.100' : 'white'}
                display="flex"
                alignItems="center"
                justifyContent="center"
                shadow="sm"
              >
                <Spinner size="lg" color={brandColor} thickness="3px" />
              </Box>
              <Text color="gray.500" fontSize="sm" fontWeight="500">
                Memuat data...
              </Text>
            </Flex>
          ) : !guestData ? (
            /* Search Form */
            <VStack spacing={8}>
              {/* Header Section */}
              <VStack spacing={2} textAlign="center">
                <Box
                  w={16}
                  h={16}
                  borderRadius="2xl"
                  bg={isDark ? 'whiteAlpha.100' : 'white'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={2}
                  shadow="sm"
                >
                  <Icon as={FaQrcode} boxSize={8} color={brandColor} />
                </Box>
                <Heading
                  size="xl"
                  fontWeight="800"
                  letterSpacing="-0.02em"
                  color={isDark ? 'white' : 'gray.800'}
                >
                  Cek QR Code
                </Heading>
                <Text
                  fontSize="md"
                  color={isDark ? 'whiteAlpha.600' : 'gray.500'}
                  maxW="xs"
                  lineHeight="tall"
                >
                  Masukkan nomor HP atau username Instagram untuk akses undangan
                </Text>
              </VStack>

              {/* Card Form */}
              <Box
                w="full"
                bg={isDark ? 'whiteAlpha.50' : 'white'}
                borderRadius="32px"
                border="1px solid"
                borderColor={isDark ? 'whiteAlpha.100' : 'gray.100'}
                p={{ base: 6, md: 8 }}
                pos="relative"
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
                {/* Search Type Toggle */}
                <Flex
                  w="full"
                  bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                  borderRadius="2xl"
                  p={1.5}
                  mb={6}
                >
                  <Button
                    flex={1}
                    size="md"
                    h="44px"
                    variant="ghost"
                    bg={
                      searchType === 'phone'
                        ? isDark
                          ? 'whiteAlpha.200'
                          : 'white'
                        : 'transparent'
                    }
                    color={
                      searchType === 'phone'
                        ? isDark
                          ? 'white'
                          : 'blue.600'
                        : 'gray.500'
                    }
                    fontWeight={searchType === 'phone' ? '700' : '500'}
                    boxShadow={searchType === 'phone' ? 'sm' : 'none'}
                    borderRadius="xl"
                    onClick={() => setSearchType('phone')}
                    _hover={{
                      bg:
                        searchType === 'phone'
                          ? isDark
                            ? 'whiteAlpha.200'
                            : 'white'
                          : 'transparent',
                    }}
                    transition="all 0.2s"
                  >
                    <Icon as={FaPhone} mr={2} boxSize={3} />
                    Nomor HP
                  </Button>
                  <Button
                    flex={1}
                    size="md"
                    h="44px"
                    variant="ghost"
                    bg={
                      searchType === 'instagram'
                        ? isDark
                          ? 'whiteAlpha.200'
                          : 'white'
                        : 'transparent'
                    }
                    color={
                      searchType === 'instagram'
                        ? isDark
                          ? 'white'
                          : 'blue.600'
                        : 'gray.500'
                    }
                    fontWeight={searchType === 'instagram' ? '700' : '500'}
                    boxShadow={searchType === 'instagram' ? 'sm' : 'none'}
                    borderRadius="xl"
                    onClick={() => setSearchType('instagram')}
                    _hover={{
                      bg:
                        searchType === 'instagram'
                          ? isDark
                            ? 'whiteAlpha.200'
                            : 'white'
                          : 'transparent',
                    }}
                    transition="all 0.2s"
                  >
                    <Icon as={FaInstagram} mr={2} boxSize={4} />
                    Instagram
                  </Button>
                </Flex>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  <VStack spacing={6}>
                    <FormControl isRequired>
                      <FormLabel
                        fontSize="xs"
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="wider"
                        color={isDark ? 'gray.400' : 'gray.500'}
                        mb={3}
                      >
                        {searchType === 'phone'
                          ? 'Nomor WhatsApp / HP'
                          : 'Username Instagram'}
                      </FormLabel>
                      {searchType === 'phone' ? (
                        <Input
                          type="tel"
                          placeholder="Contoh: 08123456789"
                          value={nomorHp}
                          onChange={(e) => setNomorHp(e.target.value)}
                          height="50px"
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
                          fontSize="sm"
                          fontWeight="500"
                          pl={4}
                        />
                      ) : (
                        <Input
                          type="text"
                          placeholder="Contoh: @username"
                          value={usernameInstagram}
                          onChange={(e) => setUsernameInstagram(e.target.value)}
                          height="50px"
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
                          fontSize="sm"
                          fontWeight="500"
                          pl={4}
                        />
                      )}
                    </FormControl>

                    {error && (
                      <Alert
                        status="error"
                        variant="subtle"
                        bg="red.50"
                        color="red.600"
                        borderRadius="2xl"
                        fontSize="sm"
                        py={3}
                        border="1px solid"
                        borderColor="red.100"
                      >
                        <AlertIcon color="red.500" boxSize={4} />
                        {error}
                      </Alert>
                    )}

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
                        bg: brandHoverColor,
                        transform: 'translateY(0)',
                      }}
                      isLoading={loading}
                      loadingText="Mencari Data..."
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight="700"
                      letterSpacing="0.05em"
                      boxShadow="xl"
                      transition="all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)"
                    >
                      CARI QR CODE
                    </Button>
                  </VStack>
                </form>
              </Box>

              {/* Footer text */}
              <Text
                textAlign="center"
                fontSize="xs"
                color={isDark ? 'whiteAlpha.400' : 'gray.400'}
                fontWeight="500"
                letterSpacing="wide"
              >
                © 2024 The Wedding of Hasri & Ramli
              </Text>
            </VStack>
          ) : (
            /* QR Code Display */
            <VStack spacing={8}>
              {/* Success Header */}
              <VStack spacing={2} textAlign="center">
                <Box
                  w={12}
                  h={12}
                  borderRadius="full"
                  bg="green.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mb={2}
                >
                  <Icon as={FaCheckCircle} boxSize={6} color="green.500" />
                </Box>
                <Text
                  fontSize="xs"
                  color={isDark ? 'whiteAlpha.600' : 'gray.500'}
                  fontWeight="700"
                  letterSpacing="widest"
                  textTransform="uppercase"
                >
                  Valid Invitation
                </Text>
                <Heading
                  size="xl"
                  fontWeight="800"
                  letterSpacing="-0.02em"
                  color={isDark ? 'white' : 'gray.900'}
                >
                  {guestData.nama}
                </Heading>
              </VStack>

              {/* QR Code Card */}
              <Box
                w="full"
                bg={isDark ? 'whiteAlpha.50' : 'white'}
                borderRadius="32px"
                border="1px solid"
                borderColor={isDark ? 'whiteAlpha.100' : 'gray.100'}
                p={{ base: 6, md: 8 }}
                pos="relative"
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
                  <Box
                    p={4}
                    bg="white"
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <canvas ref={canvasRef} />
                  </Box>

                  <Box
                    bg={isDark ? 'whiteAlpha.100' : 'gray.50'}
                    px={6}
                    py={3}
                    borderRadius="xl"
                  >
                    <Text
                      fontSize="xl"
                      fontWeight="bold"
                      fontFamily="monospace"
                      letterSpacing="wider"
                      color={isDark ? 'white' : 'gray.700'}
                    >
                      {guestData.qr_code}
                    </Text>
                  </Box>

                  <Text
                    fontSize="xs"
                    color={isDark ? 'whiteAlpha.500' : 'gray.400'}
                    textAlign="center"
                    maxW="xs"
                  >
                    Tunjukkan QR Code ini kepada penerima tamu saat tiba di
                    lokasi acara.
                  </Text>
                </VStack>
              </Box>

              {/* Action Buttons */}
              <VStack spacing={4} w="full">
                <Button
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
                    bg: brandHoverColor,
                    transform: 'translateY(0)',
                  }}
                  leftIcon={<FaDownload />}
                  onClick={handleDownload}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="700"
                  letterSpacing="0.05em"
                  boxShadow="xl"
                  transition="all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)"
                >
                  UNDUH INVITATION
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  w="full"
                  h="48px"
                  onClick={handleReset}
                  color={isDark ? 'whiteAlpha.600' : 'gray.500'}
                  fontWeight="600"
                  fontSize="sm"
                  borderRadius="full"
                  _hover={{
                    bg: isDark ? 'whiteAlpha.100' : 'gray.100',
                    color: isDark ? 'white' : 'gray.800',
                  }}
                >
                  Cari Data Lain
                </Button>
              </VStack>
            </VStack>
          )}
        </Container>
      </Flex>
    </>
  );
};

export default CekQRCode;
