import React, { useMemo, useState } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Text,
  Icon,
  useColorMode,
  VStack,
  Badge,
  Wrap,
  WrapItem,
  Button,
} from '@chakra-ui/react';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import TableAdvance from '@/components/organisms/TableAdvance';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  roles?: Role[];
  created_at?: string;
}

interface UserTableAdvanceProps {
  initialData?: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onCopyMagicLink?: (user: User) => void;
}

const UserTableAdvance: React.FC<UserTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onEdit,
  onDelete,
  onAddNew,
  onCopyMagicLink,
}) => {
  const { colorMode } = useColorMode();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const handleDelete = (id: string) => {
    MySwal.fire({
      title: 'Hapus User?',
      text: "Data user yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      background: colorMode === 'light' ? '#fff' : '#1A202C',
      color: colorMode === 'light' ? '#1A202C' : '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(id);
      }
    });
  };

  const columns = useMemo<ColumnDef<User, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: (info) => (
          <Text fontWeight="600" fontSize="sm" color={colorMode === 'light' ? 'black' : 'white'}>
            {info.getValue()}
          </Text>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'username',
        header: 'Username',
        cell: (info) => (
          <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
            {info.getValue()}
          </Text>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'roles',
        header: 'Roles',
        cell: (info) => {
          const roles = info.getValue() as Role[];
          return (
            <Wrap spacing={1}>
              {roles?.map((role) => (
                <WrapItem key={role.id}>
                  <Badge 
                    variant="outline"
                    colorScheme={colorMode === 'light' ? 'blackAlpha' : 'whiteAlpha'}
                    borderColor={colorMode === 'light' ? 'black' : 'white'}
                    color={colorMode === 'light' ? 'black' : 'white'}
                    fontSize="xs"
                  >
                    {role.name}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        id: 'magic_link',
        header: 'Magic Link',
        cell: (info) => {
          const user = info.row.original;
          return onCopyMagicLink ? (
            <Button
              size="xs"
              variant="ghost"
              color={colorMode === 'light' ? 'black' : 'white'}
              _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200' }}
              onClick={() => onCopyMagicLink(user)}
            >
              Copy Link
            </Button>
          ) : null;
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const user = info.row.original;
          return (
            <HStack spacing={1}>
              <IconButton
                aria-label="Edit user"
                icon={
                  <Icon viewBox="0 0 24 24" width="18px" height="18px">
                    <path
                      fill="currentColor"
                      d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
                    />
                  </Icon>
                }
                size="sm"
                variant="ghost"
                color={colorMode === 'light' ? 'black' : 'white'}
                _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200' }}
                onClick={() => onEdit(user)}
                borderRadius="full"
              />
              <IconButton
                aria-label="Hapus user"
                icon={
                  <Icon viewBox="0 0 24 24" width="18px" height="18px">
                    <path
                      fill="currentColor"
                      d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                    />
                  </Icon>
                }
                size="sm"
                variant="ghost"
                color={colorMode === 'light' ? 'black' : 'white'}
                _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200' }}
                onClick={() => handleDelete(user.id)}
                borderRadius="full"
              />
            </HStack>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [colorMode, onEdit, onDelete, onCopyMagicLink]
  );

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box 
        pos="relative"
        bg={colorMode === 'light' ? 'white' : 'black'}
        borderRadius="24px"
        p={6}
        border="1px solid"
        borderColor={colorMode === 'light' ? 'gray.200' : 'gray.800'}
        _before={{
          content: '""',
          pos: "absolute",
          top: "43px",
          left: "32px",
          right: "32px",
          bottom: "-43px",
          zIndex: "-1",
          background: colorMode == "light" ? "#e3e6ec" : "#000",
          opacity: colorMode == "light" ? "0.91" : "0.51",
          filter: "blur(86.985px)",
          borderRadius: "24px",
        }}
      >
        <Box mb={8} display="flex" flexDirection={{ base: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ base: 'start', md: 'center' }} gap={4}>
          <VStack align="start" spacing={1}>
            <Text 
              fontSize="2xl" 
              fontWeight="800"
              letterSpacing="-0.5px"
              color={colorMode === 'light' ? 'black' : 'white'}
            >
              Daftar User
            </Text>
            <Text fontSize="sm" color="gray.500">
              Total Data: {initialData.length}
            </Text>
          </VStack>
          <PrimaryButton onClick={onAddNew} w="auto">
            <HStack spacing={2} justify="center">
              <Icon viewBox="0 0 24 24" width="20px" height="20px" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </Icon>
              <Text>Tambah User</Text>
            </HStack>
          </PrimaryButton>
        </Box>

        <TableAdvance 
          columns={columns} 
          data={initialData}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      </Box>
    </Box>
  );
};

export default UserTableAdvance;
