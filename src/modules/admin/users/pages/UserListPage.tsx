import React, { useState, useEffect, useContext, useCallback } from 'react';
import { VStack, Flex, Box, useColorMode, Text } from '@chakra-ui/react';
import Head from 'next/head';
import { NextPageWithLayout } from '@/pages/_app';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import PageRow from '@/components/atoms/PageRow';
import { User, Role } from '../services/UserAPI';
import UserTableAdvance from '../components/UserTableAdvance';
import UserFormModal from '../components/UserFormModal';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import FilterTabs from '@/components/molecules/FilterTabs';
import AppSettingContext from '@/providers/AppSettingProvider';
import { useUsers } from '../utils/hooks/useUsers';

const UserListPage: NextPageWithLayout = () => {
  const {
    users,
    roles,
    loading,
    hasMore,
    fetchUsers,
    loadMore,
    createUser,
    updateUser,
    deleteUser,
    restoreUser,
  } = useUsers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    active: 0,
    inactive: 0,
  });
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  // Import API for getCounts only
  const UserAPI = require('../services/UserAPI').default;
  const api = React.useMemo(() => new UserAPI(), [UserAPI]);

  const fetchCounts = async () => {
    try {
      const counts = await api.getCounts();
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  useEffect(() => {
    fetchUsers(true, { status: filterStatus, search: searchTerm || undefined });
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, searchTerm]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const filteredUsers = users;
  const counts = statusCounts;

  const handleOpenModal = (user?: User) => {
    setEditingUser(user || undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(undefined);
  };

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      if (editingUser) {
        await updateUser(editingUser.id, {
          username: formData.username,
          name: formData.name,
          password_hash: formData.password || undefined,
          role_ids: formData.role_ids,
        });
        showSuccessAlert('User berhasil diupdate', colorMode);
      } else {
        await createUser({
          username: formData.username,
          name: formData.name,
          password_hash: formData.password || 'default123',
          role_ids: formData.role_ids,
        });
        showSuccessAlert('User berhasil dibuat', colorMode);
      }
      handleCloseModal();
      fetchUsers(true, {
        status: filterStatus,
        search: searchTerm || undefined,
      });
      fetchCounts();
    } catch (error: any) {
      showErrorAlert(
        editingUser ? 'Gagal update user' : 'Gagal membuat user',
        error.message,
        colorMode
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      showSuccessAlert('Data berhasil dihapus', colorMode);
      fetchCounts();
    } catch (error: any) {
      showErrorAlert('Gagal menghapus', error.message, colorMode);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreUser(id);
      showSuccessAlert('Data berhasil dipulihkan', colorMode);
      fetchCounts();
    } catch (error: any) {
      showErrorAlert('Gagal memulihkan', error.message, colorMode);
    }
  };

  const handleCopyMagicLink = (user: User) => {
    const magicLink = `${window.location.origin}/?admin=${user.id}`;
    navigator.clipboard.writeText(magicLink);
    showSuccessAlert('Magic link berhasil disalin', colorMode);
  };

  return (
    <>
      <Head>
        <title>Manajemen User</title>
      </Head>

      <Box p={4}>
        <PageRow>
          <ContainerQuery>
            <VStack spacing={6} align="stretch">
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
                    Data Pengguna
                  </Text>
                  <Text
                    fontSize="14px"
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Kelola data pengguna dan akses sistem
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

              <UserTableAdvance
                initialData={filteredUsers}
                loading={loading}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onAddNew={() => handleOpenModal()}
                onCopyMagicLink={handleCopyMagicLink}
                onLoadMore={() =>
                  loadMore({
                    status: filterStatus,
                    search: searchTerm || undefined,
                  })
                }
                hasMore={hasMore}
                onSearch={handleSearch}
                searchTerm={searchTerm}
                headerAction={
                  <PrimaryButton
                    onClick={() => handleOpenModal()}
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

      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        user={editingUser}
        roles={roles}
        isLoading={isSubmitting}
      />
    </>
  );
};

export default UserListPage;
