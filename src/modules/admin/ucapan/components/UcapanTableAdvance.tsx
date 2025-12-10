import React, { useMemo, useState } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Text,
  Icon,
  useColorMode,
  VStack,
  Avatar,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import TableAdvance from '@/components/organisms/TableAdvance';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { UcapanWithReplies } from '../types/Ucapan.types';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { showSuccessAlert } from '@/utils/sweetalert';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';
import { showConfirmationAlert } from '@/utils/sweetalert';
import { useContext } from 'react';
import {
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  // Menu, // Removed as per instruction
  // MenuButton, // Removed as per instruction
  // MenuList, // Removed as per instruction
  // MenuItem, // Removed as per instruction
  // Avatar, // Moved to top import
  useColorModeValue,
} from '@chakra-ui/react';

const MySwal = withReactContent(Swal);

interface UcapanTableAdvanceProps {
  initialData?: UcapanWithReplies[];
  loading?: boolean;
  onReply: (ucapan: UcapanWithReplies) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  headerAction?: React.ReactNode;
}

const UcapanTableAdvance: React.FC<UcapanTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onReply,
  onDelete,
  onRefresh,
  headerAction,
}) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const boxBg = useColorModeValue('white', 'gray.900');
  const leftBorderColor = useColorModeValue(
    `${colorPref}.500`,
    `${colorPref}Dim.500`
  );
  const tableBorderColor = useColorModeValue('gray.200', 'gray.800');

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = useMemo<ColumnDef<UcapanWithReplies, any>[]>(
    () => [
      {
        accessorKey: 'nama',
        header: 'Nama',
        cell: (info) => (
          <HStack spacing={3}>
            <Avatar
              name={info.getValue()}
              size="sm"
              bg={colorMode === 'light' ? 'gray.900' : 'white'}
              color={colorMode === 'light' ? 'white' : 'gray.900'}
            />
            <Text
              fontWeight="600"
              fontSize="sm"
              color={colorMode === 'light' ? 'gray.900' : 'white'}
            >
              {info.getValue()}
            </Text>
          </HStack>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'pesan',
        header: 'Pesan',
        cell: (info) => (
          <Text
            fontSize="sm"
            color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
            noOfLines={2}
          >
            {info.getValue()}
          </Text>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'created_at',
        header: 'Tanggal',
        cell: (info) => (
          <Text fontSize="xs" color="gray.500">
            {formatDate(info.getValue())}
          </Text>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const ucapan = info.row.original;
          const hasReply = ucapan.replies && ucapan.replies.length > 0;
          return (
            <Badge
              variant="outline"
              colorScheme={colorMode === 'light' ? 'blackAlpha' : 'whiteAlpha'}
              borderColor={colorMode === 'light' ? 'gray.900' : 'white'}
              color={colorMode === 'light' ? 'gray.900' : 'white'}
              fontSize="xs"
            >
              {hasReply ? 'Sudah Dibalas' : 'Belum Dibalas'}
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
          const ucapan = info.row.original;
          return (
            <HStack spacing={1} justify="flex-end">
              <Tooltip label="Balas" placement="top" hasArrow>
                <IconButton
                  aria-label="Balas"
                  icon={<MaterialIcon name="reply" size={18} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => onReply(ucapan)}
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
                  onClick={() => handleDelete(ucapan.id)}
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
    [colorMode, onReply, onDelete, handleDelete]
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
        bg={boxBg}
        borderRadius="24px"
        p={6}
        border="1px solid"
        borderColor={tableBorderColor}
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
          {/* Header Action on Left */}
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
            w={{ base: 'full', md: 'auto' }}
            maxW={{ base: 'full', md: '400px' }}
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
              size="lg"
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
    </Box>
  );
};

export default UcapanTableAdvance;
