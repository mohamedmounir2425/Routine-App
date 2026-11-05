# Versioned synchronization

Implemented on 2026-11-01. Eleven supported domain entities use server revisions and a consistent snapshot through sync_read_snapshot. Writes use sync_apply_mutation with expected revision and a durable operation ID. Direct authenticated INSERT/UPDATE/DELETE is revoked on domain tables; anonymous access is denied.

The client compares local contents, its last confirmed baseline and cloud contents. It discovers saved offline edits even without a session callback. Concurrent edits preserve both copies in syncConflicts; Settings lets the user download both or explicitly choose local/cloud. A choice cannot discard a newer local edit made after comparison opened. A newer cloud edit is checked again by CAS.

sync_entity_versions stores user_id, entity_table, entity_id, generated id, revision, deleted, updated_at, last_operation_id and last_request_hash. Its composite primary key scopes metadata to the owner. Triggers preserve deletion tombstones. Stale imports cannot silently restore deleted items; restoring requires an explicit local-copy choice. Project/plan deletion cascades to owned tasks and plan milestones with tombstones. Retries recognize acknowledged operations after a lost response.

Local schema v8 adds syncBaselines and syncConflicts. Existing/imported account rows are captured before synchronization. Local edits arriving during a network request survive its acknowledgment. Unsupported localStorage-only activities and custom exercise data remain local plus portable JSON backup. Guest data is not automatically uploaded.

Migration: ../../supabase/migrations/20261101140907_versioned_sync_mutations.sql. Public RPC wrappers use authenticated access and guarded private helpers with fixed search_path, ownership checks and an entity whitelist. Snapshots and mutations share a per-user transaction lock.

Validation: 154 local scenarios passed. supabase/tests/versioned_sync_integration.sql passed against LifeOS using two temporary Auth users and database JWT claims, testing ownership, CAS, retries, deletion/restoration, cascades, unknown payload fields, direct-write rejection and anonymous denial. ROLLBACK removed fixtures; a follow-up check confirmed no test accounts persisted. This supersedes earlier expired-test notes.

Still required: interactive browser/mobile acceptance with sign-in, offline edit/reconnect and conflict-choice UI. This backend test does not represent physical-device acceptance. Update old clients before use: direct writes are intentionally rejected.
