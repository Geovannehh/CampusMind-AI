import { Search, FileText, ChevronRight, Trash2, Check } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useCampusContext } from '@/context/CampusContext';
export function DocumentLibrary() {
  const {
    view,
    docs,
    filter,
    setFilter,
    category,
    setCategory,
    setSelected,
    setRemove,
    role,
    live,
    visibleDocs,
  } = useCampusContext();
  return (
    <>
      <div className="library-tools">
        <label>
          <Search size={18} />
          <input
            aria-label="Buscar documentos"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar um documento…"
          />
        </label>
        <span>{visibleDocs.length} documentos</span>
      </div>
      <div className="category-tabs">
        {['Todas', ...new Set(docs.map((d) => d.category))].map((c) => (
          <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      {view === 'documents' ? (
        <div className="doc-grid">
          {visibleDocs.map((d) => (
            <button
              key={d.id}
              className="document-card"
              onClick={() =>
                setSelected({
                  document_id: d.id,
                  title: d.title,
                  page: 1,
                  text: d.chunks[0]?.text || '',
                })
              }
            >
              <div className="document-card-top">
                <FileText size={26} />
                <span>{d.category}</span>
              </div>
              <h3>{d.title}</h3>
              <p>{d.chunks[0]?.text.slice(0, 110)}…</p>
              <footer>
                <span>
                  {d.pages} {d.pages === 1 ? 'página' : 'páginas'} · {d.chunks.length} trechos
                </span>
                <ChevronRight size={17} />
              </footer>
            </button>
          ))}
        </div>
      ) : (
        <div className="document-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Trechos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleDocs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <button
                      className="table-doc"
                      onClick={() =>
                        setSelected({
                          document_id: d.id,
                          title: d.title,
                          page: 1,
                          text: d.chunks[0]?.text || '',
                        })
                      }
                    >
                      <FileText size={19} />
                      {d.title}
                    </button>
                  </TableCell>
                  <TableCell>{d.category}</TableCell>
                  <TableCell>{d.chunks.length}</TableCell>
                  <TableCell>
                    <span className="status-tag">
                      <Check size={13} /> Indexado
                    </span>
                  </TableCell>
                  <TableCell>
                    {(!live || role === 'admin') && (
                      <button
                        className="icon-button"
                        aria-label={'Excluir ' + d.title}
                        onClick={() => setRemove({ type: 'doc', id: d.id })}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {!visibleDocs.length && (
        <div className="empty-state">
          <Search size={30} />
          <h3>Nenhum documento encontrado.</h3>
          <p>Experimente outro nome ou categoria.</p>
        </div>
      )}
    </>
  );
}
