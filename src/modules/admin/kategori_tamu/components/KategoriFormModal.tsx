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
  ModalCloseButton,
  useColorMode,
  ModalFooter,
  Text,
  Badge,
  VStack,
  HStack,
} from '@chakra-ui/react';
import {
  KategoriTamu,
  CreateKategoriTamuInput,
  UpdateKategoriTamuInput,
} from '@/modules/admin/kategori_tamu/types/KategoriTamu.types';
import {
  PrimaryButton,
  PrimaryOutlineButton,
} from '@/components/atoms/Buttons/PrimaryButton';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';

interface KategoriFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  kategori?: KategoriTamu;
  onSave: (
    data: CreateKategoriTamuInput | UpdateKategoriTamuInput
  ) => Promise<void>;
}

const KategoriFormModal: React.FC<KategoriFormModalProps> = ({
  isOpen,
  onClose,
  kategori,
  onSave,
}) => {
  const { colorMode } = useColorMode();
  const [formData, setFormData] = useState<CreateKategoriTamuInput>({
    nama: '',
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!kategori;

  const initialRef = React.useRef(null);

  useEffect(() => {
    if (kategori) {
      setFormData({ nama: kategori.nama });
    } else {
      setFormData({ nama: '' });
    }
  }, [kategori, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return;

    setLoading(true);
    try {
      await onSave({ nama: formData.nama.trim() });

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
            <Text>{isEdit ? 'Edit Kategori' : 'Tambah Kategori'}</Text>
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
          <Box as="form" id="kategori-form" onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  mb={3}
                >
                  Nama Kategori
                </FormLabel>
                <Input
                  ref={initialRef}
                  value={formData.nama}
                  onChange={(e) => setFormData({ nama: e.target.value })}
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
              form="kategori-form"
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

export default KategoriFormModal;
