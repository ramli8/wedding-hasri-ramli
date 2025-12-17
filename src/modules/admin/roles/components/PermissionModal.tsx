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
  Badge,
  Box,
  HStack,
} from '@chakra-ui/react';
import PermissionAPI from '../../permissions/services/PermissionAPI';
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

  // Gunakan state untuk instance PermissionAPI agar stabil
  const [permissionAPI] = useState(() => new PermissionAPI());
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
      const urls = permissions.map((p) => p.url_pattern);
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
      showSuccessAlert('Permissions berhasil diperbarui', colorMode);
      onClose();
    } catch (error: any) {
      showErrorAlert('Gagal update permissions', error.message, colorMode);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckboxChange = (values: string[]) => {
    // If wildcard (*) is selected, handle logic
    if (values.includes('*') && !selectedUrls.includes('*')) {
      // Just selected wildcard -> reset others? or keep both?
      // Usually wildcard overrides everything.
      // But let's allow multi select and just show warning
      setSelectedUrls(values);
    } else {
      setSelectedUrls(values);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      isCentered
      scrollBehavior="inside"
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
          <VStack align="start" spacing={1}>
            <Text>Kelola Permissions</Text>
            <HStack>
              <Text
                fontSize="sm"
                fontWeight="400"
                color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
              >
                Role:
              </Text>
              <Badge
                colorScheme="purple"
                variant="subtle"
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="full"
                fontWeight="700"
              >
                {roleName}
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton top={6} right={6} size="lg" />

        <ModalBody py={6} px={{ base: 4, md: 6 }}>
          {loading ? (
            <VStack py={10}>
              <Text>Loading permissions...</Text>
            </VStack>
          ) : (
            <VStack align="stretch" spacing={5}>
              <Text
                fontSize="sm"
                color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              >
                Tentukan halaman apa saja yang dapat diakses oleh role ini.
                Pilih <strong>* (Wildcard)</strong> untuk memberikan akses
                penuh.
              </Text>

              {/* Warning for Wildcard */}
              {selectedUrls.includes('*') && (
                <Box
                  p={4}
                  bg={
                    colorMode === 'light'
                      ? 'orange.50'
                      : 'rgba(237, 137, 54, 0.1)'
                  }
                  borderRadius="16px"
                  border="1px solid"
                  borderColor={
                    colorMode === 'light' ? 'orange.200' : 'orange.700'
                  }
                >
                  <HStack spacing={3} align="start">
                    <Text fontSize="xl">⚠️</Text>
                    <VStack align="start" spacing={0}>
                      <Text
                        fontWeight="700"
                        color={
                          colorMode === 'light' ? 'orange.700' : 'orange.200'
                        }
                      >
                        Akses Penuh (Super Admin)
                      </Text>
                      <Text
                        fontSize="sm"
                        color={
                          colorMode === 'light' ? 'orange.800' : 'orange.100'
                        }
                      >
                        Role ini dapat mengakses <strong>semua halaman</strong>{' '}
                        tanpa terkecuali.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              <CheckboxGroup
                value={selectedUrls}
                onChange={handleCheckboxChange}
                colorScheme="blue"
              >
                <Stack direction="column" spacing={3}>
                  {availableUrls.map((item) => {
                    const isChecked = selectedUrls.includes(item.url);
                    const isWildcard = item.url === '*';
                    const isWildcardActive = selectedUrls.includes('*');

                    // Highlight if active
                    const borderColor = isChecked
                      ? colorMode === 'light'
                        ? 'blue.400'
                        : 'blue.500'
                      : colorMode === 'light'
                      ? 'gray.100'
                      : 'gray.700';

                    const bgColor = isChecked
                      ? colorMode === 'light'
                        ? 'blue.50'
                        : 'rgba(66, 153, 225, 0.1)'
                      : colorMode === 'light'
                      ? 'white'
                      : 'gray.800';

                    return (
                      <Box
                        key={item.url}
                        as="label"
                        cursor="pointer"
                        p={4}
                        borderRadius="16px"
                        border="1px solid"
                        borderColor={borderColor}
                        bg={bgColor}
                        transition="all 0.2s"
                        _hover={{
                          borderColor:
                            colorMode === 'light' ? 'blue.300' : 'blue.400',
                          transform: 'translateY(-1px)',
                          shadow: 'sm',
                        }}
                        position="relative"
                      >
                        <HStack spacing={4} align="start">
                          <Checkbox
                            value={item.url}
                            isDisabled={isWildcardActive && !isWildcard}
                            size="lg"
                            mt={1}
                            isChecked={isChecked}
                          />
                          <VStack align="start" spacing={0.5}>
                            <Text fontWeight="600" fontSize="md">
                              {item.label}
                            </Text>
                            <CodeBadge url={item.url} colorMode={colorMode} />
                          </VStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </Stack>
              </CheckboxGroup>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter pb={6} px={6} pt={4}>
          <HStack spacing={3} width="full" justify="flex-end">
            <Button
              variant="ghost"
              onClick={onClose}
              isDisabled={saving}
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
              onClick={handleSave}
              isLoading={saving}
              loadingText="Menyimpan..."
              h="50px"
              px={8}
              borderRadius="16px"
              fontSize="sm"
              fontWeight="600"
            >
              Simpan Perubahan
            </PrimaryButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Helper component for URL badge
const CodeBadge = ({ url, colorMode }: { url: string; colorMode: string }) => (
  <Text
    as="span"
    fontFamily="monospace"
    fontSize="xs"
    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
    bg={colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100'}
    px={1.5}
    py={0.5}
    borderRadius="md"
  >
    {url}
  </Text>
);

export default PermissionModal;
