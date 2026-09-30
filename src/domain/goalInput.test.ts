import {
  goalToForm,
  percentTotal,
  presetFor,
  validateGoalForm,
  type GoalFormInput,
} from './goalInput';

const form = (over: Partial<GoalFormInput>): GoalFormInput => ({
  mode: 'percent',
  kcal: '2000',
  percents: { c: 50, p: 20, f: 30 },
  p: '',
  c: '',
  f: '',
  ...over,
});

function ok(i: GoalFormInput) {
  const r = validateGoalForm(i);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
}
function errors(i: GoalFormInput) {
  const r = validateGoalForm(i);
  if (r.ok) throw new Error('expected errors');
  return r.errors;
}

describe('presets', () => {
  it('recognizes presets and custom splits', () => {
    expect(presetFor({ c: 40, p: 30, f: 30 })).toBe('high-protein');
    expect(presetFor({ c: 25, p: 35, f: 40 })).toBe('low-carb');
    expect(presetFor({ c: 45, p: 25, f: 30 })).toBe('custom');
    expect(percentTotal({ c: 45, p: 25, f: 30 })).toBe(100);
  });
});

describe('validateGoalForm (percent)', () => {
  it('turns calories and percents into whole grams', () => {
    expect(ok(form({ kcal: '1850,4' }))).toEqual({
      kcal: 1850,
      c: 231,
      p: 93,
      f: 62,
      macroMode: 'percent',
      percents: { c: 50, p: 20, f: 30 },
    });
  });

  it.each([
    ['', /Enter a daily calorie goal/],
    ['abc', /Enter a daily calorie goal/],
    ['300', /between 500 and 10000/],
    ['20000', /between 500 and 10000/],
  ])('rejects calories %j', (kcal, message) => {
    expect(errors(form({ kcal })).kcal).toMatch(message);
  });

  it('says what the percents add up to', () => {
    expect(errors(form({ percents: { c: 50, p: 20, f: 25 } })).percents).toMatch(/add up to 95%/);
    expect(errors(form({ percents: { c: 52, p: 18, f: 30 } })).percents).toMatch(/steps of 5%/);
  });
});

describe('validateGoalForm (grams)', () => {
  it('derives calories from grams, rounding grams', () => {
    expect(ok(form({ mode: 'grams', p: '120.4', c: '200', f: '60' }))).toEqual({
      kcal: 1820,
      p: 120,
      c: 200,
      f: 60,
      macroMode: 'grams',
    });
  });

  it('explains missing and oversized targets', () => {
    const e = errors(form({ mode: 'grams', p: '', c: '2000', f: 'x' }));
    expect(e.p).toMatch(/Use 0 if you have no target/);
    expect(e.c).toMatch(/under 1000 g/);
    expect(e.f).toMatch(/Enter fat in grams/);
  });

  it('refuses targets that add up to too few calories', () => {
    expect(errors(form({ mode: 'grams', p: '10', c: '10', f: '5' })).f).toMatch(/125 kcal a day/);
  });
});

describe('goalToForm', () => {
  it('defaults a first goal to the Default split', () => {
    expect(goalToForm(undefined)).toMatchObject({
      mode: 'percent',
      kcal: '',
      percents: { c: 50, p: 20, f: 30 },
    });
  });

  it('fills the form from an existing goal', () => {
    expect(goalToForm({ kcal: 1820, p: 120, c: 200, f: 60, macroMode: 'grams' })).toMatchObject({
      mode: 'grams',
      kcal: '1820',
      p: '120',
      percents: { c: 50, p: 20, f: 30 },
    });
    expect(
      goalToForm({
        kcal: 2000,
        p: 150,
        c: 200,
        f: 67,
        macroMode: 'percent',
        percents: { c: 40, p: 30, f: 30 },
      }).percents,
    ).toEqual({ c: 40, p: 30, f: 30 });
  });
});
