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
} from '@chakra-ui/react';
import {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from '@/modules/admin/roles/types/Role.types';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
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
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!role;

  const initialRef = React.useRef(null);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
      });
    } else {
      setFormData({ name: '', description: '' });
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      scrollBehavior="inside"
      isCentered
      initialFocusRef={isEdit ? undefined : initialRef}
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
            <Text>{isEdit ? 'Edit Role' : 'Tambah Role'}</Text>
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
        <ModalBody py={6} px={6}>
          <Box as="form" id="role-form" onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  mb={3}
                >
                  Nama Role
                </FormLabel>
                <Input
                  ref={initialRef}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
              form="role-form"
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

export default RoleFormModal;
