import { Prisma } from '@prisma/client';

/**
 * Generates normalized search variations for model numbers & product queries.
 * For example, "hs 30" -> ["hs 30", "hs-30", "hs30"]
 * "hs30" -> ["hs30", "hs-30", "hs 30"]
 * "hs-30" -> ["hs-30", "hs 30", "hs30"]
 */
export function getSearchVariations(query: string): string[] {
  const raw = (query || '').trim();
  if (!raw) return [];

  const set = new Set<string>([
    raw,
    raw.replace(/[\s_]+/g, '-'),
    raw.replace(/[-_]+/g, ' '),
    raw.replace(/[\s-_]+/g, ''),
    raw.replace(/([a-zA-Z])(\d)/g, '$1-$2'),
    raw.replace(/(\d)([a-zA-Z])/g, '$1-$2'),
    raw.replace(/([a-zA-Z])(\d)/g, '$1 $2'),
  ]);

  return Array.from(set).filter((s) => s.length > 0);
}

function buildSingleTermProductOR(term: string): Prisma.ProductWhereInput[] {
  const variations = getSearchVariations(term);
  const conditions: Prisma.ProductWhereInput[] = [];

  for (const v of variations) {
    conditions.push(
      { name: { contains: v, mode: 'insensitive' } },
      { model: { contains: v, mode: 'insensitive' } },
      { sku: { contains: v, mode: 'insensitive' } },
      { barcode: { contains: v, mode: 'insensitive' } },
      { brand: { name: { contains: v, mode: 'insensitive' } } },
      { category: { name: { contains: v, mode: 'insensitive' } } },
      { specs: { some: { value: { contains: v, mode: 'insensitive' } } } },
      {
        variants: {
          some: {
            OR: [
              { name: { contains: v, mode: 'insensitive' } },
              { sku: { contains: v, mode: 'insensitive' } },
              { upc: { contains: v, mode: 'insensitive' } },
            ],
          },
        },
      }
    );
  }

  return conditions;
}

/**
 * Builds a comprehensive Prisma ProductWhereInput OR array that searches across:
 * - Product name, model, SKU, barcode
 * - Brand name & Category name
 * - Product specification values (e.g. Model stored in specs)
 * - Variant name, SKU, UPC
 * - Hyphen/space/compact model variations (e.g. "HS-30", "HS 30", "HS30")
 * - Multi-word token matching (e.g. "A4Tech OP-720" where brand is A4Tech and model is OP-720)
 */
export function buildProductSearchOR(query: string): Prisma.ProductWhereInput[] {
  const raw = (query || '').trim();
  if (!raw) return [];

  const orConditions: Prisma.ProductWhereInput[] = [...buildSingleTermProductOR(raw)];

  const words = raw.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length > 1) {
    orConditions.push({
      AND: words.map((word) => ({
        OR: buildSingleTermProductOR(word),
      })),
    });
  }

  return orConditions;
}

/**
 * Extracts a model number from productSpecs if the explicit model field is empty.
 */
export function extractModelFromSpecs(
  specs?: Array<{ key?: string; name?: string; value?: string }> | null
): string | null {
  if (!Array.isArray(specs)) return null;
  for (const s of specs) {
    const key = (s?.key || s?.name || '').trim().toLowerCase();
    const val = (s?.value || '').trim();
    if (
      val &&
      val.toLowerCase() !== 'n/a' &&
      val.toLowerCase() !== 'null' &&
      (key === 'model' || key === 'model number' || key === 'model name' || key === 'model no' || key === 'mpn')
    ) {
      return val;
    }
  }
  return null;
}
