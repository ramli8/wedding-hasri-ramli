import { dateFilter, fuzzyFilter } from "@/utils/table/table";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Select,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorMode,
} from "@chakra-ui/react";
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { useState, useContext } from "react";
import AppSettingContext from "@/providers/AppSettingProvider";
import {
  IoChevronBack,
  IoChevronBackCircle,
  IoChevronForward,
  IoChevronForwardCircle,
} from "react-icons/io5";
import { FaFilter, FaSearch } from "react-icons/fa";

const ColumnFilter = ({ column }: { column: any }) => {
  const { colorMode } = useColorMode();
  const columnFilterValue = (column.getFilterValue() as string[]) || [];
  const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()).sort().filter(Boolean);

  // Only show filter if there are unique values
  // if (uniqueValues.length <= 1) return null; // Removed to force show filter

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <IconButton
          aria-label="Filter"
          icon={<FaFilter />}
          size="xs"
          variant={columnFilterValue.length > 0 ? "solid" : "ghost"}
          colorScheme={columnFilterValue.length > 0 ? (colorMode === 'light' ? 'blackAlpha' : 'whiteAlpha') : "gray"}
          bg={columnFilterValue.length > 0 ? (colorMode === 'light' ? 'black' : 'white') : undefined}
          color={columnFilterValue.length > 0 ? (colorMode === 'light' ? 'white' : 'black') : undefined}
          ml={2}
        />
      </PopoverTrigger>
      <PopoverContent w="200px" _focus={{ boxShadow: "none" }} bg={colorMode === 'light' ? 'white' : 'black'} borderColor={colorMode === 'light' ? 'gray.200' : 'gray.800'}>
        <PopoverArrow bg={colorMode === 'light' ? 'white' : 'black'} />
        <PopoverBody p={2}>
          <VStack align="start" spacing={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
              Filter {column.columnDef.header}
            </Text>
            {uniqueValues.map((value: any) => (
              <Checkbox
                key={value}
                isChecked={columnFilterValue.includes(value)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const newValue = checked
                    ? [...columnFilterValue, value]
                    : columnFilterValue.filter((v) => v !== value);
                  column.setFilterValue(newValue.length ? newValue : undefined);
                }}
                size="sm"
                width="full"
                colorScheme={colorMode === 'light' ? 'blackAlpha' : 'whiteAlpha'}
                iconColor={colorMode === 'light' ? 'white' : 'black'}
              >
                <Text fontSize="sm" noOfLines={1}>{value}</Text>
              </Checkbox>
            ))}
            {columnFilterValue.length > 0 && (
              <Text
                fontSize="xs"
                color={colorMode === 'light' ? 'black' : 'white'}
                cursor="pointer"
                onClick={() => column.setFilterValue(undefined)}
                alignSelf="flex-end"
                mt={2}
                _hover={{ textDecoration: 'underline' }}
              >
                Reset Filter
              </Text>
            )}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

const TableAdvance = ({
  columns,
  data,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange: externalOnColumnFiltersChange,
  rowSelection,
  onRowSelectionChange,
  hideSearch,
}: {
  columns: ColumnDef<any, any>[];
  data: any[];
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: OnChangeFn<Record<string, boolean>>;
  hideSearch?: boolean;
}) => {
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { colorMode } = useColorMode();

  const { colorPref } = useContext(AppSettingContext);

  // Use external state if provided, otherwise use internal state
  const columnFilters = externalColumnFilters !== undefined ? externalColumnFilters : internalColumnFilters;
  const setColumnFilters = externalOnColumnFiltersChange || setInternalColumnFilters;

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
      date: dateFilter
    },
    state: {
      columnFilters,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  return (
    <>
      <TableContainer>
        {!hideSearch && (
        <Box mb={6}>
          <InputGroup size="md" maxW={{ base: 'full', md: '350px' }} ml={{ base: 0, md: 'auto' }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              placeholder="Cari data..."
              borderRadius="lg"
              bg={colorMode === 'light' ? 'white' : 'gray.800'}
              border="1px solid"
              borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
              _hover={{
                borderColor: colorMode === 'light' ? `${colorPref}.400` : `${colorPref}Dim.500`,
              }}
              _focus={{
                borderColor: colorMode === 'light' ? `${colorPref}.500` : `${colorPref}Dim.400`,
                boxShadow: `0 0 0 1px var(--chakra-colors-${colorPref}-500)`,
              }}
              fontSize="sm"
              transition="all 0.2s"
              h="40px"
            />
          </InputGroup>
        </Box>
        )}
        <Table variant="unstyled">
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <Th
                      key={header.id}
                      colSpan={header.colSpan}
                      paddingBottom="16px"
                      paddingTop="0px"
                      paddingX="12px"
                      _first={{
                        paddingInlineStart: "24px",
                      }}
                      _last={{
                        paddingInlineEnd: "24px",
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <HStack spacing={0} align="center">
                          <Box
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            <Text textAlign="left" color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="wider">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: " 🔼",
                                desc: " 🔽",
                                // null: ""
                              }[header.column.getIsSorted() as string] ?? null}
                            </Text>
                          </Box>
                          {header.column.getCanFilter() ? (
                            <ColumnFilter column={header.column} />
                          ) : null}
                        </HStack>
                      )}
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => {
              return (
                <Tr key={row.id} _hover={{ bg: colorMode === 'light' ? 'gray.50' : 'whiteAlpha.50' }}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <Td 
                        key={cell.id}
                        paddingY="16px"
                        paddingX="12px"
                        borderBottom="1px solid"
                        borderColor={colorMode === 'light' ? 'gray.100' : 'gray.800'}
                        _first={{
                          paddingInlineStart: "24px",
                        }}
                        _last={{
                          paddingInlineEnd: "24px",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    );
                  })}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
        <Stack direction={{ base: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" marginTop="30px" spacing={4}>
          <Stack direction={{ base: 'column', sm: 'row' }} alignItems="center" spacing={4}>
            <HStack>
              <Button
                size="sm"
                variant="outline"
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                color={colorMode === 'light' ? 'black' : 'white'}
                _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.800' }}
                onClick={() => table.setPageIndex(0)}
                isDisabled={!table.getCanPreviousPage()}
              >
                <IoChevronBackCircle />
              </Button>
              <Button
                size="sm"
                variant="outline"
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                color={colorMode === 'light' ? 'black' : 'white'}
                _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.800' }}
                onClick={() => table.previousPage()}
                isDisabled={!table.getCanPreviousPage()}
              >
                <IoChevronBack />
              </Button>
              <Button
                size="sm"
                variant="outline"
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                color={colorMode === 'light' ? 'black' : 'white'}
                _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.800' }}
                onClick={() => table.nextPage()}
                isDisabled={!table.getCanNextPage()}
              >
                <IoChevronForward />
              </Button>
              <Button
                size="sm"
                variant="outline"
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                color={colorMode === 'light' ? 'black' : 'white'}
                _hover={{ bg: colorMode === 'light' ? 'gray.100' : 'gray.800' }}
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                isDisabled={!table.getCanNextPage()}
              >
                <IoChevronForwardCircle />
              </Button>
            </HStack>
            <Box as="span" textAlign="center">
              <Text fontSize="sm" color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
                {"Page "}
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </Text>
            </Box>
          </Stack>

          <Stack direction={{ base: 'column', sm: 'row' }} alignItems="center" spacing={4}>
            <Box as="span" display="flex" alignItems="center">
              | Go to page:
              <Input
                width="80px"
                type="number"
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  if (page < table.getPageCount()) {
                    table.setPageIndex(page);
                  }
                }}
                min={1}
                max={table.getPageCount()}
                ml={2}
                size="sm"
                borderRadius="md"
              />
            </Box>
            <Select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              width="auto"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </Select>
          </Stack>
        </Stack>
      </TableContainer>
    </>
  );
};

export default TableAdvance;
