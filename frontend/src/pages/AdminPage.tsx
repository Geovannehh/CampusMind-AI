import { Upload, LoaderCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { DocumentLibrary } from '@/components/documents/DocumentLibrary';
import { useCampusContext } from '@/context/CampusContext';
export function AdminPage() {
  const { live, role, uploading, file, upload } = useCampusContext();
  const action =
    !live || role === 'admin' ? (
      <button className="primary-btn" disabled={uploading} onClick={() => file.current?.click()}>
        {uploading ? <LoaderCircle size={18} className="spin" /> : <Upload size={18} />} Adicionar
        documento
      </button>
    ) : undefined;
  return (
    <section className="page-content">
      <PageHeader
        title="Base de conhecimento"
        description="Gerencie os documentos que dão contexto ao assistente."
        action={action}
      />
      <AdminOverview />
      <DocumentLibrary />
      <input
        ref={file}
        type="file"
        accept={live ? '.pdf,.txt' : '.txt'}
        className="sr-only"
        onChange={(e) => upload(e.target.files?.[0])}
      />
    </section>
  );
}
