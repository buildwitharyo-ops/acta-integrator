import "server-only";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";

// Parses a vendor .xlsx/.csv into raw candidate rows. Mechanical only — no AI, no DB access.
// Sheet convention (docs/seed-products-01/ACTA Curated Product Catalog.xlsx, the reference file):
// row 1 = header (Brand/Model/Fungsi/Harga); a row with only column A filled is a header row —
// ALL-CAPS text = section ("AUDIO SYSTEMS"), mixed-case text = subcategory; fully-empty rows are
// separators; a row with columns A+B filled is a product row.
export type ParsedRow = {
  rowIndex: number;
  section: string | null;
  subcat: string | null;
  brand: string;
  model: string;
  fungsi: string;
  harga: string | null;
};

function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell) return "";
  const v = cell.text;
  return (v ?? "").toString().trim();
}

function isAllCaps(s: string): boolean {
  const letters = s.replace(/[^a-zA-Z]/g, "");
  return letters.length > 0 && letters === letters.toUpperCase();
}

function isHeaderRow(a: string, b: string): boolean {
  return a.toLowerCase() === "brand" && b.toLowerCase() === "model";
}

export async function parseWorkbook(buffer: Buffer, filename: string): Promise<ParsedRow[]> {
  const wb = new ExcelJS.Workbook();
  if (/\.csv$/i.test(filename)) {
    await wb.csv.read(Readable.from([buffer]));
  } else {
    // exceljs's bundled .d.ts expects a newer lib.dom Buffer shape than this project's
    // @types/node — harmless structural mismatch, not a real type error.
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  }
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("File tidak punya sheet.");

  let section: string | null = null;
  let subcat: string | null = null;
  const rows: ParsedRow[] = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const a = cellText(row.getCell(1));
    const b = cellText(row.getCell(2));
    const c = cellText(row.getCell(3));
    const d = cellText(row.getCell(4));

    if (rowNumber === 1 && isHeaderRow(a, b)) return; // header row, skip
    if (!a && !b && !c && !d) return; // blank separator

    if (a && !b && !c && !d) {
      if (isAllCaps(a)) {
        section = a;
        subcat = null;
      } else {
        subcat = a;
      }
      return;
    }

    if (a && b) {
      rows.push({ rowIndex: rowNumber, section, subcat, brand: a, model: b, fungsi: c, harga: d || null });
    }
  });

  return rows;
}

// "Rp 7.504.000" -> 7504000. Returns null for empty/unparseable ("-", "Rp 0", …).
export function parsePrice(harga: string | null): number | null {
  if (!harga) return null;
  const digits = harga.replace(/[^0-9]/g, "");
  if (!digits || digits.length < 4) return null;
  return Number(digits);
}
