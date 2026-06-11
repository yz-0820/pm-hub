import { getDBCache, setDBCache } from '@/lib/career/cache';
import { PrototypeSpec, createImportCode } from './prototype-spec';

const IMPORT_TTL_SECONDS = 30 * 60;
const RETENTION_SECONDS = 24 * 60 * 60;

export type StoredPrototype = {
  specId: string;
  parentSpecId: string | null;
  version: number;
  importCode: string;
  expiresAt: number;
  summary: string;
  model: string;
  usedAI: boolean;
  prototypeSpec: PrototypeSpec;
};

type ImportPointer = {
  specId: string;
};

function specKey(specId: string) {
  return `prototype:spec:${specId}`;
}

function importKey(code: string) {
  return `prototype:import:${code.toUpperCase()}`;
}

export async function getStoredPrototype(specId: string): Promise<StoredPrototype | null> {
  const stored = await getDBCache<StoredPrototype>(specKey(specId));
  if (!stored || Date.now() > stored.expiresAt) return null;
  return stored;
}

export async function getStoredPrototypeByImportCode(code: string): Promise<StoredPrototype | null> {
  const pointer = await getDBCache<ImportPointer>(importKey(code));
  if (!pointer) return null;
  return getDBCache<StoredPrototype>(specKey(pointer.specId));
}

export async function savePrototypeVersion(input: {
  parentSpecId?: string | null;
  version: number;
  summary: string;
  model: string;
  usedAI: boolean;
  prototypeSpec: PrototypeSpec;
}): Promise<StoredPrototype> {
  const importCode = createImportCode();
  const expiresAt = Date.now() + IMPORT_TTL_SECONDS * 1000;
  const stored: StoredPrototype = {
    specId: input.prototypeSpec.specId,
    parentSpecId: input.parentSpecId || null,
    version: input.version,
    importCode,
    expiresAt,
    summary: input.summary,
    model: input.model,
    usedAI: input.usedAI,
    prototypeSpec: input.prototypeSpec,
  };

  await setDBCache(specKey(stored.specId), 'prototype-spec', stored, RETENTION_SECONDS);
  await setDBCache(importKey(importCode), 'prototype-import', { specId: stored.specId }, RETENTION_SECONDS);
  return stored;
}
