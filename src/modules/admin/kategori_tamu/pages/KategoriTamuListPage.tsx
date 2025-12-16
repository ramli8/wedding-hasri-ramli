import React, { useState, useContext, useEffect, useMemo } from 'react';
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
import AppSettingContext from '@/providers/AppSettingProvider';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import FilterTabs from '@/components/molecules/FilterTabs';

const KategoriTamuListPage: NextPageWithLayout = () => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const {
    kategoriTamu,
    loading,
    error,
    hasMore,
    loadMore,
    deleteKategoriTamu,
    fetchKategoriTamu,
    restoreKategoriTamu,
    createKategoriTamu,
    updateKategoriTamu,
  } = useKategoriTamu();

  const KategoriAPI = require('../services/KategoriTamuAPI').default;
  const api = useMemo(() => new KategoriAPI(), [KategoriAPI]);

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

  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    active: 0,
    inactive: 0,
  });

  const fetchCounts = async () => {
    try {
      const counts = await api.getCounts();
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  useEffect(() => {
    fetchKategoriTamu(true, { status: filterStatus });
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleSaveSuccess = () => {
    setShowFormModal(false);
    fetchKategoriTamu(true, { status: filterStatus });
    fetchCounts();
  };

  const handleRestore = (id: string) => {
    restoreKategoriTamu(id)
      .then(() => {
        showSuccessAlert('Data berhasil dipulihkan', colorMode);
        fetchCounts();
      })
      .catch((err) => {
        console.error('Failed to restore kategori:', err);
        showErrorAlert('Gagal memulihkan', err.message, colorMode);
      });
  };

  const filteredData = kategoriTamu; // No client-side filtering
  const counts = statusCounts;

  return (
    <>
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
                    Data Kategori
                  </Text>
                  <Text
                    fontSize="14px"
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Kelola seluruh data kategori tamu undangan
                  </Text>
                </Box>

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
                onLoadMore={() => loadMore({ status: filterStatus })}
                hasMore={hasMore}
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
