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

	return (
		<>
			<Head>
				<title>Hasri & Ramli • Wedding Invitation</title>
				<meta name="description" content="Welcome to Hasri & Ramli's wedding celebration" />
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
					<Heading size="md">Hasri & Ramli</Heading>
				</Flex>

				<Container maxW="md" py={8} px={4}>
					<VStack spacing={10} align="center">
						{/* Hero Section - Minimalist */}
						<VStack spacing={4} textAlign="center" pt={4}>
							<Text
								fontSize="xs"
								fontWeight="500"
								letterSpacing="0.3em"
								textTransform="uppercase"
								color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
							>
								The Wedding of
							</Text>
							<Heading
								fontSize={{ base: "4xl", md: "5xl" }}
								fontWeight="400"
								letterSpacing="tight"
								lineHeight="1.1"
								color={colorMode === 'light' ? 'gray.800' : 'white'}
								fontFamily="heading"
							>
								Hasri & Ramli
							</Heading>
							
							<Divider 
								w="60px" 
								borderColor={colorMode === 'light' ? 'teal.500' : 'teal.300'} 
								borderWidth="1px"
								opacity={0.6}
								my={2}
							/>

							{guest && (
								<VStack spacing={1} mt={2} mb={2}>
									<Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
										Kepada Yth. Bapak/Ibu/Saudara/i
									</Text>
									<Text fontSize="xl" fontWeight="bold" color={colorMode === 'light' ? 'gray.800' : 'white'}>
										{guest.nama}
									</Text>
								</VStack>
							)}

							<Text
								fontSize="md"
								color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
								maxW="400px"
								lineHeight="1.8"
								fontStyle="italic"
								fontFamily="heading"
							>
								"We invite you to celebrate our special day"
							</Text>
						</VStack>

						{/* CTA Section - Clean */}
						<VStack spacing={4} w="full" maxW="400px">
							<Link href="/cek-qrcode" passHref legacyBehavior>
								<a style={{ width: '100%' }}>
									<Button
										colorScheme="teal"
										size="lg"
										w="full"
										h="50px"
										fontSize="md"
										fontWeight="500"
										borderRadius="full"
										_hover={{
											transform: "translateY(-1px)",
											boxShadow: "lg"
										}}
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
										fontWeight="400"
										color={colorMode === 'light' ? 'gray.500' : 'gray.500'}
										_hover={{
											color: colorMode === 'light' ? 'teal.600' : 'teal.300',
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

				<Divider />

				{/* Ucapan Section */}
				<Container maxW="md" py={8} px={4}>
					<VStack spacing={6} align="stretch">
						<VStack spacing={2} textAlign="center">
							<Heading size="lg" color={colorMode === 'light' ? 'gray.800' : 'white'}>
								Ucapan & Doa
							</Heading>
							<Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
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

						<Divider />

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
