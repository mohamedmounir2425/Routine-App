# Today dashboard and reliability changes

## Run locally

Use `npm run dev` and open the URL Vite prints. The landing route redirects to `/today`.

Run `npm run build` for the TypeScript and production/PWA build. Run `npm test` for the Today, work time, focus and reliability scenarios. The runner uses Vite's TypeScript loader and fake-indexeddb; it never edits browser data or connects to a configured Supabase project.

## Today workflow

- Space cards filter the agenda across Worship, Health, Work, Home and Plans. The All spaces button clears the space selection.
- Search and status filters narrow the agenda. The completed filter expands completed items.
- Add and edit tasks in all five spaces from Today, with date, time, duration, priority, daily/weekday/weekly recurrence and an optional plan link. Plans can contain standalone tasks without requiring an existing goal.
- Health supports ordinary health tasks as well as a separate inline workout scheduler. A scheduled workout repeats on the current weekday; it is not a one-off appointment.
- Work/Home tasks can link a project from the same space. Health, Worship and Plans have dedicated task routes, while Work and Home retain their existing task screens. All read the same task records as Today.
- Reveal-on-save enables the chosen space and its task feed in the same local transaction as the task write. Future tasks remain saved for their scheduled day, with confirmation in Today. The space manager hides spaces without deleting records and keeps at least one enabled.
- Prayer completion, Quran page increments, project step completion and task completion are available in the feed. Workout and Azkar actions launch their existing players/views.
- The space tools panel links to the full domain tools for project, plan, worship and routine administration.
- Dexie mutations refresh the feed; the page also refreshes each minute and when returning to the tab. Visible save/load errors offer recovery instead of silent failure.
- Preferences can hide spaces or categories, and future-dated tasks will not appear until due. Search/status filters do not change the underlying records or the global daily progress totals.

## Data protection

Initialization now inserts missing built-in records transactionally instead of clearing custom data and schedules. Forced exercise refresh preserves favorites. Database loading failures show a retry view.

Backup format v3 contains all 12 portable database tables, including day plans, and supported local prayer, Quran, Tasbeeh, focus history and preference data. Authentication credentials, active focus runtime state and the account/device sync queue are excluded. Restore merges by record ID rather than deleting records absent from the file. It accepts legacy v1/v2 exports, restores exercises, validates datasets before writes and rolls back Dexie writes on failure. LocalStorage writes are compensated if the transaction fails; IndexedDB and localStorage cannot provide a single native cross-store transaction.

## Verification and remaining work

The test suite includes preservation of custom seed data, full backup round trips, invalid import rejection, legacy exercises, storage-write failure rollback, task time windows and agenda section completeness/uniqueness.

Browser verification was attempted but the local preview could not be reached, and the browser automation tool later became unavailable. Desktop/mobile layout, focus behavior and the full UI interaction flows still need visual acceptance testing.

This does not certify the entire app as production-ready. The original source lint backlog, large main bundle, full cloud sync error/conflict handling, account-switch isolation, backend row-level security and closed-app reminder delivery remain separate hardening work. Most existing domain labels remain Arabic; the redesigned dashboard header, controls, space tools and workout scheduler support the selected language.

## Reviewed JSON import

Settings now previews file version/date, record totals, new IDs and conflicts before import. The default keeps existing records/preferences; users can explicitly choose file values. Neither option deletes records absent from the file. Preview is a point-in-time comparison, not a timestamp-based conflict resolver.

Before every import, the current portable snapshot is saved under the non-exported localStorage key lifeos_pre_import_backup. Settings offers a download of that recovery file. Only the latest recovery snapshot is retained. If persistence fails (including quota), import stops before writing records. This snapshot is on the same device: download a separate copy for device loss protection. File selection is limited to 25 MiB.

To transfer manually: export JSON on the source device, transfer it privately, open Settings on the destination device, select the file, review conflicts and confirm. For an older phone copy, choose file values only after reviewing the summary. This workflow works locally without Supabase, does not initiate a cloud upload, and does not resolve cloud/account sync issues. Auth credentials and pending cloud operations are not transferred.

Verification adds preview-without-write, both conflict choices, safety snapshot exclusion/capture, and quota-failure protection scenarios. Visual mobile/device acceptance remains to be performed.

## Sync safety foundation (2026-11-01)

Dexie v7 adds the missing userId and account/entity queue indexes without changing portable backup v3. Required cloud tables are preflighted with ordered 500-row pages; a rejected table or invalid local write aborts the entire pull before/within one local transaction. Local edits during the read and remaining queued operations block pull. Bulk write errors propagate instead of being swallowed.

Queue squashing is transactional and account-scoped. Acknowledgement and retry updates compare the exact sent revision before deleting/updating it; failed operations remain counted and manual sync resets retry state. Delete intentions are retained even after offline creates. Flushes within the module are serialized, and queue payload ownership is checked before upload. This does not implement cross-tab network leases or server optimistic concurrency.

The account menu shows errors, pending totals and last-success time; idle/offline no longer means synced. Supabase APIs are not awaited inside auth state callbacks. Tests cover these data/queue protections using fake-indexeddb and a fake cloud transport; they do not connect to production.

No Supabase schema changes were applied in this foundation. Missing projects/plans/plan_milestones/workout_schedules now cause an explicit failure rather than a partial successful pull. Schema alignment, complete field mappers, local account isolation, conflict review, deletion propagation and real two-device acceptance remain required before relying on full mobile sync.
