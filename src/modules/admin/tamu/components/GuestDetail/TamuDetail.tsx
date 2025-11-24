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
  Flex,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Box,
  Icon,
  Grid,
  GridItem,
  Stack,
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

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Grid templateColumns={{ base: '1fr', md: '180px 1fr' }} gap={2} alignItems="center">
      <GridItem>
        <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'md' }}>{label}:</Text>
      </GridItem>
      <GridItem>
        <Text fontSize={{ base: 'sm', md: 'md' }} wordBreak="break-word">{value}</Text>
      </GridItem>
    </Grid>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: '2xl' }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent mx={{ base: 0, md: 4 }}>
        <ModalHeader fontSize={{ base: 'lg', md: 'xl' }}>Detail Tamu: {tamu.nama}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Informasi Dasar */}
            <Card>
              <CardHeader pb={2}>
                <Heading size={{ base: 'sm', md: 'md' }}>Informasi Dasar</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <InfoRow label="Nama" value={tamu.nama} />
                  <InfoRow 
                    label="Kategori" 
                    value={<Badge colorScheme="teal">{tamu.kategori}</Badge>} 
                  />
                  <InfoRow label="Hubungan" value={tamu.hubungan} />
                  <InfoRow label="Alamat" value={tamu.alamat} />
                  <InfoRow 
                    label="No. HP" 
                    value={
                      <HStack spacing={2}>
                        <Icon viewBox="0 0 24 24" width="16px" height="16px">
                          <path
                            fill="currentColor"
                            d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"
                          />
                        </Icon>
                        <Text>{tamu.nomor_hp}</Text>
                      </HStack>
                    } 
                  />
                </VStack>
              </CardBody>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader pb={2}>
                <Heading size={{ base: 'sm', md: 'md' }}>Status</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <InfoRow 
                    label="Status Undangan" 
                    value={renderStatusBadge(tamu.status_undangan)} 
                  />
                  <InfoRow 
                    label="Konfirmasi Kehadiran" 
                    value={renderStatusBadge(tamu.konfirmasi_kehadiran)} 
                  />
                  <InfoRow 
                    label="Tgl Kirim Undangan" 
                    value={
                      tamu.tgl_kirim_undangan
                        ? new Date(tamu.tgl_kirim_undangan).toLocaleDateString('id-ID')
                        : 'Belum dikirim'
                    } 
                  />
                  <InfoRow 
                    label="Tgl Baca Undangan" 
                    value={
                      tamu.tgl_baca_undangan
                        ? new Date(tamu.tgl_baca_undangan).toLocaleDateString('id-ID')
                        : 'Belum dibaca'
                    } 
                  />
                </VStack>
              </CardBody>
            </Card>

            {/* Waktu Acara & Kehadiran */}
            <Card>
              <CardHeader pb={2}>
                <Heading size={{ base: 'sm', md: 'md' }}>Waktu Acara & Kehadiran</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <InfoRow 
                    label="Mulai Resepsi" 
                    value={
                      tamu.tgl_mulai_resepsi
                        ? new Date(tamu.tgl_mulai_resepsi).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: false
                          })
                        : 'Belum diatur'
                    } 
                  />
                  <InfoRow 
                    label="Akhir Resepsi" 
                    value={
                      tamu.tgl_akhir_resepsi
                        ? new Date(tamu.tgl_akhir_resepsi).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: false
                          })
                        : 'Belum diatur'
                    } 
                  />
                  <InfoRow 
                    label="Check-in" 
                    value={
                      tamu.check_in
                        ? new Date(tamu.check_in).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: false
                          })
                        : 'Belum check-in'
                    } 
                  />
                  <InfoRow 
                    label="Check-out" 
                    value={
                      tamu.check_out
                        ? new Date(tamu.check_out).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            hour12: false
                          })
                        : 'Belum check-out'
                    } 
                  />
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose} width={{ base: 'full', md: 'auto' }}>
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TamuDetail;
