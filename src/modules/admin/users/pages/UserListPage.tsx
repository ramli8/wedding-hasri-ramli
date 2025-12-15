import React, { useState, useEffect, useMemo, useContext } from 'react';
import { VStack, Flex, Box, useColorMode, Text, Icon, HStack, Badge } from '@chakra-ui/react';
import Head from 'next/head';
import { NextPageWithLayout } from '@/pages/_app';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import PageRow from '@/components/atoms/PageRow';
import UserAPI, { User, Role } from '../services/UserAPI';
import UserTableAdvance from '../components/UserTableAdvance';
import UserFormModal from '../components/UserFormModal';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import FilterTabs from '@/components/molecules/FilterTabs';
import { FaUsers } from 'react-icons/fa';
import AppSettingContext from '@/providers/AppSettingProvider';

const UserListPage: NextPageWithLayout = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [hasMore, setHasMore] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, inactive: 0 });

  const api = React.useMemo(() => new UserAPI(), []);
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  const fetchData = React.useCallback(async (resetPagination = true) => {
    try {
      setLoading(true);
      const page = resetPagination ? 1 : pagination.page;
      const [usersResponse, rolesData] = await Promise.all([
        api.getUsers(page, pagination.limit),
        api.getRoles(),
      ]);
      
      if (resetPagination) {
        setUsers(usersResponse.data);
      } else {
        setUsers(prev => [...prev, ...usersResponse.data]);
      }
      
      if (usersResponse.pagination) {
        setPagination(usersResponse.pagination);
        setHasMore(
          usersResponse.pagination.page < usersResponse.pagination.totalPages &&
          usersResponse.data.length === usersResponse.pagination.limit
        );
      } else {
        setHasMore(false);
      }
      
      setRoles(rolesData);
    } catch (error: any) {
      showErrorAlert('Gagal memuat data user', error.message, colorMode);
    } finally {
      setLoading(false);
    }
  }, [api, colorMode, pagination.page, pagination.limit]);

  const loadMore = React.useCallback(async () => {
    if (!hasMore || loading) return;
    
    try {
      setLoading(true);
      const nextPage = pagination.page + 1;
      const response = await api.getUsers(nextPage, pagination.limit, { status: filterStatus });
      
      setUsers(prev => [...prev, ...response.data]);
      
      if (response.pagination) {
        setPagination(response.pagination);
        setHasMore(response.pagination.page < response.pagination.totalPages);
      }
    } catch (error: any) {
      showErrorAlert('Gagal memuat data', error.message, colorMode);
    } finally {
      setLoading(false);
    }
  }, [api, pagination, hasMore, loading, colorMode, filterStatus]);

  const fetchCounts = async () => {
    try {
      const counts = await api.getCounts();
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  useEffect(() => {
    fetchDataWithFilter();
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const fetchDataWithFilter = async () => {
    try {
      setLoading(true);
      const [usersResponse, rolesData] = await Promise.all([
        api.getUsers(1, pagination.limit, { status: filterStatus }),
        api.getRoles(),
      ]);
      
      setUsers(usersResponse.data);
      
      if (usersResponse.pagination) {
        setPagination(usersResponse.pagination);
        setHasMore(usersResponse.pagination.page < usersResponse.pagination.totalPages);
      } else {
        setHasMore(false);
      }
      
      setRoles(rolesData);
    } catch (error: any) {
      showErrorAlert('Gagal memuat data user', error.message, colorMode);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users; // No client-side filtering
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
        await api.updateUser(editingUser.id, {
          username: formData.username,
          name: formData.name,
          password_hash: formData.password || undefined,
          role_ids: formData.role_ids,
        });
        showSuccessAlert('User berhasil diupdate', colorMode);
      } else {
        // Create new user
        await api.createUser({
          username: formData.username,
          name: formData.name,
          password_hash: formData.password || 'default123',
          role_ids: formData.role_ids,
        });
        showSuccessAlert('User berhasil dibuat', colorMode);
      }
      handleCloseModal();
      fetchData();
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
      await api.deleteUser(id);
      showSuccessAlert('Data berhasil dihapus', colorMode);
      fetchData();
    } catch (error: any) {
      showErrorAlert('Gagal menghapus', error.message, colorMode);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restoreUser(id);
      showSuccessAlert('Data berhasil dipulihkan', colorMode);
      fetchData();
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
                      Manajemen User
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
                    Kelola pengguna, role, dan permission dengan kontrol akses yang fleksibel
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

              <UserTableAdvance
                initialData={filteredUsers}
                loading={loading}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onAddNew={() => handleOpenModal()}
                onCopyMagicLink={handleCopyMagicLink}
                onLoadMore={loadMore}
                hasMore={hasMore}
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
