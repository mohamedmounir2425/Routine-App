# LifeOS database changes

Project: LifeOS (`pykcypmvsqecfskbjwav`). No credentials are stored here.

## Applied migration

`migrations/20261101101704_complete_core_sync_schema.sql` was applied through Supabase MCP on 2026-11-01. Its local filename matches the version recorded by the server. The CLI generated the initial local file before it was filled and applied.

It captures the six original public tables with `CREATE TABLE IF NOT EXISTS`, adds sync fields, creates five missing tables and their ownership policies/indexes, and restricts the new-user trigger helper. It assumes a Supabase environment with `auth.users`, `auth.uid()` and the standard roles. It is not a complete project backup, and cannot be applied unchanged to plain Postgres without replacing the Auth dependencies.

The migration adds columns and tables without deleting application records. On a fresh Supabase database, the baseline creates ownership policies for original tables; on the existing project, their policy names are preserved. See [current schema](../docs/architecture/supabase-current.md) and [historical schema](../docs/architecture/supabase-before-sync-schema.md).

## Verification

`tests/core_sync_metadata.sql` is read-only. Run it using SQL Editor or a database connection with catalog access; every output should be `true`. It checks metadata and grants, not authenticated end-to-end CRUD.

The local `npm test` suite uses fake-indexeddb and a fake cloud transport. It verifies complete task/project/routine/Today payloads, explicit clearing of values, legacy compatibility, queued individual saves and fresh-device reads without connecting to this project.

An attempted transaction-based RLS test with temporary Auth users and rollback did not execute because the tool confirmation expired. A subsequent read-only check confirmed there are no persisted test accounts. Real authenticated two-account CRUD, device switching, offline conflict handling and deletion propagation still require acceptance testing after local account isolation is implemented.

Before future changes, inspect the current remote schema, create a migration with the installed CLI, retain the reviewed SQL and verify the remote version matches the local history. Verify CLI syntax via `--help`; do not guess flags or apply the same migration under a second version.


Current protocol (2026-11-01): local schema v8. Versioned CAS writes, persistent deletion tombstones, durable offline-change detection and explicit local/cloud conflict choices in Settings are implemented. See sync-conflicts.md. Earlier remaining-work notes describe the preceding stage. Physical browser/mobile acceptance remains outstanding.
Migration 20261101140907_versioned_sync_mutations.sql is applied. The transactional integration test in tests/versioned_sync_integration.sql passed against LifeOS and rolled back its temporary accounts. This supersedes the earlier expired fixture attempt.

Recipe library migration: 20261101143722_add_recipe_library.sql. It adds recipes with owner-only SELECT, revokes direct writes, validates nested recipe JSON and extends versioned RPC whitelists/snapshots. tests/recipe_library_integration.sql passed against LifeOS and rolled back all synthetic fixtures.
