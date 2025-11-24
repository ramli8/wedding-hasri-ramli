import React, { useState, useEffect } from 'react';
import { VStack, Flex, Box, useColorMode, Text } from '@chakra-ui/react';
import Head from 'next/head';
import AdminLayout from '@/components/layouts/AdminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UcapanAPI from '../services/UcapanAPI';
import { UcapanWithReplies } from '../types/Ucapan.types';
import UcapanTableAdvance from '../components/UcapanTableAdvance';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import UserProfileActions from '@/components/molecules/UserProfileActions';

const UcapanListPage: NextPageWithLayout = () => {
  const [ucapanList, setUcapanList] = useState<UcapanWithReplies[]>([]);
  const [loading, setLoading] = useState(true);

  const api = new UcapanAPI();
  const { colorMode } = useColorMode();

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getUcapan();
      setUcapanList(data);
    } catch (error: any) {
      showErrorAlert('Gagal memuat data ucapan', error.message, colorMode);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUcapan = async (id: string) => {
    try {
      await api.deleteUcapan(id);
      showSuccessAlert('Ucapan berhasil dihapus', colorMode);
      fetchData();
    } catch (error: any) {
      showErrorAlert('Gagal menghapus ucapan', error.message, colorMode);
    }
  };

  return (
    <ContainerQuery>
      <VStack spacing={6} align="stretch" py={8}>
        {/* Header Section */}
        <Flex
          justify="space-between"
          align={{ base: 'center', md: 'center' }}
          direction={{ base: 'row', md: 'row' }}
          gap={{ base: 2, md: 4 }}
          wrap={{ base: 'nowrap', md: 'nowrap' }}
        >
          <VStack align="start" spacing={1} flex={1} minW={0}>
            <Text
              fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }}
              fontWeight="700"
              color={colorMode === 'light' ? 'gray.900' : 'white'}
              noOfLines={1}
            >
              Manajemen Ucapan
            </Text>
            <Text
              fontSize={{ base: 'xs', sm: 'sm' }}
              color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              noOfLines={2}
            >
              Kelola ucapan dari tamu. Gunakan "Copy Link" untuk mendapatkan magic link dan balas langsung di halaman utama.
            </Text>
          </VStack>
          
          {/* User Profile & Actions */}
          <Box flexShrink={0}>
            <UserProfileActions />
          </Box>
        </Flex>

        {/* Content */}
        <UcapanTableAdvance
          initialData={ucapanList}
          loading={loading}
          onReply={() => {}} // Not used anymore
          onDelete={handleDeleteUcapan}
          onRefresh={fetchData}
        />
      </VStack>
    </ContainerQuery>
  );
};

export default UcapanListPage;

