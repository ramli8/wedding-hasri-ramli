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
import { Role } from '../types/Role.types';

import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';
import { showConfirmationAlert } from '@/utils/sweetalert';

interface RoleTableAdvanceProps {
  initialData?: Role[];
  loading?: boolean;
  onEdit: (role: Role) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onAddNew: () => void;
  onManagePermissions?: (role: Role) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  headerAction?: React.ReactNode;
}

const RoleTableAdvance: React.FC<RoleTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onEdit,
  onDelete,
  onRestore,
  onAddNew,
  onManagePermissions,
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

  // Filtering logic
  const globalFilterValue =
    (columnFilters.find((f) => f.id === 'global')?.value as string) ?? '';

  const filteredData = useMemo(() => {
    if (!globalFilterValue) return initialData;
    return initialData.filter((item) =>
      item.name.toLowerCase().includes(globalFilterValue.toLowerCase())
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
          top: '20px',
          left: '20px',
          right: '20px',
          bottom: '-20px',
          zIndex: '-1',
          background: colorMode === 'light' ? '#e3e6ec' : '#000',
          opacity: colorMode === 'light' ? '0.91' : '0.51',
          filter: 'blur(40px)',
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
                colorMode === 'light' ? 'gray.400' : 'whiteAlpha.400'
              }
              fontSize="sm"
              fontWeight="500"
              placeholder="Cari data..."
              bg={colorMode === 'light' ? 'gray.50' : 'whiteAlpha.50'}
              color={colorMode === 'light' ? 'gray.900' : 'white'}
              _placeholder={{
                color: colorMode === 'light' ? 'gray.400' : 'gray.500',
              }}
              _hover={{
                bg: colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100',
                borderColor:
                  colorMode === 'light' ? 'gray.300' : 'whiteAlpha.300',
              }}
              _focus={{
                bg: colorMode === 'light' ? 'white' : 'whiteAlpha.200',
                borderColor:
                  colorMode === 'light' ? 'gray.400' : 'whiteAlpha.400',
              }}
            />
          </InputGroup>
        </Flex>

        {/* Responsive Grid Layout */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
          {filteredData.map((role) => {
            const isDeleted = role.deleted_at;
            return (
              <Box
                key={role.id}
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
                }}
                position="relative"
                overflow="hidden"
              >
                {/* Role Info */}
                <VStack align="start" spacing={3} mb={4}>
                  <Flex justify="space-between" align="start" w="full" gap={2}>
                    <Text
                      fontWeight="700"
                      fontSize="lg"
                      noOfLines={1}
                      title={role.name}
                      color={colorMode === 'light' ? 'gray.900' : 'white'}
                      flex={1}
                      minW={0}
                    >
                      {role.name}
                    </Text>

                    {/* Status Badge */}
                    <Badge
                      px={2.5}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="600"
                      colorScheme={isDeleted ? 'red' : 'green'}
                      variant="subtle"
                      flexShrink={0}
                    >
                      {isDeleted ? 'Dihapus' : 'Aktif'}
                    </Badge>
                  </Flex>

                  <Text
                    fontSize="sm"
                    color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                    noOfLines={2}
                    minH="40px"
                    fontWeight="400"
                  >
                    {role.description || (
                      <Text
                        as="span"
                        fontStyle="italic"
                        color={colorMode === 'light' ? 'gray.400' : 'gray.500'}
                      >
                        No description
                      </Text>
                    )}
                  </Text>
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
                      <Tooltip label="Edit" hasArrow placement="top">
                        <IconButton
                          aria-label="Edit"
                          icon={<MaterialIcon name="edit" size={16} />}
                          size="sm"
                          borderRadius="md"
                          variant="ghost"
                          onClick={() => onEdit(role)}
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
                      <Tooltip label="Permissions" hasArrow placement="top">
                        <IconButton
                          aria-label="Permissions"
                          icon={<MaterialIcon name="security" size={16} />}
                          size="sm"
                          borderRadius="md"
                          variant="ghost"
                          onClick={() => onManagePermissions?.(role)}
                          color={
                            colorMode === 'light' ? 'purple.600' : 'purple.300'
                          }
                          _hover={{
                            bg:
                              colorMode === 'light'
                                ? 'purple.50'
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
                          onClick={() => handleDelete(role.id)}
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
                        onClick={() => onRestore(role.id)}
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

export default RoleTableAdvance;
