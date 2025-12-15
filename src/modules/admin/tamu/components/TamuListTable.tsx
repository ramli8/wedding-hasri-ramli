import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  HStack,
  Select,
  Spinner,
  Icon,
  useColorMode,
  Badge,
} from '@chakra-ui/react';
import { Tamu } from '../types/Tamu.types';
import {
  TableContainer,
  TableMain,
  TableHead,
  TableBody,
  TableHeadCell,
  TableBodyCell,
  TableWrapper,
  TableSortingRow,
  TableSortingCol,
  TableSearch,
} from '@/components/molecules/Table';
import { PrimaryButton } from '@/components/atoms/Buttons/PrimaryButton';
import { PrimaryOutlineButton } from '@/components/atoms/Buttons/PrimaryButton';
import InputText from '@/components/molecules/Input';

interface TamuListTableProps {
  initialTamu?: Tamu[];
  loading?: boolean;
  onEdit: (tamu: Tamu) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onFilterChange: (filter: any) => void;
  filter: any;
  onLoadTamu: (filter?: any) => void;
}

const TamuListTable: React.FC<TamuListTableProps> = ({
  initialTamu = [],
  loading = false,
  onEdit,
  onDelete,
  onAddNew,
  onFilterChange,
  filter,
  onLoadTamu,
}) => {
  const [tamu, setTamu] = useState<Tamu[]>(initialTamu);
  const [searchTerm, setSearchTerm] = useState(filter?.search || '');
  const { colorMode } = useColorMode();

  const handleEditClick = (tamu: Tamu) => {
    onEdit(tamu);
  };

  const handleAddNew = () => {
    onAddNew();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tamu ini?')) {
      onDelete(id);
    }
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    onFilterChange({ ...filter, search });
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilter = { ...filter, [field]: value };
    onFilterChange(newFilter);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'akan_hadir':
        return <Badge colorScheme="green">Akan Hadir</Badge>;
      case 'tidak_hadir':
        return <Badge colorScheme="red">Tidak Hadir</Badge>;
      case 'belum_konfirmasi':
        return <Badge colorScheme="yellow">Belum Konfirmasi</Badge>;
      case 'dikirim':
        return <Badge colorScheme="blue">Dikirim</Badge>;
      case 'belum_dikirim':
        return <Badge colorScheme="gray">Belum Dikirim</Badge>;
      case 'kadaluarsa':
        return <Badge colorScheme="orange">Kadaluarsa</Badge>;
      default:
        return <Badge colorScheme="gray">{status}</Badge>;
    }
  };

  // Update tamu when initialTamu prop changes
  useEffect(() => {
    setTamu(initialTamu);
  }, [initialTamu]);

  return (
    <Card>
      <CardHeader>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading
            size="md"
            fontWeight="700"
            color={colorMode === 'light' ? '#1b1d21' : '#fff'}
          >
            Daftar Tamu Undangan
          </Heading>
          <PrimaryButton onClick={handleAddNew}>Tambah Tamu</PrimaryButton>
        </Flex>
      </CardHeader>

      <CardBody>
        <TableWrapper>
          <Box className="table__sorting" mb={4}>
            <TableSortingRow>
              <TableSortingCol>
                <InputText
                  placeholder="Cari data..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </TableSortingCol>

              <TableSortingCol>
                <Box width="100%" p="0 8px 0 8px" pos="relative">
                  <InputText
                    as={Select}
                    placeholder="Kategori"
                    value={filter?.kategori || ''}
                    onChange={(e) =>
                      handleFilterChange('kategori', e.target.value)
                    }
                  >
                    <option value="Tamu Hasri">Tamu Hasri</option>
                    <option value="Tamu Ramli">Tamu Ramli</option>
                    <option value="Tamu Ayah">Tamu Ayah</option>
                    <option value="Tamu Ibu">Tamu Ibu</option>
                  </InputText>
                </Box>
              </TableSortingCol>

              <TableSortingCol>
                <Box width="100%" p="0 8px 0 8px" pos="relative">
                  <InputText
                    as={Select}
                    placeholder="Status Undangan"
                    value={filter?.status_undangan || ''}
                    onChange={(e) =>
                      handleFilterChange('status_undangan', e.target.value)
                    }
                  >
                    <option value="dikirim">Dikirim</option>
                    <option value="belum_dikirim">Belum Dikirim</option>
                    <option value="kadaluarsa">Kadaluarsa</option>
                  </InputText>
                </Box>
              </TableSortingCol>

              <TableSortingCol>
                <Box width="100%" p="0 8px 0 8px" pos="relative">
                  <InputText
                    as={Select}
                    placeholder="Konfirmasi Kehadiran"
                    value={filter?.konfirmasi_kehadiran || ''}
                    onChange={(e) =>
                      handleFilterChange('konfirmasi_kehadiran', e.target.value)
                    }
                  >
                    <option value="akan_hadir">Akan Hadir</option>
                    <option value="tidak_hadir">Tidak Hadir</option>
                    <option value="belum_konfirmasi">Belum Konfirmasi</option>
                  </InputText>
                </Box>
              </TableSortingCol>
            </TableSortingRow>
          </Box>

          <TableContainer>
            {loading ? (
              <Flex justify="center" align="center" py={10}>
                <Spinner size="xl" />
              </Flex>
            ) : (
              <TableMain>
                <TableHead>
                  <TableHeadCell>Nama</TableHeadCell>
                  <TableHeadCell>Kategori</TableHeadCell>
                  <TableHeadCell>Hubungan</TableHeadCell>
                  <TableHeadCell>Alamat</TableHeadCell>
                  <TableHeadCell>No. HP</TableHeadCell>
                  <TableHeadCell>Status Undangan</TableHeadCell>
                  <TableHeadCell>Konfirmasi Kehadiran</TableHeadCell>
                  <TableHeadCell>Tgl Kirim</TableHeadCell>
                  <TableHeadCell>Check-in</TableHeadCell>
                  <TableHeadCell>Aksi</TableHeadCell>
                </TableHead>
                <TableBody>
                  {tamu.length > 0 ? (
                    tamu.map((tamu) => (
                      <Box
                        className="table__row body"
                        display="table-row"
                        key={tamu.id}
                      >
                        <TableBodyCell>
                          <Text fontWeight="700">{tamu.nama}</Text>
                        </TableBodyCell>
                        <TableBodyCell>
                          <Badge colorScheme="teal">{tamu.kategori}</Badge>
                        </TableBodyCell>
                        <TableBodyCell>{tamu.hubungan}</TableBodyCell>
                        <TableBodyCell>
                          <Text isTruncated maxW="200px">
                            {tamu.alamat}
                          </Text>
                        </TableBodyCell>
                        <TableBodyCell>
                          <HStack>
                            <Icon
                              viewBox="0 0 24 24"
                              width="20px"
                              height="20px"
                            >
                              <path
                                fill="currentColor"
                                d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"
                              />
                            </Icon>
                            <Text>{tamu.nomor_hp}</Text>
                          </HStack>
                        </TableBodyCell>
                        <TableBodyCell>
                          {renderStatusBadge(tamu.status_undangan)}
                        </TableBodyCell>
                        <TableBodyCell>
                          {renderStatusBadge(tamu.konfirmasi_kehadiran)}
                        </TableBodyCell>
                        <TableBodyCell>
                          {tamu.tgl_kirim_undangan ? (
                            <HStack>
                              <Icon
                                viewBox="0 24 24"
                                width="20px"
                                height="20px"
                              >
                                <path
                                  fill="currentColor"
                                  d="M19,4H17V3H15V4H9V3H7V4H5C3.89,4 3,4.89 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4M19,20H5V10H19V20M19,8H5V6H19V8Z"
                                />
                              </Icon>
                              <Text>
                                {new Date(
                                  tamu.tgl_kirim_undangan
                                ).toLocaleDateString()}
                              </Text>
                            </HStack>
                          ) : (
                            '-'
                          )}
                        </TableBodyCell>
                        <TableBodyCell>
                          {tamu.check_in ? (
                            <HStack>
                              <Icon
                                viewBox="0 24 24"
                                width="20px"
                                height="20px"
                              >
                                <path
                                  fill="currentColor"
                                  d="M12,2A10,10 0,0 2,12A10,10 0,0 12,2A10,10 0,0 0,12A10,10 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"
                                />
                              </Icon>
                              <Text>
                                {new Date(tamu.check_in).toLocaleTimeString()}
                              </Text>
                            </HStack>
                          ) : (
                            '-'
                          )}
                        </TableBodyCell>
                        <TableBodyCell>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="Edit tamu"
                              icon={
                                <Icon
                                  viewBox="0 24 24"
                                  width="20px"
                                  height="20px"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
                                  />
                                </Icon>
                              }
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              onClick={() => handleEditClick(tamu)}
                            />
                            <IconButton
                              aria-label="Hapus tamu"
                              icon={
                                <Icon
                                  viewBox="0 24 24"
                                  width="20px"
                                  height="20px"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                                  />
                                </Icon>
                              }
                              size="sm"
                              variant="outline"
                              colorScheme="red"
                              onClick={() => handleDelete(tamu.id)}
                            />
                          </HStack>
                        </TableBodyCell>
                      </Box>
                    ))
                  ) : (
                    <Box className="table__row body" display="table-row">
                      <Box
                        className="table__cell body"
                        display="table-cell"
                        textAlign="center"
                        py={10}
                        width="100%"
                        verticalAlign="middle"
                        _first={{
                          padding: '0',
                        }}
                      >
                        <Text
                          color={
                            colorMode === 'light' ? 'gray.500' : 'gray.400'
                          }
                        >
                          Belum ada data tamu
                        </Text>
                      </Box>
                    </Box>
                  )}
                </TableBody>
              </TableMain>
            )}
          </TableContainer>
        </TableWrapper>
      </CardBody>

      <CardFooter mt={4}>
        <Text
          fontSize="sm"
          color={colorMode === 'light' ? 'gray.500' : 'gray.400'}
        >
          Menampilkan {tamu.length} dari total tamu
        </Text>
      </CardFooter>
    </Card>
  );
};

export default TamuListTable;
