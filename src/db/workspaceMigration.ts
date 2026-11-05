import Dexie, { type Table } from 'dexie';
import { RoutineDatabase } from './database';
import { BACKUP_TABLES, isPortableKey } from './backup';
import { LEGACY_DATABASE_NAME, createWorkspaceStorage, workspaceDatabaseName } from './workspaceScope';

interface LegacyArchive {
  id: string;
  complete: boolean;
  tables: Record<string, Record<string, unknown>[]>;
  localData: Record<string, string>;
  backup: string | null;
  pendingCount: number;
}

const system = new Dexie('LifeOS_workspace_system_v1') as Dexie & { archives: Table<LegacyArchive, string> };
system.version(1).stores({ archives: 'id' });
const ARCHIVE_ID = 'legacy-workspace-v1';

/** Archive first, copy into Guest only, and never delete/upgrade the source database. */
export async function prepareLegacyWorkspace(): Promise<void> {
  let archive = await system.archives.get(ARCHIVE_ID);
  if (archive?.complete) return;
  if (!archive) {
    const tables: LegacyArchive['tables'] = {};
    const localData: LegacyArchive['localData'] = {};
    if (await Dexie.exists(LEGACY_DATABASE_NAME)) {
      const source = new Dexie(LEGACY_DATABASE_NAME);
      try {
        await source.open();
        const known = new Set<string>([...Object.values(BACKUP_TABLES), 'pendingSync']);
        const sourceTables = source.tables.filter(table => known.has(table.name));
        if (sourceTables.length) await source.transaction('r', sourceTables, async () => {
          for (const table of sourceTables) tables[table.name] = await table.toArray();
        });
      } finally { source.close(); }
    }
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key && isPortableKey(key)) {
        const value = localStorage.getItem(key);
        if (value !== null) localData[key] = value;
      }
    }
    const data = Object.fromEntries(Object.entries(BACKUP_TABLES)
      .filter(([, name]) => name in tables).map(([key, name]) => [key, tables[name]]));
    const hasData = Object.values(tables).some(rows => rows.length > 0) || Object.keys(localData).length > 0;
    archive = { id: ARCHIVE_ID, complete: false, tables, localData,
      pendingCount: tables.pendingSync?.length ?? 0,
      backup: hasData ? JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), appName: 'MoveCare Routine App', data, localData }, null, 2) : null };
    // A preference-only legacy install still needs a supported dataset for JSON import.
    if (archive.backup && Object.keys(data).length === 0) {
      archive.backup = JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), data: { tasks: [] }, localData }, null, 2);
    }
    await system.archives.put(archive);
  }
  const guestStorage = createWorkspaceStorage('guest');
  for (const [key, value] of Object.entries(archive.localData)) {
    if (guestStorage.getItem(key) === null) guestStorage.setItem(key, value);
  }
  const guest = new RoutineDatabase(workspaceDatabaseName('guest'));
  try {
    await guest.open();
    const names = Object.values(BACKUP_TABLES).filter(name => name in archive.tables);
    if (names.length) await guest.transaction('rw', names.map(name => guest.table(name)), async () => {
      for (const name of names) {
        const records = archive.tables[name];
        const table = guest.table(name);
        const keyField = name === 'weeklySchedule' ? 'dayOfWeek' : name === 'dayPlans' ? 'date' : 'id';
        const keys = records.map(record => record[keyField]);
        if (keys.some(key => typeof key !== 'string' && typeof key !== 'number')) throw new Error(`تعذر ترحيل ${name}؛ النسخة الأصلية محفوظة.`);
        const existing = await table.bulkGet(keys as Array<string | number>);
        const additions = records.filter((_, index) => existing[index] === undefined);
        if (additions.length) await table.bulkPut(additions);
      }
    });
  } finally { guest.close(); }
  await system.archives.put({ ...archive, complete: true });
}

export async function readLegacyBackup() {
  const archive = await system.archives.get(ARCHIVE_ID);
  return { backup: archive?.backup ?? null, pendingCount: archive?.pendingCount ?? 0 };
}
