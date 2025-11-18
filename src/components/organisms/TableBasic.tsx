import {
  flexRender,
  Table as TableRT,
} from "@tanstack/react-table";
import {
  Box,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorMode,
} from "@chakra-ui/react";
import { CgChevronDown, CgChevronUp } from "react-icons/cg";
import { BsChevronExpand } from "react-icons/bs";
import { TableStatus } from "../molecules/TableStatus";
import { useTranslations } from "next-intl";

const TableBasic = ({
  table,
  isLoading = false,
  isError = false,
  noDataTitle,
  noDataSubtitle,
  noDataDescription
}: {
  table: TableRT<any>;
  isLoading?: boolean;
  isError?: boolean;
  noDataTitle?: string;
  noDataSubtitle?: string;
  noDataDescription?: string;
}) => {
  const { colorMode } = useColorMode();
  const tT = useTranslations("Table")

  return (
    <>
      {
        isLoading
          ? <TableStatus title="Memuat data" />
          : isError
            ? <TableStatus title="Data gagal dimuat" />
            : table.getFilteredRowModel()?.rows?.length > 0
              ? (
                <>
                  <TableContainer
                    mt="24px"
                    sx={{
                      "::-webkit-scrollbar-thumb": {
                        backgroundColor: colorMode == "light" ? "#dadada" : "#313131",
                        border: "5px solid transparent",
                      },
                      "::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: colorMode == "light" ? "#b3b3b3" : "#393939",
                      },
                    }}
                    // overflowX="visible"
                    // overflowY="visible"
                  >
                    <Table variant="simple">
                      <Thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <Tr key={headerGroup.id} borderColor="#eeeeee">
                            {headerGroup.headers.map((header) => {
                              return (
                                <Th
                                  key={header.id}
                                  className="table__cell head"
                                  display="table-cell"
                                  verticalAlign="middle"
                                  p="16px 8px"
                                  fontWeight={600}
                                  color="gray"
                                  textTransform="none"
                                  fontSize="16px"
                                  letterSpacing="0px"
                                >
                                  <Box
                                    {...{
                                      className: header.column.getCanSort()
                                        ? "cursor-pointer select-none"
                                        : "",
                                      onClick: header.column.getToggleSortingHandler(),
                                    }}
                                  >
                                    <HStack justifyContent="space-between">
                                      <Text>
                                        {flexRender(
                                          tT(header.column.columnDef.header),
                                          header.getContext()
                                        )}
                                      </Text>
                                      {{
                                        asc: <CgChevronUp display="inline-block" />,
                                        desc: <CgChevronDown />,
                                      }[header.column.getIsSorted() as string] ??
                                        (header.column.getCanSort() ? (
                                          <BsChevronExpand />
                                        ) : null)}
                                    </HStack>
                                  </Box>
                                </Th>
                              );
                            })}
                          </Tr>
                        ))}
                      </Thead>

                      <Tbody>
                        {table?.getRowModel()?.rows.map((row) => {
                          return (
                            <Tr key={row.id} pos="relative">
                              {row.getVisibleCells().map((cell) => {
                                return (
                                  <Td
                                    key={cell.id}
                                    className="table__cell body"
                                    verticalAlign="middle"
                                    p="24px 8px"
                                    pos="relative"
                                    borderTopWidth="1px"
                                    borderTopStyle="solid"
                                    borderTopColor={
                                      colorMode === "light" ? "gray.100" : "gray.800"
                                    }
                                  >
                                    <Text fontSize="14px" fontWeight={500}>
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                      )}
                                    </Text>
                                  </Td>
                                );
                              })}
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </>
              ) : table.getPreFilteredRowModel().rows.length > 0 ? (
                <TableStatus
                  title={"Data Tidak Ditemukan"}
                  subtitle={"Hasil pencarian atau filter tidak ditemukan."}
                  description={"Pilih filter lain atau ganti kata kunci pencarian, dan coba lagi."}
                />
              ) : <TableStatus
                title={noDataTitle ?? "Data Tidak Ada"}
                subtitle={noDataSubtitle ?? "Data tidak tersedia atau mungkin belum ditambahkan."}
              // description={noDataDescription ?? "Pilih filter lain atau ganti kata kunci pencarian, dan coba lagi."}
              />
      }
    </>
  );
};

export default TableBasic;
