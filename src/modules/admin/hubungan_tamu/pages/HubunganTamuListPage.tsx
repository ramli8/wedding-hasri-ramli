import React, { useState } from 'react';
import {
  VStack,
  Box,
  Alert,
  AlertIcon,
  Flex,
  useColorMode,
  Text,
} from '@chakra-ui/react';
import { HubunganTamu } from '../types/HubunganTamu.types';
import HubunganTableAdvance from '../components/HubunganTableAdvance';
import HubunganFormModal from '../components/HubunganFormModal';
import { useHubunganTamu } from '../utils/hooks/useHubunganTamu';
import Head from 'next/head';
import { useTranslations } from 'next-intl';
import Sidebar from '@/components/organisms/Sidebar';
import PageTransition from '@/components/PageLayout';
import PlainCard from '@/components/organisms/Cards/Card';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const HubunganTamuPage: React.FC = () => {
  const {
    hubunganTamu,
    loading,
    error,
    createHubunganTamu,
    updateHubunganTamu,
    deleteHubunganTamu,
    fetchHubunganTamu,
  } = useHubunganTamu();

  const [selectedHubungan, setSelectedHubungan] = useState<HubunganTamu | null>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const { colorMode } = useColorMode();
  const commonTranslations = useTranslations('Common');
  const MySwal = withReactContent(Swal);

  const handleAddNew = () => {
    setSelectedHubungan(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEdit = (hubungan: HubunganTamu) => {
    setSelectedHubungan(hubungan);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleDelete = (id: string) => {
    deleteHubunganTamu(id)
      .then(() => {
        MySwal.fire({
          title: 'Berhasil!',
          text: 'Data hubungan berhasil dihapus',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#319795',
          background: colorMode === 'light' ? '#fff' : '#1A202C',
          color: colorMode === 'light' ? '#1A202C' : '#fff',
        });
      })
      .catch((err) => {
        console.error('Failed to delete hubungan:', err);
        MySwal.fire({
          title: 'Gagal!',
          text: 'Terjadi kesalahan saat menghapus data hubungan',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#e53e3e',
          background: colorMode === 'light' ? '#fff' : '#1A202C',
          color: colorMode === 'light' ? '#1A202C' : '#fff',
        });
      });
  };

  const handleSaveSuccess = () => {
    setShowFormModal(false);
    fetchHubunganTamu().catch((err) => {
      console.error('Failed to fetch hubungan after save:', err);
    });
  };

  return (
    <>
      <Head>
        <title>
          {commonTranslations('modules.hubungan_tamu.title') +
            ' • ' +
            process.env.NEXT_PUBLIC_APP_NAME_FULL}
        </title>
      </Head>

      <VStack spacing={8} align="stretch">
        {error && (
          <Alert
            status="error"
            borderRadius="md"
            boxShadow="sm"
            bg={colorMode === 'light' ? 'red.50' : 'red.900'}
            color={colorMode === 'light' ? 'red.800' : 'red.100'}
          >
            <AlertIcon color={colorMode === 'light' ? 'red.500' : 'red.200'} />
            {error}
          </Alert>
        )}

        <HubunganTableAdvance
          initialData={hubunganTamu}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddNew={handleAddNew}
        />
      </VStack>

      <HubunganFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        hubungan={selectedHubungan || undefined}
        onSave={() => {
          handleSaveSuccess();
          return Promise.resolve();
        }}
      />
    </>
  );
};

const HubunganTamuListPage: React.FC = () => {
  const { colorMode } = useColorMode();

  return (
    <Flex minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      <Sidebar />
      <Box
        flex="1"
        ml={{ base: "0", m: "108px", d: "280px" }}
        transition="margin-left 0.3s ease"
        minH="100vh"
        p={2}
      >
        <PageTransition pageTitle="Manajemen Hubungan Tamu">
          <PageRow>
            <ContainerQuery>
              <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'} mb={6}>
                Kelola daftar hubungan tamu undangan pernikahan Anda
              </Text>
              <HubunganTamuPage />
            </ContainerQuery>
          </PageRow>
        </PageTransition>
      </Box>
    </Flex>
  );
};

export default HubunganTamuListPage;
