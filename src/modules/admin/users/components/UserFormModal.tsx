'use client';

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
  useColorMode,
  CheckboxGroup,
  Stack,
  Checkbox,
  Badge,
  HStack,
  Text,
  Box,
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
  const { colorMode } = useColorMode();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role_ids: [] as string[],
  });
  const isEdit = !!user;

  const initialRef = React.useRef(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      scrollBehavior="inside"
      isCentered
      initialFocusRef={isEdit ? undefined : initialRef}
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
          <HStack spacing={3}>
            <Text>{isEdit ? 'Edit User' : 'Tambah User'}</Text>
            {isEdit && (
              <Badge
                colorScheme="orange"
                variant="subtle"
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="full"
                textTransform="uppercase"
                letterSpacing="wider"
                fontWeight="800"
              >
                Edit Mode
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton top={6} right={6} />
        <ModalBody py={4} px={6}>
          <Box as="form" id="user-form" onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  mb={3}
                >
                  Nama Lengkap
                </FormLabel>
                <Input
                  ref={initialRef}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  size="lg"
                  variant="filled"
                  bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                  borderRadius="16px"
                  fontSize="md"
                  fontWeight="500"
                  _hover={{
                    bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
                  }}
                  _focus={{
                    bg: colorMode === 'light' ? 'white' : 'gray.800',
                    borderColor:
                      colorMode === 'light' ? 'blue.500' : 'blue.300',
                    boxShadow: 'none',
                  }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  mb={3}
                >
                  Username
                </FormLabel>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  size="lg"
                  variant="filled"
                  bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                  borderRadius="16px"
                  fontSize="md"
                  fontWeight="500"
                  _hover={{
                    bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
                  }}
                  _focus={{
                    bg: colorMode === 'light' ? 'white' : 'gray.800',
                    borderColor:
                      colorMode === 'light' ? 'blue.500' : 'blue.300',
                    boxShadow: 'none',
                  }}
                />
              </FormControl>

              <FormControl isRequired={!user}>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  mb={3}
                >
                  Password
                  {user && (
                    <Text
                      as="span"
                      fontSize="xs"
                      fontWeight="normal"
                      color={colorMode === 'light' ? 'gray.500' : 'gray.500'}
                      ml={2}
                    >
                      (Kosongkan jika tidak diubah)
                    </Text>
                  )}
                </FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  size="lg"
                  variant="filled"
                  bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                  borderRadius="16px"
                  fontSize="md"
                  fontWeight="500"
                  _hover={{
                    bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
                  }}
                  _focus={{
                    bg: colorMode === 'light' ? 'white' : 'gray.800',
                    borderColor:
                      colorMode === 'light' ? 'blue.500' : 'blue.300',
                    boxShadow: 'none',
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  fontSize="sm"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  mb={3}
                >
                  Roles
                </FormLabel>
                <CheckboxGroup
                  value={formData.role_ids}
                  onChange={(vals) =>
                    setFormData({ ...formData, role_ids: vals as string[] })
                  }
                >
                  <Stack direction="column" spacing={3}>
                    {roles.map((role) => (
                      <Checkbox
                        key={role.id}
                        value={role.id}
                        colorScheme="blue"
                        size="md"
                      >
                        <Text fontSize="sm" fontWeight="500">
                          {role.name}
                        </Text>
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>
            </VStack>
          </Box>
        </ModalBody>

        <ModalFooter pb={6} px={6} pt={4}>
          <HStack spacing={3} width="full" justify="flex-end">
            <Button
              variant="ghost"
              onClick={onClose}
              isDisabled={isLoading}
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
              type="submit"
              form="user-form"
              isLoading={isLoading}
              h="50px"
              px={8}
              borderRadius="16px"
              fontSize="sm"
              fontWeight="600"
            >
              {isEdit ? 'Simpan Perubahan' : 'Tambah Data'}
            </PrimaryButton>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserFormModal;
