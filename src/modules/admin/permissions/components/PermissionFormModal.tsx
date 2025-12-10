import React, { useState, useEffect, useCallback } from 'react';
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
  useColorMode,
  Text,
  Box,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import PermissionAPI, {
  RolePermission,
} from '../../permissions/services/PermissionAPI';
import RoleAPI from '../../roles/services/RoleAPI';
import { Role } from '../../roles/types/Role.types';
import {
  showSuccessAlert,
  showErrorAlert,
  showAlert,
} from '@/utils/sweetalert';

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
  const [roleAPI] = useState(() => new RoleAPI());
  const { colorMode } = useColorMode();
  const availableUrls = permissionAPI.getAvailableUrls();

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await roleAPI.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      setLoading(false);
    }
  }, [roleAPI]);

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
  }, [isOpen, initialData, fetchRoles]);

  const handleSubmit = async () => {
    if (!roleId || !urlPattern) {
      showAlert({
        title: 'Error',
        text: 'Role dan URL Pattern harus diisi',
        icon: 'error',
        colorMode,
        showConfirmButton: true,
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
        showSuccessAlert('Data berhasil diperbarui', colorMode);
      } else {
        await permissionAPI.createPermission({
          role_id: roleId,
          url_pattern: urlPattern,
          description,
        });
        showSuccessAlert('Data berhasil ditambahkan', colorMode);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      showErrorAlert('Gagal menyimpan', error.message, colorMode);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: 'full', md: 'xl' }}
      isCentered
    >
      <ModalOverlay />
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
            <Text>
              {initialData ? 'Edit Permission' : 'Tambah Permission Baru'}
            </Text>
            {initialData && (
              <Badge
                colorScheme="blue"
                variant="subtle"
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="full"
                textTransform="uppercase"
                letterSpacing="wider"
                fontWeight="700"
                bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
                color={colorMode === 'light' ? 'blue.600' : 'blue.200'}
                border="1px solid"
                borderColor={colorMode === 'light' ? 'blue.100' : 'blue.800'}
              >
                Edit Mode
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={6}>
          <VStack spacing={5} align="stretch">
            {/* Role Selection */}
            <FormControl isRequired>
              <FormLabel
                fontSize="sm"
                fontWeight="600"
                mb={2}
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
              >
                Role
              </FormLabel>
              <Select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                isDisabled={loading}
                size="lg"
                borderRadius="12px"
                focusBorderColor={
                  colorMode === 'light' ? 'blue.500' : 'blue.300'
                }
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* URL Pattern Selection */}
            <FormControl isRequired>
              <FormLabel
                fontSize="sm"
                fontWeight="600"
                mb={2}
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
              >
                URL Pattern
              </FormLabel>
              <VStack spacing={2} align="stretch">
                <Select
                  placeholder="Pilih dari daftar URL yang tersedia"
                  value={
                    availableUrls.some((u) => u.url === urlPattern)
                      ? urlPattern
                      : ''
                  }
                  onChange={(e) => setUrlPattern(e.target.value)}
                  size="lg"
                  borderRadius="12px"
                  focusBorderColor={
                    colorMode === 'light' ? 'blue.500' : 'blue.300'
                  }
                >
                  {availableUrls.map((item) => (
                    <option key={item.url} value={item.url}>
                      {item.label} ({item.url})
                    </option>
                  ))}
                </Select>

                <Box position="relative">
                  <Input
                    value={urlPattern}
                    onChange={(e) => setUrlPattern(e.target.value)}
                    size="lg"
                    borderRadius="12px"
                    focusBorderColor={
                      colorMode === 'light' ? 'blue.500' : 'blue.300'
                    }
                    fontFamily="mono"
                    fontSize="sm"
                  />
                </Box>
              </VStack>
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel
                fontSize="sm"
                fontWeight="600"
                mb={2}
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
              >
                Deskripsi
              </FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                resize="vertical"
                size="lg"
                borderRadius="12px"
                focusBorderColor={
                  colorMode === 'light' ? 'blue.500' : 'blue.300'
                }
              />
            </FormControl>
          </VStack>
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
              h="48px"
              borderRadius="12px"
              fontSize="14px"
            >
              Batal
            </Button>
            <PrimaryButton
              onClick={handleSubmit}
              isLoading={saving}
              minW="120px"
              h="48px"
              borderRadius="12px"
            >
              {initialData ? 'Perbarui' : 'Simpan'}
            </PrimaryButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PermissionFormModal;
