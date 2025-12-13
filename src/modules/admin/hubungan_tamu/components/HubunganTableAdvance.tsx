import React, { useMemo, useState, useContext, useEffect } from 'react';
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
import { FaSearch } from 'react-icons/fa';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { HubunganTamu } from '../types/HubunganTamu.types';

import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';
import { showConfirmationAlert } from '@/utils/sweetalert';

interface HubunganTableAdvanceProps {
  initialData?: HubunganTamu[];
  loading?: boolean;
  onEdit: (hubungan: HubunganTamu) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onAddNew: () => void;
  headerAction?: React.ReactNode;
}

const HubunganTableAdvance: React.FC<HubunganTableAdvanceProps> = ({
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

  // Filtering logic
  const globalFilterValue =
    (columnFilters.find((f) => f.id === 'global')?.value as string) ?? '';

  const [visibleCount, setVisibleCount] = useState(12);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(12);
  }, [globalFilterValue]);

  const filteredData = useMemo(() => {
    if (!globalFilterValue) return initialData;
    return initialData.filter((item) =>
      item.nama.toLowerCase().includes(globalFilterValue.toLowerCase())
    );
  }, [initialData, globalFilterValue]);

  const currentData = useMemo(() => {
    return filteredData.slice(0, visibleCount);
  }, [filteredData, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 12);
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
        bg={colorMode === 'light' ? 'white' : '#222222'}
        borderRadius="24px"
        p={{ base: 4, md: '32px' }}
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
              <Icon as={FaSearch} color="gray.400" boxSize={4} />
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
              placeholder=""
              bg={colorMode === 'light' ? 'gray.50' : 'gray.800'}
              _hover={{
                bg: colorMode === 'light' ? 'gray.100' : 'gray.700',
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
          {currentData.map((hubungan) => {
            const isDeleted = hubungan.deleted_at;
            return (
              <Box
                key={hubungan.id}
                p={5}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                bg={colorMode === 'light' ? 'white' : 'gray.800'}
                shadow="sm"
                transition="all 0.2s"
                _hover={{
                  shadow: 'md',
                  transform: 'translateY(-2px)',
                  borderColor: colorMode === 'light' ? 'gray.400' : 'gray.500',
                }}
              >
                <Flex justify="space-between" align="start" mb={3}>
                  <Box>
                    <Text fontWeight="bold" fontSize="lg" mb={1} noOfLines={1}>
                      {hubungan.nama}
                    </Text>
                    <Badge
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                      colorScheme={isDeleted ? 'red' : 'green'}
                      variant="subtle"
                    >
                      {isDeleted ? 'Dihapus' : 'Aktif'}
                    </Badge>
                  </Box>
                </Flex>

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
                      <Tooltip label="Edit" hasArrow>
                        <IconButton
                          aria-label="Edit"
                          icon={<MaterialIcon name="edit" size={18} />}
                          size="sm"
                          borderRadius="full"
                          variant="ghost"
                          onClick={() => onEdit(hubungan)}
                          bg={
                            colorMode === 'light' ? 'blue.50' : 'whiteAlpha.200'
                          }
                          color={
                            colorMode === 'light' ? 'blue.600' : 'blue.300'
                          }
                          _hover={{
                            bg:
                              colorMode === 'light'
                                ? 'blue.100'
                                : 'whiteAlpha.300',
                          }}
                        />
                      </Tooltip>
                      <Tooltip label="Hapus" hasArrow>
                        <IconButton
                          aria-label="Hapus"
                          icon={<MaterialIcon name="delete" size={18} />}
                          size="sm"
                          borderRadius="full"
                          variant="ghost"
                          onClick={() => handleDelete(hubungan.id)}
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
                        onClick={() => onRestore(hubungan.id)}
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
        {visibleCount < filteredData.length && (
          <Flex justify="center" mt={8}>
            <PrimaryButton onClick={handleLoadMore}>
              Muat Lebih Banyak
            </PrimaryButton>
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

export default HubunganTableAdvance;
