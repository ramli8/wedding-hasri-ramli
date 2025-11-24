import React, { useState } from 'react';
import {
  Text,
  Box,
  Alert,
  AlertIcon,
  Flex,
  useColorMode,
  VStack
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
    setFilter
  } = useTamu();

  const [selectedTamu, setSelectedTamu] = useState<Tamu | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const { colorMode } = useColorMode();

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

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tamu ini?')) {
      deleteTamu(id).catch(err => {
        console.error('Failed to delete tamu:', err);
      });
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
    setFilter(prev => ({ ...prev, ...newFilter } as TamuFilter));
  };

  return (
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
              Manajemen Tamu Undangan
            </Text>
            <Text
              fontSize={{ base: 'xs', sm: 'sm' }}
              color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              noOfLines={1}
            >
              Kelola daftar tamu undangan pernikahan Anda
            </Text>
          </VStack>
          
          {/* User Profile & Actions */}
          <Box flexShrink={0}>
            <UserProfileActions />
          </Box>
        </Flex>

        {error && (
          <Alert status="error" borderRadius="md" boxShadow="sm">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <TamuStatistics data={tamuList} />

        <TamuTableAdvance
          initialTamu={tamuList}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddNew={handleAddNew}
          onViewDetail={handleViewDetail}
          onQRCodeClick={handleQRCodeClick}
          onUpdateStatus={async (id, status) => {
            await updateTamu(id, { 
              status_undangan: status,
              tgl_kirim_undangan: new Date()
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
  );
};

export default TamuListPage;