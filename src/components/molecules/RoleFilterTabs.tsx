import React, { useState } from 'react';
import {
  Button,
  Badge,
  HStack,
  VStack,
  useColorMode,
  Box,
  Text,
  Wrap,
  WrapItem,
  IconButton,
  Collapse,
} from '@chakra-ui/react';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';

interface RoleTab {
  id: string;
  label: string;
  count: number;
}

interface RoleFilterTabsProps {
  selectedRoleId: string;
  setSelectedRoleId: (roleId: string) => void;
  roles: RoleTab[];
}

const RoleFilterTabs: React.FC<RoleFilterTabsProps> = ({
  selectedRoleId,
  setSelectedRoleId,
  roles,
}) => {
  const { colorMode } = useColorMode();
  const [isOpen, setIsOpen] = useState(false);

  const bgContainer = colorMode === 'light' ? 'gray.100' : 'whiteAlpha.100';
  const activeBg = colorMode === 'light' ? 'white' : 'gray.700';
  const activeColor = colorMode === 'light' ? 'gray.900' : 'white';
  const inactiveColor = colorMode === 'light' ? 'gray.500' : 'gray.400';

  const tabs: RoleTab[] = [
    {
      id: '',
      label: 'Semua Role',
      count: roles.reduce((sum, r) => sum + r.count, 0),
    },
    ...roles,
  ];

  const selectedRoleName =
    tabs.find((t) => t.id === selectedRoleId)?.label || 'Semua Role';

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
            <Text>{selectedRoleName}</Text>
          </HStack>
        </Button>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={isOpen} animateOpacity>
        <Box>
          {/* Desktop: Horizontal Scrollable Tabs */}
          <Box
            display={{ base: 'none', md: 'block' }}
            bg={bgContainer}
            p={1}
            borderRadius="full"
            w="fit-content"
            maxW="100%"
            overflowX="auto"
            sx={{
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background:
                  colorMode === 'light' ? 'gray.300' : 'whiteAlpha.300',
                borderRadius: 'full',
              },
            }}
          >
            <HStack spacing={0} flexWrap="nowrap">
              {tabs.map((tab) => {
                const isActive = selectedRoleId === tab.id;
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setSelectedRoleId(tab.id)}
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
                    flexShrink={0}
                  >
                    <HStack spacing={2}>
                      <Text whiteSpace="nowrap">{tab.label}</Text>
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

          {/* Mobile: Vertical Stack with Wrap */}
          <Box display={{ base: 'block', md: 'none' }} w="100%">
            <VStack align="stretch" spacing={2}>
              {/* Semua Role - Full Width */}
              {tabs.slice(0, 1).map((tab) => {
                const isActive = selectedRoleId === tab.id;
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setSelectedRoleId(tab.id)}
                    size="sm"
                    variant="ghost"
                    bg={isActive ? activeBg : bgContainer}
                    color={isActive ? activeColor : inactiveColor}
                    boxShadow={isActive ? 'sm' : 'none'}
                    borderRadius="full"
                    _hover={{
                      bg: isActive
                        ? activeBg
                        : colorMode === 'light'
                        ? 'gray.200'
                        : 'whiteAlpha.200',
                    }}
                    h="40px"
                    w="100%"
                    fontWeight="600"
                    fontSize="sm"
                    justifyContent="space-between"
                  >
                    <Text>{tab.label}</Text>
                    <Badge
                      bg={
                        isActive
                          ? colorMode === 'light'
                            ? 'gray.100'
                            : 'gray.600'
                          : colorMode === 'light'
                          ? 'white'
                          : 'whiteAlpha.200'
                      }
                      color={
                        isActive
                          ? colorMode === 'light'
                            ? 'gray.800'
                            : 'gray.200'
                          : inactiveColor
                      }
                      borderRadius="full"
                      px={2}
                      fontSize="xs"
                      fontWeight="600"
                    >
                      {tab.count}
                    </Badge>
                  </Button>
                );
              })}

              {/* Other Roles - Wrapped Grid */}
              {tabs.length > 1 && (
                <Wrap spacing={2}>
                  {tabs.slice(1).map((tab) => {
                    const isActive = selectedRoleId === tab.id;
                    return (
                      <WrapItem key={tab.id}>
                        <Button
                          onClick={() => setSelectedRoleId(tab.id)}
                          size="sm"
                          variant="ghost"
                          bg={isActive ? activeBg : bgContainer}
                          color={isActive ? activeColor : inactiveColor}
                          boxShadow={isActive ? 'sm' : 'none'}
                          borderRadius="full"
                          _hover={{
                            bg: isActive
                              ? activeBg
                              : colorMode === 'light'
                              ? 'gray.200'
                              : 'whiteAlpha.200',
                          }}
                          h="36px"
                          fontWeight="600"
                          fontSize="xs"
                          px={3}
                        >
                          <HStack spacing={1.5}>
                            <Text whiteSpace="nowrap">{tab.label}</Text>
                            <Badge
                              bg={
                                isActive
                                  ? colorMode === 'light'
                                    ? 'gray.100'
                                    : 'gray.600'
                                  : colorMode === 'light'
                                  ? 'white'
                                  : 'whiteAlpha.200'
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
                              fontWeight="600"
                            >
                              {tab.count}
                            </Badge>
                          </HStack>
                        </Button>
                      </WrapItem>
                    );
                  })}
                </Wrap>
              )}
            </VStack>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default RoleFilterTabs;
