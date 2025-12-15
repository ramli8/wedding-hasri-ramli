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
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(ucapan.pesan);
  const toast = useToast();
  const api = new UcapanAPI();
  const accountInfo = useContext(AccountInfoContext);

  // Can reply if: admin mode OR guest with valid ID
  const canReply = (isAdminMode && adminUserId) || (guestId && guestName);
  const replyerName = isAdminMode ? (accountInfo?.name || 'Admin') : guestName;

  // Can edit if: owner of this ucapan (matching user_id or tamu_id)
  const canEdit = () => {
    if (isAdminMode && adminUserId && ucapan.user_id === adminUserId) {
      return true;
    }
    if (!isAdminMode && guestId && ucapan.tamu_id === guestId) {
      return true;
    }
    return false;
  };

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

  const handleEditClick = () => {
    setIsEditing(true);
    setEditText(ucapan.pesan);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(ucapan.pesan);
  };

  const handleSubmitEdit = async () => {
    if (!editText.trim()) {
      toast({
        title: 'Pesan tidak boleh kosong',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (editText.trim() === ucapan.pesan) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await api.updateUcapan(ucapan.id, editText.trim());

      toast({
        title: 'Ucapan berhasil diperbarui',
        status: 'success',
        duration: 3000,
      });

      setIsEditing(false);
      
      // Force refresh
      if (onReplySuccess) {
        await onReplySuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Gagal memperbarui ucapan',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
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
    const parentIdToUse = ucapan.parent_id || ucapan.id;

    try {
      await api.replyToUcapan(parentIdToUse, {
        nama: replyerName || 'Tamu',
        pesan: replyText.trim(),
        user_id: isAdminMode ? (adminUserId || undefined) : undefined,
        tamu_id: !isAdminMode ? (guestId || undefined) : undefined,
        is_admin: isAdminMode,
      });

      toast({
        title: 'Balasan berhasil dikirim',
        status: 'success',
        duration: 3000,
      });

      setReplyText('');
      setShowReplyForm(false);
      
      // Force immediate refresh
      if (onReplySuccess) {
        await onReplySuccess();
      }
    } catch (error: any) {
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

  const borderColor = colorMode === 'light' ? 'gray.200' : 'gray.700';
  const focusBorderColor = colorMode === 'light' ? 'black' : 'white';
  const buttonBg = colorMode === 'light' ? 'black' : 'white';
  const buttonColor = colorMode === 'light' ? 'white' : 'black';
  const buttonHoverBg = colorMode === 'light' ? 'gray.800' : 'gray.200';

  return (
    <Box>
      <Box
        p={4}
        bg="transparent"
        borderRadius="md"
        ml={isReply ? 8 : 0}
        border="1px solid"
        borderColor={borderColor}
      >
        <VStack align="start" spacing={3}>
          <HStack justify="space-between" w="full" align="start">
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Text fontWeight="700" fontSize="sm">
                {ucapan.nama}
              </Text>
              {ucapan.is_admin && (
                <Box 
                  as="span" 
                  fontSize="10px" 
                  fontWeight="bold" 
                  px={1.5} 
                  py={0.5} 
                  border="1px solid" 
                  borderColor={colorMode === 'light' ? 'black' : 'white'}
                  borderRadius="sm"
                  textTransform="uppercase"
                >
                  Admin
                </Box>
              )}
              <Text fontSize="xs" color="gray.500">
                {formatDate(ucapan.created_at)}
              </Text>
            </Box>
          </HStack>
          {isEditing ? (
            <VStack spacing={3} align="stretch" w="full">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                fontSize="sm"
                borderRadius="md"
                bg="transparent"
                border="1px solid"
                borderColor={borderColor}
                _focus={{
                  borderColor: focusBorderColor,
                  boxShadow: 'none',
                }}
              />
              <HStack spacing={2}>
                <Button
                  size="sm"
                  bg={buttonBg}
                  color={buttonColor}
                  _hover={{ bg: buttonHoverBg }}
                  _active={{ bg: buttonHoverBg }}
                  onClick={handleSubmitEdit}
                  isLoading={isSubmitting}
                  loadingText="Menyimpan..."
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="600"
                >
                  Simpan
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  fontSize="xs"
                  fontWeight="500"
                  color="gray.500"
                  _hover={{ color: colorMode === 'light' ? 'black' : 'white', bg: 'transparent' }}
                >
                  Batal
                </Button>
              </HStack>
            </VStack>
          ) : (
            <HStack justify="space-between" w="full" align="start">
              <Text fontSize="sm" whiteSpace="pre-wrap" flex="1" color={colorMode === 'light' ? 'gray.700' : 'gray.300'}>
                {ucapan.pesan}
              </Text>
              <HStack spacing={1}>
                {canEdit() && (
                  <IconButton
                    aria-label="Edit ucapan"
                    icon={
                      <Icon viewBox="0 0 24 24" width="16px" height="16px">
                        <path
                          fill="currentColor"
                          d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
                        />
                      </Icon>
                    }
                    size="xs"
                    variant="ghost"
                    color="gray.500"
                    onClick={handleEditClick}
                    _hover={{
                      color: colorMode === 'light' ? 'black' : 'white',
                      bg: 'transparent',
                    }}
                  />
                )}
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
                    size="xs"
                    variant="ghost"
                    color="gray.500"
                    onClick={handleReplyClick}
                    isActive={showReplyForm}
                    _hover={{
                      color: colorMode === 'light' ? 'black' : 'white',
                      bg: 'transparent',
                    }}
                  />
                )}
              </HStack>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Inline Reply Form */}
      {showReplyForm && canReply && (
        <Box
          mt={3}
          ml={8}
          p={4}
          bg="transparent"
          borderRadius="md"
          border="1px solid"
          borderColor={borderColor}
        >
          <VStack spacing={3} align="stretch">
            <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase">
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
              bg="transparent"
              border="1px solid"
              borderColor={borderColor}
              _focus={{
                borderColor: focusBorderColor,
                boxShadow: 'none',
              }}
            />
            <HStack spacing={2}>
              <Button
                size="sm"
                bg={buttonBg}
                color={buttonColor}
                _hover={{ bg: buttonHoverBg }}
                _active={{ bg: buttonHoverBg }}
                onClick={handleSubmitReply}
                isLoading={isSubmitting}
                loadingText="Mengirim..."
                borderRadius="md"
                fontSize="xs"
                fontWeight="600"
              >
                Kirim Balasan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReplyClick}
                disabled={isSubmitting}
                fontSize="xs"
                fontWeight="500"
                color="gray.500"
                _hover={{ color: colorMode === 'light' ? 'black' : 'white', bg: 'transparent' }}
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
