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
  useToast,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useState, useContext } from 'react';
import { Ucapan } from '../types/Ucapan.types';
import UcapanAPI from '../services/UcapanAPI';
import AccountInfoContext from '@/providers/AccountInfoProvider';

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
  const toast = useToast();
  const api = new UcapanAPI();
  const accountInfo = useContext(AccountInfoContext);

  const handleSubmit = async () => {
    if (!ucapan || !reply.trim()) {
      toast({
        title: 'Pesan balasan tidak boleh kosong',
        status: 'warning',
        duration: 3000,
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

      toast({
        title: 'Balasan berhasil dikirim',
        status: 'success',
        duration: 3000,
      });

      setReply('');
      onClose();
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Gagal mengirim balasan',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
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
                placeholder="Tulis balasan Anda..."
                rows={4}
                disabled={isSubmitting}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Mengirim..."
          >
            Kirim Balasan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UcapanReplyModal;
