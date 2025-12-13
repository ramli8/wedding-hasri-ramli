'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useColorMode,
  VStack,
  HStack,
  Text,
  Badge,
  Textarea,
  Select,
} from '@chakra-ui/react';
import { RolePermission } from '../services/PermissionAPI';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import { useRoles } from '../../roles/utils/hooks/useRoles';

interface PermissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission?: RolePermission;
  onSave: (data: Omit<RolePermission, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<RolePermission>) => Promise<void>;
}

const PermissionFormModal: React.FC<PermissionFormModalProps> = ({
  isOpen,
  onClose,
  permission,
  onSave,
  onUpdate,
}) => {
  const { colorMode } = useColorMode();
  const { roles } = useRoles(); // Fetch roles for dropdown

  const [formData, setFormData] = useState({
    role_id: '',
    url_pattern: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const isEdit = !!permission;

  const initialRef = React.useRef(null);

  useEffect(() => {
    if (permission) {
      setFormData({
        role_id: permission.role_id,
        url_pattern: permission.url_pattern,
        description: permission.description || '',
      });
    } else {
      setFormData({ role_id: '', url_pattern: '', description: '' });
    }
  }, [permission, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role_id || !formData.url_pattern.trim()) return;

    setLoading(true);
    try {
      if (isEdit && permission) {
        await onUpdate(permission.id, {
          role_id: formData.role_id,
          url_pattern: formData.url_pattern.trim(),
          description: formData.description?.trim() || '',
        });
      } else {
        await onSave({
          role_id: formData.role_id,
          url_pattern: formData.url_pattern.trim(),
          description: formData.description?.trim() || '',
        } as any);
      }

      showSuccessAlert(
        isEdit ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan',
        colorMode
      );

      onClose();
    } catch (error: any) {
      showErrorAlert(
        'Gagal menyimpan',
        error.message || 'Terjadi kesalahan',
        colorMode
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isCentered
      initialFocusRef={initialRef}
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius="24px"
        mx={4}
        boxShadow="xl"
        p={2}
      >
        <ModalHeader fontSize="xl" fontWeight="700" pt={6} pb={2} px={6}>
          <HStack spacing={3}>
            <Text>{isEdit ? 'Edit Permission' : 'Tambah Permission'}</Text>
            {isEdit && (
              <Badge
                colorScheme="orange"
                variant="subtle"
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="full"
                textTransform="uppercase"
                letterSpacing="wider"
                fontWeight="800"
              >
                Edit Mode
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton top={6} right={6} />
        <ModalBody py={4} px={6}>
          <Box as="form" id="perm-form" onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  mb={3}
                >
                  Role
                </FormLabel>
                <Select
                  ref={initialRef}
                  placeholder="Pilih Role"
                  value={formData.role_id}
                  onChange={(e) =>
                    setFormData({ ...formData, role_id: e.target.value })
                  }
                  size="lg"
                  variant="filled"
                  bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                  borderRadius="16px"
                  fontSize="md"
                  fontWeight="500"
                  _hover={{
                    bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
                  }}
                  _focus={{
                    bg: colorMode === 'light' ? 'white' : 'gray.800',
                    borderColor: 'blue.500',
                  }}
                >
                  {roles
                    .filter((r) => !r.deleted_at)
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  mb={3}
                >
                  URL Pattern
                </FormLabel>
                <Input
                  value={formData.url_pattern}
                  onChange={(e) =>
                    setFormData({ ...formData, url_pattern: e.target.value })
                  }
                  placeholder="/admin/example"
                  size="lg"
                  variant="filled"
                  bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                  borderRadius="16px"
                  fontSize="md"
                  fontWeight="500"
                  _hover={{
                    bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
                  }}
                  _focus={{
                    bg: colorMode === 'light' ? 'white' : 'gray.800',
                    borderColor:
                      colorMode === 'light' ? 'blue.500' : 'blue.300',
                    boxShadow: 'none',
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  mb={3}
                >
                  Deskripsi
                </FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  size="lg"
                  variant="filled"
                  bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                  borderRadius="16px"
                  fontSize="md"
                  fontWeight="500"
                  rows={3}
                  _hover={{
                    bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
                  }}
                  _focus={{
                    bg: colorMode === 'light' ? 'white' : 'gray.800',
                    borderColor:
                      colorMode === 'light' ? 'blue.500' : 'blue.300',
                    boxShadow: 'none',
                  }}
                />
              </FormControl>
            </VStack>
          </Box>
        </ModalBody>

        <ModalFooter pb={6} px={6} pt={4}>
          <HStack spacing={3} width="full" justify="flex-end">
            <Button
              variant="ghost"
              onClick={onClose}
              isDisabled={loading}
              h="50px"
              borderRadius="16px"
              fontSize="sm"
              fontWeight="600"
              color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              _hover={{
                bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
              }}
            >
              Batal
            </Button>
            <PrimaryButton
              type="submit"
              form="perm-form"
              isLoading={loading}
              h="50px"
              px={8}
              borderRadius="16px"
              fontSize="sm"
              fontWeight="600"
            >
              {isEdit ? 'Simpan Perubahan' : 'Tambah Data'}
            </PrimaryButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PermissionFormModal;
