import { useState, useContext } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  useColorMode,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import UcapanAPI from '@/modules/admin/ucapan/services/UcapanAPI';
import AccountInfoContext from '@/providers/AccountInfoProvider';

interface UcapanFormProps {
  onSuccess?: () => void;
  guestId?: string | null;
  guestName?: string | null;
  isAdminMode?: boolean;
  adminUserId?: string | null;
}

const UcapanForm: React.FC<UcapanFormProps> = ({ 
  onSuccess, 
  guestId, 
  guestName,
  isAdminMode = false,
  adminUserId = null
}) => {
  const [pesan, setPesan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { colorMode } = useColorMode();
  const api = new UcapanAPI();
  const accountInfo = useContext(AccountInfoContext);

  // Allow if: guest with valid ID OR admin mode
  const canSubmit = (guestId && guestName) || (isAdminMode && adminUserId);
  const senderName = isAdminMode ? (accountInfo?.name || 'Admin') : guestName;

  // Only show alert if neither guest nor admin
  if (!canSubmit) {
    return (
      <Alert status="info" variant="subtle" bg="gray.100" color="gray.800" borderRadius="md">
        <AlertIcon color="gray.500" />
        <Text fontSize="sm">
          Ucapan hanya dapat dikirim oleh tamu yang memiliki undangan. 
          Silakan akses halaman ini melalui link undangan Anda.
        </Text>
      </Alert>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pesan.trim()) {
      toast({
        title: 'Mohon isi pesan',
        description: 'Pesan ucapan tidak boleh kosong',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.createUcapan({
        nama: senderName || 'Tamu',
        pesan: pesan.trim(),
        tamu_id: (!isAdminMode && guestId) || undefined,
        user_id: (isAdminMode && adminUserId) || undefined,
        is_admin: isAdminMode,
      });

      toast({
        title: 'Terima kasih!',
        description: 'Ucapan Anda telah terkirim',
        status: 'success',
        duration: 3000,
      });

      // Reset form
      setPesan('');

      // Call success callback
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Gagal mengirim ucapan',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const borderColor = colorMode === 'light' ? 'gray.200' : 'gray.700';
  const focusBorderColor = colorMode === 'light' ? 'black' : 'white';
  const buttonBg = colorMode === 'light' ? 'black' : 'white';
  const buttonColor = colorMode === 'light' ? 'white' : 'black';
  const buttonHoverBg = colorMode === 'light' ? 'gray.800' : 'gray.200';

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      p={6}
      bg="transparent"
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="wide">
            Dari: {senderName}
          </FormLabel>
        </FormControl>

        <FormControl isRequired>
          <Textarea
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            placeholder="Tulis ucapan dan doa terbaik Anda di sini..."
            rows={4}
            disabled={isSubmitting}
            fontSize="sm"
            borderRadius="md"
            bg="transparent"
            border="1px solid"
            borderColor={borderColor}
            _hover={{ borderColor: 'gray.400' }}
            _focus={{
              borderColor: focusBorderColor,
              boxShadow: 'none',
            }}
          />
        </FormControl>

        <Button
          type="submit"
          bg={buttonBg}
          color={buttonColor}
          _hover={{ bg: buttonHoverBg }}
          _active={{ bg: buttonHoverBg }}
          isLoading={isSubmitting}
          loadingText="Mengirim..."
          w="full"
          borderRadius="md"
          size="md"
          fontSize="sm"
          fontWeight="600"
        >
          Kirim Ucapan
        </Button>
      </VStack>
    </Box>
  );
};

export default UcapanForm;

