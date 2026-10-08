import { MessageSquare, Settings2, FileText, ThumbsUp, ShieldCheck, Layers } from 'lucide-react';
import { useCampusContext } from '@/context/CampusContext';
export function AdminOverview() {
  const { docs, history, setSettings, live, chunkCount } = useCampusContext();
  return (
    <>
      <div className="metric-row">
        {[
          { label: 'Documentos disponíveis', value: docs.length, icon: FileText },
          { label: 'Trechos pesquisáveis', value: chunkCount, icon: Layers },
          { label: 'Conversas', value: history.length, icon: MessageSquare },
          {
            label: 'Respostas avaliadas',
            value: history.flatMap((c) => c.messages).filter((m) => m.feedback).length,
            icon: ThumbsUp,
          },
        ].map((s) => (
          <div className="metric" key={s.label}>
            <s.icon size={22} />
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="info-banner">
        <ShieldCheck size={20} />
        <div>
          <strong>{live ? 'Base conectada à API' : 'Você está no ambiente de demonstração'}</strong>
          <p>
            {live
              ? 'PDFs e textos são extraídos, divididos e indexados pela API.'
              : 'Os exemplos e os arquivos TXT ficam somente neste navegador. Conecte a API para processar PDFs e usar busca vetorial com IA.'}
          </p>
        </div>
        <button onClick={() => setSettings(true)}>
          Configurar API <Settings2 size={15} />
        </button>
      </div>
    </>
  );
}
