/**
 * @file index.tsx
 * @description This is the main page. It is used to display the main page.
 * @module dashboard
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import Carousel from "@/components/molecules/Carousel";
import { CardDynamicIconShadow } from "@/components/organisms/CardIconShadow";
import { menuItem } from "@/data/menu";
import { Box, Button, Flex, Text, useColorMode } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import Head from "next/head";
import Link from "next/link";
import WeddingLayout from "@/components/WeddingLayout";

const Beranda = () => {
	// Data dummy untuk menggantikan AccountInfoContext
	const accountInfo = {
		nickname: 'Demo',
		name: 'Demo User'
	};
	const { nickname, name } = accountInfo;
	const t = useTranslations("Beranda");
	const commonTranslations = useTranslations("Common");
	const { colorMode } = useColorMode();

	return (
		<>
			<Head>
				<title>
					{commonTranslations("modules.beranda.title") +
						" • " +
						process.env.NEXT_PUBLIC_APP_NAME_FULL}
				</title>
			</Head>
			<Flex direction="column" mb={8}>
				<Carousel duration={8000} w="100%" borderRadius="24px" mb={8}>
					<Flex
						bgGradient={
							colorMode === 'light'
								? 'linear(to-tr, red.500, orange.500)'
								: 'linear(to-tr, red.600, orange.600)'
						}
						alignItems="center"
						p="32px 56px"
						h="300px"
					>
						<Box>
							<Text
								fontSize="28px"
								color="white"
								// className={poppins.className}
								lineHeight="1.111"
							>
								Wedding Invitation Portal
							</Text>
							<Text
								fontSize="16px"
								fontWeight="500"
								color="white"
								mt="8px"
								lineHeight="1.5"
							>
								Manage your wedding invitations and guests
							</Text>
						</Box>
					</Flex>
					<Flex
						bgGradient={
							colorMode === 'light'
								? 'linear(to-tr, blue.500, cyan.500)'
								: 'linear(to-tr, blue.600, cyan.600)'
						}
						alignItems="center"
						p="32px 56px"
						h="300px"
					>
						<Box>
							<Text
								fontSize="28px"
								color="white"
								// className={poppins.className}
								lineHeight="1.111"
							>
								Manage Your Guests
							</Text>
							<Text
								fontSize="16px"
								fontWeight="500"
								color="white"
								mt="8px"
								lineHeight="1.5"
							>
								Track RSVPs and manage your guest list
							</Text>
						</Box>
					</Flex>
				</Carousel>
			</Flex>
			<Flex wrap="wrap" gap={6} mb={8}>
				{menuItem
					.filter(({ isShown, name }) => name !== "beranda" && (!isShown || isShown(accountInfo)))
					.map(({ name, url, icon }) => {

						return <CardDynamicIconShadow
							key={"card-dinamy-icon-home-" + name}
							title={commonTranslations(`modules.${name}.title`)}
							subtitle={commonTranslations(`modules.${name}.subtitle`)}
							link={url}
							icon={<MaterialIcon name={icon} size={30} fill={1} />}
						/>
					})}
			</Flex>
			<Flex justifyContent="center" mt="40px" mb="20px">
				<Link href="/admin/tamu" passHref legacyBehavior>
					<a>
						<Button colorScheme="teal" size="lg">
							Kelola Tamu Undangan
						</Button>
					</a>
				</Link>
			</Flex>
		</>
	);
};

Beranda.getLayout = (page: React.ReactNode) => {
	return (
		<WeddingLayout pageTitle="Dashboard">
			{page}
		</WeddingLayout>
	);
};

export default Beranda;
