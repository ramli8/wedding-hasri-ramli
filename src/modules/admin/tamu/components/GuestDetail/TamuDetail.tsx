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
import QRCode from 'qrcode.react';

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
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Card>
              <CardHeader>
                <Heading size="md">Informasi Dasar</Heading>
              </CardHeader>
              <CardBody>
                <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                  <Box flex={1}>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Nama:</Text>
                        <Text>{tamu.nama}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Kategori:</Text>
                        <Badge colorScheme="teal">{tamu.kategori}</Badge>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Hubungan:</Text>
                        <Text>{tamu.hubungan}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Alamat:</Text>
                        <Text isTruncated maxW="300px">
                          {tamu.alamat}
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">No. HP:</Text>
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
                  </Box>
                  <Box flex={1}>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Status Undangan:</Text>
                        <Box>{renderStatusBadge(tamu.status_undangan)}</Box>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Konfirmasi Kehadiran:</Text>
                        <Box>
                          {renderStatusBadge(tamu.konfirmasi_kehadiran)}
                        </Box>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Tanggal Kirim Undangan:</Text>
                        <HStack>
                          <Icon viewBox="0 0 24 24" width="20px" height="20px">
                            <path
                              fill="currentColor"
                              d="M19,4H17V3H15V4H9V3H7V4H5C3.89,4 3,4.89 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20M19,8H5V6H19V8Z"
                            />
                          </Icon>
                          <Text>
                            {tamu.tgl_kirim_undangan
                              ? new Date(
                                  tamu.tgl_kirim_undangan
                                ).toLocaleDateString()
                              : 'Belum dikirim'}
                          </Text>
                        </HStack>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Tanggal Baca Undangan:</Text>
                        <HStack>
                          <Icon viewBox="0 0 24 24" width="20px" height="20px">
                            <path
                              fill="currentColor"
                              d="M19,4H17V3H15V4H9V3H7V4H5C3.89,4 3,4.89 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20M19,8H5V6H19V8Z"
                            />
                          </Icon>
                          <Text>
                            {tamu.tgl_baca_undangan
                              ? new Date(
                                  tamu.tgl_baca_undangan
                                ).toLocaleDateString()
                              : 'Belum dibaca'}
                          </Text>
                        </HStack>
                      </Flex>
                    </VStack>
                  </Box>
                </Flex>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">Waktu Acara</Heading>
              </CardHeader>
              <CardBody>
                <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
                  <VStack align="stretch" spacing={3} flex={1}>
                    <Flex justify="space-between">
                      <Text fontWeight="bold">Tanggal Mulai Resepsi:</Text>
                      <HStack>
                        <Icon viewBox="0 0 24 24" width="20px" height="20px">
                          <path
                            fill="currentColor"
                            d="M19,4H17V3H15V4H9V3H7V4H5C3.89,4 3,4.89 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20M19,8H5V6H19V8Z"
                          />
                        </Icon>
                        <Text>
                          {tamu.tgl_mulai_resepsi
                            ? new Date(tamu.tgl_mulai_resepsi).toLocaleString()
                            : 'Belum diatur'}
                        </Text>
                      </HStack>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="bold">Tanggal Akhir Resepsi:</Text>
                      <HStack>
                        <Icon viewBox="0 0 24 24" width="20px" height="20px">
                          <path
                            fill="currentColor"
                            d="M19,4H17V3H15V4H9V3H7V4H5C3.89,4 3,4.89 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20M19,8H5V6H19V8Z"
                          />
                        </Icon>
                        <Text>
                          {tamu.tgl_akhir_resepsi
                            ? new Date(tamu.tgl_akhir_resepsi).toLocaleString()
                            : 'Belum diatur'}
                        </Text>
                      </HStack>
                    </Flex>
                  </VStack>
                  <VStack align="stretch" spacing={3} flex={1}>
                    <Flex justify="space-between">
                      <Text fontWeight="bold">Check-in:</Text>
                      <HStack>
                        <Icon viewBox="0 0 24 24" width="20px" height="20px">
                          <path
                            fill="currentColor"
                            d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"
                          />
                        </Icon>
                        <Text>
                          {tamu.check_in
                            ? new Date(tamu.check_in).toLocaleTimeString()
                            : 'Belum check-in'}
                        </Text>
                      </HStack>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="bold">Check-out:</Text>
                      <HStack>
                        <Icon viewBox="0 0 24 24" width="20px" height="20px">
                          <path
                            fill="currentColor"
                            d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"
                          />
                        </Icon>
                        <Text>
                          {tamu.check_out
                            ? new Date(tamu.check_out).toLocaleTimeString()
                            : 'Belum check-out'}
                        </Text>
                      </HStack>
                    </Flex>
                  </VStack>
                </Flex>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">QR Code</Heading>
              </CardHeader>
              <CardBody>
                <Flex justify="center" align="center">
                  <Box bg="white" p={4} borderRadius="md" boxShadow="md">
                    <QRCode
                      value={tamu.qr_code}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </Box>
                </Flex>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button colorScheme="teal" onClick={() => onEdit(tamu)}>
              Edit Tamu
            </Button>
            <Button colorScheme="blue" onClick={() => onQRCodeClick(tamu)}>
              Generate QR Code
            </Button>
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TamuDetail;
