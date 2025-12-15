import React, { useState, useMemo, useContext, useEffect } from 'react';
import {
  Text,
  Box,
  Alert,
  AlertIcon,
  Flex,
  useColorMode,
  VStack,
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
import UserProfileActions from '@/components/molecules/UserProfileActions';
import TamuAPI from '../services/TamuAPI';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import FilterTabs from '@/components/molecules/FilterTabs';
import PageRow from '@/components/atoms/PageRow';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import AppSettingContext from '@/providers/AppSettingProvider';
import Head from 'next/head';

const TamuListPage: NextPageWithLayout = () => {
  const {
    tamu: tamuList,
    loading,
    error,
    createTamu,
    updateTamu,
    deleteTamu,
    fetchTamu: refetchTamu,
    loadMore,
    filter,
    setFilter,
    pagination,
    hasMore,
    isApiReady,
  } = useTamu();

  const [selectedTamu, setSelectedTamu] = useState<Tamu | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [statusCounts, setStatusCounts] = useState<{ all: number; active: number; inactive: number }>({
    all: 0,
    active: 0,
    inactive: 0,
  });

  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const api = useMemo(() => new TamuAPI(), []);

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

  // Fetch counts from server
  const fetchCounts = async () => {
    try {
      const counts = await api.getCounts({
        kategori: filter?.kategori,
        hubungan: filter?.hubungan,
      });
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  // Trigger fetch when filters change or when API becomes ready
  useEffect(() => {
    if (!isApiReady) return; // Wait for API to be ready
    
    const newFilter: TamuFilter = {
      ...filter,
      status: filterStatus,
    };
    refetchTamu(newFilter, true);
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filter?.kategori, filter?.hubungan, isApiReady]);

  // No client-side filtering, data comes filtered from server
  const filteredTamu = tamuList;

  // Use server-side counts
  const counts = statusCounts;

  return (
    <>
      <Head>
        <title>Manajemen Tamu Undangan</title>
      </Head>

      <Box p={4}>
        <PageRow>
          <ContainerQuery>
            <VStack spacing={6} align="stretch">
              {/* Header Section - Clean Typography */}
              <Flex
                justify="space-between"
                align={{ base: 'start', md: 'end' }}
                direction={{ base: 'column', md: 'row' }}
                gap={{ base: 4, md: 6 }}
                mb={6}
              >
                <VStack align="start" spacing={3} flex={1}>
                  {/* Title with Gradient Accent */}
                  <Box>
                    <Text
                      fontSize={{ base: '3xl', md: '4xl' }}
                      fontWeight="700"
                      color={colorMode === 'light' ? 'gray.900' : 'white'}
                      letterSpacing="tight"
                      lineHeight="1.1"
                      mb={1}
                    >
                      Manajemen Tamu Undangan
                    </Text>
                    <Box
                      w="60px"
                      h="3px"
                      bg={
                        colorMode === 'light' 
                          ? `${colorPref}.500` 
                          : `${colorPref}.400`
                      }
                      borderRadius="full"
                    />
                  </Box>

                  {/* Description */}
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                    fontWeight="400"
                    maxW="600px"
                    lineHeight="1.6"
                  >
                    Kelola daftar tamu undangan pernikahan dengan mudah dan terorganisir
                  </Text>
                </VStack>

                {/* User Profile & Actions */}
                <Box display={{ base: 'none', md: 'block' }}>
                  <UserProfileActions />
                </Box>
              </Flex>

              {error && (
                <Alert status="error" borderRadius="md" boxShadow="sm">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              {/* Filter Tabs */}
              <Box pb={2}>
                <FilterTabs
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  counts={counts}
                />
              </Box>

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
                onLoadMore={loadMore}
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
    </>
  );
};

export default TamuListPage;
