import { PageHeader } from '@/components/common/PageHeader';
import { DocumentLibrary } from '@/components/documents/DocumentLibrary';
export function DocumentsPage() {
  return (
    <section className="page-content">
      <PageHeader
        title="Biblioteca de documentos"
        description="Explore os documentos disponíveis e consulte os trechos originais."
      />
      <DocumentLibrary />
    </section>
  );
}
