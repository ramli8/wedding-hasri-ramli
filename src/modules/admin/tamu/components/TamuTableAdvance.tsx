import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Badge,
  Text,
  Icon,
  useColorMode,
  Avatar,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { Tamu } from '../types/Tamu.types';
import { arrIncludes } from '@/utils/table/table';
import TableAdvance from '@/components/organisms/TableAdvance';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import KategoriTamuAPI from '@/modules/admin/kategori_tamu/services/KategoriTamuAPI';
import { KategoriTamu } from '@/modules/admin/kategori_tamu/types/KategoriTamu.types';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface TamuTableAdvanceProps {
  initialTamu?: Tamu[];
  loading?: boolean;
  onEdit: (tamu: Tamu) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onViewDetail?: (tamu: Tamu) => void;
}

const TamuTableAdvance: React.FC<TamuTableAdvanceProps> = ({
  initialTamu = [],
  loading = false,
  onEdit,
  onDelete,
  onAddNew,
  onViewDetail,
}) => {
  const { colorMode } = useColorMode();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [kategoriList, setKategoriList] = useState<KategoriTamu[]>([]);
  const [loadingKategori, setLoadingKategori] = useState(true);

  // Fetch kategori from database
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const api = new KategoriTamuAPI();
        const data = await api.getAll();
        setKategoriList(data);
      } catch (error) {
        console.error('Failed to fetch kategori:', error);
      } finally {
        setLoadingKategori(false);
      }
    };
    fetchKategori();
  }, []);

  const renderStatusBadge = (status: string) => {
    let colorScheme = 'gray';
    let label = status;

    switch (status) {
      case 'akan_hadir':
        colorScheme = 'green';
        label = 'Akan Hadir';
        break;
      case 'tidak_hadir':
        colorScheme = 'red';
        label = 'Tidak Hadir';
        break;
      case 'belum_konfirmasi':
        colorScheme = 'yellow';
        label = 'Belum Konfirmasi';
        break;
      case 'dikirim':
        colorScheme = 'blue';
        label = 'Dikirim';
        break;
      case 'belum_dikirim':
        colorScheme = 'purple';
        label = 'Belum Dikirim';
        break;
      case 'kadaluarsa':
        colorScheme = 'orange';
        label = 'Kadaluarsa';
        break;
    }

    return (
      <Badge 
        colorScheme={colorScheme} 
        variant="subtle" 
        px={3} 
        py={1} 
        borderRadius="full"
        textTransform="capitalize"
      >
        {label}
      </Badge>
    );
  };

  const handleDelete = (id: string) => {
    MySwal.fire({
      title: 'Hapus Tamu?',
      text: "Data tamu yang dihapus tidak dapat dikembalikan!",
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
        accessorKey: 'nama',
        header: 'Nama Tamu',
        cell: (info) => (
          <HStack spacing={3}>
            <Avatar 
              name={info.getValue()} 
              size="sm" 
              bg={colorMode === 'light' ? 'teal.500' : 'teal.200'}
              color="white"
            />
            <VStack align="start" spacing={0}>
              <Text fontWeight="600" fontSize="sm" color={colorMode === 'light' ? 'gray.800' : 'white'}>
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
            <Badge colorScheme={colorScheme} borderRadius="full" px={2}>
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
          <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
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
            <Icon as={() => (
              <svg viewBox="0 0 24 24" width="16px" height="16px" fill="currentColor">
                <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
              </svg>
            )} color="gray.400" />
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
          return (
            <HStack spacing={1}>
              {onViewDetail && (
                <IconButton
                  aria-label="Lihat detail tamu"
                  icon={
                    <Icon viewBox="0 0 24 24" width="18px" height="18px">
                      <path
                        fill="currentColor"
                        d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                      />
                    </Icon>
                  }
                  size="sm"
                  variant="ghost"
                  colorScheme="teal"
                  onClick={() => onViewDetail(tamu)}
                  borderRadius="full"
                />
              )}
              <IconButton
                aria-label="Edit tamu"
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
                colorScheme="blue"
                onClick={() => onEdit(tamu)}
                borderRadius="full"
              />
              <IconButton
                aria-label="Hapus tamu"
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
                colorScheme="red"
                onClick={() => handleDelete(tamu.id)}
                borderRadius="full"
              />
            </HStack>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [colorMode, onEdit, onDelete]
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
        p={{ base: 4, md: 6 }}
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
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="800"
              letterSpacing="-0.5px"
              color={colorMode === 'light' ? 'gray.800' : 'white'}
            >
              Daftar Tamu
            </Text>
            <Badge 
              colorScheme="blue" 
              variant="subtle" 
              borderRadius="full" 
              px={3} 
              py={1}
              fontSize="xs"
              fontWeight="bold"
            >
              {initialTamu.length} Tamu
            </Badge>
          </VStack>
          <PrimaryButton onClick={onAddNew} w="auto">
            <HStack spacing={2} justify="center">
              <Icon viewBox="0 0 24 24" width="20px" height="20px" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </Icon>
              <Text>Tambah Tamu</Text>
            </HStack>
          </PrimaryButton>
        </Box>

        {/* Category Filter Cards */}
        <Box mb={8} position="relative" zIndex={1}>
          <Text fontSize="sm" fontWeight="600" mb={4} color={colorMode === 'light' ? 'gray.700' : 'gray.300'}>
            Filter berdasarkan Kategori
          </Text>
          <Wrap spacing={3} position="relative" zIndex={2}>
            {Object.entries(categoryCounts).map(([category, count]) => {
              const isActive = activeCategories.includes(category);
              return (
                <WrapItem key={category}>
                  <Box
                    as="button"
                    onClick={() => toggleCategory(category)}
                    px={4}
                    py={3}
                    borderRadius="xl"
                    border="2px solid"
                    borderColor={isActive ? 'teal.500' : (colorMode === 'light' ? 'gray.200' : 'gray.600')}
                    bg={isActive ? (colorMode === 'light' ? 'teal.50' : 'teal.900') : (colorMode === 'light' ? 'white' : 'gray.700')}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      borderColor: 'teal.400',
                      transform: 'translateY(-2px)',
                      boxShadow: colorMode === 'light' ? 'md' : 'dark-lg',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                  >
                    <HStack spacing={3}>
                      <Text
                        fontSize="sm"
                        fontWeight={isActive ? '700' : '600'}
                        color={isActive ? 'teal.600' : (colorMode === 'light' ? 'gray.700' : 'gray.200')}
                      >
                        {category}
                      </Text>
                      <Badge
                        colorScheme={isActive ? 'teal' : 'gray'}
                        borderRadius="full"
                        px={2}
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {count}
                      </Badge>
                    </HStack>
                  </Box>
                </WrapItem>
              );
            })}
          </Wrap>
        </Box>

        <TableAdvance 
          columns={columns} 
          data={initialTamu}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      </Box>
    </Box>
  );
};

export default TamuTableAdvance;
