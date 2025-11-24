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
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';



const HubunganTamuListPage: NextPageWithLayout = () => {
  const { colorMode } = useColorMode();
  const { hubunganTamu, loading, error, deleteHubunganTamu, fetchHubunganTamu, restoreHubunganTamu, createHubunganTamu, updateHubunganTamu } = useHubunganTamu();
  // State for modal and selected item
  const [selectedHubungan, setSelectedHubungan] = useState<HubunganTamu | null>(null);
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredData = hubunganTamu.filter(item => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return !item.deleted_at;
    return !!item.deleted_at;
  });

  const counts = {
    all: hubunganTamu.length,
    active: hubunganTamu.filter(i => !i.deleted_at).length,
    inactive: hubunganTamu.filter(i => i.deleted_at).length,
  };

  return (
    <>
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
                Manajemen Hubungan Tamu
              </Text>
              <HStack spacing={2}>
                <Text
                  fontSize={{ base: 'xs', sm: 'sm' }}
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  noOfLines={1}
                >
                  Kelola daftar hubungan tamu undangan pernikahan Anda
                </Text>
              </HStack>
            </VStack>
            
            {/* User Profile & Actions */}
            <Box flexShrink={0}>
              <UserProfileActions />
            </Box>
          </Flex>

        {/* Filter Buttons */}
        <HStack spacing={2} pb={2}>
          <Button
            size="sm"
            variant="ghost"
            borderRadius="10px"
            bg={filterStatus === 'all'
              ? colorMode === 'light' ? 'gray.100' : 'gray.700'
              : 'transparent'}
            color={filterStatus === 'all'
              ? colorMode === 'light' ? 'gray.800' : 'gray.100'
              : colorMode === 'light' ? 'gray.600' : 'gray.400'}
            fontWeight={filterStatus === 'all' ? '600' : '500'}
            onClick={() => setFilterStatus('all')}
            _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.700' }}
          >
            Semua
            <Badge ml={2} borderRadius="full" fontSize="xs" px={2}
              bg={filterStatus === 'all'
                ? colorMode === 'light' ? 'gray.200' : 'gray.600'
                : colorMode === 'light' ? 'gray.100' : 'gray.700'}
              color={filterStatus === 'all'
                ? colorMode === 'light' ? 'gray.700' : 'gray.200'
                : colorMode === 'light' ? 'gray.600' : 'gray.400'}
            >
              {counts.all}
            </Badge>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            borderRadius="10px"
            bg={filterStatus === 'active'
              ? colorMode === 'light' ? 'green.50' : 'green.900'
              : 'transparent'}
            color={filterStatus === 'active'
              ? colorMode === 'light' ? 'green.700' : 'green.200'
              : colorMode === 'light' ? 'gray.600' : 'gray.400'}
            fontWeight={filterStatus === 'active' ? '600' : '500'}
            onClick={() => setFilterStatus('active')}
            _hover={{ bg: colorMode === 'light' ? 'green.50' : 'green.900' }}
          >
            Aktif
            <Badge ml={2} borderRadius="full" fontSize="xs" px={2}
              bg={filterStatus === 'active'
                ? colorMode === 'light' ? 'green.100' : 'green.800'
                : colorMode === 'light' ? 'gray.100' : 'gray.700'}
              color={filterStatus === 'active'
                ? colorMode === 'light' ? 'green.700' : 'green.200'
                : colorMode === 'light' ? 'gray.600' : 'gray.400'}
            >
              {counts.active}
            </Badge>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            borderRadius="10px"
            bg={filterStatus === 'inactive'
              ? colorMode === 'light' ? 'red.50' : 'red.900'
              : 'transparent'}
            color={filterStatus === 'inactive'
              ? colorMode === 'light' ? 'red.700' : 'red.200'
              : colorMode === 'light' ? 'gray.600' : 'gray.400'}
            fontWeight={filterStatus === 'inactive' ? '600' : '500'}
            onClick={() => setFilterStatus('inactive')}
            _hover={{ bg: colorMode === 'light' ? 'red.50' : 'red.900' }}
          >
            Tidak Aktif
            <Badge ml={2} borderRadius="full" fontSize="xs" px={2}
              bg={filterStatus === 'inactive'
                ? colorMode === 'light' ? 'red.100' : 'red.800'
                : colorMode === 'light' ? 'gray.100' : 'gray.700'}
              color={filterStatus === 'inactive'
                ? colorMode === 'light' ? 'red.700' : 'red.200'
                : colorMode === 'light' ? 'gray.600' : 'gray.400'}
            >
              {counts.inactive}
            </Badge>
          </Button>
        </HStack>

        {/* Table */}
        <HubunganTableAdvance
          initialData={filteredData}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onAddNew={handleAddNew}
          headerAction={
            <PrimaryButton onClick={handleAddNew} w="auto">
              <HStack spacing={2}>
                <MaterialIcon name="add" size={20} variant="rounded" />
                <Text>Tambah</Text>
              </HStack>
            </PrimaryButton>
          }
        />
        </VStack>
      </ContainerQuery>


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
