import React, { useMemo, useState, useContext } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Text,
  Icon,
  useColorMode,
  VStack,
  Badge,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { Role } from '../services/RoleAPI';
import TableAdvance from '@/components/organisms/TableAdvance';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';
import { showConfirmationAlert } from '@/utils/sweetalert';

interface RoleTableAdvanceProps {
  initialData?: Role[];
  loading?: boolean;
  onEdit: (role: Role) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onAddNew: () => void;
  onManagePermissions?: (role: Role) => void;
  headerAction?: React.ReactNode;
}

const RoleTableAdvance: React.FC<RoleTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onEdit,
  onDelete,
  onRestore,
  onAddNew,
  onManagePermissions,
  headerAction,
}) => {
  const { colorMode } = useColorMode();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { colorPref } = useContext(AppSettingContext);

  const handleDelete = async (id: string) => {
    const result = await showConfirmationAlert(
      'Konfirmasi Hapus Data?',
      'Data yang dihapus akan di-soft delete!',
      'Ya, Hapus!',
      colorMode,
      true
    );

    if (result.isConfirmed) {
      onDelete(id);
    }
  };

  const columns = useMemo<ColumnDef<Role, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama Role',
        cell: (info) => {
          const role = info.row.original;
          return (
            <HStack spacing={2}>
              <Badge 
                px={3}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight="600"
                textTransform="none"
                bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
                color={colorMode === 'light' ? 'blue.700' : 'blue.200'}
                border="1px solid"
                borderColor={colorMode === 'light' ? 'blue.200' : 'blue.700'}
              >
                {info.getValue()}
              </Badge>
              {role.is_default && (
                <Badge
                  px={2}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="700"
                  textTransform="uppercase"
                  bg={colorMode === 'light' ? 'green.50' : 'green.900'}
                  color={colorMode === 'light' ? 'green.700' : 'green.200'}
                  border="1px solid"
                  borderColor={colorMode === 'light' ? 'green.200' : 'green.700'}
                >
                  Default
                </Badge>
              )}
            </HStack>
          );
        },
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
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="600"
              textTransform="none"
              bg={isDeleted 
                ? (colorMode === 'light' ? 'gray.100' : 'gray.700')
                : (colorMode === 'light' ? 'green.50' : 'green.900')
              }
              color={isDeleted
                ? (colorMode === 'light' ? 'gray.600' : 'gray.400')
                : (colorMode === 'light' ? 'green.700' : 'green.200')
              }
              border="1px solid"
              borderColor={isDeleted
                ? (colorMode === 'light' ? 'gray.300' : 'gray.600')
                : (colorMode === 'light' ? 'green.200' : 'green.700')
              }
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
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                rightIcon={<MaterialIcon name="expand_more" size={16} variant="rounded" />}
                color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                bg={colorMode === 'light' ? 'white' : 'gray.800'}
                borderColor={colorMode === 'light' ? 'gray.300' : 'gray.600'}
                fontWeight="500"
                fontSize="sm"
                _hover={{ 
                  bg: colorMode === 'light' ? 'gray.50' : 'gray.700',
                  borderColor: colorMode === 'light' ? 'gray.400' : 'gray.500',
                }}
                _active={{
                  bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
                  borderColor: colorMode === 'light' ? 'gray.400' : 'gray.500',
                }}
                borderRadius="8px"
                px={3}
                h="32px"
              >
                Aksi
              </MenuButton>
              <MenuList
                borderRadius="10px"
                border="1px solid"
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                boxShadow="lg"
                py={1}
              >
                {!isDeleted ? (
                  <>
                    <MenuItem
                      icon={<MaterialIcon name="edit" size={18} variant="rounded" />}
                      onClick={() => onEdit(role)}
                      fontSize="sm"
                      borderRadius="6px"
                      mx={1}
                      _hover={{
                        bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
                      }}
                    >
                      Edit
                    </MenuItem>
                    <MenuItem
                      icon={<MaterialIcon name="security" size={18} variant="rounded" />}
                      onClick={() => onManagePermissions?.(role)}
                      fontSize="sm"
                      borderRadius="6px"
                      mx={1}
                      _hover={{
                        bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
                      }}
                    >
                      Permissions
                    </MenuItem>
                    <MenuItem
                      icon={<MaterialIcon name="delete" size={18} variant="rounded" />}
                      onClick={() => handleDelete(role.id)}
                      fontSize="sm"
                      color={colorMode === 'light' ? 'red.600' : 'red.400'}
                      borderRadius="6px"
                      mx={1}
                      _hover={{
                        bg: colorMode === 'light' ? 'red.50' : 'red.900',
                      }}
                    >
                      Hapus
                    </MenuItem>
                  </>
                ) : (
                  <MenuItem
                    icon={<MaterialIcon name="restore_from_trash" size={18} variant="rounded" />}
                    onClick={() => onRestore(role.id)}
                    fontSize="sm"
                    color={colorMode === 'light' ? 'green.600' : 'green.400'}
                    borderRadius="6px"
                    mx={1}
                    _hover={{
                      bg: colorMode === 'light' ? 'green.50' : 'green.900',
                    }}
                  >
                    Pulihkan
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
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
        borderLeft="4px solid"
        borderLeftColor={colorMode === 'light' ? `${colorPref}.500` : `${colorPref}Dim.500`}
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
        <Flex 
          mb={6} 
          justify="space-between" 
          align="center"
          direction={{ base: 'column', md: 'row' }}
          gap={3}
        >
          {/* Add Button on Left */}
          {headerAction && (
            <Box flexShrink={0} w={{ base: 'full', md: 'auto' }}>
              {headerAction}
            </Box>
          )}
          
          {/* Search Input on Right */}
          <InputGroup size="md" maxW={{ base: 'full', md: '350px' }} w={{ base: 'full', md: 'auto' }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              value={columnFilters.find(f => f.id === 'global')?.value as string ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setColumnFilters(value ? [{ id: 'global', value }] : []);
              }}
              placeholder="Cari data..."
              borderRadius="10px"
              bg={colorMode === 'light' ? 'white' : 'gray.800'}
              border="1px solid"
              borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
              _hover={{
                borderColor: colorMode === 'light' ? `${colorPref}.600` : `${colorPref}Dim.600`,
              }}
              _focus={{
                borderColor: colorMode === 'light' ? `${colorPref}.600` : `${colorPref}Dim.600`,
                outline: 'none',
              }}
              fontSize="sm"
              fontWeight="500"
              transition="all 0.25s"
              h="40px"
            />
          </InputGroup>
        </Flex>
        
        <TableAdvance 
          columns={columns} 
          data={initialData}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          hideSearch
        />
      </Box>
    </Box>
  );
};

export default RoleTableAdvance;
