import { AppEmptyState } from '@/core/shared/components/app-empty-state';

/** Drop-in placeholder page for a sample-shell nav destination that has no real content yet. */
export function SamplePlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <AppEmptyState title="Nothing built here yet" description="This is a placeholder page from the sample shell example." />
    </div>
  );
}
