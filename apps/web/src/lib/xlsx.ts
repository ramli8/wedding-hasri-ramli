import { strFromU8, unzipSync } from "fflate";

/**
 * Membaca lembar pertama berkas Excel (.xlsx) menjadi teks bertab, supaya impor tamu bisa memakai
 * pratinjau yang sama dengan CSV/tempelan (server mengenali pemisah tab). Hanya nilai sel yang
 * dibaca; rumus diambil hasil terakhirnya, format diabaikan.
 */
export function xlsxToTsv(data: ArrayBuffer | Uint8Array): string {
  const rows = xlsxRows(data);
  return rows.map((row) => row.map(tsvCell).join("\t")).join("\n");
}

/** Sel berisi tab, baris baru, atau tanda kutip dibungkus kutip (aturan CSV, pemisah tab). */
function tsvCell(value: string) {
  return /[\t\n\r"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function xlsxRows(data: ArrayBuffer | Uint8Array): string[][] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data instanceof Uint8Array ? data : new Uint8Array(data));
  } catch {
    throw new Error("Berkas Excel tidak bisa dibaca. Simpan ulang sebagai .xlsx atau CSV.");
  }
  const read = (path: string) => {
    const file = files[path];
    return file ? parseXml(strFromU8(file)) : null;
  };

  const workbook = read("xl/workbook.xml");
  if (!workbook) throw new Error("Berkas ini bukan berkas Excel (.xlsx).");
  const sheetPath = firstSheetPath(workbook, read("xl/_rels/workbook.xml.rels"));
  const sheet = read(sheetPath);
  if (!sheet) throw new Error("Lembar pertama berkas Excel tidak ditemukan.");

  const shared = [...(read("xl/sharedStrings.xml")?.getElementsByTagNameNS("*", "si") ?? [])].map(
    textOf,
  );

  const rows: string[][] = [];
  let headers: string[] = [];
  for (const row of sheet.getElementsByTagNameNS("*", "row")) {
    const values: string[] = [];
    for (const cell of row.getElementsByTagNameNS("*", "c")) {
      const ref = cell.getAttribute("r") ?? "";
      const col = ref ? columnIndex(ref) : values.length;
      values[col] = cellValue(cell, shared, headers[col]);
    }
    const filled = Array.from(values, (v) => v ?? "");
    if (rows.length === 0) headers = filled.map((h) => h.trim().toLowerCase());
    rows.push(filled);
  }
  // Baris kosong di akhir (sel berformat tanpa isi) dibuang.
  while (rows.length && rows.at(-1)?.every((v) => v.trim() === "")) rows.pop();
  return rows;
}

function parseXml(text: string): Document {
  return new DOMParser().parseFromString(text, "application/xml");
}

/** Lembar pertama menurut urutan di workbook.xml (bukan nama berkasnya). */
function firstSheetPath(workbook: Document, rels: Document | null): string {
  const first = workbook.getElementsByTagNameNS("*", "sheet")[0];
  const relId =
    first?.getAttributeNS(
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "id",
    ) ?? first?.getAttribute("r:id");
  const target = [...(rels?.getElementsByTagNameNS("*", "Relationship") ?? [])]
    .find((r) => r.getAttribute("Id") === relId)
    ?.getAttribute("Target");
  if (!target) return "xl/worksheets/sheet1.xml";
  return target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
}

/** "D12" -> 3. */
function columnIndex(ref: string): number {
  const letters = ref.replace(/\d+$/, "").toUpperCase();
  let index = 0;
  for (const ch of letters) index = index * 26 + (ch.charCodeAt(0) - 64);
  return index - 1;
}

/** Teks gabungan semua <t> (string kaya bisa terpecah per format). */
function textOf(node: Element): string {
  return [...node.getElementsByTagNameNS("*", "t")].map((t) => t.textContent ?? "").join("");
}

function cellValue(cell: Element, shared: string[], header: string | undefined): string {
  const type = cell.getAttribute("t");
  if (type === "inlineStr") return textOf(cell);
  const raw = cell.getElementsByTagNameNS("*", "v")[0]?.textContent ?? "";
  if (type === "s") return shared[Number(raw)] ?? "";
  if (type === "b") return raw === "1" ? "ya" : "tidak";
  if (type === "str" || type === "e" || raw === "") return raw;
  // Angka. Nomor HP yang terketik sebagai angka kehilangan 0 di depan (812… atau 6.28E+12).
  const number = Number(raw);
  if (!Number.isFinite(number)) return raw;
  const digits = Number.isInteger(number) ? BigInt(number).toString() : raw;
  if (header === "hp" && /^8\d{7,}$/.test(digits)) return `0${digits}`;
  return digits;
}
