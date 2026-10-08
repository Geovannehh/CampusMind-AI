import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useCampusContext } from '@/context/CampusContext';

export function DeleteConfirmation() {
  const { remove, setRemove, deleteItem } = useCampusContext();
  return (
    <AlertDialog open={!!remove} onOpenChange={(o) => !o && setRemove(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir {remove?.type === 'doc' ? 'documento' : 'conversa'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {remove?.type === 'doc'
              ? 'O documento deixará de aparecer nas próximas buscas.'
              : 'As mensagens desta conversa serão removidas.'}{' '}
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={deleteItem}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
