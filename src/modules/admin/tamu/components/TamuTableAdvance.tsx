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
  Tooltip,
  SimpleGrid,
  Avatar,
} from '@chakra-ui/react';
import { FaSearch, FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { ColumnFiltersState } from '@tanstack/react-table';
import { Tamu } from '../types/Tamu.types';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';
import { showConfirmationAlert } from '@/utils/sweetalert';

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
  onSendWhatsApp?: (tamu: Tamu) => void;
  onSendInstagram?: (tamu: Tamu) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  headerAction?: React.ReactNode;
}

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
  onSendWhatsApp,
  onSendInstagram,
  onLoadMore,
  hasMore = false,
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

  // Filtering logic - now only for display filter, not data filter
  const globalFilterValue =
    (columnFilters.find((f) => f.id === 'global')?.value as string) ?? '';

  const filteredData = useMemo(() => {
    if (!globalFilterValue) return initialTamu;
    return initialTamu.filter((item) =>
      `${item.nama} ${item.kategori} ${item.hubungan} ${item.nomor_hp}`
        .toLowerCase()
        .includes(globalFilterValue.toLowerCase())
    );
  }, [initialTamu, globalFilterValue]);

  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'akan_hadir':
        return 'green';
      case 'tidak_hadir':
        return 'red';
      case 'belum_konfirmasi':
        return 'yellow';
      case 'dikirim':
        return 'blue';
      case 'belum_dikirim':
        return 'purple';
      case 'kadaluarsa':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'akan_hadir':
        return 'Akan Hadir';
      case 'tidak_hadir':
        return 'Tidak Hadir';
      case 'belum_konfirmasi':
        return 'Belum Konfirmasi';
      case 'dikirim':
        return 'Dikirim';
      case 'belum_dikirim':
        return 'Belum Dikirim';
      case 'kadaluarsa':
        return 'Kadaluarsa';
      default:
        return status;
    }
  };

  if (loading && initialTamu.length === 0) {
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
        bg={colorMode === 'light' ? 'white' : 'whiteAlpha.50'}
        borderRadius="24px"
        p={{ base: 4, md: '32px' }}
        borderWidth="1px"
        borderColor={colorMode === 'light' ? 'transparent' : 'whiteAlpha.100'}
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
          display: { base: 'none', md: 'block' },
        }}
      >
        <Flex
          mb={6}
          justify="space-between"
          align="center"
          direction={{ base: 'column', md: 'row' }}
          gap={3}
        >
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
            <InputLeftElement h="48px">
              <Icon
                as={FaSearch}
                color={colorMode === 'light' ? 'gray.400' : 'gray.500'}
                boxSize={4}
              />
            </InputLeftElement>
            <Input
              value={globalFilterValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setColumnFilters(value ? [{ id: 'global', value }] : []);
              }}
              h="48px"
              variant="filled"
              borderRadius="full"
              focusBorderColor={
                colorMode === 'light' ? `${colorPref}.500` : `${colorPref}.300`
              }
              fontSize="sm"
              fontWeight="500"
              placeholder="Cari data..."
              bg={colorMode === 'light' ? 'gray.50' : 'gray.700'}
              color={colorMode === 'light' ? 'gray.900' : 'white'}
              _placeholder={{
                color: colorMode === 'light' ? 'gray.400' : 'gray.500',
              }}
              _hover={{
                bg: colorMode === 'light' ? 'gray.100' : 'gray.600',
                borderColor:
                  colorMode === 'light'
                    ? `${colorPref}.500`
                    : `${colorPref}.300`,
              }}
              _focus={{
                bg: colorMode === 'light' ? 'white' : 'gray.600',
                borderColor:
                  colorMode === 'light'
                    ? `${colorPref}.500`
                    : `${colorPref}.300`,
              }}
            />
          </InputGroup>
        </Flex>

        {/* Responsive Grid Layout */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
          {filteredData.map((tamu) => {
            const isDeleted = tamu.deleted_at;
            return (
              <Box
                key={tamu.id}
                p={6}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={
                  colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100'
                }
                bg={colorMode === 'light' ? 'white' : 'whiteAlpha.50'}
                shadow="sm"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  transform: 'translateY(-2px)',
                  shadow: 'lg',
                  borderColor:
                    colorMode === 'light'
                      ? `${colorPref}.400`
                      : `${colorPref}.500`,
                }}
                position="relative"
                overflow="hidden"
              >
                {/* Guest Info */}
                <VStack align="start" spacing={3} mb={4}>
                  {/* Avatar and Name */}
                  <Flex align="center" w="full" gap={3}>
                    <Avatar
                      name={tamu.nama}
                      size="md"
                      bg={
                        colorMode === 'light'
                          ? `${colorPref}.500`
                          : `${colorPref}.400`
                      }
                      color="white"
                    />
                    <VStack align="start" spacing={0} flex={1} minW={0}>
                      <Text
                        fontWeight="700"
                        fontSize="md"
                        noOfLines={1}
                        title={tamu.nama}
                        color={colorMode === 'light' ? 'gray.900' : 'white'}
                      >
                        {tamu.nama}
                      </Text>
                      <Text
                        fontSize="xs"
                        color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                        noOfLines={1}
                      >
                        {tamu.nomor_hp
                          ? tamu.nomor_hp
                          : tamu.username_instagram
                          ? `@${tamu.username_instagram}`
                          : '-'}
                      </Text>
                    </VStack>
                  </Flex>

                  {/* Kategori & Hubungan */}
                  <Flex gap={2} wrap="wrap" w="full">
                    <Badge
                      px={2.5}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="600"
                      colorScheme="purple"
                      variant="subtle"
                    >
                      {tamu.kategori}
                    </Badge>
                    <Badge
                      px={2.5}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="600"
                      colorScheme="blue"
                      variant="subtle"
                    >
                      {tamu.hubungan}
                    </Badge>
                  </Flex>

                  {/* Status Badge (Deleted/Active) */}
                  <Badge
                    px={2.5}
                    py={1}
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="600"
                    colorScheme={isDeleted ? 'red' : 'green'}
                    variant="subtle"
                  >
                    {isDeleted ? 'Dihapus' : 'Aktif'}
                  </Badge>
                </VStack>

                {/* Action Buttons */}
                <Flex
                  justify="flex-end"
                  gap={1.5}
                  mt={4}
                  pt={4}
                  borderTopWidth="1px"
                  borderColor={colorMode === 'light' ? 'gray.100' : 'gray.600'}
                >
                  {!isDeleted ? (
                    <>
                      {onViewDetail && (
                        <Tooltip label="Detail" hasArrow placement="top">
                          <IconButton
                            aria-label="Detail"
                            icon={<MaterialIcon name="visibility" size={16} />}
                            size="sm"
                            borderRadius="md"
                            variant="ghost"
                            onClick={() => onViewDetail(tamu)}
                            color={
                              colorMode === 'light' ? 'gray.600' : 'gray.300'
                            }
                            _hover={{
                              bg:
                                colorMode === 'light'
                                  ? 'gray.50'
                                  : 'whiteAlpha.200',
                            }}
                          />
                        </Tooltip>
                      )}
                      {onQRCodeClick && (
                        <Tooltip label="QR Code" hasArrow placement="top">
                          <IconButton
                            aria-label="QR Code"
                            icon={<MaterialIcon name="qr_code_2" size={16} />}
                            size="sm"
                            borderRadius="md"
                            variant="ghost"
                            onClick={() => onQRCodeClick(tamu)}
                            color={
                              colorMode === 'light'
                                ? 'purple.600'
                                : 'purple.300'
                            }
                            _hover={{
                              bg:
                                colorMode === 'light'
                                  ? 'purple.50'
                                  : 'whiteAlpha.200',
                            }}
                          />
                        </Tooltip>
                      )}
                      {onSendWhatsApp && tamu.nomor_hp && (
                        <Tooltip
                          label="Kirim WhatsApp"
                          hasArrow
                          placement="top"
                        >
                          <IconButton
                            aria-label="Kirim WhatsApp"
                            icon={<Icon as={FaWhatsapp} boxSize={4} />}
                            size="sm"
                            borderRadius="md"
                            variant="ghost"
                            onClick={() => onSendWhatsApp(tamu)}
                            color={
                              colorMode === 'light' ? 'green.600' : 'green.400'
                            }
                            _hover={{
                              bg:
                                colorMode === 'light'
                                  ? 'green.50'
                                  : 'whiteAlpha.200',
                            }}
                          />
                        </Tooltip>
                      )}
                      {onSendInstagram &&
                        !tamu.nomor_hp &&
                        tamu.username_instagram && (
                          <Tooltip
                            label="Kirim Instagram DM"
                            hasArrow
                            placement="top"
                          >
                            <IconButton
                              aria-label="Kirim Instagram DM"
                              icon={<Icon as={FaInstagram} boxSize={4} />}
                              size="sm"
                              borderRadius="md"
                              variant="ghost"
                              onClick={() => onSendInstagram(tamu)}
                              color={
                                colorMode === 'light' ? 'pink.600' : 'pink.400'
                              }
                              _hover={{
                                bg:
                                  colorMode === 'light'
                                    ? 'pink.50'
                                    : 'whiteAlpha.200',
                              }}
                            />
                          </Tooltip>
                        )}
                      <Tooltip label="Edit" hasArrow placement="top">
                        <IconButton
                          aria-label="Edit"
                          icon={<MaterialIcon name="edit" size={16} />}
                          size="sm"
                          borderRadius="md"
                          variant="ghost"
                          onClick={() => onEdit(tamu)}
                          color={
                            colorMode === 'light' ? 'blue.600' : 'blue.300'
                          }
                          _hover={{
                            bg:
                              colorMode === 'light'
                                ? 'blue.50'
                                : 'whiteAlpha.200',
                          }}
                        />
                      </Tooltip>
                      <Tooltip label="Hapus" hasArrow placement="top">
                        <IconButton
                          aria-label="Hapus"
                          icon={<MaterialIcon name="delete" size={16} />}
                          size="sm"
                          borderRadius="md"
                          variant="ghost"
                          onClick={() => handleDelete(tamu.id)}
                          color={colorMode === 'light' ? 'red.600' : 'red.300'}
                          _hover={{
                            bg:
                              colorMode === 'light'
                                ? 'red.50'
                                : 'whiteAlpha.200',
                          }}
                        />
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip label="Pulihkan" hasArrow placement="top">
                      <IconButton
                        aria-label="Restore"
                        icon={
                          <MaterialIcon name="restore_from_trash" size={16} />
                        }
                        size="sm"
                        borderRadius="md"
                        variant="ghost"
                        onClick={() => onRestore(tamu.id)}
                        color={
                          colorMode === 'light' ? 'green.600' : 'green.300'
                        }
                        _hover={{
                          bg:
                            colorMode === 'light'
                              ? 'green.50'
                              : 'whiteAlpha.200',
                        }}
                      />
                    </Tooltip>
                  )}
                </Flex>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Load More Button */}
        {hasMore && !loading && (
          <Flex justify="center" mt={8}>
            <PrimaryButton onClick={handleLoadMore}>
              Muat Lebih Banyak
            </PrimaryButton>
          </Flex>
        )}

        {loading && initialTamu.length > 0 && (
          <Flex justify="center" mt={8}>
            <Text color="gray.500">Memuat data...</Text>
          </Flex>
        )}

        {filteredData.length === 0 && (
          <Box textAlign="center" py={10}>
            <Text color="gray.500" fontSize="lg">
              Tidak ada data ditemukan
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TamuTableAdvance;
