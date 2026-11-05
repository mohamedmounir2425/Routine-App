# App understanding and reliability baseline

Reviewed on 2026-10-29. This is a source review and build/lint baseline, not a browser acceptance test or a verification of the deployed Supabase backend.

## Product and architecture

The original workout and back-care app has evolved into a bilingual Arabic/English personal Life OS. `/today` combines actions from the individual spaces; `/spaces` is their directory.

| Area | Implemented code covers |
| --- | --- |
| Health | Exercise library, custom routines, weekly and multi-week plans, guided workout player, completion logs and pain tracking |
| Worship | Prayer times and check-ins, Azkar player/history, Quran tracking, Tasbeeh |
| Work | Tasks, projects and project setup details, focus sessions, workday time calculations, progress |
| Home | Tasks, routines, maintenance and projects |
| Plans | Goals, milestones, linked tasks and progress |
| Shared | Today aggregation/actions, global progress, preferences, onboarding, optional authentication and cloud sync |

React 18 and TypeScript run through Vite. React Router defines the navigation in `src/App.tsx`. `src/app/useAppController.ts` loads the original health data and coordinates workouts, settings and scheduling. Newer spaces have their own views and services under `src/features`.

Dexie database `RoutineAppDB`, schema version 5, has 12 tables: exercises, routines, weeklySchedule, workoutLogs, settings, azkarLogs, tasks, pendingSync, projects, plans, planMilestones and workoutSchedules. Other data lives separately in localStorage, including prayer records, Quran progress/bookmarks, Tasbeeh and focus state/history. Supabase authentication and sync are optional. The sync engine has both full pull/push operations and individual mutations with an offline queue.

Vite PWA configuration provides an installable shell and asset caching. External video remains an external dependency. Reminder scheduling runs inside a mounted React hook.

## Verified baseline

- `npm run build`: passed, including PWA service-worker generation. Main JavaScript bundle is about 1.59 MB before gzip, with a large-chunk warning.
- `npm run lint`: reports 143 problems: 126 errors and 17 warnings. These include source issues and generated `dev-dist` files being linted.
- No `test` script is defined in package.json. There are custom Today scenarios and work time/focus test suites; their presence does not establish that they pass. They were not executed in this review.
- Existing staged and unstaged edits, especially in the Work module, were present before this review. They must be preserved.
- README remains the Vite template; the overview and roadmap describe older stages and should not be used as completion evidence.

## Priority 1: protect user data

1. **Destructive reseeding:** `initializeDatabase` in `src/db/database.ts` clears exercises, routines and weeklySchedule when count/sample checks request an update, or forceRefresh is true. This can discard custom content and schedule edits. Replace this with transactional, versioned seed updates that preserve user records and customizations. Add upgrade tests with existing user data.
2. **Incomplete backup/restore:** `src/db/backup.ts` exports only the original five datasets. Import does not restore exported exercises. Tasks, projects, goals, milestones, Azkar, workoutSchedules and localStorage data are excluded. Restore writes incrementally without a transaction or record schema validation. Implement a versioned backup format, validate before writing, and test full round trips and rollback on invalid input.
3. **Unreliable full sync results:** full pull/push operations in `src/db/syncEngine.ts` often ignore returned Supabase errors. Pull uses bulkPut without conflict resolution, then full sync pushes local data back. Define conflict and deletion rules, check every server response, and avoid reporting success after partial failure.
4. **Account ownership:** the local application tables are shared rather than keyed by account, while pending mutations have user IDs. Define explicit guest-to-account import and account-switch behavior so records from one local account are not unintentionally uploaded to another. Verify server row-level security against the actual schema; no backend policy verification was performed here.

## Priority 2: consistent daily operation

- Surface initialization, save, restore and sync failures in the UI. Initialization and controller loading currently log errors and can continue into the normal application view. Add a recovery screen and an application error boundary.
- Standardize persistence and refresh notifications. Domain data is split between Dexie, localStorage, React state and custom events; confirm changes appear consistently in Today, individual spaces and progress views.
- Use local calendar dates consistently. Focus statistics and reminder guards use UTC date slices while other features use local-date utilities. Test Cairo midnight and daylight-saving boundaries.
- Reminder scheduling checks an exact minute while the page is alive and does not use configured reminderDays. Add day filtering, missed-time behavior and truthful delivery status; do not promise closed-app delivery from this implementation.
- Preserve all settings on cloud pull. The profile mapper constructs a fresh settings object and omits fields such as Today preferences.
- Verify new Work task fields survive cloud and backup round trips. The local task model is evolving while cloud mapping is explicit.

## Priority 3: make future changes dependable

1. Establish one repeatable test command and CI checks for type/build, lint and domain tests. Exclude generated output from lint without hiding source errors.
2. Cover high-value scenarios: database upgrades, backup round trips, offline edits/reconnect, server rejection, account switching, recurring-task completion, focus transitions, local midnight and workout completion.
3. Add browser acceptance coverage for onboarding, each space, Arabic RTL/English, mobile navigation, refresh persistence and offline startup.
4. Audit the similarly named files under `src/components` and `src/features` before consolidation; some are wrappers or shared implementations, so do not delete based on naming alone.
5. Split routes/features into lazy-loaded bundles after behavior is stable. Update README and PWA product metadata to reflect the current Life OS scope.

## Suggested completion order

First make seeding and backup safe. Next make sync and account ownership predictable. Then fix daily date/reminder/state consistency and add recovery UX. Establish passing automated checks and browser acceptance scenarios before expanding unfinished features or polishing performance.

Feature screens existing in the repository should be treated as implemented candidates, not production-ready features, until their persistence and end-to-end behavior have been checked.
