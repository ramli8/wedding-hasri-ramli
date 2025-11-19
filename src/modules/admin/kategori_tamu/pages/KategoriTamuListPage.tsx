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
import { KategoriTamu } from '../types/KategoriTamu.types';
import KategoriTableAdvance from '../components/KategoriTableAdvance';
import KategoriFormModal from '../components/KategoriFormModal';
import { useKategoriTamu } from '../utils/hooks/useKategoriTamu';
import Head from 'next/head';
import { useTranslations } from 'next-intl';
import Sidebar from '@/components/organisms/Sidebar';
import PageTransition from '@/components/PageLayout';
import PlainCard from '@/components/organisms/Cards/Card';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const KategoriTamuPage: React.FC = () => {
  const {
    kategoriTamu,
    loading,
    error,
    createKategoriTamu,
    updateKategoriTamu,
    deleteKategoriTamu,
    fetchKategoriTamu,
  } = useKategoriTamu();

  const [selectedKategori, setSelectedKategori] = useState<KategoriTamu | null>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const { colorMode } = useColorMode();
  const commonTranslations = useTranslations('Common');
  const MySwal = withReactContent(Swal);

  const handleAddNew = () => {
    setSelectedKategori(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEdit = (kategori: KategoriTamu) => {
    setSelectedKategori(kategori);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleDelete = (id: string) => {
    deleteKategoriTamu(id)
      .then(() => {
        MySwal.fire({
          title: 'Berhasil!',
          text: 'Data kategori berhasil dihapus',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#319795',
          background: colorMode === 'light' ? '#fff' : '#1A202C',
          color: colorMode === 'light' ? '#1A202C' : '#fff',
        });
      })
      .catch((err) => {
        console.error('Failed to delete kategori:', err);
        MySwal.fire({
          title: 'Gagal!',
          text: 'Terjadi kesalahan saat menghapus data kategori',
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
    fetchKategoriTamu().catch((err) => {
      console.error('Failed to fetch kategori after save:', err);
    });
  };

  return (
    <>
      <Head>
        <title>
          {commonTranslations('modules.kategori_tamu.title') +
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

        <KategoriTableAdvance
          initialData={kategoriTamu}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddNew={handleAddNew}
        />
      </VStack>

      <KategoriFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        kategori={selectedKategori || undefined}
        onSave={() => {
          handleSaveSuccess();
          return Promise.resolve();
        }}
      />
    </>
  );
};

const KategoriTamuListPage: React.FC = () => {
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
        <PageTransition pageTitle="Manajemen Kategori Tamu">
          <PageRow>
            <ContainerQuery>
              <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'} mb={6}>
                Kelola daftar kategori tamu undangan pernikahan Anda
              </Text>
              <KategoriTamuPage />
            </ContainerQuery>
          </PageRow>
        </PageTransition>
      </Box>
    </Flex>
  );
};

export default KategoriTamuListPage;
