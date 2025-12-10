import React, { useState, useEffect, useMemo } from 'react';
import {
  VStack,
  Flex,
  Box,
  useColorMode,
  Text,
  HStack,
  Badge,
  Button,
} from '@chakra-ui/react';
import Head from 'next/head';

import ContainerQuery from '@/components/atoms/ContainerQuery';
import PageRow from '@/components/atoms/PageRow';
import PermissionAPI, {
  RolePermission,
} from '@/modules/admin/permissions/services/PermissionAPI';
import PermissionTableAdvance, {
  PermissionWithRole,
} from '@/modules/admin/permissions/components/PermissionTableAdvance';
import PermissionFormModal from '@/modules/admin/permissions/components/PermissionFormModal';
import AdminLayout from '@/components/layouts/AdminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import withAuth from '@/hoc/withAuth';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmationAlert,
} from '@/utils/sweetalert';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import UserProfileActions from '@/components/molecules/UserProfileActions';

const RolePermissionsPage = () => {
  const [permissions, setPermissions] = useState<PermissionWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<RolePermission | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const api = new PermissionAPI();
  const { colorMode } = useColorMode();

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await api.getAllPermissions();
      setPermissions(data);
    } catch (error: any) {
      showErrorAlert('Gagal memuat data', error.message, colorMode);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleOpenModal = (permission?: RolePermission) => {
    if (permission) {
      setEditingPermission(permission);
    } else {
      setEditingPermission(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPermission(null);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirmationAlert(
      'Konfirmasi Hapus Data?',
      'Data yang dihapus akan di-soft delete!',
      'Ya, Hapus',
      colorMode,
      true
    );

    if (result.isConfirmed) {
      try {
        await api.deletePermission(id);
        showSuccessAlert('Data berhasil dihapus', colorMode);
        fetchPermissions();
      } catch (error: any) {
        showErrorAlert('Gagal menghapus', error.message, colorMode);
      }
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restorePermission(id);
      showSuccessAlert('Data berhasil dipulihkan', colorMode);
      fetchPermissions();
    } catch (error: any) {
      showErrorAlert('Gagal memulihkan', error.message, colorMode);
    }
  };

  const filteredPermissions = useMemo(() => {
    let result = permissions;

    // Filter by status
    if (filterStatus === 'active') result = result.filter((p) => !p.deleted_at);
    if (filterStatus === 'inactive')
      result = result.filter((p) => p.deleted_at);

    return result;
  }, [permissions, filterStatus]);

  const counts = useMemo(() => {
    return {
      all: permissions.length,
      active: permissions.filter((p) => !p.deleted_at).length,
      inactive: permissions.filter((p) => p.deleted_at).length,
    };
  }, [permissions]);

  return (
    <>
      <Head>
        <title>
          Manajemen Permissions • {process.env.NEXT_PUBLIC_APP_NAME_FULL}
        </title>
      </Head>

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
                    Manajemen Permissions
                  </Text>
                  <HStack spacing={2}>
                    <Text
                      fontSize={{ base: 'xs', sm: 'sm' }}
                      color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                      noOfLines={1}
                    >
                      Daftar semua permissions
                    </Text>
                  </HStack>
                </VStack>

                {/* User Profile & Actions */}
                <Box flexShrink={0} display={{ base: 'none', md: 'block' }}>
                  <UserProfileActions />
                </Box>
              </Flex>

              {/* Filters Toolbar */}
              <HStack spacing={2} overflowX="auto" pb={2}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilterStatus('all')}
                  borderRadius="10px"
                  bg={
                    filterStatus === 'all'
                      ? colorMode === 'light'
                        ? 'gray.100'
                        : 'gray.700'
                      : 'transparent'
                  }
                  color={
                    filterStatus === 'all'
                      ? colorMode === 'light'
                        ? 'gray.800'
                        : 'gray.100'
                      : colorMode === 'light'
                      ? 'gray.600'
                      : 'gray.400'
                  }
                  fontWeight={filterStatus === 'all' ? '600' : '500'}
                  _hover={{
                    bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
                  }}
                >
                  Semua
                  <Badge
                    ml={2}
                    bg={
                      filterStatus === 'all'
                        ? colorMode === 'light'
                          ? 'gray.200'
                          : 'gray.600'
                        : colorMode === 'light'
                        ? 'gray.100'
                        : 'gray.700'
                    }
                    color={
                      filterStatus === 'all'
                        ? colorMode === 'light'
                          ? 'gray.700'
                          : 'gray.200'
                        : colorMode === 'light'
                        ? 'gray.600'
                        : 'gray.400'
                    }
                    borderRadius="full"
                    fontSize="xs"
                    px={2}
                  >
                    {counts.all}
                  </Badge>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilterStatus('active')}
                  borderRadius="10px"
                  bg={
                    filterStatus === 'active'
                      ? colorMode === 'light'
                        ? 'green.50'
                        : 'green.900'
                      : 'transparent'
                  }
                  color={
                    filterStatus === 'active'
                      ? colorMode === 'light'
                        ? 'green.700'
                        : 'green.200'
                      : colorMode === 'light'
                      ? 'gray.600'
                      : 'gray.400'
                  }
                  fontWeight={filterStatus === 'active' ? '600' : '500'}
                  _hover={{
                    bg: colorMode === 'light' ? 'green.50' : 'green.900',
                  }}
                >
                  Aktif
                  <Badge
                    ml={2}
                    bg={
                      filterStatus === 'active'
                        ? colorMode === 'light'
                          ? 'green.100'
                          : 'green.800'
                        : colorMode === 'light'
                        ? 'gray.100'
                        : 'gray.700'
                    }
                    color={
                      filterStatus === 'active'
                        ? colorMode === 'light'
                          ? 'green.700'
                          : 'green.200'
                        : colorMode === 'light'
                        ? 'gray.600'
                        : 'gray.400'
                    }
                    borderRadius="full"
                    fontSize="xs"
                    px={2}
                  >
                    {counts.active}
                  </Badge>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilterStatus('inactive')}
                  borderRadius="10px"
                  bg={
                    filterStatus === 'inactive'
                      ? colorMode === 'light'
                        ? 'red.50'
                        : 'red.900'
                      : 'transparent'
                  }
                  color={
                    filterStatus === 'inactive'
                      ? colorMode === 'light'
                        ? 'red.700'
                        : 'red.200'
                      : colorMode === 'light'
                      ? 'gray.600'
                      : 'gray.400'
                  }
                  fontWeight={filterStatus === 'inactive' ? '600' : '500'}
                  _hover={{
                    bg: colorMode === 'light' ? 'red.50' : 'red.900',
                  }}
                >
                  Tidak Aktif
                  <Badge
                    ml={2}
                    bg={
                      filterStatus === 'inactive'
                        ? colorMode === 'light'
                          ? 'red.100'
                          : 'red.800'
                        : colorMode === 'light'
                        ? 'gray.100'
                        : 'gray.700'
                    }
                    color={
                      filterStatus === 'inactive'
                        ? colorMode === 'light'
                          ? 'red.700'
                          : 'red.200'
                        : colorMode === 'light'
                        ? 'gray.600'
                        : 'gray.400'
                    }
                    borderRadius="full"
                    fontSize="xs"
                    px={2}
                  >
                    {counts.inactive}
                  </Badge>
                </Button>
              </HStack>

              {/* Table Section */}
              <PermissionTableAdvance
                initialData={filteredPermissions}
                loading={loading}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onEdit={handleOpenModal}
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

      <PermissionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchPermissions}
        initialData={editingPermission}
      />
    </>
  );
};

const ProtectedRolePermissionsPage = withAuth(RolePermissionsPage);

(ProtectedRolePermissionsPage as any).getLayout = function getLayout(
  page: React.ReactElement
) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedRolePermissionsPage;
