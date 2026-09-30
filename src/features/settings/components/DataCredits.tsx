import styles from './Settings.module.css';

/** Where the food numbers come from. FNRI appears only when its data is bundled. */
export function DataCredits({ sources }: { sources: readonly string[] | undefined }) {
  if (!sources) return <p className={styles.meta}>Loading the food list…</p>;
  return (
    <div>
      <p className={styles.meta}>Food data:</p>
      <ul className={styles.credits}>
        {sources.map((s) => (
          <li key={s}>{s}</li>
        ))}
        <li>Your own foods and portions, entered by you</li>
      </ul>
    </div>
  );
}
