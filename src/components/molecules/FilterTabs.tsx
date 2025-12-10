import React from 'react';
import {
  Button,
  Badge,
  HStack,
  useColorMode,
  Box,
  Text,
} from '@chakra-ui/react';

export type FilterStatus = 'all' | 'active' | 'inactive';

interface FilterTabsProps {
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  counts: {
    all: number;
    active: number;
    inactive: number;
  };
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  filterStatus,
  setFilterStatus,
  counts,
}) => {
  const { colorMode } = useColorMode();

  const bgContainer = colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100';
  const activeBg = colorMode === 'light' ? 'white' : 'gray.700';
  const activeColor = colorMode === 'light' ? 'gray.900' : 'white';
  const inactiveColor = colorMode === 'light' ? 'gray.500' : 'gray.400';

  const tabs: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: counts.all },
    { id: 'active', label: 'Aktif', count: counts.active },
    { id: 'inactive', label: 'Dihapus', count: counts.inactive },
  ];

  return (
    <Box
      bg={bgContainer}
      p={1}
      borderRadius="full"
      display="inline-flex"
      w="fit-content"
    >
      <HStack spacing={0}>
        {tabs.map((tab) => {
          const isActive = filterStatus === tab.id;
          return (
            <Button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              size="sm"
              borderRadius="full"
              variant="ghost"
              bg={isActive ? activeBg : 'transparent'}
              color={isActive ? activeColor : inactiveColor}
              boxShadow={isActive ? 'sm' : 'none'}
              _hover={{
                bg: isActive
                  ? activeBg
                  : colorMode === 'light'
                  ? 'blackAlpha.50'
                  : 'whiteAlpha.50',
              }}
              px={4}
              h="32px"
              fontWeight="600"
              fontSize="sm"
            >
              <HStack spacing={2}>
                <Text>{tab.label}</Text>
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
                      : inactiveColor
                  }
                  borderRadius="full"
                  px={1.5}
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
  );
};

export default FilterTabs;
