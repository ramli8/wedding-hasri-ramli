import React, { useState, useEffect } from 'react';
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
  Spinner,
  Text,
  Button,
} from '@chakra-ui/react';
import { Tamu, CreateTamuInput, UpdateTamuInput } from '../../types/Tamu.types';
import {
  PrimaryButton,
  PrimaryOutlineButton,
} from '@/components/atoms/Buttons/PrimaryButton';
import KategoriTamuAPI from '@/modules/admin/kategori_tamu/services/KategoriTamuAPI';
import HubunganTamuAPI from '@/modules/admin/hubungan_tamu/services/HubunganTamuAPI';
import { KategoriTamu } from '@/modules/admin/kategori_tamu/types/KategoriTamu.types';
import { HubunganTamu } from '@/modules/admin/hubungan_tamu/types/HubunganTamu.types';
import {
  normalizePhoneNumber,
  normalizeInstagramUsername,
  validatePhoneNumber,
} from '../../utils/phoneUtils';
import TamuAPI from '../../services/TamuAPI';

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
    username_instagram: '',
  });

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

        const [kategoriesResponse, relationshipsResponse] = await Promise.all([
          kategoriAPI.getAll(undefined, undefined, { status: 'active' }),
          hubunganAPI.getAll(undefined, undefined, { status: 'active' }),
        ]);

        setCategories(kategoriesResponse.data);
        setRelationships(relationshipsResponse.data);

        // Set default values if not editing
        if (
          !tamu &&
          kategoriesResponse.data.length > 0 &&
          relationshipsResponse.data.length > 0
        ) {
          setFormData((prev) => ({
            ...prev,
            kategori_id: kategoriesResponse.data[0].id,
            hubungan_id: relationshipsResponse.data[0].id,
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
        username_instagram: tamu.username_instagram || '',
      });
    }
  }, [tamu]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.alamat.trim()) newErrors.alamat = 'Alamat wajib diisi';
    if (!formData.kategori_id) newErrors.kategori_id = 'Kategori wajib dipilih';
    if (!formData.hubungan_id) newErrors.hubungan_id = 'Hubungan wajib dipilih';

    // Validate at least one contact method
    const hasNomorHp = formData.nomor_hp?.trim();
    const hasInstagram = formData.username_instagram?.trim();
    if (!hasNomorHp && !hasInstagram) {
      newErrors.nomor_hp = 'Minimal salah satu harus diisi';
      newErrors.username_instagram = 'Minimal salah satu harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for the changed field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];

        // If user fills nomor_hp or username_instagram, clear both contact errors
        if (name === 'nomor_hp' || name === 'username_instagram') {
          if (value.trim()) {
            delete newErrors.nomor_hp;
            delete newErrors.username_instagram;
          }
        }

        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Normalize phone number and instagram username before saving
      const normalizedPhone = normalizePhoneNumber(formData.nomor_hp);
      const normalizedInstagram = normalizeInstagramUsername(
        formData.username_instagram
      );

      // Validate phone number format (minimal 10 digit)
      const phoneValidationError = validatePhoneNumber(normalizedPhone);
      if (phoneValidationError) {
        setErrors((prev) => ({
          ...prev,
          nomor_hp: phoneValidationError,
        }));
        setLoading(false);
        return;
      }

      // Check for duplicates
      const tamuAPI = new TamuAPI();
      const duplicateCheck = await tamuAPI.checkDuplicate(
        normalizedPhone,
        normalizedInstagram,
        tamu?.id // Exclude current tamu when editing
      );

      if (duplicateCheck.isDuplicate) {
        const fieldLabel =
          duplicateCheck.duplicateField === 'nomor_hp'
            ? 'Nomor HP'
            : 'Username Instagram';
        const errorMessage = `${fieldLabel} sudah digunakan oleh "${duplicateCheck.duplicateName}"`;

        setErrors((prev) => ({
          ...prev,
          [duplicateCheck.duplicateField!]: errorMessage,
        }));
        setLoading(false);
        return;
      }

      const dataToSave: CreateTamuInput | UpdateTamuInput = {
        nama: formData.nama.trim(),
        kategori_id: formData.kategori_id,
        hubungan_id: formData.hubungan_id,
        alamat: formData.alamat.trim(),
        nomor_hp: normalizedPhone || null,
        username_instagram: normalizedInstagram || null,
      };

      await onSave(dataToSave);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="teal.500" />
        <Text mt={4} color="gray.500">
          Memuat data...
        </Text>
      </Box>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Stack spacing={5}>
        <FormControl isRequired isInvalid={!!errors.nama}>
          <FormLabel
            fontSize="sm"
            fontWeight="600"
            color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
            mb={3}
          >
            Nama
          </FormLabel>
          <Input
            name="nama"
            value={formData.nama}
            onChange={handleChange}
            isDisabled={loading}
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
              borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300',
              boxShadow: 'none',
            }}
          />
          {errors.nama && (
            <Box color="red.500" fontSize="sm" mt={1}>
              {errors.nama}
            </Box>
          )}
        </FormControl>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <FormControl isRequired isInvalid={!!errors.kategori_id}>
            <FormLabel
              fontSize="sm"
              fontWeight="600"
              color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              mb={3}
            >
              Kategori
            </FormLabel>
            <Select
              name="kategori_id"
              value={formData.kategori_id}
              onChange={handleChange}
              isDisabled={loading}
              variant="filled"
              size="lg"
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
                borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300',
                boxShadow: 'none',
              }}
              sx={{
                option: {
                  bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200',
                },
              }}
            >
              <option value="">Pilih Kategori</option>
              {categories.map((kategori) => (
                <option key={kategori.id} value={kategori.id}>
                  {kategori.nama}
                </option>
              ))}
            </Select>
            {errors.kategori_id && (
              <Box color="red.500" fontSize="sm" mt={1}>
                {errors.kategori_id}
              </Box>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.hubungan_id}>
            <FormLabel
              fontSize="sm"
              fontWeight="600"
              color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              mb={3}
            >
              Hubungan
            </FormLabel>
            <Select
              name="hubungan_id"
              value={formData.hubungan_id}
              onChange={handleChange}
              isDisabled={loading}
              variant="filled"
              size="lg"
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
                borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300',
                boxShadow: 'none',
              }}
              sx={{
                option: {
                  bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200',
                },
              }}
            >
              <option value="">Pilih Hubungan</option>
              {relationships.map((hubungan) => (
                <option key={hubungan.id} value={hubungan.id}>
                  {hubungan.nama}
                </option>
              ))}
            </Select>
            {errors.hubungan_id && (
              <Box color="red.500" fontSize="sm" mt={1}>
                {errors.hubungan_id}
              </Box>
            )}
          </FormControl>
        </Stack>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <FormControl isInvalid={!!errors.nomor_hp}>
            <FormLabel
              fontSize="sm"
              fontWeight="600"
              color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              mb={3}
            >
              Nomor HP{' '}
              <Text as="span" fontSize="xs" color="gray.500" fontWeight="400">
                (minimal salah satu)
              </Text>
            </FormLabel>
            <Input
              name="nomor_hp"
              type="tel"
              placeholder="08123456789"
              value={formData.nomor_hp || ''}
              onChange={handleChange}
              isDisabled={loading}
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
                borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300',
                boxShadow: 'none',
              }}
            />
            {errors.nomor_hp && (
              <Box color="red.500" fontSize="sm" mt={1}>
                {errors.nomor_hp}
              </Box>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.username_instagram}>
            <FormLabel
              fontSize="sm"
              fontWeight="600"
              color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              mb={3}
            >
              Username Instagram{' '}
              <Text as="span" fontSize="xs" color="gray.500" fontWeight="400">
                (minimal salah satu)
              </Text>
            </FormLabel>
            <Input
              name="username_instagram"
              type="text"
              placeholder="username"
              value={formData.username_instagram || ''}
              onChange={handleChange}
              isDisabled={loading}
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
                borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300',
                boxShadow: 'none',
              }}
            />
            {errors.username_instagram && (
              <Box color="red.500" fontSize="sm" mt={1}>
                {errors.username_instagram}
              </Box>
            )}
          </FormControl>
        </Stack>

        <FormControl isRequired isInvalid={!!errors.alamat}>
          <FormLabel
            fontSize="sm"
            fontWeight="600"
            color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
            mb={3}
          >
            Alamat
          </FormLabel>
          <Textarea
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            isDisabled={loading}
            rows={3}
            resize="none"
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
              borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300',
              boxShadow: 'none',
            }}
          />
          {errors.alamat && (
            <Box color="red.500" fontSize="sm" mt={1}>
              {errors.alamat}
            </Box>
          )}
        </FormControl>

        <HStack
          spacing={4}
          justify="flex-end"
          pt={4}
          borderTop="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
        >
          <Button
            onClick={onCancel}
            isDisabled={loading}
            variant="ghost"
            h="50px"
            px={8}
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
      </Stack>
    </Box>
  );
};

export default TamuForm;
