'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useColorMode,
  ModalFooter,
  Text,
  Badge,
  VStack,
  HStack,
} from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  KategoriTamu,
  CreateKategoriTamuInput,
  UpdateKategoriTamuInput,
} from '@/modules/admin/kategori_tamu/types/KategoriTamu.types';
import {
  PrimaryButton,
  PrimaryOutlineButton,
} from '@/components/atoms/Buttons/PrimaryButton';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';

interface KategoriFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  kategori?: KategoriTamu;
  onSave: (
    data: CreateKategoriTamuInput | UpdateKategoriTamuInput
  ) => Promise<void>;
}

// Helper function to parse time string (HH:mm or HH:mm:ss) to Date object
const parseTimeToDate = (timeString: string | undefined): Date | null => {
  if (!timeString) return null;
  const parts = timeString.split(':');
  if (parts.length >= 2) {
    const date = new Date();
    date.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    return date;
  }
  return null;
};

// Helper function to format Date to HH:mm string
const formatDateToTime = (date: Date | null): string => {
  if (!date) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const KategoriFormModal: React.FC<KategoriFormModalProps> = ({
  isOpen,
  onClose,
  kategori,
  onSave,
}) => {
  const { colorMode } = useColorMode();
  const [formData, setFormData] = useState<CreateKategoriTamuInput>({
    nama: '',
    jam_mulai: '',
    jam_selesai: '',
  });
  const [jamMulaiDate, setJamMulaiDate] = useState<Date | null>(null);
  const [jamSelesaiDate, setJamSelesaiDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const isEdit = !!kategori;

  const initialRef = React.useRef(null);

  useEffect(() => {
    if (kategori) {
      setFormData({
        nama: kategori.nama,
        jam_mulai: kategori.jam_mulai || '',
        jam_selesai: kategori.jam_selesai || '',
      });
      setJamMulaiDate(parseTimeToDate(kategori.jam_mulai));
      setJamSelesaiDate(parseTimeToDate(kategori.jam_selesai));
    } else {
      setFormData({
        nama: '',
        jam_mulai: '',
        jam_selesai: '',
      });
      setJamMulaiDate(null);
      setJamSelesaiDate(null);
    }
  }, [kategori, isOpen]);

  const handleJamMulaiChange = (date: Date | null) => {
    setJamMulaiDate(date);
    setFormData((prev) => ({
      ...prev,
      jam_mulai: formatDateToTime(date),
    }));
  };

  const handleJamSelesaiChange = (date: Date | null) => {
    setJamSelesaiDate(date);
    setFormData((prev) => ({
      ...prev,
      jam_selesai: formatDateToTime(date),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.jam_mulai || !formData.jam_selesai)
      return;

    setLoading(true);
    try {
      await onSave({
        nama: formData.nama.trim(),
        jam_mulai: formData.jam_mulai,
        jam_selesai: formData.jam_selesai,
      });

      showSuccessAlert(
        isEdit ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan',
        colorMode
      );

      onClose();
    } catch (error: any) {
      showErrorAlert(
        'Gagal menyimpan',
        error.message || 'Terjadi kesalahan',
        colorMode
      );
    } finally {
      setLoading(false);
    }
  };

  // Custom styles for react-datepicker portal mode
  const timePickerStyles = `
    .time-picker-input {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 500;
      border: none;
      outline: none;
      background: ${colorMode === 'light' ? '#F7FAFC' : '#2D3748'};
      color: ${colorMode === 'light' ? '#1A202C' : 'white'};
      transition: all 0.2s;
      cursor: pointer;
    }
    .time-picker-input:hover {
      background: ${colorMode === 'light' ? '#EDF2F7' : '#4A5568'};
    }
    .time-picker-input:focus {
      background: ${colorMode === 'light' ? 'white' : '#1A202C'};
      box-shadow: 0 0 0 2px ${colorMode === 'light' ? '#3182CE' : '#63B3ED'};
    }
    .time-picker-input::placeholder {
      color: ${colorMode === 'light' ? '#A0AEC0' : '#718096'};
    }
    .react-datepicker__portal {
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }
    .react-datepicker__portal .react-datepicker {
      font-family: inherit;
      border: none;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      background: ${colorMode === 'light' ? 'white' : '#2D3748'};
      overflow: hidden;
    }
    .react-datepicker__portal .react-datepicker__header {
      background: ${colorMode === 'light' ? '#F7FAFC' : '#1A202C'};
      border-bottom: 1px solid ${colorMode === 'light' ? '#E2E8F0' : '#4A5568'};
      padding: 16px;
      border-radius: 24px 24px 0 0;
    }
    .react-datepicker__portal .react-datepicker__header--time {
      padding: 16px;
    }
    .react-datepicker__portal .react-datepicker-time__header {
      color: ${colorMode === 'light' ? '#2D3748' : 'white'};
      font-weight: 700;
      font-size: 16px;
    }
    .react-datepicker__portal .react-datepicker__time-container {
      width: 200px;
      border-left: none;
    }
    .react-datepicker__portal .react-datepicker__time {
      background: ${colorMode === 'light' ? 'white' : '#2D3748'};
      border-radius: 0 0 24px 24px;
    }
    .react-datepicker__portal .react-datepicker__time-box {
      width: 100% !important;
    }
    .react-datepicker__portal .react-datepicker__time-list {
      height: 280px !important;
    }
    .react-datepicker__portal .react-datepicker__time-list-item {
      padding: 12px 24px !important;
      font-size: 16px;
      font-weight: 500;
      color: ${colorMode === 'light' ? '#2D3748' : 'white'};
      transition: all 0.15s;
    }
    .react-datepicker__portal .react-datepicker__time-list-item:hover {
      background: ${colorMode === 'light' ? '#EDF2F7' : '#4A5568'} !important;
    }
    .react-datepicker__portal .react-datepicker__time-list-item--selected {
      background: #3182CE !important;
      color: white !important;
      font-weight: 600;
    }
    .react-datepicker__triangle {
      display: none;
    }
  `;

  return (
    <>
      <style>{timePickerStyles}</style>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        scrollBehavior="inside"
        isCentered
        initialFocusRef={isEdit ? undefined : initialRef}
      >
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent
          bg={colorMode === 'light' ? 'white' : 'gray.800'}
          borderRadius="24px"
          mx={4}
          boxShadow="xl"
          p={2}
        >
          <ModalHeader fontSize="xl" fontWeight="700" pt={6} pb={2} px={6}>
            <HStack spacing={3}>
              <Text>{isEdit ? 'Edit Kategori' : 'Tambah Kategori'}</Text>
              {isEdit && (
                <Badge
                  colorScheme="orange"
                  variant="subtle"
                  fontSize="10px"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  fontWeight="800"
                >
                  Edit Mode
                </Badge>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton top={6} right={6} />
          <ModalBody py={6} px={6}>
            <Box as="form" id="kategori-form" onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel
                    fontSize="sm"
                    fontWeight="600"
                    color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                    mb={3}
                  >
                    Nama Kategori
                  </FormLabel>
                  <Input
                    ref={initialRef}
                    value={formData.nama}
                    onChange={(e) =>
                      setFormData({ ...formData, nama: e.target.value })
                    }
                    size="lg"
                    variant="filled"
                    bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                    color={colorMode === 'light' ? 'gray.900' : 'white'}
                    borderRadius="16px"
                    fontSize="md"
                    fontWeight="500"
                    _hover={{
                      bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
                    }}
                    _focus={{
                      bg: colorMode === 'light' ? 'white' : 'gray.800',
                      borderColor:
                        colorMode === 'light' ? 'blue.500' : 'blue.300',
                      boxShadow: 'none',
                    }}
                  />
                </FormControl>

                {/* Time Picker with Portal Mode */}
                <HStack spacing={4} w="full" align="start">
                  <FormControl isRequired>
                    <FormLabel
                      fontSize="sm"
                      fontWeight="600"
                      color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                      mb={3}
                    >
                      Jam Mulai
                    </FormLabel>
                    <DatePicker
                      selected={jamMulaiDate}
                      onChange={handleJamMulaiChange}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Pilih Waktu"
                      dateFormat="HH:mm"
                      timeFormat="HH:mm"
                      placeholderText="Pilih jam mulai"
                      withPortal
                      className="time-picker-input"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel
                      fontSize="sm"
                      fontWeight="600"
                      color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                      mb={3}
                    >
                      Jam Selesai
                    </FormLabel>
                    <DatePicker
                      selected={jamSelesaiDate}
                      onChange={handleJamSelesaiChange}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Pilih Waktu"
                      dateFormat="HH:mm"
                      timeFormat="HH:mm"
                      placeholderText="Pilih jam selesai"
                      withPortal
                      className="time-picker-input"
                    />
                  </FormControl>
                </HStack>
              </VStack>
            </Box>
          </ModalBody>

          <ModalFooter pb={6} px={6} pt={4}>
            <HStack spacing={3} width="full" justify="flex-end">
              <Button
                variant="ghost"
                onClick={onClose}
                isDisabled={loading}
                h="50px"
                borderRadius="16px"
                fontSize="sm"
                fontWeight="600"
                color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                _hover={{
                  bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
                }}
              >
                Batal
              </Button>
              <PrimaryButton
                type="submit"
                form="kategori-form"
                isLoading={loading}
                h="50px"
                px={8}
                borderRadius="16px"
                fontSize="sm"
                fontWeight="600"
              >
                {isEdit ? 'Simpan Perubahan' : 'Tambah Data'}
              </PrimaryButton>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default KategoriFormModal;
