import {
  Box,
  Heading,
  VStack,
  Flex,
  Text,
  useColorMode,
  HStack,
  SimpleGrid,
  Icon,
  Button,
  Divider,
  Badge,
  Skeleton,
} from '@chakra-ui/react';
import { FiUsers, FiMessageSquare, FiCheckCircle, FiClock, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { useRouter } from 'next/router';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import PageRow from '@/components/atoms/PageRow';
import withAuth from '@/hoc/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import AppSettingContext from '@/providers/AppSettingProvider';
import { useContext, useEffect, useState } from 'react';
import { NextPageWithLayout } from '@/pages/_app';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import supabase from '@/lib/supabaseClient';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  isLoading?: boolean;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon, color, isLoading, onClick }: StatCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? 'gray.800' : 'white'}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={isDark ? 'gray.700' : 'gray.200'}
      transition="all 0.2s"
      cursor={onClick ? 'pointer' : 'default'}
      _hover={onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
        borderColor: `${color}.500`,
      } : {}}
      onClick={onClick}
    >
      <HStack spacing={4} align="start">
        <Box
          p={3}
          bg={isDark ? `${color}.900` : `${color}.50`}
          borderRadius="lg"
        >
          <Icon
            as={icon}
            boxSize={6}
            color={isDark ? `${color}.300` : `${color}.500`}
          />
        </Box>
        <VStack align="start" spacing={1} flex={1}>
          <Text
            fontSize="sm"
            color={isDark ? 'gray.400' : 'gray.600'}
            fontWeight="500"
          >
            {title}
          </Text>
          <Skeleton isLoaded={!isLoading}>
            <Text
              fontSize="3xl"
              fontWeight="800"
              color={isDark ? 'white' : 'gray.900'}
            >
              {value}
            </Text>
          </Skeleton>
        </VStack>
      </HStack>
    </Box>
  );
};

const DashboardPage: NextPageWithLayout = () => {
  const accountInfo = useContext(AccountInfoContext);
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const router = useRouter();

  // Stats state
  const [stats, setStats] = useState({
    totalTamu: 0,
    totalUcapan: 0,
    hadir: 0,
    belumHadir: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Find the role name
  const activeRoleName =
    accountInfo?.role?.find((r) => r.id === accountInfo?.activeRole)?.name ||
    'No Role';

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total tamu
        const { count: tamuCount } = await supabase
          .from('tamu')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null);

        // Fetch total ucapan
        const { count: ucapanCount } = await supabase
          .from('ucapan')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null);

        // Fetch hadir count
        const { count: hadirCount } = await supabase
          .from('tamu')
          .select('*', { count: 'exact', head: true })
          .eq('status_kehadiran', 'hadir')
          .is('deleted_at', null);

        // Fetch belum hadir (null or 'belum hadir')
        const { count: belumHadirCount } = await supabase
          .from('tamu')
          .select('*', { count: 'exact', head: true })
          .or('status_kehadiran.is.null,status_kehadiran.eq.belum hadir')
          .is('deleted_at', null);

        setStats({
          totalTamu: tamuCount || 0,
          totalUcapan: ucapanCount || 0,
          hadir: hadirCount || 0,
          belumHadir: belumHadirCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const isDark = colorMode === 'dark';

  return (
    <Box p={4}>
      <PageRow>
        <ContainerQuery>
          <VStack spacing={8} align="stretch">
            {/* Header Section */}
            <Flex
              justify="space-between"
              align={{ base: 'start', md: 'center' }}
              direction={{ base: 'column', md: 'row' }}
              gap={4}
            >
              <VStack align="start" spacing={2}>
                <Heading
                  size="xl"
                  fontWeight="800"
                  letterSpacing="tight"
                  color={isDark ? 'white' : 'gray.900'}
                >
                  Dashboard
                </Heading>
                <HStack spacing={2}>
                  <Text
                    fontSize="sm"
                    color={isDark ? 'gray.400' : 'gray.600'}
                  >
                    Welcome back,
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color={isDark ? 'white' : 'gray.900'}
                  >
                    {accountInfo?.name || 'User'}
                  </Text>
                  <Badge
                    colorScheme={colorPref}
                    variant="subtle"
                    fontSize="xs"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {activeRoleName}
                  </Badge>
                </HStack>
              </VStack>

              <Box display={{ base: 'none', md: 'block' }}>
                <UserProfileActions />
              </Box>
            </Flex>

            <Divider />

            {/* Statistics Cards */}
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    color={isDark ? 'white' : 'gray.900'}
                  >
                    Overview
                  </Text>
                  <Text
                    fontSize="sm"
                    color={isDark ? 'gray.400' : 'gray.600'}
                  >
                    Quick statistics at a glance
                  </Text>
                </VStack>
                <Icon
                  as={FiTrendingUp}
                  boxSize={5}
                  color={isDark ? `${colorPref}.400` : `${colorPref}.500`}
                />
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <StatCard
                  title="Total Tamu"
                  value={stats.totalTamu}
                  icon={FiUsers}
                  color="blue"
                  isLoading={isLoading}
                  onClick={() => router.push('/admin/tamu')}
                />
                <StatCard
                  title="Total Ucapan"
                  value={stats.totalUcapan}
                  icon={FiMessageSquare}
                  color="purple"
                  isLoading={isLoading}
                  onClick={() => router.push('/admin/ucapan')}
                />
                <StatCard
                  title="Sudah Hadir"
                  value={stats.hadir}
                  icon={FiCheckCircle}
                  color="green"
                  isLoading={isLoading}
                  onClick={() => router.push('/admin/tamu?status=hadir')}
                />
                <StatCard
                  title="Belum Hadir"
                  value={stats.belumHadir}
                  icon={FiClock}
                  color="orange"
                  isLoading={isLoading}
                  onClick={() => router.push('/admin/tamu?status=belum_hadir')}
                />
              </SimpleGrid>
            </VStack>

            <Divider />

            {/* Quick Actions */}
            <VStack spacing={6} align="stretch">
              <VStack align="start" spacing={1}>
                <Text
                  fontSize="lg"
                  fontWeight="700"
                  color={isDark ? 'white' : 'gray.900'}
                >
                  Quick Actions
                </Text>
                <Text
                  fontSize="sm"
                  color={isDark ? 'gray.400' : 'gray.600'}
                >
                  Common tasks and shortcuts
                </Text>
              </VStack>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                <Button
                  size="lg"
                  h="auto"
                  py={6}
                  bg={isDark ? 'gray.800' : 'white'}
                  border="1px solid"
                  borderColor={isDark ? 'gray.700' : 'gray.200'}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                    borderColor: `${colorPref}.500`,
                  }}
                  onClick={() => router.push('/admin/tamu')}
                  justifyContent="start"
                >
                  <HStack spacing={3} w="full">
                    <Icon as={FiUsers} boxSize={5} color={`${colorPref}.500`} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="600" fontSize="md">
                        Kelola Tamu
                      </Text>
                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.600'}>
                        Tambah, edit, hapus data tamu
                      </Text>
                    </VStack>
                  </HStack>
                </Button>

                <Button
                  size="lg"
                  h="auto"
                  py={6}
                  bg={isDark ? 'gray.800' : 'white'}
                  border="1px solid"
                  borderColor={isDark ? 'gray.700' : 'gray.200'}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                    borderColor: `${colorPref}.500`,
                  }}
                  onClick={() => router.push('/admin/checkin')}
                  justifyContent="start"
                >
                  <HStack spacing={3} w="full">
                    <Icon as={FiCalendar} boxSize={5} color={`${colorPref}.500`} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="600" fontSize="md">
                        Check In
                      </Text>
                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.600'}>
                        Scan QR tamu yang hadir
                      </Text>
                    </VStack>
                  </HStack>
                </Button>

                <Button
                  size="lg"
                  h="auto"
                  py={6}
                  bg={isDark ? 'gray.800' : 'white'}
                  border="1px solid"
                  borderColor={isDark ? 'gray.700' : 'gray.200'}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                    borderColor: `${colorPref}.500`,
                  }}
                  onClick={() => router.push('/admin/ucapan')}
                  justifyContent="start"
                >
                  <HStack spacing={3} w="full">
                    <Icon as={FiMessageSquare} boxSize={5} color={`${colorPref}.500`} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="600" fontSize="md">
                        Lihat Ucapan
                      </Text>
                      <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.600'}>
                        Baca ucapan dari tamu
                      </Text>
                    </VStack>
                  </HStack>
                </Button>
              </SimpleGrid>
            </VStack>
          </VStack>
        </ContainerQuery>
      </PageRow>
    </Box>
  );
};

const ProtectedDashboardPage = withAuth(DashboardPage);

(ProtectedDashboardPage as any).getLayout = function getLayout(
  page: React.ReactElement
) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default ProtectedDashboardPage;
