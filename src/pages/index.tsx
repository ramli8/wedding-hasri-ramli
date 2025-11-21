/**
 * @file index.tsx
 * @description Minimalist wedding invitation landing page
 * @module landing
 * @version 3.2.0
 **/

import { Box, Button, Container, Heading, Text, useColorMode, VStack, Divider, Flex } from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import UcapanForm from "@/modules/ucapan/components/UcapanForm";
import UcapanList from "@/modules/ucapan/components/UcapanList";


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

	useEffect(() => {
		const fetchGuest = async () => {
			if (to && typeof to === 'string') {
				const { data, error } = await supabase
					.from('tamu')
					.select('id, nama')
					.eq('id', to)
					.single();
				
				if (data && !error) {
					setGuest(data);
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

	const handleUcapanSuccess = () => {
		setRefreshUcapan(prev => prev + 1);
	};

	const buttonBg = colorMode === 'light' ? 'black' : 'white';
	const buttonColor = colorMode === 'light' ? 'white' : 'black';
	const buttonHoverBg = colorMode === 'light' ? 'gray.800' : 'gray.200';

	return (
		<>
			<Head>
				<title>Hasri & Ramli • Wedding Invitation</title>
				<meta name="description" content="Welcome to Hasri & Ramli's wedding celebration" />
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
			</Head>

			<Box minH="100vh" bg={colorMode === 'light' ? 'white' : 'black'} position="relative">
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
					<Heading size="md" fontWeight="800" letterSpacing="tight">Hasri & Ramli</Heading>
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
								fontSize={{ base: "5xl", md: "6xl" }}
								fontWeight="800"
								letterSpacing="tighter"
								lineHeight="0.9"
								color={colorMode === 'light' ? 'black' : 'white'}
							>
								Hasri<br/>& Ramli
							</Heading>
							
							{guest && (
								<VStack spacing={2} mt={4} mb={4}>
									<Text fontSize="xs" color="gray.500" letterSpacing="wide" textTransform="uppercase">
										Kepada Yth.
									</Text>
									<Text fontSize="xl" fontWeight="bold" color={colorMode === 'light' ? 'black' : 'white'}>
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
											bg: 'transparent'
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
					<Divider borderColor={colorMode === 'light' ? 'gray.200' : 'gray.800'} />
				</Container>

				{/* Ucapan Section */}
				<Container maxW="md" py={12} px={6}>
					<VStack spacing={8} align="stretch">
						<VStack spacing={2} textAlign="center" mb={4}>
							<Heading size="lg" fontWeight="800" letterSpacing="tight" color={colorMode === 'light' ? 'black' : 'white'}>
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
							<Divider borderColor={colorMode === 'light' ? 'gray.200' : 'gray.800'} />
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
