# USDA FoodData Central raw data

`npm run build:foods` reads the USDA bulk CSV downloads from this folder and
writes `public/foods.json`. The CSVs are large, so they are gitignored; only
this README is committed. The data is public domain (U.S. Government work).

## Download

1. Open <https://fdc.nal.usda.gov/download-datasets> (FoodData Central → Download Data).
2. Download the **CSV** versions of:
   - **Foundation Foods**
   - **SR Legacy**
3. Unzip each, and put the CSV files in these folders (rename the unzipped
   folders; the file names inside stay as they are):

```
data/raw/usda/
├── foundation/        ← from the Foundation Foods zip
│   ├── food.csv
│   ├── food_nutrient.csv
│   ├── food_portion.csv
│   └── measure_unit.csv
└── sr_legacy/         ← from the SR Legacy zip
    ├── food.csv
    ├── food_nutrient.csv
    ├── food_portion.csv
    └── measure_unit.csv
```

Only those four files per folder are read; the others can stay or go. Either
folder may be missing (the build uses what's there), but you need at least one.

## What the build keeps

Per 100 g: energy (nutrient 1008; Foundation falls back to Atwater 2047, then
2048; any food then to 4P + 4C + 9F), protein (1003), fat (1004), carbohydrate
by difference (1005) and fiber (1079), plus household portions from
`food_portion.csv`. Foods missing protein, fat or carbs are skipped; when both
datasets have the same name, the Foundation entry wins. Common foods also get
Filipino search names (e.g. "kanin", "itlog", "bangus") from
`scripts/lib/aliases.ts`.

The build prints the food count and gzip size; the target is under 1.5 MB gzip.
