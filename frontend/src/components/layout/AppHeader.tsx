import { ChevronRight } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useCampusContext } from '@/context/CampusContext';

export function AppHeader() {
  const { view, setSettings, live } = useCampusContext();
  return (
    <header className="topbar">
      <div>
        <SidebarTrigger className="mobile-menu" />
        <span className="breadcrumb">Meu campus</span>
        <ChevronRight size={15} />
        <strong>
          {view === 'chat'
            ? 'Assistente acadêmico'
            : view === 'documents'
              ? 'Biblioteca'
              : view === 'history'
                ? 'Conversas'
                : 'Administração'}
        </strong>
      </div>
      <button
        className={'demo-pill ' + (live ? 'connected' : '')}
        onClick={() => setSettings(true)}
      >
        <span />
        {live ? 'API conectada' : 'Modo demonstração'}
      </button>
    </header>
  );
}
