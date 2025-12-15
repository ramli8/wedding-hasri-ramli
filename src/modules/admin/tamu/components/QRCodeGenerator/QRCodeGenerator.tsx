import React, { useContext } from 'react';
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
  useClipboard,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { FiLink, FiCheckCircle, FiCopy } from 'react-icons/fi';
import QRCode from 'qrcode.react';
import AppSettingContext from '@/providers/AppSettingProvider';
import { Tamu } from '../../types/Tamu.types';
import { showSuccessAlert } from '@/utils/sweetalert';

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
  const { colorPref } = useContext(AppSettingContext);

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
    showSuccessAlert('Link berhasil disalin!', colorMode);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius="24px"
        mx={4}
        boxShadow="xl"
        p={2}
      >
        <ModalHeader fontSize="xl" fontWeight="700" pt={6} pb={2} px={6}>
          <VStack spacing={2} align="center">
            <Flex
              bg={colorMode === 'light' ? 'purple.50' : 'purple.900'}
              color={colorMode === 'light' ? 'purple.600' : 'purple.300'}
              w="56px"
              h="56px"
              borderRadius="16px"
              align="center"
              justify="center"
            >
              <Box
                as="svg"
                width="32px"
                height="32px"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm-4 0h2v2h-2v-2z"/>
              </Box>
            </Flex>
            <Text fontSize="xl" fontWeight="700" color={colorMode === 'light' ? 'gray.900' : 'white'}>
              QR Code Undangan
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton top={6} right={6} />

        <ModalBody py={6} px={6}>
          <VStack spacing={6} align="stretch">
            {/* Guest Info */}
            <VStack spacing={3} align="center">
              <Text 
                fontWeight="700" 
                fontSize="xl" 
                color={colorMode === 'light' ? 'gray.900' : 'white'}
                textAlign="center"
              >
                {tamu.nama}
              </Text>
              <HStack spacing={2}>
                <Badge
                  bg={colorMode === 'light' ? 'purple.50' : 'purple.900'}
                  color={colorMode === 'light' ? 'purple.600' : 'purple.300'}
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="600"
                >
                  {tamu.kategori}
                </Badge>
                <Badge
                  bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
                  color={colorMode === 'light' ? 'blue.600' : 'blue.300'}
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="600"
                >
                  {tamu.hubungan}
                </Badge>
              </HStack>
            </VStack>

            <Divider borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'} />

            {/* QR Code Container */}
            <Flex justify="center" py={4}>
              <Box
                bg="white"
                p={6}
                borderRadius="20px"
                boxShadow={colorMode === 'light' ? 'lg' : 'dark-lg'}
                border="1px solid"
                borderColor={colorMode === 'light' ? 'gray.100' : 'gray.600'}
              >
                <QRCode
                  value={tamu.qr_code}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </Box>
            </Flex>

            <VStack spacing={1} align="center">
              <Text fontSize="xs" fontWeight="600" color={colorMode === 'light' ? 'gray.500' : 'gray.400'} textTransform="uppercase" letterSpacing="wide">
                Kode Tamu
              </Text>
              <Text fontSize="md" fontFamily="mono" fontWeight="600" color={colorMode === 'light' ? 'gray.900' : 'white'}>
                {tamu.qr_code}
              </Text>
            </VStack>

            <Divider borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'} />

            {/* Link Copy Section */}
            <Box>
              <HStack spacing={2} mb={3}>
                <Icon as={FiLink} boxSize={4} color={colorMode === 'light' ? 'gray.500' : 'gray.400'} />
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Link Undangan
                </Text>
              </HStack>
              <HStack
                bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                p={3}
                borderRadius="12px"
                border="1px solid"
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
                spacing={2}
              >
                <Text 
                  fontSize="sm" 
                  color={colorMode === 'light' ? 'gray.600' : 'gray.300'} 
                  noOfLines={1} 
                  flex={1}
                  fontWeight="500"
                >
                  {invitationUrl}
                </Text>
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  borderRadius="10px"
                  fontSize="xs"
                  fontWeight="600"
                  px={4}
                  h="36px"
                  bg={hasCopied ? (colorMode === 'light' ? 'green.500' : 'green.600') : (colorMode === 'light' ? `${colorPref}.500` : `${colorPref}Dim.500`)}
                  color="white"
                  leftIcon={hasCopied ? <Icon as={FiCheckCircle} /> : <Icon as={FiCopy} />}
                  _hover={{
                    bg: hasCopied ? (colorMode === 'light' ? 'green.600' : 'green.700') : (colorMode === 'light' ? `${colorPref}.600` : `${colorPref}Dim.600`),
                  }}
                  _active={{
                    bg: hasCopied ? (colorMode === 'light' ? 'green.700' : 'green.800') : (colorMode === 'light' ? `${colorPref}.700` : `${colorPref}Dim.700`),
                  }}
                >
                  {hasCopied ? 'Tersalin' : 'Salin'}
                </Button>
              </HStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter pb={6} px={6} pt={4}>
          <Button
            onClick={onClose}
            w="full"
            h="50px"
            borderRadius="16px"
            fontSize="sm"
            fontWeight="600"
            bg={colorMode === 'light' ? `${colorPref}.500` : `${colorPref}Dim.500`}
            color="white"
            _hover={{
              bg: colorMode === 'light' ? `${colorPref}.600` : `${colorPref}Dim.600`,
            }}
            _active={{
              bg: colorMode === 'light' ? `${colorPref}.700` : `${colorPref}Dim.700`,
            }}
          >
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QRCodeGenerator;
