import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Text,
  useColorMode,
  VStack,
  Badge,
  Wrap,
  WrapItem,
  useColorModeValue,
  Flex,
  InputGroup,
  InputLeftElement,
  Input,
  Tooltip,
  Avatar,
} from '@chakra-ui/react';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import TableAdvance from '@/components/organisms/TableAdvance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showConfirmationAlert } from '@/utils/sweetalert';
import AppSettingContext from '@/providers/AppSettingProvider';

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
  onAddNew?: () => void; // Deprecated, use headerAction
  onCopyMagicLink?: (user: User) => void;
  headerAction?: React.ReactNode;
}

const UserTableAdvance: React.FC<UserTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onEdit,
  onDelete,
  onCopyMagicLink,
  headerAction,
}) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');

  const handleDelete = useCallback(
    async (id: string) => {
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
    },
    [colorMode, onDelete]
  );

  const columns = useMemo<ColumnDef<User, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: (info) => (
          <HStack spacing={3}>
            <Avatar
              name={info.getValue()}
              size="sm"
              bg={colorMode === 'light' ? 'gray.900' : 'white'}
              color={colorMode === 'light' ? 'white' : 'gray.900'}
            />
            <VStack align="start" spacing={0}>
              <Text
                fontWeight="600"
                fontSize="sm"
                color={colorMode === 'light' ? 'gray.900' : 'white'}
              >
                {info.getValue()}
              </Text>
            </VStack>
          </HStack>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'username',
        header: 'Username',
        cell: (info) => (
          <Text
            fontSize="sm"
            color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
          >
            @{info.getValue()}
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
                    colorScheme="purple"
                    variant="subtle"
                    fontSize="xs"
                    borderRadius="full"
                    px={2}
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
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const user = info.row.original;
          return (
            <HStack spacing={1} justify="flex-end">
              {onCopyMagicLink && (
                <Tooltip label="Copy Magic Link" placement="top" hasArrow>
                  <IconButton
                    aria-label="Copy Magic Link"
                    icon={<MaterialIcon name="link" size={18} />}
                    size="sm"
                    variant="ghost"
                    colorScheme="teal"
                    onClick={() => onCopyMagicLink(user)}
                    _hover={{
                      bg: colorMode === 'light' ? 'teal.50' : 'teal.900',
                    }}
                  />
                </Tooltip>
              )}
              <Tooltip label="Edit" placement="top" hasArrow>
                <IconButton
                  aria-label="Edit"
                  icon={<MaterialIcon name="edit" size={18} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => onEdit(user)}
                  _hover={{
                    bg: colorMode === 'light' ? 'blue.50' : 'blue.900',
                  }}
                />
              </Tooltip>
              <Tooltip label="Hapus" placement="top" hasArrow>
                <IconButton
                  aria-label="Hapus"
                  icon={<MaterialIcon name="delete" size={18} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => handleDelete(user.id)}
                  _hover={{
                    bg: colorMode === 'light' ? 'red.50' : 'red.900',
                  }}
                />
              </Tooltip>
            </HStack>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [colorMode, onEdit, handleDelete, onCopyMagicLink]
  );

  return (
    <Box
      bg={useColorModeValue('white', '#222222')}
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
      pos="relative"
      boxShadow="none"
    >
      {/* Table Header / Toolbar */}
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

        <InputGroup
          size="md"
          maxW={{ base: 'full', md: '400px' }}
          w={{ base: 'full', md: 'auto' }}
        >
          <InputLeftElement h="40px">
            <MaterialIcon name="search" size={18} color="gray.400" />
          </InputLeftElement>
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            h="40px"
            borderRadius="12px"
            focusBorderColor={colorMode === 'light' ? 'blue.500' : 'blue.300'}
            fontSize="sm"
            fontWeight="500"
          />
        </InputGroup>
      </Flex>

      <TableAdvance
        columns={columns}
        data={initialData}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        hideSearch={true}
      />
    </Box>
  );
};

export default UserTableAdvance;
