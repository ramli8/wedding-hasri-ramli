import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Checkbox,
  CheckboxGroup,
  Stack,
  Text,
  useColorMode,
  Divider,
  Badge,
  Box,
  HStack,
} from '@chakra-ui/react';
import PermissionAPI, { RolePermission } from '../../permissions/services/PermissionAPI';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  roleName: string;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  roleId,
  roleName,
}) => {
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const permissionAPI = new PermissionAPI();
  const { colorMode } = useColorMode();

  const availableUrls = permissionAPI.getAvailableUrls();

  useEffect(() => {
    if (isOpen && roleId) {
      fetchPermissions();
    }
  }, [isOpen, roleId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const permissions = await permissionAPI.getRolePermissions(roleId);
      const urls = permissions.map(p => p.url_pattern);
      setSelectedUrls(urls);
    } catch (error: any) {
      showErrorAlert('Gagal memuat permissions', error.message, colorMode);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await permissionAPI.updateRolePermissions(roleId, selectedUrls);
      showSuccessAlert('Permissions berhasil diupdate', colorMode);
      onClose();
    } catch (error: any) {
      showErrorAlert('Gagal update permissions', error.message, colorMode);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckboxChange = (values: string[]) => {
    // If wildcard (*) is selected, only keep wildcard
    if (values.includes('*') && !selectedUrls.includes('*')) {
      setSelectedUrls(['*']);
    } else if (values.includes('*')) {
      setSelectedUrls(values);
    } else {
      // Remove wildcard if other items are selected
      setSelectedUrls(values.filter(v => v !== '*'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius={{ base: 0, md: '16px' }}
        mx={{ base: 0, md: 4 }}
      >
        <ModalHeader
          fontSize={{ base: 'lg', md: 'xl' }}
          fontWeight="600"
          pb={3}
          borderBottom="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
        >
          <HStack spacing={3}>
            <Text>Kelola Permissions</Text>
            <Badge 
              colorScheme="purple" 
              variant="subtle"
              fontSize="10px" 
              px={2} 
              py={0.5} 
              borderRadius="full"
              textTransform="uppercase"
              letterSpacing="wider"
              fontWeight="700"
            >
              {roleName}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
                Pilih halaman yang dapat diakses oleh role ini:
              </Text>
              
              <CheckboxGroup
                value={selectedUrls}
                onChange={handleCheckboxChange}
              >
                <Stack direction="column" spacing={3}>
                  {availableUrls.map((item) => (
                    <Box
                      key={item.url}
                      p={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={colorMode === 'light' ? 'gray.100' : 'gray.700'}
                      _hover={{
                        bg: colorMode === 'light' ? 'gray.50' : 'gray.700',
                        borderColor: colorMode === 'light' ? 'gray.300' : 'gray.600',
                      }}
                      transition="all 0.2s"
                    >
                      <Checkbox
                        value={item.url}
                        isDisabled={selectedUrls.includes('*') && item.url !== '*'}
                        colorScheme="blue"
                        width="full"
                      >
                        <VStack align="start" spacing={0} ml={2}>
                          <Text fontWeight="600" fontSize="sm">{item.label}</Text>
                          <Text fontSize="xs" color="gray.500">{item.url}</Text>
                        </VStack>
                      </Checkbox>
                    </Box>
                  ))}
                </Stack>
              </CheckboxGroup>

              {selectedUrls.includes('*') && (
                <Box 
                  p={3} 
                  bg={colorMode === 'light' ? 'orange.50' : 'orange.900'} 
                  borderRadius="md"
                  border="1px solid"
                  borderColor={colorMode === 'light' ? 'orange.200' : 'orange.700'}
                >
                  <HStack spacing={2}>
                    <Text fontSize="lg">⚠️</Text>
                    <Text fontSize="sm" color={colorMode === 'light' ? 'orange.800' : 'orange.200'} fontWeight="500">
                      <strong>Full Access</strong> dipilih - role ini dapat mengakses semua halaman tanpa batasan.
                    </Text>
                  </HStack>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter
          borderTop="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
          pt={4}
        >
          <HStack spacing={3} width="full" justify="flex-end">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              isDisabled={saving}
              minW="120px"
              h="40px"
              borderRadius="10px"
              fontSize="14px"
            >
              Batal
            </Button>
            <PrimaryButton
              onClick={handleSave}
              isLoading={saving}
              loadingText="Menyimpan..."
            >
              Simpan
            </PrimaryButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PermissionModal;
