import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Flex,
  Text,
  Box,
  VStack,
  HStack,
  Icon,
  useColorMode,
  useColorModeValue,
  useClipboard,
  Divider,
} from '@chakra-ui/react';
import QRCode from 'qrcode.react';
import { Tamu } from '../../types/Tamu.types';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  tamu?: Tamu;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  isOpen,
  onClose,
  tamu,
}) => {
  const { colorMode } = useColorMode();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.900');
  const qrContainerBg = useColorModeValue('white', 'white'); // QR always on white
  const footerBg = useColorModeValue('gray.50', 'gray.800');
  const codeColor = useColorModeValue('gray.500', 'gray.400');
  const nameColor = useColorModeValue('gray.900', 'white');
  const linkBg = useColorModeValue('gray.50', 'gray.700');

  // Hooks invoked unconditionally
  const invitationUrl =
    typeof window !== 'undefined' && tamu
      ? `${window.location.origin}/?to=${tamu.id}`
      : `http://localhost:3000/?to=${tamu?.id || ''}`;

  const { hasCopied, onCopy } = useClipboard(invitationUrl);

  if (!tamu) {
    return null;
  }

  const handleCopyLink = () => {
    onCopy();
    MySwal.fire({
      title: 'Tersalin!',
      text: 'Link undangan berhasil disalin ke clipboard',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      position: 'center',
      background: colorMode === 'light' ? '#fff' : '#1A202C',
      color: colorMode === 'light' ? '#1A202C' : '#fff',
      customClass: {
        container: 'swal-high-z-index',
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent
        bg={modalBg}
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="xl"
      >
        <ModalHeader
          fontSize="md"
          fontWeight="600"
          textAlign="center"
          pt={6}
          pb={0}
        >
          QR Code Personal
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody py={6}>
          <VStack spacing={6}>
            {/* QR Code Container */}
            <Box
              bg={qrContainerBg}
              p={4}
              borderRadius="xl"
              border="1px solid"
              borderColor={useColorModeValue('gray.100', 'gray.600')}
            >
              <QRCode
                value={tamu.qr_code}
                size={180}
                level="H"
                includeMargin={false}
              />
            </Box>

            <VStack spacing={1}>
              <Text fontWeight="700" fontSize="lg" color={nameColor}>
                {tamu.nama}
              </Text>
              <Text fontSize="sm" fontFamily="mono" color={codeColor}>
                {tamu.qr_code}
              </Text>
            </VStack>

            <Divider borderColor={borderColor} />

            {/* Link Copy Section */}
            <Box w="full">
              <Text
                fontSize="xs"
                fontWeight="600"
                color="gray.500"
                mb={2}
                textTransform="uppercase"
              >
                Link Undangan
              </Text>
              <HStack
                bg={linkBg}
                p={2}
                pl={3}
                borderRadius="lg"
                border="1px solid"
                borderColor={borderColor}
              >
                <Text fontSize="xs" color="gray.500" noOfLines={1} flex={1}>
                  {invitationUrl}
                </Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={handleCopyLink}
                  borderRadius="md"
                  fontSize="xs"
                  px={4}
                >
                  {hasCopied ? 'Tersalin' : 'Salin'}
                </Button>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter bg={footerBg} py={3}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            w="full"
            color="gray.500"
          >
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QRCodeGenerator;
