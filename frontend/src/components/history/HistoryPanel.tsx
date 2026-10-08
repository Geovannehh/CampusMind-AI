import { MessageSquare, Trash2 } from 'lucide-react';
import { useCampusContext } from '@/context/CampusContext';
export function HistoryPanel() {
  const { setView, history, setActive, setRemove, newChat } = useCampusContext();
  return (
    <div className="history-grid">
      {!history.length ? (
        <div className="empty-state">
          <MessageSquare size={36} />
          <h3>Uma conversa pode abrir caminhos.</h3>
          <p>Faça sua primeira pergunta ao CampusMind.</p>
          <button className="primary-btn" onClick={newChat}>
            Nova conversa
          </button>
        </div>
      ) : (
        history.map((c) => (
          <div className="history-card" key={c.id}>
            <MessageSquare size={24} />
            <button
              className="history-open"
              onClick={() => {
                setActive(c.id);
                setView('chat');
              }}
            >
              <h3>{c.title}</h3>
              <p>
                {c.messages.length} mensagens · {new Date(c.updated).toLocaleDateString('pt-BR')}
              </p>
            </button>
            <button
              className="icon-button"
              aria-label={'Excluir conversa ' + c.title}
              onClick={() => setRemove({ type: 'conversation', id: c.id })}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
