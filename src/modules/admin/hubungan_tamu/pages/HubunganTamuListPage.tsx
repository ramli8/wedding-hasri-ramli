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
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import FilterTabs from '@/components/molecules/FilterTabs';

const HubunganTamuListPage: NextPageWithLayout = () => {
  const { colorMode } = useColorMode();
  const {
    hubunganTamu,
    loading,
    error,
    deleteHubunganTamu,
    fetchHubunganTamu,
    restoreHubunganTamu,
    createHubunganTamu,
    updateHubunganTamu,
  } = useHubunganTamu();
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

  const handleSaveSuccess = () => {
    setShowFormModal(false);
    fetchHubunganTamu().catch((err) => {
      console.error('Failed to fetch after save:', err);
    });
  };

  const handleRestore = (id: string) => {
    restoreHubunganTamu(id)
      .then(() => {
        showSuccessAlert('Data berhasil dipulihkan', colorMode);
      })
      .catch((err) => {
        console.error('Failed to restore:', err);
        showErrorAlert('Gagal memulihkan', err.message, colorMode);
      });
  };
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const filteredData = hubunganTamu.filter((item) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return !item.deleted_at;
    return !!item.deleted_at;
  });

  const counts = {
    all: hubunganTamu.length,
    active: hubunganTamu.filter((i) => !i.deleted_at).length,
    inactive: hubunganTamu.filter((i) => i.deleted_at).length,
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
                    Manajemen Hubungan Tamu
                  </Text>
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Kelola daftar hubungan tamu undangan pernikahan Anda dengan
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
              <HubunganTableAdvance
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
