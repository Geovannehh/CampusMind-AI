import {
  GraduationCap,
  Plus,
  MessageSquare,
  BookOpen,
  Settings2,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { useCampusContext } from '@/context/CampusContext';

export function AppSidebar() {
  const { view, setView, history, active, setActive, setSettings, email, role, live, newChat } =
    useCampusContext();
  return (
    <Sidebar className="campus-sidebar">
      <SidebarHeader>
        <a className="brand" href="/" aria-label="CampusMind, início">
          <span className="brand-icon">
            <GraduationCap size={26} />
          </span>
          <span>
            CampusMind<span className="brand-ai">AI</span>
          </span>
        </a>
        <button className="new-chat" onClick={newChat}>
          <Plus size={19} /> Nova conversa <span>⌘ K</span>
        </button>
      </SidebarHeader>
      <SidebarContent>
        <div className="side-nav">
          {[
            { id: 'chat', label: 'Assistente acadêmico', icon: MessageSquare },
            { id: 'documents', label: 'Biblioteca de documentos', icon: BookOpen },
            { id: 'history', label: 'Histórico de conversas', icon: Clock },
          ].map((n) => (
            <button
              key={n.id}
              className={view === n.id ? 'active' : ''}
              onClick={() => setView(n.id)}
            >
              <n.icon size={19} />
              {n.label}
            </button>
          ))}
        </div>
        <div className="side-section">CONVERSAS RECENTES</div>
        <div className="recent-list">
          {history.slice(0, 5).map((c) => (
            <button
              key={c.id}
              className={active === c.id ? 'selected' : ''}
              onClick={() => {
                setActive(c.id);
                setView('chat');
              }}
            >
              <MessageSquare size={15} />
              <span>{c.title}</span>
            </button>
          ))}
          {!history.length && <p>Suas conversas aparecerão aqui.</p>}
        </div>
        <div className="sidebar-note">
          <span className="note-icon">
            <ShieldCheck size={21} />
          </span>
          <strong>Respostas com contexto</strong>
          <p>Consulte a fonte antes de tomar uma decisão acadêmica.</p>
          <button onClick={() => setView('documents')}>
            Explorar a biblioteca <ChevronRight size={14} />
          </button>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <button
          className={'admin-link ' + (view === 'admin' ? 'active' : '')}
          onClick={() => setView('admin')}
        >
          <Settings2 size={19} /> Administração
        </button>
        <div className="user-profile">
          <span className="avatar">GP</span>
          <div>
            <strong>{live ? email.split('@')[0] : 'Geovane Paixão'}</strong>
            <small>
              {live ? (role === 'admin' ? 'Administrador' : 'Estudante') : 'Espaço de demonstração'}
            </small>
          </div>
          <button aria-label="Configurar conexão" onClick={() => setSettings(true)}>
            <Settings2 size={17} />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
