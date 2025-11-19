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
  VStack,
  HStack,
} from '@chakra-ui/react';
import { KategoriTamu, CreateKategoriTamuInput, UpdateKategoriTamuInput } from '@/modules/admin/kategori_tamu/types/KategoriTamu.types';
import { PrimaryButton, PrimaryOutlineButton } from '@/components/atoms/Buttons/PrimaryButton';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

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
      
      MySwal.fire({
        icon: 'success',
        title: isEdit ? 'Kategori Diperbarui!' : 'Kategori Ditambahkan!',
        text: `Kategori "${formData.nama}" berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#319795',
        background: colorMode === 'light' ? '#fff' : '#1A202C',
        color: colorMode === 'light' ? '#1A202C' : '#fff',
      });
      
      onClose();
    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error.message || 'Terjadi kesalahan',
        confirmButtonText: 'OK',
        confirmButtonColor: '#E53E3E',
        background: colorMode === 'light' ? '#fff' : '#1A202C',
        color: colorMode === 'light' ? '#1A202C' : '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg={colorMode === 'light' ? 'white' : 'gray.800'}>
        <ModalHeader>{isEdit ? 'Edit Kategori' : 'Tambah Kategori'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nama Kategori</FormLabel>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ nama: e.target.value })}
                  placeholder="Contoh: Tamu Hasri"
                  size="lg"
                  borderRadius="md"
                  focusBorderColor={colorMode === 'light' ? 'teal.500' : 'teal.300'}
                />
              </FormControl>

              <HStack spacing={3} width="full" justify="flex-end">
                <PrimaryOutlineButton onClick={onClose} isDisabled={loading}>
                  Batal
                </PrimaryOutlineButton>
                <PrimaryButton type="submit" isLoading={loading}>
                  {isEdit ? 'Perbarui' : 'Simpan'}
                </PrimaryButton>
              </HStack>
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default KategoriFormModal;
