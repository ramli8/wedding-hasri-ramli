'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useColorMode,
  Text,
  VStack,
  SimpleGrid,
  Divider,
  Flex,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  PengaturanPernikahan,
  UpdatePengaturanPernikahanInput,
} from '@/modules/admin/pengaturan_pernikahan/types/PengaturanPernikahan.types';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';

interface PengaturanFormProps {
  pengaturan: PengaturanPernikahan | null;
  onSave: (
    data: UpdatePengaturanPernikahanInput
  ) => Promise<PengaturanPernikahan | void>;
  loading?: boolean;
}

// Helper functions
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

const formatDateToTime = (date: Date | null): string => {
  if (!date) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const parseDateString = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;
  return new Date(dateString);
};

const formatDateToString = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

const PengaturanForm: React.FC<PengaturanFormProps> = ({
  pengaturan,
  onSave,
  loading = false,
}) => {
  const { colorMode } = useColorMode();
  const [formData, setFormData] = useState<UpdatePengaturanPernikahanInput>({});
  const [saving, setSaving] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Date states
  const [tanggalAkad, setTanggalAkad] = useState<Date | null>(null);
  const [tanggalResepsi, setTanggalResepsi] = useState<Date | null>(null);
  const [jamMulaiAkad, setJamMulaiAkad] = useState<Date | null>(null);
  const [jamSelesaiAkad, setJamSelesaiAkad] = useState<Date | null>(null);

  useEffect(() => {
    if (pengaturan) {
      setFormData({
        nama_lengkap_pria: pengaturan.nama_lengkap_pria,
        nama_panggilan_pria: pengaturan.nama_panggilan_pria,
        nama_ayah_pria: pengaturan.nama_ayah_pria || '',
        nama_ibu_pria: pengaturan.nama_ibu_pria || '',
        anak_ke_pria: pengaturan.anak_ke_pria || '',
        nama_lengkap_wanita: pengaturan.nama_lengkap_wanita,
        nama_panggilan_wanita: pengaturan.nama_panggilan_wanita,
        nama_ayah_wanita: pengaturan.nama_ayah_wanita || '',
        nama_ibu_wanita: pengaturan.nama_ibu_wanita || '',
        anak_ke_wanita: pengaturan.anak_ke_wanita || '',
        tanggal_akad: pengaturan.tanggal_akad,
        jam_mulai_akad: pengaturan.jam_mulai_akad,
        jam_selesai_akad: pengaturan.jam_selesai_akad || '',
        nama_tempat_akad: pengaturan.nama_tempat_akad,
        alamat_akad: pengaturan.alamat_akad,
        link_maps_akad: pengaturan.link_maps_akad || '',
        tanggal_resepsi: pengaturan.tanggal_resepsi,
        nama_tempat_resepsi: pengaturan.nama_tempat_resepsi,
        alamat_resepsi: pengaturan.alamat_resepsi,
        link_maps_resepsi: pengaturan.link_maps_resepsi || '',
        musik_latar: pengaturan.musik_latar || '',
        link_streaming: pengaturan.link_streaming || '',
        bank_1: pengaturan.bank_1 || '',
        nomor_rekening_1: pengaturan.nomor_rekening_1 || '',
        atas_nama_1: pengaturan.atas_nama_1 || '',
        bank_2: pengaturan.bank_2 || '',
        nomor_rekening_2: pengaturan.nomor_rekening_2 || '',
        atas_nama_2: pengaturan.atas_nama_2 || '',
        text_undangan: pengaturan.text_undangan || '',
        text_pengingat_qr_code: pengaturan.text_pengingat_qr_code || '',
        meta_title: pengaturan.meta_title || '',
        meta_description: pengaturan.meta_description || '',
        og_image: pengaturan.og_image || '',
      });
      setTanggalAkad(parseDateString(pengaturan.tanggal_akad));
      setTanggalResepsi(parseDateString(pengaturan.tanggal_resepsi));
      setJamMulaiAkad(parseTimeToDate(pengaturan.jam_mulai_akad));
      setJamSelesaiAkad(parseTimeToDate(pengaturan.jam_selesai_akad));
    }
  }, [pengaturan]);

  const handleChange = (
    field: keyof UpdatePengaturanPernikahanInput,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...formData,
        tanggal_akad: formatDateToString(tanggalAkad),
        tanggal_resepsi: formatDateToString(tanggalResepsi),
        jam_mulai_akad: formatDateToTime(jamMulaiAkad),
        jam_selesai_akad: formatDateToTime(jamSelesaiAkad),
      });
      showSuccessAlert('Pengaturan berhasil disimpan', colorMode);
    } catch (error: any) {
      showErrorAlert(
        'Gagal menyimpan',
        error.message || 'Terjadi kesalahan',
        colorMode
      );
    } finally {
      setSaving(false);
    }
  };

  // Reusable Save Button component
  const SaveButton = () => (
    <Box pt={6} w={{ base: '100%', md: 'auto' }}>
      <PrimaryButton
        type="submit"
        isLoading={saving}
        borderRadius="xl"
        w="100%"
        px={8}
        h="50px"
      >
        Simpan Pengaturan
      </PrimaryButton>
    </Box>
  );

  const inputStyles = {
    size: 'lg' as const,
    variant: 'filled' as const,
    bg: colorMode === 'light' ? 'gray.50' : 'whiteAlpha.50',
    color: colorMode === 'light' ? 'gray.900' : 'white',
    borderRadius: '16px',
    fontSize: 'sm',
    fontWeight: '500',
    h: '48px',
    border: '1px solid transparent',
    _hover: {
      bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100',
    },
    _focus: {
      bg: colorMode === 'light' ? 'white' : 'whiteAlpha.100',
      borderWidth: '1px',
      borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300',
      boxShadow: 'none',
    },
    _placeholder: {
      color: colorMode === 'light' ? 'gray.400' : 'gray.500',
    },
  };

  const labelStyles = {
    fontSize: 'xs',
    fontWeight: '600',
    color: colorMode === 'light' ? 'gray.500' : 'gray.400',
    mb: 1.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const datePickerStyles = `
    .custom-datepicker-input {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid transparent;
      outline: none;
      background: ${
        colorMode === 'light'
          ? 'var(--chakra-colors-gray-50)'
          : 'var(--chakra-colors-whiteAlpha-50)'
      } !important;
      color: ${
        colorMode === 'light'
          ? 'var(--chakra-colors-gray-900)'
          : 'var(--chakra-colors-white)'
      };
      cursor: pointer;
      transition: all 0.2s;
    }
    .custom-datepicker-input:hover {
      background: ${
        colorMode === 'light'
          ? 'var(--chakra-colors-gray-100)'
          : 'var(--chakra-colors-whiteAlpha-100)'
      } !important;
    }
    .custom-datepicker-input:focus {
      background: ${
        colorMode === 'light'
          ? 'var(--chakra-colors-white)'
          : 'var(--chakra-colors-whiteAlpha-100)'
      } !important;
      border-color: ${
        colorMode === 'light'
          ? 'var(--chakra-colors-blue-500)'
          : 'var(--chakra-colors-blue-300)'
      } !important;
      box-shadow: none;
    }
    .react-datepicker__portal {
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
    }
    .react-datepicker__portal .react-datepicker {
      font-family: inherit;
      border: 1px solid ${
        colorMode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)'
      };
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      background: ${colorMode === 'light' ? 'white' : '#0D0D0D'};
      overflow: hidden;
    }
    .react-datepicker__portal .react-datepicker__header {
      background: ${colorMode === 'light' ? '#F7FAFC' : '#141414'};
      border-bottom: 1px solid ${
        colorMode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)'
      };
      padding: 16px;
      border-radius: 0;
    }
    .react-datepicker__portal .react-datepicker__navigation {
      top: 16px;
    }
    .react-datepicker__portal .react-datepicker__navigation-icon::before {
      border-color: ${colorMode === 'light' ? '#4A5568' : '#A0AEC0'};
    }
    .react-datepicker__portal .react-datepicker__current-month,
    .react-datepicker__portal .react-datepicker__day-name,
    .react-datepicker__portal .react-datepicker-time__header {
      color: ${colorMode === 'light' ? '#1A202C' : 'white'};
      font-weight: 600;
    }
    .react-datepicker__portal .react-datepicker__day {
      color: ${colorMode === 'light' ? '#2D3748' : '#E2E8F0'};
      border-radius: 8px;
    }
    .react-datepicker__portal .react-datepicker__day:hover {
      background: ${
        colorMode === 'light' ? '#EDF2F7' : 'rgba(255, 255, 255, 0.1)'
      };
      border-radius: 8px;
    }
    .react-datepicker__portal .react-datepicker__day--selected,
    .react-datepicker__portal .react-datepicker__day--keyboard-selected {
      background: ${colorMode === 'light' ? '#1A202C' : 'white'} !important;
      color: ${colorMode === 'light' ? 'white' : '#0D0D0D'} !important;
      border-radius: 8px;
      font-weight: 600;
    }
    .react-datepicker__portal .react-datepicker__day--today {
      font-weight: 700;
      color: ${colorMode === 'light' ? '#1A202C' : 'white'};
    }
    .react-datepicker__portal .react-datepicker__day--outside-month {
      color: ${colorMode === 'light' ? '#A0AEC0' : '#4A5568'};
    }
    .react-datepicker__portal .react-datepicker__time-container {
      background: ${colorMode === 'light' ? 'white' : '#0D0D0D'};
      border-left: 1px solid ${
        colorMode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)'
      };
    }
    .react-datepicker__portal .react-datepicker__time-box {
      background: ${colorMode === 'light' ? 'white' : '#0D0D0D'};
    }
    .react-datepicker__portal .react-datepicker__time-list {
      background: ${colorMode === 'light' ? 'white' : '#0D0D0D'};
    }
    .react-datepicker__portal .react-datepicker__time-list-item {
      color: ${colorMode === 'light' ? '#2D3748' : '#E2E8F0'};
      padding: 8px 16px !important;
      height: auto !important;
    }
    .react-datepicker__portal .react-datepicker__time-list-item:hover {
      background: ${
        colorMode === 'light' ? '#EDF2F7' : 'rgba(255, 255, 255, 0.1)'
      } !important;
    }
    .react-datepicker__portal .react-datepicker__time-list-item--selected {
      background: ${colorMode === 'light' ? '#1A202C' : 'white'} !important;
      color: ${colorMode === 'light' ? 'white' : '#1A202C'} !important;
      font-weight: 600;
    }
  `;

  const tabs = [
    { label: 'Mempelai' },
    { label: 'Acara' },
    { label: 'Gift' },
    { label: 'Media' },
    { label: 'WhatsApp' },
    { label: 'SEO' },
  ];

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Memuat data...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!pengaturan) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Text color="gray.500">Data pengaturan tidak ditemukan</Text>
      </Flex>
    );
  }

  return (
    <>
      <style>{datePickerStyles}</style>
      <Box
        as="form"
        onSubmit={handleSubmit}
        pos="relative"
        bg={colorMode === 'light' ? 'white' : 'whiteAlpha.50'}
        borderRadius="24px"
        p={{ base: 4, md: '32px' }}
        borderWidth="1px"
        borderColor={colorMode === 'light' ? 'transparent' : 'whiteAlpha.100'}
        _before={{
          content: '""',
          pos: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          bottom: '-20px',
          zIndex: '-1',
          background: colorMode === 'light' ? '#e3e6ec' : '#000',
          opacity: colorMode === 'light' ? '0.91' : '0.51',
          filter: 'blur(40px)',
          borderRadius: '24px',
          display: { base: 'none', md: 'block' },
        }}
      >
        <Tabs index={tabIndex} onChange={setTabIndex} variant="unstyled" isLazy>
          {/* Tab Header - Pill Style */}
          <Box
            px={{ base: 0, md: 0 }}
            py={4}
            borderBottomWidth="1px"
            borderColor={colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100'}
          >
            <Flex
              gap={1}
              overflowX="auto"
              pb={1}
              sx={{
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
              }}
            >
              {tabs.map((tab, idx) => (
                <Box
                  key={idx}
                  as="button"
                  type="button"
                  onClick={() => setTabIndex(idx)}
                  px={4}
                  py={2}
                  borderRadius="lg"
                  fontWeight="600"
                  fontSize="sm"
                  whiteSpace="nowrap"
                  transition="all 0.2s"
                  bg={
                    tabIndex === idx
                      ? colorMode === 'light'
                        ? 'gray.100'
                        : 'whiteAlpha.100'
                      : 'transparent'
                  }
                  color={
                    tabIndex === idx
                      ? colorMode === 'light'
                        ? 'gray.900'
                        : 'white'
                      : colorMode === 'light'
                      ? 'gray.500'
                      : 'gray.400'
                  }
                  _hover={{
                    bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100',
                    color: colorMode === 'light' ? 'gray.900' : 'white',
                  }}
                >
                  {tab.label}
                </Box>
              ))}
            </Flex>
          </Box>

          {/* Hidden TabList for Chakra Tabs to work */}
          <TabList display="none">
            {tabs.map((tab, idx) => (
              <Tab key={idx}>{tab.label}</Tab>
            ))}
          </TabList>

          {/* Tab Content */}
          <TabPanels>
            {/* Tab 1: Mempelai */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={8} align="stretch">
                {/* Mempelai Pria */}
                <Box>
                  <Text
                    fontWeight="600"
                    fontSize="md"
                    color={colorMode === 'light' ? 'gray.700' : 'white'}
                    mb={4}
                  >
                    Mempelai Pria
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel {...labelStyles}>Nama Lengkap</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_lengkap_pria || ''}
                        onChange={(e) =>
                          handleChange('nama_lengkap_pria', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel {...labelStyles}>Nama Panggilan</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_panggilan_pria || ''}
                        onChange={(e) =>
                          handleChange('nama_panggilan_pria', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Nama Ayah</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_ayah_pria || ''}
                        onChange={(e) =>
                          handleChange('nama_ayah_pria', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Nama Ibu</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_ibu_pria || ''}
                        onChange={(e) =>
                          handleChange('nama_ibu_pria', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Anak Ke-</FormLabel>
                      <Input
                        {...inputStyles}
                        placeholder="Pertama, Kedua, dll"
                        value={formData.anak_ke_pria || ''}
                        onChange={(e) =>
                          handleChange('anak_ke_pria', e.target.value)
                        }
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* Mempelai Wanita */}
                <Box>
                  <Text
                    fontWeight="600"
                    fontSize="md"
                    color={colorMode === 'light' ? 'gray.700' : 'white'}
                    mb={4}
                  >
                    Mempelai Wanita
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel {...labelStyles}>Nama Lengkap</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_lengkap_wanita || ''}
                        onChange={(e) =>
                          handleChange('nama_lengkap_wanita', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel {...labelStyles}>Nama Panggilan</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_panggilan_wanita || ''}
                        onChange={(e) =>
                          handleChange('nama_panggilan_wanita', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Nama Ayah</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_ayah_wanita || ''}
                        onChange={(e) =>
                          handleChange('nama_ayah_wanita', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Nama Ibu</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_ibu_wanita || ''}
                        onChange={(e) =>
                          handleChange('nama_ibu_wanita', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Anak Ke-</FormLabel>
                      <Input
                        {...inputStyles}
                        placeholder="Pertama, Kedua, dll"
                        value={formData.anak_ke_wanita || ''}
                        onChange={(e) =>
                          handleChange('anak_ke_wanita', e.target.value)
                        }
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>
                <SaveButton />
              </VStack>
            </TabPanel>

            {/* Tab 2: Acara */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={8} align="stretch">
                {/* Akad */}
                <Box>
                  <Text
                    fontWeight="600"
                    fontSize="md"
                    color={colorMode === 'light' ? 'gray.700' : 'white'}
                    mb={4}
                  >
                    Acara Akad / Pemberkatan
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel {...labelStyles}>Tanggal</FormLabel>
                      <DatePicker
                        selected={tanggalAkad}
                        onChange={setTanggalAkad}
                        dateFormat="dd MMMM yyyy"
                        placeholderText="Pilih tanggal"
                        withPortal
                        className="custom-datepicker-input"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel {...labelStyles}>Jam Mulai</FormLabel>
                      <DatePicker
                        selected={jamMulaiAkad}
                        onChange={setJamMulaiAkad}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Waktu"
                        dateFormat="HH:mm"
                        timeFormat="HH:mm"
                        placeholderText="Pilih jam"
                        withPortal
                        className="custom-datepicker-input"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Jam Selesai</FormLabel>
                      <DatePicker
                        selected={jamSelesaiAkad}
                        onChange={setJamSelesaiAkad}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Waktu"
                        dateFormat="HH:mm"
                        timeFormat="HH:mm"
                        placeholderText="Pilih jam"
                        withPortal
                        className="custom-datepicker-input"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel {...labelStyles}>Nama Tempat</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_tempat_akad || ''}
                        onChange={(e) =>
                          handleChange('nama_tempat_akad', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl isRequired gridColumn={{ md: 'span 2' }}>
                      <FormLabel {...labelStyles}>Alamat</FormLabel>
                      <Textarea
                        {...inputStyles}
                        height="auto"
                        rows={3}
                        value={formData.alamat_akad || ''}
                        onChange={(e) =>
                          handleChange('alamat_akad', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl gridColumn={{ md: 'span 3' }}>
                      <FormLabel {...labelStyles}>Link Google Maps</FormLabel>
                      <Input
                        {...inputStyles}
                        placeholder="https://maps.google.com/..."
                        value={formData.link_maps_akad || ''}
                        onChange={(e) =>
                          handleChange('link_maps_akad', e.target.value)
                        }
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* Resepsi */}
                <Box>
                  <Text
                    fontWeight="600"
                    fontSize="md"
                    color={colorMode === 'light' ? 'gray.700' : 'white'}
                    mb={4}
                  >
                    Acara Resepsi
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl isRequired>
                      <FormLabel {...labelStyles}>Tanggal</FormLabel>
                      <DatePicker
                        selected={tanggalResepsi}
                        onChange={setTanggalResepsi}
                        dateFormat="dd MMMM yyyy"
                        placeholderText="Pilih tanggal"
                        withPortal
                        className="custom-datepicker-input"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel {...labelStyles}>Nama Tempat</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nama_tempat_resepsi || ''}
                        onChange={(e) =>
                          handleChange('nama_tempat_resepsi', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl isRequired gridColumn={{ md: 'span 2' }}>
                      <FormLabel {...labelStyles}>Alamat</FormLabel>
                      <Textarea
                        {...inputStyles}
                        height="auto"
                        rows={3}
                        value={formData.alamat_resepsi || ''}
                        onChange={(e) =>
                          handleChange('alamat_resepsi', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl gridColumn={{ md: 'span 3' }}>
                      <FormLabel {...labelStyles}>Link Google Maps</FormLabel>
                      <Input
                        {...inputStyles}
                        placeholder="https://maps.google.com/..."
                        value={formData.link_maps_resepsi || ''}
                        onChange={(e) =>
                          handleChange('link_maps_resepsi', e.target.value)
                        }
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>
                <SaveButton />
              </VStack>
            </TabPanel>

            {/* Tab 3: Gift */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={8} align="stretch">
                <Box>
                  <Text
                    fontWeight="600"
                    fontSize="md"
                    color={colorMode === 'light' ? 'gray.700' : 'white'}
                    mb={4}
                  >
                    Rekening Bank 1
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel {...labelStyles}>Nama Bank</FormLabel>
                      <Input
                        {...inputStyles}
                        placeholder="BCA, Mandiri, BNI"
                        value={formData.bank_1 || ''}
                        onChange={(e) => handleChange('bank_1', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Nomor Rekening</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nomor_rekening_1 || ''}
                        onChange={(e) =>
                          handleChange('nomor_rekening_1', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Atas Nama</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.atas_nama_1 || ''}
                        onChange={(e) =>
                          handleChange('atas_nama_1', e.target.value)
                        }
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                <Divider />

                <Box>
                  <Text
                    fontWeight="600"
                    fontSize="md"
                    color={colorMode === 'light' ? 'gray.700' : 'white'}
                    mb={4}
                  >
                    Rekening Bank 2 (Opsional)
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel {...labelStyles}>Nama Bank</FormLabel>
                      <Input
                        {...inputStyles}
                        placeholder="BCA, Mandiri, BNI"
                        value={formData.bank_2 || ''}
                        onChange={(e) => handleChange('bank_2', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Nomor Rekening</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.nomor_rekening_2 || ''}
                        onChange={(e) =>
                          handleChange('nomor_rekening_2', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel {...labelStyles}>Atas Nama</FormLabel>
                      <Input
                        {...inputStyles}
                        value={formData.atas_nama_2 || ''}
                        onChange={(e) =>
                          handleChange('atas_nama_2', e.target.value)
                        }
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>
                <SaveButton />
              </VStack>
            </TabPanel>

            {/* Tab 4: Media */}
            <TabPanel p={0} pt={6}>
              <Box>
                <Text
                  fontWeight="600"
                  fontSize="md"
                  color={colorMode === 'light' ? 'gray.700' : 'white'}
                  mb={4}
                >
                  Media & Streaming
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel {...labelStyles}>Musik Latar</FormLabel>
                    <Input
                      {...inputStyles}
                      placeholder="/audio/wedding-music.mp3"
                      value={formData.musik_latar || ''}
                      onChange={(e) =>
                        handleChange('musik_latar', e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyles}>Link Live Streaming</FormLabel>
                    <Input
                      {...inputStyles}
                      placeholder="https://youtube.com/live/..."
                      value={formData.link_streaming || ''}
                      onChange={(e) =>
                        handleChange('link_streaming', e.target.value)
                      }
                    />
                  </FormControl>
                </SimpleGrid>
                <SaveButton />
              </Box>
            </TabPanel>

            {/* Tab 5: WhatsApp Template */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text
                    fontWeight="600"
                    fontSize="md"
                    color={colorMode === 'light' ? 'gray.700' : 'white'}
                    mb={2}
                  >
                    Template Undangan
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    Template pesan untuk mengundang tamu. Gunakan variabel:{' '}
                    {'{{nama_tamu}}'}, {'{{link_undangan}}'}, {'{{nama_pria}}'},{' '}
                    {'{{nama_wanita}}'}
                  </Text>
                  <Textarea
                    {...inputStyles}
                    height="auto"
                    rows={20}
                    placeholder="Masukkan template pesan undangan..."
                    value={formData.text_undangan || ''}
                    onChange={(e) =>
                      handleChange('text_undangan', e.target.value)
                    }
                  />
                </Box>

                <Divider />

                <Box>
                  <Text
                    fontWeight="600"
                    fontSize="md"
                    color={colorMode === 'light' ? 'gray.700' : 'white'}
                    mb={2}
                  >
                    Template Pengingat QR Code
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    Template pesan pengingat dengan QR Code. Gunakan variabel:{' '}
                    {'{{nama_tamu}}'}, {'{{link_qr_code}}'}, {'{{nama_pria}}'},{' '}
                    {'{{nama_wanita}}'}
                  </Text>
                  <Textarea
                    {...inputStyles}
                    height="auto"
                    rows={15}
                    placeholder="Masukkan template pesan pengingat QR Code..."
                    value={formData.text_pengingat_qr_code || ''}
                    onChange={(e) =>
                      handleChange('text_pengingat_qr_code', e.target.value)
                    }
                  />
                </Box>

                <SaveButton />
              </VStack>
            </TabPanel>

            {/* Tab 6: SEO */}
            <TabPanel p={0} pt={6}>
              <Box>
                <Text
                  fontWeight="600"
                  fontSize="md"
                  color={colorMode === 'light' ? 'gray.700' : 'white'}
                  mb={4}
                >
                  SEO & Meta Tags
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel {...labelStyles}>Meta Title</FormLabel>
                    <Input
                      {...inputStyles}
                      placeholder="Pernikahan Hasri & Ramli"
                      value={formData.meta_title || ''}
                      onChange={(e) =>
                        handleChange('meta_title', e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel {...labelStyles}>OG Image URL</FormLabel>
                    <Input
                      {...inputStyles}
                      placeholder="/images/og-image.jpg"
                      value={formData.og_image || ''}
                      onChange={(e) => handleChange('og_image', e.target.value)}
                    />
                  </FormControl>
                  <FormControl gridColumn={{ md: 'span 2' }}>
                    <FormLabel {...labelStyles}>Meta Description</FormLabel>
                    <Textarea
                      {...inputStyles}
                      height="auto"
                      rows={3}
                      placeholder="Deskripsi singkat untuk sharing di sosial media"
                      value={formData.meta_description || ''}
                      onChange={(e) =>
                        handleChange('meta_description', e.target.value)
                      }
                    />
                  </FormControl>
                </SimpleGrid>

                <SaveButton />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </>
  );
};

export default PengaturanForm;
