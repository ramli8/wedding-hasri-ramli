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
  Badge,
  HStack,
  VStack,
  Box,
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
  onQRCodeClick,
}) => {
  if (!tamu) {
    return null;
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'akan_hadir':
        return <Badge colorScheme="green">Akan Hadir</Badge>;
      case 'tidak_hadir':
        return <Badge colorScheme="red">Tidak Hadir</Badge>;
      case 'belum_konfirmasi':
        return <Badge colorScheme="yellow">Belum Konfirmasi</Badge>;
      case 'dikirim':
        return <Badge colorScheme="blue">Dikirim</Badge>;
      case 'belum_dikirim':
        return <Badge colorScheme="gray">Belum Dikirim</Badge>;
      case 'kadaluarsa':
        return <Badge colorScheme="orange">Kadaluarsa</Badge>;
      default:
        return <Badge colorScheme="gray">{status}</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detail Tamu: {tamu.nama}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={8} align="stretch">
            <Card>
              <CardHeader pb={2}>
                <Heading size="md">Informasi Dasar</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Nama:</Text>
                    <Text>{tamu.nama}</Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Kategori:</Text>
                    <Badge colorScheme="teal">{tamu.kategori}</Badge>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Hubungan:</Text>
                    <Text>{tamu.hubungan}</Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Alamat:</Text>
                    <Text textAlign="right" maxW="300px">
                      {tamu.alamat}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">No. HP:</Text>
                    <HStack>
                      <Icon viewBox="0 0 24 24" width="20px" height="20px">
                        <path
                          fill="currentColor"
                          d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"
                        />
                      </Icon>
                      <Text>{tamu.nomor_hp}</Text>
                    </HStack>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader pb={2}>
                <Heading size="md">Status</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Status Undangan:</Text>
                    <Box>{renderStatusBadge(tamu.status_undangan)}</Box>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Konfirmasi Kehadiran:</Text>
                    <Box>
                      {renderStatusBadge(tamu.konfirmasi_kehadiran)}
                    </Box>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Tanggal Kirim Undangan:</Text>
                    <Text>
                      {tamu.tgl_kirim_undangan
                        ? new Date(
                            tamu.tgl_kirim_undangan
                          ).toLocaleDateString('id-ID')
                        : 'Belum dikirim'}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Tanggal Baca Undangan:</Text>
                    <Text>
                      {tamu.tgl_baca_undangan
                        ? new Date(
                            tamu.tgl_baca_undangan
                          ).toLocaleDateString('id-ID')
                        : 'Belum dibaca'}
                    </Text>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader pb={2}>
                <Heading size="md">Waktu Acara & Kehadiran</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Mulai Resepsi:</Text>
                    <Text>
                      {tamu.tgl_mulai_resepsi
                        ? new Date(tamu.tgl_mulai_resepsi).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: false
                          })
                        : 'Belum diatur'}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Akhir Resepsi:</Text>
                    <Text>
                      {tamu.tgl_akhir_resepsi
                        ? new Date(tamu.tgl_akhir_resepsi).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: false
                          })
                        : 'Belum diatur'}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Check-in:</Text>
                    <Text>
                      {tamu.check_in
                        ? new Date(tamu.check_in).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: false
                          })
                        : 'Belum check-in'}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold" minW="180px">Check-out:</Text>
                    <Text>
                      {tamu.check_out
                        ? new Date(tamu.check_out).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: false
                          })
                        : 'Belum check-out'}
                    </Text>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TamuDetail;
