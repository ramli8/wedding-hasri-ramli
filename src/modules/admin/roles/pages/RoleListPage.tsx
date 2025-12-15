import React, { useState, useMemo, useContext, useEffect } from 'react';
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
import AppSettingContext from '@/providers/AppSettingProvider';

const RoleListPage: NextPageWithLayout = () => {
  const {
    roles,
    loading,
    fetchRoles,
    loadMore,
    hasMore,
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
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, inactive: 0 });
  
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const api = useMemo(() => new (require('../services/RoleAPI').default)(), []);

  const handleOpenModal = (role?: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(undefined);
  };

  const fetchCounts = async () => {
    try {
      const counts = await api.getCounts();
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  useEffect(() => {
    fetchRoles(true, { status: filterStatus });
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleSaveSuccess = () => {
    fetchRoles(true, { status: filterStatus });
    fetchCounts();
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

  // Use server-side filtering and counts
  const filteredRoles = roles;
  const counts = statusCounts;

  return (
    <>
      <Head>
        <title>Manajemen Role</title>
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
                      Manajemen Role
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
                    Kelola role dan permission dengan kontrol akses yang fleksibel
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
                initialData={filteredRoles}
                loading={loading}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onAddNew={() => handleOpenModal()}
                onManagePermissions={handleManagePermissions}
                onLoadMore={() => loadMore({ status: filterStatus })}
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
