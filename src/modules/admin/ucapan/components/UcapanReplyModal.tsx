import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Textarea,
  VStack,
  Text,
  Box,
  useColorMode,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useState, useContext } from 'react';
import { Ucapan } from '../types/Ucapan.types';
import UcapanAPI from '../services/UcapanAPI';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import {
  showSuccessAlert,
  showErrorAlert,
  showAlert,
} from '@/utils/sweetalert';

interface UcapanReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  ucapan: Ucapan | null;
  onSuccess?: () => void;
}

const UcapanReplyModal: React.FC<UcapanReplyModalProps> = ({
  isOpen,
  onClose,
  ucapan,
  onSuccess,
}) => {
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { colorMode } = useColorMode();
  const api = new UcapanAPI();
  const accountInfo = useContext(AccountInfoContext);

  const handleSubmit = async () => {
    if (!ucapan || !reply.trim()) {
      showAlert({
        title: 'Pesan balasan tidak boleh kosong',
        icon: 'warning',
        colorMode,
        showConfirmButton: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.replyToUcapan(ucapan.id, {
        nama: accountInfo?.name || 'Admin',
        pesan: reply.trim(),
        user_id: accountInfo?.userId,
        is_admin: true,
      });

      showSuccessAlert('Balasan berhasil dikirim', colorMode);

      setReply('');
      onClose();

      if (onSuccess) onSuccess();
    } catch (error: any) {
      showErrorAlert('Gagal mengirim balasan', error.message, colorMode);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Balas Ucapan</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {ucapan && (
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Ucapan dari: {ucapan.nama}
                </Text>
                <Text fontSize="sm" color="gray.700">
                  {ucapan.pesan}
                </Text>
              </Box>
            )}

            <FormControl isRequired>
              <FormLabel>Balasan Anda</FormLabel>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                disabled={isSubmitting}
                size="lg"
                borderRadius="12px"
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            disabled={isSubmitting}
            minW="120px"
            h="48px"
            borderRadius="12px"
            fontSize="14px"
          >
            Batal
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Mengirim..."
            minW="120px"
            h="48px"
            borderRadius="12px"
            fontSize="14px"
          >
            Kirim Balasan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UcapanReplyModal;
