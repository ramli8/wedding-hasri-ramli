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
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { RolePermission } from '../../permissions/services/PermissionAPI';

const MySwal = withReactContent(Swal);

export type PermissionWithRole = RolePermission & { roles: { name: string } };

interface PermissionTableAdvanceProps {
  initialData?: PermissionWithRole[];
  loading?: boolean;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onEdit: (permission: PermissionWithRole) => void;
}

const PermissionTableAdvance: React.FC<PermissionTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onDelete,
  onRestore,
  onEdit,
}) => {
  const { colorMode } = useColorMode();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const handleDelete = (id: string) => {
    MySwal.fire({
      title: 'Hapus Permission?',
      text: "Permission yang dihapus akan di-soft delete!",
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

  const columns = useMemo<ColumnDef<PermissionWithRole, any>[]>(
    () => [
      {
        accessorKey: 'roles.name',
        header: 'Role',
        cell: (info) => (
          <Badge 
            variant="outline" 
            colorScheme={colorMode === 'light' ? 'blackAlpha' : 'whiteAlpha'}
            borderColor={colorMode === 'light' ? 'black' : 'white'}
            color={colorMode === 'light' ? 'black' : 'white'}
          >
            {info.getValue()}
          </Badge>
        ),
        enableSorting: true,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'url_pattern',
        header: 'URL Pattern',
        cell: (info) => (
          <Text fontWeight="600" fontSize="sm" color={colorMode === 'light' ? 'black' : 'white'}>
            {info.getValue()}
          </Text>
        ),
        enableSorting: true,
        enableColumnFilter: true,
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
              colorScheme={isDeleted ? 'gray' : 'blackAlpha'}
              borderColor={colorMode === 'light' ? 'black' : 'white'}
              color={colorMode === 'light' ? 'black' : 'white'}
              opacity={isDeleted ? 0.5 : 1}
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
          const permission = info.row.original;
          const isDeleted = permission.deleted_at;
          
          return (
            <HStack spacing={1}>
              {!isDeleted ? (
                <>
                  <IconButton
                    aria-label="Edit permission"
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
                    onClick={() => onEdit(permission)}
                    borderRadius="full"
                  />
                  <IconButton
                    aria-label="Hapus permission"
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
                    onClick={() => handleDelete(permission.id)}
                    borderRadius="full"
                  />
                </>
              ) : (
                <IconButton
                  aria-label="Restore permission"
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
                  onClick={() => onRestore(permission.id)}
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
    [colorMode, onDelete, onRestore, onEdit]
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
              Daftar Permissions
            </Text>
            <Text fontSize="sm" color="gray.500">
              Total Data: {initialData.length}
            </Text>
          </VStack>
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

export default PermissionTableAdvance;
