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
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Box,
  Grid,
  useColorModeValue,
  Divider,
  Avatar,
  Icon,
} from '@chakra-ui/react';
import { Tamu } from '../../types/Tamu.types';

interface TamuDetailProps {
  isOpen: boolean;
  onClose: () => void;
  tamu?: Tamu;
  onEdit: (tamu: Tamu) => void;
  onQRCodeClick: (tamu: Tamu) => void;
}

const TamuDetail: React.FC<TamuDetailProps> = ({
  isOpen,
  onClose,
  tamu,
  onEdit,
}) => {
  // Hooks must be called unconditionally at the top level
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.900', 'white');
  const sectionBg = useColorModeValue('gray.50', 'gray.800');
  const avatarBg = useColorModeValue('gray.900', 'white');
  const avatarColor = useColorModeValue('white', 'gray.900');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const modalBg = useColorModeValue('white', 'gray.900');

  if (!tamu) {
    return null;
  }

  const renderStatusBadge = (status: string) => {
    let colorScheme = 'gray';
    let label = status;

    switch (status) {
      case 'akan_hadir':
        colorScheme = 'green';
        label = 'Akan Hadir';
        break;
      case 'tidak_hadir':
        colorScheme = 'red';
        label = 'Tidak Hadir';
        break;
      case 'belum_konfirmasi':
        colorScheme = 'yellow';
        label = 'Belum Konfirmasi';
        break;
      case 'dikirim':
        colorScheme = 'blue';
        label = 'Dikirim';
        break;
      case 'belum_dikirim':
        colorScheme = 'gray';
        label = 'Belum Dikirim';
        break;
      case 'kadaluarsa':
        colorScheme = 'orange';
        label = 'Kadaluarsa';
        break;
    }

    return (
      <Badge
        colorScheme={colorScheme}
        variant="subtle"
        px={2}
        py={0.5}
        borderRadius="full"
        textTransform="capitalize"
      >
        {label}
      </Badge>
    );
  };

  const InfoItem = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="600"
        color={labelColor}
        textTransform="uppercase"
        letterSpacing="wider"
        mb={1}
      >
        {label}
      </Text>
      <Text
        fontSize="sm"
        fontWeight="500"
        color={valueColor}
        lineHeight="short"
      >
        {value}
      </Text>
    </Box>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent borderRadius="xl" overflow="hidden" bg={modalBg}>
        {/* Modern Header with Background */}
        <Box
          bg={sectionBg}
          px={6}
          py={8}
          borderBottom="1px solid"
          borderColor={borderColor}
          position="relative"
        >
          <ModalCloseButton position="absolute" top={4} right={4} />
          <HStack spacing={5} align="center">
            <Avatar
              size="lg"
              name={tamu.nama}
              bg={avatarBg}
              color={avatarColor}
              boxShadow="md"
            />
            <Box>
              <Heading size="md" mb={1} letterSpacing="-0.5px">
                {tamu.nama}
              </Heading>
              <HStack spacing={2} wrap="wrap">
                <Badge
                  colorScheme="purple"
                  variant="solid"
                  px={2}
                  borderRadius="full"
                  fontSize="xs"
                >
                  {tamu.kategori}
                </Badge>
                <Text fontSize="sm" color={subTextColor} fontWeight="500">
                  • {tamu.hubungan}
                </Text>
              </HStack>
            </Box>
          </HStack>
        </Box>

        <ModalBody p={0}>
          <VStack
            divider={<Divider borderColor={borderColor} />}
            spacing={0}
            align="stretch"
          >
            {/* Contact Info */}
            <Box p={6}>
              <Grid
                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                gap={6}
              >
                <InfoItem label="Nomor HP" value={tamu.nomor_hp || '-'} />
                <InfoItem label="Alamat" value={tamu.alamat || '-'} />
              </Grid>
            </Box>

            {/* Status Section */}
            <Box p={6} bg={sectionBg}>
              <Text fontSize="sm" fontWeight="bold" mb={4} color={valueColor}>
                Status & Undangan
              </Text>
              <Grid
                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                gap={6}
              >
                <InfoItem
                  label="Status Undangan"
                  value={renderStatusBadge(tamu.status_undangan)}
                />
                <InfoItem
                  label="Konfirmasi"
                  value={renderStatusBadge(tamu.konfirmasi_kehadiran)}
                />
                <InfoItem
                  label="Dikirim Pada"
                  value={
                    tamu.tgl_kirim_undangan
                      ? new Date(tamu.tgl_kirim_undangan).toLocaleDateString(
                          'id-ID',
                          { day: 'numeric', month: 'long', year: 'numeric' }
                        )
                      : '-'
                  }
                />
                <InfoItem
                  label="Dibaca Pada"
                  value={
                    tamu.tgl_baca_undangan
                      ? new Date(tamu.tgl_baca_undangan).toLocaleDateString(
                          'id-ID',
                          { day: 'numeric', month: 'long', year: 'numeric' }
                        )
                      : '-'
                  }
                />
              </Grid>
            </Box>

            {/* Event Info */}
            <Box p={6}>
              <Text fontSize="sm" fontWeight="bold" mb={4} color={valueColor}>
                Kehadiran Event
              </Text>
              <Grid
                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                gap={6}
              >
                <InfoItem
                  label="Check-in"
                  value={
                    tamu.check_in
                      ? new Date(tamu.check_in).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'
                  }
                />
                <InfoItem
                  label="Check-out"
                  value={
                    tamu.check_out
                      ? new Date(tamu.check_out).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'
                  }
                />
              </Grid>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter
          bg={sectionBg}
          borderTop="1px solid"
          borderColor={borderColor}
          py={3}
        >
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

export default TamuDetail;
