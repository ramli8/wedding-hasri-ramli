import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useContext,
} from 'react';
import {
  Box,
  IconButton,
  HStack,
  Badge,
  Text,
  Icon,
  useColorMode,
  VStack,
  Wrap,
  WrapItem,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  useColorModeValue,
  Tooltip,
  Avatar,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { Tamu } from '../types/Tamu.types';
import { arrIncludes } from '@/utils/table/table';
import TableAdvance from '@/components/organisms/TableAdvance';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import KategoriTamuAPI from '@/modules/admin/kategori_tamu/services/KategoriTamuAPI';
import { KategoriTamu } from '@/modules/admin/kategori_tamu/types/KategoriTamu.types';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import BatchWhatsappSender from './BatchWhatsappSender';
import TamuAPI from '../services/TamuAPI';
import { Checkbox, Button } from '@chakra-ui/react';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showConfirmationAlert } from '@/utils/sweetalert';
import AppSettingContext from '@/providers/AppSettingProvider';

// const MySwal = withReactContent(Swal); // This line is removed as per instruction to replace MySwal.fire with showConfirmationAlert

interface TamuTableAdvanceProps {
  initialTamu?: Tamu[];
  loading?: boolean;
  onEdit: (tamu: Tamu) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onAddNew: () => void;
  onViewDetail?: (tamu: Tamu) => void;
  onQRCodeClick?: (tamu: Tamu) => void;
  onUpdateStatus?: (id: string, status: 'dikirim') => Promise<void>;
}

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'akan_hadir':
      return 'green.50';
    case 'tidak_hadir':
      return 'red.50';
    case 'belum_konfirmasi':
      return 'yellow.50';
    case 'dikirim':
      return 'blue.50';
    case 'belum_dikirim':
      return 'purple.50';
    case 'kadaluarsa':
      return 'orange.50';
    default:
      return 'gray.50';
  }
};

const getStatusBgColorDark = (status: string) => {
  switch (status) {
    case 'akan_hadir':
      return 'green.900';
    case 'tidak_hadir':
      return 'red.900';
    case 'belum_konfirmasi':
      return 'yellow.900';
    case 'dikirim':
      return 'blue.900';
    case 'belum_dikirim':
      return 'purple.900';
    case 'kadaluarsa':
      return 'orange.900';
    default:
      return 'gray.700';
  }
};

const getStatusTextColor = (status: string) => {
  switch (status) {
    case 'akan_hadir':
      return 'green.700';
    case 'tidak_hadir':
      return 'red.700';
    case 'belum_konfirmasi':
      return 'yellow.700';
    case 'dikirim':
      return 'blue.700';
    case 'belum_dikirim':
      return 'purple.700';
    case 'kadaluarsa':
      return 'orange.700';
    default:
      return 'gray.600';
  }
};

const getStatusTextColorDark = (status: string) => {
  switch (status) {
    case 'akan_hadir':
      return 'green.200';
    case 'tidak_hadir':
      return 'red.200';
    case 'belum_konfirmasi':
      return 'yellow.200';
    case 'dikirim':
      return 'blue.200';
    case 'belum_dikirim':
      return 'purple.200';
    case 'kadaluarsa':
      return 'orange.200';
    default:
      return 'gray.400';
  }
};

const getStatusBorderColor = (status: string) => {
  switch (status) {
    case 'akan_hadir':
      return 'green.200';
    case 'tidak_hadir':
      return 'red.200';
    case 'belum_konfirmasi':
      return 'yellow.200';
    case 'dikirim':
      return 'blue.200';
    case 'belum_dikirim':
      return 'purple.200';
    case 'kadaluarsa':
      return 'orange.200';
    default:
      return 'gray.200';
  }
};

const getStatusBorderColorDark = (status: string) => {
  switch (status) {
    case 'akan_hadir':
      return 'green.700';
    case 'tidak_hadir':
      return 'red.700';
    case 'belum_konfirmasi':
      return 'yellow.700';
    case 'dikirim':
      return 'blue.700';
    case 'belum_dikirim':
      return 'purple.700';
    case 'kadaluarsa':
      return 'orange.700';
    default:
      return 'gray.600';
  }
};

const TamuTableAdvance: React.FC<TamuTableAdvanceProps> = ({
  initialTamu = [],
  loading = false,
  onEdit,
  onDelete,
  onRestore,
  onAddNew,
  onViewDetail,
  onQRCodeClick,
  onUpdateStatus,
}) => {
  const { colorMode } = useColorMode();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [showBatchSender, setShowBatchSender] = useState(false);
  const [kategoriList, setKategoriList] = useState<KategoriTamu[]>([]);
  const [loadingKategori, setLoadingKategori] = useState(true);
  const { colorPref } = useContext(AppSettingContext);

  // Fetch kategori from database
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const api = new KategoriTamuAPI();
        const data = await api.getAll();
        setKategoriList(data);
      } catch (error) {
        console.error('Error fetching kategori:', error);
      } finally {
        setLoadingKategori(false);
      }
    };
    fetchKategori();
  }, []);

  const renderStatusBadge = useCallback(
    (status: string) => {
      let label = status;

      switch (status) {
        case 'akan_hadir':
          label = 'Akan Hadir';
          break;
        case 'tidak_hadir':
          label = 'Tidak Hadir';
          break;
        case 'belum_konfirmasi':
          label = 'Belum Konfirmasi';
          break;
        case 'dikirim':
          label = 'Dikirim';
          break;
        case 'belum_dikirim':
          label = 'Belum Dikirim';
          break;
        case 'kadaluarsa':
          label = 'Kadaluarsa';
          break;
      }

      return (
        <Badge
          px={3}
          py={1}
          borderRadius="full"
          fontSize="xs"
          fontWeight="600"
          textTransform="none"
          bg={
            colorMode === 'light'
              ? getStatusBgColor(status)
              : getStatusBgColorDark(status)
          }
          color={
            colorMode === 'light'
              ? getStatusTextColor(status)
              : getStatusTextColorDark(status)
          }
          border="1px solid"
          borderColor={
            colorMode === 'light'
              ? getStatusBorderColor(status)
              : getStatusBorderColorDark(status)
          }
        >
          {label}
        </Badge>
      );
    },
    [colorMode]
  );

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

  // Calculate category counts dynamically based on fetched kategori
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Initialize counts for all kategori from database
    kategoriList.forEach((kategori) => {
      counts[kategori.nama] = 0;
    });

    // Count tamu for each kategori
    initialTamu.forEach((tamu) => {
      if (tamu.kategori && counts[tamu.kategori] !== undefined) {
        counts[tamu.kategori]++;
      }
    });

    return counts;
  }, [initialTamu, kategoriList]);

  // Get active category filters
  const activeCategories = useMemo(() => {
    const filter = columnFilters.find((f) => f.id === 'kategori');
    return (filter?.value as string[]) || [];
  }, [columnFilters]);

  // Toggle category filter
  const toggleCategory = (category: string) => {
    const currentFilter = columnFilters.find((f) => f.id === 'kategori');
    const currentValues = (currentFilter?.value as string[]) || [];

    let newValues: string[];
    if (currentValues.includes(category)) {
      newValues = currentValues.filter((c) => c !== category);
    } else {
      newValues = [...currentValues, category];
    }

    const newFilters = columnFilters.filter((f) => f.id !== 'kategori');
    if (newValues.length > 0) {
      newFilters.push({ id: 'kategori', value: newValues });
    }

    setColumnFilters(newFilters);
  };

  const columns = useMemo<ColumnDef<Tamu, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            isChecked={table.getIsAllPageRowsSelected()}
            isIndeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            isChecked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'nama',
        header: 'Nama Tamu',
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
                color={colorMode === 'light' ? 'gray.800' : 'white'}
              >
                {info.getValue()}
              </Text>
            </VStack>
          </HStack>
        ),
        enableSorting: true,
        enableColumnFilter: false, // Disabled
      },
      {
        accessorKey: 'kategori',
        header: 'Kategori',
        cell: (info) => {
          const value = info.getValue() as string;
          let colorScheme = 'gray';
          if (value === 'Tamu Hasri') colorScheme = 'purple';
          if (value === 'Tamu Ramli') colorScheme = 'blue';
          if (value === 'Tamu Ayah') colorScheme = 'green';
          if (value === 'Tamu Ibu') colorScheme = 'orange';

          return (
            <Badge
              variant="outline"
              colorScheme={colorMode === 'light' ? 'blackAlpha' : 'whiteAlpha'}
              borderColor={colorMode === 'light' ? 'gray.900' : 'white'}
              color={colorMode === 'light' ? 'gray.900' : 'white'}
              borderRadius="full"
              px={2}
            >
              {value}
            </Badge>
          );
        },
        enableColumnFilter: false, // Disabled - using custom filter above
        filterFn: arrIncludes,
      },
      {
        accessorKey: 'hubungan',
        header: 'Hubungan',
        cell: (info) => (
          <Text
            fontSize="sm"
            color={colorMode === 'light' ? 'gray.600' : 'gray.300'}
          >
            {info.getValue()}
          </Text>
        ),
        enableSorting: true,
        enableColumnFilter: false, // Disabled
      },
      {
        accessorKey: 'alamat',
        header: 'Alamat',
        cell: (info) => (
          <Text
            isTruncated
            maxW="150px"
            fontSize="sm"
            color={colorMode === 'light' ? 'gray.600' : 'gray.300'}
            title={info.getValue()}
          >
            {info.getValue()}
          </Text>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'nomor_hp',
        header: 'Kontak',
        cell: (info) => (
          <HStack spacing={2}>
            <Icon
              as={() => (
                <svg
                  viewBox="0 0 24 24"
                  width="16px"
                  height="16px"
                  fill="currentColor"
                >
                  <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                </svg>
              )}
              color="gray.400"
            />
            <Text fontSize="sm" fontFamily="monospace">
              {info.getValue()}
            </Text>
          </HStack>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'status_undangan',
        header: 'Status',
        cell: (info) => renderStatusBadge(info.getValue()),
        enableSorting: true,
        enableColumnFilter: false, // Disabled
      },
      {
        accessorKey: 'konfirmasi_kehadiran',
        header: 'Kehadiran',
        cell: (info) => renderStatusBadge(info.getValue()),
        enableSorting: true,
        enableColumnFilter: false, // Disabled
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const tamu = info.row.original;
          const isDeleted = tamu.deleted_at;

          return (
            <HStack spacing={1} justify="flex-end">
              {!isDeleted ? (
                <>
                  {onViewDetail && (
                    <Tooltip label="Detail" placement="top" hasArrow>
                      <IconButton
                        aria-label="Detail"
                        icon={<MaterialIcon name="visibility" size={18} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="gray"
                        onClick={() => onViewDetail(tamu)}
                        _hover={{
                          bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
                        }}
                      />
                    </Tooltip>
                  )}
                  {onQRCodeClick && (
                    <Tooltip label="QR Code" placement="top" hasArrow>
                      <IconButton
                        aria-label="QR Code"
                        icon={<MaterialIcon name="qr_code_2" size={18} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="purple"
                        onClick={() => onQRCodeClick(tamu)}
                        _hover={{
                          bg:
                            colorMode === 'light' ? 'purple.50' : 'purple.900',
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
                      onClick={() => onEdit(tamu)}
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
                      onClick={() => handleDelete(tamu.id)}
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
                    onClick={() => onRestore(tamu.id)}
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
    [
      colorMode,
      onEdit,
      onRestore,
      onViewDetail,
      onQRCodeClick,
      handleDelete,
      renderStatusBadge,
    ]
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
        {/* Header with Button and Search */}
        <Flex
          mb={6}
          justify="space-between"
          align="center"
          direction={{ base: 'column', md: 'row' }}
          gap={3}
        >
          {/* Add Button & Batch Actions on Left */}
          <Box
            flexShrink={0}
            w={{ base: 'full', md: 'auto' }}
            display="flex"
            justifyContent="flex-start"
          >
            <HStack spacing={3}>
              <PrimaryButton onClick={onAddNew} w="auto">
                <HStack spacing={2} justify="center">
                  <MaterialIcon name="add" size={20} />
                  <Text>Tambah</Text>
                </HStack>
              </PrimaryButton>
              {Object.keys(rowSelection).length > 0 && (
                <Button
                  variant="outline"
                  size="md"
                  borderColor={colorMode === 'light' ? 'gray.300' : 'gray.600'}
                  color={colorMode === 'light' ? 'gray.700' : 'gray.300'}
                  leftIcon={
                    <Icon
                      viewBox="0 0 24 24"
                      width="20px"
                      height="20px"
                      fill="currentColor"
                    >
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.9 7.03 8.48 7.03 9.66C7.03 10.84 7.89 11.99 8.01 12.15C8.13 12.31 9.68 14.68 12.03 15.7C12.59 15.94 13.03 16.09 13.38 16.2C13.97 16.39 14.5 16.36 14.93 16.3C15.4 16.23 16.38 15.71 16.59 15.12C16.79 14.53 16.79 14.03 16.73 13.93C16.67 13.83 16.51 13.77 16.27 13.65C16.03 13.53 14.85 12.95 14.63 12.84C14.41 12.73 14.25 12.68 14.09 12.92C13.93 13.16 13.47 13.7 13.33 13.88C13.19 14.06 13.05 14.08 12.81 13.96C12.57 13.84 11.8 13.59 10.88 12.77C10.17 12.14 9.69 11.36 9.55 11.12C9.41 10.88 9.54 10.75 9.66 10.63C9.77 10.52 9.9 10.35 10.02 10.21C10.14 10.07 10.18 9.97 10.26 9.81C10.34 9.65 10.3 9.51 10.24 9.39C10.18 9.27 9.7 8.09 9.5 7.61C9.3 7.14 9.1 7.2 8.94 7.2H8.53Z" />
                    </Icon>
                  }
                  onClick={() => setShowBatchSender(true)}
                  borderRadius="10px"
                  fontSize="sm"
                  fontWeight="500"
                  h="40px"
                  _hover={{
                    bg: colorMode === 'light' ? 'gray.50' : 'gray.700',
                    borderColor:
                      colorMode === 'light' ? 'gray.400' : 'gray.500',
                  }}
                >
                  Kirim WA ({Object.keys(rowSelection).length})
                </Button>
              )}
            </HStack>
          </Box>

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

        <BatchWhatsappSender
          isOpen={showBatchSender}
          onClose={() => setShowBatchSender(false)}
          selectedTamu={initialTamu.filter(
            (_, index) =>
              (rowSelection as Record<string, boolean>)[index.toString()]
          )}
          onComplete={() => setRowSelection({})}
          onUpdateStatus={onUpdateStatus}
        />

        {/* Category Filter Section */}
        <Box mb={6}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wider"
            mb={3}
            color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
          >
            Kategori Tamu
          </Text>
          <HStack
            spacing={3}
            overflowX="auto"
            pb={2}
            css={{
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              msOverflowStyle: 'none' /* IE and Edge */,
              scrollbarWidth: 'none' /* Firefox */,
            }}
          >
            {Object.entries(categoryCounts).map(([category, count]) => {
              const isActive = activeCategories.includes(category);
              return (
                <Box
                  key={category}
                  as="button"
                  onClick={() => toggleCategory(category)}
                  flexShrink={0}
                  px={4}
                  py={2}
                  borderRadius="full"
                  bg={
                    isActive
                      ? colorMode === 'light'
                        ? 'gray.900'
                        : 'white'
                      : colorMode === 'light'
                      ? 'gray.100'
                      : 'gray.800'
                  }
                  color={
                    isActive
                      ? colorMode === 'light'
                        ? 'white'
                        : 'gray.900'
                      : colorMode === 'light'
                      ? 'gray.600'
                      : 'gray.400'
                  }
                  transition="all 0.2s"
                  _hover={{
                    transform: 'translateY(-1px)',
                    bg: isActive
                      ? undefined
                      : colorMode === 'light'
                      ? 'gray.200'
                      : 'gray.700',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                >
                  <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="600">
                      {category}
                    </Text>
                    <Badge
                      variant="solid"
                      bg={
                        isActive
                          ? colorMode === 'light'
                            ? 'whiteAlpha.300'
                            : 'blackAlpha.300'
                          : colorMode === 'light'
                          ? 'blackAlpha.100'
                          : 'whiteAlpha.100'
                      }
                      color="inherit"
                      borderRadius="full"
                      px={1.5}
                      fontSize="10px"
                      minW="18px"
                      textAlign="center"
                    >
                      {count}
                    </Badge>
                  </HStack>
                </Box>
              );
            })}
          </HStack>
        </Box>

        <TableAdvance
          columns={columns}
          data={initialTamu}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          rowSelection={rowSelection}
          hideSearch={true}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          onRowSelectionChange={setRowSelection}
        />
      </Box>
    </Box>
  );
};

export default TamuTableAdvance;
