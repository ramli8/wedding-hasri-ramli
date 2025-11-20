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
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Heading,
  Text,
  Box,
  HStack,
  IconButton,
  useToast,
  Icon
} from '@chakra-ui/react';
import QRCode from 'qrcode.react';
import { Tamu } from '../../types/Tamu.types';

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  tamu?: Tamu;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  isOpen, 
  onClose, 
  tamu 
}) => {
  const toast = useToast();
  
  if (!tamu) {
    return null;
  }

  const qrData = `${window.location.origin}/admin/tamu/${tamu.id}`;
  
  const handleDownloadQR = () => {
    // Find the wrapper element that contains the QR code
    const wrapper = document.getElementById(`qr-code-${tamu.id}`);
    if (wrapper) {
      // Get the actual QR code SVG element inside the wrapper
      const qrCodeElement = wrapper.querySelector('canvas, svg');
      if (qrCodeElement) {
        let elementData;
        if (qrCodeElement.tagName.toLowerCase() === 'svg') {
          elementData = new XMLSerializer().serializeToString(qrCodeElement);
        } else {
          // For canvas, we might need to handle differently
          const canvas = qrCodeElement as HTMLCanvasElement;
          const dataURL = canvas.toDataURL('image/png');

          // Create a temporary link to download the image
          const link = document.createElement('a');
          link.download = `qr-code-${tamu.nama}.png`;
          link.href = dataURL;
          link.click();

          toast({
            title: 'QR Code berhasil diunduh',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const link = document.createElement('a');
          link.download = `qr-code-${tamu.nama}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();

          toast({
            title: 'QR Code berhasil diunduh',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(elementData);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrData);
    toast({
      title: 'Link berhasil disalin',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>QR Code untuk {tamu.nama}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Card>
            <CardHeader>
              <Heading size="md">Kartu QR Code</Heading>
            </CardHeader>
            <CardBody>
              <Flex direction="column" align="center" textAlign="center">
                <Box
                  id={`qr-code-${tamu.id}`}
                  bg="white"
                  p={4}
                  borderRadius="md"
                  boxShadow="md"
                  mb={4}
                >
                  <QRCode
                    value={tamu.qr_code}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </Box>
                <Text fontWeight="bold" fontSize="lg">{tamu.nama}</Text>
                <Text color="gray.600" fontSize="sm">ID: {tamu.id}</Text>
                <Text color="gray.500" mt={2}>{qrData}</Text>
              </Flex>
            </CardBody>
            <CardFooter>
              <HStack spacing={4}>
                <Button
                  colorScheme="teal"
                  variant="outline"
                  onClick={handleDownloadQR}
                  leftIcon={
                    <Icon viewBox="0 0 24 24" width="20px" height="20px">
                      <path
                        fill="currentColor"
                        d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"
                      />
                    </Icon>
                  }
                >
                  Unduh QR Code
                </Button>
                <Button
                  colorScheme="blue"
                  variant="outline"
                  onClick={handleCopyLink}
                  leftIcon={
                    <Icon viewBox="0 0 24 24" width="20px" height="20px">
                      <path
                        fill="currentColor"
                        d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"
                      />
                    </Icon>
                  }
                >
                  Salin Link
                </Button>
              </HStack>
            </CardFooter>
          </Card>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="teal" mr={3} onClick={onClose}>
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
 );
};

export default QRCodeGenerator;