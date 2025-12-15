import React, { useContext, useState } from 'react';
import { Text, Button, Box, useColorMode, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Select, Flex, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Avatar, HStack, VStack } from '@chakra-ui/react';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import AuthAPI from '@/modules/auth/services/AuthAPI';
import { useRouter } from 'next/router';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showLogoutAlert } from '@/utils/sweetalert';

interface UserProfileActionsProps {
  mobileSimplified?: boolean;
}

const UserProfileActions = ({ mobileSimplified = false }: UserProfileActionsProps) => {
  const { colorMode } = useColorMode();
  const accountInfo = useContext(AccountInfoContext);
  const router = useRouter();
  const authAPI = new AuthAPI();
  const toast = useToast();

  // Role Switcher State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(accountInfo?.activeRole || '');

  const activeRoleName = accountInfo?.role?.find(r => r.id === accountInfo?.activeRole)?.name || 'Role';

  const handleLogout = async () => {
    const result = await showLogoutAlert(colorMode);

    if (result.isConfirmed) {
      authAPI.logout();
      router.push('/admin/login');
    }
  };

  const handleSwitchRole = () => {
    if (!selectedRole) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_role_id', selectedRole);
    }
    toast({ title: 'Role berhasil diganti', status: 'success', duration: 2000 });
    window.location.href = '/admin/dashboard';
  };

  // Mobile simplified version - just avatar
  if (mobileSimplified) {
    return (
      <Avatar 
        size="sm"
        name={accountInfo?.name} 
        bgGradient="linear(to-r, blue.400, purple.500)"
        color="white"
        icon={<MaterialIcon name="person" size={20} />}
      />
    );
  }

  return (
    <>
        <Menu placement="bottom-end">
          <MenuButton 
            as={Button} 
            rounded="full" 
            variant="ghost" 
            cursor="pointer" 
            minW={0}
            p={{ base: 1, md: 1 }}
            pl={{ base: 1, md: 4 }}
            h="auto"
            _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200' }}
          >
            <HStack spacing={{ base: 0, md: 3 }}>
              <VStack align="end" spacing={0} display={{ base: 'none', sm: 'flex' }}>
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color={colorMode === 'light' ? 'gray.800' : 'white'} noOfLines={1}>
                  {accountInfo?.name || 'User'}
                </Text>
                <Text fontSize="xs" color={colorMode === 'light' ? 'gray.500' : 'gray.400'} noOfLines={1}>
                  {activeRoleName}
                </Text>
              </VStack>
              <Avatar 
                size={{ base: 'sm', md: 'md' }}
                name={accountInfo?.name} 
                bgGradient="linear(to-r, blue.400, purple.500)"
                color="white"
                icon={<MaterialIcon name="person" size={24} />}
              />
            </HStack>
          </MenuButton>
          <MenuList 
            bg={colorMode === 'light' ? 'white' : 'gray.800'} 
            borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
            boxShadow="lg"
            p={2}
          >
            <Box px={3} py={2} mb={2}>
              <Text fontWeight="bold" color={colorMode === 'light' ? 'gray.800' : 'white'}>
                {accountInfo?.name || 'User'}
              </Text>
              <Text fontSize="xs" color={colorMode === 'light' ? 'gray.500' : 'gray.400'}>
                {activeRoleName}
              </Text>
            </Box>
            <MenuDivider />
            {accountInfo?.role && accountInfo.role.length > 1 && (
              <MenuItem 
                icon={<MaterialIcon name="swap_horiz" size={18} />} 
                onClick={() => {
                  setSelectedRole(accountInfo?.activeRole || '');
                  setIsRoleModalOpen(true);
                }}
                borderRadius="md"
              >
                Ganti Role
              </MenuItem>
            )}
            <MenuItem 
              icon={<MaterialIcon name="logout" size={18} />} 
              onClick={handleLogout} 
              color="red.500"
              borderRadius="md"
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>

      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent bg={colorMode === 'light' ? 'white' : 'gray.800'} mx={4}>
          <ModalHeader>Ganti Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {accountInfo?.role && accountInfo.role.length > 0 ? (
              <Select 
                placeholder="Pilih role" 
                value={selectedRole} 
                onChange={e => setSelectedRole(e.target.value)}
              >
                {accountInfo.role.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Text color="gray.500" textAlign="center" py={4}>
                Tidak ada role tersedia. Silakan login ulang.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsRoleModalOpen(false)}>
              Batal
            </Button>
            {accountInfo?.role && accountInfo.role.length > 0 && (
              <PrimaryButton onClick={handleSwitchRole}>
                Simpan
              </PrimaryButton>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserProfileActions;
