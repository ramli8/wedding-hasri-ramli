import React, { useMemo, useState, useContext } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Text,
  Icon,
  useColorMode,
  VStack,
  Flex,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { KategoriTamu } from '../types/KategoriTamu.types';
import TableAdvance from '@/components/organisms/TableAdvance';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';
import { showConfirmationAlert } from '@/utils/sweetalert';

interface KategoriTableAdvanceProps {
  initialData?: KategoriTamu[];
  loading?: boolean;
  onEdit: (kategori: KategoriTamu) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onAddNew: () => void;
  headerAction?: React.ReactNode;
}

const KategoriTableAdvance: React.FC<KategoriTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onEdit,
  onDelete,
  onRestore,
  onAddNew,
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

  const columns = useMemo<ColumnDef<KategoriTamu, any>[]>(
    () => [
      {
        accessorKey: 'nama',
        header: 'Nama Kategori',
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
          const kategori = info.row.original;
          const isDeleted = kategori.deleted_at;

          return (
            <HStack spacing={1} justify="flex-end">
              {!isDeleted ? (
                <>
                  <Tooltip label="Edit" placement="top" hasArrow>
                    <IconButton
                      aria-label="Edit"
                      icon={<MaterialIcon name="edit" size={18} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={() => onEdit(kategori)}
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
                      onClick={() => handleDelete(kategori.id)}
                      _hover={{
                        bg: colorMode === 'light' ? 'red.50' : 'red.900',
                      }}
                    />
                  </Tooltip>
                </>
              ) : (
                <Tooltip label="Restore" placement="top" hasArrow>
                  <IconButton
                    aria-label="Restore"
                    icon={<MaterialIcon name="restore_from_trash" size={18} />}
                    size="sm"
                    variant="ghost"
                    colorScheme="green"
                    onClick={() => onRestore(kategori.id)}
                    _hover={{
                      bg: colorMode === 'light' ? 'green.50' : 'green.900',
                    }}
                  />
                </Tooltip>
              )}
            </HStack>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [colorMode, onEdit, onDelete, onRestore]
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
            maxW={{ base: 'full', md: '400px' }}
            w={{ base: 'full', md: 'auto' }}
          >
            <InputLeftElement h="40px">
              <Icon as={FaSearch} color="gray.400" boxSize={4} />
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
          hideSearch
        />
      </Box>
    </Box>
  );
};

export default KategoriTableAdvance;
