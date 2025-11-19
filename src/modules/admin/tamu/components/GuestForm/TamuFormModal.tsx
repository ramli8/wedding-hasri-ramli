import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useColorMode,
} from '@chakra-ui/react';
import { Tamu } from '../../types/Tamu.types';
import TamuForm from './TamuForm';
import { useTamu } from '../../utils/hooks/useTamu';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface TamuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tamu?: Tamu | null;
  onSave: () => void;
}

const TamuFormModal: React.FC<TamuFormModalProps> = ({ 
  isOpen, 
  onClose, 
  tamu,
  onSave 
}) => {
  const { createTamu, updateTamu } = useTamu();
  const { colorMode } = useColorMode();

  const handleSave = async (formData: any) => {
    try {
      if (tamu?.id) {
        // Update existing tamu
        await updateTamu(tamu.id, formData);
        MySwal.fire({
          title: 'Berhasil!',
          text: 'Data tamu berhasil diperbarui',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#319795',
          background: colorMode === 'light' ? '#fff' : '#1A202C', // Match Chakra gray.900
          color: colorMode === 'light' ? '#1A202C' : '#fff',
        });
      } else {
        // Create new tamu
        await createTamu(formData);
        MySwal.fire({
          title: 'Berhasil!',
          text: 'Tamu baru berhasil ditambahkan',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#319795',
          background: colorMode === 'light' ? '#fff' : '#1A202C',
          color: colorMode === 'light' ? '#1A202C' : '#fff',
        });
      }
      
      onSave();
    } catch (error: any) {
      console.error('Error saving tamu:', error);
      MySwal.fire({
        title: 'Gagal!',
        text: error.message || 'Terjadi kesalahan saat menyimpan data tamu',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e53e3e',
        background: colorMode === 'light' ? '#fff' : '#1A202C',
        color: colorMode === 'light' ? '#1A202C' : '#fff',
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent borderRadius="20px">
        <ModalHeader borderBottomWidth="1px" borderColor={colorMode === 'light' ? 'gray.100' : 'gray.700'}>
          {tamu ? 'Edit Tamu' : 'Tambah Tamu Baru'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          <TamuForm 
            tamu={tamu || undefined} 
            onSave={handleSave} 
            onCancel={onClose} 
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TamuFormModal;