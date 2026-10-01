# Open Food Facts raw data (Philippine products)

`npm run fetch:off` downloads every product Open Food Facts lists for the
Philippines into `philippines.json` here (gitignored). `npm run build:foods`
then writes the usable ones to `public/foods-ph.json`, which is committed.

## What gets in

Open Food Facts is a volunteer database: people photograph packages and type
in the nutrition facts. Typos happen, so the build keeps a product only when:

- it has a name, a barcode, and kcal, protein, carbs and fat per 100 g;
- it is sold by weight (drinks are labeled per 100 ml, which Nouri can't use
  as grams yet);
- the numbers are possible (macros at most 100 g, at most 900 kcal) and agree
  with each other (kcal within 20% of 4P + 4C + 9F);
- Open Food Facts hasn't flagged a data-quality error on it.

Duplicates (same barcode, or same name) keep one product, preferring one with
a serving size. In the app these foods carry a **Label** badge and a reminder
to check them against the pack.

## License

Open Food Facts data is available under the
[Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/),
and its contents under the
[Database Contents License](https://opendatacommons.org/licenses/dbcl/1-0/).
`public/foods-ph.json` is a derived database and is shared under the ODbL too.
Credit: © Open Food Facts contributors, <https://world.openfoodfacts.org>.
