# FNRI Philippine Food Composition Tables (PhilFCT)

The PhilFCT data belongs to the Food and Nutrition Research Institute (DOST-FNRI).
It is **copyrighted** and has no public bulk download.

- **Do not scrape** the PhilFCT website. Nouri never downloads it.
- If you obtain the data **with FNRI's permission**, save it here as
  `data/raw/fnri/philfct.csv` in the format below, then run `npm run build:foods`.
- Without the file, the build skips FNRI with a message and uses USDA only.

## Where the output goes

This repository is public, so FNRI data must never be committed:

- `data/raw/fnri/*` (except this README) is gitignored.
- FNRI foods are written to **`public/foods-fnri.json`**, which is also
  gitignored. `public/foods.json` (committed) stays USDA-only.
- A deployed site serves `foods-fnri.json` to anyone who opens it. Only deploy
  a build that includes it if your permission covers that (see DEPLOY.md).

## CSV format

UTF-8, comma-separated, with a header row. Quote any field containing a comma.

| Column          | Required     | Meaning                                                                           |
| --------------- | ------------ | --------------------------------------------------------------------------------- |
| `name`          | yes          | Food name as you want to see it, e.g. `Sinigang na baboy`                         |
| `name_alt`      | no           | Other names to search by (Filipino or English); separate several with `;`         |
| `kcal`          | no           | Energy for `basis_g` grams. Empty means 4P + 4C + 9F                              |
| `protein_g`     | yes          | Protein for `basis_g` grams                                                       |
| `fat_g`         | yes          | Fat for `basis_g` grams                                                           |
| `carbs_g`       | yes          | Carbohydrate for `basis_g` grams                                                  |
| `fiber_g`       | no           | Dietary fiber for `basis_g` grams                                                 |
| `basis_g`       | no           | The amount the numbers describe; default `100`. Values are converted to per 100 g |
| `portion_label` | no           | A household measure, e.g. `1 bowl`                                                |
| `portion_g`     | with a label | Grams in that measure, e.g. `250`                                                 |

Decimals may use `.` or `,`. To give a food several portions, repeat the row
with the same `name` and a different `portion_label`/`portion_g`; the
nutrient columns of the first row are used.

Example (made-up numbers):

```csv
name,name_alt,kcal,protein_g,fat_g,carbs_g,fiber_g,basis_g,portion_label,portion_g
Sinigang na baboy,sour soup; pork sour soup,60,5,3,3,0.8,100,1 bowl,250
Sinigang na baboy,,60,5,3,3,0.8,100,1 cup,240
Pandesal,salt bread,145,4.5,1.5,28,1,50,1 piece,50
```

Rows with problems are skipped, and the build lists each one with its line
number, e.g. `Line 7 (Turon): not a number: kcal.` Each food's id comes from
its name, so renaming a food gives it a new id; past log entries are
unaffected, because they keep their own copy of the numbers.
