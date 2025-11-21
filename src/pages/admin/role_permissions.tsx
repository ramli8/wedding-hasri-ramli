import React, { useState, useEffect } from 'react';
import { useToast, VStack, Flex, Box, useColorMode, Text, HStack, Icon } from '@chakra-ui/react';
import Head from 'next/head';
import Sidebar from '@/components/organisms/Sidebar';
import PageTransition from '@/components/PageLayout';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import PermissionAPI, { RolePermission } from '@/modules/admin/permissions/services/PermissionAPI';
import PermissionTableAdvance, { PermissionWithRole } from '@/modules/admin/permissions/components/PermissionTableAdvance';
import PermissionFormModal from '@/modules/admin/permissions/components/PermissionFormModal';
import withAuth from '@/hoc/withAuth';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';

const RolePermissionsPage = () => {
  const [permissions, setPermissions] = useState<PermissionWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<RolePermission | null>(null);
  
  const api = new PermissionAPI();
  const toast = useToast();
  const { colorMode } = useColorMode();

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await api.getAllPermissions();
      setPermissions(data);
    } catch (error: any) {
      toast({
        title: 'Gagal memuat data permissions',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
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
    try {
      await api.deletePermission(id);
      toast({ title: 'Permission berhasil dihapus', status: 'success', duration: 3000 });
      fetchPermissions();
    } catch (error: any) {
      toast({ title: 'Gagal menghapus permission', description: error.message, status: 'error', duration: 3000 });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restorePermission(id);
      toast({ title: 'Permission berhasil dipulihkan', status: 'success', duration: 3000 });
      fetchPermissions();
    } catch (error: any) {
      toast({ title: 'Gagal memulihkan permission', description: error.message, status: 'error', duration: 3000 });
    }
  };

  return (
    <>
      <Head>
        <title>Manajemen Permissions • {process.env.NEXT_PUBLIC_APP_NAME_FULL}</title>
      </Head>

      <Flex minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
        <Sidebar />
        <Box
          flex="1"
          ml={{ base: "0", m: "108px", d: "280px" }}
          transition="margin-left 0.3s ease"
          minH="100vh"
          p={2}
        >
          <PageTransition pageTitle="Manajemen Permissions">
            <PageRow>
              <ContainerQuery>
                <Flex justify="space-between" align="center" mb={6}>
                  <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
                    Daftar semua permissions yang aktif dan terhapus
                  </Text>
                  <PrimaryButton onClick={() => handleOpenModal()} w="auto">
                    <HStack spacing={2} justify="center">
                      <Icon viewBox="0 0 24 24" width="20px" height="20px" fill="currentColor">
                        <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                      </Icon>
                      <Text>Tambah Permission</Text>
                    </HStack>
                  </PrimaryButton>
                </Flex>
                
                <VStack spacing={8} align="stretch">
                  <PermissionTableAdvance
                    initialData={permissions}
                    loading={loading}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    onEdit={handleOpenModal}
                  />
                </VStack>
              </ContainerQuery>
            </PageRow>
          </PageTransition>
        </Box>
      </Flex>

      <PermissionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchPermissions}
        initialData={editingPermission}
      />
    </>
  );
};

export default withAuth(RolePermissionsPage);
