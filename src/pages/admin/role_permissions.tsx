import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  VStack,
  Text,
  useColorMode,
  HStack,
  Flex,
  Box,
  Select,
} from '@chakra-ui/react';
import Head from 'next/head';
import { NextPageWithLayout } from '@/pages/_app';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import FilterTabs from '@/components/molecules/FilterTabs';
import RoleFilterTabs from '@/components/molecules/RoleFilterTabs';

// Import components from modules
import PermissionTableAdvance from '@/modules/admin/permissions/components/PermissionTableAdvance';
import PermissionFormModal from '@/modules/admin/permissions/components/PermissionFormModal';
import { usePermissions } from '@/modules/admin/permissions/utils/hooks/usePermissions';
import { RolePermission } from '@/modules/admin/permissions/services/PermissionAPI';
import { useRoles } from '@/modules/admin/roles/utils/hooks/useRoles';

const RolePermissionsPage: NextPageWithLayout = () => {
  const {
    permissions,
    loading,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    restorePermission,
  } = usePermissions();

  const { roles, fetchRoles } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<
    RolePermission | undefined
  >(undefined);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const { colorMode } = useColorMode();

  const handleOpenModal = (permission?: RolePermission) => {
    setSelectedPermission(permission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPermission(undefined);
  };

  const handleSaveSuccess = () => {
    fetchPermissions();
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePermission(id);
      showSuccessAlert('Data berhasil dihapus', colorMode);
    } catch (error: any) {
      showErrorAlert('Gagal menghapus', error.message, colorMode);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restorePermission(id);
      showSuccessAlert('Data berhasil dipulihkan', colorMode);
    } catch (error: any) {
      showErrorAlert('Gagal memulihkan', error.message, colorMode);
    }
  };

  const filteredData = useMemo(() => {
    return permissions.filter((item) => {
      // Filter by Status
      if (filterStatus === 'active' && item.deleted_at) return false;
      if (filterStatus === 'inactive' && !item.deleted_at) return false;

      // Filter by Role
      if (selectedRoleId && item.role_id !== selectedRoleId) return false;

      return true;
    });
  }, [permissions, filterStatus, selectedRoleId]);

  const counts = useMemo(() => {
    return {
      all: permissions.length,
      active: permissions.filter((i) => !i.deleted_at).length,
      inactive: permissions.filter((i) => i.deleted_at).length,
    };
  }, [permissions]);

  const roleTabs = useMemo(() => {
    return roles
      .filter((r) => !r.deleted_at)
      .map((role) => ({
        id: role.id,
        label: role.name,
        count: permissions.filter(
          (p) => p.role_id === role.id && 
          (filterStatus === 'all' || 
           (filterStatus === 'active' && !p.deleted_at) ||
           (filterStatus === 'inactive' && p.deleted_at))
        ).length,
      }));
  }, [roles, permissions, filterStatus]);

  return (
    <>
      <Head>
        <title>Manajemen Permissions</title>
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
                    Manajemen Permissions
                  </Text>
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Kelola hak akses URL untuk setiap role secara detail
                  </Text>
                </VStack>

                {/* User Profile & Actions */}
                <Box display={{ base: 'none', md: 'block' }}>
                  <UserProfileActions />
                </Box>
              </Flex>

              {/* Filter Tabs */}
              <VStack align="stretch" spacing={4} pb={4}>
                <Box>
                  <FilterTabs
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    counts={counts}
                  />
                </Box>

                <Box>
                  <RoleFilterTabs
                    selectedRoleId={selectedRoleId}
                    setSelectedRoleId={setSelectedRoleId}
                    roles={roleTabs}
                  />
                </Box>
              </VStack>

              <PermissionTableAdvance
                initialData={filteredData}
                loading={loading}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onAddNew={() => handleOpenModal()}
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

      <PermissionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        permission={selectedPermission}
        onSave={async (data) => {
          try {
            await createPermission(data);
            handleSaveSuccess();
          } catch (error) {
            console.error('Failed to save permission:', error);
            throw error;
          }
        }}
        onUpdate={async (id, data) => {
          try {
            await updatePermission(id, data);
            handleSaveSuccess();
          } catch (error) {
            console.error('Failed to update permission:', error);
            throw error;
          }
        }}
      />
    </>
  );
};

RolePermissionsPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default RolePermissionsPage;
