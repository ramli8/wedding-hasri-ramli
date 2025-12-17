import React, { useState, useContext, useEffect } from 'react';
import {
  VStack,
  Flex,
  Box,
  useColorMode,
  Text,
  HStack,
  Button,
  Badge,
} from '@chakra-ui/react';
import Head from 'next/head';
import AdminLayout from '@/components/layouts/AdminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UcapanAPI from '../services/UcapanAPI';
import { UcapanWithReplies } from '../types/Ucapan.types';
import UcapanTableAdvance from '../components/UcapanTableAdvance';
import UcapanDetailModal from '../components/UcapanDetailModal';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import FilterTabs from '@/components/molecules/FilterTabs';
import AppSettingContext from '@/providers/AppSettingProvider';

const UcapanListPage: NextPageWithLayout = () => {
  const [ucapanList, setUcapanList] = useState<UcapanWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [filterReply, setFilterReply] = useState<
    'all' | 'replied' | 'unreplied'
  >('all');
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    active: 0,
    inactive: 0,
  });
  const [selectedUcapan, setSelectedUcapan] =
    useState<UcapanWithReplies | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [hasMore, setHasMore] = useState(true);

  const api = React.useMemo(() => new UcapanAPI(), []);
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);

  const fetchCounts = async () => {
    try {
      const counts = await api.getCounts();
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchData = React.useCallback(
    async (resetPagination = true) => {
      try {
        setLoading(true);
        const page = resetPagination ? 1 : pagination.page;
        const response = await api.getUcapan(page, pagination.limit, {
          status: filterStatus,
        });

        if (resetPagination) {
          setUcapanList(response.data);
        } else {
          setUcapanList((prev) => [...prev, ...response.data]);
        }

        if (response.pagination) {
          setPagination(response.pagination);
          setHasMore(
            response.pagination.page < response.pagination.totalPages &&
              response.data.length === response.pagination.limit
          );
        } else {
          setHasMore(false);
        }
      } catch (error: any) {
        showErrorAlert('Gagal memuat data ucapan', error.message, colorMode);
      } finally {
        setLoading(false);
      }
    },
    [api, colorMode, pagination.page, pagination.limit]
  );

  const loadMore = React.useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const nextPage = pagination.page + 1;
      const response = await api.getUcapan(nextPage, pagination.limit);

      setUcapanList((prev) => [...prev, ...response.data]);

      if (response.pagination) {
        setPagination(response.pagination);
        setHasMore(
          response.pagination.page < response.pagination.totalPages &&
            response.data.length === response.pagination.limit
        );
      }
    } catch (error: any) {
      showErrorAlert('Gagal memuat data', error.message, colorMode);
    } finally {
      setLoading(false);
    }
  }, [api, pagination, hasMore, loading, colorMode, filterStatus]);

  useEffect(() => {
    fetchData(true);
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  // Use server-side counts for status filter
  const counts = statusCounts;

  // Calculate counts for reply filter (client-side since server doesn't have this)
  const replyCounts = React.useMemo(() => {
    return {
      all: ucapanList.length,
      replied: ucapanList.filter((u) => u.replies && u.replies.length > 0)
        .length,
      unreplied: ucapanList.filter((u) => !u.replies || u.replies.length === 0)
        .length,
    };
  }, [ucapanList]);

  // Apply reply filter only (status already filtered by server)
  const filteredUcapan = React.useMemo(() => {
    let result = ucapanList;

    // Apply reply filter (client-side)
    if (filterReply === 'replied') {
      result = result.filter((u) => u.replies && u.replies.length > 0);
    } else if (filterReply === 'unreplied') {
      result = result.filter((u) => !u.replies || u.replies.length === 0);
    }

    return result;
  }, [ucapanList, filterReply]);

  const handleDeleteUcapan = async (id: string) => {
    try {
      await api.deleteUcapan(id);
      showSuccessAlert('Ucapan berhasil dihapus', colorMode);
      fetchData(true);
      fetchCounts();
    } catch (error: any) {
      showErrorAlert('Gagal menghapus ucapan', error.message, colorMode);
    }
  };

  const handleRestoreUcapan = async (id: string) => {
    try {
      await api.restoreUcapan(id);
      showSuccessAlert('Ucapan berhasil dipulihkan', colorMode);
      fetchData(true);
      fetchCounts();
    } catch (error: any) {
      showErrorAlert('Gagal memulihkan ucapan', error.message, colorMode);
    }
  };

  const handleViewDetail = (ucapan: UcapanWithReplies) => {
    setSelectedUcapan(ucapan);
    setShowDetailModal(true);
  };

  const handleDeleteReply = async (id: string) => {
    try {
      await api.deleteUcapan(id);
      showSuccessAlert('Balasan berhasil dihapus', colorMode);
      // Close modal and refresh data
      setShowDetailModal(false);
      setSelectedUcapan(null);
      await fetchData();
    } catch (error: any) {
      showErrorAlert('Gagal menghapus balasan', error.message, colorMode);
    }
  };

  const handleRestoreReply = async (id: string) => {
    try {
      await api.restoreUcapan(id);
      showSuccessAlert('Balasan berhasil dipulihkan', colorMode);
      // Close modal and refresh data
      setShowDetailModal(false);
      setSelectedUcapan(null);
      await fetchData();
    } catch (error: any) {
      showErrorAlert('Gagal memulihkan balasan', error.message, colorMode);
    }
  };

  return (
    <>
      <Box p={4}>
        <PageRow>
          <ContainerQuery>
            <VStack spacing={6} align="stretch">
              {/* Header Section - Clean Typography */}
              {/* Header Section - Minimalist & Modern */}
              <Flex justify="space-between" align="center" mb={6} gap={4}>
                <Box>
                  <Text
                    fontSize={{ base: 'xl', md: '2xl' }}
                    fontWeight="700"
                    color={colorMode === 'light' ? 'gray.900' : 'white'}
                    letterSpacing="-0.02em"
                    mb="4px"
                  >
                    Data Ucapan
                  </Text>
                  <Text
                    fontSize="14px"
                    color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                    fontWeight="400"
                  >
                    Kelola seluruh ucapan dan doa dari tamu undangan
                  </Text>
                </Box>

                {/* User Profile & Actions */}
                <Box display={{ base: 'none', md: 'block' }}>
                  <UserProfileActions />
                </Box>
              </Flex>

              <VStack align="stretch" spacing={4} pb={4}>
                {/* Main Filter (Status) */}
                <Box>
                  <FilterTabs
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    counts={counts}
                  />
                </Box>

                {/* Secondary Filters Group (Reply Status) */}
                <Box
                  pos="relative"
                  bg={colorMode === 'light' ? 'white' : 'whiteAlpha.50'}
                  p={{ base: 4, md: 6 }}
                  borderRadius="24px"
                  borderWidth="1px"
                  borderColor={
                    colorMode === 'light' ? 'transparent' : 'whiteAlpha.100'
                  }
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
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text
                        fontSize="11px"
                        fontWeight="700"
                        mb={3}
                        color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                      >
                        Filter Status Balasan
                      </Text>
                      <Box
                        overflowX="auto"
                        mx={{ base: -3, md: 0 }}
                        px={{ base: 3, md: 0 }}
                        pb={1}
                        css={{
                          '&::-webkit-scrollbar': { display: 'none' },
                          scrollbarWidth: 'none',
                        }}
                      >
                        <Box
                          bg={
                            colorMode === 'light'
                              ? 'gray.100'
                              : 'whiteAlpha.100'
                          }
                          p={1}
                          borderRadius="full"
                          display="inline-flex"
                          w={{ base: 'full', md: 'fit-content' }}
                          minW={{ base: 'full', md: 'auto' }}
                        >
                          <HStack
                            spacing={0}
                            w="full"
                            justify={{
                              base: 'space-between',
                              md: 'flex-start',
                            }}
                          >
                            {[
                              {
                                id: 'all',
                                label: 'Semua',
                                count: replyCounts.all,
                              },
                              {
                                id: 'replied',
                                label: 'Dibalas',
                                count: replyCounts.replied,
                              },
                              {
                                id: 'unreplied',
                                label: 'Belum',
                                count: replyCounts.unreplied,
                              },
                            ].map((tab) => {
                              const isActive = filterReply === tab.id;
                              return (
                                <Button
                                  key={tab.id}
                                  onClick={() => setFilterReply(tab.id as any)}
                                  size="sm"
                                  borderRadius="full"
                                  variant="ghost"
                                  bg={
                                    isActive
                                      ? colorMode === 'light'
                                        ? 'white'
                                        : 'gray.700'
                                      : 'transparent'
                                  }
                                  color={
                                    isActive
                                      ? colorMode === 'light'
                                        ? 'gray.900'
                                        : 'white'
                                      : colorMode === 'light'
                                      ? 'gray.500'
                                      : 'gray.400'
                                  }
                                  boxShadow={isActive ? 'sm' : 'none'}
                                  _hover={{
                                    bg: isActive
                                      ? colorMode === 'light'
                                        ? 'white'
                                        : 'gray.700'
                                      : colorMode === 'light'
                                      ? 'blackAlpha.50'
                                      : 'whiteAlpha.50',
                                  }}
                                  px={{ base: 2, md: 4 }}
                                  h="32px"
                                  fontWeight="600"
                                  fontSize={{ base: 'xs', md: 'sm' }}
                                  flex={{ base: 1, md: 'initial' }}
                                  minW="0"
                                >
                                  <HStack spacing={{ base: 1, md: 2 }}>
                                    <Text noOfLines={1}>{tab.label}</Text>
                                    <Badge
                                      bg={
                                        isActive
                                          ? colorMode === 'light'
                                            ? 'gray.100'
                                            : 'gray.600'
                                          : 'transparent'
                                      }
                                      color={
                                        isActive
                                          ? colorMode === 'light'
                                            ? 'gray.800'
                                            : 'gray.200'
                                          : colorMode === 'light'
                                          ? 'gray.500'
                                          : 'gray.400'
                                      }
                                      borderRadius="full"
                                      px={{ base: 1, md: 1.5 }}
                                      fontSize="xs"
                                    >
                                      {tab.count}
                                    </Badge>
                                  </HStack>
                                </Button>
                              );
                            })}
                          </HStack>
                        </Box>
                      </Box>
                    </Box>
                  </VStack>
                </Box>
              </VStack>

              {/* Table */}
              <UcapanTableAdvance
                initialData={filteredUcapan}
                loading={loading}
                onDelete={handleDeleteUcapan}
                onRestore={handleRestoreUcapan}
                onAddNew={() => {}} // Not used for ucapan
                onViewDetail={handleViewDetail}
                onLoadMore={loadMore}
                hasMore={hasMore}
              />
            </VStack>
          </ContainerQuery>
        </PageRow>
      </Box>

      {/* Detail Modal */}
      <UcapanDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        ucapan={selectedUcapan}
        onDeleteReply={handleDeleteReply}
        onRestoreReply={handleRestoreReply}
      />
    </>
  );
};

export default UcapanListPage;
