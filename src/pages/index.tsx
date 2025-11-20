/**
 * @file index.tsx
 * @description Minimalist wedding invitation landing page
 * @module landing
 * @version 3.1.0
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
			</Head>

			<Flex 
				minH="100vh" 
				align="center" 
				justify="center" 
				bg={colorMode === 'light' ? 'white' : 'gray.900'}
				direction="column"
			>
				<Container maxW="container.md" py={{ base: 12, md: 20 }}>
					<VStack spacing={{ base: 12, md: 16 }} align="center">
						{/* Hero Section - Minimalist */}
						<VStack spacing={6} textAlign="center">
							<Text
								fontSize={{ base: "xs", md: "sm" }}
								fontWeight="500"
								letterSpacing="0.3em"
								textTransform="uppercase"
								color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
							>
								The Wedding of
							</Text>
							<Heading
								fontSize={{ base: "5xl", md: "7xl" }}
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
								my={4}
							/>

							<Text
								fontSize={{ base: "md", md: "lg" }}
								color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
								maxW="500px"
								lineHeight="1.8"
								fontStyle="italic"
								fontFamily="heading"
							>
								"We invite you to celebrate our special day"
							</Text>
						</VStack>

						{/* CTA Section - Clean */}
						<VStack spacing={6} w="full" maxW="320px">
							<Link href="/cek-qrcode" passHref legacyBehavior>
								<a style={{ width: '100%' }}>
									<Button
										colorScheme="teal"
										size="lg"
										w="full"
										h="56px"
										fontSize="sm"
										fontWeight="500"
										letterSpacing="wide"
										borderRadius="full"
										_hover={{
											transform: "translateY(-2px)",
											boxShadow: "lg"
										}}
										transition="all 0.3s"
									>
										CEK QR CODE
									</Button>
								</a>
							</Link>

							<Link href="/admin/tamu" passHref legacyBehavior>
								<a style={{ width: '100%' }}>
									<Button
										variant="ghost"
										colorScheme="gray"
										size="sm"
										w="full"
										fontSize="xs"
										fontWeight="400"
										letterSpacing="wider"
										color={colorMode === 'light' ? 'gray.400' : 'gray.600'}
										_hover={{
											color: colorMode === 'light' ? 'teal.600' : 'teal.300',
											bg: 'transparent'
										}}
									>
										ADMIN LOGIN
									</Button>
								</a>
							</Link>
						</VStack>
					</VStack>
				</Container>
			</Flex>
		</>
	);
};

export default LandingPage;
