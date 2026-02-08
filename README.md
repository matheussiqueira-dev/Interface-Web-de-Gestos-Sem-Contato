# Interface Web de Gestos Sem Contato

Aplicacao fullstack para interacao touchless com webcam, reconhecendo mao/gestos em tempo real para controlar um workspace visual com notas, desenho em canvas e feedback de particulas.

## Visao geral do produto

O sistema transforma uma webcam comum em um dispositivo de entrada gestual para cenarios como:

- quadros colaborativos sem contato fisico;
- demonstracoes interativas;
- experiencias hands-free em ambientes educacionais, eventos e kiosks.

## Objetivos de negocio

- reduzir friccao de uso em interfaces sem teclado/mouse;
- entregar experiencia visual premium com feedback imediato;
- permitir evolucao para produto escalavel com API versionada e persistencia confiavel.

## Principais melhorias implementadas

- Refatoracao para arquitetura em camadas no frontend (`domain`, `features`, `services`, `shared`, `components`, `hooks`, `utils`).
- Inclusao de backend Express com API versionada em `/api/v1`.
- Persistencia hibrida: API primaria + fallback para `localStorage`.
- Rework completo de UX/UI com novo design system, hierarquia visual, painel de operacao e metricas.
- Calibracao em tempo real de sensibilidade de pinça e responsividade de cursor.
- Features de produto: adicionar/remover/editar notas, reset de workspace, metricas de sessao e telemetria de eventos.
- Hardening de seguranca no backend com `helmet`, `cors`, `express-rate-limit`, validacao `zod` e tratamento global de erros.
- Testes unitarios (utils e reducer de estado).

## Arquitetura e decisoes tecnicas

### Frontend (Vite + React + TypeScript)

- `src/domain`: contratos de negocio (`WorkspaceSnapshot`, `WorkspaceSettings`, `WorkspaceNote`).
- `src/features/workspace`: `workspaceReducer` centraliza estado de aplicacao.
- `src/features/metrics`: hook de metricas de sessao em tempo real.
- `src/services`: persistencia e telemetria desacopladas da UI.
- `src/components`: composicao visual (video, board, canvas, particulas, UI atomica).
- `src/hooks`: rastreamento de mao e interpretacao de gesto.

### Backend (Node + Express)

- `server/src/index.js`: bootstrap e encerramento gracioso.
- `server/src/app.js`: middlewares, rotas, seguranca e error handler.
- `server/src/storage.js`: persistencia em arquivo JSON com fila de escrita.
- `server/src/validators.js`: contratos de entrada com `zod`.
- `server/data/workspace.json`: estado persistido inicial.

### Principios aplicados

- Separacao de responsabilidades por dominio/camada.
- Estado previsivel via reducer.
- DRY em contratos de dados reutilizados.
- Defensive coding: validacao de payload + fallback local.
- Evolucao orientada a produto: observabilidade minima, API versionada, estados de persistencia na UI.

## Stack e tecnologias

- Frontend: React 18, TypeScript, Vite, Framer Motion, Lucide, MediaPipe Tasks Vision
- Backend: Node.js, Express, Zod, Helmet, CORS, Rate Limit, Morgan
- Qualidade: ESLint, Vitest, jsdom

## Estrutura do projeto

```text
.
├── server/
│   ├── data/
│   │   └── workspace.json
│   └── src/
│       ├── app.js
│       ├── config.js
│       ├── defaults.js
│       ├── logger.js
│       ├── storage.js
│       ├── validators.js
│       └── index.js
├── src/
│   ├── components/
│   ├── domain/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── shared/
│   ├── utils/
│   ├── App.tsx
│   └── index.css
├── package.json
└── README.md
```

## Fluxos de usuario

- Navegacao por gesto: cursor acompanha o indicador.
- Pinça: interacao principal para desenhar e arrastar notas.
- Punho fechado: pausa operacional do tracking.
- Painel de controle: calibracao, acao de limpeza, reset e criacao de nota.
- Persistencia: sincroniza com API quando disponivel e usa armazenamento local como contingencia.

## API e contratos

### Endpoints

- `GET /api/health` status e uptime do servico.
- `GET /api/v1/workspace` retorna snapshot completo.
- `PUT /api/v1/workspace` atualiza snapshot completo validado.
- `PATCH /api/v1/settings` patch de configuracoes.
- `POST /api/v1/events` ingestao de eventos de telemetria.
- `POST /api/v1/workspace/reset` reseta para estado padrao.

### Integridade e confiabilidade

- payloads validados em borda de entrada (`zod`);
- limitacao de taxa para protecao de abuso;
- CORS controlado por origem;
- persistencia serializada para evitar corrida de escrita.

## Seguranca

- `helmet` para cabecalhos de seguranca;
- `cors` com whitelist configuravel;
- `express-rate-limit` global;
- validacao forte de entrada e erro padronizado;
- sanitizacao de payload de eventos para logs.

## UX/UI e acessibilidade

- Novo design system com tokens de cor/typography e composicao glass;
- layout responsivo para desktop e mobile;
- estados visuais claros de camera/modelo/mao/persistencia;
- componentes acionaveis com `aria-label`;
- reducao automatica de animacoes para `prefers-reduced-motion`.

## Performance

- Loop de particulas otimizado com refs (sem recriar render loop a cada frame).
- Suavizacao adaptativa do cursor com histerese de pinça.
- Persistencia com debounce para evitar escrita excessiva.
- Build de producao validado (`vite build`).

## Qualidade e testes

### Scripts

```bash
npm run dev
npm run dev:server
npm run dev:full
npm run lint
npm run test
npm run build
```

### Cobertura atual

- utilitarios de geometria;
- heuristicas de gestos;
- reducer de workspace.

## Instalacao e execucao

1. Clone o repositorio:

```bash
git clone https://github.com/matheussiqueira-dev/Interface-Web-de-Gestos-Sem-Contato.git
cd Interface-Web-de-Gestos-Sem-Contato
```

2. Instale dependencias:

```bash
npm install
```

3. Execute frontend + backend:

```bash
npm run dev:full
```

4. Acesse:

- Frontend: `http://localhost:5173`
- API: `http://localhost:8787`

## Variaveis de ambiente

Use `.env.example` como base:

- `PORT`: porta da API;
- `CLIENT_ORIGIN`: origem autorizada para CORS;
- `API_TOKEN`: token opcional para proteger endpoints de escrita da API;
- `DATA_FILE_PATH`: caminho do arquivo de persistencia;
- `VITE_API_BASE_URL`: base URL da API no frontend (opcional com proxy local);
- `VITE_API_TOKEN`: token opcional enviado no header `x-api-token`;
- `VITE_DEV_API_TARGET`: target do proxy Vite em desenvolvimento.

## Deploy

### Frontend

- build estatico em `dist/` (`npm run build`);
- pode ser servido por CDN, Nginx, Vercel, Netlify etc.

### Backend

- processo Node com `npm run server`;
- recomendado usar PM2/systemd/container;
- configurar `PORT`, `CLIENT_ORIGIN` e volume persistente para `server/data`.

## Boas praticas adotadas

- contratos de dados claros e tipados;
- fallback resiliente para indisponibilidade da API;
- tratamento de erro explicito na experiencia;
- separacao clara entre regras de negocio e camada de apresentacao;
- testes unitarios para pontos criticos de comportamento.

## Melhorias futuras recomendadas

- autenticacao/autorizacao para perfis multiusuario;
- persistencia em banco (PostgreSQL) com auditoria;
- testes de integracao da API e e2e do fluxo gestual;
- suporte multi-mao/multi-gesto e calibracao guiada;
- painel de analytics com series temporais e exportacao.

Autoria: Matheus Siqueira  
Website: https://www.matheussiqueira.dev/
