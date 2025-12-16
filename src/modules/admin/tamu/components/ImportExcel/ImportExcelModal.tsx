import React, { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Box,
  Text,
  Button,
  useColorMode,
  Icon,
  HStack,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import { FiDownload, FiUpload, FiFile } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { CreateTamuInput } from '../../types/Tamu.types';
import {
  normalizePhoneNumber,
  normalizeInstagramUsername,
  validatePhoneNumber,
} from '../../utils/phoneUtils';
import TamuAPI from '../../services/TamuAPI';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: CreateTamuInput[]) => Promise<void>;
  categories: { id: string; nama: string }[];
  relationships: { id: string; nama: string }[];
}

interface ExcelRow {
  Nama: string;
  Kategori: string;
  Hubungan: string;
  Alamat: string;
  'Nomor HP'?: string;
  'Username Instagram'?: string;
}

const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  onImport,
  categories,
  relationships,
}) => {
  const { colorMode } = useColorMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleDownloadTemplate = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create template data with example + 500 empty rows for future data
    // This ensures all cells in Nomor HP column are pre-formatted as TEXT
    const templateData = [
      {
        Nama: 'Contoh Nama',
        Kategori: categories[0]?.nama || 'Tamu Hasri',
        Hubungan: relationships[0]?.nama || 'Teman Kuliah',
        Alamat: 'Jl. Contoh No. 123, Jakarta',
        'Nomor HP': '081234567890',
        'Username Instagram': 'contohusername',
      },
    ];

    // Add 500 empty rows with pre-formatted text cells for Nomor HP
    for (let i = 0; i < 500; i++) {
      templateData.push({
        Nama: '',
        Kategori: '',
        Hubungan: '',
        Alamat: '',
        'Nomor HP': '', // Empty but will be formatted as text
        'Username Instagram': '',
      });
    }

    // Create main worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Format kolom Nomor HP sebagai text agar tidak kehilangan leading zero
    // Column E adalah Nomor HP (index 4, karena A=0, B=1, C=2, D=3, E=4)
    const nomorHpColIndex = 4;

    // Format ALL cells in Nomor HP column as text (including empty ones)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F501');
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: nomorHpColIndex,
      });

      // Initialize cell if doesn't exist
      if (!ws[cellAddress]) {
        ws[cellAddress] = { t: 's', v: '', w: '' };
      }

      // Force cell type to string (text) and set format
      ws[cellAddress].t = 's';
      ws[cellAddress].z = '@'; // @ adalah format code untuk text di Excel
    }

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Nama
      { wch: 18 }, // Kategori
      { wch: 18 }, // Hubungan
      { wch: 35 }, // Alamat
      { wch: 15 }, // Nomor HP
      { wch: 20 }, // Username Instagram
    ];

    // Add sheet "Template Tamu" FIRST (akan menjadi sheet pertama)
    XLSX.utils.book_append_sheet(wb, ws, 'Template Tamu');

    // Create reference sheet for dropdown options
    const kategoriList = categories.map((c) => c.nama);
    const hubunganList = relationships.map((r) => r.nama);

    // Create separate sheets for Kategori and Hubungan lists
    const kategoriData = categories.map((c) => ({ Kategori: c.nama }));
    const hubunganData = relationships.map((r) => ({ Hubungan: r.nama }));

    // Combine to one reference sheet
    const maxLength = Math.max(kategoriData.length, hubunganData.length);
    const referenceData = [];
    for (let i = 0; i < maxLength; i++) {
      referenceData.push({
        Kategori: kategoriData[i]?.Kategori || '',
        Hubungan: hubunganData[i]?.Hubungan || '',
      });
    }

    const wsRef = XLSX.utils.json_to_sheet(referenceData);
    wsRef['!cols'] = [
      { wch: 20 }, // Kategori
      { wch: 20 }, // Hubungan
    ];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Daftar');

    // Note: Data validation (dropdown) tidak bisa dibuat secara programatis dengan library xlsx
    // User perlu membuat dropdown manual atau menggunakan copy-paste dari sheet "Daftar"

    // Add instruction sheet
    const instructions = [
      { Instruksi: 'PANDUAN PENGISIAN TEMPLATE IMPORT TAMU' },
      { Instruksi: '' },
      { Instruksi: 'CARA MENGGUNAKAN TEMPLATE:' },
      { Instruksi: '1. Buka sheet "Template Tamu" untuk mengisi data tamu' },
      {
        Instruksi:
          '2. Template sudah menyediakan 500 baris kosong yang siap diisi',
      },
      {
        Instruksi:
          '3. Kolom Nomor HP sudah diformat TEXT untuk semua baris (0 tidak akan hilang)',
      },
      {
        Instruksi:
          '4. Lihat sheet "Daftar" untuk melihat kategori dan hubungan yang tersedia',
      },
      {
        Instruksi:
          '5. COPY-PASTE dari sheet "Daftar" ke "Template Tamu" untuk menghindari typo',
      },
      { Instruksi: '6. Hapus baris contoh (row 2) sebelum mengisi data Anda' },
      { Instruksi: '' },
      { Instruksi: 'KOLOM-KOLOM YANG HARUS DIISI:' },
      { Instruksi: '1. Nama: Isi dengan nama lengkap tamu (WAJIB)' },
      {
        Instruksi:
          '2. Kategori: Copy dari sheet "Daftar" kolom "Kategori" (WAJIB)',
      },
      {
        Instruksi: `   Kategori tersedia: ${categories
          .map((c) => c.nama)
          .join(', ')}`,
      },
      {
        Instruksi:
          '3. Hubungan: Copy dari sheet "Daftar" kolom "Hubungan" (WAJIB)',
      },
      {
        Instruksi: `   Hubungan tersedia: ${relationships
          .map((r) => r.nama)
          .join(', ')}`,
      },
      { Instruksi: '4. Alamat: Isi dengan alamat lengkap (WAJIB)' },
      { Instruksi: '5. Nomor HP: Isi dengan nomor telepon' },
      {
        Instruksi:
          '   Format bebas: 0822-3412-1212, 081234567890, +6281234567890, dll',
      },
      {
        Instruksi:
          '   Sistem akan otomatis normalisasi format (+62/62 → 0, hapus tanda -, spasi, dll)',
      },
      {
        Instruksi:
          '6. Username Instagram: Isi username Instagram TANPA @, contoh: username',
      },
      {
        Instruksi:
          '   Boleh pakai @ atau tidak, sistem akan otomatis menghapus tanda @',
      },
      { Instruksi: '' },
      { Instruksi: 'PENTING UNTUK KONTAK:' },
      {
        Instruksi:
          '- MINIMAL salah satu harus diisi: Nomor HP ATAU Username Instagram',
      },
      { Instruksi: '- Boleh diisi keduanya untuk kontak lebih lengkap' },
      {
        Instruksi:
          '- Jika tidak ada nomor HP, pastikan Username Instagram diisi',
      },
      { Instruksi: '- Jika tidak ada Instagram, pastikan Nomor HP diisi' },
      { Instruksi: '' },
      { Instruksi: 'FORMAT NOMOR HP:' },
      {
        Instruksi:
          '- Kolom Nomor HP SEMUA BARIS sudah diformat TEXT (angka 0 tidak akan hilang)',
      },
      {
        Instruksi:
          '- Anda bisa langsung paste nomor 089012345678 di row manapun, 0 tetap ada',
      },
      {
        Instruksi:
          '- Template menyediakan 500 baris dengan format TEXT yang sudah siap',
      },
      {
        Instruksi:
          '- Boleh pakai format apapun: 0822-3412-1212, 081234567890, +6281234567890',
      },
      { Instruksi: '- Sistem otomatis menghapus tanda -, spasi, kurung, dll' },
      { Instruksi: '- Sistem otomatis mengubah +62 atau 62 menjadi 0' },
      {
        Instruksi:
          '- Hasil akhir: hanya angka, diawali 0 (contoh: 081234567890)',
      },
      { Instruksi: '' },
      { Instruksi: 'FORMAT USERNAME INSTAGRAM:' },
      { Instruksi: '- Isi username TANPA tanda @ di depan' },
      {
        Instruksi:
          '- Boleh ketik @username atau username, sistem otomatis menghapus @',
      },
      {
        Instruksi:
          '- Hasil akhir: username tanpa @ (contoh: johndoe, bukan @johndoe)',
      },
      { Instruksi: '' },
      { Instruksi: 'TIPS AGAR TIDAK TYPO:' },
      {
        Instruksi:
          '- Buka sheet "Daftar" untuk melihat pilihan kategori dan hubungan',
      },
      {
        Instruksi:
          '- GUNAKAN COPY-PASTE dari sheet "Daftar" ke sheet "Template Tamu"',
      },
      {
        Instruksi:
          '- Jangan ketik manual, karena harus sama persis dengan yang ada di daftar',
      },
      { Instruksi: '' },
      { Instruksi: 'CARA MEMBUAT DROPDOWN MANUAL (OPSIONAL):' },
      {
        Instruksi:
          '- Di Excel: Data > Data Validation > List > Source: pilih dari sheet "Daftar"',
      },
      {
        Instruksi:
          '- Di Google Sheets: Data > Data validation > List from a range: Daftar!A:A',
      },
      { Instruksi: '' },
      { Instruksi: 'VALIDASI DUPLIKASI:' },
      {
        Instruksi:
          '- Nomor HP dan Username Instagram harus UNIK (tidak boleh sama dengan data lain)',
      },
      { Instruksi: '- Sistem akan cek duplikasi di dalam file Excel' },
      {
        Instruksi:
          '- Sistem akan cek duplikasi dengan data yang sudah ada di database',
      },
      {
        Instruksi:
          '- Jika ada duplikat, import akan ditolak dengan pesan error',
      },
      { Instruksi: '' },
      { Instruksi: 'PENTING:' },
      { Instruksi: '- JANGAN ubah nama kolom header di sheet "Template Tamu"' },
      {
        Instruksi:
          '- GUNAKAN copy-paste dari sheet "Daftar" untuk kategori dan hubungan',
      },
      {
        Instruksi:
          '- Pastikan kategori dan hubungan PERSIS sama dengan yang ada di sheet "Daftar"',
      },
      { Instruksi: '- Hapus baris contoh sebelum mengisi data Anda' },
      {
        Instruksi:
          '- Kategori dan Hubungan bersifat case-insensitive (huruf besar/kecil tidak masalah)',
      },
      {
        Instruksi:
          '- Pastikan Nomor HP dan Username Instagram tidak ada yang sama',
      },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Panduan');

    // Generate Excel file
    XLSX.writeFile(wb, 'Template_Import_Tamu.xlsx');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Silakan pilih file Excel terlebih dahulu');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setProgress(0);
    setProgressMessage('Memuat file Excel...');

    try {
      const data = await selectedFile.arrayBuffer();
      setProgress(10);

      setProgressMessage('Membaca data Excel...');
      const workbook = XLSX.read(data, { cellText: false, cellDates: false });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convert to JSON with raw values to preserve leading zeros
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Don't use raw values, use formatted text
        defval: '', // Default value for empty cells
      });
      setProgress(20);

      if (jsonData.length === 0) {
        throw new Error('File Excel kosong atau tidak ada data');
      }

      // Validate and transform data
      setProgressMessage('Memvalidasi data...');
      setProgress(30);

      const transformedData: CreateTamuInput[] = [];
      const errors: string[] = [];
      const tamuAPI = new TamuAPI();

      // First pass: collect all normalized phone numbers and usernames for duplicate checking
      const phoneNumbers: Map<string, number[]> = new Map(); // phone -> row numbers
      const usernames: Map<string, number[]> = new Map(); // username -> row numbers

      for (let index = 0; index < jsonData.length; index++) {
        const row = jsonData[index];
        const rowNum = index + 2; // +2 because Excel is 1-indexed and has header

        // Skip baris kosong dan stop validasi jika nama kosong
        // Ini untuk menghindari validasi 500 baris template kosong
        if (!row.Nama?.trim()) {
          break; // Stop processing, baris ini dan seterusnya dianggap kosong
        }

        // Validate required fields
        if (!row.Kategori?.trim()) {
          errors.push(`Baris ${rowNum}: Kategori wajib diisi`);
          continue;
        }
        if (!row.Hubungan?.trim()) {
          errors.push(`Baris ${rowNum}: Hubungan wajib diisi`);
          continue;
        }
        if (!row.Alamat?.trim()) {
          errors.push(`Baris ${rowNum}: Alamat wajib diisi`);
          continue;
        }

        // Convert Nomor HP to string if it's a number (to preserve leading zeros)
        let nomorHpValue = '';
        if (row['Nomor HP'] !== undefined && row['Nomor HP'] !== null) {
          // Convert to string, handling both string and number types
          nomorHpValue = String(row['Nomor HP']).trim();

          // If Excel converted to number and lost leading zero, try to restore it
          // Nomor HP Indonesia typically starts with 0 and has 10-13 digits
          if (nomorHpValue && /^8\d{8,11}$/.test(nomorHpValue)) {
            nomorHpValue = '0' + nomorHpValue;
          }
        }

        // Validate at least one contact method
        const hasNomorHp = nomorHpValue;
        const hasInstagram = row['Username Instagram']?.toString().trim();
        if (!hasNomorHp && !hasInstagram) {
          errors.push(
            `Baris ${rowNum}: Minimal salah satu harus diisi - Nomor HP atau Username Instagram`
          );
          continue;
        }

        // Find kategori_id
        const kategori = categories.find(
          (c) => c.nama.toLowerCase() === row.Kategori.trim().toLowerCase()
        );
        if (!kategori) {
          errors.push(
            `Baris ${rowNum}: Kategori "${row.Kategori}" tidak ditemukan`
          );
          continue;
        }

        // Find hubungan_id
        const hubungan = relationships.find(
          (h) => h.nama.toLowerCase() === row.Hubungan.trim().toLowerCase()
        );
        if (!hubungan) {
          errors.push(
            `Baris ${rowNum}: Hubungan "${row.Hubungan}" tidak ditemukan`
          );
          continue;
        }

        // Normalize phone number and instagram username
        const normalizedPhone = normalizePhoneNumber(nomorHpValue);
        const normalizedInstagram = normalizeInstagramUsername(
          hasInstagram || ''
        );

        // Validate phone number format (minimal 10 digit)
        const phoneValidationError = validatePhoneNumber(normalizedPhone);
        if (phoneValidationError) {
          errors.push(`Baris ${rowNum}: ${phoneValidationError}`);
          continue;
        }

        // Track duplicates within the Excel file
        if (normalizedPhone) {
          const existing = phoneNumbers.get(normalizedPhone) || [];
          existing.push(rowNum);
          phoneNumbers.set(normalizedPhone, existing);
        }
        if (normalizedInstagram) {
          const existing = usernames.get(normalizedInstagram) || [];
          existing.push(rowNum);
          usernames.set(normalizedInstagram, existing);
        }

        transformedData.push({
          nama: row.Nama.trim(),
          kategori_id: kategori.id,
          hubungan_id: hubungan.id,
          alamat: row.Alamat.trim(),
          nomor_hp: normalizedPhone,
          username_instagram: normalizedInstagram,
        });
      }

      // Check for duplicates within Excel file
      setProgressMessage('Memeriksa duplikasi dalam file...');
      setProgress(50);

      phoneNumbers.forEach((rows, phone) => {
        if (rows.length > 1) {
          errors.push(
            `Nomor HP "${phone}" duplikat di baris: ${rows.join(', ')}`
          );
        }
      });

      usernames.forEach((rows, username) => {
        if (rows.length > 1) {
          errors.push(
            `Username Instagram "${username}" duplikat di baris: ${rows.join(
              ', '
            )}`
          );
        }
      });

      // Check for duplicates in database
      setProgressMessage('Memeriksa duplikasi dengan database...');
      setProgress(60);

      for (let i = 0; i < transformedData.length; i++) {
        const data = transformedData[i];
        const rowNum = i + 2;

        // Update progress for each row checked (60% to 80%)
        const checkProgress =
          60 + Math.floor((i / transformedData.length) * 20);
        setProgress(checkProgress);
        setProgressMessage(
          `Memeriksa data ${i + 1} dari ${transformedData.length}...`
        );

        const duplicateCheck = await tamuAPI.checkDuplicate(
          data.nomor_hp || undefined,
          data.username_instagram || undefined
        );

        if (duplicateCheck.isDuplicate) {
          const fieldLabel =
            duplicateCheck.duplicateField === 'nomor_hp'
              ? 'Nomor HP'
              : 'Username Instagram';
          const fieldValue =
            duplicateCheck.duplicateField === 'nomor_hp'
              ? data.nomor_hp
              : data.username_instagram;
          errors.push(
            `Baris ${rowNum}: ${fieldLabel} "${fieldValue}" sudah digunakan oleh "${duplicateCheck.duplicateName}"`
          );
        }
      }

      if (errors.length > 0) {
        throw new Error(`Validasi gagal:\n${errors.join('\n')}`);
      }

      if (transformedData.length === 0) {
        throw new Error('Tidak ada data valid untuk diimport');
      }

      // Call import function
      setProgressMessage(
        `Mengimport ${transformedData.length} data ke database...`
      );
      setProgress(90);

      await onImport(transformedData);

      setProgress(100);
      setProgressMessage('Import selesai!');
      setSuccess(`Berhasil mengimport ${transformedData.length} data tamu`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengimport data');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius="24px"
        boxShadow="2xl"
        maxW="600px"
      >
        <ModalHeader
          fontSize="2xl"
          fontWeight="700"
          color={colorMode === 'light' ? 'gray.900' : 'white'}
          pt={8}
          px={8}
        >
          Import Data Tamu dari Excel
        </ModalHeader>
        <ModalCloseButton
          top={6}
          right={6}
          borderRadius="full"
          _hover={{
            bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
          }}
        />
        <ModalBody px={8} pb={8}>
          <VStack spacing={6} align="stretch">
            {/* Download Template Section */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="600"
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                mb={3}
              >
                1. Unduh Template Excel
              </Text>
              <Button
                leftIcon={<Icon as={FiDownload} />}
                onClick={handleDownloadTemplate}
                variant="outline"
                w="full"
                h="50px"
                borderRadius="16px"
                borderWidth="2px"
                borderColor={colorMode === 'light' ? 'gray.300' : 'gray.600'}
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                fontWeight="600"
                _hover={{
                  borderColor: colorMode === 'light' ? 'blue.500' : 'blue.400',
                  bg: colorMode === 'light' ? 'blue.50' : 'gray.700',
                }}
              >
                Unduh Template Excel
              </Button>
              <Text
                fontSize="xs"
                color={colorMode === 'light' ? 'gray.500' : 'gray.500'}
                mt={2}
              >
                Template berisi format yang benar dan panduan pengisian
              </Text>
            </Box>

            {/* Upload Section */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="600"
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                mb={3}
              >
                2. Unggah File Excel
              </Text>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {!selectedFile ? (
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  w="full"
                  h="50px"
                  borderRadius="16px"
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor={colorMode === 'light' ? 'gray.300' : 'gray.600'}
                  color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                  fontWeight="600"
                  _hover={{
                    borderColor:
                      colorMode === 'light' ? 'green.500' : 'green.400',
                    bg: colorMode === 'light' ? 'green.50' : 'gray.700',
                  }}
                >
                  Pilih File Excel
                </Button>
              ) : (
                <Box
                  p={4}
                  borderRadius="16px"
                  bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                  borderWidth="2px"
                  borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
                >
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Icon
                        as={FiFile}
                        fontSize="24px"
                        color={
                          colorMode === 'light' ? 'green.500' : 'green.400'
                        }
                      />
                      <VStack align="start" spacing={0}>
                        <Text
                          fontSize="sm"
                          fontWeight="600"
                          color={colorMode === 'light' ? 'gray.900' : 'white'}
                        >
                          {selectedFile.name}
                        </Text>
                        <Text
                          fontSize="xs"
                          color={
                            colorMode === 'light' ? 'gray.500' : 'gray.400'
                          }
                        >
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </Text>
                      </VStack>
                    </HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={handleRemoveFile}
                    >
                      Hapus
                    </Button>
                  </HStack>
                </Box>
              )}
            </Box>

            {/* Progress Bar */}
            {loading && (
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                  >
                    {progressMessage}
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="700"
                    color={colorMode === 'light' ? 'blue.600' : 'blue.400'}
                  >
                    {progress}%
                  </Text>
                </HStack>
                <Box
                  w="full"
                  h="8px"
                  bg={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                  borderRadius="full"
                  overflow="hidden"
                >
                  <Box
                    h="full"
                    w={`${progress}%`}
                    bg="linear-gradient(90deg, #3182CE 0%, #63B3ED 100%)"
                    transition="width 0.3s ease"
                    borderRadius="full"
                  />
                </Box>
              </Box>
            )}

            {/* Error Alert */}
            {error && (
              <Alert status="error" borderRadius="12px">
                <AlertIcon />
                <Text fontSize="sm" whiteSpace="pre-line">
                  {error}
                </Text>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert status="success" borderRadius="12px">
                <AlertIcon />
                <Text fontSize="sm">{success}</Text>
              </Alert>
            )}

            {/* Action Buttons */}
            <HStack spacing={4} justify="flex-end" pt={4}>
              <Button
                onClick={onClose}
                variant="ghost"
                h="50px"
                px={8}
                borderRadius="16px"
                isDisabled={loading}
              >
                Batal
              </Button>
              <PrimaryButton
                onClick={handleUpload}
                isLoading={loading}
                isDisabled={!selectedFile || loading}
                h="50px"
                px={8}
                borderRadius="16px"
              >
                Import Data
              </PrimaryButton>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImportExcelModal;
