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
  useToast,
  Divider,
  Badge,
} from '@chakra-ui/react';
import PermissionAPI, { RolePermission } from '../../permissions/services/PermissionAPI';

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
  const toast = useToast();

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
      toast({
        title: 'Gagal memuat permissions',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await permissionAPI.updateRolePermissions(roleId, selectedUrls);
      toast({
        title: 'Permissions berhasil diupdate',
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Gagal update permissions',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Kelola Permissions - <Badge colorScheme="purple">{roleName}</Badge>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Pilih halaman yang dapat diakses oleh role ini:
              </Text>
              
              <CheckboxGroup
                value={selectedUrls}
                onChange={handleCheckboxChange}
              >
                <Stack direction="column" spacing={3}>
                  {availableUrls.map((item) => (
                    <Checkbox
                      key={item.url}
                      value={item.url}
                      isDisabled={selectedUrls.includes('*') && item.url !== '*'}
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="500">{item.label}</Text>
                        <Text fontSize="xs" color="gray.500">{item.url}</Text>
                      </VStack>
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>

              {selectedUrls.includes('*') && (
                <>
                  <Divider />
                  <Text fontSize="sm" color="orange.600" fontWeight="500">
                    ⚠️ Full Access dipilih - role ini dapat mengakses semua halaman
                  </Text>
                </>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Batal
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSave}
            isLoading={saving}
            loadingText="Menyimpan..."
          >
            Simpan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PermissionModal;
