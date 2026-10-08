import { ShieldCheck, LogOut, LoaderCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCampusContext } from '@/context/CampusContext';

export function ConnectionDialog() {
  const {
    busy,
    settings,
    setSettings,
    api,
    setApi,
    email,
    setEmail,
    password,
    setPassword,
    live,
    login,
    logout,
  } = useCampusContext();
  return (
    <Dialog open={settings} onOpenChange={setSettings}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar à sua API</DialogTitle>
          <DialogDescription>
            Use o backend FastAPI do projeto para acessar PDFs, embeddings e respostas geradas com
            IA.
          </DialogDescription>
        </DialogHeader>
        {live ? (
          <>
            <p>
              Conectado a {api} como {email}.
            </p>
            <button className="primary-btn" onClick={logout}>
              <LogOut size={17} /> Voltar à demonstração
            </button>
          </>
        ) : (
          <form
            className="connection-form"
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            <label>
              URL da API
              <input
                type="url"
                value={api}
                onChange={(e) => setApi(e.target.value)}
                placeholder="https://sua-api.exemplo.com"
                required
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <p>
              A API precisa permitir esta origem em CORS. Para esta página HTTPS, use também uma API
              HTTPS.
            </p>
            <button type="submit" className="primary-btn" disabled={busy}>
              {busy ? <LoaderCircle size={18} className="spin" /> : <ShieldCheck size={18} />}{' '}
              Conectar
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
