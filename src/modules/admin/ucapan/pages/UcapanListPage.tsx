import React, { useState, useEffect } from 'react';
import { useToast, VStack, Flex, Box, useColorMode, Text } from '@chakra-ui/react';
import Head from 'next/head';
import Sidebar from '@/components/organisms/Sidebar';
import PageTransition from '@/components/PageLayout';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UcapanAPI from '../services/UcapanAPI';
import { UcapanWithReplies } from '../types/Ucapan.types';
import UcapanTableAdvance from '../components/UcapanTableAdvance';

const UcapanListPage = () => {
  const [ucapanList, setUcapanList] = useState<UcapanWithReplies[]>([]);
  const [loading, setLoading] = useState(true);

  const api = new UcapanAPI();
  const toast = useToast();
  const { colorMode } = useColorMode();

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getUcapan();
      setUcapanList(data);
    } catch (error: any) {
      toast({
        title: 'Gagal memuat data',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
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
      toast({ title: 'Ucapan berhasil dihapus', status: 'success', duration: 3000 });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Gagal menghapus ucapan', description: error.message, status: 'error', duration: 3000 });
    }
  };

  return (
    <>
      <Head>
        <title>Manajemen Ucapan • {process.env.NEXT_PUBLIC_APP_NAME_FULL}</title>
      </Head>

      <Flex minH="100vh" bg={colorMode === 'light' ? 'white' : 'black'}>
        <Sidebar />
        <Box
          flex="1"
          ml={{ base: "0", m: "108px", d: "280px" }}
          transition="margin-left 0.3s ease"
          minH="100vh"
          p={2}
        >
          <PageTransition pageTitle="Manajemen Ucapan">
            <PageRow>
              <ContainerQuery>
                <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'} mb={6}>
                  Kelola ucapan dari tamu. Gunakan "Copy Link" untuk mendapatkan magic link dan balas langsung di halaman utama.
                </Text>
                <VStack spacing={8} align="stretch">
                  <UcapanTableAdvance
                    initialData={ucapanList}
                    loading={loading}
                    onReply={() => {}} // Not used anymore
                    onDelete={handleDeleteUcapan}
                    onRefresh={fetchData}
                  />
                </VStack>
              </ContainerQuery>
            </PageRow>
          </PageTransition>
        </Box>
      </Flex>
    </>
  );
};

export default UcapanListPage;

