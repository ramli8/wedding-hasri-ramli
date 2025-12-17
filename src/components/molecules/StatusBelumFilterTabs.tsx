import React, { useState, useContext } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Button,
  useColorMode,
  Tooltip,
  Collapse,
} from '@chakra-ui/react';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import AppSettingContext from '@/providers/AppSettingProvider';

export type StatusBelumType =
  | ''
  | 'undangan_belum_dikirim'
  | 'undangan_belum_dibaca'
  | 'pengingat_qr_belum_dikirim'
  | 'pengingat_qr_belum_dibaca'
  | 'belum_konfirmasi'
  | 'belum_checkin'
  | 'belum_checkout';

interface StatusBelumFilterTabsProps {
  selectedStatus: StatusBelumType;
  setSelectedStatus: (status: StatusBelumType) => void;
  statusCounts: Record<StatusBelumType, number>;
}

const STATUS_ITEMS: {
  id: StatusBelumType;
  label: string;
  shortLabel: string;
  icon: string;
}[] = [
  {
    id: 'undangan_belum_dikirim',
    label: 'Undangan Belum Dikirim',
    shortLabel: 'Undangan Blm Kirim',
    icon: 'send',
  },
  {
    id: 'undangan_belum_dibaca',
    label: 'Undangan Belum Dibaca',
    shortLabel: 'Undangan Blm Dibaca',
    icon: 'mark_email_unread',
  },
  {
    id: 'pengingat_qr_belum_dikirim',
    label: 'Pengingat QR Belum Dikirim',
    shortLabel: 'Cek QR Blm Kirim',
    icon: 'send',
  },
  {
    id: 'pengingat_qr_belum_dibaca',
    label: 'Pengingat QR Belum Dibaca',
    shortLabel: 'CekQR Blm Baca',
    icon: 'mark_email_unread',
  },
  {
    id: 'belum_konfirmasi',
    label: 'Belum Konfirmasi Kehadiran',
    shortLabel: 'Blm Konfirmasi Kehadiran',
    icon: 'help_outline',
  },
  {
    id: 'belum_checkin',
    label: 'Belum Check-in',
    shortLabel: 'Blm Check-in',
    icon: 'qr_code_scanner',
  },
  {
    id: 'belum_checkout',
    label: 'Belum Check-out',
    shortLabel: 'Blm Check-out',
    icon: 'qr_code_scanner',
  },
];

const StatusBelumFilterTabs: React.FC<StatusBelumFilterTabsProps> = ({
  selectedStatus,
  setSelectedStatus,
  statusCounts,
}) => {
  const { colorMode } = useColorMode();
  const { colorPref } = useContext(AppSettingContext);
  const [isOpen, setIsOpen] = useState(false);

  const bgContainer = colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100';
  const inactiveColor = colorMode === 'light' ? 'gray.500' : 'gray.400';

  const handleClick = (id: StatusBelumType) => {
    // Toggle: if already selected, deselect (show all)
    if (selectedStatus === id) {
      setSelectedStatus('');
    } else {
      setSelectedStatus(id);
    }
  };

  const selectedLabel =
    STATUS_ITEMS.find((s) => s.id === selectedStatus)?.shortLabel ||
    'Semua Status';

  return (
    <Box w="100%">
      {/* Toggle Button */}
      <Box
        bg={bgContainer}
        p={1}
        borderRadius="full"
        display="inline-flex"
        w="fit-content"
        mb={isOpen ? 3 : 0}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="sm"
          bg="transparent"
          color={inactiveColor}
          borderRadius="full"
          variant="ghost"
          _hover={{
            bg: colorMode === 'light' ? 'blackAlpha.50' : 'whiteAlpha.50',
          }}
          h="32px"
          px={4}
          fontWeight="600"
          fontSize="sm"
          rightIcon={
            <MaterialIcon
              name={isOpen ? 'expand_less' : 'expand_more'}
              size={18}
            />
          }
        >
          <HStack spacing={2}>
            <MaterialIcon name="filter_list" size={16} />
            <Text>{selectedLabel}</Text>
          </HStack>
        </Button>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={isOpen} animateOpacity>
        <Box>
          {/* Dashboard Grid */}
          <SimpleGrid
            columns={{ base: 4, sm: 4, md: 7 }}
            spacing={{ base: 2, md: 3 }}
          >
            {STATUS_ITEMS.map((item) => {
              const count = statusCounts[item.id] || 0;
              const isActive = selectedStatus === item.id;

              return (
                <Tooltip
                  key={item.id}
                  label={item.label}
                  placement="top"
                  hasArrow
                  bg={colorMode === 'light' ? 'gray.700' : 'gray.200'}
                  color={colorMode === 'light' ? 'white' : 'gray.800'}
                >
                  <Box
                    as="button"
                    onClick={() => handleClick(item.id)}
                    p={{ base: 2, md: 3 }}
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor={
                      isActive
                        ? colorMode === 'light'
                          ? `${colorPref}.400`
                          : `${colorPref}.500`
                        : colorMode === 'light'
                        ? 'gray.100'
                        : 'whiteAlpha.100'
                    }
                    bg={
                      isActive
                        ? colorMode === 'light'
                          ? `${colorPref}.50`
                          : `${colorPref}.900`
                        : colorMode === 'light'
                        ? 'white'
                        : 'whiteAlpha.50'
                    }
                    shadow="sm"
                    transition="border-color 0.2s"
                    _hover={{
                      borderColor:
                        colorMode === 'light'
                          ? `${colorPref}.400`
                          : `${colorPref}.500`,
                    }}
                  >
                    <VStack spacing={1}>
                      <Box
                        color={
                          isActive
                            ? colorMode === 'light'
                              ? `${colorPref}.600`
                              : `${colorPref}.300`
                            : colorMode === 'light'
                            ? 'gray.400'
                            : 'gray.500'
                        }
                      >
                        <MaterialIcon name={item.icon} size={20} />
                      </Box>
                      <Text
                        fontSize={{ base: 'lg', md: 'xl' }}
                        fontWeight="700"
                        color={
                          isActive
                            ? colorMode === 'light'
                              ? `${colorPref}.700`
                              : `${colorPref}.200`
                            : colorMode === 'light'
                            ? 'gray.900'
                            : 'white'
                        }
                        lineHeight="1"
                      >
                        {count}
                      </Text>
                      <Text
                        fontSize={{ base: '2xs', md: 'xs' }}
                        fontWeight="500"
                        color={
                          isActive
                            ? colorMode === 'light'
                              ? `${colorPref}.600`
                              : `${colorPref}.300`
                            : colorMode === 'light'
                            ? 'gray.500'
                            : 'gray.400'
                        }
                        textAlign="center"
                        lineHeight="1.2"
                        noOfLines={2}
                      >
                        {item.shortLabel}
                      </Text>
                    </VStack>
                  </Box>
                </Tooltip>
              );
            })}
          </SimpleGrid>

          {/* Active Filter Indicator */}
          {selectedStatus && (
            <Box mt={3}>
              <Text
                fontSize="xs"
                color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
              >
                Filter aktif:{' '}
                <Text
                  as="span"
                  fontWeight="600"
                  color={colorMode === 'light' ? 'gray.900' : 'white'}
                >
                  {STATUS_ITEMS.find((s) => s.id === selectedStatus)?.label}
                </Text>
                <Text
                  as="span"
                  ml={2}
                  cursor="pointer"
                  color={
                    colorMode === 'light'
                      ? `${colorPref}.500`
                      : `${colorPref}.300`
                  }
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => setSelectedStatus('')}
                >
                  (Hapus filter)
                </Text>
              </Text>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default StatusBelumFilterTabs;
