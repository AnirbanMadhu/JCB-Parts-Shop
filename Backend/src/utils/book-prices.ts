import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

export type WorkbookPart = {
  partNumber: string;
  itemName: string;
  description: string | null;
  hsnCode: string;
  gstPercent: number;
  unit: string;
  mrp: number | null;
  rtl: number | null;
};

const workbookPathCandidates = [
  path.resolve(process.cwd(), 'New Price List.xlsx'),
  path.resolve(__dirname, '../../New Price List.xlsx'),
  path.resolve(__dirname, '../../../New Price List.xlsx'),
];

let priceMapPromise: Promise<Map<string, WorkbookPart>> | null = null;
let cachedPriceMap: Map<string, WorkbookPart> | null = null;

function normalizeKey(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toUpperCase().replace(/\s+/g, '');
}

function aliasKeys(key: string) {
  const aliases = new Set([key]);

  if (/^\d+$/.test(key)) {
    aliases.add(key.replace(/^0+(?=\d)/, ''));
  }

  return [...aliases];
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;

  const numericValue = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeGstPercent(value: unknown) {
  const numeric = toNumber(value);
  if (numeric === null) return 0;
  return numeric > 1 ? numeric : numeric * 100;
}

async function loadPriceMap() {
  if (cachedPriceMap) return cachedPriceMap;

  if (!priceMapPromise) {
    priceMapPromise = (async () => {
      const workbookPath = workbookPathCandidates.find((candidate) => fs.existsSync(candidate));

      if (!workbookPath) {
        console.warn('[WorkbookPrices] Price list workbook not found. Workbook fallback is disabled.');
        return new Map();
      }

      const workbook = xlsx.readFile(workbookPath);
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        console.warn('[WorkbookPrices] Workbook contains no sheets.');
        return new Map();
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
      const priceMap = new Map<string, WorkbookPart>();

      for (const row of rows) {
        const key = normalizeKey(row.Material);
        if (!key) continue;

        const partData: WorkbookPart = {
          partNumber: key,
          itemName: String(row.Description ?? '').trim() || key,
          description: null,
          hsnCode: String(row.HSN ?? '').trim(),
          gstPercent: normalizeGstPercent(row.GST),
          unit: 'Nos',
          mrp: toNumber(row.MRP),
          rtl: toNumber(row.RTL),
        };

        for (const alias of aliasKeys(key)) {
          if (!priceMap.has(alias)) {
            priceMap.set(alias, partData);
          }
        }
      }

      cachedPriceMap = priceMap;
      console.log(`[WorkbookPrices] Loaded ${priceMap.size} part entries from ${path.basename(workbookPath)}`);
      return priceMap;
    })().catch((error) => {
      console.error('[WorkbookPrices] Failed to load price list workbook:', error);
      return new Map();
    });
  }

  return priceMapPromise;
}

export async function getWorkbookPart(partNumber: string) {
  const normalized = normalizeKey(partNumber);
  if (!normalized) return null;

  const priceMap = await loadPriceMap();
  for (const alias of aliasKeys(normalized)) {
    const match = priceMap.get(alias);
    if (match) return match;
  }

  return null;
}