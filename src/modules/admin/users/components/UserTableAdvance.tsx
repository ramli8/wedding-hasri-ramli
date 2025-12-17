import React, {
  useState,
  useCallback,
  useContext,
  useRef,
  useEffect,
} from 'react';
import {
  Box,
  IconButton,
  HStack,
  Text,
  useColorMode,
  VStack,
  Badge,
  Wrap,
  WrapItem,
  useColorModeValue,
  Flex,
  InputGroup,
  InputLeftElement,
  Input,
  Tooltip,
  Avatar,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showConfirmationAlert } from '@/utils/sweetalert';
import AppSettingContext from '@/providers/AppSettingProvider';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  roles?: Role[];
  created_at?: string;
  deleted_at?: string;
}

interface UserTableAdvanceProps {
  initialData?: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onAddNew?: () => void;
  onCopyMagicLink?: (user: User) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  headerAction?: React.ReactNode;
  onSearch?: (searchTerm: string) => void;
  searchTerm?: string;
}

const UserTableAdvance: React.FC<UserTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onEdit,
  onDelete,
  onRestore,
  onCopyMagicLink,
  onLoadMore,
  hasMore = false,
  headerAction,
  onSearch,
  searchTerm = '',
}) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const [localSearchValue, setLocalSearchValue] = useState(searchTerm);
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

  const filteredData = initialData;

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
          {filteredData.map((user) => {
            const isDeleted = user.deleted_at;
            return (
              <Box
                key={user.id}
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
                {/* User Info */}
                <VStack align="start" spacing={3} mb={4}>
                  <Flex justify="space-between" align="start" w="full">
                    <HStack spacing={3} flex={1} minW={0}>
                      <Avatar
                        name={user.name}
                        size="md"
                        bg={
                          colorMode === 'light'
                            ? `${colorPref}.500`
                            : `${colorPref}.400`
                        }
                        color="white"
                        fontWeight="600"
                        flexShrink={0}
                      />
                      <VStack align="start" spacing={0.5} minW={0} flex={1}>
                        <Text
                          fontWeight="700"
                          fontSize="md"
                          noOfLines={1}
                          title={user.name}
                          color={colorMode === 'light' ? 'gray.900' : 'white'}
                        >
                          {user.name}
                        </Text>
                        <Text
                          fontSize="xs"
                          color={
                            colorMode === 'light' ? 'gray.500' : 'gray.400'
                          }
                          fontWeight="500"
                        >
                          @{user.username}
                        </Text>
                      </VStack>
                    </HStack>

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
                      ml={2}
                    >
                      {isDeleted ? 'Dihapus' : 'Aktif'}
                    </Badge>
                  </Flex>

                  {/* Roles Section */}
                  <Box w="full">
                    {user.roles && user.roles.length > 0 ? (
                      <Wrap spacing={1.5}>
                        {user.roles.map((role) => (
                          <WrapItem key={role.id}>
                            <Badge
                              colorScheme="purple"
                              variant="subtle"
                              fontSize="2xs"
                              fontWeight="600"
                              borderRadius="md"
                              px={2}
                              py={0.5}
                            >
                              {role.name}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    ) : (
                      <Text
                        fontSize="xs"
                        color={colorMode === 'light' ? 'gray.400' : 'gray.500'}
                        fontStyle="italic"
                      >
                        No roles assigned
                      </Text>
                    )}
                  </Box>
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
                      {onCopyMagicLink && (
                        <Tooltip
                          label="Copy Magic Link"
                          hasArrow
                          placement="top"
                        >
                          <IconButton
                            aria-label="Copy Magic Link"
                            icon={<MaterialIcon name="link" size={16} />}
                            size="sm"
                            borderRadius="md"
                            variant="ghost"
                            onClick={() => onCopyMagicLink(user)}
                            color={
                              colorMode === 'light' ? 'teal.600' : 'teal.300'
                            }
                            _hover={{
                              bg:
                                colorMode === 'light'
                                  ? 'teal.50'
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
                          onClick={() => onEdit(user)}
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
                          onClick={() => handleDelete(user.id)}
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
                        onClick={() => onRestore(user.id)}
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

export default UserTableAdvance;
