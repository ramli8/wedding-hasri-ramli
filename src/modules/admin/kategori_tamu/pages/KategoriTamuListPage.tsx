import React, { useState } from 'react';
import {
  VStack,
  Box,
  Alert,
  AlertIcon,
  Flex,
  useColorMode,
  Text,
  HStack,
  Button,
  Badge,
} from '@chakra-ui/react';
import { KategoriTamu } from '../types/KategoriTamu.types';
import KategoriTableAdvance from '../components/KategoriTableAdvance';
import KategoriFormModal from '../components/KategoriFormModal';
import { useKategoriTamu } from '../utils/hooks/useKategoriTamu';
import Head from 'next/head';
import { useTranslations } from 'next-intl';
import AdminLayout from '@/components/layouts/AdminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import PageTransition from '@/components/PageLayout';
import PlainCard from '@/components/organisms/Cards/Card';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import FilterTabs from '@/components/molecules/FilterTabs';

const KategoriTamuListPage: NextPageWithLayout = () => {
  const { colorMode } = useColorMode();
  const {
    kategoriTamu,
    loading,
    error,
    deleteKategoriTamu,
    fetchKategoriTamu,
    restoreKategoriTamu,
    createKategoriTamu,
    updateKategoriTamu,
  } = useKategoriTamu();

  // State for modal and selected item
  const [selectedKategori, setSelectedKategori] = useState<KategoriTamu | null>(
    null
  );
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Handler functions for actions
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
        showSuccessAlert('Data berhasil dihapus', colorMode);
      })
      .catch((err) => {
        console.error('Failed to delete kategori:', err);
        showErrorAlert('Gagal menghapus', err.message, colorMode);
      });
  };

  const handleSaveSuccess = () => {
    setShowFormModal(false);
    fetchKategoriTamu().catch((err) => {
      console.error('Failed to fetch kategori after save:', err);
    });
  };

  const handleRestore = (id: string) => {
    restoreKategoriTamu(id)
      .then(() => {
        showSuccessAlert('Data berhasil dipulihkan', colorMode);
      })
      .catch((err) => {
        console.error('Failed to restore kategori:', err);
        showErrorAlert('Gagal memulihkan', err.message, colorMode);
      });
  };

  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const filteredData = kategoriTamu.filter((item) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return !item.deleted_at;
    return !!item.deleted_at;
  });

  const counts = {
    all: kategoriTamu.length,
    active: kategoriTamu.filter((i) => !i.deleted_at).length,
    inactive: kategoriTamu.filter((i) => i.deleted_at).length,
  };

  return (
    <>
      <Box p={4}>
        <PageRow>
          <ContainerQuery>
            <VStack spacing={6} align="stretch">
              {/* Header Section */}
              <Flex
                justify="space-between"
                align={{ base: 'center', md: 'end' }}
                direction={{ base: 'column', md: 'row' }}
                gap={{ base: 4, md: 4 }}
                mb={4}
              >
                <VStack align="start" spacing={1} flex={1} w="full">
                  <Text
                    fontSize={{ base: '2xl', md: '4xl' }}
                    fontWeight="800"
                    color={colorMode === 'light' ? 'gray.900' : 'white'}
                    letterSpacing="tight"
                    lineHeight="1.2"
                  >
                    Manajemen Kategori Tamu
                  </Text>
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Kelola daftar kategori tamu undangan pernikahan Anda dengan
                    mudah
                  </Text>
                </VStack>

                {/* User Profile & Actions */}
                <Box display={{ base: 'none', md: 'block' }}>
                  <UserProfileActions />
                </Box>
              </Flex>

              {/* Filter Tabs */}
              <Box pb={2}>
                <FilterTabs
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  counts={counts}
                />
              </Box>

              {/* Table */}
              <KategoriTableAdvance
                initialData={filteredData}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onAddNew={handleAddNew}
                headerAction={
                  <PrimaryButton
                    onClick={handleAddNew}
                    w="auto"
                    borderRadius="full"
                    px={8}
                    h="48px"
                  >
                    <Text fontWeight="700" fontSize="sm">
                      Tambah Data
                    </Text>
                  </PrimaryButton>
                }
              />
            </VStack>
          </ContainerQuery>
        </PageRow>
      </Box>

      <KategoriFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        kategori={selectedKategori || undefined}
        onSave={async (data) => {
          try {
            if (selectedKategori) {
              await updateKategoriTamu(selectedKategori.id, data);
            } else {
              await createKategoriTamu(data as any);
            }
            handleSaveSuccess();
          } catch (error) {
            console.error('Failed to save kategori:', error);
            throw error;
          }
        }}
      />
    </>
  );
};

export default KategoriTamuListPage;
