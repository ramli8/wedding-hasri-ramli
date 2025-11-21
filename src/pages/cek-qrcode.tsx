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
      QRCode.toDataURL(
        guestData.qr_code,
        {
          width: 350,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          }
        }
      ).then((url) => {
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

  const borderColor = colorMode === 'light' ? 'gray.200' : 'gray.700';
  const focusBorderColor = colorMode === 'light' ? 'black' : 'white';
  const buttonBg = colorMode === 'light' ? 'black' : 'white';
  const buttonColor = colorMode === 'light' ? 'white' : 'black';
  const buttonHoverBg = colorMode === 'light' ? 'gray.800' : 'gray.200';

  return (
    <>
      <Head>
        <title>Cek QR Code • Hasri & Ramli</title>
        <meta name="description" content="Check and download your wedding invitation QR code" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      {/* Hidden canvas for styled download */}
      <canvas ref={downloadCanvasRef} style={{ display: 'none' }} />

      <Box minH="100vh" bg={colorMode === 'light' ? 'white' : 'black'} position="relative">
        {/* Header */}
        <Flex 
          p={6} 
          bg="transparent"
          align="center" 
          justify="space-between"
          position="sticky"
          top={0}
          zIndex={10}
          backdropFilter="blur(8px)"
        >
          <Link href="/" passHref legacyBehavior>
            <a>
              <IconButton 
                icon={<FaArrowLeft />} 
                aria-label="Kembali"
                variant="ghost" 
                size="sm"
                color={colorMode === 'light' ? 'black' : 'white'}
                _hover={{ bg: 'transparent', opacity: 0.7 }}
              />
            </a>
          </Link>
          <Heading size="md" fontWeight="800" letterSpacing="tight">Cek QR Code</Heading>
          <Box w="32px" /> {/* Spacer for centering */}
        </Flex>

        <Container maxW="sm" py={10} px={6}>
          <VStack spacing={8} align="stretch">
            
            {!guestData ? (
              /* Search Form */
              <VStack spacing={8}>
                <VStack spacing={2} textAlign="center">
                  <Text
                    fontSize="sm"
                    color="gray.500"
                  >
                    Masukkan nomor HP untuk akses QR Code
                  </Text>
                </VStack>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  <VStack spacing={6}>
                    <FormControl isRequired>
                      <FormLabel 
                        fontWeight="500" 
                        fontSize="xs"
                        color="gray.500"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        Nomor WhatsApp / HP
                      </FormLabel>
                      <Input
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={nomorHp}
                        onChange={(e) => setNomorHp(e.target.value)}
                        height="48px"
                        bg="transparent"
                        border="1px solid"
                        borderColor={borderColor}
                        _hover={{ borderColor: 'gray.400' }}
                        _focus={{ borderColor: focusBorderColor, boxShadow: 'none' }}
                        borderRadius="md"
                        fontSize="sm"
                      />
                    </FormControl>

                    {error && (
                      <Alert status="error" variant="subtle" bg="red.50" color="red.900" borderRadius="md" fontSize="sm">
                        <AlertIcon color="red.500" />
                        {error}
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      width="full"
                      height="48px"
                      bg={buttonBg}
                      color={buttonColor}
                      _hover={{ bg: buttonHoverBg }}
                      _active={{ bg: buttonHoverBg }}
                      isLoading={loading}
                      loadingText="Mencari..."
                      borderRadius="md"
                      fontSize="sm"
                      fontWeight="600"
                    >
                      Cari Undangan
                    </Button>
                  </VStack>
                </form>
              </VStack>
            ) : (
              /* QR Code Display */
              <VStack spacing={8} w="full">
                <VStack spacing={2}>
                  <Text fontSize="xs" color="gray.500" fontWeight="600" letterSpacing="widest" textTransform="uppercase">
                    Tamu Undangan
                  </Text>
                  <Heading size="lg" textAlign="center" fontWeight="800" letterSpacing="tight">
                    {guestData.nama}
                  </Heading>
                </VStack>

                <Box
                  p={6}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                  mx="auto"
                >
                  <canvas ref={canvasRef} />
                </Box>

                <Text fontSize="xl" fontWeight="bold" fontFamily="monospace" letterSpacing="wider">
                  {guestData.qr_code}
                </Text>

                <VStack spacing={3} w="full">
                  <Button
                    width="full"
                    height="48px"
                    bg={buttonBg}
                    color={buttonColor}
                    _hover={{ bg: buttonHoverBg }}
                    _active={{ bg: buttonHoverBg }}
                    leftIcon={<FaDownload />}
                    onClick={handleDownload}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight="600"
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
                    fontSize="sm"
                    _hover={{ bg: 'transparent', color: colorMode === 'light' ? 'black' : 'white' }}
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
