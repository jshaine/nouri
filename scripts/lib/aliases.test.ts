import { aliasesFor } from './aliases';

describe('aliasesFor', () => {
  it.each([
    ['Rice, white, long-grain, regular, enriched, cooked', ['kanin', 'sinaing']],
    ['Rice, white, long-grain, regular, raw, enriched', ['bigas']],
    ['Fish, milkfish, raw', ['bangus', 'isda']],
    ['Egg, whole, raw, fresh', ['itlog']],
    ['Chicken, broilers or fryers, breast, meat only, cooked, roasted', ['manok']],
    ['Kale, raw', []],
    ['Rice, white, glutinous, unenriched, cooked', ['malagkit']],
    ['Rice, white, long-grain, regular, unenriched, uncooked', ['bigas']],
  ])('%s → %j', (description, aliases) => {
    expect(aliasesFor(description)).toEqual(aliases);
  });
});
