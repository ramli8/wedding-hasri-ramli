import React, { useState, useEffect } from 'react';
import {
  VStack,
  Flex,
  Box,
  useColorMode,
  Text,
  Button,
  Badge,
  HStack,
  Icon,
} from '@chakra-ui/react';
import Head from 'next/head';
import AdminLayout from '@/components/layouts/AdminLayout';
import { NextPageWithLayout } from '@/pages/_app';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UcapanAPI from '../services/UcapanAPI';
import { UcapanWithReplies } from '../types/Ucapan.types';
import UcapanTableAdvance from '../components/UcapanTableAdvance';
import { showSuccessAlert, showErrorAlert } from '@/utils/sweetalert';
import UserProfileActions from '@/components/molecules/UserProfileActions';

import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';

const UcapanListPage: NextPageWithLayout = () => {
  const [ucapanList, setUcapanList] = useState<UcapanWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'replied' | 'unreplied'
  >('all');

  const api = React.useMemo(() => new UcapanAPI(), []);
  const { colorMode } = useColorMode();

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getUcapan();
      setUcapanList(data);
    } catch (error: any) {
      showErrorAlert('Gagal memuat data ucapan', error.message, colorMode);
    } finally {
      setLoading(false);
    }
  }, [api, colorMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate counts
  const counts = React.useMemo(() => {
    return {
      all: ucapanList.length,
      replied: ucapanList.filter((u) => u.replies && u.replies.length > 0)
        .length,
      unreplied: ucapanList.filter((u) => !u.replies || u.replies.length === 0)
        .length,
    };
  }, [ucapanList]);

  // Filter Logic
  const filteredUcapan = React.useMemo(() => {
    if (filterStatus === 'replied')
      return ucapanList.filter((u) => u.replies && u.replies.length > 0);
    if (filterStatus === 'unreplied')
      return ucapanList.filter((u) => !u.replies || u.replies.length === 0);
    return ucapanList;
  }, [ucapanList, filterStatus]);

  const handleDeleteUcapan = async (id: string) => {
    try {
      await api.deleteUcapan(id);
      showSuccessAlert('Ucapan berhasil dihapus', colorMode);
      fetchData();
    } catch (error: any) {
      showErrorAlert('Gagal menghapus ucapan', error.message, colorMode);
    }
  };

  return (
    <Box p={4}>
      <PageRow>
        <ContainerQuery>
          <VStack spacing={6} align="stretch">
            {/* Header Section */}
            <Flex
              justify="space-between"
              align={{ base: 'center', md: 'center' }}
              direction={{ base: 'row', md: 'row' }}
              gap={{ base: 2, md: 4 }}
              wrap={{ base: 'nowrap', md: 'nowrap' }}
            >
              <VStack align="start" spacing={1} flex={1} minW={0}>
                <Text
                  fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }}
                  fontWeight="700"
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                  noOfLines={1}
                >
                  Manajemen Ucapan
                </Text>
                <Text
                  fontSize={{ base: 'xs', sm: 'sm' }}
                  color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
                  noOfLines={2}
                >
                  Kelola ucapan dari tamu. Gunakan "Copy Link" untuk mendapatkan
                  magic link dan balas langsung di halaman utama.
                </Text>
              </VStack>

              {/* User Profile & Actions */}
              <Box flexShrink={0} display={{ base: 'none', md: 'block' }}>
                <UserProfileActions />
              </Box>
            </Flex>

            {/* Content */}
            {/* Filter Tabs */}
            <Box>
              <HStack spacing={2} overflowX="auto" pb={2}>
                {[
                  { id: 'all', label: 'Semua', count: counts.all },
                  {
                    id: 'replied',
                    label: 'Sudah Dibalas',
                    count: counts.replied,
                  },
                  {
                    id: 'unreplied',
                    label: 'Belum Dibalas',
                    count: counts.unreplied,
                  },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    size="sm"
                    variant={filterStatus === tab.id ? 'solid' : 'ghost'}
                    bg={
                      filterStatus === tab.id
                        ? colorMode === 'light'
                          ? 'gray.900'
                          : 'white'
                        : 'transparent'
                    }
                    color={
                      filterStatus === tab.id
                        ? colorMode === 'light'
                          ? 'white'
                          : 'gray.900'
                        : 'gray.500'
                    }
                    _hover={{
                      bg:
                        filterStatus === tab.id
                          ? colorMode === 'light'
                            ? 'gray.900'
                            : 'white'
                          : colorMode === 'light'
                          ? 'gray.100'
                          : 'whiteAlpha.200',
                    }}
                    onClick={() => setFilterStatus(tab.id as any)}
                    borderRadius="full"
                    leftIcon={
                      <Badge
                        bg={
                          filterStatus === tab.id
                            ? colorMode === 'light'
                              ? 'whiteAlpha.300'
                              : 'blackAlpha.300'
                            : colorMode === 'light'
                            ? 'gray.200'
                            : 'whiteAlpha.300'
                        }
                        color={
                          filterStatus === tab.id
                            ? colorMode === 'light'
                              ? 'white'
                              : 'gray.900'
                            : 'gray.500'
                        }
                        fontSize="10px"
                        px={1.5}
                        borderRadius="full"
                      >
                        {tab.count}
                      </Badge>
                    }
                  >
                    {tab.label}
                  </Button>
                ))}
              </HStack>
            </Box>

            {/* Content */}
            <UcapanTableAdvance
              initialData={filteredUcapan}
              loading={loading}
              onReply={() => {}} // Not used anymore
              onDelete={handleDeleteUcapan}
              onRefresh={fetchData}
              headerAction={
                <PrimaryButton onClick={fetchData} size="md">
                  <HStack spacing={2}>
                    <Icon
                      viewBox="0 0 24 24"
                      width="20px"
                      height="20px"
                      fill="currentColor"
                    >
                      <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
                    </Icon>
                    <Text>Refresh Data</Text>
                  </HStack>
                </PrimaryButton>
              }
            />
          </VStack>
        </ContainerQuery>
      </PageRow>
    </Box>
  );
};

export default UcapanListPage;
