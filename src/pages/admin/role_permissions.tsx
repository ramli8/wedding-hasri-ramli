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
import PermissionAPI, {
  RolePermission,
} from '@/modules/admin/permissions/services/PermissionAPI';
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
  const [statusCounts, setStatusCounts] = useState<{
    all: number;
    active: number;
    inactive: number;
  }>({
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
                    Data Permissions
                  </Text>
                  <Text
                    fontSize="14px"
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Kelola data permissions dan hak akses
                  </Text>
                </Box>

                {/* User Profile & Actions */}
                <Box display={{ base: 'none', md: 'block' }}>
                  <UserProfileActions />
                </Box>
              </Flex>

              <VStack align="stretch" spacing={4} pb={4}>
                {/* Main Status Filter */}
                <Box>
                  <FilterTabs
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    counts={counts}
                  />
                </Box>

                {/* Secondary Filters Group */}
                <Box
                  pos="relative"
                  bg={colorMode === 'light' ? 'white' : 'whiteAlpha.50'}
                  p={{ base: 4, md: 6 }}
                  borderRadius="24px"
                  borderWidth="1px"
                  borderColor={
                    colorMode === 'light' ? 'transparent' : 'whiteAlpha.100'
                  }
                  _before={{
                    content: '""',
                    pos: 'absolute',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    bottom: '-20px',
                    zIndex: '-1',
                    background: colorMode === 'light' ? '#e3e6ec' : '#000',
                    opacity: colorMode === 'light' ? '0.91' : '0.51',
                    filter: 'blur(40px)',
                    borderRadius: '24px',
                    display: { base: 'none', md: 'block' },
                  }}
                >
                  <VStack spacing={4} align="stretch">
                    {/* Role Filter */}
                    <Box>
                      <Text
                        fontSize="11px"
                        fontWeight="700"
                        mb={3}
                        color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                      >
                        Role
                      </Text>
                      <Box
                        overflowX="auto"
                        mx={{ base: -3, md: 0 }}
                        px={{ base: 3, md: 0 }}
                        pb={1}
                        css={{
                          '&::-webkit-scrollbar': { display: 'none' },
                          scrollbarWidth: 'none',
                        }}
                      >
                        <RoleFilterTabs
                          selectedRoleId={selectedRoleId}
                          setSelectedRoleId={setSelectedRoleId}
                          roles={roleTabs}
                        />
                      </Box>
                    </Box>
                  </VStack>
                </Box>
              </VStack>

              <PermissionTableAdvance
                initialData={filteredData}
                loading={loading}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onAddNew={() => handleOpenModal()}
                onLoadMore={() =>
                  loadMore({ roleId: selectedRoleId, status: filterStatus })
                }
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
