import React, { useMemo, useState } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Text,
  useColorMode,
  VStack,
  Badge,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import TableAdvance from '@/components/organisms/TableAdvance';
import { RolePermission } from '../../permissions/services/PermissionAPI';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';
import { useContext } from 'react';

export type PermissionWithRole = RolePermission & { roles: { name: string } };

interface PermissionTableAdvanceProps {
  initialData?: PermissionWithRole[];
  loading?: boolean;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onEdit: (permission: PermissionWithRole) => void;
  headerAction?: React.ReactNode;
}

const PermissionTableAdvance: React.FC<PermissionTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onDelete,
  onRestore,
  onEdit,
  headerAction,
}) => {
  const { colorMode } = useColorMode();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { colorPref } = useContext(AppSettingContext);

  // handleDelete removed as it is handled by parent component

  const columns = useMemo<ColumnDef<PermissionWithRole, any>[]>(
    () => [
      {
        accessorKey: 'roles.name',
        header: 'Role',
        cell: (info) => (
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
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'url_pattern',
        header: 'URL Pattern',
        cell: (info) => (
          <Box
            px={3}
            py={1.5}
            bg={colorMode === 'light' ? 'gray.50' : 'whiteAlpha.100'}
            borderRadius="lg"
            display="inline-block"
            border="1px solid"
            borderColor={colorMode === 'light' ? 'gray.100' : 'whiteAlpha.200'}
            transition="all 0.2s"
            _hover={{
              borderColor:
                colorMode === 'light' ? 'gray.300' : 'whiteAlpha.400',
              bg: colorMode === 'light' ? 'white' : 'whiteAlpha.200',
            }}
          >
            <Text
              fontFamily="mono"
              fontSize="xs"
              fontWeight="500"
              color={colorMode === 'light' ? 'gray.600' : 'gray.300'}
              letterSpacing="tight"
            >
              {info.getValue()}
            </Text>
          </Box>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'description',
        header: 'Deskripsi',
        cell: (info) => (
          <Text
            fontSize="sm"
            color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
            noOfLines={2}
          >
            {info.getValue() || (
              <Text as="span" fontStyle="italic" color="gray.400">
                Tidak ada deskripsi
              </Text>
            )}
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
              bg={
                isDeleted
                  ? colorMode === 'light'
                    ? 'gray.100'
                    : 'gray.700'
                  : colorMode === 'light'
                  ? 'green.50'
                  : 'green.900'
              }
              color={
                isDeleted
                  ? colorMode === 'light'
                    ? 'gray.600'
                    : 'gray.400'
                  : colorMode === 'light'
                  ? 'green.700'
                  : 'green.200'
              }
              border="1px solid"
              borderColor={
                isDeleted
                  ? colorMode === 'light'
                    ? 'gray.300'
                    : 'gray.600'
                  : colorMode === 'light'
                  ? 'green.200'
                  : 'green.700'
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
          const permission = info.row.original;
          const isDeleted = permission.deleted_at;

          return (
            <Menu>
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                rightIcon={
                  <MaterialIcon
                    name="expand_more"
                    size={16}
                    variant="rounded"
                  />
                }
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
                      icon={
                        <MaterialIcon name="edit" size={18} variant="rounded" />
                      }
                      onClick={() => onEdit(permission)}
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
                      icon={
                        <MaterialIcon
                          name="delete"
                          size={18}
                          variant="rounded"
                        />
                      }
                      onClick={() => onDelete(permission.id)}
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
                    icon={
                      <MaterialIcon
                        name="restore_from_trash"
                        size={18}
                        variant="rounded"
                      />
                    }
                    onClick={() => onRestore(permission.id)}
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
        bg={colorMode === 'light' ? 'white' : '#222222'}
        borderRadius="24px"
        p="32px"
        _before={{
          content: '""',
          pos: 'absolute',
          top: '43px',
          left: '32px',
          right: '32px',
          bottom: '-43px',
          zIndex: '-1',
          background: colorMode == 'light' ? '#e3e6ec' : '#000',
          opacity: colorMode == 'light' ? '0.91' : '0.51',
          filter: 'blur(86.985px)',
          borderRadius: '24px',
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
            <Box
              flexShrink={0}
              w={{ base: 'full', md: 'auto' }}
              display="flex"
              justifyContent="flex-start"
            >
              <Box w="fit-content">{headerAction}</Box>
            </Box>
          )}

          {/* Search Input on Right */}
          <InputGroup
            size="md"
            maxW={{ base: 'full', md: '350px' }}
            w={{ base: 'full', md: 'auto' }}
          >
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              value={
                (columnFilters.find((f) => f.id === 'global')
                  ?.value as string) ?? ''
              }
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
                borderColor:
                  colorMode === 'light'
                    ? `${colorPref}.600`
                    : `${colorPref}Dim.600`,
              }}
              _focus={{
                borderColor:
                  colorMode === 'light'
                    ? `${colorPref}.600`
                    : `${colorPref}Dim.600`,
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

export default PermissionTableAdvance;
