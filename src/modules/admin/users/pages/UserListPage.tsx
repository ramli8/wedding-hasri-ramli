import React, { useState, useEffect } from 'react';
import { VStack, Flex, Box, useColorMode, Text } from '@chakra-ui/react';
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
import AdminLayout from '@/components/layouts/AdminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UserAPI, { User, Role } from '../services/UserAPI';
import UserTableAdvance from '../components/UserTableAdvance';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import UserProfileActions from '@/components/molecules/UserProfileActions';

const UserListPage: NextPageWithLayout = () => {
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
  const { colorMode } = useColorMode();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([api.getUsers(), api.getRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      showErrorAlert('Gagal memuat data user', error.message, colorMode);
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
        showSuccessAlert('User berhasil diupdate', colorMode);
      } else {
        // Create new user
        const newUser = await api.createUser({
          username: formData.username,
          name: formData.name,
          password_hash: formData.password || 'default123',
          role_ids: formData.role_ids,
        });
        showSuccessAlert('User berhasil dibuat', colorMode);
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      showErrorAlert(
        editingUser ? 'Gagal update user' : 'Gagal membuat user',
        error.message,
        colorMode
      );
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      showSuccessAlert('User berhasil dihapus', colorMode);
      fetchData();
    } catch (error: any) {
      showErrorAlert('Gagal menghapus user', error.message, colorMode);
    }
  };

  const handleCopyMagicLink = (user: User) => {
    const magicLink = `${window.location.origin}/admin/login?magic=${user.id}`;
    navigator.clipboard.writeText(magicLink);
    showSuccessAlert('Magic link berhasil disalin', colorMode);
  };

  return (
    <>
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
                Manajemen User
              </Text>
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                noOfLines={1}
              >
                Kelola pengguna dan hak akses
              </Text>
            </VStack>
            
            {/* User Profile & Actions */}
            <Box flexShrink={0}>
              <UserProfileActions />
            </Box>
          </Flex>

          {/* Content */}
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
