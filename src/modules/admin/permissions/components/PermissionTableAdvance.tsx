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
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { ColumnFiltersState } from '@tanstack/react-table';
import { RolePermission } from '../services/PermissionAPI';

import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';
import { showConfirmationAlert } from '@/utils/sweetalert';

interface PermissionTableAdvanceProps {
  initialData?: (RolePermission & { roles: { name: string } })[];
  loading?: boolean;
  onEdit: (permission: RolePermission) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onAddNew: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  headerAction?: React.ReactNode;
}

const PermissionTableAdvance: React.FC<PermissionTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onEdit,
  onDelete,
  onRestore,
  onAddNew,
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

  // Search filtering (client-side on loaded data)
  const globalFilterValue =
    (columnFilters.find((f) => f.id === 'global')?.value as string) ?? '';

  const filteredData = useMemo(() => {
    if (!globalFilterValue) return initialData;
    const lowerFilter = globalFilterValue.toLowerCase();
    return initialData.filter(
      (item) =>
        item.url_pattern.toLowerCase().includes(lowerFilter) ||
        item.roles?.name?.toLowerCase().includes(lowerFilter) ||
        item.description?.toLowerCase().includes(lowerFilter)
    );
  }, [initialData, globalFilterValue]);

  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
    }
  };

  if (loading && initialData.length === 0) {
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
          {filteredData.map((perm) => {
            const isDeleted = perm.deleted_at;
            return (
              <Box
                key={perm.id}
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
                <VStack align="start" spacing={3} mb={4}>
                  <Box width="full">
                    <HStack justify="space-between" align="start">
                      <Badge
                        colorScheme="purple"
                        variant="subtle"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        mb={2}
                      >
                        {perm.roles?.name || 'Unknown Role'}
                      </Badge>
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
                    </HStack>
                    <Text
                      fontFamily="monospace"
                      fontSize="sm"
                      fontWeight="600"
                      bg={colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100'}
                      p={1.5}
                      borderRadius="md"
                      color={colorMode === 'light' ? 'gray.800' : 'gray.200'}
                      wordBreak="break-all"
                    >
                      {perm.url_pattern}
                    </Text>
                  </Box>

                  <Text
                    fontSize="xs"
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    noOfLines={2}
                  >
                    {perm.description || 'Tidak ada deskripsi'}
                  </Text>
                </VStack>

                <HStack
                  justify="flex-end"
                  spacing={2}
                  mt="auto"
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
                          onClick={() => onEdit(perm)}
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
                          onClick={() => handleDelete(perm.id)}
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
                        onClick={() => onRestore(perm.id)}
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

export default PermissionTableAdvance;
