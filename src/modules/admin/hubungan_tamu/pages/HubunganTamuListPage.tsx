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
import { HubunganTamu } from '../types/HubunganTamu.types';
import HubunganTableAdvance from '../components/HubunganTableAdvance';
import HubunganFormModal from '../components/HubunganFormModal';
import { useHubunganTamu } from '../utils/hooks/useHubunganTamu';
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
import AppSettingContext from '@/providers/AppSettingProvider';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import FilterTabs from '@/components/molecules/FilterTabs';

const HubunganTamuListPage: NextPageWithLayout = () => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const {
    hubunganTamu,
    loading,
    error,
    hasMore,
    loadMore,
    deleteHubunganTamu,
    fetchHubunganTamu,
    restoreHubunganTamu,
    createHubunganTamu,
    updateHubunganTamu,
  } = useHubunganTamu();

  const HubunganAPI = require('../services/HubunganTamuAPI').default;
  const api = useMemo(() => new HubunganAPI(), [HubunganAPI]);
  // State for modal and selected item
  const [selectedHubungan, setSelectedHubungan] = useState<HubunganTamu | null>(
    null
  );
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Handler functions for actions
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
        showSuccessAlert('Data berhasil dihapus', colorMode);
      })
      .catch((err) => {
        console.error('Failed to delete:', err);
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
    fetchHubunganTamu(true, { status: filterStatus });
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleSaveSuccess = () => {
    setShowFormModal(false);
    fetchHubunganTamu(true, { status: filterStatus });
    fetchCounts();
  };

  const handleRestore = (id: string) => {
    restoreHubunganTamu(id)
      .then(() => {
        showSuccessAlert('Data berhasil dipulihkan', colorMode);
        fetchCounts();
      })
      .catch((err) => {
        console.error('Failed to restore:', err);
        showErrorAlert('Gagal memulihkan', err.message, colorMode);
      });
  };

  const filteredData = hubunganTamu; // No client-side filtering
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
                    Data Hubungan
                  </Text>
                  <Text
                    fontSize="14px"
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Kelola seluruh data hubungan tamu undangan
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
              <HubunganTableAdvance
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

      <HubunganFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        hubungan={selectedHubungan || undefined}
        onSave={async (data) => {
          try {
            if (selectedHubungan) {
              await updateHubunganTamu(selectedHubungan.id, data);
            } else {
              await createHubunganTamu(data as any);
            }
            handleSaveSuccess();
          } catch (error) {
            console.error('Failed to save hubungan:', error);
            throw error;
          }
        }}
      />
    </>
  );
};

export default HubunganTamuListPage;
