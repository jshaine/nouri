import { MACRO_LETTER, MACRO_NAME, type Macro } from '@/domain';
import styles from './MacroLabel.module.css';

export interface MacroLabelProps {
  macro: Macro;
  /** "full" shows "Protein"; "letter" shows "P" with the full name for screen readers. */
  variant?: 'full' | 'letter';
}

/** A macro's name with its color swatch. The letter is always visible, so color is never the only cue. */
export function MacroLabel({ macro, variant = 'full' }: MacroLabelProps) {
  const letter = MACRO_LETTER[macro];
  const name = MACRO_NAME[macro];
  return (
    <span className={styles.label} data-macro={macro}>
      <span className={styles.swatch} aria-hidden="true" />
      {variant === 'full' ? (
        <span>
          <b>{letter}</b>
          {name.slice(letter.length)}
        </span>
      ) : (
        <>
          <b aria-hidden="true">{letter}</b>
          <span className="visually-hidden">{name}</span>
        </>
      )}
    </span>
  );
}
