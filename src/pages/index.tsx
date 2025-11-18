/**
 * @file index.tsx
 * @description This is the main page. It is used to display the main page.
 * @module dashboard
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import PageTransition from "@/components/PageLayout";
import ContainerQuery from "@/components/atoms/ContainerQuery";
import { MaterialIcon } from "@/components/atoms/MaterialIcon";
import PageRow from "@/components/atoms/PageRow";
import Wrapper from "@/components/atoms/Wrapper";
import Carousel from "@/components/molecules/Carousel";
import { CardDynamicIconShadow } from "@/components/organisms/CardIconShadow";
import PlainCard from "@/components/organisms/Cards/Card";
import { menuItem } from "@/data/menu";
import AccountInfoContext from "@/providers/AccountInfoProvider";
import { Box, Flex, Text, useColorMode } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import Head from "next/head";
import { useContext } from "react";

const Beranda = () => {
	const { nickname, name } = useContext(AccountInfoContext);
	const t = useTranslations("Beranda");
	const commonTranslations = useTranslations("Common");
	const { colorMode } = useColorMode();
	const accountInfo = useContext(AccountInfoContext);

	return (
		<>
			<PageTransition pageTitle={t("hi", { name: nickname || name })}>
				<Head>
					<title>
						{commonTranslations("modules.beranda.title") +
							" • " +
							process.env.NEXT_PUBLIC_APP_NAME_FULL}
					</title>
				</Head>
				<PageRow>
					<ContainerQuery>
						<PlainCard p="0px">
							<Carousel duration={8000} w="100%" borderRadius="24px">
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
											myITS Portal
										</Text>
										<Text
											fontSize="16px"
											fontWeight="500"
											color="white"
											mt="8px"
											lineHeight="1.5"
										>
											Rumah aplikasi myITS
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
											myITS Academics
										</Text>
										<Text
											fontSize="16px"
											fontWeight="500"
											color="white"
											mt="8px"
											lineHeight="1.5"
										>
											Kelola perkuliahan di sini
										</Text>
									</Box>
								</Flex>
							</Carousel>
						</PlainCard>
						<Wrapper mt="-8px">
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
						</Wrapper>
					</ContainerQuery>
				</PageRow>
			</PageTransition>
		</>
	);
};

export default Beranda;
