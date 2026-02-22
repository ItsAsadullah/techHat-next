'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { type POSConfig, DEFAULT_POS } from '@/lib/settings-types';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface SettingData {
  key: string;
  value: string;
  category?: string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────

async function writeAuditLog(
  entity: string,
  action: string,
  entityId: string | null,
  changes: object,
  performedBy?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        entity,
        entityId: entityId ?? undefined,
        action,
        changes: JSON.stringify(changes),
        performedBy: performedBy ?? 'system',
      },
    });
  } catch {
    // Non-blocking — audit failure must not break app
  }
}

// ─────────────────────────────────────────────────────────────
// CORE CRUD
// ─────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    return s?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSettingsByCategory(category: string) {
  try {
    return await prisma.setting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  } catch {
    return [];
  }
}

export async function getAllSettings() {
  try {
    return await prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  } catch {
    return [];
  }
}

export async function upsertSetting(data: SettingData, performedBy?: string) {
  try {
    const existing = await prisma.setting.findUnique({ where: { key: data.key } });
    const setting = await prisma.setting.upsert({
      where: { key: data.key },
      update: {
        value: data.value,
        category: data.category ?? 'general',
        description: data.description,
        updatedBy: performedBy ?? 'system',
      },
      create: {
        key: data.key,
        value: data.value,
        category: data.category ?? 'general',
        description: data.description,
        updatedBy: performedBy ?? 'system',
      },
    });
    await writeAuditLog(
      'setting',
      existing ? 'update' : 'create',
      data.key,
      { key: data.key, oldValue: existing?.value, newValue: data.value },
      performedBy
    );
    revalidatePath('/admin/settings');
    return { success: true, setting };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function upsertManySettings(
  settings: SettingData[],
  performedBy?: string
) {
  try {
    const ops = settings.map((s) =>
      prisma.setting.upsert({
        where: { key: s.key },
        update: {
          value: s.value,
          category: s.category ?? 'general',
          description: s.description,
          updatedBy: performedBy ?? 'system',
        },
        create: {
          key: s.key,
          value: s.value,
          category: s.category ?? 'general',
          description: s.description,
          updatedBy: performedBy ?? 'system',
        },
      })
    );
    await prisma.$transaction(ops);
    await writeAuditLog(
      'setting',
      'bulk_update',
      null,
      { keys: settings.map((s) => s.key), count: settings.length },
      performedBy
    );
    revalidatePath('/admin/settings');
    revalidatePath('/admin/pos');
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteSetting(key: string, performedBy?: string) {
  try {
    const existing = await prisma.setting.findUnique({ where: { key } });
    await prisma.setting.delete({ where: { key } });
    await writeAuditLog('setting', 'delete', key, { key, value: existing?.value }, performedBy);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// ─────────────────────────────────────────────────────────────
// POS CONFIG
// ─────────────────────────────────────────────────────────────

export async function getPOSConfig(): Promise<POSConfig> {
  const rows = await getSettingsByCategory('pos');
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const cfg: Record<string, unknown> = { ...DEFAULT_POS };
  for (const [k, v] of Object.entries(map)) {
    if (k in cfg) {
      const dflt = DEFAULT_POS[k as keyof POSConfig];
      cfg[k] = typeof dflt === 'boolean' ? v === 'true' : v;
    }
  }
  return cfg as unknown as POSConfig;
}

export async function savePOSConfig(config: POSConfig, performedBy?: string) {
  const settings: SettingData[] = Object.entries(config).map(([key, value]) => ({
    key,
    value: String(value),
    category: 'pos',
  }));
  return upsertManySettings(settings, performedBy);
}

export async function initializePOSSettings() {
  for (const [key, value] of Object.entries(DEFAULT_POS)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.setting.create({
        data: { key, value: String(value), category: 'pos', updatedBy: 'system' },
      });
    }
  }
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// AUDIT LOG READER
// ─────────────────────────────────────────────────────────────

export async function getAuditLogs(entity?: string, limit = 50) {
  try {
    return await prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch {
    return [];
  }
}
