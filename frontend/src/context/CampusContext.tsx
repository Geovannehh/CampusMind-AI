import { createContext, useContext, type ReactNode } from 'react';
import { useCampus } from '@/hooks/useCampus';

type CampusController = ReturnType<typeof useCampus>;
const CampusContext = createContext<CampusController | null>(null);
export function CampusProvider({ children }: { children: ReactNode }) {
  const campus = useCampus();
  return <CampusContext.Provider value={campus}>{children}</CampusContext.Provider>;
}
export function useCampusContext() {
  const campus = useContext(CampusContext);
  if (!campus) throw new Error('CampusProvider is required');
  return campus;
}
