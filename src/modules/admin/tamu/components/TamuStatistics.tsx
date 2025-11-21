import React, { useMemo } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Flex,
  useColorMode,
  Text,
} from '@chakra-ui/react';
import { Tamu } from '../types/Tamu.types';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';

interface TamuStatisticsProps {
  data: Tamu[];
}

const TamuStatistics: React.FC<TamuStatisticsProps> = ({ data }) => {
  const { colorMode } = useColorMode();

  const stats = useMemo(() => {
    const total = data.length;
    const akanHadir = data.filter((t) => t.konfirmasi_kehadiran === 'akan_hadir').length;
    const tidakHadir = data.filter((t) => t.konfirmasi_kehadiran === 'tidak_hadir').length;
    const belumKonfirmasi = data.filter((t) => t.konfirmasi_kehadiran === 'belum_konfirmasi').length;
    const undanganDikirim = data.filter((t) => t.status_undangan === 'dikirim').length;
    const undanganBelumDikirim = data.filter((t) => t.status_undangan === 'belum_dikirim').length;

    return {
      total,
      akanHadir,
      tidakHadir,
      belumKonfirmasi,
      undanganDikirim,
      undanganBelumDikirim,
    };
  }, [data]);

  const StatCard = ({ label, value, icon, helpText }: any) => (
    <Box
      pos="relative"
      bg={colorMode === 'light' ? 'white' : 'black'}
      p={5}
      borderRadius="24px"
      border="1px solid"
      borderColor={colorMode === 'light' ? 'gray.200' : 'gray.800'}
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-2px)' }}
      _before={{
        content: '""',
        pos: "absolute",
        top: "43px",
        left: "20px",
        right: "20px",
        bottom: "-43px",
        zIndex: "-1",
        background: colorMode == "light" ? "#e3e6ec" : "#000",
        opacity: colorMode == "light" ? "0.91" : "0.51",
        filter: "blur(86.985px)",
        borderRadius: "24px",
      }}
    >
      <Flex justifyContent="space-between" alignItems="start" mb={2}>
        <Box>
          <Text fontSize="sm" color="gray.500" fontWeight="medium" mb={1}>
            {label}
          </Text>
          <Text fontSize="3xl" fontWeight="800" color={colorMode === 'light' ? 'black' : 'white'}>
            {value}
          </Text>
        </Box>
        <Flex
          alignItems="center"
          justifyContent="center"
          w={10}
          h={10}
          borderRadius="xl"
          bg={colorMode === 'light' ? 'black' : 'white'}
          color={colorMode === 'light' ? 'white' : 'black'}
        >
          <MaterialIcon name={icon} size={20} weight={600} />
        </Flex>
      </Flex>
      {helpText && (
        <Text fontSize="xs" color="gray.500">
          {helpText}
        </Text>
      )}
    </Box>
  );

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
      <StatCard
        label="Total Tamu"
        value={stats.total}
        icon="people"
        helpText="Total seluruh tamu undangan"
      />
      <StatCard
        label="Akan Hadir"
        value={stats.akanHadir}
        icon="check_circle"
        helpText={`${((stats.akanHadir / stats.total) * 100 || 0).toFixed(1)}% dari total tamu`}
      />
      <StatCard
        label="Belum Konfirmasi"
        value={stats.belumKonfirmasi}
        icon="help"
        helpText="Menunggu respon"
      />
      <StatCard
        label="Undangan Terkirim"
        value={stats.undanganDikirim}
        icon="send"
        helpText={`${stats.undanganBelumDikirim} belum dikirim`}
      />
    </SimpleGrid>
  );
};

export default TamuStatistics;
