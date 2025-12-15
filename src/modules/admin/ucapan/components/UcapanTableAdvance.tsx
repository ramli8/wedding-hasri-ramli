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
  SimpleGrid,
} from '@chakra-ui/react';
import { ColumnFiltersState } from '@tanstack/react-table';
import { UcapanWithReplies } from '../types/Ucapan.types';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';
import { showConfirmationAlert } from '@/utils/sweetalert';

interface UcapanTableAdvanceProps {
  initialData?: UcapanWithReplies[];
  loading?: boolean;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onAddNew: () => void;
  onViewDetail: (ucapan: UcapanWithReplies) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const UcapanTableAdvance: React.FC<UcapanTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onDelete,
  onRestore,
  onAddNew,
  onViewDetail,
  onLoadMore,
  hasMore = false,
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

  // Filtering logic
  const globalFilterValue =
    (columnFilters.find((f) => f.id === 'global')?.value as string) ?? '';

  const filteredData = useMemo(() => {
    if (!globalFilterValue) return initialData;
    return initialData.filter((item) =>
      item.nama.toLowerCase().includes(globalFilterValue.toLowerCase()) ||
      item.pesan.toLowerCase().includes(globalFilterValue.toLowerCase())
    );
  }, [initialData, globalFilterValue]);

  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
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
          justify="flex-end"
          align="center"
        >
          {/* Search Input on Right */}
          <InputGroup
            size="md"
            maxW={{ base: 'full', md: '400px' }}
            w={{ base: 'full', md: 'auto' }}
          >
            <InputLeftElement h="48px">
              <Icon 
                as={MaterialIcon} 
                name="search" 
                boxSize={4} 
                color={colorMode === 'light' ? 'gray.400' : 'gray.500'} 
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
          {filteredData.map((ucapan) => {
            const isDeleted = ucapan.deleted_at;
            const hasReply = ucapan.replies && ucapan.replies.length > 0;
            return (
              <Box
                key={ucapan.id}
                p={6}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100'}
                bg={colorMode === 'light' ? 'white' : 'whiteAlpha.50'}
                shadow="sm"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  transform: 'translateY(-2px)',
                  shadow: 'lg',
                  borderColor: colorMode === 'light' ? `${colorPref}.400` : `${colorPref}.500`,
                }}
                position="relative"
                overflow="hidden"
              >
                <Flex justify="space-between" align="start" mb={3}>
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold" fontSize="lg" mb={1} noOfLines={1}>
                      {ucapan.nama}
                    </Text>
                    <Badge
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                      colorScheme={isDeleted ? 'red' : hasReply ? 'green' : 'yellow'}
                      variant="subtle"
                    >
                      {isDeleted ? 'Dihapus' : hasReply ? 'Sudah Dibalas' : 'Belum Dibalas'}
                    </Badge>
                  </VStack>
                </Flex>

                <Text
                  fontSize="sm"
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  noOfLines={3}
                  mb={2}
                >
                  {ucapan.pesan}
                </Text>

                <Text fontSize="xs" color="gray.500" mb={3}>
                  {formatDate(ucapan.created_at)}
                </Text>

                <HStack
                  justify="flex-end"
                  spacing={2}
                  mt={4}
                  pt={4}
                  borderTopWidth="1px"
                  borderColor={colorMode === 'light' ? 'gray.100' : 'gray.700'}
                >
                  {!isDeleted ? (
                    <>
                      {hasReply && (
                        <Tooltip label="Detail & Balasan" hasArrow>
                          <IconButton
                            aria-label="Detail"
                            icon={<MaterialIcon name="visibility" size={18} />}
                            size="sm"
                            borderRadius="full"
                            variant="ghost"
                            onClick={() => onViewDetail(ucapan)}
                            bg={
                              colorMode === 'light' ? 'blue.50' : 'whiteAlpha.200'
                            }
                            color={colorMode === 'light' ? 'blue.600' : 'blue.300'}
                            _hover={{
                              bg:
                                colorMode === 'light'
                                  ? 'blue.100'
                                  : 'whiteAlpha.300',
                            }}
                          />
                        </Tooltip>
                      )}
                      <Tooltip label="Hapus" hasArrow>
                        <IconButton
                          aria-label="Hapus"
                          icon={<MaterialIcon name="delete" size={18} />}
                          size="sm"
                          borderRadius="full"
                          variant="ghost"
                          onClick={() => handleDelete(ucapan.id)}
                          bg={
                            colorMode === 'light' ? 'red.50' : 'whiteAlpha.200'
                          }
                          color={colorMode === 'light' ? 'red.600' : 'red.300'}
                          _hover={{
                            bg:
                              colorMode === 'light'
                                ? 'red.100'
                                : 'whiteAlpha.300',
                          }}
                        />
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip label="Pulihkan" hasArrow>
                      <IconButton
                        aria-label="Restore"
                        icon={
                          <MaterialIcon name="restore_from_trash" size={18} />
                        }
                        size="sm"
                        borderRadius="full"
                        variant="ghost"
                        onClick={() => onRestore(ucapan.id)}
                        bg={
                          colorMode === 'light' ? 'green.50' : 'whiteAlpha.200'
                        }
                        color={
                          colorMode === 'light' ? 'green.600' : 'green.300'
                        }
                        _hover={{
                          bg:
                            colorMode === 'light'
                              ? 'green.100'
                              : 'whiteAlpha.300',
                        }}
                      />
                    </Tooltip>
                  )}
                </HStack>
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

        {loading && initialData.length > 0 && (
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

export default UcapanTableAdvance;
