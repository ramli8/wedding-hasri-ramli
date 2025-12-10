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
  Switch,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from '@/modules/admin/roles/types/Role.types';
import {
  PrimaryButton,
  PrimaryOutlineButton,
} from '@/components/atoms/Buttons/PrimaryButton';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role;
  onSave: (data: CreateRoleInput | UpdateRoleInput) => Promise<void>;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  role,
  onSave,
}) => {
  const { colorMode } = useColorMode();
  const [formData, setFormData] = useState<CreateRoleInput>({
    name: '',
    description: '',
    is_default: false,
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!role;

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        is_default: role.is_default || false,
      });
    } else {
      setFormData({ name: '', description: '', is_default: false });
    }
  }, [role, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        is_default: formData.is_default,
      });

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
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius={{ base: 0, md: '16px' }}
        mx={{ base: 0, md: 4 }}
      >
        <ModalHeader
          fontSize={{ base: 'lg', md: 'xl' }}
          fontWeight="600"
          pb={3}
          borderBottom="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
        >
          <HStack spacing={3}>
            <Text>{isEdit ? 'Edit Role' : 'Tambah Role'}</Text>
            {isEdit && (
              <Badge
                colorScheme="blue"
                variant="subtle"
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="full"
                textTransform="uppercase"
                letterSpacing="wider"
                fontWeight="700"
                bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
                color={colorMode === 'light' ? 'blue.600' : 'blue.200'}
                border="1px solid"
                borderColor={colorMode === 'light' ? 'blue.100' : 'blue.800'}
              >
                Edit Mode
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          <Box as="form" id="role-form" onSubmit={handleSubmit}>
            <VStack spacing={5} align="stretch">
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  mb={2}
                  color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                >
                  Nama Role
                </FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  size="lg"
                  borderRadius="12px"
                  focusBorderColor={
                    colorMode === 'light' ? 'blue.500' : 'blue.300'
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  mb={2}
                  color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                >
                  Deskripsi
                </FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  size="lg"
                  borderRadius="12px"
                  focusBorderColor={
                    colorMode === 'light' ? 'blue.500' : 'blue.300'
                  }
                  rows={3}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel
                  htmlFor="is-default"
                  mb="0"
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                >
                  Set sebagai Default Role
                </FormLabel>
                <Switch
                  id="is-default"
                  isChecked={formData.is_default}
                  onChange={(e) =>
                    setFormData({ ...formData, is_default: e.target.checked })
                  }
                  colorScheme="blue"
                />
              </FormControl>

              {formData.is_default && (
                <Alert
                  status="info"
                  borderRadius="md"
                  fontSize="sm"
                  bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
                  color={colorMode === 'light' ? 'blue.800' : 'blue.200'}
                >
                  <AlertIcon />
                  <Text fontSize="xs">
                    Role ini akan digunakan sebagai default untuk user yang
                    belum memiliki role spesifik.
                  </Text>
                </Alert>
              )}
            </VStack>
          </Box>
        </ModalBody>

        <ModalFooter
          borderTop="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
          pt={4}
        >
          <HStack spacing={3} width="full" justify="flex-end">
            <Button
              variant="ghost"
              onClick={onClose}
              isDisabled={loading}
              minW="120px"
              h="48px"
              borderRadius="12px"
              fontSize="14px"
            >
              Batal
            </Button>
            <PrimaryButton
              type="submit"
              form="role-form"
              isLoading={loading}
              minW="120px"
              h="48px"
              borderRadius="12px"
            >
              {isEdit ? 'Perbarui' : 'Simpan'}
            </PrimaryButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RoleFormModal;
