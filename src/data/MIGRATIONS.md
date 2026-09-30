# Schema migrations

The IndexedDB schema lives in `src/data/db.ts` (Dexie). Users' data is only
on their phones, so a bad migration can't be fixed from a server. Rules:

1. **Never edit a released `version(n)` block.** Add `version(n + 1)` with the
   full new `stores({...})` and, if data must change, an `.upgrade(tx => ...)`.
2. Bump `SCHEMA_VERSION` to match. Backups record it; importing a backup from
   an older version runs the same upgrade functions on the imported rows.
3. Upgrades must be additive and idempotent: fill defaults, split or rename
   fields, never drop user data. Keep old fields until a later version
   removes them once every release that wrote them has migrated.
4. Every new version gets a test in `db.test.ts` that opens a database at the
   previous version with sample rows, upgrades it, and checks the rows.

## History

| Version | Change                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------- |
| 1       | Initial schema: customFoods, portionOverrides, entries, goals, profile, weights, exercise, recents, favorites, meta. |
