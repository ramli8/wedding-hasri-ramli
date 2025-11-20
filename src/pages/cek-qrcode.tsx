/**
 * @file cek-qrcode.tsx
 * @description QR Code check page - lookup and download QR code by phone number
 * @version 3.2.0
 **/

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
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
  AlertDescription,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import Head from 'next/head';
import Link from 'next/link';
import { FaQrcode, FaDownload, FaPhone, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import QRCode from 'qrcode';

interface GuestData {
  id: string;
  nama: string;
  qr_code: string;
}

const CekQRCode = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);

  const [nomorHp, setNomorHp] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [error, setError] = useState('');

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
            dark: '#1A202C',
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

      // Decorative Border
      ctx.strokeStyle = '#D1D5DB'; // Gray 300
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 720, 920);

      // Inner Border
      ctx.strokeStyle = '#E5E7EB'; // Gray 200
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 50, 700, 900);

      // Title
      ctx.fillStyle = '#1A202C'; // Gray 900
      // Use a serif font if available, fallback to serif
      ctx.font = '400 48px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText('The Wedding of', 400, 140);

      ctx.font = '400 64px "Playfair Display", serif';
      ctx.fillText('Hasri & Ramli', 400, 220);

      // Divider line
      ctx.strokeStyle = '#319795'; // Teal 500
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(350, 260);
      ctx.lineTo(450, 260);
      ctx.stroke();

      // Guest name
      ctx.fillStyle = '#2D3748'; // Gray 800
      ctx.font = '500 36px sans-serif';
      ctx.fillText('Dear,', 400, 340);
      
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText(guestData.nama, 400, 400);

      // Generate QR code as data URL
      QRCode.toDataURL(
        guestData.qr_code,
        {
          width: 350,
          margin: 1,
          color: {
            dark: '#1A202C',
            light: '#FFFFFF',
          }
        }
      ).then((url) => {
        const img = new Image();
        img.onload = () => {
          // Draw QR code centered
          ctx.drawImage(img, 225, 450, 350, 350);

          // QR Code number
          ctx.fillStyle = '#4A5568'; // Gray 600
          ctx.font = 'bold 32px monospace';
          ctx.fillText(guestData.qr_code, 400, 840);

          // Footer
          ctx.fillStyle = '#718096'; // Gray 500
          ctx.font = 'italic 24px serif';
          ctx.fillText('Please show this QR code at the reception', 400, 900);
        };
        img.src = url;
      }).catch((error) => {
        console.error('Error generating QR for download:', error);
      });
    }
  }, [guestData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGuestData(null);

    if (!nomorHp.trim()) {
      setError('Nomor HP wajib diisi');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/check-qrcode?nomor_hp=${encodeURIComponent(nomorHp)}`);
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
    setGuestData(null);
    setError('');
  };

  return (
    <>
      <Head>
        <title>Cek QR Code • Hasri & Ramli</title>
        <meta name="description" content="Check and download your wedding invitation QR code" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      {/* Hidden canvas for styled download */}
      <canvas ref={downloadCanvasRef} style={{ display: 'none' }} />

      <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'} position="relative">
        {/* Header */}
        <Flex 
          p={4} 
          bg={colorMode === 'light' ? 'white' : 'gray.800'} 
          boxShadow="sm" 
          align="center" 
          justify="space-between"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Link href="/" passHref legacyBehavior>
            <a>
              <IconButton 
                icon={<FaArrowLeft />} 
                aria-label="Kembali"
                variant="ghost" 
                size="sm"
                color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              />
            </a>
          </Link>
          <Heading size="md">Cek QR Code</Heading>
          <Box w="40px" /> {/* Spacer for centering */}
        </Flex>

        <Container maxW="md" py={6} px={4}>
          <VStack spacing={6} align="stretch">
            
            {!guestData ? (
              /* Search Form */
              <VStack spacing={6}>
                <VStack spacing={2} textAlign="center">
                  <Text
                    fontSize="sm"
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                  >
                    Masukkan nomor HP untuk akses QR Code
                  </Text>
                </VStack>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel 
                        fontWeight="500" 
                        fontSize="sm"
                        color={colorMode === 'light' ? 'gray.600' : 'gray.300'}
                      >
                        Nomor WhatsApp / HP
                      </FormLabel>
                      <Input
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={nomorHp}
                        onChange={(e) => setNomorHp(e.target.value)}
                        size="lg"
                        borderRadius="lg"
                        focusBorderColor="teal.500"
                        isDisabled={loading}
                        bg={colorMode === 'light' ? 'white' : 'gray.700'}
                      />
                    </FormControl>

                    {error && (
                      <Alert status="error" borderRadius="md" fontSize="sm">
                        <AlertIcon />
                        {error}
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      colorScheme="teal"
                      size="lg"
                      w="full"
                      h="50px"
                      isLoading={loading}
                      loadingText="Mencari..."
                      borderRadius="full"
                      fontSize="md"
                      fontWeight="500"
                      _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                    >
                      Cari Undangan
                    </Button>
                  </VStack>
                </form>
              </VStack>
            ) : (
              /* QR Code Display */
              <VStack spacing={6} w="full">
                <VStack spacing={1}>
                  <Text fontSize="sm" color="teal.500" fontWeight="600" letterSpacing="wide" textTransform="uppercase">
                    Tamu Undangan
                  </Text>
                  <Heading size="lg" textAlign="center" fontFamily="heading">
                    {guestData.nama}
                  </Heading>
                </VStack>

                <Box
                  p={4}
                  bg="white"
                  borderRadius="xl"
                  boxShadow="md"
                  mx="auto"
                >
                  <canvas ref={canvasRef} />
                </Box>

                <Text fontSize="xl" fontWeight="bold" fontFamily="monospace" letterSpacing="wider">
                  {guestData.qr_code}
                </Text>

                <VStack spacing={3} w="full">
                  <Button
                    colorScheme="teal"
                    size="lg"
                    w="full"
                    h="50px"
                    borderRadius="full"
                    leftIcon={<FaDownload />}
                    onClick={handleDownload}
                    _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                  >
                    Simpan Undangan
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    w="full"
                    onClick={handleReset}
                    color="gray.500"
                    fontWeight="normal"
                  >
                    Cari Nomor Lain
                  </Button>
                </VStack>
              </VStack>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default CekQRCode;
