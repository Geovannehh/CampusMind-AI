import {
  GraduationCap,
  BookOpen,
  Search,
  Sparkles,
  FileText,
  ChevronRight,
  Send,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Layers,
  ExternalLink,
  LoaderCircle,
  CalendarDays,
  BriefcaseBusiness,
  Award,
  Download,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCampusContext } from '@/context/CampusContext';
const suggestions = [
  {
    icon: FileText,
    title: 'Solicitar documentos',
    text: 'Como peço a segunda via de um documento?',
    caption: 'Histórico, declarações e segunda via',
  },
  {
    icon: Award,
    title: 'Horas complementares',
    text: 'Como registro minhas horas complementares?',
    caption: 'Certificados e atividades do curso',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Entender o estágio',
    text: 'O que preciso para iniciar o estágio obrigatório?',
    caption: 'Requisitos e documentação',
  },
  {
    icon: CalendarDays,
    title: 'Consultar o calendário',
    text: 'Quando começa a rematrícula de 2027?',
    caption: 'Datas e prazos acadêmicos',
  },
];
export function ChatPage() {
  const {
    setView,
    mode,
    setMode,
    question,
    setQuestion,
    docs,
    busy,
    setSelected,
    end,
    input,
    live,
    messages,
    chunkCount,
    lastSources,
    ask,
    feedback,
    exportConversation,
  } = useCampusContext();
  return (
    <div className="workspace">
      <section className="chat-column">
        <div className="chat-heading">
          <div>
            <h1>Assistente acadêmico</h1>
            <p>Encontre respostas nos documentos do seu campus.</p>
          </div>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="mode-tabs">
              <TabsTrigger value="chat">
                <Sparkles size={15} /> Conversa
              </TabsTrigger>
              <TabsTrigger value="search">
                <Search size={15} /> Busca
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {messages.length > 0 && (
            <button
              className="icon-button"
              aria-label="Exportar conversa"
              onClick={exportConversation}
            >
              <Download size={18} />
            </button>
          )}
        </div>
        <div className="chat-scroll">
          {!messages.length ? (
            <div className="welcome">
              <div className="welcome-emblem">
                <GraduationCap size={37} />
                <span>
                  <Sparkles size={13} />
                </span>
              </div>
              <div className="eyebrow">UM LUGAR PARA SUAS DÚVIDAS</div>
              <h2>
                Olá, Geovane.
                <br />
                <span>O que vamos descobrir hoje?</span>
              </h2>
              <p>
                De um documento ao próximo passo na sua jornada.
                <br className="desktop-break" /> Pergunte, encontre e confira as fontes.
              </p>
              <div className="suggestions">
                {suggestions.map((s) => (
                  <button key={s.title} onClick={() => ask(s.text)} disabled={busy}>
                    <span className="suggestion-icon">
                      <s.icon size={21} />
                    </span>
                    <strong>{s.title}</strong>
                    <small>{s.caption}</small>
                    <ChevronRight size={16} className="card-chevron" />
                  </button>
                ))}
              </div>
              <div className="welcome-foot">
                <BookOpen size={16} />
                {docs.length} documentos disponíveis para explorar
              </div>
            </div>
          ) : (
            <div className="messages" aria-live="polite">
              {messages.map((m) => (
                <article key={m.id} className={'message ' + m.role}>
                  <div className="message-avatar">
                    {m.role === 'user' ? 'GP' : <GraduationCap size={20} />}
                  </div>
                  <div className="message-body">
                    <div className="message-label">
                      {m.role === 'user' ? 'Você' : 'CampusMind'}
                      {m.role === 'assistant' && (
                        <span>
                          {live ? 'Com base nos documentos' : 'Busca textual · demonstração'}
                        </span>
                      )}
                    </div>
                    <p>{m.content}</p>
                    {m.sources.length > 0 && (
                      <div className="message-sources">
                        <span>FONTES CONSULTADAS</span>
                        {m.sources.map((s, i) => (
                          <button
                            key={s.document_id + '-' + s.page + '-' + i}
                            onClick={() => setSelected(s)}
                          >
                            <FileText size={15} />
                            {s.title}
                            <small>p. {s.page}</small>
                            <ExternalLink size={13} />
                          </button>
                        ))}
                      </div>
                    )}
                    {m.role === 'assistant' && (
                      <div className="feedback">
                        <span>Foi útil?</span>
                        <button
                          aria-label="Resposta útil"
                          className={m.feedback === 1 ? 'chosen' : ''}
                          onClick={() => feedback(m, 1)}
                        >
                          <ThumbsUp size={15} />
                        </button>
                        <button
                          aria-label="Resposta não foi útil"
                          className={m.feedback === -1 ? 'chosen' : ''}
                          onClick={() => feedback(m, -1)}
                        >
                          <ThumbsDown size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {busy && (
                <div className="thinking">
                  <LoaderCircle className="spin" size={17} /> Consultando documentos…
                </div>
              )}
              <div ref={end} />
            </div>
          )}
        </div>
        <div className="composer-wrap">
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
          >
            <textarea
              ref={input}
              aria-label="Sua pergunta acadêmica"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={2000}
              placeholder={
                mode === 'chat'
                  ? 'Qual é a sua dúvida acadêmica?'
                  : 'O que você quer encontrar nos documentos?'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
            />
            <div className="composer-bottom">
              <span>
                <BookOpen size={15} />
                {live ? 'Base institucional' : 'Base de exemplo'}
                <span className="composer-dot">·</span>{' '}
                {mode === 'chat' ? 'Resposta com fontes' : 'Somente trechos'}
              </span>
              <button
                type="submit"
                disabled={!question.trim() || busy}
                aria-label="Enviar pergunta"
              >
                {busy ? <LoaderCircle size={18} className="spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
          <p className="composer-disclaimer">
            {live
              ? 'Confira sempre os documentos e os prazos com sua instituição.'
              : 'Documentos fictícios para demonstração. Não representam regras da UniCesumar.'}
          </p>
        </div>
      </section>
      <aside className="context-panel">
        <div className="context-title">
          <Layers size={18} />
          <h3>Sua base de conhecimento</h3>
        </div>
        <p>
          Informação organizada.
          <br />
          Respostas que você pode conferir.
        </p>
        <div className="base-summary">
          <span>
            <strong>{docs.length.toString().padStart(2, '0')}</strong>documentos
          </span>
          <span>
            <strong>{chunkCount.toString().padStart(2, '0')}</strong>trechos
          </span>
        </div>
        <div className="section-label">
          {lastSources.length ? 'NESTA CONVERSA' : 'DOCUMENTOS EM DESTAQUE'}
        </div>
        <div className="featured-docs">
          {(lastSources.length
            ? lastSources
            : docs.slice(0, 3).map((d) => ({
                document_id: d.id,
                title: d.title,
                page: 1,
                text: d.chunks[0]?.text || '',
              }))
          ).map((s, i) => (
            <button key={s.document_id + i} onClick={() => setSelected(s)}>
              <span className="doc-icon">
                <FileText size={20} />
              </span>
              <div>
                <strong>{s.title}</strong>
                <small>{lastSources.length ? 'Página ' + s.page : 'Documento de exemplo'}</small>
              </div>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
        <button className="text-link" onClick={() => setView('documents')}>
          Ver todos os documentos <ChevronRight size={15} />
        </button>
        <div className="source-tip">
          <ShieldCheck size={24} />
          <h4>A fonte faz a diferença.</h4>
          <p>Cada resposta encontrada acompanha o trecho e a página de origem.</p>
        </div>
        <div className="context-footer">
          <span>CampusMind AI</span>
          <small>Conhecimento que acompanha você.</small>
        </div>
      </aside>
    </div>
  );
}
