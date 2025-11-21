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
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface RoleTableAdvanceProps {
  initialData?: Role[];
  loading?: boolean;
  onEdit: (role: Role) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onAddNew: () => void;
  onManagePermissions?: (role: Role) => void;
}

const RoleTableAdvance: React.FC<RoleTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onEdit,
  onDelete,
  onRestore,
  onAddNew,
  onManagePermissions,
}) => {
  const { colorMode } = useColorMode();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const handleDelete = (id: string) => {
    MySwal.fire({
      title: 'Hapus Role?',
      text: "Role yang dihapus akan di-soft delete!",
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

  const columns = useMemo<ColumnDef<Role, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama Role',
        cell: (info) => (
          <Text fontWeight="600" fontSize="sm" color={colorMode === 'light' ? 'black' : 'white'}>
            {info.getValue()}
          </Text>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'description',
        header: 'Deskripsi',
        cell: (info) => (
          <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
            {info.getValue() || '-'}
          </Text>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'deleted_at',
        header: 'Status',
        cell: (info) => {
          const isDeleted = info.getValue();
          return (
            <Badge 
              variant="outline"
              colorScheme={colorMode === 'light' ? 'blackAlpha' : 'whiteAlpha'}
              borderColor={colorMode === 'light' ? 'black' : 'white'}
              color={colorMode === 'light' ? 'black' : 'white'}
            >
              {isDeleted ? 'Dihapus' : 'Aktif'}
            </Badge>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const role = info.row.original;
          const isDeleted = role.deleted_at;
          
          return (
            <HStack spacing={1}>
              {!isDeleted && (
                <>
                  <IconButton
                    aria-label="Kelola permissions"
                    icon={
                      <Icon viewBox="0 0 24 24" width="18px" height="18px">
                        <path
                          fill="currentColor"
                          d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.1 14.8,9.5V11C15.4,11 16,11.6 16,12.3V15.8C16,16.4 15.4,17 14.7,17H9.2C8.6,17 8,16.4 8,15.7V12.2C8,11.6 8.6,11 9.2,11V9.5C9.2,8.1 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V11H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z"
                        />
                      </Icon>
                    }
                    size="sm"
                    variant="ghost"
                    color={colorMode === 'light' ? 'black' : 'white'}
                    _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200' }}
                    onClick={() => onManagePermissions?.(role)}
                    borderRadius="full"
                    title="Kelola Permissions"
                  />
                  <IconButton
                    aria-label="Edit role"
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
                    onClick={() => onEdit(role)}
                    borderRadius="full"
                  />
                  <IconButton
                    aria-label="Hapus role"
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
                    onClick={() => handleDelete(role.id)}
                    borderRadius="full"
                  />
                </>
              )}
              {isDeleted && (
                <IconButton
                  aria-label="Restore role"
                  icon={
                    <Icon viewBox="0 0 24 24" width="18px" height="18px">
                      <path
                        fill="currentColor"
                        d="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z"
                      />
                    </Icon>
                  }
                  size="sm"
                  variant="ghost"
                  color={colorMode === 'light' ? 'black' : 'white'}
                  _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200' }}
                  onClick={() => onRestore(role.id)}
                  borderRadius="full"
                />
              )}
            </HStack>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [colorMode, onEdit, onDelete, onRestore, onManagePermissions]
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
              Daftar Role
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
              <Text>Tambah Role</Text>
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

export default RoleTableAdvance;
