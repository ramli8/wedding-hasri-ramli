/**
 * @file personalisasi/index.tsx
 * @description This is the personalisasi page. User can change the language and the color theme of the website.
 * @module personalisasi
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import React from 'react';
import PageTransition from '@/components/PageLayout';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import PageRow from '@/components/atoms/PageRow';
import BahasaCard from '@/modules/personalisasi/components/PersonalisasiPage/BahasaCard';
import ModeTampilanCard from '@/modules/personalisasi/components/PersonalisasiPage/ModeTampilanCard';
import { useTranslations } from 'next-intl';
import { Box, useColorMode } from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';

const Personalisasi = () => {
  const t = useTranslations('Common.modules.personalisasi');
  const { colorMode } = useColorMode();

  return (
    <AdminLayout>
      <Box p={4}>
        <PageTransition pageTitle={t('title')}>
          <PageRow>
            <ContainerQuery>
              <ModeTampilanCard />
              <BahasaCard />
            </ContainerQuery>
          </PageRow>
        </PageTransition>
      </Box>
    </AdminLayout>
  );
};

export default Personalisasi;
