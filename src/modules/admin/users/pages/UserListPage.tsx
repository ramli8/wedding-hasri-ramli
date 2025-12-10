import React, { useState, useEffect } from 'react';
import { VStack, Flex, Box, useColorMode, Text } from '@chakra-ui/react';
import { NextPageWithLayout } from '@/pages/_app';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import PageRow from '@/components/atoms/PageRow';
import UserAPI, { User, Role } from '../services/UserAPI';
import UserTableAdvance from '../components/UserTableAdvance';
import UserFormModal from '../components/UserFormModal';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import { Badge, Button, HStack } from '@chakra-ui/react';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import FilterTabs from '@/components/molecules/FilterTabs';

const UserListPage: NextPageWithLayout = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const api = React.useMemo(() => new UserAPI(), []);
  const { colorMode } = useColorMode();

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      showErrorAlert('Gagal memuat data user', error.message, colorMode);
    } finally {
      setLoading(false);
    }
  }, [api, colorMode]);

  // const [filterRole, setFilterRole] = useState<string>('all'); // Deprecated for Status Filter
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate counts (Simulated since no soft delete on users yet)
  const counts = React.useMemo(() => {
    return {
      all: users.length,
      active: users.length, // Assuming all fetched are active
      inactive: 0, // Placeholder
    };
  }, [users]);

  const filteredUsers = React.useMemo(() => {
    // If filterStatus is 'active', show all users (since we don't have deleted users yet)
    // If 'inactive', show none
    if (filterStatus === 'inactive') return [];
    return users;
  }, [users, filterStatus]);

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

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      showSuccessAlert('User berhasil dihapus', colorMode);
      fetchData();
    } catch (error: any) {
      showErrorAlert('Gagal menghapus user', error.message, colorMode);
    }
  };

  const handleCopyMagicLink = (user: User) => {
    const magicLink = `${window.location.origin}/?admin=${user.id}`;
    navigator.clipboard.writeText(magicLink);
    showSuccessAlert('Magic link berhasil disalin', colorMode);
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
                    Manajemen User
                  </Text>
                  <HStack spacing={2}>
                    <Text
                      fontSize={{ base: 'xs', sm: 'sm' }}
                      color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                      noOfLines={1}
                    >
                      Kelola pengguna dan hak akses
                    </Text>
                  </HStack>
                </VStack>

                {/* User Profile & Actions */}
                <Box flexShrink={0} display={{ base: 'none', md: 'block' }}>
                  <UserProfileActions />
                </Box>
              </Flex>

              {/* Filters Toolbar */}
              <FilterTabs
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                counts={counts}
              />

              {/* Content */}
              <UserTableAdvance
                initialData={filteredUsers}
                loading={loading}
                onEdit={handleOpenModal}
                onDelete={handleDeleteUser}
                onCopyMagicLink={handleCopyMagicLink}
                headerAction={
                  <PrimaryButton onClick={() => handleOpenModal()} w="auto">
                    <HStack spacing={2} justify="center">
                      <MaterialIcon name="add" size={20} />
                      <Text>Tambah</Text>
                    </HStack>
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
