import React, {
  useState,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from 'react';
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
  onLoadMore?: () => void;
  hasMore?: boolean;
  headerAction?: React.ReactNode;
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
}

const HubunganTableAdvance: React.FC<HubunganTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onEdit,
  onDelete,
  onRestore,
  onAddNew,
  onLoadMore,
  hasMore = false,
  headerAction,
  onSearch,
  searchTerm = '',
}) => {
  const { colorMode } = useColorMode();
  const [localSearchValue, setLocalSearchValue] = useState(searchTerm);
  const { colorPref } = useContext(AppSettingContext);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalSearchValue(searchTerm);
  }, [searchTerm]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearchValue(value);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (onSearch) onSearch(value);
      }, 300);
    },
    [onSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

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

  const filteredData = initialData;

  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
    }
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
              value={localSearchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleSearchChange(e.target.value);
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
          {filteredData.map((hubungan) => {
            const isDeleted = hubungan.deleted_at;
            return (
              <Box
                key={hubungan.id}
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
                <Flex justify="space-between" align="start" mb={4}>
                  <Text
                    fontWeight="bold"
                    fontSize="lg"
                    noOfLines={1}
                    flex={1}
                    minW={0}
                    mr={2}
                  >
                    {hubungan.nama}
                  </Text>

                  {/* Status Badge - Top Right */}
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

export default HubunganTableAdvance;
