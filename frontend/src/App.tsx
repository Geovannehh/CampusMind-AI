import { Toaster } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CampusProvider, useCampusContext } from '@/context/CampusContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { ChatPage } from '@/pages/ChatPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { AdminPage } from '@/pages/AdminPage';
import { SourceDialog } from '@/components/documents/SourceDialog';
import { ConnectionDialog } from '@/components/auth/ConnectionDialog';
import { DeleteConfirmation } from '@/components/common/DeleteConfirmation';

function CampusLayout() {
  const { view } = useCampusContext();
  return (
    <SidebarProvider>
      <Toaster richColors position="top-center" />
      <AppSidebar />
      <main className="main-shell">
        <AppHeader />
        {view === 'chat' ? (
          <ChatPage />
        ) : view === 'documents' ? (
          <DocumentsPage />
        ) : view === 'history' ? (
          <HistoryPage />
        ) : (
          <AdminPage />
        )}
      </main>
      <SourceDialog />
      <ConnectionDialog />
      <DeleteConfirmation />
    </SidebarProvider>
  );
}
export default function App() {
  return (
    <CampusProvider>
      <CampusLayout />
    </CampusProvider>
  );
}
