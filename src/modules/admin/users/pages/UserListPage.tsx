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
  Checkbox,
  CheckboxGroup,
  Stack,
  Button,
} from '@chakra-ui/react';
import Head from 'next/head';
import Sidebar from '@/components/organisms/Sidebar';
import PageTransition from '@/components/PageLayout';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UserAPI, { User, Role } from '../services/UserAPI';
import UserTableAdvance from '../components/UserTableAdvance';

const UserListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role_ids: [] as string[],
  });

  const api = new UserAPI();
  const toast = useToast();
  const { colorMode } = useColorMode();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([api.getUsers(), api.getRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      toast({
        title: 'Gagal memuat data',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        password: '',
        role_ids: user.roles?.map((r) => r.id) || [],
      });
    } else {
      setEditingUser(null);
      setFormData({ username: '', name: '', password: '', role_ids: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ username: '', name: '', password: '', role_ids: [] });
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          username: formData.username,
          name: formData.name,
          password_hash: formData.password || undefined,
          role_ids: formData.role_ids,
        });
        toast({ title: 'User berhasil diupdate', status: 'success', duration: 3000 });
      } else {
        await api.createUser({
          username: formData.username,
          name: formData.name,
          password_hash: formData.password,
          role_ids: formData.role_ids,
        });
        toast({ title: 'User berhasil dibuat', status: 'success', duration: 3000 });
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      toast({
        title: editingUser ? 'Gagal update user' : 'Gagal membuat user',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      toast({ title: 'User berhasil dihapus', status: 'success', duration: 3000 });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Gagal menghapus user', description: error.message, status: 'error', duration: 3000 });
    }
  };

  const handleCopyMagicLink = (user: User) => {
    const magicLink = `${window.location.origin}/?admin=${user.id}`;
    navigator.clipboard.writeText(magicLink);
    toast({
      title: 'Magic link berhasil disalin',
      description: `Link admin untuk ${user.name} - bisa balas semua ucapan`,
      status: 'success',
      duration: 2000,
    });
  };

  return (
    <>
      <Head>
        <title>Manajemen User • {process.env.NEXT_PUBLIC_APP_NAME_FULL}</title>
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
          <PageTransition pageTitle="Manajemen User">
            <PageRow>
              <ContainerQuery>
                <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'} mb={6}>
                  Kelola pengguna dan hak akses
                </Text>
                <VStack spacing={8} align="stretch">
                  <UserTableAdvance
                    initialData={users}
                    loading={loading}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteUser}
                    onAddNew={() => handleOpenModal()}
                    onCopyMagicLink={handleCopyMagicLink}
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
          <ModalHeader>{editingUser ? 'Edit User' : 'Tambah User Baru'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nama Lengkap</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired={!editingUser}>
                <FormLabel>Password{editingUser && ' (kosongkan jika tidak diubah)'}</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Kosongkan jika tidak diubah' : ''}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Roles</FormLabel>
                <CheckboxGroup
                  value={formData.role_ids}
                  onChange={(vals) => setFormData({ ...formData, role_ids: vals as string[] })}
                >
                  <Stack direction="column">
                    {roles.map((role) => (
                      <Checkbox key={role.id} value={role.id}>
                        {role.name}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>
              <Button colorScheme="teal" w="full" onClick={handleSubmit}>
                {editingUser ? 'Update' : 'Simpan'}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserListPage;
