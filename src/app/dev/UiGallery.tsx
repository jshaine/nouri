import { Moon, Plus, Sun, Utensils } from 'lucide-react';
import { useState } from 'react';
import { MACROS, type ThemePreference } from '@/domain';
import {
  Button,
  EmptyState,
  IconButton,
  MacroLabel,
  NumberField,
  ProgressBar,
  SourceBadge,
  Stepper,
  Tabs,
} from '@/ui';
import { applyTheme } from '../theme';
import { OverlayDemo } from './OverlayDemo';
import styles from './UiGallery.module.css';

const SAMPLE = { protein: [82, 120], carbs: [151, 230], fat: [68, 62] } as const;
const TABS = [
  { id: 'search', label: 'Search' },
  { id: 'recent', label: 'Recent' },
  { id: 'mine', label: 'My foods' },
  { id: 'manual', label: 'Manual' },
] as const;

/** Dev-only component gallery (open /#gallery with `npm run dev`). */
export default function UiGallery() {
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('search');
  const [grams, setGrams] = useState('');
  const [qty, setQty] = useState(1);

  const cycleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <main className={styles.page}>
      <header className={styles.row}>
        <h1>UI gallery</h1>
        <IconButton
          icon={theme === 'dark' ? Sun : Moon}
          label="Toggle theme"
          onClick={cycleTheme}
        />
      </header>

      <section className={styles.section}>
        <h2>Buttons</h2>
        <div className={styles.row}>
          <Button variant="primary">Add to log</Button>
          <Button>Save portion</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
        <Button variant="primary" pill icon={Plus}>
          Add food
        </Button>
      </section>

      <section className={styles.section}>
        <h2>Macros and progress</h2>
        {MACROS.map((m) => (
          <div key={m} className={styles.macro}>
            <div className={styles.row}>
              <MacroLabel macro={m} />
              <span>
                {SAMPLE[m][0]}g / {SAMPLE[m][1]}g
              </span>
            </div>
            <ProgressBar value={SAMPLE[m][0]} goal={SAMPLE[m][1]} macro={m} />
          </div>
        ))}
        <ProgressBar value={1240} goal={1850} />
      </section>

      <section className={styles.section}>
        <h2>Badges</h2>
        <div className={styles.row}>
          <SourceBadge source="usda" />
          <SourceBadge source="fnri" />
          <SourceBadge source="custom" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Inputs</h2>
        <NumberField label="Amount" unit="g" value={grams} onChange={setGrams} hint="Per 100 g" />
        <NumberField
          label="Protein"
          unit="g"
          value="abc"
          onChange={() => undefined}
          error="Enter a number, like 12.5."
        />
        <Stepper label="Quantity" value={qty} onChange={setQty} step={0.5} />
      </section>

      <section className={styles.section}>
        <h2>Tabs</h2>
        <Tabs label="Add food" tabs={TABS} value={tab} onChange={setTab}>
          <p>Selected: {tab}</p>
        </Tabs>
      </section>

      <OverlayDemo />

      <EmptyState
        icon={Utensils}
        title="Nothing logged yet"
        action={<Button variant="primary">Add food</Button>}
      >
        Log your first meal to see today&apos;s totals.
      </EmptyState>
    </main>
  );
}
