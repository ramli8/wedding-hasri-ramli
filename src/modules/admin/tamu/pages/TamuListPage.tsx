import React, { useState, useMemo } from 'react';
import {
  Text,
  Box,
  Alert,
  AlertIcon,
  Flex,
  useColorMode,
  VStack,
  HStack,
  Badge,
  Button,
} from '@chakra-ui/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import { Tamu, TamuFilter } from '../types/Tamu.types';
import TamuTableAdvance from '../components/TamuTableAdvance';
import QRCodeGenerator from '../components/QRCodeGenerator';
import TamuDetail from '../components/GuestDetail';
import { TamuFormModal } from '../components/GuestForm';
import { useTamu } from '../utils/hooks/useTamu';
import TamuStatistics from '../components/TamuStatistics';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import TamuAPI from '../services/TamuAPI';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import FilterTabs from '@/components/molecules/FilterTabs';
import PageRow from '@/components/atoms/PageRow';

const TamuListPage: NextPageWithLayout = () => {
  const {
    tamu: tamuList,
    loading,
    error,
    createTamu,
    updateTamu,
    deleteTamu,
    fetchTamu: refetchTamu,
    filter,
    setFilter,
  } = useTamu();

  const [selectedTamu, setSelectedTamu] = useState<Tamu | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const { colorMode } = useColorMode();
  const api = new TamuAPI();

  const handleAddNew = () => {
    setSelectedTamu(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEdit = (tamu: Tamu) => {
    setSelectedTamu(tamu);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTamu(id);
      showSuccessAlert('Data berhasil dihapus', colorMode);
      refetchTamu();
    } catch (err: any) {
      showErrorAlert('Gagal menghapus', err.message, colorMode);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restoreTamu(id);
      showSuccessAlert('Data berhasil dipulihkan', colorMode);
      refetchTamu();
    } catch (err: any) {
      showErrorAlert('Gagal memulihkan', err.message, colorMode);
    }
  };

  const handleViewDetail = (tamu: Tamu) => {
    setSelectedTamu(tamu);
    setShowDetailModal(true);
  };

  const handleQRCodeClick = (tamu: Tamu) => {
    setSelectedTamu(tamu);
    setShowQRModal(true);
  };

  const handleSaveSuccess = () => {
    setShowFormModal(false);
    refetchTamu().catch((err: any) => {
      console.error('Failed to fetch tamu after save:', err);
    });
  };

  const handleFilterChange = (newFilter: Partial<TamuFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter } as TamuFilter));
  };

  // Filter tamu berdasarkan status
  const filteredTamu = useMemo(() => {
    let result = tamuList;
    if (filterStatus === 'active') result = result.filter((t) => !t.deleted_at);
    if (filterStatus === 'inactive')
      result = result.filter((t) => t.deleted_at);
    return result;
  }, [tamuList, filterStatus]);

  // Hitung counts
  const counts = useMemo(
    () => ({
      all: tamuList.length,
      active: tamuList.filter((t) => !t.deleted_at).length,
      inactive: tamuList.filter((t) => t.deleted_at).length,
    }),
    [tamuList]
  );

  return (
    <Box p={4}>
      <PageRow>
        <ContainerQuery>
          <VStack spacing={6} align="stretch">
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
                  Manajemen Tamu Undangan
                </Text>
                <HStack spacing={2}>
                  <Text
                    fontSize={{ base: 'xs', sm: 'sm' }}
                    color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                    noOfLines={1}
                  >
                    Kelola daftar tamu undangan pernikahan Anda
                  </Text>
                </HStack>
              </VStack>

              {/* User Profile & Actions */}
              <Box flexShrink={0} display={{ base: 'none', md: 'block' }}>
                <UserProfileActions />
              </Box>
            </Flex>

            {error && (
              <Alert status="error" borderRadius="md" boxShadow="sm">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {/* Statistics */}
            {/* Statistics Removed */}

            {/* Filters Toolbar */}
            <FilterTabs
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              counts={counts}
            />

            <TamuTableAdvance
              initialTamu={filteredTamu}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onAddNew={handleAddNew}
              onViewDetail={handleViewDetail}
              onQRCodeClick={handleQRCodeClick}
              onUpdateStatus={async (id, status) => {
                await updateTamu(id, {
                  status_undangan: status,
                  tgl_kirim_undangan: new Date(),
                });
              }}
            />

            <TamuFormModal
              isOpen={showFormModal}
              onClose={() => setShowFormModal(false)}
              tamu={selectedTamu || undefined}
              onSave={handleSaveSuccess}
            />

            <QRCodeGenerator
              isOpen={showQRModal}
              onClose={() => setShowQRModal(false)}
              tamu={selectedTamu || undefined}
            />

            <TamuDetail
              isOpen={showDetailModal}
              onClose={() => setShowDetailModal(false)}
              tamu={selectedTamu || undefined}
              onEdit={handleViewDetail}
              onQRCodeClick={handleQRCodeClick}
            />
          </VStack>
        </ContainerQuery>
      </PageRow>
    </Box>
  );
};

export default TamuListPage;
