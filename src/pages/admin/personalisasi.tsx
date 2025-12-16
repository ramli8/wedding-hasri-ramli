/**
 * @file admin/personalisasi.tsx
 * @description Protected personalisasi page. User can change the language and the color theme of the website.
 * @module admin/personalisasi
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 2.0.0
 **/

import React, { useContext } from 'react';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import PageRow from '@/components/atoms/PageRow';
import BahasaCard from '@/modules/personalisasi/components/PersonalisasiPage/BahasaCard';
import ModeTampilanCard from '@/modules/personalisasi/components/PersonalisasiPage/ModeTampilanCard';
import { useTranslations } from 'next-intl';
import { Box, useColorMode, VStack, Flex, Text } from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Head from 'next/head';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import AppSettingContext from '@/providers/AppSettingProvider';
import withAuth from '@/hoc/withAuth';

const PersonalisasiPage = () => {
  const t = useTranslations('Common.modules.personalisasi');
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  return (
    <>
      <Head>
        <title>Personalisasi - Pengaturan Tampilan</title>
      </Head>
      <Box p={4}>
        <PageRow>
          <ContainerQuery>
            <VStack spacing={6} align="stretch">
              {/* Header Section - Clean Typography */}
              {/* Header Section - Minimalist & Modern */}
              <Flex justify="space-between" align="center" mb={6} gap={4}>
                <Box>
                  <Text
                    fontSize={{ base: 'xl', md: '2xl' }}
                    fontWeight="700"
                    color={colorMode === 'light' ? 'gray.900' : 'white'}
                    letterSpacing="-0.02em"
                    mb="4px"
                  >
                    {t('title')}
                  </Text>
                  <Text
                    fontSize="14px"
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Atur tema warna dan bahasa sesuai preferensi Anda
                  </Text>
                </Box>

                {/* User Profile & Actions */}
                <Box display={{ base: 'none', md: 'block' }}>
                  <UserProfileActions />
                </Box>
              </Flex>

              {/* Cards Section */}
              <ModeTampilanCard />
              <BahasaCard />
            </VStack>
          </ContainerQuery>
        </PageRow>
      </Box>
    </>
  );
};

// Protect with authentication
const ProtectedPersonalisasiPage = withAuth(PersonalisasiPage);

// Preserve getLayout after HOC
(ProtectedPersonalisasiPage as any).getLayout = function getLayout(
  page: React.ReactElement
) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedPersonalisasiPage;
