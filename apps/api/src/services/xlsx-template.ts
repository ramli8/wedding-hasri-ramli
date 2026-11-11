import { strToU8, zipSync } from "fflate";

/**
 * Penulis berkas Excel (.xlsx) kecil, langsung dari XML OOXML tanpa pustaka spreadsheet. Dipakai
 * untuk template impor dan ekspor tamu. Kelebihannya dibanding CSV: kolom bisa berupa dropdown
 * (validasi data), dan semua sel berformat teks supaya HP "0812…" tidak berubah jadi angka 812….
 * Excel, LibreOffice, dan Google Sheets membacanya.
 */

/** `number`: sel angka berpemisah ribuan (bisa dijumlah di Excel); selain itu teks. */
export type XlsxColumn = { header: string; width: number; type?: "number" };

export type XlsxSheet = {
  name: string;
  columns: XlsxColumn[];
  rows: (string | number | null)[][];
  hidden?: boolean;
  /** Dropdown per kolom (judul kolom → rumus daftar, mis. `Kelompok!$A$1:$A$3` atau `"ya,tidak"`). */
  lists?: Record<string, { formula: string; error: string }>;
};

/** Baris yang diberi dropdown (cukup untuk daftar tamu pernikahan mana pun). */
const LAST_ROW = 3000;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Karakter kontrol (selain tab/baris baru) tidak sah di XML.
    // biome-ignore lint/suspicious/noControlCharactersInRegex: memang menyaring karakter kontrol
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

/** Isi elemen XML: tanda kutip boleh apa adanya (dipakai rumus daftar `"ya,tidak"`). */
const escapeText = (value: string) => escapeXml(value).replace(/&quot;/g, '"');

const colLetter = (index: number) =>
  index < 26
    ? String.fromCharCode(65 + index)
    : String.fromCharCode(64 + Math.floor(index / 26)) + String.fromCharCode(65 + (index % 26));

/** Sel teks (inline string, tanpa sharedStrings): isinya tidak pernah dibaca sebagai rumus. */
const textCell = (ref: string, value: string, style: number) =>
  `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeText(value)}</t></is></c>`;

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
const SHEET_CT = "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml";

// Gaya: 0 bawaan, 1 teks (format "@"), 2 judul kolom tebal berlatar abu-abu, 3 angka "#,##0".
const STYLES = `${XML_HEAD}
<styleSheet xmlns="${NS_MAIN}">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFEFEF"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function sheetXml(sheet: XlsxSheet): string {
  const cols = sheet.columns
    .map(
      (c, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${c.width}" style="${c.type === "number" ? 3 : 1}" customWidth="1"/>`,
    )
    .join("");
  const header = sheet.columns.map((c, i) => textCell(`${colLetter(i)}1`, c.header, 2)).join("");
  const body = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((value, i) => {
          const ref = `${colLetter(i)}${r + 2}`;
          if (typeof value === "number") return `<c r="${ref}" s="3"><v>${value}</v></c>`;
          return value ? textCell(ref, value, 1) : "";
        })
        .join("");
      return `<row r="${r + 2}">${cells}</row>`;
    })
    .join("");
  const validations = Object.entries(sheet.lists ?? {}).flatMap(([headerName, list]) => {
    const index = sheet.columns.findIndex((c) => c.header === headerName);
    if (index < 0) return [];
    const col = colLetter(index);
    const last = Math.max(LAST_ROW, sheet.rows.length + 1);
    return [
      `<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorStyle="stop" error="${escapeXml(list.error)}" sqref="${col}2:${col}${last}"><formula1>${escapeText(list.formula)}</formula1></dataValidation>`,
    ];
  });
  // Judul kolom dibekukan supaya tetap terlihat saat digulir (lembar tersembunyi tidak perlu).
  const views = sheet.columns.length
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : "";
  return `${XML_HEAD}
<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">
${views}<sheetFormatPr defaultRowHeight="15"/>
${cols ? `<cols>${cols}</cols>` : ""}
<sheetData>${header ? `<row r="1">${header}</row>` : ""}${body}</sheetData>
${validations.length ? `<dataValidations count="${validations.length}">${validations.join("")}</dataValidations>` : ""}
<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;
}

/** Lembar daftar tanpa judul kolom (sumber dropdown), biasanya disembunyikan. */
function listSheetXml(values: string[]): string {
  const rows = values.map((v, i) => `<row r="${i + 1}">${textCell(`A${i + 1}`, v, 1)}</row>`);
  return `${XML_HEAD}
<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}"><sheetData>${rows.join("")}</sheetData>
<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;
}

export function buildXlsx(sheets: (XlsxSheet | { name: string; list: string[] })[]): Uint8Array {
  const files: Record<string, string> = {
    "[Content_Types].xml": `${XML_HEAD}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="${SHEET_CT}"/>`).join("\n")}
</Types>`,
    "_rels/.rels": `${XML_HEAD}
<Relationships xmlns="${NS_PKG_REL}"><Relationship Id="rId1" Type="${NS_REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `${XML_HEAD}
<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${sheets
      .map((s, i) => {
        const hidden = "list" in s || s.hidden ? ' state="hidden"' : "";
        return `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}"${hidden} r:id="rId${i + 1}"/>`;
      })
      .join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `${XML_HEAD}
<Relationships xmlns="${NS_PKG_REL}">${sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="${NS_REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join(
        "",
      )}<Relationship Id="rId${sheets.length + 1}" Type="${NS_REL}/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": STYLES,
  };
  sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = "list" in s ? listSheetXml(s.list) : sheetXml(s);
  });
  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])));
}

/** Kolom berkas tamu (template dan ekspor) yang bisa diisi admin, dengan lebar kolomnya. */
export const GUEST_COLUMNS: XlsxColumn[] = [
  { header: "nama_undangan", width: 32 },
  { header: "hp", width: 18 },
  { header: "instagram", width: 18 },
  { header: "kelompok", width: 24 },
  { header: "rombongan", width: 12 },
  { header: "catatan_penjaga", width: 32 },
];

/** Dropdown kelompok (dari lembar tersembunyi "Kelompok") dan rombongan ya/tidak. */
export function guestLists(groupCount: number): XlsxSheet["lists"] {
  return {
    ...(groupCount
      ? {
          kelompok: {
            formula: `Kelompok!$A$1:$A$${groupCount}`,
            error: "Pilih kelompok dari daftar. Kelompok baru dibuat dulu di menu Kelompok.",
          },
        }
      : {}),
    rombongan: { formula: '"ya,tidak"', error: "Isi ya atau tidak." },
  };
}

/**
 * Contoh pengisian di template (nama, hp, instagram), di baris 2–6 lembar "Tamu";
 * impor melewati baris yang nama dan kontaknya sama persis dengan contoh ini (`isExampleRow`), jadi
 * contoh tidak ikut terimpor walau lupa dihapus.
 */
export const EXAMPLE_GUESTS = [
  {
    nama: "Bpk. Budi Santoso & Keluarga",
    hp: "0812-3456-7801",
    ig: "",
    rombongan: "ya",
    catatan: "Bawa kursi roda",
  },
  { nama: "Sari Lestari", hp: "", ig: "sarilestari", rombongan: "tidak", catatan: "" },
  {
    nama: "Ibu Ratna Dewi",
    hp: "0813-2222-3333",
    ig: "ratna.dewi",
    rombongan: "tidak",
    catatan: "",
  },
  {
    nama: "Keluarga Bpk. Joko",
    hp: "0857-1111-2222",
    ig: "",
    rombongan: "ya",
    catatan: "Sekitar 10 orang",
  },
  {
    nama: "dr. Andi Wijaya",
    hp: "+62 811-555-6666",
    ig: "",
    rombongan: "tidak",
    catatan: "Tamu kehormatan",
  },
];

/** Baris impor yang sama persis (nama, hp, instagram) dengan salah satu contoh template. */
export function isExampleRow(record: { nama_undangan?: string; hp?: string; instagram?: string }) {
  const norm = (v: string | undefined) => (v ?? "").trim();
  return EXAMPLE_GUESTS.some(
    (e) =>
      norm(record.nama_undangan) === e.nama &&
      norm(record.hp) === e.hp &&
      norm(record.instagram).replace(/^@/, "") === e.ig,
  );
}

/** Lima baris contoh memakai kelompok yang ada (bergiliran). */
export function exampleRows(groups: string[]): string[][] {
  const group = (i: number) => groups[i % Math.max(groups.length, 1)] ?? "Keluarga";
  const order = [0, 1, 2, 0, 3];
  return EXAMPLE_GUESTS.map((e, i) => [
    e.nama,
    e.hp,
    e.ig,
    group(order[i] ?? 0),
    e.rombongan,
    e.catatan,
  ]);
}

/** Template impor: lembar "Tamu" berdropdown dengan 5 baris contoh di atasnya. */
export function buildImportTemplateXlsx(groupNames: string[]): Uint8Array {
  const groups = [...new Set(groupNames.map((n) => n.trim()).filter(Boolean))];
  return buildXlsx([
    {
      name: "Tamu",
      columns: GUEST_COLUMNS,
      rows: exampleRows(groups),
      lists: guestLists(groups.length),
    },
    { name: "Kelompok", list: groups },
  ]);
}
