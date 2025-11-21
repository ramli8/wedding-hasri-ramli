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
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react';
import PermissionAPI, { RolePermission } from '../../permissions/services/PermissionAPI';
import RoleAPI, { Role } from '../../roles/services/RoleAPI';

interface PermissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: RolePermission | null;
}

const PermissionFormModal: React.FC<PermissionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [roleId, setRoleId] = useState('');
  const [urlPattern, setUrlPattern] = useState('');
  const [description, setDescription] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const permissionAPI = new PermissionAPI();
  const roleAPI = new RoleAPI();
  const toast = useToast();
  const availableUrls = permissionAPI.getAvailableUrls();

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
      if (initialData) {
        setRoleId(initialData.role_id);
        setUrlPattern(initialData.url_pattern);
        setDescription(initialData.description || '');
      } else {
        setRoleId('');
        setUrlPattern('');
        setDescription('');
      }
    }
  }, [isOpen, initialData]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await roleAPI.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!roleId || !urlPattern) {
      toast({
        title: 'Error',
        description: 'Role dan URL Pattern harus diisi',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setSaving(true);
      if (initialData) {
        await permissionAPI.updatePermission(initialData.id, {
          role_id: roleId,
          url_pattern: urlPattern,
          description,
        });
        toast({ title: 'Permission berhasil diupdate', status: 'success', duration: 3000 });
      } else {
        await permissionAPI.createPermission({
          role_id: roleId,
          url_pattern: urlPattern,
          description,
        });
        toast({ title: 'Permission berhasil dibuat', status: 'success', duration: 3000 });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Gagal menyimpan permission',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{initialData ? 'Edit Permission' : 'Tambah Permission Baru'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Role</FormLabel>
              <Select
                placeholder="Pilih Role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                isDisabled={loading}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>URL Pattern</FormLabel>
              <Select
                placeholder="Pilih atau ketik URL manual di bawah"
                value={availableUrls.some(u => u.url === urlPattern) ? urlPattern : ''}
                onChange={(e) => setUrlPattern(e.target.value)}
                mb={2}
              >
                {availableUrls.map((item) => (
                  <option key={item.url} value={item.url}>
                    {item.label} ({item.url})
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Atau ketik URL pattern manual (contoh: /admin/custom)"
                value={urlPattern}
                onChange={(e) => setUrlPattern(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Deskripsi</FormLabel>
              <Textarea
                placeholder="Deskripsi permission..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Batal
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSubmit}
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

export default PermissionFormModal;
