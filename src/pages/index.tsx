/**
 * @file index.tsx
 * @description Minimalist wedding invitation landing page
 * @module landing
 * @version 3.2.0
 **/

import { Box, Button, Container, Heading, Text, useColorMode, VStack, Divider, Flex } from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";

const LandingPage = () => {
	const { colorMode } = useColorMode();

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
			</Box>
		</>
	);
};

export default LandingPage;
