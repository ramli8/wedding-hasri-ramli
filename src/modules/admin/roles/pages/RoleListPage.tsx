import React, { useState, useMemo } from 'react';
import {
  VStack,
  Text,
  useColorMode,
  HStack,
  Flex,
  Box,
} from '@chakra-ui/react';
import Head from 'next/head';
import { NextPageWithLayout } from '@/pages/_app';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import RoleTableAdvance from '../components/RoleTableAdvance';
import RoleFormModal from '../components/RoleFormModal';
import PermissionModal from '../components/PermissionModal';
import { useRoles } from '../utils/hooks/useRoles';
import { Role } from '../types/Role.types';
import FilterTabs from '@/components/molecules/FilterTabs';

const RoleListPage: NextPageWithLayout = () => {
  const {
    roles,
    loading,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    restoreRole,
  } = useRoles();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [selectedRoleForPermission, setSelectedRoleForPermission] =
    useState<Role | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const { colorMode } = useColorMode();

  const handleOpenModal = (role?: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(undefined);
  };

  const handleSaveSuccess = () => {
    fetchRoles();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRole(id);
      showSuccessAlert('Data berhasil dihapus', colorMode);
    } catch (error: any) {
      showErrorAlert('Gagal menghapus', error.message, colorMode);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreRole(id);
      showSuccessAlert('Data berhasil dipulihkan', colorMode);
    } catch (error: any) {
      showErrorAlert('Gagal memulihkan', error.message, colorMode);
    }
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRoleForPermission(role);
    setIsPermissionModalOpen(true);
  };

  const filteredData = useMemo(() => {
    return roles.filter((item) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'active') return !item.deleted_at;
      if (filterStatus === 'inactive') return !!item.deleted_at;
      return true;
    });
  }, [roles, filterStatus]);

  const counts = useMemo(() => {
    return {
      all: roles.length,
      active: roles.filter((i) => !i.deleted_at).length,
      inactive: roles.filter((i) => i.deleted_at).length,
    };
  }, [roles]);

  return (
    <>
      <Head>
        <title>Manajemen Role</title>
      </Head>

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
                    Manajemen Role
                  </Text>
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Kelola role dan hak akses pengguna aplikasi Anda
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

              <RoleTableAdvance
                initialData={filteredData}
                loading={loading}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onAddNew={() => handleOpenModal()}
                onManagePermissions={handleManagePermissions}
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

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        role={selectedRole}
        onSave={async (data) => {
          try {
            if (selectedRole) {
              await updateRole(selectedRole.id, data);
            } else {
              await createRole(data as any);
            }
            handleSaveSuccess();
          } catch (error) {
            console.error('Failed to save role:', error);
            throw error;
          }
        }}
      />

      <PermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        roleId={selectedRoleForPermission?.id || ''}
        roleName={selectedRoleForPermission?.name || ''}
      />
    </>
  );
};

export default RoleListPage;
