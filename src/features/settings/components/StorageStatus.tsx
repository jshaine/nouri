import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import styles from './Settings.module.css';

const COPY = {
  unknown: {
    icon: Shield,
    title: 'Not asked yet',
    body: 'Nouri asks your browser to protect your data after your first log.',
  },
  granted: {
    icon: ShieldCheck,
    title: 'Protected',
    body: 'Your browser won’t clear Nouri’s data to free up space.',
  },
  denied: {
    icon: ShieldAlert,
    title: 'Not protected',
    body: 'Your browser may clear data when space runs low. Installing Nouri to your home screen usually helps; back up regularly either way.',
  },
} as const;

/** Whether the browser agreed to keep our data (navigator.storage.persist). */
export function StorageStatus({ granted }: { granted: boolean | null }) {
  const copy = COPY[granted === null ? 'unknown' : granted ? 'granted' : 'denied'];
  const Icon = copy.icon;
  return (
    <div className={styles.status}>
      <Icon className={styles.icon} aria-hidden="true" />
      <p>
        <b>{copy.title}.</b> {copy.body}
      </p>
    </div>
  );
}
