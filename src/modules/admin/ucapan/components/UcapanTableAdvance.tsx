import React, { useMemo, useState } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Text,
  Icon,
  useColorMode,
  VStack,
  Badge,
  Button,
  useToast,
} from '@chakra-ui/react';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import TableAdvance from '@/components/organisms/TableAdvance';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { UcapanWithReplies } from '../types/Ucapan.types';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface UcapanTableAdvanceProps {
  initialData?: UcapanWithReplies[];
  loading?: boolean;
  onReply: (ucapan: UcapanWithReplies) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const UcapanTableAdvance: React.FC<UcapanTableAdvanceProps> = ({
  initialData = [],
  loading = false,
  onReply,
  onDelete,
  onRefresh,
}) => {
  const { colorMode } = useColorMode();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const toast = useToast();

  const handleDelete = (id: string) => {
    MySwal.fire({
      title: 'Hapus Ucapan?',
      text: "Ucapan yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      background: colorMode === 'light' ? '#fff' : '#1A202C',
      color: colorMode === 'light' ? '#1A202C' : '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(id);
      }
    });
  };

  const handleCopyMagicLink = (ucapan: UcapanWithReplies) => {
    const magicLink = `${window.location.origin}/?reply=${ucapan.id}`;
    navigator.clipboard.writeText(magicLink);
    toast({
      title: 'Magic link berhasil disalin',
      description: `Link untuk membalas ucapan dari ${ucapan.nama}`,
      status: 'success',
      duration: 2000,
    });
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

  const columns = useMemo<ColumnDef<UcapanWithReplies, any>[]>(
    () => [
      {
        accessorKey: 'nama',
        header: 'Nama',
        cell: (info) => (
          <Text fontWeight="600" fontSize="sm" color={colorMode === 'light' ? 'gray.800' : 'white'}>
            {info.getValue()}
          </Text>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'pesan',
        header: 'Pesan',
        cell: (info) => (
          <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.300'} noOfLines={2}>
            {info.getValue()}
          </Text>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'created_at',
        header: 'Tanggal',
        cell: (info) => (
          <Text fontSize="xs" color="gray.500">
            {formatDate(info.getValue())}
          </Text>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (info) => {
          const ucapan = info.row.original;
          const hasReply = ucapan.replies && ucapan.replies.length > 0;
          return (
            <Badge colorScheme={hasReply ? 'green' : 'yellow'} fontSize="xs">
              {hasReply ? 'Sudah Dibalas' : 'Belum Dibalas'}
            </Badge>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const ucapan = info.row.original;
          return (
            <HStack spacing={1}>
              <Button
                size="xs"
                colorScheme="blue"
                variant="ghost"
                onClick={() => handleCopyMagicLink(ucapan)}
              >
                Copy Link
              </Button>
              <IconButton
                aria-label="Hapus ucapan"
                icon={
                  <Icon viewBox="0 0 24 24" width="18px" height="18px">
                    <path
                      fill="currentColor"
                      d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                    />
                  </Icon>
                }
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => handleDelete(ucapan.id)}
                borderRadius="full"
              />
            </HStack>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [colorMode, onReply, onDelete]
  );

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box 
        pos="relative"
        bg={colorMode === 'light' ? 'white' : '#222222'}
        borderRadius="24px"
        p={6}
        _before={{
          content: '""',
          pos: "absolute",
          top: "43px",
          left: "32px",
          right: "32px",
          bottom: "-43px",
          zIndex: "-1",
          background: colorMode == "light" ? "#e3e6ec" : "#000",
          opacity: colorMode == "light" ? "0.91" : "0.51",
          filter: "blur(86.985px)",
          borderRadius: "24px",
        }}
      >
        <Box mb={8} display="flex" flexDirection={{ base: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ base: 'start', md: 'center' }} gap={4}>
          <VStack align="start" spacing={1}>
            <Text 
              fontSize="2xl" 
              fontWeight="800"
              letterSpacing="-0.5px"
              color={colorMode === 'light' ? 'gray.800' : 'white'}
            >
              Daftar Ucapan
            </Text>
            <Text fontSize="sm" color="gray.500">
              Total Data: {initialData.length}
            </Text>
          </VStack>
          <PrimaryButton onClick={onRefresh} w="auto">
            <HStack spacing={2} justify="center">
              <Icon viewBox="0 0 24 24" width="20px" height="20px" fill="currentColor">
                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
              </Icon>
              <Text>Refresh</Text>
            </HStack>
          </PrimaryButton>
        </Box>

        <TableAdvance 
          columns={columns} 
          data={initialData}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      </Box>
    </Box>
  );
};

export default UcapanTableAdvance;
