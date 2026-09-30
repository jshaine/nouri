import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/ui';
import { useDocumentTitle } from '../layout/useDocumentTitle';

interface PlaceholderProps {
  title: string;
  icon: LucideIcon;
  children: string;
}

/** Stand-in for screens built in later milestones. */
export function Placeholder({ title, icon, children }: PlaceholderProps) {
  useDocumentTitle(title);
  return (
    <>
      <h1 className="visually-hidden">{title}</h1>
      <EmptyState icon={icon} title={`${title} is on the way`}>
        {children}
      </EmptyState>
    </>
  );
}
