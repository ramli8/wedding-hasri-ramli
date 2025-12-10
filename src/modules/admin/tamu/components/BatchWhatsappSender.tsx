import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  Progress,
  Box,
  HStack,
  Icon,
  useColorMode,
  Textarea,
  Badge,
} from '@chakra-ui/react';
import { Tamu } from '../types/Tamu.types';
import { FaWhatsapp, FaCheck, FaTimes, FaArrowRight } from 'react-icons/fa';

interface BatchWhatsappSenderProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTamu: Tamu[];
  onComplete?: () => void;
  onUpdateStatus?: (id: string, status: 'dikirim') => Promise<void>;
}

const BatchWhatsappSender: React.FC<BatchWhatsappSenderProps> = ({
  isOpen,
  onClose,
  selectedTamu,
  onComplete,
  onUpdateStatus,
}) => {
  const { colorMode } = useColorMode();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [messageTemplate, setMessageTemplate] = useState(
    'Halo {nama},\n\nKami mengundang Anda untuk hadir di acara pernikahan kami.\n\nResepsi:\nTanggal: {tanggal}\nJam: {jam_mulai} - {jam_selesai}\n\nSilakan cek undangan digital Anda di sini:\n{link}\n\nTerima kasih.'
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setProcessedCount(0);
    }
  }, [isOpen, selectedTamu]);

  const currentTamu = selectedTamu[currentIndex];
  const progress =
    selectedTamu.length > 0 ? (currentIndex / selectedTamu.length) * 100 : 0;
  const isFinished = currentIndex >= selectedTamu.length;

  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString?: Date | string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date
      .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      .replace('.', ':');
  };

  const getFormattedMessage = (tamu: Tamu) => {
    // Replace variables in template
    const link = `${window.location.origin}/?to=${tamu.id}`;

    return messageTemplate
      .replace(/{nama}/g, tamu.nama)
      .replace(/{link}/g, link)
      .replace(/{tanggal}/g, formatDate(tamu.tgl_mulai_resepsi))
      .replace(/{jam_mulai}/g, formatTime(tamu.tgl_mulai_resepsi))
      .replace(/{jam_selesai}/g, formatTime(tamu.tgl_akhir_resepsi));
  };

  const handleSend = async () => {
    if (!currentTamu) return;

    const message = getFormattedMessage(currentTamu);
    const phoneNumber = currentTamu.nomor_hp
      .replace(/^0/, '62')
      .replace(/\D/g, ''); // Basic formatting
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    // Open WhatsApp in new tab
    window.open(url, '_blank');

    // Update status if function provided
    if (onUpdateStatus && currentTamu.status_undangan !== 'dikirim') {
      try {
        await onUpdateStatus(currentTamu.id, 'dikirim');
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }

    // Move to next
    handleNext();
  };

  const handleNext = () => {
    setProcessedCount((prev) => prev + 1);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleFinish = () => {
    if (onComplete) onComplete();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent bg={colorMode === 'light' ? 'white' : 'gray.800'}>
        <ModalHeader>Kirim WhatsApp Batch</ModalHeader>
        <ModalCloseButton isDisabled={!isFinished && processedCount > 0} />

        <ModalBody>
          {!isFinished ? (
            <VStack spacing={6} align="stretch">
              <Box>
                <Text mb={2} fontWeight="bold" fontSize="sm">
                  Progress: {currentIndex + 1} dari {selectedTamu.length}
                </Text>
                <Progress
                  value={progress}
                  size="sm"
                  colorScheme="green"
                  borderRadius="full"
                />
              </Box>

              <Box
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
              >
                <Text
                  fontSize="xs"
                  color="gray.500"
                  mb={1}
                  textTransform="uppercase"
                  fontWeight="bold"
                >
                  Penerima Saat Ini
                </Text>
                <Text fontWeight="bold" fontSize="lg">
                  {currentTamu?.nama}
                </Text>
                <Text fontSize="sm" fontFamily="monospace">
                  {currentTamu?.nomor_hp}
                </Text>
                <Badge
                  mt={2}
                  colorScheme={
                    currentTamu?.status_undangan === 'dikirim'
                      ? 'green'
                      : 'yellow'
                  }
                >
                  Status:{' '}
                  {currentTamu?.status_undangan === 'dikirim'
                    ? 'Sudah Dikirim'
                    : 'Belum Dikirim'}
                </Badge>
              </Box>

              <Box>
                <Text fontSize="sm" mb={2} fontWeight="bold">
                  Pesan Preview:
                </Text>
                <Box
                  p={3}
                  bg="green.50"
                  color="gray.800"
                  borderRadius="md"
                  fontSize="sm"
                  whiteSpace="pre-wrap"
                >
                  {currentTamu && getFormattedMessage(currentTamu)}
                </Box>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Template Pesan (Edit untuk mengubah semua pesan berikutnya)
                </Text>
                <Textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  size="lg"
                  borderRadius="12px"
                  rows={3}
                />
                <Text fontSize="xs" color="gray.400" mt={1}>
                  Gunakan {'{nama}'}, {'{link}'}, {'{tanggal}'}, {'{jam_mulai}'}
                  , dan {'{jam_selesai}'}.
                </Text>
              </Box>
            </VStack>
          ) : (
            <VStack spacing={6} py={6} textAlign="center">
              <Icon as={FaCheck} w={16} h={16} color="green.500" />
              <Box>
                <Text fontSize="xl" fontWeight="bold" mb={2}>
                  Selesai!
                </Text>
                <Text color="gray.500">
                  Berhasil memproses {selectedTamu.length} tamu.
                </Text>
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          {!isFinished ? (
            <HStack spacing={3}>
              <Button variant="ghost" onClick={handleSkip}>
                Lewati
              </Button>
              <Button
                colorScheme="green"
                leftIcon={<FaWhatsapp />}
                onClick={handleSend}
                width="full"
                h="48px"
                borderRadius="12px"
              >
                Kirim WhatsApp
              </Button>
            </HStack>
          ) : (
            <Button colorScheme="blue" onClick={handleFinish}>
              Tutup
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BatchWhatsappSender;
