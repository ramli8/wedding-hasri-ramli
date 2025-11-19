/**
 * @file personalisasi/index.tsx
 * @description This is the personalisasi page. User can change the language and the color theme of the website.
 * @module personalisasi
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import React from 'react';
import PageTransition from "@/components/PageLayout";
import ContainerQuery from "@/components/atoms/ContainerQuery";
import PageRow from "@/components/atoms/PageRow";
import BahasaCard from "@/modules/personalisasi/components/PersonalisasiPage/BahasaCard";
import ModeTampilanCard from "@/modules/personalisasi/components/PersonalisasiPage/ModeTampilanCard";
import { useTranslations } from "next-intl";
import { Flex, Box, useColorMode } from "@chakra-ui/react";
import Sidebar from "@/components/organisms/Sidebar";

const Personalisasi = () => {
    const t = useTranslations("Common.modules.personalisasi");
    const { colorMode } = useColorMode();

    return (
        <Flex minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
            <Sidebar />
            <Box
                flex="1"
                ml={{ base: "0", m: "108px", d: "280px" }}
                transition="margin-left 0.3s ease"
                minH="10vh"
                p={2}
            >
                <PageTransition pageTitle={t("title")}>
                    <PageRow>
                        <ContainerQuery>
                            <ModeTampilanCard />
                            <BahasaCard />
                        </ContainerQuery>
                    </PageRow>
                </PageTransition>
            </Box>
        </Flex>
    );
};

export default Personalisasi;