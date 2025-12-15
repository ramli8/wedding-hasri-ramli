import React, { useState, useMemo, useContext, useEffect } from 'react';
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
import AppSettingContext from '@/providers/AppSettingProvider';

// Import components from modules
import PermissionTableAdvance from '@/modules/admin/permissions/components/PermissionTableAdvance';
import PermissionFormModal from '@/modules/admin/permissions/components/PermissionFormModal';
import { usePermissions } from '@/modules/admin/permissions/utils/hooks/usePermissions';
import PermissionAPI, { RolePermission } from '@/modules/admin/permissions/services/PermissionAPI';
import { useRoles } from '@/modules/admin/roles/utils/hooks/useRoles';

const RolePermissionsPage: NextPageWithLayout = () => {
  const {
    permissions,
    loading,
    hasMore,
    totalCount,
    loadMore,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    restorePermission,
  } = usePermissions();

  const { roles, fetchRoles } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [statusCounts, setStatusCounts] = useState<{ all: number; active: number; inactive: number }>({
    all: 0,
    active: 0,
    inactive: 0,
  });
  
  const permissionAPI = React.useMemo(() => new PermissionAPI(), []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<
    RolePermission | undefined
  >(undefined);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  const handleOpenModal = (permission?: RolePermission) => {
    setSelectedPermission(permission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPermission(undefined);
  };

  const handleSaveSuccess = () => {
    fetchPermissions(true, { roleId: selectedRoleId, status: filterStatus });
  };

  // Fetch counts from server
  const fetchCounts = async () => {
    try {
      // Fetch role counts (changes based on status filter)
      const roleCounts = await permissionAPI.getCountsByRole(filterStatus);
      setRoleCounts(roleCounts);
      
      // Fetch status counts (changes based on role filter)
      const statusCounts = await permissionAPI.getCounts(
        selectedRoleId ? { roleId: selectedRoleId } : undefined
      );
      setStatusCounts(statusCounts);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  // Trigger server-side fetch when filters change
  useEffect(() => {
    fetchPermissions(true, { roleId: selectedRoleId, status: filterStatus });
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, selectedRoleId]);

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

  // No need for client-side filtering anymore, server handles it
  const filteredData = permissions;

  // Use status counts from server (not from totalCount which is filtered)
  const counts = statusCounts;

  const roleTabs = useMemo(() => {
    return roles
      .filter((r) => !r.deleted_at)
      .map((role) => ({
        id: role.id,
        label: role.name,
        count: roleCounts[role.id] || 0, // Use server-side counts
      }));
  }, [roles, roleCounts]);

  return (
    <>
      <Head>
        <title>Manajemen Permissions</title>
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
                      Manajemen Permissions
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
                    Kelola permission dan kontrol akses untuk setiap role
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
                onLoadMore={() => loadMore({ roleId: selectedRoleId, status: filterStatus })}
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
