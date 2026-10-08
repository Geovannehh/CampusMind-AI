import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Doc, Source, Conversation, Message } from '@/types/campus';
import { samples } from '@/data/sampleDocuments';
import { searchDocs } from '@/utils/searchDocuments';
import { createAPIClient } from '@/services/api';

export function useCampus() {
  const [view, setView] = useState('chat'),
    [mode, setMode] = useState('chat'),
    [question, setQuestion] = useState(''),
    [docs, setDocs] = useState<Doc[]>(samples),
    [history, setHistory] = useState<Conversation[]>([]),
    [active, setActive] = useState(''),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState(''),
    [category, setCategory] = useState('Todas'),
    [selected, setSelected] = useState<Source | null>(null),
    [remove, setRemove] = useState<{ type: string; id: string } | null>(null),
    [settings, setSettings] = useState(false),
    [api, setApi] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [token, setToken] = useState(''),
    [role, setRole] = useState(''),
    [ready, setReady] = useState(false),
    [uploading, setUploading] = useState(false);
  const end = useRef<HTMLDivElement>(null),
    file = useRef<HTMLInputElement>(null),
    input = useRef<HTMLTextAreaElement>(null);
  const live = !!token,
    conversation = history.find((c) => c.id === active),
    messages = conversation?.messages || [],
    chunkCount = docs.reduce((n, d) => n + d.chunks.length, 0),
    lastSources = [...messages].reverse().find((m) => m.role === 'assistant')?.sources || [];
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('campusmind-demo-v1') || 'null');
      if (saved) {
        setDocs(saved.docs || samples);
        setHistory(saved.history || []);
      }
      setApi(
        localStorage.getItem('campusmind-api') ||
          import.meta.env.VITE_API_URL ||
          'http://localhost:8000',
      );
    } catch {
      toast.error('Não foi possível restaurar os dados locais.');
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready && !live)
      try {
        localStorage.setItem('campusmind-demo-v1', JSON.stringify({ docs, history }));
      } catch {
        toast.error('Armazenamento local cheio. Exporte ou remova documentos.');
      }
  }, [docs, history, ready, live]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy]);
  const request = createAPIClient(api, token);
  async function refresh(auth = token) {
    const [d, h] = await Promise.all([
      request<Doc[]>('/documents', {}, auth),
      request<Conversation[]>('/conversations', {}, auth),
    ]);
    setDocs(d);
    setHistory(h);
  }
  async function login() {
    setBusy(true);
    try {
      if (!/^https?:\/\//.test(api)) throw Error('Informe a URL completa da API.');
      const data = await request<{ access_token: string; role: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
        '',
      );
      await refresh(data.access_token);
      setToken(data.access_token);
      setRole(data.role);
      setActive('');
      setSettings(false);
      setPassword('');
      localStorage.setItem('campusmind-api', api);
      toast.success('Conectado à base institucional.');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        newChat();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  function newChat() {
    setView('chat');
    setActive('');
    setQuestion('');
    input.current?.focus();
  }
  async function ask(raw = question) {
    const q = raw.trim();
    if (!q || busy) return;
    if (q.length > 2000) {
      toast.error('Use até 2.000 caracteres.');
      return;
    }
    setQuestion('');
    setView('chat');
    setBusy(true);
    const id = active || crypto.randomUUID(),
      user: Message = { id: crypto.randomUUID(), role: 'user', content: q, sources: [] };
    setActive(id);
    setHistory((prev) => {
      const old = prev.find((c) => c.id === id);
      return [
        {
          id,
          title: old?.title || q.slice(0, 45),
          updated: new Date().toISOString(),
          messages: [...(old?.messages || []), user],
        },
        ...prev.filter((c) => c.id !== id),
      ];
    });
    try {
      let response: Message;
      if (live) {
        const r = await request<{ conversation_id: string }>('/chat', {
          method: 'POST',
          body: JSON.stringify({ question: q, conversation_id: conversation?.id || null, mode }),
        });
        setActive(r.conversation_id);
        await refresh();
        return;
      } else {
        const sources = searchDocs(q, docs);
        response = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: sources.length
            ? mode === 'search'
              ? 'Encontrei estes trechos na sua base de documentos. Abra uma fonte para consultar o conteúdo.'
              : sources[0].text +
                '\n\nEste trecho foi recuperado por busca textual na base de demonstração.'
            : 'Não encontrei informações suficientes nos documentos disponíveis. Tente reformular a pergunta ou adicione um documento sobre o assunto.',
          sources,
        };
      }
      setHistory((prev) =>
        prev.map((c) => (c.id === id ? { ...c, messages: [...c.messages, response] } : c)),
      );
    } catch (e) {
      toast.error((e as Error).message);
      setHistory((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, messages: c.messages.filter((m) => m.id !== user.id) } : c,
        ),
      );
      setQuestion(q);
    } finally {
      setBusy(false);
    }
  }
  async function feedback(message: Message, value: number) {
    try {
      if (live)
        await request('/messages/' + message.id + '/feedback', {
          method: 'POST',
          body: JSON.stringify({ value }),
        });
      setHistory((prev) =>
        prev.map((c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === message.id ? { ...m, feedback: value } : m)),
        })),
      );
      toast.success('Avaliação registrada.');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function deleteItem() {
    if (!remove) return;
    try {
      if (live)
        await request(
          '/' + (remove.type === 'doc' ? 'documents' : 'conversations') + '/' + remove.id,
          { method: 'DELETE' },
        );
      if (remove.type === 'doc') setDocs((d) => d.filter((x) => x.id !== remove.id));
      else {
        setHistory((h) => h.filter((x) => x.id !== remove.id));
        if (active === remove.id) setActive('');
      }
      toast.success('Item excluído.');
    } catch (e) {
      toast.error((e as Error).message);
    }
    setRemove(null);
  }
  async function upload(f?: File) {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error('O limite é de 10 MB.');
      return;
    }
    setUploading(true);
    try {
      if (live) {
        const form = new FormData();
        form.append('file', f);
        form.append('category', 'Outros');
        await request('/documents', { method: 'POST', body: form });
        await refresh();
        toast.success('Documento enviado e indexado.');
      } else {
        if (!f.name.toLowerCase().endsWith('.txt'))
          throw Error('Nesta demonstração, envie um TXT. PDFs são processados pela API FastAPI.');
        const text = await f.text();
        if (!text.trim()) throw Error('O arquivo não contém texto.');
        const chunks: Doc['chunks'] = [];
        for (let i = 0; i < text.length; i += 800)
          chunks.push({ page: 1, text: text.slice(i, i + 1000) });
        setDocs((d) => [
          ...d,
          {
            id: crypto.randomUUID(),
            title: f.name.replace(/\.txt$/i, ''),
            category: 'Outros',
            pages: 1,
            updated: new Date().toISOString(),
            status: 'ready',
            chunks,
          },
        ]);
        toast.success('Texto adicionado à base deste navegador.');
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (file.current) file.current.value = '';
    }
  }
  function exportConversation() {
    if (!conversation) return;
    const text = conversation.messages
      .map(
        (m) =>
          (m.role === 'user' ? 'Você' : 'CampusMind') +
          ': ' +
          m.content +
          (m.sources.length
            ? '\nFontes: ' + m.sources.map((s) => s.title + ' (p. ' + s.page + ')').join(', ')
            : ''),
      )
      .join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campusmind-conversa.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
  useEffect(() => {
    const context = (
      document as unknown as { modelContext?: { registerTool: (t: unknown, o: unknown) => void } }
    ).modelContext;
    if (!context) return;
    const control = new AbortController();
    try {
      context.registerTool(
        {
          name: 'search_campus_documents',
          title: 'Pesquisar documentos acadêmicos',
          description: 'Busca trechos nos documentos da base atual sem gerar resposta.',
          inputSchema: {
            type: 'object',
            properties: { question: { type: 'string', maxLength: 2000 } },
            required: ['question'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async (data: unknown) => {
            const q = (data as { question?: unknown })?.question;
            if (typeof q !== 'string' || !q.trim() || q.length > 2000)
              throw Error('Pergunta inválida');
            return live
              ? request('/search', { method: 'POST', body: JSON.stringify({ question: q }) })
              : { mode: 'textual-demo', sources: searchDocs(q, docs) };
          },
        },
        { signal: control.signal },
      );
    } catch {}
    return () => control.abort();
  }, [docs, live, api, token]);
  function logout() {
    setToken('');
    setRole('');
    setActive('');
    try {
      const saved = JSON.parse(localStorage.getItem('campusmind-demo-v1') || 'null');
      setDocs(saved?.docs || samples);
      setHistory(saved?.history || []);
    } catch {
      setDocs(samples);
      setHistory([]);
    }
    setSettings(false);
  }
  const visibleDocs = docs.filter(
    (d) =>
      (category === 'Todas' || d.category === category) &&
      (d.title + ' ' + d.category).toLowerCase().includes(filter.toLowerCase()),
  );

  return {
    view,
    setView,
    mode,
    setMode,
    question,
    setQuestion,
    docs,
    setDocs,
    history,
    setHistory,
    active,
    setActive,
    busy,
    setBusy,
    filter,
    setFilter,
    category,
    setCategory,
    selected,
    setSelected,
    remove,
    setRemove,
    settings,
    setSettings,
    api,
    setApi,
    email,
    setEmail,
    password,
    setPassword,
    token,
    setToken,
    role,
    setRole,
    ready,
    uploading,
    setUploading,
    end,
    file,
    input,
    live,
    conversation,
    messages,
    chunkCount,
    lastSources,
    refresh,
    login,
    logout,
    newChat,
    ask,
    feedback,
    deleteItem,
    upload,
    exportConversation,
    visibleDocs,
  };
}
