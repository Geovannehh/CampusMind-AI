# CampusMind AI

Assistente universitário com documentos, busca e respostas com fontes. Projeto organizado por tecnologia, pronto para editar no VS Code e preparar para o GitHub.

## Stack e responsabilidades

| Camada | Tecnologia | Diretório |
| --- | --- | --- |
| Interface | React, TypeScript, Vite, Tailwind CSS | `frontend/` |
| Componentes acessíveis | Radix UI, Lucide, Sonner | `frontend/src/components/` |
| API REST | Python, FastAPI | `backend/app/api/` |
| Dados e ORM | PostgreSQL, SQLAlchemy, pgvector | `backend/app/models.py` |
| Inteligência artificial | Embeddings, busca vetorial, LLM | `backend/app/rag/` |
| Segurança | JWT, hash de senha PBKDF2, papéis | `backend/app/core/security.py` |
| Execução | Docker Compose, Nginx, Uvicorn | `docker-compose.yml`, Dockerfiles |

## Estrutura do código

```text
campusmind-rag/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # Métricas e aviso do modo de execução
│   │   │   ├── auth/           # Conexão e login na API
│   │   │   ├── common/         # Cabeçalho de páginas e confirmação
│   │   │   ├── documents/      # Biblioteca e consulta de fontes
│   │   │   ├── history/        # Listagem de conversas
│   │   │   ├── layout/         # Sidebar e cabeçalho global
│   │   │   └── ui/             # Primitivos acessíveis reutilizáveis
│   │   ├── context/            # Estado compartilhado do aplicativo
│   │   ├── data/               # Documentos fictícios de demonstração
│   │   ├── hooks/              # Regras de interação e fluxo de dados
│   │   ├── pages/              # Chat, documentos, histórico e administração
│   │   ├── services/           # Cliente HTTP tipado da API
│   │   ├── styles/             # CSS e tema
│   │   ├── types/              # Contratos TypeScript
│   │   ├── utils/              # Busca textual e utilitários
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/favicon.svg
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/                # Auth, chat, documentos, conversas, admin e saúde
│   │   ├── core/               # Banco e segurança
│   │   ├── rag/                # Extração, chunks, embeddings, busca e geração
│   │   ├── services/           # Serialização e acesso a registros
│   │   ├── models.py           # Modelos SQLAlchemy
│   │   ├── schemas.py          # Validação Pydantic
│   │   └── main.py             # Inicialização e registro das rotas
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── documents/samples/
├── .env.example
├── .editorconfig
├── .gitignore
├── .prettierrc.json
├── docker-compose.yml
└── README.md
```

Esta versão de código é independente da hospedagem do Site anterior. Não exige Vinext, credenciais do Site ou arquivos de execução do ChatGPT. O frontend é uma SPA em Vite; a API mantém o contrato dos endpoints existentes.

## Experimentar a interface sem backend

Instale Node.js 22.13 ou superior e pnpm 11.25.0. Com Corepack disponível:

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Abra http://localhost:3000.

A interface inicia em **modo de demonstração**, com documentos fictícios, busca **textual** e conversas salvas neste navegador. É possível perguntar, consultar fontes, avaliar respostas, exportar conversas e enviar arquivos TXT pela administração. Não utiliza embeddings ou LLM nesse modo.

Os exemplos não representam regras da UniCesumar nem de qualquer instituição.

## Executar o sistema com Docker

Na raiz do projeto:

1. Copie `.env.example` para `.env`:

```bash
# Linux/macOS
cp .env.example .env
# Windows PowerShell
# Copy-Item .env.example .env
```

2. Altere a senha do banco, as senhas de administrador/aluno e `JWT_SECRET`. As senhas de usuários devem ter pelo menos 12 caracteres. O segredo JWT deve ter pelo menos 32 caracteres aleatórios; você pode gerar com:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

3. Informe `OPENAI_API_KEY` no `.env` para ativar embeddings e geração. A chave fica exclusivamente no backend. Esses serviços podem gerar cobranças na conta de API.
4. Suba os três serviços:

```bash
docker compose up --build -d
```

| Serviço | Endereço |
| --- | --- |
| Interface | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| Saúde | http://localhost:8000/health |

5. Abra **Configurar API** na interface, informe `http://localhost:8000` e use o e-mail/senha de administrador configurados no `.env`.
6. Envie o TXT de `documents/samples/` ou um PDF com texto selecionável.
7. Pergunte “Como solicitar a segunda via de documento?” e confira o trecho usado como fonte.

Você pode executar o banco e a API sem chave para verificar login e endpoints de leitura. Indexação e busca semântica exigem a configuração do provedor; a ausência da chave retorna um erro claro, sem simular resultados.

As contas iniciais são criadas apenas se ainda não existirem. Alterar uma senha no `.env` não muda a senha de uma conta já criada. Não há tela de cadastro ou recuperação de senha nesta versão.

## API sem Docker

Requer Python 3.12 e um PostgreSQL com pgvector. Configure `DATABASE_URL` no `.env` para o banco acessível fora do Docker.

```bash
python -m venv backend/.venv
# Linux/macOS
source backend/.venv/bin/activate
# Windows PowerShell
# backend\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --env-file .env --reload --port 8000
```

Para publicação, configure a URL pública da API em `VITE_API_URL` antes do build e sua origem em `CORS_ORIGINS`. Uma interface HTTPS precisa de API HTTPS. O formulário de conexão permite trocar a URL sem inserir chaves do provedor no navegador.

## Fluxo RAG

1. O administrador envia PDF/TXT.
2. A API extrai texto por página e cria trechos sobrepostos.
3. O modelo gera embeddings de 1.536 dimensões.
4. Os trechos e os vetores são armazenados no PostgreSQL/pgvector.
5. A pergunta passa pelo mesmo modelo; são recuperados até cinco trechos por distância de cosseno.
6. No modo **Busca**, os trechos são retornados diretamente. No modo **Conversa**, o LLM usa esses trechos para formular a resposta.
7. IDs inválidos de fonte ou ausência de evidências causam recusa. As fontes utilizadas são armazenadas na mensagem.

Modelos padrão: `text-embedding-3-small` e `gpt-4o-mini`. O limite `MAX_COSINE_DISTANCE` deve ser calibrado com os documentos reais. Similaridade não significa probabilidade de resposta correta. Ao trocar o modelo de embeddings, reindexe a base inteira.

O prompt orienta o modelo a usar apenas o contexto e ignorar instruções dentro dos documentos. Isso reduz respostas sem fundamento, mas ainda exige conferir as fontes. Documentos e trechos são enviados ao provedor configurado: use conteúdo adequado a essa configuração.

## Endpoints

| Método | Endpoint | Acesso |
| --- | --- | --- |
| POST | `/auth/login` | Público |
| GET | `/health` | Público |
| POST | `/chat`, `/search` | Autenticado |
| GET | `/documents`, `/documents/{id}`, `/documents/{id}/file` | Autenticado |
| POST | `/documents`, `/documents/{id}/index` | Administrador |
| DELETE | `/documents/{id}` | Administrador |
| GET | `/conversations`, `/conversations/{id}` | Dono da conversa |
| DELETE | `/conversations/{id}` | Dono da conversa |
| POST | `/messages/{id}/feedback` | Dono da conversa |
| GET | `/admin/stats` | Administrador |

JWT expira em duas horas e fica em memória no frontend. Recarregar a página exige novo login. O banco impede acesso às conversas de outros usuários. Fontes citadas são preservadas nas mensagens, mesmo se o documento for removido posteriormente.

## Padrões utilizados

- Separação de apresentação, estado, transporte HTTP e contratos no frontend.
- Páginas e componentes organizados por responsabilidade.
- Hooks e contexto para compartilhar regras de interação.
- Tipagem estrita e detecção de declarações não utilizadas em TypeScript.
- Rotas FastAPI por domínio, validação Pydantic, camada de serviços e modelos SQLAlchemy.
- Pipeline RAG em módulos separados.
- Segredos via ambiente, permissões no backend e `.gitignore` para dados locais.
- Formatação com Prettier no frontend, Ruff no Python e EditorConfig.
- Dependências do frontend fixadas com arquivo de lock.
- Frontend compilado servido pelo Nginx; API executada por Uvicorn.

## Verificações

```bash
# Frontend
cd frontend
pnpm build
pnpm format

# Backend, a partir da raiz, após instalar as dependências Python
PYTHONPATH=backend python -m unittest discover -s backend/tests -v
# Windows PowerShell:
# $env:PYTHONPATH='backend'
# python -m unittest discover -s backend/tests -v
```

Os sete testes cobrem chunks/páginas, extração real de PDF, recusa de PDFs sem texto, validação de fontes, filtro de similaridade, login, permissões de documentos, duplicatas e isolamento de conversas/feedback. Foram executados novamente após reorganizar os módulos. O frontend passou pela verificação TypeScript e pelo build Vite.

Os testes usam SQLite e um provedor simulado; não validam a consulta vetorial em PostgreSQL real nem chamadas pagas à IA. Docker/PostgreSQL não estavam disponíveis no ambiente de criação, portanto o Compose e essa integração precisam de validação no seu ambiente. Não houve verificação visual em navegador desta exportação.

## Limites da versão inicial

- PDFs de até 10 MB e 300 páginas; no máximo 2.000 trechos.
- Indexação síncrona; sem OCR, fila ou progresso por etapas.
- Sem cadastro, reset de senha, rate limiting, refresh token ou múltiplas instituições.
- Métricas da interface usam os dados do usuário conectado; `/admin/stats` oferece contagens globais ao administrador.
- Criação de tabelas por `create_all`; adicione migrações antes de evoluir um banco em produção.
- Próximas etapas: testes de integração com PostgreSQL, avaliação com perguntas reais, reranking, worker e melhorias de operação.

## GitHub

O pacote não inclui Git nem credenciais e não foi enviado automaticamente à sua conta. Após revisar o código, você pode criar o repositório `campusmind-rag` e publicar esta pasta. O `.env` deve permanecer fora do Git.
