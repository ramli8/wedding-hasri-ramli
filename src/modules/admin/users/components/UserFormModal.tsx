import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useColorModeValue,
  useColorMode,
  CheckboxGroup,
  Stack,
  Checkbox,
  Badge,
  HStack,
  Text,
} from '@chakra-ui/react';
import { User, Role } from '../services/UserAPI';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    username: string;
    password: string;
    role_ids: string[];
  }) => Promise<void>;
  user?: User;
  roles: Role[];
  isLoading?: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  roles,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role_ids: [] as string[],
  });

  const { colorMode } = useColorMode();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        username: user.username,
        password: '',
        role_ids: user.roles?.map((r) => r.id) || [],
      });
    } else {
      setFormData({ name: '', username: '', password: '', role_ids: [] });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await onSubmit(formData);
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
            <Text>{user ? 'Edit User' : 'Tambah User Baru'}</Text>
            {user && (
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
          <VStack spacing={5}>
            <FormControl isRequired>
              <FormLabel fontWeight="500">Nama Lengkap</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                size="lg"
                borderRadius="12px"
                focusBorderColor={
                  colorMode === 'light' ? 'blue.500' : 'blue.300'
                }
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontWeight="500">Username</FormLabel>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                size="lg"
                borderRadius="12px"
                focusBorderColor={
                  colorMode === 'light' ? 'blue.500' : 'blue.300'
                }
              />
            </FormControl>

            <FormControl isRequired={!user}>
              <FormLabel fontWeight="500">
                Password
                {user && (
                  <span
                    style={{
                      fontWeight: 'normal',
                      fontSize: '0.85em',
                      color: 'gray',
                    }}
                  >
                    {' '}
                    (Kosongkan jika tidak diubah)
                  </span>
                )}
              </FormLabel>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                size="lg"
                borderRadius="12px"
                focusBorderColor={
                  colorMode === 'light' ? 'blue.500' : 'blue.300'
                }
              />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="500" mb={3}>
                Roles
              </FormLabel>
              <CheckboxGroup
                value={formData.role_ids}
                onChange={(vals) =>
                  setFormData({ ...formData, role_ids: vals as string[] })
                }
              >
                <Stack direction="column" spacing={2}>
                  {roles.map((role) => (
                    <Checkbox key={role.id} value={role.id} colorScheme="blue">
                      {role.name}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter
          borderTop="1px solid"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
          py={4}
        >
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            spacing={4}
            w="full"
            justify="flex-end"
          >
            <Button
              onClick={onClose}
              minW="120px"
              h="48px"
              borderRadius="12px"
              fontSize="14px"
              variant="outline"
            >
              Batal
            </Button>
            <PrimaryButton
              onClick={handleSubmit}
              isLoading={isLoading}
              minW="120px"
              h="48px"
              borderRadius="12px"
            >
              {user ? 'Perbarui' : 'Simpan'}
            </PrimaryButton>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserFormModal;
