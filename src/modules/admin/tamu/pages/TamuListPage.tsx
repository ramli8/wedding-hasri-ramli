import React, { useState, useMemo, useContext, useEffect } from 'react';
import {
  Text,
  Box,
  Alert,
  AlertIcon,
  Flex,
  useColorMode,
  VStack,
  HStack,
  Stack,
  Button,
  Icon,
} from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import { Tamu, TamuFilter, CreateTamuInput } from '../types/Tamu.types';
import TamuTableAdvance from '../components/TamuTableAdvance';
import QRCodeGenerator from '../components/QRCodeGenerator';
import TamuDetail from '../components/GuestDetail';
import { TamuFormModal } from '../components/GuestForm';
import { ImportExcelModal } from '../components/ImportExcel';
import { useTamu } from '../utils/hooks/useTamu';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import TamuAPI from '../services/TamuAPI';
import KategoriTamuAPI from '@/modules/admin/kategori_tamu/services/KategoriTamuAPI';
import HubunganTamuAPI from '@/modules/admin/hubungan_tamu/services/HubunganTamuAPI';
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
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [statusCounts, setStatusCounts] = useState<{
    all: number;
    active: number;
    inactive: number;
  }>({
    all: 0,
    active: 0,
    inactive: 0,
  });
  const [categories, setCategories] = useState<{ id: string; nama: string }[]>(
    []
  );
  const [relationships, setRelationships] = useState<
    { id: string; nama: string }[]
  >([]);

  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const api = useMemo(() => new TamuAPI(), []);
  const kategoriAPI = useMemo(() => new KategoriTamuAPI(), []);
  const hubunganAPI = useMemo(() => new HubunganTamuAPI(), []);

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

  // Fetch categories and relationships for import
  const fetchOptionsForImport = async () => {
    try {
      const [kategoriesResponse, relationshipsResponse] = await Promise.all([
        kategoriAPI.getAll(undefined, undefined, { status: 'active' }),
        hubunganAPI.getAll(undefined, undefined, { status: 'active' }),
      ]);
      setCategories(kategoriesResponse.data);
      setRelationships(relationshipsResponse.data);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

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
      await refetchTamu();
      await fetchCounts(); // Update counts after delete
    } catch (err: any) {
      showErrorAlert('Gagal menghapus', err.message, colorMode);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restoreTamu(id);
      showSuccessAlert('Data berhasil dipulihkan', colorMode);
      await refetchTamu();
      await fetchCounts(); // Update counts after restore
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

  const handleSendWhatsApp = async (tamu: Tamu) => {
    if (!tamu.nomor_hp) return;

    // Generate invitation URL
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://yourdomain.com';
    const invitationUrl = `${baseUrl}/?to=${tamu.id}`;

    // Create WhatsApp message
    const message = `Assalamualaikum ${tamu.nama},\n\nKami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.\n\nBuka undangan di:\n${invitationUrl}\n\nTerima kasih.\n\nHasri & Ramli`;

    // Format phone number for WhatsApp (remove leading 0, add 62)
    let phoneNumber = tamu.nomor_hp.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.substring(1);
    }

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, '_blank');

    // Update tgl_kirim_undangan
    try {
      await updateTamu(tamu.id, {
        tgl_kirim_undangan: new Date().toISOString(),
      });
      await refetchTamu();
      showSuccessAlert('Undangan berhasil dikirim via WhatsApp', colorMode);
    } catch (err: any) {
      console.error('Failed to update tgl_kirim_undangan:', err);
    }
  };

  const handleSendInstagram = async (tamu: Tamu) => {
    if (!tamu.username_instagram) return;

    // Generate invitation URL
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://yourdomain.com';
    const invitationUrl = `${baseUrl}/?to=${tamu.id}`;

    // Create message
    const message = `Assalamualaikum ${tamu.nama},

Kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.

Buka undangan di:
${invitationUrl}

Terima kasih.

Hasri & Ramli`;

    // Copy message to clipboard FIRST (before opening new window)
    let copySuccess = false;
    try {
      await navigator.clipboard.writeText(message);
      copySuccess = true;
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copySuccess = true;
      } catch (fallbackErr) {
        console.error('Failed to copy message:', fallbackErr);
      }
    }

    // Open Instagram DM
    const instagramUrl = `https://ig.me/m/${tamu.username_instagram}`;
    window.open(instagramUrl, '_blank');

    // Update tgl_kirim_undangan
    try {
      await updateTamu(tamu.id, {
        tgl_kirim_undangan: new Date().toISOString(),
      });
      await refetchTamu();
      if (copySuccess) {
        showSuccessAlert(
          'Instagram DM dibuka. Pesan undangan sudah di-copy, silakan paste (Ctrl+V)!',
          colorMode
        );
      } else {
        showSuccessAlert(
          'Instagram DM dibuka. Silakan ketik pesan undangan secara manual.',
          colorMode
        );
      }
    } catch (err: any) {
      console.error('Failed to update tgl_kirim_undangan:', err);
    }
  };

  const handleSaveSuccess = async () => {
    setShowFormModal(false);
    try {
      await refetchTamu();
      await fetchCounts(); // Update counts after save
    } catch (err: any) {
      console.error('Failed to fetch tamu after save:', err);
    }
  };

  const handleFilterChange = (newFilter: Partial<TamuFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter } as TamuFilter));
  };

  const handleImportExcel = async (data: CreateTamuInput[]) => {
    try {
      // Import data satu per satu
      const results = await Promise.allSettled(
        data.map((item) => createTamu(item))
      );

      const successCount = results.filter(
        (r) => r.status === 'fulfilled'
      ).length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      if (failedCount > 0) {
        showErrorAlert(
          'Import selesai dengan error',
          `${successCount} data berhasil, ${failedCount} data gagal diimport`,
          colorMode
        );
      } else {
        showSuccessAlert(
          `Berhasil mengimport ${successCount} data tamu`,
          colorMode
        );
      }

      await refetchTamu();
      await fetchCounts(); // Update counts after import
      setShowImportModal(false);
    } catch (error: any) {
      showErrorAlert('Gagal mengimport data', error.message, colorMode);
      throw error;
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
    fetchOptionsForImport();
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
                    Kelola daftar tamu undangan pernikahan dengan mudah dan
                    terorganisir
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
                onSendWhatsApp={handleSendWhatsApp}
                onSendInstagram={handleSendInstagram}
                onUpdateStatus={async (id, status) => {
                  // Update tgl_kirim_undangan based on status
                  if (status === 'dikirim') {
                    await updateTamu(id, {
                      tgl_kirim_undangan: new Date().toISOString(),
                    });
                  } else {
                    await updateTamu(id, {
                      tgl_kirim_undangan: null,
                    });
                  }
                }}
                onLoadMore={loadMore}
                hasMore={hasMore}
                headerAction={
                  <Stack
                    direction={{ base: 'column', sm: 'row' }}
                    spacing={3}
                    w={{ base: 'full', sm: 'auto' }}
                  >
                    <Button
                      leftIcon={<Icon as={FiUpload} />}
                      onClick={() => setShowImportModal(true)}
                      variant="outline"
                      borderRadius="full"
                      px={6}
                      h="48px"
                      w={{ base: 'full', sm: 'auto' }}
                      borderWidth="2px"
                      fontWeight="600"
                      fontSize="sm"
                      _hover={{
                        bg: colorMode === 'light' ? 'gray.50' : 'gray.700',
                      }}
                    >
                      Import Excel
                    </Button>
                    <PrimaryButton
                      onClick={handleAddNew}
                      w="auto"
                      ml={0}
                      borderRadius="full"
                      px={8}
                      h="48px"
                    >
                      <Text fontWeight="700" fontSize="sm">
                        Tambah Data
                      </Text>
                    </PrimaryButton>
                  </Stack>
                }
              />

              <TamuFormModal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                tamu={selectedTamu || undefined}
                onSave={handleSaveSuccess}
              />

              <ImportExcelModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImportExcel}
                categories={categories}
                relationships={relationships}
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
