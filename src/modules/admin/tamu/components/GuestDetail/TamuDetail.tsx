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
  Text,
  Badge,
  HStack,
  VStack,
  Box,
  Grid,
  useColorMode,
  Divider,
  Icon,
  Flex,
} from '@chakra-ui/react';
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi';
import AppSettingContext from '@/providers/AppSettingProvider';
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
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  if (!tamu) {
    return null;
  }

  // Format: Selasa, 16-12-2025 11:23
  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    const days = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];
    const day = days[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}, ${dd}-${mm}-${yyyy} ${hh}:${min}`;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { color: string; label: string; bg: string }
    > = {
      akan_hadir: {
        color: colorMode === 'light' ? 'green.600' : 'green.400',
        label: 'Akan Hadir',
        bg: colorMode === 'light' ? 'green.50' : 'green.900',
      },
      tidak_hadir: {
        color: colorMode === 'light' ? 'red.600' : 'red.400',
        label: 'Tidak Hadir',
        bg: colorMode === 'light' ? 'red.50' : 'red.900',
      },
      belum_konfirmasi: {
        color: colorMode === 'light' ? 'yellow.600' : 'yellow.400',
        label: 'Belum Konfirmasi',
        bg: colorMode === 'light' ? 'yellow.50' : 'yellow.900',
      },
      dikirim: {
        color: colorMode === 'light' ? 'blue.600' : 'blue.400',
        label: 'Dikirim',
        bg: colorMode === 'light' ? 'blue.50' : 'blue.900',
      },
      belum_dikirim: {
        color: colorMode === 'light' ? 'gray.600' : 'gray.400',
        label: 'Belum Dikirim',
        bg: colorMode === 'light' ? 'gray.50' : 'gray.800',
      },
      kadaluarsa: {
        color: colorMode === 'light' ? 'orange.600' : 'orange.400',
        label: 'Kadaluarsa',
        bg: colorMode === 'light' ? 'orange.50' : 'orange.900',
      },
    };

    return (
      configs[status] || {
        color: colorMode === 'light' ? 'gray.600' : 'gray.400',
        label: status,
        bg: colorMode === 'light' ? 'gray.50' : 'gray.800',
      }
    );
  };

  const renderStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    return (
      <Badge
        bg={config.bg}
        color={config.color}
        px={3}
        py={1}
        borderRadius="full"
        fontSize="xs"
        fontWeight="600"
        textTransform="capitalize"
      >
        {config.label}
      </Badge>
    );
  };

  const InfoItem = ({
    icon,
    label,
    value,
  }: {
    icon?: any;
    label: string;
    value: React.ReactNode;
  }) => (
    <Box>
      <HStack spacing={2} mb={2}>
        {icon && (
          <Icon
            as={icon}
            boxSize={4}
            color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
          />
        )}
        <Text
          fontSize="xs"
          fontWeight="600"
          color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {label}
        </Text>
      </HStack>
      <Text
        fontSize="md"
        fontWeight="500"
        color={colorMode === 'light' ? 'gray.900' : 'white'}
        lineHeight="1.5"
      >
        {value || '-'}
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
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius="24px"
        mx={4}
        boxShadow="xl"
        p={2}
      >
        {/* Header */}
        <ModalHeader fontSize="xl" fontWeight="700" pt={6} pb={2} px={6}>
          <HStack spacing={3} justify="space-between">
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <Flex
                  bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
                  color={colorMode === 'light' ? 'blue.600' : 'blue.300'}
                  w="48px"
                  h="48px"
                  borderRadius="16px"
                  align="center"
                  justify="center"
                >
                  <Icon as={FiUser} boxSize={6} />
                </Flex>
                <Box>
                  <Text
                    fontSize="xl"
                    fontWeight="700"
                    color={colorMode === 'light' ? 'gray.900' : 'white'}
                    lineHeight="1.2"
                  >
                    {tamu.nama}
                  </Text>
                  <HStack spacing={2} mt={1}>
                    <Badge
                      bg={colorMode === 'light' ? 'purple.50' : 'purple.900'}
                      color={
                        colorMode === 'light' ? 'purple.600' : 'purple.300'
                      }
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="600"
                    >
                      {tamu.kategori}
                    </Badge>
                    <Text
                      fontSize="sm"
                      color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                      fontWeight="500"
                    >
                      • {tamu.hubungan}
                    </Text>
                  </HStack>
                </Box>
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton top={6} right={6} />

        <ModalBody py={4} px={6}>
          <VStack spacing={6} align="stretch">
            {/* Contact Info */}
            <Box>
              <Grid
                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                gap={6}
              >
                <InfoItem
                  icon={FiPhone}
                  label="Nomor HP"
                  value={tamu.nomor_hp}
                />
                <InfoItem icon={FiMapPin} label="Alamat" value={tamu.alamat} />
              </Grid>
            </Box>

            <Divider
              borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
            />

            {/* Status Section */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="700"
                mb={4}
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Status & Undangan
              </Text>
              <Grid
                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                gap={6}
              >
                <InfoItem
                  icon={FiCheckCircle}
                  label="Status Undangan"
                  value={renderStatusBadge(
                    tamu.tgl_kirim_undangan ? 'dikirim' : 'belum_dikirim'
                  )}
                />
                <InfoItem
                  icon={FiCheckCircle}
                  label="Konfirmasi"
                  value={renderStatusBadge(tamu.konfirmasi_kehadiran)}
                />
                <InfoItem
                  icon={FiCalendar}
                  label="Dikirim Pada"
                  value={formatDateTime(tamu.tgl_kirim_undangan)}
                />
                <InfoItem
                  icon={FiCalendar}
                  label="Dibaca Pada"
                  value={formatDateTime(tamu.tgl_baca_undangan)}
                />
              </Grid>
            </Box>

            <Divider
              borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
            />

            {/* Event Info */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="700"
                mb={4}
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Kehadiran Event
              </Text>
              <Grid
                templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                gap={6}
              >
                <InfoItem
                  icon={FiClock}
                  label="Check-in"
                  value={
                    tamu.check_in
                      ? new Date(tamu.check_in).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : null
                  }
                />
                <InfoItem
                  icon={FiClock}
                  label="Check-out"
                  value={
                    tamu.check_out
                      ? new Date(tamu.check_out).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : null
                  }
                />
              </Grid>
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
            bg={
              colorMode === 'light' ? `${colorPref}.500` : `${colorPref}Dim.500`
            }
            color="white"
            _hover={{
              bg:
                colorMode === 'light'
                  ? `${colorPref}.600`
                  : `${colorPref}Dim.600`,
            }}
            _active={{
              bg:
                colorMode === 'light'
                  ? `${colorPref}.700`
                  : `${colorPref}Dim.700`,
            }}
          >
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TamuDetail;
