import React, { useState } from 'react';
import {
  Text,
  Box,
  Alert,
  AlertIcon,
  Flex,
  useColorMode
} from '@chakra-ui/react';
import Sidebar from '@/components/organisms/Sidebar';
import PageTransition from '@/components/PageLayout';
import PlainCard from '@/components/organisms/Cards/Card';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import { Tamu, TamuFilter } from '../types/Tamu.types';
import TamuTableAdvance from '../components/TamuTableAdvance';
import QRCodeGenerator from '../components/QRCodeGenerator';
import TamuDetail from '../components/GuestDetail';
import { TamuFormModal } from '../components/GuestForm';
import { useTamu } from '../utils/hooks/useTamu';
import TamuStatistics from '../components/TamuStatistics';

const TamuListPage: React.FC = () => {
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
    <Flex minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <Box
        flex="1"
        ml={{ base: "0", md: "108px", lg: "280px" }}
        transition="margin-left 0.3s ease"
        minH="100vh"
        p={{ base: 4, md: 6 }}
        w={{ base: "100%", md: "auto" }}
      >
        <PageTransition pageTitle="Manajemen Tamu Undangan">
          <PageRow>
            <ContainerQuery>
              <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} mb={6}>
                Kelola daftar tamu undangan pernikahan Anda
              </Text>

              {error && (
                <Alert status="error" borderRadius="md" boxShadow="sm" mb={4}>
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
            </ContainerQuery>
          </PageRow>
        </PageTransition>
      </Box>
    </Flex>
  );
};

export default TamuListPage;