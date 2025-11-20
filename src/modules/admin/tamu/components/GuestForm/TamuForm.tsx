import React, { useState, useEffect, forwardRef } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  HStack,
  Textarea,
  Box,
  useColorMode,
  InputGroup,
  InputRightElement,
  Icon,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Tamu, CreateTamuInput, UpdateTamuInput } from '../../types/Tamu.types';
import { PrimaryButton, PrimaryOutlineButton } from '@/components/atoms/Buttons/PrimaryButton';
import DatePicker, { registerLocale } from 'react-datepicker';
import id from 'date-fns/locale/id';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import 'react-datepicker/dist/react-datepicker.css';
import KategoriTamuAPI from '@/modules/admin/kategori_tamu/services/KategoriTamuAPI';
import HubunganTamuAPI from '@/modules/admin/hubungan_tamu/services/HubunganTamuAPI';
import { KategoriTamu } from '@/modules/admin/kategori_tamu/types/KategoriTamu.types';
import { HubunganTamu } from '@/modules/admin/hubungan_tamu/types/HubunganTamu.types';

// Register locale Indonesia
registerLocale('id', id);

interface TamuFormProps {
  tamu?: Tamu;
  onSave: (data: CreateTamuInput | UpdateTamuInput) => void;
  onCancel: () => void;
}

const TamuForm: React.FC<TamuFormProps> = ({ tamu, onSave, onCancel }) => {
  const { colorMode } = useColorMode();
  
  // State for categories and relationships
  const [categories, setCategories] = useState<KategoriTamu[]>([]);
  const [relationships, setRelationships] = useState<HubunganTamu[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  // Form data state
  const [formData, setFormData] = useState<CreateTamuInput>({
    nama: '',
    kategori_id: '',
    hubungan_id: '',
    alamat: '',
    nomor_hp: '',
    tgl_mulai_resepsi: undefined,
    tgl_akhir_resepsi: undefined,
  });

  // State terpisah untuk DatePicker
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const isEdit = !!tamu;

  // Fetch categories and relationships on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const kategoriAPI = new KategoriTamuAPI();
        const hubunganAPI = new HubunganTamuAPI();
        
        const [kategoriesData, relationshipsData] = await Promise.all([
          kategoriAPI.getAll(),
          hubunganAPI.getAll()
        ]);
        
        setCategories(kategoriesData);
        setRelationships(relationshipsData);
        
        // Set default values if not editing
        if (!tamu && kategoriesData.length > 0 && relationshipsData.length > 0) {
          setFormData(prev => ({
            ...prev,
            kategori_id: kategoriesData[0].id,
            hubungan_id: relationshipsData[0].id,
          }));
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [tamu]);

  useEffect(() => {
    if (tamu) {
      setFormData({
        nama: tamu.nama,
        kategori_id: tamu.kategori_id,
        hubungan_id: tamu.hubungan_id,
        alamat: tamu.alamat || '',
        nomor_hp: tamu.nomor_hp || '',
        tgl_mulai_resepsi: tamu.tgl_mulai_resepsi ? new Date(tamu.tgl_mulai_resepsi) : undefined,
        tgl_akhir_resepsi: tamu.tgl_akhir_resepsi ? new Date(tamu.tgl_akhir_resepsi) : undefined,
      });

      // Set initial date/time states
      if (tamu.tgl_mulai_resepsi) {
        const start = new Date(tamu.tgl_mulai_resepsi);
        setSelectedDate(start);
        setStartTime(start);
      }
      if (tamu.tgl_akhir_resepsi) {
        setEndTime(new Date(tamu.tgl_akhir_resepsi));
      }
    }
  }, [tamu]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.nomor_hp.trim()) newErrors.nomor_hp = 'Nomor HP wajib diisi';
    if (!formData.alamat.trim()) newErrors.alamat = 'Alamat wajib diisi';
    if (!formData.kategori_id) newErrors.kategori_id = 'Kategori wajib dipilih';
    if (!formData.hubungan_id) newErrors.hubungan_id = 'Hubungan wajib dipilih';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Combine date and time
      let finalStart: Date | undefined = typeof formData.tgl_mulai_resepsi === 'string' ? new Date(formData.tgl_mulai_resepsi) : formData.tgl_mulai_resepsi;
      let finalEnd: Date | undefined = typeof formData.tgl_akhir_resepsi === 'string' ? new Date(formData.tgl_akhir_resepsi) : formData.tgl_akhir_resepsi;

      if (selectedDate && startTime) {
        const start = new Date(selectedDate);
        start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        finalStart = start;
      }

      if (selectedDate && endTime) {
        const end = new Date(selectedDate);
        end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        finalEnd = end;
      }

      const dataToSave: any = {
        nama: formData.nama.trim(),
        kategori_id: formData.kategori_id,
        hubungan_id: formData.hubungan_id,
        alamat: formData.alamat.trim(),
        nomor_hp: formData.nomor_hp.trim(),
        // Convert dates to ISO string format for proper TIMESTAMP WITH TIME ZONE storage
        tgl_mulai_resepsi: finalStart ? finalStart.toISOString() : undefined,
        tgl_akhir_resepsi: finalEnd ? finalEnd.toISOString() : undefined,
      };

      await onSave(dataToSave);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Custom Input Component for DatePicker
  const CustomInput = forwardRef(({ value, onClick, placeholder, icon }: any, ref: any) => (
    <InputGroup onClick={onClick}>
      <Input
        ref={ref}
        value={value}
        placeholder={placeholder}
        readOnly
        variant="filled"
        size="lg"
        borderRadius="md"
        focusBorderColor={colorMode === 'light' ? 'teal.500' : 'teal.300'}
        _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200' }}
        cursor="pointer"
      />
      <InputRightElement pointerEvents="none" h="full" mr={2}>
        <Icon as={icon} color="gray.500" />
      </InputRightElement>
    </InputGroup>
  ));
  CustomInput.displayName = 'CustomInput';

  if (loadingOptions) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="teal.500" />
        <Text mt={4} color="gray.500">Memuat data...</Text>
      </Box>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Stack spacing={5}>
        <FormControl isRequired isInvalid={!!errors.nama}>
          <FormLabel>Nama</FormLabel>
          <Input
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            placeholder="Nama lengkap tamu"
            isDisabled={loading}
            size="lg"
            borderRadius="md"
            focusBorderColor={colorMode === 'light' ? 'blue.500' : 'blue.300'}
          />
          {errors.nama && (
            <Box color="red.500" fontSize="sm" mt={1}>{errors.nama}</Box>
          )}
        </FormControl>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <FormControl isRequired isInvalid={!!errors.kategori_id}>
            <FormLabel>Kategori</FormLabel>
            <Select
              name="kategori_id"
              value={formData.kategori_id}
              onChange={handleChange}
              isDisabled={loading}
              variant="filled"
              size="lg"
              borderRadius="md"
              focusBorderColor={colorMode === 'light' ? 'teal.500' : 'teal.300'}
              _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200' }}
            >
              <option value="">Pilih Kategori</option>
              {categories.map((kategori) => (
                <option key={kategori.id} value={kategori.id}>
                  {kategori.nama}
                </option>
              ))}
            </Select>
            {errors.kategori_id && (
              <Box color="red.500" fontSize="sm" mt={1}>{errors.kategori_id}</Box>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.hubungan_id}>
            <FormLabel>Hubungan</FormLabel>
            <Select
              name="hubungan_id"
              value={formData.hubungan_id}
              onChange={handleChange}
              isDisabled={loading}
              variant="filled"
              size="lg"
              borderRadius="md"
              focusBorderColor={colorMode === 'light' ? 'teal.500' : 'teal.300'}
              _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200' }}
            >
              <option value="">Pilih Hubungan</option>
              {relationships.map((hubungan) => (
                <option key={hubungan.id} value={hubungan.id}>
                  {hubungan.nama}
                </option>
              ))}
            </Select>
            {errors.hubungan_id && (
              <Box color="red.500" fontSize="sm" mt={1}>{errors.hubungan_id}</Box>
            )}
          </FormControl>
        </Stack>

        <FormControl isRequired isInvalid={!!errors.alamat}>
          <FormLabel>Alamat</FormLabel>
          <Textarea
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            placeholder="Alamat lengkap tamu"
            isDisabled={loading}
            rows={3}
            resize="none"
            borderRadius="md"
            focusBorderColor={colorMode === 'light' ? 'blue.500' : 'blue.300'}
          />
          {errors.alamat && (
            <Box color="red.500" fontSize="sm" mt={1}>{errors.alamat}</Box>
          )}
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.nomor_hp}>
          <FormLabel>Nomor HP</FormLabel>
          <Input
            name="nomor_hp"
            type="tel"
            value={formData.nomor_hp}
            onChange={handleChange}
            placeholder="Nomor HP tamu"
            isDisabled={loading}
            size="lg"
            borderRadius="md"
            focusBorderColor={colorMode === 'light' ? 'blue.500' : 'blue.300'}
          />
          {errors.nomor_hp && (
            <Box color="red.500" fontSize="sm" mt={1}>{errors.nomor_hp}</Box>
          )}
        </FormControl>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align="flex-start">
          <FormControl flex={2}>
            <FormLabel>Tanggal Resepsi</FormLabel>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => setSelectedDate(date)}
              dateFormat="dd MMMM yyyy"
              locale="id"
              customInput={<CustomInput placeholder="Pilih Tanggal" icon={FaCalendarAlt} />}
              wrapperClassName="w-full"
            />
          </FormControl>

          <FormControl flex={1}>
            <FormLabel>Jam Mulai</FormLabel>
            <DatePicker
              selected={startTime}
              onChange={(date: Date) => setStartTime(date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Jam"
              dateFormat="HH:mm"
              locale="id"
              customInput={<CustomInput placeholder="Mulai" icon={FaClock} />}
              wrapperClassName="w-full"
            />
          </FormControl>

          <FormControl flex={1}>
            <FormLabel>Jam Selesai</FormLabel>
            <DatePicker
              selected={endTime}
              onChange={(date: Date) => setEndTime(date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Jam"
              dateFormat="HH:mm"
              locale="id"
              customInput={<CustomInput placeholder="Selesai" icon={FaClock} />}
              wrapperClassName="w-full"
            />
          </FormControl>
        </Stack>

        <Stack direction={{ base: 'column-reverse', md: 'row' }} spacing={4} justify="flex-end">
          <PrimaryOutlineButton onClick={onCancel} isDisabled={loading} w="150px">
            Batal
          </PrimaryOutlineButton>
          <PrimaryButton type="submit" isLoading={loading} w="150px">
            {isEdit ? 'Perbarui' : 'Simpan'}
          </PrimaryButton>
        </Stack>
      </Stack>
    </Box>
  );
};

export default TamuForm;