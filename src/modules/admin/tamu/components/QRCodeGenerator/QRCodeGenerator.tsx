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
  Divider,
  useColorMode,
  useClipboard,
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
  tamu 
}) => {
  const { colorMode } = useColorMode();
  
  // Hooks must be called before any conditional returns
  const invitationUrl = typeof window !== 'undefined' && tamu
    ? `${window.location.origin}/?to=${tamu.id}` 
    : `http://localhost:3000/?to=${tamu?.id || ''}`;
  
  const { hasCopied, onCopy } = useClipboard(invitationUrl);
  
  if (!tamu) {
    return null;
  }

  const handleCopyLink = () => {
    onCopy();
    MySwal.fire({
      title: 'Berhasil!',
      text: 'Link undangan berhasil disalin',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: colorMode === 'light' ? '#fff' : '#1A202C',
      color: colorMode === 'light' ? '#1A202C' : '#fff',
      customClass: {
        container: 'swal-high-z-index'
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent 
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius={{ base: 0, md: 'xl' }}
        mx={{ base: 0, md: 4 }}
      >
        <ModalHeader 
          fontSize={{ base: 'lg', md: 'xl' }}
          fontWeight="600"
          pb={2}
          borderBottom="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
        >
          QR Code Undangan
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody py={8}>
          <VStack spacing={6} align="stretch">
            {/* QR Code Display */}
            <Flex direction="column" align="center">
              <Box
                id={`qr-code-${tamu.id}`}
                bg="white"
                p={6}
                borderRadius="lg"
                boxShadow="sm"
                border="1px solid"
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
              >
                <QRCode
                  value={tamu.qr_code}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </Box>
              
              <VStack spacing={2} mt={4} align="center">
                <Text 
                  fontWeight="600" 
                  fontSize="lg"
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                >
                  {tamu.nama}
                </Text>
                <Text 
                  fontSize="sm" 
                  color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                  fontFamily="mono"
                >
                  {tamu.qr_code}
                </Text>
              </VStack>
            </Flex>

            <Divider />

            {/* Invitation URL */}
            <VStack spacing={3} align="stretch">
              <Text 
                fontSize="sm" 
                fontWeight="600"
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
              >
                Link Undangan
              </Text>
              <Box
                p={3}
                bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                borderRadius="md"
                border="1px solid"
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
                fontSize="sm"
                fontFamily="mono"
                wordBreak="break-all"
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
              >
                {invitationUrl}
              </Box>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter 
          borderTop="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
          pt={4}
        >
          <HStack spacing={3} width="full" justify="flex-end">
            <Button
              colorScheme="blue"
              onClick={handleCopyLink}
              size="md"
              leftIcon={
                <Icon viewBox="0 0 24 24" width="18px" height="18px">
                  <path
                    fill="currentColor"
                    d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"
                  />
                </Icon>
              }
            >
              {hasCopied ? 'Tersalin!' : 'Salin Link'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
 );
};

export default QRCodeGenerator;