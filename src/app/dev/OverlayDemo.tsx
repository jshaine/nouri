import { useState } from 'react';
import { Button, Sheet, Stepper, Toast } from '@/ui';
import styles from './UiGallery.module.css';

/** Gallery section for the bottom sheet and undo toast. */
export function OverlayDemo() {
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState(false);
  const [servings, setServings] = useState(1);

  return (
    <section className={styles.section}>
      <h2>Overlays</h2>
      <div className={styles.row}>
        <Button
          onClick={() => {
            setSheet(true);
          }}
        >
          Open sheet
        </Button>
        <Button
          onClick={() => {
            setToast(true);
          }}
        >
          Show toast
        </Button>
      </div>

      <Sheet
        open={sheet}
        onClose={() => {
          setSheet(false);
        }}
        title="Chicken adobo"
        footer={
          <Button variant="primary" block>
            Add to log
          </Button>
        }
      >
        <Stepper label="Servings" value={servings} onChange={setServings} step={0.5} />
      </Sheet>

      {toast && (
        <div className={styles.toast}>
          <Toast
            message="Entry deleted"
            actionLabel="Undo"
            onAction={() => undefined}
            onDismiss={() => {
              setToast(false);
            }}
          />
        </div>
      )}
    </section>
  );
}
