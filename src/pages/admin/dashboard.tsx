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
  Badge,
  Skeleton,
  Progress,
  GridItem,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiActivity,
  FiPieChart,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import ContainerQuery from '@/components/atoms/ContainerQuery';
import PageRow from '@/components/atoms/PageRow';
import AdminLayout from '@/components/layouts/AdminLayout';
import AccountInfoContext from '@/providers/AccountInfoProvider';
import AppSettingContext from '@/providers/AppSettingProvider';
import { useContext, useEffect, useState } from 'react';
import { NextPageWithLayout } from '@/pages/_app';
import UserProfileActions from '@/components/molecules/UserProfileActions';
import supabase from '@/lib/supabaseClient';

// --- Components ---

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  isLoading?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

const StatCard = ({
  title,
  value,
  icon,
  color,
  isLoading,
  subtitle,
  onClick,
}: StatCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      pos="relative"
      bg={isDark ? 'whiteAlpha.50' : 'white'}
      borderRadius="24px"
      p={6}
      border="1px solid"
      borderColor={isDark ? 'whiteAlpha.100' : 'transparent'}
      transition="all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)"
      cursor={onClick ? 'pointer' : 'default'}
      _hover={{
        transform: 'translateY(-5px)',
      }}
      h="full"
      role="group"
      _before={{
        content: '""',
        pos: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        bottom: '-20px',
        zIndex: '-1',
        background: isDark ? '#000' : '#e3e6ec',
        opacity: isDark ? '0.51' : '0.91',
        filter: 'blur(40px)',
        borderRadius: '24px',
        transition: 'all 0.3s ease',
        display: { base: 'none', md: 'block' },
      }}
    >
      <VStack align="start" spacing={4} h="full" justify="space-between">
        <HStack w="full" justify="space-between" align="start">
          <Box
            p={3}
            bg={isDark ? 'whiteAlpha.50' : `${color}.50`}
            borderRadius="2xl"
            color={isDark ? `${color}.300` : `${color}.500`}
            transition="all 0.3s"
            _groupHover={{
              bg: isDark ? 'whiteAlpha.100' : `${color}.100`,
              transform: 'scale(1.05)',
            }}
          >
            <Icon as={icon} boxSize={6} />
          </Box>
          <Icon
            as={FiTrendingUp}
            color={isDark ? 'whiteAlpha.200' : 'gray.300'}
            boxSize={12}
            pos="absolute"
            right={4}
            top={4}
            opacity={0.5}
          />
        </HStack>

        <VStack align="start" spacing={1} w="full">
          <Skeleton isLoaded={!isLoading} minW="100px">
            <Text
              fontSize="4xl"
              fontWeight="800"
              color={isDark ? 'white' : 'gray.900'}
              lineHeight="1"
              letterSpacing="-0.03em"
            >
              {value}
            </Text>
          </Skeleton>
          <Text
            fontSize="xs"
            color={isDark ? 'gray.400' : 'gray.500'}
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            {title}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

// Attendance Pie Chart (CSS Only)
const AttendanceChart = ({
  total,
  hadir,
  isLoading,
}: {
  total: number;
  hadir: number;
  isLoading: boolean;
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

  const colorScheme =
    percentage >= 80 ? 'green' : percentage >= 50 ? 'blue' : 'orange';
  const colorHex =
    percentage >= 80 ? '#48BB78' : percentage >= 50 ? '#4299E1' : '#ED8936';
  const trackColor = isDark ? 'rgba(255,255,255,0.05)' : '#EDF2F7';

  return (
    <Box
      pos="relative"
      bg={isDark ? 'whiteAlpha.50' : 'white'}
      borderRadius="24px"
      p={8}
      border="1px solid"
      borderColor={isDark ? 'whiteAlpha.100' : 'transparent'}
      h="full"
      _before={{
        content: '""',
        pos: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        bottom: '-20px',
        zIndex: '-1',
        background: isDark ? '#000' : '#e3e6ec',
        opacity: isDark ? '0.51' : '0.91',
        filter: 'blur(40px)',
        borderRadius: '24px',
        display: { base: 'none', md: 'block' },
      }}
    >
      <VStack spacing={6} h="full" justify="space-between">
        <HStack w="full" justify="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="md" color={isDark ? 'white' : 'gray.800'}>
              Tingkat Kehadiran
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Live Attendance Rate
            </Text>
          </VStack>
          <Box
            p={2}
            bg={isDark ? 'whiteAlpha.100' : 'gray.100'}
            borderRadius="lg"
          >
            <Icon as={FiActivity} color={colorHex} />
          </Box>
        </HStack>

        <Box
          pos="relative"
          w="220px"
          h="220px"
          borderRadius="full"
          background={`conic-gradient(${colorHex} ${percentage}%, ${trackColor} 0)`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
        >
          <Box
            w="180px"
            h="180px"
            borderRadius="full"
            bg={isDark ? '#1A202C' : 'white'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            boxShadow="inner"
          >
            <Skeleton isLoaded={!isLoading}>
              <VStack spacing={0}>
                <Text
                  fontSize="5xl"
                  fontWeight="800"
                  color={isDark ? 'white' : 'gray.800'}
                  lineHeight="1"
                >
                  {percentage}%
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color="gray.500"
                  textTransform="uppercase"
                >
                  Hadir
                </Text>
              </VStack>
            </Skeleton>
          </Box>
        </Box>

        <HStack spacing={8} w="full" justify="center">
          <VStack spacing={0}>
            <Text fontSize="xs" color="gray.500">
              Total Tamu
            </Text>
            <Text fontWeight="bold" fontSize="lg">
              {total}
            </Text>
          </VStack>
          <Box w="1px" h="24px" bg={isDark ? 'whiteAlpha.200' : 'gray.200'} />
          <VStack spacing={0}>
            <Text fontSize="xs" color="gray.500">
              Sudah Hadir
            </Text>
            <Text fontWeight="bold" fontSize="lg" color={colorHex as any}>
              {hadir}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </Box>
  );
};

// Distribution List Card
const DistributionStats = ({
  total,
  belumHadir,
  isLoading,
}: {
  total: number;
  belumHadir: number;
  isLoading: boolean;
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const belumHadirPercent =
    total > 0 ? Math.round((belumHadir / total) * 100) : 0;

  return (
    <Box
      pos="relative"
      bg={isDark ? 'whiteAlpha.50' : 'white'}
      borderRadius="24px"
      p={8}
      border="1px solid"
      borderColor={isDark ? 'whiteAlpha.100' : 'transparent'}
      h="full"
      _before={{
        content: '""',
        pos: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        bottom: '-20px',
        zIndex: '-1',
        background: isDark ? '#000' : '#e3e6ec',
        opacity: isDark ? '0.51' : '0.91',
        filter: 'blur(40px)',
        borderRadius: '24px',
        display: { base: 'none', md: 'block' },
      }}
    >
      <VStack spacing={6} align="stretch" h="full">
        <HStack w="full" justify="space-between" mb={2}>
          <VStack align="start" spacing={1}>
            <Heading size="md" color={isDark ? 'white' : 'gray.800'}>
              Status Undangan
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Overview Distribusi
            </Text>
          </VStack>
          <Box
            p={2}
            bg={isDark ? 'whiteAlpha.100' : 'gray.100'}
            borderRadius="lg"
          >
            <Icon as={FiPieChart} color="purple.500" />
          </Box>
        </HStack>

        {/* Stacked Bars */}
        <VStack spacing={6} justify="center" flex={1}>
          <Box w="full">
            <Flex justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="600">
                Belum Hadir
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                {belumHadir} Tamu
              </Text>
            </Flex>
            <Progress
              value={belumHadirPercent}
              size="sm"
              colorScheme="orange"
              borderRadius="full"
              bg={isDark ? 'whiteAlpha.100' : 'gray.100'}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {belumHadirPercent}% dari total undangan
            </Text>
          </Box>

          <Box w="full">
            <Flex justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="600">
                Total Kapasitas
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                {total} Pax
              </Text>
            </Flex>
            <Progress
              value={100}
              size="sm"
              colorScheme="blue"
              borderRadius="full"
              bg={isDark ? 'whiteAlpha.100' : 'gray.100'}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              Kapasitas Maksimal
            </Text>
          </Box>
        </VStack>

        <Box
          p={4}
          bg={isDark ? 'whiteAlpha.50' : 'blue.50'}
          borderRadius="xl"
          border="1px dashed"
          borderColor={isDark ? 'whiteAlpha.200' : 'blue.200'}
        >
          <HStack>
            <Icon as={FiClock} color="blue.400" />
            <Text fontSize="xs" color={isDark ? 'gray.400' : 'blue.600'}>
              Data diperbarui secara real-time saat tamu melakukan scan QR Code.
            </Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

// --- Main Page ---

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

  const activeRoleName =
    accountInfo?.role?.find((r) => r.id === accountInfo?.activeRole)?.name ||
    'No Role';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: tamuCount } = await supabase
          .from('tamu')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null);

        const { count: ucapanCount } = await supabase
          .from('ucapan')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null);

        const { count: hadirCount } = await supabase
          .from('tamu')
          .select('*', { count: 'exact', head: true })
          .eq('status_kehadiran', 'hadir')
          .is('deleted_at', null);

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
          <VStack spacing={10} align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="center" gap={4}>
              <Box>
                <Heading
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="800"
                  color={isDark ? 'white' : 'gray.900'}
                  letterSpacing="-0.03em"
                  mb={2}
                >
                  Dashboard
                </Heading>
                <HStack spacing={3}>
                  <Text
                    fontSize="sm"
                    color={isDark ? 'gray.400' : 'gray.500'}
                    fontWeight="500"
                  >
                    Welcome back,{' '}
                    <Box
                      as="span"
                      color={isDark ? 'white' : 'gray.900'}
                      fontWeight="700"
                    >
                      {accountInfo?.name || 'User'}
                    </Box>
                  </Text>
                  <Badge
                    bg={isDark ? 'whiteAlpha.200' : 'gray.100'}
                    color={isDark ? 'white' : 'gray.800'}
                    fontSize="10px"
                    px={2}
                    py={1}
                    borderRadius="full"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    fontWeight="700"
                  >
                    {activeRoleName}
                  </Badge>
                </HStack>
              </Box>

              <Box display={{ base: 'none', md: 'block' }}>
                <UserProfileActions />
              </Box>
            </Flex>

            {/* Stats Cards Grid */}
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 4 }}
              spacing={{ base: 6, lg: 6 }}
            >
              <StatCard
                title="Total Tamu"
                value={stats.totalTamu}
                icon={FiUsers}
                color="blue"
                isLoading={isLoading}
                onClick={() => router.push('/admin/tamu')}
              />
              <StatCard
                title="Hadir"
                value={stats.hadir}
                icon={FiCheckCircle}
                color="green"
                isLoading={isLoading}
                onClick={() => router.push('/admin/checkin')}
              />
              <StatCard
                title="Belum Hadir"
                value={stats.belumHadir}
                icon={FiClock}
                color="orange"
                isLoading={isLoading}
                onClick={() => router.push('/admin/tamu?status=belum_hadir')}
              />
              <StatCard
                title="Ucapan"
                value={stats.totalUcapan}
                icon={FiMessageSquare}
                color="pink"
                isLoading={isLoading}
                onClick={() => router.push('/admin/ucapan')}
              />
            </SimpleGrid>

            {/* Charts Grid - New Section */}
            <Text fontSize="lg" fontWeight="800" letterSpacing="-0.02em" mt={4}>
              Analytics & Insight
            </Text>

            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              {/* Attendance Chart (Donut) takes 1 col */}
              <GridItem colSpan={1}>
                <AttendanceChart
                  total={stats.totalTamu}
                  hadir={stats.hadir}
                  isLoading={isLoading}
                />
              </GridItem>

              {/* Distribution / Activity (Bars) takes 2 cols for variety */}
              <GridItem colSpan={{ base: 1, lg: 2 }}>
                <DistributionStats
                  total={stats.totalTamu}
                  belumHadir={stats.belumHadir}
                  isLoading={isLoading}
                />
              </GridItem>
            </SimpleGrid>
          </VStack>
        </ContainerQuery>
      </PageRow>
    </Box>
  );
};

DashboardPage.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default DashboardPage;
