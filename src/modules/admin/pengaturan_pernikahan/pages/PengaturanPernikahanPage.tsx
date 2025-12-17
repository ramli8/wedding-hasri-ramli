'use client';

import React from 'react';
import { Box, Text, useColorMode, Flex, VStack } from '@chakra-ui/react';
import PengaturanForm from '../components/PengaturanForm';
import { usePengaturanPernikahan } from '../utils/hooks/usePengaturanPernikahan';
import PageRow from '@/components/atoms/PageRow';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import UserProfileActions from '@/components/molecules/UserProfileActions';

const PengaturanPernikahanPage: React.FC = () => {
  const { colorMode } = useColorMode();
  const { pengaturan, loading, error, updatePengaturan } =
    usePengaturanPernikahan();

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <PageRow>
        <ContainerQuery>
          <VStack spacing={6} align="stretch">
            {/* Header Section - Minimalist & Modern */}
            <Flex justify="space-between" align="center" mb={2} gap={4}>
              <Box>
                <Text
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="700"
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                  letterSpacing="-0.02em"
                  mb="4px"
                >
                  Pengaturan Pernikahan
                </Text>
                <Text
                  fontSize="14px"
                  color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
                  fontWeight="400"
                >
                  Kelola data mempelai, acara, dan pengaturan undangan
                </Text>
              </Box>

              {/* User Profile & Actions */}
              <Box display={{ base: 'none', md: 'block' }}>
                <UserProfileActions />
              </Box>
            </Flex>

            {/* Form */}
            <PengaturanForm
              pengaturan={pengaturan}
              onSave={updatePengaturan}
              loading={loading}
            />
          </VStack>
        </ContainerQuery>
      </PageRow>
    </Box>
  );
};

export default PengaturanPernikahanPage;
