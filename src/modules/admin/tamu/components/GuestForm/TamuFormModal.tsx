import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useColorMode,
  HStack,
  Text,
  Badge,
} from '@chakra-ui/react';
import { Tamu } from '../../types/Tamu.types';
import TamuForm from './TamuForm';
import { useTamu } from '../../utils/hooks/useTamu';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';

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
  onSave,
}) => {
  const { createTamu, updateTamu } = useTamu();
  const { colorMode } = useColorMode();

  const handleSave = async (formData: any) => {
    try {
      if (tamu?.id) {
        // Update existing tamu
        await updateTamu(tamu.id, formData);
        showSuccessAlert('Data tamu berhasil diperbarui', colorMode);
      } else {
        // Create new tamu
        await createTamu(formData);
        showSuccessAlert('Tamu baru berhasil ditambahkan', colorMode);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving tamu:', error);
      showErrorAlert(
        'Gagal menyimpan',
        error.message || 'Terjadi kesalahan saat menyimpan data tamu',
        colorMode
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      isCentered
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
            <Text>{tamu ? 'Edit Tamu' : 'Tambah Tamu Baru'}</Text>
            {tamu && (
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
