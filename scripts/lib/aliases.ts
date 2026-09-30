/**
 * Filipino names for common USDA foods, so searching "kanin" or "itlog" finds
 * them. Matched against the start of USDA descriptions (which read
 * "Main food, detail, detail"). Curated by hand; add rules as needed.
 */
export const TAGALOG_ALIASES: readonly (readonly [RegExp, readonly string[]])[] = [
  [/^Rice, white, .*cooked/i, ['kanin', 'sinaing']],
  [/^Rice, brown, .*cooked/i, ['kanin', 'brown rice']],
  [/^Rice, white/i, ['bigas']],
  [/^Rice, glutinous/i, ['malagkit']],
  [/^Egg, whole/i, ['itlog']],
  [/^Egg, duck/i, ['itlog ng pato', 'balut']],
  [/^Chicken/i, ['manok']],
  [/^Pork/i, ['baboy']],
  [/^Beef/i, ['baka']],
  [/^Fish, milkfish/i, ['bangus']],
  [/^Fish, tilapia/i, ['tilapya']],
  [/^Fish, tuna/i, ['tuna', 'tambakol']],
  [/^Fish, mackerel/i, ['galunggong', 'alumahan']],
  [/^Fish, sardine/i, ['sardinas']],
  [/^Fish,/i, ['isda']],
  [/^Crustaceans, shrimp/i, ['hipon']],
  [/^Crustaceans, crab/i, ['alimango', 'alimasag']],
  [/^Mollusks, squid/i, ['pusit']],
  [/^Mollusks, clam/i, ['tulya', 'halaan']],
  [/^Mollusks, mussel/i, ['tahong']],
  [/^Bananas?, /i, ['saging']],
  [/^Plantains?, /i, ['saba', 'saging na saba']],
  [/^Mangos?, /i, ['mangga']],
  [/^Papayas?, /i, ['papaya']],
  [/^Pineapple, /i, ['pinya']],
  [/^Guavas?, /i, ['bayabas']],
  [/^Jackfruit, /i, ['langka']],
  [/^Coconut /i, ['niyog', 'buko']],
  [/^Nuts, coconut/i, ['niyog', 'buko']],
  [/^Peanuts?, /i, ['mani']],
  [/^Mung beans/i, ['monggo', 'munggo']],
  [/^Sweet potato/i, ['kamote']],
  [/^Cassava/i, ['kamoteng kahoy', 'balinghoy']],
  [/^Taro/i, ['gabi']],
  [/^Water ?spinach/i, ['kangkong']],
  [/^Eggplant/i, ['talong']],
  [/^Balsam-pear|^Bitter melon/i, ['ampalaya']],
  [/^Squash, /i, ['kalabasa']],
  [/^Cabbage/i, ['repolyo']],
  [/^Tomatoes?, /i, ['kamatis']],
  [/^Onions?, /i, ['sibuyas']],
  [/^Garlic/i, ['bawang']],
  [/^Ginger/i, ['luya']],
  [/^Bread, /i, ['tinapay']],
  [/^Noodles/i, ['pansit', 'noodles']],
  [/^Milk, /i, ['gatas']],
  [/^Sugars?, /i, ['asukal']],
  [/^Soy sauce/i, ['toyo']],
  [/^Vinegar/i, ['suka']],
];

export function aliasesFor(description: string): string[] {
  const out = new Set<string>();
  for (const [pattern, names] of TAGALOG_ALIASES) {
    if (pattern.test(description)) names.forEach((n) => out.add(n));
  }
  return [...out];
}
