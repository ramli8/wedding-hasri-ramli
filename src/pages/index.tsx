/**
 * @file index.tsx
 * @description Minimalist wedding invitation landing page
 * @module landing
 * @version 3.2.0
 **/

import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  useColorMode,
  VStack,
  Divider,
  Flex,
  useToast,
} from '@chakra-ui/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import supabase from '@/lib/supabaseClient';
import UcapanForm from '@/modules/ucapan/components/UcapanForm';
import UcapanList from '@/modules/ucapan/components/UcapanList';
import { enterFullscreen } from '@/utils/fullscreen';

interface Guest {
  id: string;
  nama: string;
}

const LandingPage = () => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const { to, admin } = router.query;
  const [guest, setGuest] = useState<Guest | null>(null);
  const [refreshUcapan, setRefreshUcapan] = useState(0);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchGuest = async () => {
      if (to && typeof to === 'string') {
        const { data, error } = await supabase
          .from('tamu')
          .select('id, nama, tgl_baca_undangan')
          .eq('id', to)
          .single();

        if (data && !error) {
          setGuest(data);

          // Update tgl_baca_undangan if this is the first time opening
          if (!data.tgl_baca_undangan) {
            await supabase
              .from('tamu')
              .update({ tgl_baca_undangan: new Date().toISOString() })
              .eq('id', to);
            console.log('✅ tgl_baca_undangan updated');
          }
        }
      }
    };

    if (router.isReady) {
      fetchGuest();
    }
  }, [to, router.isReady]);

  // Handle admin mode via magic link
  useEffect(() => {
    const validateAdminUser = async () => {
      if (admin && typeof admin === 'string') {
        try {
          // Validate that the user_id exists in the users table
          const { data, error } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', admin)
            .single();

          if (data && !error) {
            setIsAdminMode(true);
            setAdminUserId(admin);
          } else {
            console.error('Invalid admin user_id');
            setIsAdminMode(false);
            setAdminUserId(null);
          }
        } catch (error) {
          console.error('Error validating admin user:', error);
          setIsAdminMode(false);
          setAdminUserId(null);
        }
      }
    };

    if (router.isReady) {
      validateAdminUser();
    }
  }, [admin, router.isReady]);

  // Initialize audio (no autoplay)
  useEffect(() => {
    const audio = new Audio('/music/music.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle play button click - Start music & fullscreen
  const handleStartExperience = async () => {
    try {
      // Play music first
      if (audioRef.current) {
        await audioRef.current.play();
        setIsPlaying(true);
        console.log('🎵 Music started');
      }

      // Hide welcome screen immediately for smoother UX
      setShowWelcome(false);

      // Trigger fullscreen with slight delay
      // This gives browser time to process music play as user gesture
      setTimeout(async () => {
        try {
          await enterFullscreen();
          console.log('✅ Fullscreen activated');
        } catch (fsError) {
          console.log('⚠️ Fullscreen blocked:', fsError);
          // Try again on next interaction
          const retryFullscreen = async () => {
            try {
              await enterFullscreen();
              console.log('✅ Fullscreen activated on retry');
              document.removeEventListener('click', retryFullscreen);
              document.removeEventListener('touchstart', retryFullscreen);
            } catch (err) {
              console.log('Fullscreen still blocked');
            }
          };
          document.addEventListener('click', retryFullscreen, { once: true });
          document.addEventListener('touchstart', retryFullscreen, {
            once: true,
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error starting experience:', error);
      // Still hide welcome even if failed
      setShowWelcome(false);
    }
  };

  const handleUcapanSuccess = () => {
    setRefreshUcapan((prev) => prev + 1);
  };

  const buttonBg = colorMode === 'light' ? 'black' : 'white';
  const buttonColor = colorMode === 'light' ? 'white' : 'black';
  const buttonHoverBg = colorMode === 'light' ? 'gray.800' : 'gray.200';

  return (
    <>
      <Head>
        <title>Hasri & Ramli • Wedding Invitation</title>
        <meta
          name="description"
          content="Welcome to Hasri & Ramli's wedding celebration"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      {/* Welcome Splash Screen */}
      {showWelcome && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={colorMode === 'light' ? 'white' : 'black'}
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={8}>
            <VStack spacing={2}>
              <Text
                fontSize="xs"
                fontWeight="600"
                letterSpacing="widest"
                textTransform="uppercase"
                color="gray.500"
              >
                The Wedding of
              </Text>
              <Heading
                fontSize={{ base: '5xl', md: '6xl' }}
                fontWeight="800"
                letterSpacing="tighter"
                lineHeight="0.9"
                color={colorMode === 'light' ? 'black' : 'white'}
              >
                Hasri
                <br />& Ramli
              </Heading>
            </VStack>

            {guest && (
              <VStack spacing={1}>
                <Text
                  fontSize="xs"
                  color="gray.500"
                  letterSpacing="wide"
                  textTransform="uppercase"
                >
                  Kepada Yth.
                </Text>
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color={colorMode === 'light' ? 'black' : 'white'}
                >
                  {guest.nama}
                </Text>
              </VStack>
            )}

            <Button
              onClick={handleStartExperience}
              size="lg"
              bg={colorMode === 'light' ? 'black' : 'white'}
              color={colorMode === 'light' ? 'white' : 'black'}
              _hover={{
                bg: colorMode === 'light' ? 'gray.800' : 'gray.200',
                transform: 'scale(1.05)',
              }}
              _active={{ transform: 'scale(0.95)' }}
              borderRadius="full"
              px={10}
              py={6}
              fontSize="md"
              fontWeight="600"
              leftIcon={<Box fontSize="xl">🎵</Box>}
              transition="all 0.2s"
            >
              Buka Undangan
            </Button>

            <Text fontSize="xs" color="gray.400" mt={2}>
              Tap untuk mulai dengan musik
            </Text>
          </VStack>
        </Box>
      )}

      <Box
        minH="100vh"
        bg={colorMode === 'light' ? 'white' : 'black'}
        position="relative"
      >
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
        >
          <Heading size="md" fontWeight="800" letterSpacing="tight">
            Hasri & Ramli
          </Heading>
        </Flex>

        <Container maxW="md" py={12} px={6}>
          <VStack spacing={12} align="center">
            {/* Hero Section - Minimalist */}
            <VStack spacing={6} textAlign="center" pt={4}>
              <Text
                fontSize="xs"
                fontWeight="600"
                letterSpacing="widest"
                textTransform="uppercase"
                color="gray.500"
              >
                The Wedding of
              </Text>
              <Heading
                fontSize={{ base: '5xl', md: '6xl' }}
                fontWeight="800"
                letterSpacing="tighter"
                lineHeight="0.9"
                color={colorMode === 'light' ? 'black' : 'white'}
              >
                Hasri
                <br />& Ramli
              </Heading>

              {guest && (
                <VStack spacing={2} mt={4} mb={4}>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    letterSpacing="wide"
                    textTransform="uppercase"
                  >
                    Kepada Yth.
                  </Text>
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color={colorMode === 'light' ? 'black' : 'white'}
                  >
                    {guest.nama}
                  </Text>
                </VStack>
              )}

              <Text
                fontSize="md"
                color="gray.500"
                maxW="400px"
                lineHeight="1.6"
                fontWeight="400"
              >
                We invite you to celebrate our special day.
              </Text>
            </VStack>

            {/* CTA Section - Clean */}
            <VStack spacing={4} w="full" maxW="320px">
              <Link href="/cek-qrcode" passHref legacyBehavior>
                <a style={{ width: '100%' }}>
                  <Button
                    width="full"
                    height="50px"
                    bg={buttonBg}
                    color={buttonColor}
                    _hover={{ bg: buttonHoverBg }}
                    _active={{ bg: buttonHoverBg }}
                    fontSize="sm"
                    fontWeight="600"
                    borderRadius="md"
                    transition="all 0.2s"
                  >
                    Cek QR Code
                  </Button>
                </a>
              </Link>

              <Link href="/admin/tamu" passHref legacyBehavior>
                <a style={{ width: '100%' }}>
                  <Button
                    variant="ghost"
                    size="md"
                    w="full"
                    fontSize="sm"
                    fontWeight="500"
                    color="gray.500"
                    _hover={{
                      color: colorMode === 'light' ? 'black' : 'white',
                      bg: 'transparent',
                    }}
                  >
                    Admin Login
                  </Button>
                </a>
              </Link>
            </VStack>
          </VStack>
        </Container>

        <Container maxW="md" px={6}>
          <Divider
            borderColor={colorMode === 'light' ? 'gray.200' : 'gray.800'}
          />
        </Container>

        {/* Ucapan Section */}
        <Container maxW="md" py={12} px={6}>
          <VStack spacing={8} align="stretch">
            <VStack spacing={2} textAlign="center" mb={4}>
              <Heading
                size="lg"
                fontWeight="800"
                letterSpacing="tight"
                color={colorMode === 'light' ? 'black' : 'white'}
              >
                Ucapan & Doa
              </Heading>
              <Text fontSize="sm" color="gray.500">
                Berikan ucapan dan doa terbaik untuk kami
              </Text>
            </VStack>
            {/* Ucapan Form - Only for guests */}
            {!isAdminMode && (
              <UcapanForm
                onSuccess={handleUcapanSuccess}
                guestId={guest?.id || null}
                guestName={guest?.nama || null}
                isAdminMode={false}
                adminUserId={null}
              />
            )}

            <Box py={2}>
              <Divider
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.800'}
              />
            </Box>

            <UcapanList
              refreshTrigger={refreshUcapan}
              isAdminMode={isAdminMode}
              adminUserId={adminUserId}
              guestId={guest?.id || null}
              guestName={guest?.nama || null}
            />
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default LandingPage;
