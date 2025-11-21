import React, { useState, useEffect } from 'react';
import { useToast, VStack, Flex, Box, useColorMode, Text } from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
} from '@chakra-ui/react';
import Head from 'next/head';
import Sidebar from '@/components/organisms/Sidebar';
import PageTransition from '@/components/PageLayout';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import RoleAPI, { Role } from '../services/RoleAPI';
import RoleTableAdvance from '../components/RoleTableAdvance';
import PermissionModal from '../components/PermissionModal';

const RoleListPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const api = new RoleAPI();
  const toast = useToast();
  const { colorMode } = useColorMode();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await api.getRoles();
      setRoles(data);
    } catch (error: any) {
      toast({
        title: 'Gagal memuat data role',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description || '' });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, formData);
        toast({ title: 'Role berhasil diupdate', status: 'success', duration: 3000 });
      } else {
        await api.createRole(formData);
        toast({ title: 'Role berhasil dibuat', status: 'success', duration: 3000 });
      }
      handleCloseModal();
      fetchRoles();
    } catch (error: any) {
      toast({
        title: editingRole ? 'Gagal update role' : 'Gagal membuat role',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteRole(id);
      toast({ title: 'Role berhasil dihapus', status: 'success', duration: 3000 });
      fetchRoles();
    } catch (error: any) {
      toast({ title: 'Gagal menghapus role', description: error.message, status: 'error', duration: 3000 });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restoreRole(id);
      toast({ title: 'Role berhasil dipulihkan', status: 'success', duration: 3000 });
      fetchRoles();
    } catch (error: any) {
      toast({ title: 'Gagal memulihkan role', description: error.message, status: 'error', duration: 3000 });
    }
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRoleForPermission(role);
    setIsPermissionModalOpen(true);
  };

  return (
    <>
      <Head>
        <title>Manajemen Role • {process.env.NEXT_PUBLIC_APP_NAME_FULL}</title>
      </Head>

      <Flex minH="100vh" bg={colorMode === 'light' ? 'white' : 'black'}>
        <Sidebar />
        <Box
          flex="1"
          ml={{ base: "0", m: "108px", d: "280px" }}
          transition="margin-left 0.3s ease"
          minH="100vh"
          p={2}
        >
          <PageTransition pageTitle="Manajemen Role">
            <PageRow>
              <ContainerQuery>
                <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'} mb={6}>
                  Kelola role dan hak akses pengguna
                </Text>
                <VStack spacing={8} align="stretch">
                  <RoleTableAdvance
                    initialData={roles}
                    loading={loading}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    onAddNew={() => handleOpenModal()}
                    onManagePermissions={handleManagePermissions}
                  />
                </VStack>
              </ContainerQuery>
            </PageRow>
          </PageTransition>
        </Box>
      </Flex>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingRole ? 'Edit Role' : 'Tambah Role Baru'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nama Role</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Admin"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Deskripsi</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi role..."
                />
              </FormControl>
              <Button colorScheme="teal" w="full" onClick={handleSubmit}>
                {editingRole ? 'Update' : 'Simpan'}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

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
