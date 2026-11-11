import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { xlsxRows, xlsxToTsv } from "./xlsx.js";

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

/** Berkas .xlsx kecil seperti yang disimpan Excel: sharedStrings dan sel angka. */
function workbook(sheetData: string, shared: string[]) {
  return zipSync({
    "xl/workbook.xml": strToU8(
      `<workbook ${NS} xmlns:r="${REL}"><sheets><sheet name="Tamu" sheetId="1" r:id="rId9"/></sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Type="${REL}/worksheet" Target="worksheets/data.xml"/></Relationships>`,
    ),
    "xl/sharedStrings.xml": strToU8(
      `<sst ${NS}>${shared.map((t) => `<si><t>${t}</t></si>`).join("")}</sst>`,
    ),
    "xl/worksheets/data.xml": strToU8(
      `<worksheet ${NS}><sheetData>${sheetData}</sheetData></worksheet>`,
    ),
  });
}

describe("xlsx", () => {
  it("membaca lembar pertama: teks bersama, teks inline, sel kosong, dan baris kosong di akhir", () => {
    const file = workbook(
      `<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>
       <row r="2"><c r="A2" t="inlineStr"><is><t>Budi</t></is></c><c r="C2" t="s"><v>3</v></c></row>
       <row r="3"><c r="A3" s="1"/></row>`,
      ["nama_undangan", "hp", "kelompok", "Keluarga"],
    );
    expect(xlsxRows(file)).toEqual([
      ["nama_undangan", "hp", "kelompok"],
      ["Budi", "", "Keluarga"],
    ]);
  });

  it("mengembalikan 0 di depan nomor HP yang terketik sebagai angka", () => {
    const file = workbook(
      `<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
       <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>81234567801</v></c></row>
       <row r="3"><c r="A3" t="s"><v>3</v></c><c r="B3"><v>6.28123456780E+12</v></c></row>`,
      ["nama_undangan", "hp", "Budi", "Sari"],
    );
    expect(xlsxRows(file).slice(1)).toEqual([
      ["Budi", "081234567801"],
      ["Sari", "6281234567800"],
    ]);
  });

  it("menulis teks bertab; sel berisi tab atau kutip dibungkus kutip", () => {
    const file = workbook(
      `<row r="1"><c r="A1" t="inlineStr"><is><t>nama_undangan</t></is></c></row>
       <row r="2"><c r="A2" t="inlineStr"><is><t>Budi "Ani"</t></is></c></row>`,
      [],
    );
    expect(xlsxToTsv(file)).toBe('nama_undangan\n"Budi ""Ani"""');
  });

  it("menolak berkas yang bukan .xlsx", () => {
    expect(() => xlsxRows(strToU8("nama,hp"))).toThrow(/tidak bisa dibaca/);
  });
});
