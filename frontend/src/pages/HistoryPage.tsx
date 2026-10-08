import { PageHeader } from '@/components/common/PageHeader';
import { HistoryPanel } from '@/components/history/HistoryPanel';
export function HistoryPage() {
  return (
    <section className="page-content">
      <PageHeader
        title="Suas conversas"
        description="Retome suas dúvidas e confira as fontes das respostas."
      />
      <HistoryPanel />
    </section>
  );
}
