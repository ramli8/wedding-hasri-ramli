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
} from '@chakra-ui/react';
import { KategoriTamu, CreateKategoriTamuInput, UpdateKategoriTamuInput } from '@/modules/admin/kategori_tamu/types/KategoriTamu.types';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';

interface KategoriFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  kategori?: KategoriTamu;
  onSave: (data: CreateKategoriTamuInput | UpdateKategoriTamuInput) => Promise<void>;
}

const KategoriFormModal: React.FC<KategoriFormModalProps> = ({
  isOpen,
  onClose,
  kategori,
  onSave,
}) => {
  const { colorMode } = useColorMode();
  const [formData, setFormData] = useState<CreateKategoriTamuInput>({ nama: '' });
  const [loading, setLoading] = useState(false);
  const isEdit = !!kategori;

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
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
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
            <Text>{isEdit ? 'Edit Kategori' : 'Tambah Kategori'}</Text>
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
          <Box as="form" id="kategori-form" onSubmit={handleSubmit}>
            <VStack spacing={5} align="stretch">
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm" 
                  fontWeight="600"
                  mb={2}
                  color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                >
                  Nama Kategori
                </FormLabel>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ nama: e.target.value })}
                  placeholder="Contoh: Tamu Hasri"
                  size="md"
                  borderRadius="md"
                  borderColor={colorMode === 'light' ? 'gray.300' : 'gray.600'}
                  _hover={{
                    borderColor: colorMode === 'light' ? 'gray.400' : 'gray.500',
                  }}
                  _focus={{
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px #3182ce',
                  }}
                  bg={colorMode === 'light' ? 'white' : 'gray.700'}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Masukkan nama kategori tamu (misal: VIP, Keluarga, Teman)
                </Text>
              </FormControl>
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
              h="40px"
              borderRadius="10px"
              fontSize="14px"
            >
              Batal
            </Button>
            <PrimaryButton 
              type="submit" 
              form="kategori-form"
              isLoading={loading}
              loadingText="Menyimpan..."
            >
              {isEdit ? 'Perbarui' : 'Simpan'}
            </PrimaryButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default KategoriFormModal;
