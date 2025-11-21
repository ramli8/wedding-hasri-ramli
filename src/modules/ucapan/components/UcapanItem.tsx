import { useState, useContext } from 'react';
import { Box, Text, VStack, Badge, useColorMode, Button, HStack, Textarea, useToast, Icon, IconButton } from '@chakra-ui/react';
import { Ucapan } from '@/modules/admin/ucapan/types/Ucapan.types';
import UcapanAPI from '@/modules/admin/ucapan/services/UcapanAPI';
import AccountInfoContext from '@/providers/AccountInfoProvider';

interface UcapanItemProps {
  ucapan: Ucapan;
  isReply?: boolean;
  isAdminMode?: boolean;
  adminUserId?: string | null;
  guestId?: string | null;
  guestName?: string | null;
  isLastInThread?: boolean;
  onReply?: () => void;
  onReplySuccess?: () => void;
}

const UcapanItem: React.FC<UcapanItemProps> = ({ 
  ucapan, 
  isReply = false,
  isAdminMode = false,
  adminUserId = null,
  guestId = null,
  guestName = null,
  isLastInThread = false,
  onReply,
  onReplySuccess
}) => {
  const { colorMode } = useColorMode();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const api = new UcapanAPI();
  const accountInfo = useContext(AccountInfoContext);

  // Can reply if: admin mode OR guest with valid ID
  const canReply = (isAdminMode && adminUserId) || (guestId && guestName);
  const replyerName = isAdminMode ? (accountInfo?.name || 'Admin') : guestName;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReplyClick = () => {
    setShowReplyForm(!showReplyForm);
    setReplyText('');
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast({
        title: 'Pesan balasan tidak boleh kosong',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    // Determine the correct parent ID
    // If this ucapan is already a reply (has parent_id), use that parent_id
    // Otherwise, use this ucapan's id as the parent
    const parentIdToUse = ucapan.parent_id || ucapan.id;

    try {
      console.log('Replying to parent ucapan:', parentIdToUse, 'current ucapan:', ucapan.id, 'with data:', {
        nama: replyerName || 'Tamu',
        pesan: replyText.trim(),
        user_id: isAdminMode ? (adminUserId || undefined) : undefined,
        tamu_id: !isAdminMode ? (guestId || undefined) : undefined,
        is_admin: isAdminMode,
      });

      const result = await api.replyToUcapan(parentIdToUse, {
        nama: replyerName || 'Tamu',
        pesan: replyText.trim(),
        user_id: isAdminMode ? (adminUserId || undefined) : undefined,
        tamu_id: !isAdminMode ? (guestId || undefined) : undefined,
        is_admin: isAdminMode,
      });

      console.log('Reply result:', result);

      toast({
        title: 'Balasan berhasil dikirim',
        status: 'success',
        duration: 3000,
      });

      setReplyText('');
      setShowReplyForm(false);
      
      // Force immediate refresh
      console.log('Calling onReplySuccess to refresh data...');
      if (onReplySuccess) {
        await onReplySuccess();
        console.log('Data refresh completed');
      }
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      toast({
        title: 'Gagal mengirim balasan',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Box
        p={4}
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius="md"
        ml={isReply ? 8 : 0}
        boxShadow="sm"
        border="1px solid"
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
      >
        <VStack align="start" spacing={2}>
          <HStack justify="space-between" w="full" align="start">
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Text fontWeight="bold" fontSize="md">
                {ucapan.nama}
              </Text>
              {ucapan.is_admin && (
                <Badge colorScheme="purple" fontSize="xs">
                  Admin
                </Badge>
              )}
              <Text fontSize="xs" color="gray.500">
                {formatDate(ucapan.created_at)}
              </Text>
            </Box>
          </HStack>
          <HStack justify="space-between" w="full" align="start">
            <Text fontSize="sm" whiteSpace="pre-wrap" flex="1">
              {ucapan.pesan}
            </Text>
            {canReply && isLastInThread && (
              <IconButton
                aria-label="Balas ucapan"
                icon={
                  <Icon viewBox="0 0 24 24" width="16px" height="16px">
                    <path
                      fill="currentColor"
                      d="M10,9V5L3,12L10,19V14.9C15,14.9 18.5,16.5 21,20C20,15 17,10 10,9Z"
                    />
                  </Icon>
                }
                size="sm"
                variant="ghost"
                colorScheme="teal"
                onClick={handleReplyClick}
                isActive={showReplyForm}
                _hover={{
                  bg: colorMode === 'light' ? 'teal.50' : 'teal.900',
                }}
              />
            )}
          </HStack>
        </VStack>
      </Box>

      {/* Inline Reply Form */}
      {showReplyForm && canReply && (
        <Box
          mt={2}
          ml={8}
          p={4}
          bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
          borderRadius="md"
          borderLeft="4px solid"
          borderColor="teal.500"
        >
          <VStack spacing={3} align="stretch">
            <Text fontSize="sm" fontWeight="600" color="gray.600">
              Balas sebagai {replyerName}
            </Text>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis balasan Anda..."
              rows={3}
              disabled={isSubmitting}
              fontSize="sm"
              borderRadius="md"
              _focus={{
                borderColor: 'teal.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)',
              }}
            />
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="teal"
                onClick={handleSubmitReply}
                isLoading={isSubmitting}
                loadingText="Mengirim..."
              >
                Kirim Balasan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReplyClick}
                disabled={isSubmitting}
              >
                Batal
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default UcapanItem;
