import React, { useState, useMemo } from 'react';
import { VStack, Text, useColorMode, HStack, Icon, Flex, Box, Button, Badge } from '@chakra-ui/react';
import Head from 'next/head';
import AdminLayout from '@/components/layouts/AdminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import RoleTableAdvance from '../components/RoleTableAdvance';
import RoleFormModal from '../components/RoleFormModal';
import PermissionModal from '../components/PermissionModal';
import { useRoles } from '../utils/hooks/useRoles';
import { Role } from '../services/RoleAPI';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';

const RoleListPage: NextPageWithLayout = () => {
  const { roles, loading, fetchRoles, createRole, updateRole, deleteRole, restoreRole } = useRoles();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<Role | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'deleted'>('all');
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
      if (filterStatus === 'deleted') return !!item.deleted_at;
      return true;
    });
  }, [roles, filterStatus]);

  const counts = useMemo(() => {
    return {
      all: roles.length,
      active: roles.filter(i => !i.deleted_at).length,
      deleted: roles.filter(i => i.deleted_at).length
    };
  }, [roles]);

  const HeaderAction = (
    <PrimaryButton onClick={() => handleOpenModal()} w="auto">
      <HStack spacing={2}>
        <MaterialIcon name="add" size={20} variant="rounded" />
        <Text>Tambah</Text>
      </HStack>
    </PrimaryButton>
  );

  return (
    <>
      <Head>
        <title>Manajemen Role</title>
      </Head>
      
      <ContainerQuery>
        <VStack spacing={6} align="stretch" py={8}>
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
                Manajemen Role
              </Text>
              <HStack spacing={2}>
                <Text 
                  fontSize={{ base: 'xs', sm: 'sm' }}
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  noOfLines={1}
                >
                  Kelola role dan hak akses pengguna
                </Text>
              </HStack>
            </VStack>
            
            {/* User Profile & Actions */}
            <Box flexShrink={0}>
              <UserProfileActions />
            </Box>
          </Flex>

          {/* Filter Buttons */}
          <HStack spacing={2} pb={2}>
            <Button
              size="sm"
              variant="ghost"
              borderRadius="10px"
              bg={filterStatus === 'all'
                ? colorMode === 'light' ? 'gray.100' : 'gray.700'
                : 'transparent'}
              color={filterStatus === 'all'
                ? colorMode === 'light' ? 'gray.800' : 'gray.100'
                : colorMode === 'light' ? 'gray.600' : 'gray.400'}
              fontWeight={filterStatus === 'all' ? '600' : '500'}
              onClick={() => setFilterStatus('all')}
              _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.700' }}
            >
              Semua
              <Badge ml={2} borderRadius="full" fontSize="xs" px={2}
                bg={filterStatus === 'all'
                  ? colorMode === 'light' ? 'gray.200' : 'gray.600'
                  : colorMode === 'light' ? 'gray.100' : 'gray.700'}
                color={filterStatus === 'all'
                  ? colorMode === 'light' ? 'gray.700' : 'gray.200'
                  : colorMode === 'light' ? 'gray.600' : 'gray.400'}
              >
                {counts.all}
              </Badge>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              borderRadius="10px"
              bg={filterStatus === 'active'
                ? colorMode === 'light' ? 'green.50' : 'green.900'
                : 'transparent'}
              color={filterStatus === 'active'
                ? colorMode === 'light' ? 'green.700' : 'green.200'
                : colorMode === 'light' ? 'gray.600' : 'gray.400'}
              fontWeight={filterStatus === 'active' ? '600' : '500'}
              onClick={() => setFilterStatus('active')}
              _hover={{ bg: colorMode === 'light' ? 'green.50' : 'green.900' }}
            >
              Aktif
              <Badge ml={2} borderRadius="full" fontSize="xs" px={2}
                bg={filterStatus === 'active'
                  ? colorMode === 'light' ? 'green.100' : 'green.800'
                  : colorMode === 'light' ? 'gray.100' : 'gray.700'}
                color={filterStatus === 'active'
                  ? colorMode === 'light' ? 'green.700' : 'green.200'
                  : colorMode === 'light' ? 'gray.600' : 'gray.400'}
              >
                {counts.active}
              </Badge>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              borderRadius="10px"
              bg={filterStatus === 'deleted'
                ? colorMode === 'light' ? 'red.50' : 'red.900'
                : 'transparent'}
              color={filterStatus === 'deleted'
                ? colorMode === 'light' ? 'red.700' : 'red.200'
                : colorMode === 'light' ? 'gray.600' : 'gray.400'}
              fontWeight={filterStatus === 'deleted' ? '600' : '500'}
              onClick={() => setFilterStatus('deleted')}
              _hover={{ bg: colorMode === 'light' ? 'red.50' : 'red.900' }}
            >
              Tidak Aktif
              <Badge ml={2} borderRadius="full" fontSize="xs" px={2}
                bg={filterStatus === 'deleted'
                  ? colorMode === 'light' ? 'red.100' : 'red.800'
                  : colorMode === 'light' ? 'gray.100' : 'gray.700'}
                color={filterStatus === 'deleted'
                  ? colorMode === 'light' ? 'red.700' : 'red.200'
                  : colorMode === 'light' ? 'gray.600' : 'gray.400'}
              >
                {counts.deleted}
              </Badge>
            </Button>
          </HStack>

          <RoleTableAdvance
            initialData={filteredData}
            loading={loading}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onAddNew={() => handleOpenModal()}
            onManagePermissions={handleManagePermissions}
            headerAction={HeaderAction}
          />
        </VStack>
      </ContainerQuery>

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
