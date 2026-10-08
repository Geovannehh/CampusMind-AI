import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCampusContext } from '@/context/CampusContext';

export function SourceDialog() {
  const { docs, selected, setSelected, live } = useCampusContext();
  return (
    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="source-dialog">
        <DialogHeader>
          <DialogTitle>{selected?.title}</DialogTitle>
          <DialogDescription>
            {live ? 'Trecho recuperado da base institucional' : 'Documento de demonstração'} ·
            Página {selected?.page}
          </DialogDescription>
        </DialogHeader>
        <div className="source-paper">
          <div className="eyebrow">TRECHO ORIGINAL</div>
          <p>{selected?.text}</p>
        </div>
        {selected && (
          <div className="all-chunks">
            {docs
              .find((d) => d.id === selected.document_id)
              ?.chunks.map((c, i) => (
                <button
                  className={c.text === selected.text ? 'active' : ''}
                  key={i}
                  onClick={() => setSelected({ ...selected, page: c.page, text: c.text })}
                >
                  Página {c.page} · Trecho {i + 1}
                </button>
              ))}
          </div>
        )}
        <p className="dialog-footnote">
          {live
            ? 'O texto é extraído do documento enviado à API.'
            : 'Conteúdo fictício. Consulte sua instituição para informações oficiais.'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
