'use client';

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useColorMode,
  VStack,
  Box,
  Text,
  HStack,
  Badge,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  Button,
  Flex,
} from '@chakra-ui/react';
import { UcapanWithReplies } from '../types/Ucapan.types';
import { MaterialIcon } from '@/components/atoms/MaterialIcon';
import { showConfirmationAlert } from '@/utils/sweetalert';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';

interface UcapanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ucapan: UcapanWithReplies | null;
  onDeleteReply: (id: string) => void;
  onRestoreReply: (id: string) => void;
}

const UcapanDetailModal: React.FC<UcapanDetailModalProps> = ({
  isOpen,
  onClose,
  ucapan,
  onDeleteReply,
  onRestoreReply,
}) => {
  const { colorMode } = useColorMode();

  if (!ucapan) return null;

  const handleDeleteReply = async (id: string, replyName: string) => {
    const result = await showConfirmationAlert(
      'Konfirmasi Hapus Balasan?',
      `Balasan dari "${replyName}" akan dihapus!`,
      'Ya, Hapus!',
      colorMode,
      true
    );

    if (result.isConfirmed) {
      onDeleteReply(id);
    }
  };

  const handleRestoreReply = async (id: string, replyName: string) => {
    const result = await showConfirmationAlert(
      'Konfirmasi Pulihkan Balasan?',
      `Balasan dari "${replyName}" akan dipulihkan!`,
      'Ya, Pulihkan!',
      colorMode,
      false
    );

    if (result.isConfirmed) {
      onRestoreReply(id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        borderRadius="24px"
        mx={4}
        boxShadow="xl"
        p={2}
        maxH="80vh"
      >
        <ModalBody pt={6} pb={6} px={{ base: 4, md: 6 }}>
          <VStack spacing={4} align="stretch">
            {/* Parent Ucapan */}
            <Box
              p={5}
              borderRadius="2xl"
              borderWidth="2px"
              borderColor={colorMode === 'light' ? 'blue.200' : 'blue.600'}
              bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
            >
              <HStack spacing={3} mb={3}>
                <Avatar
                  name={ucapan.nama}
                  size="md"
                  bg={colorMode === 'light' ? 'blue.500' : 'blue.400'}
                  color="white"
                />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="bold" fontSize="lg">
                    {ucapan.nama}
                  </Text>
                  <Text fontSize="xs" color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
                    {formatDate(ucapan.created_at)}
                  </Text>
                </VStack>
                <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                  Ucapan Asli
                </Badge>
              </HStack>
              <Text
                fontSize="md"
                color={colorMode === 'light' ? 'gray.700' : 'gray.200'}
                whiteSpace="pre-wrap"
              >
                {ucapan.pesan}
              </Text>
            </Box>

            {/* Divider */}
            {ucapan.replies && ucapan.replies.length > 0 && (
              <>
                <Divider />
                <HStack spacing={2}>
                  <MaterialIcon name="reply" size={20} />
                  <Text fontWeight="600" fontSize="sm" color="gray.500">
                    {ucapan.replies.length} Balasan
                  </Text>
                </HStack>
              </>
            )}

            {/* Replies */}
            {ucapan.replies && ucapan.replies.length > 0 && (
              <VStack spacing={3} align="stretch">
                {ucapan.replies.map((reply) => {
                  const isAdmin = reply.is_admin;
                  const isDeleted = reply.deleted_at;
                  return (
                    <Box
                      key={reply.id}
                      p={4}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={
                        isDeleted 
                          ? colorMode === 'light' ? 'red.200' : 'red.700'
                          : colorMode === 'light' ? 'gray.200' : 'gray.700'
                      }
                      bg={
                        isDeleted
                          ? colorMode === 'light' ? 'red.50' : 'red.900'
                          : colorMode === 'light' ? 'white' : 'gray.800'
                      }
                      position="relative"
                      opacity={isDeleted ? 0.7 : 1}
                    >
                      <HStack spacing={3} mb={2}>
                        <Avatar
                          name={reply.nama}
                          size="sm"
                          bg={isAdmin ? 'green.500' : 'gray.500'}
                          color="white"
                        />
                        <VStack align="start" spacing={0} flex={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="600" fontSize="sm">
                              {reply.nama}
                            </Text>
                            {isAdmin && (
                              <Badge colorScheme="green" fontSize="10px" px={2} py={0.5}>
                                Admin
                              </Badge>
                            )}
                            {isDeleted && (
                              <Badge colorScheme="red" fontSize="10px" px={2} py={0.5}>
                                Dihapus
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(reply.created_at)}
                          </Text>
                        </VStack>
                        
                        {/* Action Buttons for Reply */}
                        {!isDeleted ? (
                          <Tooltip label="Hapus Balasan" hasArrow>
                            <IconButton
                              aria-label="Hapus"
                              icon={<MaterialIcon name="delete" size={16} />}
                              size="xs"
                              borderRadius="full"
                              variant="ghost"
                              onClick={() => handleDeleteReply(reply.id, reply.nama)}
                              colorScheme="red"
                              _hover={{
                                bg: colorMode === 'light' ? 'red.100' : 'red.900',
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip label="Pulihkan Balasan" hasArrow>
                            <IconButton
                              aria-label="Pulihkan"
                              icon={<MaterialIcon name="restore_from_trash" size={16} />}
                              size="xs"
                              borderRadius="full"
                              variant="ghost"
                              onClick={() => handleRestoreReply(reply.id, reply.nama)}
                              colorScheme="green"
                              _hover={{
                                bg: colorMode === 'light' ? 'green.100' : 'green.900',
                              }}
                            />
                          </Tooltip>
                        )}
                      </HStack>
                      
                      <Text
                        fontSize="sm"
                        color={colorMode === 'light' ? 'gray.600' : 'gray.300'}
                        whiteSpace="pre-wrap"
                        pl={10}
                        textDecoration={isDeleted ? 'line-through' : 'none'}
                      >
                        {reply.pesan}
                      </Text>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter pb={6} px={6} pt={2}>
          <Flex justify="center" w="full">
            <PrimaryButton
              onClick={onClose}
              w="auto"
              borderRadius="full"
              px={8}
              h="48px"
            >
              <Text fontWeight="700" fontSize="sm">
                Tutup
              </Text>
            </PrimaryButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UcapanDetailModal;
