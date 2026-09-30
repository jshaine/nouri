import { NouriDb, SCHEMA_VERSION } from './db';

describe('NouriDb schema', () => {
  it('opens at the current version with every table', async () => {
    const db = new NouriDb('nouri-schema-test');
    await db.open();
    expect(db.verno).toBe(SCHEMA_VERSION);
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'customFoods',
      'entries',
      'exercise',
      'favorites',
      'goals',
      'meta',
      'portionOverrides',
      'profile',
      'recents',
      'weights',
    ]);
    expect(db.entries.schema.indexes.map((i) => i.name)).toEqual(
      expect.arrayContaining(['date', 'foodKey']),
    );
    db.close();
  });
});
